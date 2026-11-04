/* deal'ke profile pictures: twelve friendly faces drawn here (no image files, nothing from elsewhere),
   or a photo from the device, which is cut to a small square in the browser before it is saved.
   window.DKAvatars.html(avatar, size) draws either kind: "a:<key>" or a data:image URL. */
(function (root) {
  // bg, face, then the extras that make each one: ears, cheeks, beak, glasses, hair
  const A = {
    fox:    { bg: "#F7EBD2", face: "#E07A2E", ears: "pointy", snout: "#FFF6EA", eye: "#17150F" },
    cat:    { bg: "#EEF9CF", face: "#9A8F80", ears: "pointy", snout: "#E9E3D8", eye: "#17150F", whiskers: true },
    bear:   { bg: "#F7EBD2", face: "#8B5E3C", ears: "round", snout: "#D9B48F", eye: "#17150F" },
    rabbit: { bg: "#EFECE4", face: "#FFFFFF", ears: "long", snout: "#F6D3DA", eye: "#17150F", line: "#D8D2C6" },
    panda:  { bg: "#EEF9CF", face: "#FFFFFF", ears: "round", earC: "#17150F", patches: true, eye: "#FFFFFF", line: "#D8D2C6" },
    frog:   { bg: "#F7EBD2", face: "#7CC242", ears: "frog", eye: "#17150F", cheeks: "#F4A6A6" },
    owl:    { bg: "#EFECE4", face: "#B07F1E", ears: "tufts", eye: "#17150F", beak: "#D9A23A", rings: "#FFF6EA" },
    pig:    { bg: "#EEF9CF", face: "#F4B6C2", ears: "pointy", snout: "#E98FA4", eye: "#17150F", nostrils: true },
    lion:   { bg: "#F7EBD2", face: "#E9B44C", mane: "#B9761F", ears: "round", snout: "#FFF0D1", eye: "#17150F" },
    girl:   { bg: "#EEF9CF", face: "#F2C9A0", hair: "long", hairC: "#5A3A22", eye: "#17150F", cheeks: "#F4A6A6" },
    boy:    { bg: "#F7EBD2", face: "#C68E5E", hair: "short", hairC: "#17150F", eye: "#17150F" },
    grandpa:{ bg: "#EFECE4", face: "#F2C9A0", hair: "bald", hairC: "#D8D2C6", glasses: true, eye: "#17150F", beard: "#E9E3D8" },
  };
  const KEYS = Object.keys(A);

  function svg(key) {
    const a = A[key] || A.fox, p = [];
    p.push(`<rect width="64" height="64" rx="32" fill="${a.bg}"/>`);
    if (a.mane) p.push(`<circle cx="32" cy="34" r="25" fill="${a.mane}"/>`);
    if (a.hair === "long") p.push(`<path d="M12 40c0-16 9-26 20-26s20 10 20 26v12H12z" fill="${a.hairC}"/>`);
    const ec = a.earC || a.face;
    if (a.ears === "pointy") p.push(`<path d="M13 26 16 8l12 10zM51 26 48 8 36 18z" fill="${ec}"/>`);
    if (a.ears === "round") p.push(`<circle cx="16" cy="17" r="7" fill="${ec}"/><circle cx="48" cy="17" r="7" fill="${ec}"/>`);
    if (a.ears === "long") p.push(`<rect x="17" y="2" width="9" height="24" rx="4.5" fill="${ec}" stroke="${a.line}"/><rect x="38" y="2" width="9" height="24" rx="4.5" fill="${ec}" stroke="${a.line}"/>`);
    if (a.ears === "tufts") p.push(`<path d="M14 22 12 9l10 7zM50 22l2-13-10 7z" fill="${ec}"/>`);
    if (a.ears === "frog") p.push(`<circle cx="20" cy="21" r="8" fill="${a.face}"/><circle cx="44" cy="21" r="8" fill="${a.face}"/>`);
    p.push(`<circle cx="32" cy="35" r="19" fill="${a.face}"${a.line ? ` stroke="${a.line}"` : ""}/>`);
    if (a.hair === "short") p.push(`<path d="M13 32c0-12 8-18 19-18s19 6 19 18c-6-6-12-8-19-8s-13 2-19 8z" fill="${a.hairC}"/>`);
    if (a.hair === "long") p.push(`<path d="M14 30c3-9 10-13 18-13s15 4 18 13c-8-3-14-6-18-10-4 4-10 7-18 10z" fill="${a.hairC}"/>`);
    if (a.hair === "bald") p.push(`<path d="M13 34c0-3 1-6 2-8M51 34c0-3-1-6-2-8" stroke="${a.hairC}" stroke-width="4" stroke-linecap="round"/>`);
    if (a.patches) p.push(`<ellipse cx="24" cy="33" rx="6" ry="7.5" fill="#17150F"/><ellipse cx="40" cy="33" rx="6" ry="7.5" fill="#17150F"/>`);
    if (a.rings) p.push(`<circle cx="24" cy="32" r="7.5" fill="${a.rings}"/><circle cx="40" cy="32" r="7.5" fill="${a.rings}"/>`);
    const ey = a.ears === "frog" ? 21 : 32, ex = a.ears === "frog" ? [20, 44] : [24, 40];
    if (a.ears === "frog") p.push(`<circle cx="20" cy="21" r="4.5" fill="#fff"/><circle cx="44" cy="21" r="4.5" fill="#fff"/>`);
    p.push(`<circle cx="${ex[0]}" cy="${ey}" r="2.6" fill="${a.eye}"/><circle cx="${ex[1]}" cy="${ey}" r="2.6" fill="${a.eye}"/>`);
    if (a.glasses) p.push(`<g fill="none" stroke="#17150F" stroke-width="1.8"><circle cx="24" cy="32" r="5.5"/><circle cx="40" cy="32" r="5.5"/><path d="M29.5 32h5"/></g>`);
    if (a.snout) p.push(`<ellipse cx="32" cy="42" rx="8" ry="6" fill="${a.snout}"/>`);
    if (a.nostrils) p.push(`<circle cx="29.5" cy="42" r="1.4" fill="#B5576F"/><circle cx="34.5" cy="42" r="1.4" fill="#B5576F"/>`);
    else if (a.snout) p.push(`<ellipse cx="32" cy="40" rx="2.6" ry="2" fill="#17150F"/>`);
    if (a.beak) p.push(`<path d="M28 39h8l-4 6z" fill="${a.beak}"/>`);
    if (a.beard) p.push(`<path d="M18 40c3 9 8 12 14 12s11-3 14-12c-4 3-9 4-14 4s-10-1-14-4z" fill="${a.beard}"/>`);
    if (a.cheeks) p.push(`<circle cx="20" cy="41" r="3" fill="${a.cheeks}" opacity=".7"/><circle cx="44" cy="41" r="3" fill="${a.cheeks}" opacity=".7"/>`);
    if (a.whiskers) p.push(`<path d="M14 40h9M14 44l9-2M50 40h-9M50 44l-9-2" stroke="#6E6862" stroke-width="1.2" stroke-linecap="round"/>`);
    if (!a.snout && !a.beak) p.push(`<path d="M27 44q5 4 10 0" fill="none" stroke="#17150F" stroke-width="2" stroke-linecap="round"/>`);
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${p.join("")}</svg>`;
  }

  const ok = v => typeof v === "string" && (/^a:[a-z]+$/.test(v) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v));
  // one avatar as HTML: a built-in face, or a photo (only our own small data URLs, so it can't load anything)
  function html(v, size = 40, label = "") {
    const s = `width:${size}px;height:${size}px`, alt = String(label).replace(/[&<>"']/g, "");
    if (ok(v) && v.startsWith("data:")) return `<img class="av" src="${v}" alt="${alt}" style="${s}">`;
    const key = ok(v) ? v.slice(2) : "fox";
    return `<span class="av" style="${s}" role="img" aria-label="${alt}">${svg(key)}</span>`;
  }
  // a photo from the device: cut to the middle square, 160 x 160, JPEG (about 10 kB)
  function fromFile(file) {
    return new Promise((res, rej) => {
      if (!file || !/^image\//.test(file.type)) return rej(new Error("not an image"));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const n = Math.min(img.naturalWidth, img.naturalHeight), c = document.createElement("canvas");
        c.width = c.height = 160;
        c.getContext("2d").drawImage(img, (img.naturalWidth - n) / 2, (img.naturalHeight - n) / 2, n, n, 0, 0, 160, 160);
        URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("unreadable")); };
      img.src = url;
    });
  }

  const api = { KEYS, svg, html, ok, fromFile };
  if (typeof module === "object" && module.exports) module.exports = api; else root.DKAvatars = api;
})(typeof window !== "undefined" ? window : globalThis);
