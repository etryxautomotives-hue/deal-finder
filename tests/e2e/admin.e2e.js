// Browser test of the cookie banner, the anonymous statistics and the admin back end, against the real local database.
//   PGHOST=/tmp/pgdk PGPORT=5433 DATA_ROOT=. node tests/e2e/server.js 8765 &  then  PDF_LIBS=<folder with jspdf + jspdf-autotable> node tests/e2e/admin.e2e.js
// PDF_LIBS: a node_modules folder with jspdf@2.5.1 and jspdf-autotable@3.8.2 (the page loads them from cdnjs; here they are served locally).
const { chromium, devices } = require("playwright");
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const BASE = "http://localhost:8765/", SHOTS = process.env.SHOTS || "", LIBS = process.env.PDF_LIBS || "";
const fake = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
const config = `window.DK_CONFIG = { supabaseUrl: "${BASE}", supabaseAnonKey: "test", payments: false, vapidPublicKey: "", emailAlerts: false };`;
const U = { miro: "00000000-0000-0000-0000-0000000000b1", cowork: "00000000-0000-0000-0000-0000000000b2", plain: "00000000-0000-0000-0000-0000000000b3" };
const psql = (...a) => execFileSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-U", "postgres", ...a], { encoding: "utf8" }).trim();
const root = path.join(__dirname, "../..");
psql("-f", path.join(root, "tests/db/stub.sql"));
for (const m of fs.readdirSync(path.join(root, "supabase/migrations")).sort()) psql("-c", "set client_min_messages = warning", "-f", path.join(root, "supabase/migrations", m));
psql("-c", `insert into auth.users (id, email) values ${Object.entries(U).map(([n, id]) => `('${id}', '${n}@x.be')`).join(", ")}`);
psql("-c", `insert into public.admins (user_id, email, role) values ('${U.miro}', 'miro@x.be', 'owner')`);
const sql = q => psql("-c", q);

let fails = 0;
const check = (ok, name, extra = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  (" + extra + ")" : ""}`); if (!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const shot = (p, name) => SHOTS ? p.screenshot({ path: path.join(SHOTS, name), fullPage: false }) : null;
async function ctx(b, who, dev) {
  const c = await b.newContext({ ...(dev ? devices[dev] : { viewport: { width: 1360, height: 900 } }), acceptDownloads: true });
  await c.route("**/supabase.js", r => r.fulfill({ body: fake, contentType: "text/javascript" }));
  await c.route("**/config.js", r => r.fulfill({ body: config, contentType: "text/javascript" }));
  if (LIBS) {
    await c.route("**/jspdf.umd.min.js", r => r.fulfill({ path: path.join(LIBS, "jspdf/dist/jspdf.umd.min.js"), contentType: "text/javascript" }));
    await c.route("**/jspdf.plugin.autotable.min.js", r => r.fulfill({ path: path.join(LIBS, "jspdf-autotable/dist/jspdf.plugin.autotable.min.js"), contentType: "text/javascript" }));
  }
  await c.addInitScript(([id, email]) => {
    if (!sessionStorage.getItem("t.init")) { sessionStorage.setItem("t.init", "1"); localStorage.setItem("dk.pc", '"9000"'); localStorage.setItem("dk.lang", '"nl"');
      if (id) localStorage.setItem("test.user", JSON.stringify({ id, email })); }
    window.confirm = () => true;
  }, [U[who], who + "@x.be"]);
  const p = await c.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  return p;
}
const flush = p => p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); dispatchEvent(new Event("pagehide")); });

