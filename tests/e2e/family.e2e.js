// Browser test of Single & Family Premium on a phone, against the real local database (see server.js).
//   tests/db/run.sh first is not needed: this resets the database itself.
//   PGHOST=/tmp/pgdk PGPORT=5433 DATA_ROOT=<folder with data/> node tests/e2e/server.js 8765 &  then  node tests/e2e/family.e2e.js
const { chromium, devices } = require("playwright");
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const BASE = "http://localhost:8765/", SHOTS = process.env.SHOTS || "";
const fake = fs.readFileSync(path.join(__dirname, "fake-supabase.js"), "utf8");
const config = `window.DK_CONFIG = { supabaseUrl: "${BASE}", supabaseAnonKey: "test", payments: true, vapidPublicKey: "", emailAlerts: false };`;
const U = { miro: "00000000-0000-0000-0000-0000000000a1", lotte: "00000000-0000-0000-0000-0000000000a2", jonas: "00000000-0000-0000-0000-0000000000a3" };
const psql = (...a) => execFileSync("psql", ["-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-U", "postgres", ...a], { encoding: "utf8" }).trim();
const root = path.join(__dirname, "../..");
psql("-f", path.join(root, "tests/db/stub.sql"));
for (const m of fs.readdirSync(path.join(root, "supabase/migrations")).sort()) psql("-c", "set client_min_messages = warning", "-f", path.join(root, "supabase/migrations", m));
psql("-c", `insert into auth.users values ${Object.entries(U).map(([n, id]) => `('${id}', '${n}@x.be')`).join(", ")}`);
const sql = q => psql("-c", q);

let fails = 0;
const check = (ok, name, extra = "") => { console.log(`${ok ? "ok  " : "FAIL"} ${name}${extra ? "  (" + extra + ")" : ""}`); if (!ok) fails++; };
async function phone(b, who) {
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  await ctx.route("**/supabase.js", r => r.fulfill({ body: fake, contentType: "text/javascript" }));
  await ctx.route("**/config.js", r => r.fulfill({ body: config, contentType: "text/javascript" }));
  await ctx.addInitScript(([id, email]) => {
    if (!sessionStorage.getItem("t.init")) { sessionStorage.setItem("t.init", "1"); localStorage.setItem("dk.pc", '"9000"'); localStorage.setItem("dk.lang", '"nl"');
      if (id) localStorage.setItem("test.user", JSON.stringify({ id, email })); }
    window.confirm = () => true;
  }, [U[who], who + "@x.be"]);
  const p = await ctx.newPage(); p.errs = []; p.on("pageerror", e => p.errs.push(e.message));
  p.on("dialog", d => d.accept());
  return p;
}
const shot = (p, name, el) => SHOTS ? (el ? p.locator(el).screenshot({ path: path.join(SHOTS, name) }) : p.screenshot({ path: path.join(SHOTS, name) })) : null;
const wait = ms => new Promise(r => setTimeout(r, ms));
const acc = async p => { await p.goto(BASE + "#account", { waitUntil: "networkidle" }); await p.waitForSelector("#accBox h3"); await wait(400); };
const list = async p => { await p.keyboard.press("Escape"); await p.click("#listBtn"); await wait(500); };
const rows = p => p.$$eval("#drawer .tickrow .wq", e => e.map(x => x.textContent.trim()));

