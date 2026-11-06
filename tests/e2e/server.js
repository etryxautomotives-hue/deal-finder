// Test server for the browser tests: serves site/ and answers the site's database calls against a REAL local
// Postgres with all migrations, as the signed-in test user (role "authenticated", RLS on), the way Supabase's
// API would. Only what the site uses is supported. Not for production: there is no auth here, the browser says who it is.
//   PGHOST=/tmp/pgdk PGPORT=5433 node tests/e2e/server.js 8765
const http = require("http"), fs = require("fs"), path = require("path"), { execFile } = require("child_process");
const ROOT = path.join(__dirname, "../../site"), PORT = +process.argv[2] || 8765;
const lit = v => v == null ? "null" : "'" + String(typeof v === "object" ? JSON.stringify(v) : v).replace(/'/g, "''") + "'";
const ident = s => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error("bad name " + s); return s; };
function psql(stmts) {
  return new Promise(ok => execFile("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-U", "postgres", ...stmts.flatMap(s => ["-c", s])],
    { maxBuffer: 1e7 }, (err, out, errOut) => ok(err ? { error: { message: (errOut || String(err)).replace(/^.*ERROR:\s*/s, "").split("\n")[0] } } : { out: out.trim() })));
}
const asUser = uid => ["set role authenticated", `set request.uid = ${lit(uid || "")}`];
function where(t, f) {
  return f.length ? " where " + f.map(([op, c, v]) => {
    c = ident(c);
    if (op === "eq") return `${t}.${c} = ${lit(v)}`;
    if (op === "gt") return `${t}.${c} > ${lit(v)}`;
    if (op === "is") return `${t}.${c} is null`;
    if (op === "notnull") return `${t}.${c} is not null`;
    throw new Error("op " + op);
  }).join(" and ") : "";
}
function cols(t, sel) {
  return (sel || "*").split(/,(?![^(]*\))/).map(s => s.trim()).map(s => {
    const m = s.match(/^(\w+)\(([^)]*)\)$/);
    if (!m) return s === "*" ? `${t}.*` : `${t}.${ident(s)}`;
    const keys = m[2].split(",").map(x => ident(x.trim()));   // only households(...) via household_id is used
    return `(select json_build_object(${keys.map(k => `'${k}', h.${k}`).join(", ")}) from public.households h where h.id = ${t}.household_id) as ${ident(m[1])}`;
  }).join(", ");
}
async function db(q) {
  const t = ident(q.table || "x"), pre = asUser(q.uid);
  try {
    if (q.rpc) {
      const args = Object.entries(q.args || {}).map(([k, v]) => `${ident(k)} => ${lit(v)}`).join(", ");
      const r = await psql([...pre, `select coalesce(to_jsonb(x.v)::text, 'null') from (select public.${ident(q.rpc)}(${args})::text as v) x`]);
      if (r.error) return r;
      let v = JSON.parse(r.out || "null"); try { if (typeof v === "string" && /^[\[{]/.test(v)) v = JSON.parse(v); } catch { /* text */ }
      return { data: v === "" ? null : v };
    }
    let sql;
    if (q.op === "select") sql = `select ${cols(t, q.sel)} from public.${t}${where(t, q.f)}${q.order ? ` order by ${t}.${ident(q.order[0])}${q.order[1] ? "" : " desc"}` : ""}`;
    if (q.op === "insert" || q.op === "upsert") {
      const rows = Array.isArray(q.vals) ? q.vals : [q.vals], c = Object.keys(rows[0]).map(ident);
      sql = `insert into public.${t} (${c}) select ${c} from json_populate_recordset(null::public.${t}, ${lit(rows)}::json)` +
        (q.op === "upsert" ? ` on conflict do nothing` : "") + ` returning *`;
    }
    if (q.op === "update") { const c = Object.keys(q.vals).map(ident); sql = `update public.${t} set (${c}) = (select ${c} from json_populate_record(null::public.${t}, ${lit(q.vals)}::json))${where(t, q.f)} returning *`; }
    if (q.op === "delete") sql = `delete from public.${t}${where(t, q.f)} returning *`;
    const r = await psql([...pre, sql.startsWith("select") ? `select coalesce(jsonb_agg(x), '[]') from (${sql}) x` : `with x as (${sql}) select coalesce(jsonb_agg(x), '[]') from x`]);
    if (r.error) return r;
    const rows = JSON.parse(r.out || "[]");
    return { data: q.single ? rows[0] || null : rows };
  } catch (e) { return { error: { message: e.message } }; }
}
// "Stripe" for the tests: what create-checkout and the webhook would do, with the webhook's database function
let ev = 0;
async function checkout(q) {
  const r = await psql([...asUser(q.uid), `select public.checkout_check(${lit(q.plan)})`]);
  if (r.error) return { status: 500, body: { error: r.error.message } };
  const check = r.out, sub = check.startsWith("switch:") ? check.slice(7) : check === "new" ? "sub_" + q.plan + "_" + Date.now() : null;
  if (!sub) return { status: 409, body: { error: check } };
  const p = { event_id: "evt_" + ++ev + "_" + Date.now(), type: check === "new" ? "checkout.session.completed" : "customer.subscription.updated", subscription: sub,
    customer: "cus_" + q.uid, payer: q.uid, plan: q.plan, status: "active", period_start: Math.floor(Date.now() / 1000),
    period_end: Math.floor(Date.now() / 1000) + 30 * 86400, cancel_at_period_end: false, invoice: "paid", state_at: Math.floor(Date.now() / 1000) };
  const w = await psql(["set role service_role", `select public.stripe_apply(${lit(p)}::jsonb)`]);
  if (w.error) return { status: 500, body: { error: w.error.message } };
  return { status: 200, body: check === "new" ? { url: "./?paid=1#account" } : { switched: q.plan } };
}
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };
http.createServer(async (req, res) => {
  // what consent.js and app.js call directly on Supabase's REST API, as a visitor (role anon)
  if (req.url === "/rest/v1/rpc/track" && req.method === "POST") {
    let b = ""; for await (const c of req) b += c;
    const r = await psql(["set role anon", `select public.track(${lit(JSON.parse(b).batch)}::jsonb)`]);
    res.writeHead(r.error ? 400 : 200, { "Content-Type": "application/json" }); res.end(r.error ? JSON.stringify(r.error) : r.out); return;
  }
  if (req.url.startsWith("/rest/v1/site_settings")) {
    const r = await psql(["set role anon", "select coalesce(jsonb_agg(jsonb_build_object('key', key, 'value', value)), '[]') from public.site_settings"]);
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(r.out || "[]"); return;
  }
  if (req.method === "POST") {
    let b = ""; for await (const c of req) b += c;
    const q = JSON.parse(b || "{}");
    const r = req.url === "/__db" ? { status: 200, body: await db(q) } : req.url === "/__checkout" ? await checkout(q) : req.url === "/__sql" ? { status: 200, body: await psql([q.sql]) } : { status: 404, body: {} };
    res.writeHead(r.status, { "Content-Type": "application/json" }); res.end(JSON.stringify(r.body)); return;
  }
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname), rel = u.endsWith("/") ? u + "index.html" : u;
  // this week's deals aren't in git: DATA_ROOT can point at a folder with a copy of the live site's data/
  let f = path.join(ROOT, rel);
  if (!fs.existsSync(f) && process.env.DATA_ROOT) f = path.join(process.env.DATA_ROOT, rel);
  if (f.includes("..") || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("test server on " + PORT));
