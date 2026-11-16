/* ونس برو — menu engine v2 */
(() => {
  "use strict";
  const MENU = window.MENU || [];
  const A = window.WanasAudio;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ar = n => String(n).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
  const fmt = p => (p == null ? "" : Number.isInteger(p) ? String(p) : p.toFixed(2));
  const SAR = '<svg class="sar" aria-label="ريال"><use href="#sar"/></svg>';
  const DAILY = 2000;
  const mid = p => p ? p.replace("assets/img/", "assets/mid/") : p;
  const isParty = s => /حفلات/.test(s.name);
  const store = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  const ALLERGENS = [
    ["الأسماك ومنتجاتها", "مثل لحوم الأسماك وزيت السمك"],
    ["البيض ومنتجاته", "مثل المايونيز"],
    ["الحبوب المحتوية على الجلوتين", "مثل القمح والشعير والشوفان والشيلم، سواء الأنواع الأصلية أو المهجنة أو منتجاتها"],
    ["القشريات ومنتجاتها", "مثل الربيان، سرطان البحر (السلطعون)، جراد البحر (اللوبستر)"],
    ["الحليب ومنتجاته (التي تحتوي على اللاكتوز)", "مثل الحليب والحليب المنكّه"],
    ["الخردل ومنتجاته", "مثل بذور الخردل، زيت الخردل، صلصة الخردل"],
    ["الرخويات ومنتجاتها", "مثل الحبار، الحلزون البحري، بلح البحر، والإسكالوب"],
    ["الفول السوداني ومنتجاته", "مثل زبدة الفول السوداني"],
    ["الكبريتيت", "بتركيز ١٠ جزء في المليون أو أكثر"],
    ["الكرفس ومنتجاته", "مثل بذور الكرفس وملح الكرفس"],
    ["المكسرات ومنتجاتها", "مثل الكاجو والفستق وغيرها"],
    ["فول الصويا ومنتجاته", "مثل حليب الصويا"],
    ["لوبين (الترمس ومنتجاته)", "مثل زيت الترمس"],
  ];

  const ALL = [];
  MENU.forEach((cat, ci) => cat.sections.forEach((sec, si) => sec.items.forEach((it, ii) => {
    it._k = `${ci}.${si}.${ii}`; it._sec = sec; it._cat = cat; ALL.push(it);
  })));
  const byKey = k => ALL.find(i => i._k === k);
  const TITLES = ["المطعم", "الكافيه"], KICK = ["RESTAURANT", "CAFÉ"];

  let mode = +store.get("wanas-mode") === 1 ? 1 : 0;

  /* ── Sound toggle ────────────────────────────────────── */
  const snd = document.createElement("button");
  snd.className = "snd"; snd.setAttribute("aria-label", "تشغيل/إيقاف الموسيقى");
  snd.innerHTML = `<span class="eq"><i></i><i></i><i></i><i></i></span><span class="snd__t">الموسيقى</span>`;
  document.body.appendChild(snd);
  const sndUI = v => { snd.classList.toggle("on", v); $(".snd__t", snd).textContent = v ? "الموسيقى تعمل" : "الموسيقى متوقفة"; snd.setAttribute("aria-pressed", v); };
  sndUI(false);
  snd.addEventListener("click", () => A && A.toggle());
  document.addEventListener("wanas-sound", e => sndUI(e.detail));

  /* ── Welcome gate ────────────────────────────────────── */
  const intro = $("#intro");
  function openGate(withSound) {
    if (!document.body.classList.contains("is-intro") || intro.classList.contains("opening")) return;
    if (withSound && A) { A.start(1.6); A.gate(); }
    intro.classList.add("opening");
    setTimeout(() => {
      document.body.classList.remove("is-intro");
      $$(".hero .reveal").forEach(el => el.classList.add("in"));
      startCounters();
    }, reduce ? 0 : 1500);
    store.set("wanas-intro", "1");
  }
  // gate effects: equalizer bars under the logo + sparks rising inside the arch
  $("#viz").innerHTML = Array.from({ length: 33 }, (_, i) => {
    const edge = 1 - Math.abs(i - 16) / 16;                       // taller toward the centre
    return `<i style="--h:${(.25 + edge * .75).toFixed(2)};animation-duration:${(.7 + Math.random() * .9).toFixed(2)}s;animation-delay:-${(Math.random() * 1.5).toFixed(2)}s"></i>`;
  }).join("");
  $("#portalFx").insertAdjacentHTML("beforeend", Array.from({ length: 16 }, () =>
    `<b class="spark" style="left:${(4 + Math.random() * 92).toFixed(1)}%;--s:${(2 + Math.random() * 4).toFixed(1)}px;animation-duration:${(5 + Math.random() * 6).toFixed(1)}s;animation-delay:-${(Math.random() * 10).toFixed(1)}s"></b>`).join(""));

  const forceIntro = new URLSearchParams(location.search).has("intro");
  if (reduce || (store.get("wanas-intro") === "1" && !forceIntro)) {
    intro.classList.add("opening"); document.body.classList.remove("is-intro");
    requestAnimationFrame(() => $$(".hero .reveal").forEach(el => el.classList.add("in")));
  } else {
    $("#enter").addEventListener("click", e => { e.stopPropagation(); openGate(true); });
    $("#enterQuiet").addEventListener("click", e => { e.stopPropagation(); openGate(false); });
    setTimeout(() => $("#enter").focus({ preventScroll: true }), 2500);
  }

  /* ── Hero stats, marquee, tiles ──────────────────────── */
  const count = c => c.sections.reduce((a, s) => a + s.items.length, 0);
  $("#heroStats").innerHTML = [
    [ALL.length, "صنف"],
    [MENU.reduce((a, c) => a + c.sections.length, 0), "قسم"],
    [MENU.length, "قائمة"],
  ].map(([n, l]) => `<div class="stat"><b data-count="${n}">${ar(0)}</b><span>${l}</span></div>`).join("");

  const names = MENU.flatMap(c => c.sections.map(s => s.name));
  const strip = names.map(n => `<span>${esc(n)}</span><b>◆</b>`).join("");
  $("#marquee").innerHTML = strip + strip;

  const tileImg = [
    (MENU[0]?.sections.find(s => /بيتزا/.test(s.name)) || MENU[0]?.sections[0])?.img,
    MENU[1]?.sections[0]?.img,
  ];
  $("#modeTiles").innerHTML = MENU.map((c, i) => `
    <button class="tile reveal" data-mode="${i}">
      <img class="tile__img" src="${esc(mid(tileImg[i]))}" alt="" loading="lazy" decoding="async">
      <span class="tile__arrow" aria-hidden="true">←</span>
      <div class="tile__body">
        <div class="tile__k">${KICK[i]}</div>
        <div class="tile__t">${TITLES[i]}</div>
        <div class="tile__m">${ar(count(c))} صنف · ${ar(c.sections.length)} أقسام</div>
      </div>
    </button>`).join("");

  const seg = $("#seg");
  seg.insertAdjacentHTML("beforeend", MENU.map((c, i) =>
    `<button role="tab" data-mode="${i}" aria-selected="${i === mode}">${TITLES[i]}</button>`).join(""));
  $$("[data-mode]").forEach(b => b.addEventListener("click", () => {
    const fromTile = b.classList.contains("tile");
    setMode(+b.dataset.mode, true);
    if (fromTile) scrollToEl($("#bar"), 0);
  }));

  /* ── Rendering ───────────────────────────────────────── */
  function plate(it, big = false) {
    if (!it.img) return `<div class="plate plate--empty" aria-hidden="true"><i></i></div>`;
    const src = big ? mid(it.img) : (it.thumb || it.img);
    return `<div class="plate"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></div>`;
  }
  function kcal(it) {
    if (!it.cal) return "";
    const p = Math.min(100, it.cal / DAILY * 100);
    return `<span class="kcal" title="${ar(p.toFixed(0))}٪ من ٢٠٠٠ سعرة يومياً"><span class="kcal__m"><i style="--p:${p.toFixed(1)}%"></i></span>${ar(it.cal)} سعرة</span>`;
  }
  function card(it, i, sec) {
    if (isParty(sec)) {
      let d = it.desc, ppl = "";
      const m = d.match(/\s*(\d+\s*-\s*\d+|\d+)\s*(أشخاص|اشخاص)\s*$/);
      if (m) { ppl = m[1].replace(/\s*-\s*/, "–"); d = d.slice(0, m.index); }
      const parts = d.split(/\s*-\s*/).map(s => s.trim()).filter(Boolean);
      return `<button class="card pkg" data-k="${it._k}" style="transition-delay:${i * 80}ms">
        ${plate(it, true)}
        <div class="card__b">
          <p class="card__n">${esc(it.name)}</p>
          <ul class="pkg__list">${parts.map(p => `<li><svg><use href="#i-check"/></svg>${esc(p)}</li>`).join("")}</ul>
          <div class="card__f">
            <span class="price">${fmt(it.price)} ${SAR}</span>
            ${ppl ? `<span class="pkg__ppl"><svg><use href="#i-people"/></svg>${ar(ppl)} أشخاص</span>` : ""}
          </div>
        </div></button>`;
    }
    const hero = i === 0 && (sec.items.length > 2 || sec.items.length === 1);
    return `<button class="card${hero ? " card--hero" : ""}" data-k="${it._k}" style="transition-delay:${(i % 2) * 60}ms">
      ${plate(it, hero)}
      <div class="card__b">
        <p class="card__n">${esc(it.name)}</p>
        ${it.desc ? `<p class="card__d">${esc(it.desc)}</p>` : ""}
        <div class="card__f"><span class="price">${fmt(it.price)} ${SAR}</span>${kcal(it)}</div>
      </div></button>`;
  }
  // word-level split: Arabic letters must stay joined inside each word
  const splitChars = s => s.split(/\s+/).map((w, i) => `<span class="ch" style="transition-delay:${.2 + i * .12}s">${esc(w)}</span>`).join(" ");

  function flow(c) {
    return `<section class="flow" aria-label="أقسام ${TITLES[mode]}">
      <div class="flow__h"><h3>تصفّح الأقسام</h3><small>اسحب ←</small></div>
      <div class="flow__track" id="flow">${c.sections.map((s, si) => `
        <button class="fc" data-go="${si}">
          ${s.img ? `<img src="${esc(mid(s.img))}" alt="" decoding="async">` : ""}
          <div class="fc__b"><div class="fc__no">${ar(String(si + 1).padStart(2, "0"))}</div>
            <div class="fc__t">${esc(s.name)}</div><div class="fc__m">${ar(s.items.length)} صنف</div></div>
        </button>`).join("")}</div></section>`;
  }

  function render() {
    const c = MENU[mode];
    $("#menu").innerHTML = flow(c) + c.sections.map((s, si) => {
      const cals = s.items.filter(i => i.cal).map(i => i.cal);
      return `<section class="sec" id="s-${si}" data-si="${si}" aria-labelledby="h-${si}">
        <div class="banner">
          ${s.img ? `<img src="${esc(mid(s.img))}" alt="" loading="lazy" decoding="async">` : ""}
          <div class="banner__b">
            <div class="sec__no">${ar(String(si + 1).padStart(2, "0"))}</div>
            <h2 class="sec__title" id="h-${si}" aria-label="${esc(s.name)}">${splitChars(s.name)}</h2>
            <div class="sec__meta">
              <span>${ar(s.items.length)} ${s.items.length > 2 && s.items.length < 11 ? "أصناف" : "صنف"}</span>
              ${cals.length ? `<span><svg style="color:var(--glow)"><use href="#i-flame"/></svg>${ar(Math.min(...cals))}–${ar(Math.max(...cals))} سعرة</span>` : ""}
            </div>
          </div>
        </div>
        <div class="grid">${s.items.map((it, i) => card(it, i, s)).join("")}</div>
      </section>`;
    }).join("");

    const rail = $("#rail");
    $$(".chip", rail).forEach(x => x.remove());
    rail.insertAdjacentHTML("beforeend", c.sections.map((s, si) => `<button class="chip" data-go="${si}">${esc(s.name)}</button>`).join(""));
    $$("[data-go]").forEach(ch => ch.addEventListener("click", () => { A?.tick(); scrollToEl($("#s-" + ch.dataset.go), barH() - 2); }));

    // once the first screen is up, pull the rest of the photos in the background
    setTimeout(() => $$("#menu img[loading=lazy]").forEach(im => { im.loading = "eager"; }), 1200);
    observe();
    wireTilt();
    wireFlow();
    setActive(0);
  }

  function scrollToEl(el, offset) {
    window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - offset, behavior: reduce ? "auto" : "smooth" });
  }

  function setMode(m, user) {
    const changed = m !== mode;
    mode = m; store.set("wanas-mode", m);
    seg.dataset.i = m;
    $$("button", seg).forEach(b => b.setAttribute("aria-selected", +b.dataset.mode === m));
    $$(".tile").forEach(t => t.classList.toggle("is-active", +t.dataset.mode === m));
    if (!changed && user) return;
    if (user && !reduce) {
      A?.whoosh(m === 1);
      const sw = $("#sweep"); sw.classList.remove("go"); void sw.offsetWidth; sw.classList.add("go");
      const main = $("#menu");
      main.animate([{ opacity: 1, filter: "blur(0)" }, { opacity: 0, filter: "blur(10px)" }], { duration: 260, easing: "ease-in", fill: "forwards" })
        .finished.then(() => {
          render();
          const top = $("#bar").getBoundingClientRect().top + scrollY;
          if (scrollY > top) window.scrollTo({ top, behavior: "auto" });
          main.animate([{ opacity: 0, filter: "blur(10px)", transform: "translateY(20px)" }, { opacity: 1, filter: "blur(0)", transform: "none" }],
            { duration: 600, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
        });
    } else render();
  }

  /* ── Observers ───────────────────────────────────────── */
  let io, spy;
  function observe() {
    io?.disconnect(); spy?.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px 25% 0px", threshold: 0 });
    $$(".reveal:not(.in), .card, .sec").forEach(el => io.observe(el));
    spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setActive(+e.target.dataset.si); }),
      { rootMargin: `-${barH() + 10}px 0px -65% 0px` });
    $$(".sec").forEach(s => spy.observe(s));
  }
  if (reduce) $$(".reveal").forEach(el => el.classList.add("in"));

  const barH = () => $("#bar").offsetHeight;
  let activeI = -1;
  function setActive(i) {
    const rail = $("#rail"), chips = $$(".chip", rail), ch = chips[i];
    if (!ch) return;
    activeI = i;
    chips.forEach((c, k) => c.classList.toggle("is-on", k === i));
    placeInk();
    rail.scrollTo({ left: ch.offsetLeft - rail.clientWidth / 2 + ch.offsetWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }
  function placeInk() {
    const rail = $("#rail"), ch = $(".chip.is-on", rail), ink = $(".rail__ink", rail);
    if (!ch) return;
    // offsetLeft is in the rail's content coordinates, so the ink scrolls with the chips
    ink.style.width = ch.offsetWidth + "px";
    ink.style.transform = `translateX(${ch.offsetLeft}px)`;
  }

  /* ── Coverflow ───────────────────────────────────────── */
  function wireFlow() {
    const tr = $("#flow"); if (!tr) return;
    const upd = () => {
      const r = tr.getBoundingClientRect(), mid = r.left + r.width / 2;
      $$(".fc", tr).forEach(fc => {
        const b = fc.getBoundingClientRect(), d = Math.max(-1.5, Math.min(1.5, (b.left + b.width / 2 - mid) / b.width));
        fc.style.setProperty("--d", d.toFixed(3)); fc.style.setProperty("--ad", Math.min(1, Math.abs(d)).toFixed(3));
      });
    };
    tr.addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true });
    requestAnimationFrame(upd);
    // start centred on the first card (rtl)
    tr.scrollLeft = 0;
  }

  /* ── Card tilt + glow following the pointer ──────────── */
  function wireTilt() {
    if (!fine || reduce) return;
    $$(".card, .tile").forEach(c => {
      c.addEventListener("pointermove", e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.classList.add("tilt");
        c.style.setProperty("--ry", ((x - .5) * 8).toFixed(2) + "deg");
        c.style.setProperty("--rx", ((.5 - y) * 8).toFixed(2) + "deg");
        c.style.setProperty("--gx", (x * 100).toFixed(1) + "%"); c.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      });
      c.addEventListener("pointerleave", () => { c.classList.remove("tilt"); c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ── Scroll-linked motion ────────────────────────────── */
  const hero = $(".hero");
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = innerHeight;
      const hp = Math.max(0, Math.min(1, scrollY / (hero.offsetHeight - vh)));
      if (!reduce) hero.style.setProperty("--p", hp.toFixed(3));
      if (!reduce) $$(".banner img").forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.transform = `translate3d(0,${(p * 12).toFixed(2)}%,0) scale(1.02)`;
      });
      const m = $("#menu"), mt = m.offsetTop, mh = m.offsetHeight;
      $("#progress").style.transform = `scaleX(${Math.max(0, Math.min(1, (scrollY + vh * .5 - mt) / mh)).toFixed(3)})`;
      $("#toTop").classList.toggle("show", scrollY > vh * 1.4);
      document.documentElement.style.setProperty("--bar-h", barH() + "px");
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => { onScroll(); placeInk(); });
  $("#toTop").addEventListener("click", () => { A?.whoosh(true); window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  // relight the sign on tap
  $("#heroMark").addEventListener("click", () => {
    const m = $("#heroMark"); m.classList.remove("relight"); void m.offsetWidth; m.classList.add("relight"); A?.bloom();
  });

  // counters
  let counted = false;
  function startCounters() {
    if (counted) return; counted = true;
    $$("[data-count]").forEach((el, k) => {
      const n = +el.dataset.count, t0 = performance.now() + k * 120, d = 1600;
      if (reduce) { el.textContent = ar(n); return; }
      const step = t => { const kk = Math.max(0, Math.min(1, (t - t0) / d)), e = 1 - Math.pow(1 - kk, 4);
        el.textContent = ar(Math.round(n * e)); if (kk < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  if (!document.body.classList.contains("is-intro")) setTimeout(startCounters, 500);

  /* ── Embers: pre-rendered sprite, light follows pointer ─ */
  let tx = 50, ty = 44, cx = 50, cy = 44, heroVisible = true;
  hero.addEventListener("pointermove", e => { tx = e.clientX / innerWidth * 100; ty = e.clientY / innerHeight * 100; });
  hero.addEventListener("pointerleave", () => { tx = 50; ty = 44; });
  const cv = $("#embers"), ctx = cv.getContext("2d");
  const sprite = document.createElement("canvas"); sprite.width = sprite.height = 64;
  { const s = sprite.getContext("2d"), g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,215,150,1)"); g.addColorStop(.25, "rgba(255,160,70,.55)"); g.addColorStop(1, "rgba(255,120,40,0)");
    s.fillStyle = g; s.fillRect(0, 0, 64, 64); }
  let W = 0, H = 0, parts = [];
  function sizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: Math.round(Math.min(80, (W * H) / 8000)) }, () => spawn(true));
  }
  const spawn = any => ({ x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: 3 + Math.random() * 10,
    vy: .2 + Math.random() * .7, vx: (Math.random() - .5) * .2, a: .25 + Math.random() * .6, ph: Math.random() * 6.28 });
  function frame(t) {
    if (heroVisible && !reduce) {
      cx += (tx - cx) * .05; cy += (ty - cy) * .05;
      hero.style.setProperty("--mx", (cx + Math.sin(t / 2600) * 3).toFixed(2) + "%");
      hero.style.setProperty("--my", cy.toFixed(2) + "%");
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        p.y -= p.vy; p.x += p.vx + Math.sin(t / 900 + p.ph) * .3;
        if (p.y < -20) Object.assign(p, spawn(false));
        ctx.globalAlpha = p.a * (.55 + .45 * Math.sin(t / 280 + p.ph));
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(es => heroVisible = es[0].isIntersecting).observe($(".hero__stage"));
  addEventListener("resize", sizeCanvas);
  sizeCanvas();
  if (!reduce) requestAnimationFrame(frame);

  /* ── Dialogs ─────────────────────────────────────────── */
  let lastFocus = null;
  function openDlg(el) {
    lastFocus = document.activeElement;
    el.hidden = false; document.body.classList.add("is-locked");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("open")));
    setTimeout(() => (el.querySelector("input") || el.querySelector("[data-close].icon-btn") || el).focus({ preventScroll: true }), 80);
  }
  function closeDlg(el) {
    if (!el || el.hidden) return;
    el.classList.remove("open"); A?.tap();
    const done = () => { el.hidden = true; if (!$$(".sheet:not([hidden]), .search:not([hidden])").length) document.body.classList.remove("is-locked"); lastFocus?.focus?.({ preventScroll: true }); };
    reduce ? done() : setTimeout(done, 600);
  }
  $$("[data-close]").forEach(b => b.addEventListener("click", () => closeDlg(b.closest(".sheet, .search"))));

  // swipe a sheet down to dismiss (phones)
  $$(".sheet").forEach(sh => {
    const card = $(".sheet__card", sh);
    let y0 = null, dy = 0;
    card.addEventListener("touchstart", e => { if (card.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    card.addEventListener("touchmove", e => {
      if (y0 == null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0) { card.classList.add("dragging"); card.style.transform = `translateY(${dy}px)`; }
    }, { passive: true });
    card.addEventListener("touchend", () => {
      if (y0 == null) return;
      card.classList.remove("dragging"); card.style.transform = "";
      if (dy > 110) closeDlg(sh);
      y0 = null;
    });
  });
  addEventListener("keydown", e => { if (e.key === "Escape") $$(".sheet:not([hidden]), .search:not([hidden])").forEach(closeDlg); });

  /* ── Item sheet with shared-element flight ───────────── */
  function openItem(it, fromEl) {
    const sheet = $("#sheet"), media = $("#sheetMedia");
    media.innerHTML = it.img ? `<img src="${esc(mid(it.img))}" alt="${esc(it.name)}">` : `<div class="plate plate--empty" style="height:100%"><i></i></div>`;
    let viz = "";
    if (it.cal) {
      const pct = Math.min(100, it.cal / DAILY * 100), C = 2 * Math.PI * 32;
      const sc = it._sec.items.filter(i => i.cal).map(i => i.cal);
      const lo = Math.min(...sc), hi = Math.max(...sc), pos = hi === lo ? 50 : ((it.cal - lo) / (hi - lo)) * 100;
      viz = `<div class="sheet__row"><div class="ring">
          <svg viewBox="0 0 76 76" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd29a"/><stop offset="1" stop-color="#ff8a2b"/></linearGradient></defs>
            <circle class="bg" cx="38" cy="38" r="32"/><circle class="fg" cx="38" cy="38" r="32" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C * (1 - pct / 100)}"/></svg>
          <div class="ring__t"><b>${ar(it.cal)} سعرة</b><span>${ar(pct.toFixed(1))}٪ من الاحتياج اليومي (٢٠٠٠)</span></div>
        </div></div>
        ${sc.length > 1 ? `<div class="compare">مقارنة بأصناف «${esc(it._sec.name)}»
          <div class="compare__bar">${sc.map(v => `<i style="left:${hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100}%"></i>`).join("")}<b style="left:${pos}%"></b></div>
          <div style="display:flex;justify-content:space-between;direction:ltr;font-size:11px"><span>${lo}</span><span>${hi}</span></div></div>` : ""}`;
    }
    $("#sheetBody").innerHTML = `
      <p class="kicker">${esc(TITLES[MENU.indexOf(it._cat)])} · ${esc(it._sec.name)}</p>
      <h2 class="sheet__title" id="sheetTitle">${esc(it.name)}</h2>
      ${it.desc ? `<p class="sheet__desc">${esc(it.desc)}</p>` : ""}
      <div class="sheet__row"><span style="color:var(--muted);font-size:13px">السعر</span><span class="price">${fmt(it.price)} ${SAR}</span></div>
      ${viz}`;
    openDlg(sheet); A?.bloom();

    // FLIP: fly the card photo into the sheet header
    const src = fromEl && fromEl.querySelector(".plate img");
    if (src && !reduce) {
      const a = src.getBoundingClientRect();
      const fly = document.createElement("div"); fly.className = "fly";
      fly.innerHTML = `<img src="${esc(src.currentSrc || src.src)}" alt="">`;
      Object.assign(fly.style, { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px" });
      document.body.appendChild(fly);
      media.style.opacity = "0";
      setTimeout(() => {
        const b = media.getBoundingClientRect();
        const anim = fly.animate([
          { left: a.left + "px", top: a.top + "px", width: a.width + "px", height: a.height + "px", borderRadius: "20px" },
          { left: b.left + "px", top: b.top + "px", width: b.width + "px", height: b.height + "px", borderRadius: "30px 30px 0 0" },
        ], { duration: 650, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" });
        anim.finished.then(() => { media.style.opacity = ""; fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished.then(() => fly.remove()); });
      }, 160);
    }
    setTimeout(() => { const fg = $(".ring .fg", sheet); if (fg) fg.style.strokeDashoffset = fg.dataset.off; }, 200);
  }
  document.addEventListener("click", e => {
    const c = e.target.closest("[data-k]");
    if (!c) return;
    const it = byKey(c.dataset.k);
    if (c.closest("#search")) { closeDlg($("#search")); setTimeout(() => it && openItem(it, null), 300); return; }
    if (it) openItem(it, c);
  });

  /* ── Search ──────────────────────────────────────────── */
  const norm = s => String(s).toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  ALL.forEach(i => i._n = norm(`${i.name} ${i.desc} ${i._sec.name}`));
  function search(q) {
    const nq = norm(q.trim()), box = $("#results");
    if (!nq) { box.innerHTML = `<p class="empty">اكتب اسم صنف أو قسم</p>`; return; }
    const words = nq.split(/\s+/);
    const hits = ALL.filter(i => words.every(w => i._n.includes(w))).slice(0, 40);
    box.innerHTML = hits.length ? hits.map((it, k) => `
      <button class="hit" data-k="${it._k}" style="animation-delay:${k * 30}ms">
        ${plate(it)}
        <span><b>${esc(it.name)}</b><small>${esc(TITLES[MENU.indexOf(it._cat)])} · ${esc(it._sec.name)}</small></span>
        <span class="price" style="font-size:15px">${fmt(it.price)} ${SAR}</span>
      </button>`).join("") : `<p class="empty">لا توجد نتائج لـ «${esc(q)}»</p>`;
  }
  $("#q").addEventListener("input", e => search(e.target.value));
  $("#openSearch").addEventListener("click", e => {
    const r = e.currentTarget.getBoundingClientRect(), s = $("#search");
    s.style.setProperty("--ox", (r.left + r.width / 2) + "px"); s.style.setProperty("--oy", (r.top + r.height / 2) + "px");
    $("#q").value = ""; search(""); openDlg(s); A?.whoosh(true);
  });

  /* ── Info ────────────────────────────────────────────── */
  $("#allergens").innerHTML = ALLERGENS.map(([b, s]) => `<li><b>${esc(b)}</b><span>${esc(s)}</span></li>`).join("");
  ["#openInfo", "#openInfo2"].forEach(s => $(s).addEventListener("click", () => { openDlg($("#info")); A?.bloom(); }));

  /* ── Boot ────────────────────────────────────────────── */
  seg.dataset.i = mode;
  setMode(mode, false);
  $$(".tile").forEach(t => t.classList.toggle("is-active", +t.dataset.mode === mode));
  onScroll();
})();