(async () => {
  const b = await chromium.launch();
  // 1. Miro, signed in, free: the pricing page
  const miro = await phone(b, "miro");
  await miro.keyboard.press("Escape"); await miro.goto(BASE + "#pricing", { waitUntil: "networkidle" }); await wait(500);
  const cards = await miro.$$eval(".plancard h3", e => e.map(x => x.textContent));
  check(cards.join() === "Gratis,Single,Family", "pricing shows Free, Single and Family", cards.join());
  const famTxt = await miro.textContent(".plancard.plus");
  check(/12,99/.test(famTxt) && /Beste waarde/.test(famTxt) && /11,96/.test(famTxt), "Family is €12,99, best value, €11,96 less than 5 × Single");
  check(/4,99/.test(await miro.textContent(".plans .plancard:nth-child(2)")), "Single is €4,99");
  await shot(miro, "pricing.png");
  await acc(miro);
  check(/Gratis/.test(await miro.textContent(".facts")), "free account says Gratis");
  check(await miro.$("#famInviteForm") === null, "a free account cannot invite");

  // 2. Miro buys Family (Stripe + webhook simulated by the test server); Premium only after the webhook
  await miro.keyboard.press("Escape"); await miro.goto(BASE + "#pricing", { waitUntil: "networkidle" }); await wait(300);
  await miro.click('[data-buy="family"]');
  await miro.waitForURL(/paid=1/, { timeout: 5000 }).catch(() => {});
  await miro.waitForSelector("#famInviteForm", { timeout: 15000 }).catch(() => {});
  const plan = await miro.textContent(".facts").catch(() => "");
  check(/Family/.test(plan) && /12,99/.test(plan), "after paying, the account shows Family € 12,99", plan.replace(/\s+/g, " ").slice(0, 120));
  check(!!await miro.$("#famInviteForm"), "the owner gets the invite form");
  check(/1 van 5 plaatsen/.test(await miro.textContent(".famcard")), "the family shows 1 of 5 places");

  // 3. Miro invites Lotte by email
  await miro.fill("#famEmail", "lotte@x.be"); await miro.click("#famInviteForm button"); await wait(800);
  const link = await miro.inputValue(".famlink").catch(() => "");
  check(/\?invite=[0-9a-f]{64}$/.test(link), "an invitation link is made", link.slice(-20));
  check(/lotte@x\.be/.test(await miro.textContent(".members")), "the pending invitation is listed");
  const mail = await miro.getAttribute(".invlink a.btn", "href");
  check(/^mailto:lotte%40x\.be\?subject=/.test(mail) && mail.includes(encodeURIComponent(link)), "Mail de link opens an email to Lotte with the link");
  await shot(miro, "family-owner.png", "#accBox .famcard");
  check(sql(`select count(*) from public.family_invitations where token_hash = encode(sha256(convert_to('${link.split("=")[1]}', 'UTF8')), 'hex')`) === "1", "only the hash of the link's token is in the database");

  // 4. Jonas (other account) opens Lotte's link: refused
  const jonas = await phone(b, "jonas");
  await jonas.goto(link, { waitUntil: "networkidle" }); await wait(1000);
  const jt = await jonas.textContent(".invcard").catch(() => "");
  check(/ander e-mailadres/.test(jt) && !await jonas.$("[data-inv-accept]"), "someone else opening the link cannot join", jt.slice(0, 80));

  // 5. Lotte opens it: joins
  const lotte = await phone(b, "lotte");
  await lotte.goto(BASE, { waitUntil: "networkidle" });
  await lotte.evaluate(() => localStorage.setItem("dk.wants", JSON.stringify([{ id: "p1", q: "chocolade" }])));   // her own list from before
  await lotte.goto(link, { waitUntil: "networkidle" }); await wait(1000);
  const lt = await lotte.textContent(".invcard").catch(() => "");
  check(/nodigt je uit/.test(lt), "Lotte sees who invites her", lt.slice(0, 80));
  await shot(lotte, "invite.png", "#accBox .invcard");
  await lotte.click("[data-inv-accept]"); await wait(1200);
  const lf = await lotte.textContent(".facts");
  check(/betaald door miro/i.test(lf), "Lotte is in the family, paid by Miro", lf.replace(/\s+/g, " ").slice(0, 100));
  check(!await lotte.$("[data-portal]") && !await lotte.$("#famInviteForm") && !await lotte.$("[data-fam-remove]"), "a member gets no payment, invite or remove buttons");
  check(sql(`select count(*) from public.household_items`) === "0", "joining did not copy Lotte's own list to the family");
  await lotte.goto(link, { waitUntil: "networkidle" }); await wait(800);
  check(sql(`select count(*) from public.household_members where status = 'active'`) === "2", "opening the used link again changes nothing");

  // 6. the shared list: Lotte adds koffie for the family and chips just for herself
  await lotte.goto(BASE, { waitUntil: "networkidle" }); await wait(800); await list(lotte);
  await lotte.fill("#wantIn", "koffie"); await lotte.press("#wantIn", "Enter"); await wait(800);
  await lotte.click('[data-want-for="me"]'); await lotte.fill("#wantIn", "chips"); await lotte.press("#wantIn", "Enter"); await wait(600);
  const lr = await rows(lotte);
  check(lr.some(x => /koffie/.test(x)) && lr.some(x => /chips/.test(x)) && lr.some(x => /chocolade/.test(x)), "Lotte sees the family list and her own", lr.join(" | "));
  await shot(lotte, "list-family.png");
  check(sql(`select string_agg(q, ',') from public.household_items`) === "koffie", "only koffie went to the family; chips and chocolade stay private");
  // she moves chocolade on purpose
  await lotte.click('[data-fam-move="p1"]'); await wait(900);
  check(sql(`select string_agg(q, ',' order by q) from public.household_items`) === "chocolade,koffie", "To family moves an item only when asked");

  // 7. Miro sees it and ticks koffie, with a quantity
  await miro.goto(BASE, { waitUntil: "networkidle" }); await wait(800); await list(miro);
  const mr = await rows(miro);
  check(mr.some(x => /koffie/.test(x)) && !mr.some(x => /chips/.test(x)), "Miro sees koffie, not Lotte's private chips", mr.join(" | "));
  const kid = sql(`select id from public.household_items where q = 'koffie'`);
  await miro.click(`[data-qty="${kid}|1"]`); await wait(700);
  await miro.click(`[data-buy="w:${kid}"]`); await wait(900);
  check(sql(`select qty || ':' || (done_by = '${U.miro}') || ':' || (updated_by = '${U.miro}') from public.household_items where q = 'koffie'`) === "2:true:true", "quantity 2 and the tick are saved in Miro's name");
  await lotte.goto(BASE, { waitUntil: "networkidle" }); await wait(800); await list(lotte);
  check(await lotte.$eval(`[data-buy="w:${kid}"]`, e => e.getAttribute("aria-pressed")) === "true", "Lotte sees Miro's tick");
  // a saved deal shared with the family
  await shot(miro, "list-owner.png");

  // 8. Miro removes Lotte: she loses access at once
  await acc(miro);
  await miro.click(`[data-fam-remove="${U.lotte}"]`); await wait(900);
  check(sql(`select status from public.household_members where user_id = '${U.lotte}'`) === "removed", "the owner removed Lotte");
  await lotte.goto(BASE, { waitUntil: "networkidle" }); await wait(900); await list(lotte);
  const lr2 = await rows(lotte);
  check(!lr2.some(x => /koffie/.test(x)) && lr2.some(x => /chips/.test(x)), "removed: the family list is gone, her own list stays", lr2.join(" | "));
  await acc(lotte);
  check(/Gratis/.test(await lotte.textContent(".facts")), "Lotte is back on free");

  // 9. Lotte buys Single; then switches to Family on the same subscription
  await lotte.keyboard.press("Escape"); await lotte.goto(BASE + "#pricing", { waitUntil: "networkidle" }); await wait(300);
  await lotte.click('[data-buy="single"]'); await lotte.waitForURL(/paid=1/, { timeout: 5000 }).catch(() => {}); await wait(2600);
  await lotte.waitForFunction(() => /4,99/.test(document.querySelector(".facts")?.textContent || ""), null, { timeout: 15000 }).catch(() => {});
  check(/Single/.test(await lotte.textContent(".facts")), "Lotte has Single");
  await lotte.click('[data-buy="family"]'); await wait(300);
  await lotte.waitForSelector("#famInviteForm", { timeout: 15000 }).catch(() => {});
  check(sql(`select count(*) || ':' || max(plan_type) from public.subscriptions where payer_id = '${U.lotte}'`) === "1:family", "Single -> Family keeps one subscription");
  check(/12,99/.test(await lotte.textContent(".facts")), "and her account shows Family");

  // 10. payment fails: warning for the owner; after the grace days the family is locked
  sql(`update public.subscriptions set status = 'past_due', last_payment_status = 'failed', grace_until = now() + interval '3 days' where payer_id = '${U.miro}'`);
  await acc(miro);
  check(/betaling is mislukt/.test(await miro.textContent("#accBox")), "the owner is warned that the payment failed");
  await shot(miro, "payment-failed.png", "#accBox");
  sql(`update public.subscriptions set grace_until = now() - interval '1 minute' where payer_id = '${U.miro}'`);
  await acc(miro);
  check(/gepauzeerd/.test(await miro.textContent(".famcard")), "after the grace days the family shows as paused");
  check(sql(`select count(*) from public.household_items`) === "2", "nothing was deleted");

  for (const [n, p] of [["miro", miro], ["lotte", lotte], ["jonas", jonas]]) {
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(over <= 0 && !p.errs.length, `${n}: no sideways scroll, no script errors`, p.errs.join("; "));
  }
  await b.close();
  console.log(fails ? `${fails} FAILED` : "all browser checks passed");
  process.exit(fails ? 1 : 0);
})();
