R = lambda p: open(p, encoding='utf-8').read()
W = lambda p, s: open(p, 'w', encoding='utf-8', newline='\n').write(s)

h = R('index.html')
a = h.index('<!-- Welcome gate'); b = h.index('<!-- Hero -->')
h = h[:a] + R('tools/_gate.html') + '\n' + h[b:]
# close icon: a chevron instead of an X
old = '<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>'
assert old in h
h = h.replace(old, '<symbol id="i-close" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>')
old = '  <p class="foot__note">'
assert old in h
h = h.replace(old, '  <div class="contact" id="contact" hidden></div>\n' + old, 1)
old = '      <div class="kcal-note">'
assert old in h
h = h.replace(old, '      <div class="contact contact--sheet" id="contact2" hidden></div>\n' + old, 1)
old = '<script src="audio.js'
assert old in h
h = h.replace(old, '<script src="data/contact.js?v=8"></script>\n' + old, 1)
h = h.replace('?v=7', '?v=8')
W('index.html', h)

c = R('styles.css')
a = c.index('/* ── Welcome gate'); b = c.index('/* ── Hero (scroll-driven')
c = c[:a] + R('tools/_gate.css') + '\n' + c[b:]
c += '''
/* ── Contact ───────────────────────────────────────────────── */
.contact{max-width:560px;margin:0 auto 34px;text-align:center}
.contact h3{font-family:var(--kufi);font-size:22px;font-weight:600;margin:0 0 6px}
.contact p{margin:0 0 4px;color:var(--stone-2);font-size:14px}
.contact__links{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px}
.contact__links a{display:inline-flex;flex-direction:column;align-items:center;min-width:132px;padding:10px 16px;border-radius:16px;text-decoration:none;
  color:var(--text);background:rgba(255,179,90,.07);border:1px solid rgba(255,179,90,.28);transition:background .3s,border-color .3s,scale .15s}
.contact__links a:hover{background:rgba(255,179,90,.14);border-color:var(--glow)}
.contact__links a:active{scale:.96}
.contact__links b{font-size:14px;font-weight:600}
.contact__links span{font-size:12px;color:var(--muted);direction:ltr;unicode-bidi:isolate}
.contact--sheet{margin:0 0 18px;padding-top:6px}
'''
W('styles.css', c)

j = R('app.js')
old = '}, reduce ? 0 : 1500);'
assert old in j; j = j.replace(old, '}, reduce ? 0 : 2000);')
old = '  /* ── Boot'
assert old in j
j = j.replace(old, '''  /* ── Contact (from data/contact.js; empty fields are skipped) ── */
  {
    const C = window.CONTACT || {}, v = k => String(C[k] || "").trim(), user = k => v(k).replace(/^@/, "");
    const links = [
      v("phone") && ["اتصال", "tel:" + v("phone").replace(/[^\\d+]/g, ""), v("phone")],
      v("whatsapp") && ["واتساب", "https://wa.me/" + v("whatsapp").replace(/\\D/g, ""), v("whatsapp")],
      v("instagram") && ["إنستغرام", "https://instagram.com/" + encodeURIComponent(user("instagram")), "@" + user("instagram")],
      v("snapchat") && ["سناب شات", "https://snapchat.com/add/" + encodeURIComponent(user("snapchat")), "@" + user("snapchat")],
      v("tiktok") && ["تيك توك", "https://tiktok.com/@" + encodeURIComponent(user("tiktok")), "@" + user("tiktok")],
      /^https:\\/\\//.test(v("maps")) && ["الموقع", v("maps"), "Google Maps"],
    ].filter(Boolean);
    if (links.length || v("address") || v("hours")) {
      const html = `<h3>تواصل معنا</h3>
        ${v("address") ? `<p>${esc(v("address"))}</p>` : ""}${v("hours") ? `<p>${esc(v("hours"))}</p>` : ""}
        <div class="contact__links">${links.map(([t, href, sub]) =>
          `<a href="${esc(href)}" target="_blank" rel="noopener"><b>${t}</b><span>${esc(sub)}</span></a>`).join("")}</div>`;
      ["#contact", "#contact2"].forEach(s => { const el = $(s); el.innerHTML = html; el.hidden = false; });
    }
  }

''' + old)
W('app.js', j)
print('ok')
