/* deal'ke · keeps the top bar inside the screen on every width (see "a top bar that always fits" in app.css).
   Tries the full bar first, then drops one thing at a time until nothing sticks out. Runs again whenever the
   screen size or the bar's contents change (place name, language, Admin/App/account buttons appearing). */
(() => {
  const top = document.querySelector(".top"), row = top && top.querySelector(".top-row");
  if (!row) return;
  const LEVELS = 5;
  function fit() {
    for (let i = 1; i <= LEVELS; i++) top.classList.remove("fit-" + i);
    let level = 0;
    while (row.scrollWidth > row.clientWidth + 1 && level < LEVELS) top.classList.add("fit-" + ++level);
    // the filter band and the search list sit right under the bar, so they need its real height
    document.documentElement.style.setProperty("--header", Math.round(top.getBoundingClientRect().height) + "px");
  }
  let raf = 0;
  const later = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fit(); }); };
  if ("ResizeObserver" in window) new ResizeObserver(later).observe(row); else addEventListener("resize", later);
  new MutationObserver(later).observe(row, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
  document.fonts?.ready.then(later);
  fit();
})();
