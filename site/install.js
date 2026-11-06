/* deal'ke as an app: "Download de app" button, iPhone/iPad add-to-home-screen hint, offline note,
   and one offer to switch on the daily alert the first time the app is opened from its icon.
   No app store: the site itself installs (web app manifest + sw.js). Loaded after app.js. */
(() => {
  const W = {
    nl: {
      btn: "Download de app", short: "App",
      line: "werkt op iPhone, Android en computer, zonder app store, gratis.",
      iosT: "Zet deal'ke op je beginscherm",
      ios1: "Tik onderaan op <b>Deel</b>", ios2: "Kies <b>Zet op beginscherm</b>", ios3: "Tik op <b>Voeg toe</b>. deal'ke staat nu tussen je apps.",
      iosNote: "Apple laat apps buiten de App Store alleen zo installeren. Het duurt 5 seconden.",
      otherT: "Installeer deal'ke",
      other1: "Open het menu van je browser (⋮ of ☰)", other2: "Kies <b>App installeren</b> of <b>Toevoegen aan startscherm</b>",
      ok: "Begrepen", close: "Sluiten", done: "deal'ke staat op je toestel",
      offline: d => `Geen internet. Je ziet de promo's${d ? ` van ${d}` : ""} en je eigen lijst.`,
      pushT: "Elke dag een seintje?", pushP: "Eén bericht per dag als iets van je lijst in promo is. Je kan het altijd uitzetten.",
      pushYes: "Zet aan", pushNo: "Nee, bedankt",
    },
    fr: {
      btn: "Télécharger l’app", short: "App",
      line: "fonctionne sur iPhone, Android et ordinateur, sans app store, gratuit.",
      iosT: "Mettez deal'ke sur votre écran d’accueil",
      ios1: "Touchez <b>Partager</b> en bas", ios2: "Choisissez <b>Sur l’écran d’accueil</b>", ios3: "Touchez <b>Ajouter</b>. deal'ke est maintenant parmi vos apps.",
      iosNote: "Apple n’autorise que cette façon d’installer une app hors App Store. Cela prend 5 secondes.",
      otherT: "Installer deal'ke",
      other1: "Ouvrez le menu du navigateur (⋮ ou ☰)", other2: "Choisissez <b>Installer l’application</b> ou <b>Ajouter à l’écran d’accueil</b>",
      ok: "Compris", close: "Fermer", done: "deal'ke est installé sur votre appareil",
      offline: d => `Pas d’internet. Vous voyez les promos${d ? ` du ${d}` : ""} et votre liste.`,
      pushT: "Un rappel chaque jour ?", pushP: "Un message par jour quand un produit de votre liste est en promo. Vous pouvez l’arrêter à tout moment.",
      pushYes: "Activer", pushNo: "Non merci",
    },
    en: {
      btn: "Download the app", short: "App",
      line: "works on iPhone, Android and computer, no app store, free.",
      iosT: "Put deal'ke on your home screen",
      ios1: "Tap <b>Share</b> at the bottom", ios2: "Choose <b>Add to Home Screen</b>", ios3: "Tap <b>Add</b>. deal'ke is now with your apps.",
      iosNote: "This is the only way Apple allows apps from outside the App Store. It takes 5 seconds.",
      otherT: "Install deal'ke",
      other1: "Open your browser menu (⋮ or ☰)", other2: "Choose <b>Install app</b> or <b>Add to Home screen</b>",
      ok: "Got it", close: "Close", done: "deal'ke is on your device",
      offline: d => `No internet. You're seeing the deals${d ? ` from ${d}` : ""} and your own list.`,
      pushT: "A daily heads-up?", pushP: "One message a day when something on your list is on promo. You can switch it off any time.",
      pushYes: "Switch on", pushNo: "No thanks",
    },
  };
  const lang = () => (W[document.documentElement.lang] ? document.documentElement.lang : "nl");
  const L = () => W[lang()];
  const $ = s => document.querySelector(s);
  const get = k => { try { return localStorage.getItem("dk_" + k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem("dk_" + k, v); } catch { /* private mode */ } };
  const ios = typeof isIOS !== "undefined" ? isIOS : /iP(hone|ad|od)/.test(navigator.userAgent);
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const mobile = ios || /Android|Mobi/i.test(navigator.userAgent);
  const track = (e, p) => { try { typeof trk === "function" && trk(e, p || {}); } catch { /* stats are optional */ } };
  let prompt = null;   // Chrome/Edge/Samsung: the browser's own install question, saved for our button

  // The service worker keeps the last copy of the site and the deals for when there is no internet.
  if ("serviceWorker" in navigator) {
    addEventListener("load", async () => {
      try {
        const reg = await navigator.serviceWorker.register("sw.js");
        await navigator.serviceWorker.ready;
        // files loaded before the worker took over: hand it their addresses so the app also opens offline
        const here = [location.href.split("#")[0], ...performance.getEntriesByType("resource").map(e => e.name)]
          .filter(u => u.startsWith(location.origin));
        (reg.active || navigator.serviceWorker.controller)?.postMessage({ type: "keep", urls: here });
      } catch { /* the site works without it */ }
    });
  }

  // ---------- the button ----------
  const icon = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v7m-3-3 3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const canOffer = () => !standalone() && (prompt || ios || mobile);

  function paint() {
    const T = L(), show = canOffer();
    const top = $("#appBtn"), foot = $("#appLine");
    if (top) {
      top.hidden = !show || !mobile;   // in the top bar only on phones and tablets; computers get the footer line
      top.innerHTML = `${icon}<span class="lbl">${T.short}</span>`;
      top.setAttribute("aria-label", T.btn);
    }
    if (foot) {
      foot.hidden = !show;
      foot.innerHTML = `<button type="button" class="btn outline sm" data-app>${icon}<span>${T.btn}</span></button> <span>${T.line}</span>`;
    }
    const off = $("#offNote");
    if (off) {
      off.hidden = navigator.onLine;
      if (!navigator.onLine) {
        const when = typeof UPDATED !== "undefined" && UPDATED ? new Date(UPDATED).toLocaleDateString(lang() === "en" ? "en-GB" : lang() + "-BE", { weekday: "long", day: "numeric", month: "long" }) : "";
        off.textContent = T.offline(when);
      }
    }
  }

  async function install() {
    track("app_install_click", { label: prompt ? "prompt" : ios ? "ios" : "menu" });
    if (prompt) {
      const p = prompt; prompt = null;
      p.prompt();
      const { outcome } = await p.userChoice.catch(() => ({ outcome: "dismissed" }));
      track("app_install_" + outcome);
      paint();
      return;
    }
    hint();
  }

  // ---------- iPhone / other-browser instructions ----------
  const shareIc = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const plusIc = `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  let back = null;
  function dlg(html) {
    let bg = $("#appDlg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "scrim"; bg.id = "appDlg"; bg.hidden = true;
      bg.addEventListener("click", e => { if (e.target === bg || e.target.closest("[data-app-close]")) shut(); });
      document.body.append(bg);
    }
    back = document.activeElement;
    bg.innerHTML = html; bg.hidden = false;
    document.body.style.overflow = "hidden";
    bg.querySelector(".pop-actions .btn")?.focus();
    return bg;
  }
  function shut() {
    const bg = $("#appDlg"); if (!bg || bg.hidden) return;
    bg.hidden = true; document.body.style.overflow = ""; back?.focus?.();
  }
  addEventListener("keydown", e => { if (e.key === "Escape") shut(); });

  function hint() {
    const T = L();
    const steps = ios
      ? [[shareIc, T.ios1], [plusIc, T.ios2], [`<b class="appnum">✓</b>`, T.ios3]]
      : [[`<b class="appnum">⋮</b>`, T.other1], [plusIc, T.other2]];
    dlg(`<div class="pop apphint" role="dialog" aria-modal="true" aria-labelledby="appT">
      <img class="appicon" src="apple-touch-icon.png" alt="" width="64" height="64">
      <h3 id="appT">${ios ? T.iosT : T.otherT}</h3>
      <ol class="appsteps">${steps.map(([i, s]) => `<li><span class="ic">${i}</span><span>${s}</span></li>`).join("")}</ol>
      ${ios ? `<p class="muted">${T.iosNote}</p>` : ""}
      <div class="pop-actions"><button type="button" class="btn" data-app-close>${T.ok}</button></div>
    </div>`);
  }

  // ---------- first time opened from the icon: offer the daily alert once ----------
  function firstOpen() {
    if (!standalone() || get("appSeen")) return;
    set("appSeen", "1");
    track("app_first_open", { label: ios ? "ios" : "other" });
    const acc = $("#accBtn");
    const pushOk = typeof pushCan === "function" && pushCan() && !(typeof S !== "undefined" && S.pushOn) && acc && !acc.hidden;
    if (!pushOk) return;
    const T = L();
    const bg = dlg(`<div class="pop apphint" role="dialog" aria-modal="true" aria-labelledby="appT">
      <img class="appicon" src="apple-touch-icon.png" alt="" width="64" height="64">
      <h3 id="appT">${T.pushT}</h3><p>${T.pushP}</p>
      <div class="pop-actions"><button type="button" class="btn ghost" data-app-close>${T.pushNo}</button><button type="button" class="btn" data-app-push>${T.pushYes}</button></div>
    </div>`);
    bg.querySelector("[data-app-push]").addEventListener("click", () => { shut(); track("app_push_yes"); acc.click(); });
  }

  // ---------- wiring ----------
  addEventListener("beforeinstallprompt", e => { e.preventDefault(); prompt = e; paint(); });
  addEventListener("appinstalled", () => {
    prompt = null; track("app_installed"); paint();
    try { typeof toast === "function" && toast(L().done); } catch { /* fine */ }
  });
  addEventListener("online", paint);
  addEventListener("offline", paint);
  document.addEventListener("click", e => { if (e.target.closest("#appBtn,[data-app]")) install(); });
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  paint();
  setTimeout(() => { paint(); firstOpen(); }, 600);   // after app.js has loaded the deals and signed in
})();