(async () => {
  const b = await chromium.launch();

  // 1. a visitor on a phone: the banner, "No" as easy as "Yes"
  const v = await ctx(b, null, "iPhone 13");
  await v.goto(BASE, { waitUntil: "networkidle" });
  await v.waitForSelector(".ck:not([hidden])");
  const sizes = await v.$$eval(".ck-b", bs => bs.map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(x).backgroundColor]; }));
  check(sizes.length === 2 && sizes[0].join() === sizes[1].join(), "1 Weigeren and Akkoord look exactly the same", JSON.stringify(sizes));
  await shot(v, "banner-phone.png");
  await v.click('.ck-b[data-ck="1"]');
  check(await v.$eval(".ck", e => e.hidden), "1 the banner goes away after a choice");
  await v.click("#results .card"); await wait(300);
  await v.click("#sheet [data-add]"); await wait(200);
  await v.keyboard.press("Escape");
  await v.fill("#q", "qwxzy"); await v.press("#q", "Enter"); await wait(300);
  await flush(v); await wait(800);
  const n = +sql("select count(*) from public.events");
  check(n >= 3, "1 after Akkoord, clicks are counted", n + " events");
  check(sql("select count(*) from public.events where kind = 'search' and n = 0 and label = 'qwxzy'") === "1", "1 a search without results is noted");
  check(sql("select string_agg(distinct area, ',') from public.events") === "90", "1 only the first two postcode digits are kept");

  // 2. a visitor who says no is never counted
  const r = await ctx(b, null);
  await r.goto(BASE, { waitUntil: "networkidle" }); await r.waitForSelector(".ck:not([hidden])");
  await r.click('.ck-b[data-ck="0"]');
  await r.click("#results .card"); await wait(200); await flush(r); await wait(800);
  check(+sql("select count(*) from public.events") === n, "2 after Weigeren, nothing is sent");
  check(await r.$(".ck-links .ck-link") !== null, "2 the footer has a link to change the choice");
  // sign-up: the news box is there and unticked
  await r.reload({ waitUntil: "networkidle" });
  await r.evaluate(() => document.querySelector("#accBtn").click()); await r.waitForSelector("#accMkt");
  check(!(await r.$eval("#accMkt", e => e.checked)), "2 the 'send me news' box at sign-up starts unticked");

  // 3. an account without access sees nothing
  const plain = await ctx(b, "plain");
  await plain.goto(BASE + "admin.html", { waitUntil: "networkidle" }); await wait(500);
  check((await plain.textContent("#main")).includes("No access"), "3 an account without access gets 'No access'");
  check(await plain.$eval("#tabs", e => e.hidden), "3 and no menu");

  // 4. Miro, owner
  const m = await ctx(b, "miro");
  await m.goto(BASE + "admin.html", { waitUntil: "networkidle" }); await m.waitForSelector(".adm-kpi");
  check((await m.$$("#tabs a")).length === 8, "4 the owner sees all 8 sections");
  check((await m.textContent("#main")).includes("Shop health"), "4 overview shows shop health");
  check((await m.textContent("#main")).includes("Growth per month"), "4 overview shows growth");
  await shot(m, "admin-overview.png");
  if (LIBS) {
    const [dl] = await Promise.all([m.waitForEvent("download", { timeout: 15000 }), m.click("#pdfBiz")]);
    const f = await dl.path(); const head = fs.readFileSync(f).subarray(0, 5).toString();
    check(head === "%PDF-" && /business-report/.test(dl.suggestedFilename()), "4 business report PDF downloads", dl.suggestedFilename());
    if (SHOTS) fs.copyFileSync(f, path.join(SHOTS, dl.suggestedFilename()));
  }
  await m.goto(BASE + "admin.html#report"); await m.waitForSelector("[data-pdf-store]");
  check((await m.textContent("#main")).includes("Sent to the shop"), "4 live report per shop");
  check((await m.textContent("#feed")).includes("Someone on a phone"), "4 live feed, anonymous");
  await shot(m, "admin-report.png");
  if (LIBS) {
    const [dl] = await Promise.all([m.waitForEvent("download", { timeout: 15000 }), m.click("[data-pdf-store]")]);
    check(fs.readFileSync(await dl.path()).subarray(0, 5).toString() === "%PDF-", "4 a shop's PDF downloads", dl.suggestedFilename());
    if (SHOTS) fs.copyFileSync(await dl.path(), path.join(SHOTS, dl.suggestedFilename()));
  }
  // site control: a message bar and a hidden shop
  await m.goto(BASE + "admin.html#site"); await m.waitForSelector("#anSave");
  await m.check("#anOn"); await m.fill("#annl", "Nieuw: Lidl Nederland"); await m.click("#anSave"); await wait(500);
  const firstStore = await m.$eval("[data-hs]", e => e.dataset.hs);
  await m.click("[data-hs]"); await wait(500);
  const site = await ctx(b, null);
  await site.goto(BASE, { waitUntil: "networkidle" }); await wait(300);
  check(((await site.textContent("#announce").catch(() => "")) || "").includes("Lidl Nederland"), "4 the message bar shows on the site");
  check(!(await site.$$eval("#results .card", (cs, s) => cs.some(c => c.textContent.includes(s)), firstStore)), "4 a hidden shop's deals are gone", firstStore);
  // team: an invitation link for a coworker
  await m.goto(BASE + "admin.html#team"); await m.waitForSelector("#lmake");
  await m.fill("#ln", "sales"); await m.click("#lmake"); await m.waitForSelector("#lval");
  const link = await m.$eval("#lval", e => e.value);
  await shot(m, "admin-team.png");
  const c = await ctx(b, "cowork");
  await c.goto(link, { waitUntil: "networkidle" }); await c.waitForSelector("#tabs a");
  check((await c.textContent("#who")).includes("admin"), "4 the coworker is in through the link");
  await c.goto(BASE + "admin.html#users"); await c.waitForSelector(".adm-t");
  check((await c.textContent("#main")).includes("miro@x.be"), "4 and sees the user list");
  check(!(await c.$('#tabs a[data-tab="team"]')), "4 but not the team page");
  await m.goto(BASE + "admin.html#log"); await m.waitForSelector(".adm-t");
  check((await m.textContent("#main")).includes("joined by link"), "4 the log shows the coworker joined");

  for (const p of [v, r, plain, m, site, c]) if (p.errs.length) check(false, "no page errors", p.errs.join(" | "));
  await b.close();
  console.log(fails ? `${fails} FAILED` : "all passed");
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
