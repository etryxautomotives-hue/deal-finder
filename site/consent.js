/* deal'ke cookie banner and anonymous statistics.
   The law (GDPR + Belgian ePrivacy rules): nothing for statistics is stored or sent until the visitor says yes,
   "No" is as easy as "Yes", and they can change their mind any time (footer link "Cookies").
   What is sent after "Yes": a random id for this visit (not linked to an account), what was opened, added or searched,
   phone or computer, language and the first two digits of the postcode. No email, no account, no IP is saved.
   window.DKTrack(kind, {store, cat, label, n}) is a no-op without consent. */
(function () {
  "use strict";
  const KEY = "dk.consent", V = 1, ASK_AGAIN = 182 * 864e5;  // ask again after 6 months
  const CFG = window.DK_CONFIG || {};
  const T = {
    nl: { t: "Mogen we meten wat werkt?", p: "We willen anoniem tellen welke deals en winkels bekeken worden, zodat we de site beter maken. Niet wie jij bent: geen naam, geen e-mail. Je lijst en instellingen bewaren we altijd op je toestel, dat is nodig om de site te laten werken.", yes: "Akkoord", no: "Weigeren", more: "Meer info", priv: "Privacy", link: "Cookies" },
    fr: { t: "On peut mesurer ce qui marche ?", p: "Nous aimerions compter anonymement les promos et magasins consultés, pour améliorer le site. Pas qui vous êtes : ni nom, ni e-mail. Votre liste et vos réglages restent toujours sur votre appareil, c’est nécessaire au fonctionnement du site.", yes: "Accepter", no: "Refuser", more: "En savoir plus", priv: "Confidentialité", link: "Cookies" },
    en: { t: "May we measure what works?", p: "We'd like to count, anonymously, which deals and shops get looked at, so we can improve the site. Not who you are: no name, no email. Your list and settings always stay on your device, the site needs that to work.", yes: "Accept", no: "Reject", more: "More info", priv: "Privacy", link: "Cookies" },
  };
  const lang = () => { try { const l = JSON.parse(localStorage.getItem("dk.lang") || "null"); if (T[l]) return l; } catch { /* */ } const h = document.documentElement.lang; return T[h] ? h : "nl"; };
  const read = () => { try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); return c && c.v === V && Date.now() - c.at < ASK_AGAIN ? c : null; } catch { return null; } };
  let choice = read();
  const ok = () => !!choice?.stats && !!CFG.supabaseUrl && !!CFG.supabaseAnonKey;

  function save(stats) {
    choice = { v: V, stats: !!stats, at: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch { /* private mode: ask again next time */ }
    if (!stats) { Q.length = 0; try { sessionStorage.removeItem("dk.visit"); } catch { /* */ } }
    hide();
  }
  let box;
  function show() {
    const L = T[lang()];
    if (!box) { box = document.createElement("div"); box.className = "ck"; box.setAttribute("role", "dialog"); box.setAttribute("aria-labelledby", "ckT"); document.body.append(box); }
    box.innerHTML = `<div class="ck-in"><div class="ck-txt"><b id="ckT">${L.t}</b><p>${L.p} <a href="privacy.html">${L.more}</a></p></div>
      <div class="ck-btns"><button type="button" class="ck-b" data-ck="0">${L.no}</button><button type="button" class="ck-b" data-ck="1">${L.yes}</button></div></div>`;
    box.hidden = false;
    box.querySelectorAll("[data-ck]").forEach(b => b.addEventListener("click", () => save(b.dataset.ck === "1")));
  }
  function hide() { if (box) box.hidden = true; }
  // footer link to change the choice
  function footLink() {
    const f = document.querySelector(".foot .wrap"); if (!f || f.querySelector(".ck-link")) return;
    const L = T[lang()], p = document.createElement("p"); p.className = "ck-links";
    p.innerHTML = `<a href="privacy.html">${L.priv}</a> · <button type="button" class="ck-link linkish">${L.link}</button>`;
    p.querySelector("button").addEventListener("click", show);
    f.append(p);
  }

  // ---------- anonymous statistics ----------
  const Q = [];
  function visit() {
    try { let v = sessionStorage.getItem("dk.visit"); if (!v) { v = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => (b % 36).toString(36)).join(""); sessionStorage.setItem("dk.visit", v); } return v; }
    catch { return "x" + Math.random().toString(36).slice(2, 12).padEnd(10, "0"); }
  }
  const device = () => { const w = Math.min(screen.width || innerWidth, innerWidth); return w < 600 ? "phone" : w < 1024 ? "tablet" : "desktop"; };
  const area = () => { try { const pc = JSON.parse(localStorage.getItem("dk.pc") || "null"); const m = String(pc || "").match(/\d{2}/); return m ? m[0] : null; } catch { return null; } };
  function track(kind, d = {}) {
    if (!ok()) return;
    Q.push({ visit: visit(), kind, store: d.store || null, cat: d.cat || null, label: d.label ? String(d.label).slice(0, 80) : null,
      n: Number.isFinite(d.n) ? d.n : null, lang: lang(), device: device(), area: area() });
    if (Q.length >= 20) flush();
  }
  function flush() {
    if (!Q.length || !ok()) return;
    const batch = Q.splice(0, 40);
    fetch(CFG.supabaseUrl.replace(/\/$/, "") + "/rest/v1/rpc/track", {
      method: "POST", keepalive: true,
      headers: { "Content-Type": "application/json", apikey: CFG.supabaseAnonKey, Authorization: "Bearer " + CFG.supabaseAnonKey },
      body: JSON.stringify({ batch }),
    }).catch(() => { /* statistics never get in the way */ });
  }
  setInterval(flush, 8000);
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  addEventListener("pagehide", flush);

  window.DKTrack = track;
  window.DKConsent = { show, get stats() { return ok(); } };
  const start = () => { footLink(); if (!choice) show(); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
