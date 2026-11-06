/* deal'ke admin back end. Everything shown here comes from database functions in supabase/migrations/005_admin.sql,
   which check the signed-in person's role every time: viewer = anonymous reports, admin = also users, email list,
   site settings and the log, owner = also the team. This file only draws what the database agrees to hand over. */
(function () {
  "use strict";
  const CFG = window.DK_CONFIG || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = n => (+n || 0).toLocaleString("en-GB");
  const money = n => "€ " + (+n || 0).toLocaleString("nl-BE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (a, b) => b ? Math.round(100 * a / b) + "%" : "–";
  const mon = x => x ? new Date(x).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "–";
  const day = x => x ? new Date(x).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "–";
  const when = x => x ? new Date(x).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–";
  const ago = x => { const s = Math.round((Date.now() - new Date(x)) / 1000); return s < 60 ? s + " s ago" : s < 3600 ? Math.round(s / 60) + " min ago" : when(x); };
  let toastT;
  const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600); };
  const loadScript = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.append(s); });
  const RANK = { viewer: 1, admin: 2, owner: 3 };
  const ROLE_TXT = { owner: "Owner (everything, incl. the team)", admin: "Everything except managing the team", viewer: "Reports only (no emails)" };
  const KIND_TXT = { view: "opened a page", search: "searched", open_deal: "looked at a deal", add_list: "added to their list", to_store: "went to the shop's site",
    directions: "asked the route", filter_store: "filtered on a shop", filter_cat: "picked a category", recipe: "made a week menu", pricing: "looked at prices", signup: "started signing up" };
  const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const A = { sb: null, user: null, role: null, tab: "overview", days: 7, store: "", timers: [], meta: null, deals: null, rep: null, ov: null, prefs: null };

  async function rpc(fn, args) {
    const { data, error } = await A.sb.rpc(fn, args || {});
    if (error) throw new Error(error.message || "error");
    return data;
  }
  const getJSON = p => fetch(p, { cache: "no-cache" }).then(r => r.ok ? r.json() : null).catch(() => null);

  // ---------- start: sign in, maybe accept an invitation link, check the role ----------
  const JOIN = "dk.admjoin";
  { const j = new URLSearchParams(location.search).get("join"); if (j && /^[0-9a-f]{64}$/.test(j)) { try { localStorage.setItem(JOIN, j); } catch { /* */ } history.replaceState(null, "", location.pathname); } }
  const pendingJoin = () => { try { return localStorage.getItem(JOIN); } catch { return null; } };

  async function boot() {
    if (!CFG.supabaseUrl || !CFG.supabaseAnonKey) { $("#main").innerHTML = `<p>Accounts are not switched on in config.js.</p>`; return; }
    try { await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js"); }
    catch { $("#main").innerHTML = `<p>Couldn't reach the sign-in service. Check your connection and reload.</p>`; return; }
    A.sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
    A.sb.auth.onAuthStateChange((_e, s) => { if ((s?.user?.id || null) !== (A.user?.id || null)) start(s?.user || null); });
    const { data } = await A.sb.auth.getSession();
    start(data.session?.user || null);
  }
  async function start(user) {
    A.user = user; A.role = null; stopTimers();
    $("#tabs").hidden = true; $("#out").hidden = !user; $("#who").textContent = user ? user.email : "";
    if (!user) return signIn();
    const tok = pendingJoin();
    if (tok) {
      try { localStorage.removeItem(JOIN); } catch { /* */ }
      const r = await rpc("admin_invite_accept", { token: tok }).catch(() => "error");
      toast({ ok: "Welcome to the deal'ke team", invalid: "That invitation link was switched off", expired: "That invitation link has expired" }[r] || "The invitation didn't work");
    }
    A.role = await rpc("admin_role").catch(() => null);
    if (!A.role) {
      $("#main").innerHTML = `<section class="adm-gate"><h1>No access</h1><p>You're signed in as <b>${esc(user.email)}</b>, but this account has no access to the back end.
        Ask the owner for an invitation link.</p><p><a class="btn ghost" href="./">Back to the site</a></p></section>`;
      return;
    }
    $("#who").textContent = `${user.email} · ${A.role}`;
    paintTabs(); go(location.hash.slice(1) || "overview");
  }
  function signIn() {
    const joining = !!pendingJoin();
    $("#main").innerHTML = `<section class="adm-gate"><h1>${joining ? "You're invited to the deal'ke back end" : "deal'ke back end"}</h1>
      <p class="muted">${joining ? "Sign in with your email (or make an account with it) to accept." : "Only for people the owner gave access. Sign in with your email."}</p>
      <form id="sf" class="adm-row"><input type="email" id="se" required autocomplete="email" placeholder="you@example.com" aria-label="Email">
      <button class="btn" type="submit">Email me a sign-in link</button></form><p id="ss" class="muted" role="status"></p></section>`;
    $("#sf").addEventListener("submit", async e => {
      e.preventDefault();
      const email = $("#se").value.trim();
      const { error } = await A.sb.auth.signInWithOtp({ email, options: { shouldCreateUser: joining, emailRedirectTo: location.origin + location.pathname } });
      $("#ss").textContent = error ? (joining ? "That didn't work, try again in a minute." : "That didn't work. Is this the email of an account with access?") : `Check your inbox (${email}) and click the link.`;
    });
  }
  $("#out").addEventListener("click", async () => { await A.sb.auth.signOut(); start(null); });

  // ---------- tabs ----------
  const TABS = [
    ["overview", "Overview", "viewer"], ["report", "Live report", "viewer"], ["searches", "Searches", "viewer"],
    ["users", "Users", "admin"], ["emails", "Email list", "admin"], ["site", "Site control", "admin"],
    ["team", "Team", "owner"], ["log", "Activity log", "admin"],
  ];
  const can = r => RANK[A.role] >= RANK[r];
  function paintTabs() {
    $("#tabs").hidden = false;
    $("#tabs").innerHTML = TABS.filter(t => can(t[2])).map(t => `<a href="#${t[0]}" data-tab="${t[0]}">${t[1]}</a>`).join("");
  }
  addEventListener("hashchange", () => { if (A.role) go(location.hash.slice(1)); });
  function stopTimers() { A.timers.forEach(clearInterval); A.timers = []; }
  function go(tab) {
    const t = TABS.find(x => x[0] === tab && can(x[2])) || TABS[0];
    A.tab = t[0]; stopTimers();
    document.querySelectorAll("#tabs a").forEach(a => a.setAttribute("aria-current", a.dataset.tab === A.tab ? "page" : "false"));
    $("#main").innerHTML = `<p class="muted">Loading…</p>`;
    ({ overview, report, searches, users, emails, site, team, log })[A.tab]().catch(e => { $("#main").innerHTML = `<p class="adm-err">Couldn't load this: ${esc(e.message)}</p>`; });
  }

  // ---------- small charts (plain SVG, no library) ----------
  function cols(series, { key = "n", label = x => x.day, h = 120 } = {}) {
    if (!series.length) return `<p class="muted small">No data yet.</p>`;
    const max = Math.max(1, ...series.map(x => +x[key] || 0)), w = 100 / series.length;
    return `<svg class="adm-cols" viewBox="0 0 100 ${h}" preserveAspectRatio="none" role="img" aria-label="chart">${series.map((x, i) => {
      const v = +x[key] || 0, bh = Math.max(v ? 1.5 : 0, (h - 4) * v / max);
      return `<rect x="${i * w + w * 0.12}" y="${h - bh}" width="${w * 0.76}" height="${bh}" rx="0.8"><title>${esc(label(x))}: ${num(v)}</title></rect>`;
    }).join("")}</svg><div class="adm-axis"><span>${esc(label(series[0]))}</span><span>${esc(label(series[series.length - 1]))}</span></div>`;
  }
  function hbars(rows, name, val) {
    if (!rows.length) return `<p class="muted small">No data yet.</p>`;
    const max = Math.max(1, ...rows.map(r => +val(r) || 0));
    return `<ul class="adm-hbars">${rows.map(r => `<li><span>${esc(name(r))}</span><i style="width:${Math.round(100 * (+val(r) || 0) / max)}%"></i><b>${num(val(r))}</b></li>`).join("")}</ul>`;
  }
  const kpi = (label, value, sub = "") => `<div class="adm-kpi"><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ""}</div>`;
  const table = (head, rows, cls = "") => rows.length ? `<div class="adm-tw"><table class="adm-t ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : `<p class="muted small">Nothing yet.</p>`;
  const periodPick = () => `<div class="adm-seg" role="group" aria-label="Period">${[[1, "Today"], [7, "7 days"], [30, "30 days"], [90, "90 days"]].map(([d, l]) =>
    `<button type="button" data-days="${d}" aria-pressed="${A.days === d}">${l}</button>`).join("")}</div>`;
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-days]"); if (b) { A.days = +b.dataset.days; go(A.tab); }
  });

  // ---------- shop health: did this morning's collection work? (data/meta.json, written by the collector) ----------
  function health(meta) {
    if (!meta) return `<p class="muted small">No collection info found.</p>`;
    const old = Date.now() - new Date(meta.collected_at) > 26 * 3600e3, kept = new Set(meta.kept_from_before || []);
    const rows = Object.entries(meta.collectors || {}).map(([shop, n]) => {
      const bad = !n, warn = !bad && [...kept].some(k => k.startsWith(shop));
      return `<li class="${bad ? "bad" : warn ? "warn" : "good"}"><b>${esc(shop)}</b><span>${bad ? "no deals came in this morning" : warn ? `${num(n)} new, yesterday's kept (the shop's site had trouble)` : `${num(n)} deals`}</span></li>`;
    });
    return `${old ? `<p class="adm-err">The morning collection hasn't run since ${when(meta.collected_at)}. Check GitHub → Actions.</p>` : `<p class="muted small">Collected ${when(meta.collected_at)} · ${num(meta.deals)} deals on the site</p>`}
      <ul class="adm-health">${rows.join("")}</ul>`;
  }

  // ---------- overview ----------
  async function overview() {
    const [ov, rep, meta, grow] = await Promise.all([rpc("admin_overview"), rpc("admin_report", { days: A.days }), A.meta || getJSON("data/meta.json"), rpc("admin_growth")]);
    A.grow = grow;
    A.ov = ov; A.rep = rep; A.meta = meta;
    const f = rep.funnel || {};
    $("#main").innerHTML = `
      <div class="adm-head"><h1>Overview</h1><div class="adm-row">${periodPick()}<button type="button" class="btn gold" id="pdfBiz">Business report (PDF)</button></div></div>
      <div class="adm-kpis">
        ${kpi("Accounts", num(ov.users), `+${num(ov.users_7d)} this week · +${num(ov.users_30d)} in 30 days`)}
        ${kpi("Active accounts", num(ov.active_7d), "signed in, last 7 days")}
        ${kpi("Premium Single", num(ov.single), "€ 4,99 / month")}
        ${kpi("Premium Family", num(ov.family), `${num(ov.family_people)} people in paid families`)}
        ${kpi("Monthly income", money(ov.mrr), `${num(ov.canceling)} stopping · ${num(ov.past_due)} payment failed · ${num(ov.canceled_30d)} stopped in 30 days`)}
        ${kpi("On the email list", num(ov.opted_in), `${pct(ov.opted_in, ov.users)} of accounts said yes`)}
        ${kpi("Visits today", num(ov.visits_today), `${num(ov.visits_7d)} in 7 days · ${num(ov.online_now)} on the site now`)}
        ${kpi("Visits in period", num(rep.visits), "only visitors who accepted statistics")}
      </div>
      <div class="adm-grid">
        <section class="adm-card"><h2>New accounts, last 30 days</h2>${cols(ov.signups_by_day || [], { label: x => day(x.day) })}</section>
        <section class="adm-card"><h2>Visits per day</h2>${cols(rep.by_day || [], { key: "visits", label: x => day(x.day) })}</section>
        <section class="adm-card"><h2>From visit to shop</h2>${hbars([
          { k: "Visited", n: f.visits }, { k: "Looked at a deal", n: f.opened }, { k: "Added to list", n: f.added }, { k: "Went to shop / route", n: f.to_store }, { k: "Started sign-up", n: f.signup }],
          r => `${r.k} (${pct(r.n, f.visits)})`, r => r.n)}</section>
        <section class="adm-card"><h2>Shop health this morning</h2>${health(meta)}</section>
      </div>
      <section class="adm-card"><h2>Growth per month</h2><p class="muted small">Kept for good, also after the detailed click data is deleted (13 months).</p>
        <div class="adm-grid two"><div><h3 class="small">Accounts</h3>${cols(grow, { key: "accounts", label: x => mon(x.month) })}</div>
          <div><h3 class="small">Visits</h3>${cols(grow, { key: "visit_days", label: x => mon(x.month) })}</div></div>
        ${table(["Month", "Accounts", "New accounts", "New Premium", "Visits", "Deals looked at", "Added to lists", "Sent to shops"], grow.slice().reverse().map(g =>
          [mon(g.month), num(g.accounts), num(g.new_accounts), num(g.new_premium), num(g.visit_days), num(g.opens), num(g.adds), num(g.sent)]))}</section>
      <p class="muted small">Visit numbers only count people who clicked "Accept" on the cookie banner. People who refused are never counted, so real visits are higher.</p>`;
    $("#pdfBiz").addEventListener("click", () => pdfBusiness().catch(e => toast("PDF failed: " + e.message)));
  }

  // ---------- live report, per store ----------
  async function report() {
    const [rep, prefs, live, meta, deals] = await Promise.all([rpc("admin_report", { days: A.days }), rpc("admin_prefs"), rpc("admin_live"),
      A.meta || getJSON("data/meta.json"), A.deals || getJSON("data/deals.json")]);
    A.rep = rep; A.prefs = prefs; A.meta = meta; A.deals = deals || [];
    const st = rep.stores || [];
    $("#main").innerHTML = `
      <div class="adm-head"><h1>Live report</h1><div class="adm-row">${periodPick()}</div></div>
      <section class="adm-card adm-live"><h2><span class="dot" aria-hidden="true"></span> Right now <small class="muted" id="liveN"></small></h2><ul class="adm-feed" id="feed"></ul></section>
      <section class="adm-card"><h2>Per shop</h2>
        ${table(["Shop", "Visitors", "Deals looked at", "Added to list", "Sent to the shop", "vs. period before", "Filtered on", "Report"], st.map(s => [
          `<b>${esc(s.store)}</b>`, num(s.visits), num(s.opens), num(s.adds), `${num(s.to_store + s.directions)} <small class="muted">(${num(s.to_store)} site, ${num(s.directions)} route)</small>`,
          change(s.to_store + s.directions, (prevOf(rep, s.store).to_store || 0) + (prevOf(rep, s.store).directions || 0)), num(s.filters),
          `<button type="button" class="btn ghost sm" data-pdf-store="${esc(s.store)}">PDF</button>`]))}
        ${st.length ? "" : `<p class="muted small">Store PDFs appear here once visitors who accepted statistics have used the site.</p>`}
        <div class="adm-row"><label class="muted small" for="pdfPick">Report for any shop:</label><select id="pdfPick">${[...new Set([...st.map(s => s.store), ...A.deals.map(d => d.store)])].sort().map(s => `<option>${esc(s)}</option>`).join("")}</select>
        <button type="button" class="btn ghost sm" id="pdfPickGo">Download PDF</button></div></section>
      <div class="adm-grid">
        <section class="adm-card"><h2>Most popular deals</h2>${table(["Deal", "Shop", "Looked at", "Added"], (rep.deals || []).map(d => [esc(d.label), esc(d.store), num(d.opens), num(d.adds)]))}</section>
        <section class="adm-card"><h2>Categories</h2>${hbars(rep.cats || [], r => r.cat, r => r.n)}</section>
        <section class="adm-card"><h2>Busiest hours (Belgian time)</h2>${cols(fill24(rep.hours || []), { label: x => x.h + ":00" })}</section>
        <section class="adm-card"><h2>Busiest days</h2>${hbars(rep.weekdays || [], r => DAYS[r.d], r => r.visits)}</section>
        <section class="adm-card"><h2>Phone or computer</h2>${hbars(Object.entries(rep.devices || {}).map(([k, n]) => ({ k, n })), r => r.k, r => r.n)}</section>
        <section class="adm-card"><h2>Language</h2>${hbars(Object.entries(rep.langs || {}).map(([k, n]) => ({ k: k.toUpperCase(), n })), r => r.k, r => r.n)}</section>
        <section class="adm-card wide"><h2>Where visitors shop (first two postcode digits)</h2><div id="map" class="adm-map"></div>${hbars(rep.areas || [], r => r.area + "xx " + (AREA_NAME[r.area] || ""), r => r.visits)}</section>
        <section class="adm-card"><h2>Pages</h2>${hbars(rep.pages || [], r => r.page || "?", r => r.n)}</section>
      </div>
      <h2 class="adm-sub">What account holders chose (totals)</h2>
      <div class="adm-grid">
        <section class="adm-card"><h2>Favourite shop</h2>${hbars(prefs.shops || [], r => r.shop, r => r.n)}</section>
        <section class="adm-card"><h2>Diet</h2>${hbars(prefs.diets || [], r => r.diet, r => r.n)}</section>
        <section class="adm-card"><h2>Distance they shop in</h2>${hbars(prefs.radius || [], r => r.km + " km", r => r.n)}</section>
        <section class="adm-card"><h2>Habits</h2><div class="adm-kpis sm">
          ${kpi("Keep a shopping list", num(prefs.with_list), `${prefs.avg_list || 0} items on average`)}
          ${kpi("Own recipes", num(prefs.with_recipes))}${kpi("Phone notifications on", num(prefs.push_on))}${kpi("Families", num(prefs.families))}</div></section>
      </div>`;
    paintLive(live);
    regionMap(rep.areas || []);
    A.timers.push(setInterval(() => rpc("admin_live").then(paintLive).catch(() => {}), 15000));
    document.querySelectorAll("[data-pdf-store]").forEach(b => b.addEventListener("click", () => pdfStore(b.dataset.pdfStore).catch(e => toast("PDF failed: " + e.message))));
    $("#pdfPickGo").addEventListener("click", () => pdfStore($("#pdfPick").value).catch(e => toast("PDF failed: " + e.message)));
  }
  // change against the period before: "+12%", "new", or "–"
  const change = (now, before) => !before ? (now ? "new" : "–") : `${now >= before ? "+" : ""}${Math.round(100 * (now - before) / before)}%`;
  const prevOf = (rep, store) => (rep.prev_stores || []).find(x => x.store === store) || {};
  const fill24 = hours => Array.from({ length: 24 }, (_, h) => ({ h, n: hours.find(x => x.h === h)?.n || 0 }));
  function paintLive(live) {
    if (!$("#feed")) return;
    $("#liveN").textContent = `${num(live.online)} on the site in the last 5 minutes · updates every 15 s`;
    $("#feed").innerHTML = (live.feed || []).length ? live.feed.map(e => `<li><time>${ago(e.at)}</time> <span>Someone on a ${esc(e.device || "device")} ${esc(KIND_TXT[e.kind] || e.kind)}${e.label ? `: <b>${esc(e.label)}</b>` : ""}${e.store ? ` (${esc(e.store)})` : ""}</span></li>`).join("")
      : `<li class="muted">Nobody (who accepted statistics) in the last 30 minutes.</li>`;
  }

  // ---------- map of regions: the postcodes of data/postcodes.json grouped by their first two digits ----------
  const AREA_NAME = { 10: "Brussels", 11: "Brussels", 12: "Brussels", 15: "Halle", 18: "Vilvoorde", 20: "Antwerpen", 21: "Antwerpen", 22: "Antwerpen", 23: "Turnhout",
    24: "Mol", 25: "Lier", 26: "Antwerpen", 28: "Mechelen", 30: "Leuven", 31: "Leuven", 32: "Aarschot", 33: "Tienen", 34: "Landen", 35: "Hasselt", 36: "Genk",
    37: "Tongeren", 38: "Sint-Truiden", 39: "Lommel", 40: "Liège", 41: "Liège", 42: "Liège", 43: "Waremme", 44: "Liège", 45: "Huy", 46: "Visé", 47: "Eupen",
    48: "Verviers", 49: "Spa", 50: "Namur", 51: "Namur", 53: "Andenne", 55: "Dinant", 56: "Philippeville", 57: "Gembloux", 60: "Charleroi", 61: "Charleroi",
    62: "Charleroi", 64: "Chimay", 65: "Thuin", 66: "Bastogne", 67: "Arlon", 68: "Neufchâteau", 69: "Marche", 70: "Mons", 71: "La Louvière", 73: "Saint-Ghislain",
    75: "Tournai", 76: "Péruwelz", 77: "Mouscron", 78: "Ath", 79: "Ath", 80: "Brugge", 81: "Torhout", 82: "Brugge", 83: "Knokke", 84: "Oostende",
    85: "Kortrijk", 86: "Veurne", 87: "Tielt", 88: "Roeselare", 89: "Ieper", 90: "Gent", 91: "Lokeren", 92: "Dendermonde", 93: "Aalst", 94: "Ninove",
    95: "Geraardsbergen", 96: "Ronse", 97: "Oudenaarde", 98: "Deinze", 99: "Eeklo" };
  async function regionMap(areas) {
    const el = $("#map"); if (!el) return;
    if (!areas.length) { el.innerHTML = `<p class="muted small">The map fills in once visitors with a postcode have accepted statistics.</p>`; el.classList.add("empty"); return; }
    try {
      if (!window.L) {
        const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.append(css);
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js");
      }
      A.pcs = A.pcs || await getJSON("data/postcodes.json") || {};
      const at = {};
      for (const [pc, v] of Object.entries(A.pcs)) { const k = pc.slice(0, 2); (at[k] = at[k] || []).push(v); }
      const map = L.map(el, { scrollWheelZoom: false }).setView([50.6, 4.6], 7);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 12, attribution: "© OpenStreetMap" }).addTo(map);
      const max = Math.max(...areas.map(a => a.visits));
      for (const a of areas) {
        const pts = at[a.area]; if (!pts?.length) continue;
        const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length, lon = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        L.circleMarker([lat, lon], { radius: 6 + 22 * Math.sqrt(a.visits / max), color: "#17150F", weight: 1, fillColor: "#C6F135", fillOpacity: 0.75 })
          .bindTooltip(`${a.area}xx ${AREA_NAME[a.area] || ""}: ${num(a.visits)} visitors`).addTo(map);
      }
    } catch { el.innerHTML = `<p class="muted small">The map couldn't load. The list below has the same numbers.</p>`; el.classList.add("empty"); }
  }

  // ---------- searches ----------
  async function searches() {
    const rep = await rpc("admin_report", { days: A.days }); A.rep = rep;
    $("#main").innerHTML = `<div class="adm-head"><h1>Searches</h1><div class="adm-row">${periodPick()}</div></div>
      <div class="adm-grid">
        <section class="adm-card"><h2>Most searched</h2>${table(["Search", "Times", "Results (avg)"], (rep.searches || []).map(s => [esc(s.q), num(s.times), num(s.results)]))}</section>
        <section class="adm-card"><h2>Searched, but nothing found</h2><p class="muted small">Products people want that we don't have on promo. A good list for new shops or partnerships.</p>
          ${table(["Search", "Times"], (rep.no_results || []).map(s => [esc(s.q), num(s.times)]))}</section>
      </div>`;
  }

  // ---------- users (admin) ----------
  async function users(q = "", skip = 0) {
    const r = await rpc("admin_users", { search: q || null, lim: 50, skip });
    const plan = u => u.premium ? `<span class="pill good">Premium${u.sub ? " · " + esc(u.sub.split(":")[0]) : ""}</span>` : u.sub ? `<span class="pill">${esc(u.sub.replace(":", " · "))}</span>` : "Free";
    $("#main").innerHTML = `<div class="adm-head"><h1>Users <small class="muted">${num(r.total)}</small></h1>
      <div class="adm-row"><form class="adm-row" id="uf"><input type="search" id="uq" value="${esc(q)}" placeholder="Search by email" aria-label="Search by email"><button class="btn ghost" type="submit">Search</button></form>
      <button type="button" class="btn ghost" id="ucsv">Download all (CSV)</button></div></div>
      ${table(["Email", "Joined", "Last signed in", "Plan", "Email news", "Back end"], (r.rows || []).map(u => [esc(u.email), day(u.created_at), day(u.last_sign_in_at), plan(u),
        u.opt_in ? `<span class="pill good">yes</span>` : `<span class="muted">no</span>`, u.admin ? esc(u.admin) : ""]))}
      <div class="adm-row">${skip ? `<button type="button" class="btn ghost sm" id="prev">← Newer</button>` : ""}${skip + 50 < r.total ? `<button type="button" class="btn ghost sm" id="next">Older →</button>` : ""}</div>
      <p class="adm-note">Only people with "Email news: yes" may get marketing emails (the Email list tab). The others signed up to use the site, not for mail:
        sending them newsletters breaks the GDPR and gets your emails marked as spam. Looking at or downloading this list is written to the activity log.</p>`;
    $("#uf").addEventListener("submit", e => { e.preventDefault(); users($("#uq").value.trim(), 0); });
    $("#ucsv").addEventListener("click", async () => {
      const all = [];
      for (let off = 0; ; off += 500) { const p = await rpc("admin_users", { search: q || null, lim: 500, skip: off }); all.push(...p.rows); if (off + 500 >= p.total) break; }
      csv(`dealke-users-${new Date().toISOString().slice(0, 10)}.csv`, [["email", "joined", "last_sign_in", "premium", "subscription", "email_news_yes", "back_end_role"],
        ...all.map(u => [u.email, u.created_at || "", u.last_sign_in_at || "", u.premium ? "yes" : "no", u.sub || "", u.opt_in ? "yes" : "no", u.admin || ""])]);
    });
    $("#prev")?.addEventListener("click", () => users(q, Math.max(0, skip - 50)));
    $("#next")?.addEventListener("click", () => users(q, skip + 50));
  }

  // ---------- email list (admin): only people who said yes ----------
  async function emails() {
    const list = await rpc("admin_mailing_list");
    $("#main").innerHTML = `<div class="adm-head"><h1>Email list <small class="muted">${num(list.length)}</small></h1>
      <div class="adm-row"><button type="button" class="btn" id="csv">Download (CSV)</button><button type="button" class="btn ghost" id="copy">Copy all addresses</button></div></div>
      <p class="adm-note">Everyone here ticked "Send me deal'ke news" themselves. Every email you send them needs an unsubscribe link, and when someone unsubscribes,
        switch it off in their account (or they do it themselves in the site). Keep the downloaded file safe, don't share it outside the team.</p>
      ${table(["Email", "Said yes on", "Language", "Postcode"], list.map(p => [esc(p.email), day(p.since), esc((p.lang || "").toUpperCase()), esc(p.postcode || "")]))}`;
    $("#csv").addEventListener("click", () => csv(`dealke-email-list-${new Date().toISOString().slice(0, 10)}.csv`,
      [["email", "opted_in_at", "language", "postcode"], ...list.map(p => [p.email, p.since || "", p.lang || "", p.postcode || ""])]));
    $("#copy").addEventListener("click", () => navigator.clipboard.writeText(list.map(p => p.email).join(", ")).then(() => toast("Copied " + list.length + " addresses")));
  }
  const csv = (name, rows) => download(name, "\ufeff" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n"), "text/csv");  // ; and BOM: opens right in Belgian Excel
  function download(name, body, type) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // ---------- site control (admin) ----------
  async function site() {
    const [{ data: rows }, deals] = await Promise.all([A.sb.from("site_settings").select("key,value"), A.deals || getJSON("data/deals.json")]);
    A.deals = deals || [];
    const S = Object.fromEntries((rows || []).map(r => [r.key, r.value]));
    const an = S.announcement || {}, mt = S.maintenance || {}, ft = S.features || {};
    let hidS = new Set(S.hidden_stores || []), hidD = new Set(S.hidden_deals || []);
    const stores = [...new Set([...A.deals.map(d => d.store), ...hidS])].sort();
    const save = async (k, v, msg) => { try { await rpc("admin_set_setting", { k, v }); toast(msg || "Saved. Visitors see it on their next page load."); } catch (e) { toast("Not saved: " + e.message); } };
    const langs = (o, id) => ["nl", "fr", "en"].map(l => `<label class="field"><span>${l.toUpperCase()}</span><input id="${id}${l}" value="${esc(o[l] || "")}" maxlength="200"></label>`).join("");
    $("#main").innerHTML = `<div class="adm-head"><h1>Site control</h1></div>
      <div class="adm-grid">
        <section class="adm-card"><h2>Message bar</h2><p class="muted small">A line under the header, e.g. "New: Lidl Netherlands".</p>
          <label class="adm-check"><input type="checkbox" id="anOn"${an.on ? " checked" : ""}> Show the message</label>
          <label class="field"><span>Colour</span><select id="anTone"><option value="info">Green (news)</option><option value="warn"${an.tone === "warn" ? " selected" : ""}>Yellow (warning)</option></select></label>
          ${langs(an, "an")}<label class="field"><span>Link (optional)</span><input id="anLink" type="url" value="${esc(an.link || "")}" placeholder="https://…"></label>
          <button type="button" class="btn" id="anSave">Save message</button></section>
        <section class="adm-card"><h2>Sections</h2>
          <label class="adm-check"><input type="checkbox" id="ftRec"${ft.recipes !== false ? " checked" : ""}> Recipes page is on</label>
          <label class="adm-check"><input type="checkbox" id="ftPri"${ft.pricing !== false ? " checked" : ""}> Pricing page is on</label>
          <button type="button" class="btn" id="ftSave">Save sections</button>
          <h2 class="adm-sub">"Back soon" screen</h2><p class="muted small">Covers the whole site for every visitor. This back end keeps working.</p>
          <label class="adm-check"><input type="checkbox" id="mtOn"${mt.on ? " checked" : ""}> Site closed for maintenance</label>
          ${langs(mt, "mt")}<button type="button" class="btn ghost" id="mtSave">Save</button></section>
        <section class="adm-card"><h2>Hide a shop</h2><p class="muted small">Its deals disappear from the site until you switch it back on.</p>
          <div class="chips">${stores.map(s => `<button type="button" class="chip" data-hs="${esc(s)}" aria-pressed="${hidS.has(s)}">${hidS.has(s) ? "Hidden: " : ""}${esc(s)}</button>`).join("")}</div></section>
        <section class="adm-card"><h2>Hide a deal</h2><p class="muted small">For a wrong price or a deal that isn't real. Search this week's deals:</p>
          <input type="search" id="dq" placeholder="e.g. koffie" aria-label="Search deals"><ul class="adm-dl" id="dres"></ul>
          <h3 class="small">Hidden now</h3><ul class="adm-dl" id="dhid"></ul></section>
      </div>`;
    const val = (id) => Object.fromEntries(["nl", "fr", "en"].map(l => [l, $(`#${id}${l}`).value.trim()]));
    $("#anSave").addEventListener("click", () => save("announcement", { on: $("#anOn").checked, tone: $("#anTone").value, ...val("an"), link: $("#anLink").value.trim() }));
    $("#ftSave").addEventListener("click", () => save("features", { recipes: $("#ftRec").checked, pricing: $("#ftPri").checked }));
    $("#mtSave").addEventListener("click", () => {
      if ($("#mtOn").checked && !confirm("Close the whole site for every visitor?")) return;
      save("maintenance", { on: $("#mtOn").checked, ...val("mt") });
    });
    document.querySelectorAll("[data-hs]").forEach(b => b.addEventListener("click", async () => {
      const s = b.dataset.hs; hidS.has(s) ? hidS.delete(s) : hidS.add(s);
      await save("hidden_stores", [...hidS]); b.setAttribute("aria-pressed", hidS.has(s)); b.textContent = (hidS.has(s) ? "Hidden: " : "") + s;
    }));
    const key = d => `${d.store}|${d.name}`;
    const paintD = () => {
      const q = $("#dq").value.trim().toLowerCase();
      $("#dres").innerHTML = q.length < 2 ? "" : A.deals.filter(d => `${d.name} ${d.store} ${d.brand || ""}`.toLowerCase().includes(q)).slice(0, 12)
        .map(d => `<li><span>${esc(d.name)} · ${esc(d.store)} · ${money(d.price)}</span><button type="button" class="btn ghost sm" data-hd="${esc(key(d))}">${hidD.has(key(d)) ? "Show" : "Hide"}</button></li>`).join("") || `<li class="muted">No deal found.</li>`;
      $("#dhid").innerHTML = [...hidD].map(k => `<li><span>${esc(k.replace("|", " · "))}</span><button type="button" class="btn ghost sm" data-hd="${esc(k)}">Show again</button></li>`).join("") || `<li class="muted">None.</li>`;
    };
    $("#dq").addEventListener("input", paintD);
    $("#main").addEventListener("click", async e => {
      const b = e.target.closest("[data-hd]"); if (!b) return;
      const k = b.dataset.hd; hidD.has(k) ? hidD.delete(k) : hidD.add(k);
      await save("hidden_deals", [...hidD]); paintD();
    });
    paintD();
  }

  // ---------- team (owner) ----------
  async function team() {
    const [people, links] = await Promise.all([rpc("admin_team"), rpc("admin_invites")]);
    $("#main").innerHTML = `<div class="adm-head"><h1>Team</h1></div>
      <section class="adm-card"><h2>Invite coworkers with a link</h2>
        <p class="muted small">Whoever opens the link and signs in gets in. The link keeps working until you switch it off, so only send it to people you trust,
          and switch it off once your coworkers are in. Everyone who joined shows below and can be removed.</p>
        <div class="adm-row"><label class="field"><span>They can</span><select id="lr">${["admin", "viewer", "owner"].map(r => `<option value="${r}">${ROLE_TXT[r]}</option>`).join("")}</select></label>
          <label class="field"><span>For (a note for you)</span><input id="ln" maxlength="80" placeholder="e.g. sales team"></label>
          <button type="button" class="btn" id="lmake">Make a link</button></div>
        <div id="lnew"></div>
        ${table(["Link for", "Can", "Made", "Used", ""], links.map(l => [esc(l.note || "–"), esc(l.role), day(l.created_at), `${num(l.uses)}×${l.last_used_at ? ", last " + day(l.last_used_at) : ""}`,
          `<button type="button" class="btn ghost sm" data-loff="${l.id}">Switch off</button>`]))}</section>
      <section class="adm-card"><h2>People with access</h2>
        ${table(["Email", "Can", "Since", "Added by", ""], people.map(p => [esc(p.email),
          `<select data-role="${esc(p.email)}" aria-label="Role">${["owner", "admin", "viewer"].map(r => `<option value="${r}"${r === p.role ? " selected" : ""}>${ROLE_TXT[r]}</option>`).join("")}</select>`,
          day(p.granted_at), esc(p.granted_by || "–"), p.user_id === A.user.id ? `<span class="muted small">you</span>` : `<button type="button" class="btn ghost sm" data-rm="${p.user_id}" data-rm-email="${esc(p.email)}">Remove</button>`]))}
        <form class="adm-row" id="gf"><label class="field"><span>Or add an existing account by email</span><input type="email" id="ge" required></label>
          <select id="gr" aria-label="Role">${["admin", "viewer", "owner"].map(r => `<option value="${r}">${ROLE_TXT[r]}</option>`).join("")}</select><button class="btn ghost" type="submit">Add</button></form></section>`;
    $("#lmake").addEventListener("click", async () => {
      const tok = await rpc("admin_invite_create", { new_role: $("#lr").value, who: $("#ln").value.trim() || null });
      const link = location.origin + location.pathname + "?join=" + tok;
      $("#lnew").innerHTML = `<div class="adm-note"><b>Your link</b> (shown once, copy it now):<input readonly value="${esc(link)}" id="lval" aria-label="Invitation link"><button type="button" class="btn sm" id="lcopy">Copy</button></div>`;
      $("#lcopy").addEventListener("click", () => navigator.clipboard.writeText(link).then(() => toast("Link copied")));
      $("#lval").select();
    });
    document.querySelectorAll("[data-loff]").forEach(b => b.addEventListener("click", async () => { await rpc("admin_invite_cancel", { inv: b.dataset.loff }); toast("Link switched off"); team(); }));
    document.querySelectorAll("[data-rm]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm(`Remove ${b.dataset.rmEmail} from the back end?`)) return;
      const r = await rpc("admin_revoke", { who: b.dataset.rm }); toast(r === "ok" ? "Removed" : "There must be at least one owner"); team();
    }));
    document.querySelectorAll("[data-role]").forEach(s => s.addEventListener("change", async () => {
      const r = await rpc("admin_grant", { who_email: s.dataset.role, new_role: s.value }); toast(r === "ok" ? "Changed" : "There must be at least one owner"); team();
    }));
    $("#gf").addEventListener("submit", async e => {
      e.preventDefault();
      const r = await rpc("admin_grant", { who_email: $("#ge").value.trim(), new_role: $("#gr").value });
      toast(r === "ok" ? "Added" : r === "no_account" ? "No account with that email yet. Send them an invitation link instead." : "Not changed"); if (r === "ok") team();
    });
  }

  // ---------- activity log (admin) ----------
  async function log() {
    const rows = await rpc("admin_log_list", { lim: 200 });
    $("#main").innerHTML = `<div class="adm-head"><h1>Activity log</h1></div><p class="muted small">Who in the team looked at personal data or changed something.</p>
      ${table(["When", "Who", "What", "Details"], rows.map(r => [when(r.at), esc(r.actor_email || "–"), esc(r.action.replace(/_/g, " ")), esc(Object.entries(r.detail || {}).map(([k, v]) => `${k}: ${v}`).join(", "))]))}`;
  }

  // ---------- PDF reports (jsPDF, loaded only when a button is pressed) ----------
  async function pdfLib() {
    if (!window.jspdf) {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
    }
    return window.jspdf.jsPDF;
  }
  const PERIOD = () => A.days === 1 ? "today" : `the last ${A.days} days`;
  function pdfStart(J, title, sub) {
    const doc = new J({ unit: "mm", format: "a4" });
    doc.setFillColor(198, 241, 53); doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(23, 21, 15); doc.setFont("times", "bold"); doc.setFontSize(20); doc.text(title, 14, 13);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(sub, 14, 21);
    doc.y = 38;
    return doc;
  }
  function pdfH(doc, t) { if (doc.y > 260) { doc.addPage(); doc.y = 18; } doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(t, 14, doc.y); doc.y += 3; }
  function pdfT(doc, head, body) {
    if (!body.length) body = [[{ content: "No data yet", colSpan: head.length }]];
    doc.autoTable({ startY: doc.y, head: [head], body, theme: "grid", margin: { left: 14, right: 14 },
      headStyles: { fillColor: [23, 21, 15], textColor: 255 }, styles: { fontSize: 9, cellPadding: 1.8 }, alternateRowStyles: { fillColor: [246, 244, 238] } });
    doc.y = doc.lastAutoTable.finalY + 9;
  }
  function pdfKpis(doc, pairs) {
    const w = (182 - 4 * 3) / 4;
    pairs.forEach(([k, v], i) => {
      const x = 14 + (i % 4) * (w + 4), y = doc.y + Math.floor(i / 4) * 21;
      doc.setFillColor(246, 244, 238); doc.roundedRect(x, y, w, 18, 2, 2, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(105, 101, 91); doc.text(k, x + 3, y + 6);
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(23, 21, 15); doc.text(String(v), x + 3, y + 14);
    });
    doc.y += Math.ceil(pairs.length / 4) * 21 + 6;
  }
  function pdfEnd(doc, name) {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(105, 101, 91);
      doc.text(`deal'ke · made ${new Date().toLocaleString("en-GB")} · anonymous data, only visitors who accepted statistics · page ${i}/${n}`, 14, 290);
    }
    doc.save(name);
  }
  const dealStats = store => {
    const ds = (A.deals || []).filter(d => d.store === store), disc = ds.filter(d => d.old_price > d.price).map(d => (d.old_price - d.price) / d.old_price);
    return { n: ds.length, avg: disc.length ? Math.round(100 * disc.reduce((a, b) => a + b, 0) / disc.length) + "%" : "–" };
  };
  async function pdfStore(store) {
    toast("Making the PDF…");
    const [J, rep, deals] = await Promise.all([pdfLib(), rpc("admin_report", { days: A.days, only_store: store }), A.deals || getJSON("data/deals.json")]);
    A.deals = deals || [];
    const all = await rpc("admin_report", { days: A.days });   // the whole site, for the shop's share
    const s = (rep.stores || []).find(x => x.store === store) || {}, p = prevOf(rep, store), ds = dealStats(store);
    const sent = (s.to_store || 0) + (s.directions || 0), sentBefore = (p.to_store || 0) + (p.directions || 0);
    const totalOpens = (all.stores || []).reduce((a, x) => a + (x.opens || 0), 0);
    const doc = pdfStart(J, `What deal'ke did for ${store}`, `Report for ${PERIOD()} · ${day(rep.since)} to ${day(Date.now())}`);
    // the headline a partner cares about: shoppers sent to them
    doc.setFont("times", "bold"); doc.setFontSize(30); doc.text(num(sent), 14, doc.y + 8);
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    doc.text(`shoppers sent to ${store} (${num(s.to_store)} to the website, ${num(s.directions)} asked the route to a shop)`, 14, doc.y + 15);
    doc.text(`${change(sent, sentBefore)} compared with the period before · ${num(s.adds)} ${store} deals put on shopping lists`, 14, doc.y + 21);
    doc.y += 31;
    pdfKpis(doc, [["Visitors who saw " + store, num(s.visits)], ["Deals looked at", `${num(s.opens)} (${change(s.opens || 0, p.opens || 0)})`],
      ["Added to a shopping list", `${num(s.adds)} (${change(s.adds || 0, p.adds || 0)})`], ["Share of all deal views", pct(s.opens || 0, totalOpens)],
      ["Filtered on " + store, num(s.filters)], ["Visitors on deal'ke", num(all.visits)], ["Deals on the site now", num(ds.n)], ["Average discount", ds.avg]]);
    const myAreas = (rep.store_areas || []).filter(a => a.store === store).sort((a, b) => b.visits - a.visits);
    pdfH(doc, "Most popular deals"); pdfT(doc, ["Deal", "Looked at", "Added to list"], (rep.deals || []).filter(d => d.store === store).map(d => [d.label, num(d.opens), num(d.adds)]));
    pdfH(doc, "Categories"); pdfT(doc, ["Category", "Interactions"], (rep.cats || []).map(c => [c.cat, num(c.n)]));
    pdfH(doc, `Where ${store}'s interested shoppers live`); pdfT(doc, ["Region (postcode)", "Visitors"], myAreas.slice(0, 15).map(a => [`${a.area}xx ${AREA_NAME[a.area] || ""}`, num(a.visits)]));
    pdfH(doc, "When they look (Belgian time)"); pdfT(doc, ["Day", "Visits"], (rep.weekdays || []).map(d => [DAYS[d.d], num(d.visits)]));
    pdfH(doc, "Phone or computer"); pdfT(doc, ["Device", "Visitors"], Object.entries(rep.devices || {}).map(([k, n]) => [k, num(n)]));
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(105, 101, 91);
    if (doc.y > 270) { doc.addPage(); doc.y = 18; }
    doc.text(doc.splitTextToSize("Counted anonymously, only for visitors who accepted statistics, so real numbers are higher. No personal data is shared in this report.", 182), 14, doc.y);
    pdfEnd(doc, `dealke-${store.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
  async function pdfBusiness() {
    toast("Making the PDF…");
    const [J, ov, rep, prefs, meta] = await Promise.all([pdfLib(), rpc("admin_overview"), rpc("admin_report", { days: A.days }), rpc("admin_prefs"), A.meta || getJSON("data/meta.json")]);
    const f = rep.funnel || {};
    const doc = pdfStart(J, "deal'ke business report", `${PERIOD()} · ${day(rep.since)} to ${day(Date.now())}`);
    pdfH(doc, "Accounts and money"); doc.y += 2;
    pdfKpis(doc, [["Accounts", num(ov.users)], ["New this week", num(ov.users_7d)], ["New in 30 days", num(ov.users_30d)], ["Active (7 days)", num(ov.active_7d)],
      ["Premium Single", num(ov.single)], ["Premium Family", num(ov.family)], ["People in paid families", num(ov.family_people)], ["Monthly income", money(ov.mrr)],
      ["Stopping at period end", num(ov.canceling)], ["Payment failed", num(ov.past_due)], ["Stopped (30 days)", num(ov.canceled_30d)], ["On the email list", num(ov.opted_in)]]);
    pdfH(doc, "Visitors"); doc.y += 2;
    pdfKpis(doc, [["Visits in period", num(rep.visits)], ["Visits today", num(ov.visits_today)], ["Looked at a deal", pct(f.opened, f.visits)], ["Went to a shop / route", pct(f.to_store, f.visits)]]);
    pdfH(doc, "Per shop"); pdfT(doc, ["Shop", "Visitors", "Looked at", "Added", "Sent to shop", "vs. before"], (rep.stores || []).map(s => [s.store, num(s.visits), num(s.opens), num(s.adds),
      num(s.to_store + s.directions), change(s.to_store + s.directions, (prevOf(rep, s.store).to_store || 0) + (prevOf(rep, s.store).directions || 0))]));
    pdfH(doc, "Most popular deals"); pdfT(doc, ["Deal", "Shop", "Looked at", "Added"], (rep.deals || []).slice(0, 15).map(d => [d.label, d.store, num(d.opens), num(d.adds)]));
    pdfH(doc, "Most searched"); pdfT(doc, ["Search", "Times"], (rep.searches || []).slice(0, 15).map(s => [s.q, num(s.times)]));
    pdfH(doc, "Searched, nothing found"); pdfT(doc, ["Search", "Times"], (rep.no_results || []).slice(0, 15).map(s => [s.q, num(s.times)]));
    const grow = await rpc("admin_growth");
    pdfH(doc, "Growth per month"); pdfT(doc, ["Month", "Accounts", "New", "New Premium", "Visits", "Sent to shops"], grow.slice().reverse().map(g => [mon(g.month), num(g.accounts), num(g.new_accounts), num(g.new_premium), num(g.visit_days), num(g.sent)]));
    pdfH(doc, "Visits per day"); pdfT(doc, ["Day", "Visits", "Deals looked at", "Added"], (rep.by_day || []).map(d => [day(d.day), num(d.visits), num(d.opens), num(d.adds)]));
    pdfH(doc, "Busiest days"); pdfT(doc, ["Day", "Visits"], (rep.weekdays || []).map(d => [DAYS[d.d], num(d.visits)]));
    pdfH(doc, "What account holders chose"); pdfT(doc, ["Favourite shop", "Accounts"], (prefs.shops || []).map(s => [s.shop, num(s.n)]));
    pdfT(doc, ["Diet", "Accounts"], (prefs.diets || []).map(s => [s.diet, num(s.n)]));
    if (meta) { pdfH(doc, "Shop health (this morning's collection)"); pdfT(doc, ["Shop", "Deals collected"], Object.entries(meta.collectors || {}).map(([k, n]) => [k, n ? num(n) : "none: check the collector"])); }
    pdfEnd(doc, `dealke-business-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  boot();
})();
