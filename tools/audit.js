// Mobile layout audit: run in the page. Returns problems found at the current viewport.
window.__audit = async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const vw = document.documentElement.clientWidth, out = { vw, vh: innerHeight, modes: {} };
  for (const m of [0, 1]) {
    document.querySelector(`.seg [data-mode="${m}"]`).click();
    await wait(1100);
    // walk the page so every card reveals and every lazy image is requested
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += innerHeight * 0.8) { window.scrollTo(0, y); await wait(60); }
    await wait(1800);
    const r = { pageWidth: document.documentElement.scrollWidth, wide: [], smallTap: [], tinyText: [], brokenImg: 0, notRevealed: 0, clippedText: [] };
    const seenTap = new Set(), seenTxt = new Set();
    document.querySelectorAll("#menu *, .bar *, .modes *, .foot *").forEach(el => {
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
      const inRail = el.closest(".rail, .flow__track, .marquee");
      if (!inRail && (b.right > vw + 1 || b.left < -1)) r.wide.push(el.className || el.tagName);
      if (el.matches("button, a") && (b.width < 40 || b.height < 34)) { const k = el.className + "|" + Math.round(b.width) + "x" + Math.round(b.height); if (!seenTap.has(k)) { seenTap.add(k); r.smallTap.push(k); } }
      if (el.children.length === 0 && el.textContent.trim()) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 10.5) { const k = (el.className || el.tagName) + "|" + fs; if (!seenTxt.has(k)) { seenTxt.add(k); r.tinyText.push(k); } }
      }
    });
    document.querySelectorAll(".card__n").forEach(el => { if (el.scrollWidth > el.clientWidth + 1) r.clippedText.push(el.textContent.trim().slice(0, 24)); });
    const imgs = [...document.querySelectorAll("#menu img")];
    r.images = imgs.length;
    r.brokenImg = imgs.filter(i => i.complete && i.naturalWidth === 0).length;
    r.pendingImg = imgs.filter(i => !i.complete).length;
    r.notRevealed = [...document.querySelectorAll(".card")].filter(c => !c.classList.contains("in")).length;
    r.cards = document.querySelectorAll(".card").length;
    r.wide = [...new Set(r.wide)].slice(0, 8);
    // upscaling: how many card photos are drawn larger than their real pixels at this screen density
    const dpr = 3;
    r.softPhotos = [...document.querySelectorAll(".card .plate img")].filter(i => i.naturalWidth && i.getBoundingClientRect().width * dpr > i.naturalWidth * 1.15).length;
    out.modes[m] = r;
  }
  window.scrollTo(0, 0);
  return out;
};
