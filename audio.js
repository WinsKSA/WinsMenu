/* ونس برو — soundtrack + UI sounds (Web Audio, no files).
   v3: a composed, quiet 8-bar piece in D Hijaz. Soft sine pads on chords that
   belong to the scale (D · Gm · Cm · D), a written bell melody, no drums,
   no crackle. UI sounds run on their own bus so the music fade never mutes them. */
window.WanasAudio = (() => {
  let ctx, comp, musicBus, sfxBus, verb, on = false, timer = null, next = 0, barI = 0;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const BAR = 6.4, BEAT = BAR / 8;

  // chords, all inside D Hijaz (D Eb F# G A Bb C)
  const CHORDS = [
    [50, 57, 62, 66, 69],   // D
    [55, 58, 62, 67, 70],   // Gm
    [48, 55, 60, 63, 67],   // Cm
    [50, 57, 62, 66, 69],   // D
  ];
  // melody: [beat, midi, velocity] per bar, 8 bars
  const MELODY = [
    [[0, 69, 1], [2, 70, .7], [3, 69, .8], [4, 66, .9]],
    [[0, 67, 1], [2, 70, .7], [4, 69, .8], [6, 67, .6]],
    [[0, 75, .9], [2, 74, .7], [3, 72, .7], [4, 70, .8], [6, 67, .6]],
    [[0, 69, 1], [2, 66, .8], [4, 63, .7], [5, 62, .9]],
    [[0, 74, .9], [1.5, 72, .6], [3, 70, .7], [4, 69, .9]],
    [[0, 70, .9], [1, 69, .6], [2, 67, .8], [4, 62, .7], [6, 67, .6]],
    [[0, 72, .9], [2, 75, .7], [3, 74, .7], [4, 72, .8], [6, 70, .6]],
    [[0, 69, 1], [1, 70, .6], [2, 69, .7], [4, 66, .8], [6, 62, .9]],
  ];

  function impulse(sec = 2.8, decay = 3) {
    const len = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .4;
    const master = ctx.createGain(); master.gain.value = .9; comp.connect(master); master.connect(ctx.destination);
    verb = ctx.createConvolver(); verb.buffer = impulse();
    const wet = ctx.createGain(); wet.gain.value = .22; verb.connect(wet); wet.connect(comp);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(comp); musicBus.connect(verb);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(comp); sfxBus.connect(verb);
  }

  // ── instruments ──
  function pad(notes, t) {
    notes.forEach((n, i) => {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
      o.type = "sine"; o.frequency.value = hz(n);
      o2.type = "triangle"; o2.frequency.value = hz(n); o2.detune.value = 5; g2.gain.value = .3;
      f.type = "lowpass"; f.frequency.value = 900; f.Q.value = .3;
      const peak = i === 0 ? .06 : .034;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + 2);
      g.gain.setValueAtTime(peak, t + BAR - .4);
      g.gain.linearRampToValueAtTime(0, t + BAR + 1.8);
      o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(musicBus);
      o.start(t); o2.start(t); o.stop(t + BAR + 2); o2.stop(t + BAR + 2);
    });
  }

  // soft bell: sine + quiet octave, gentle attack, long natural decay
  function bell(n, t, vel, bus, len = 2.2) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = "sine"; o.frequency.value = hz(n);
    o2.type = "sine"; o2.frequency.value = hz(n + 12); g2.gain.value = .22;
    f.type = "lowpass"; f.frequency.value = 2600;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vel, t + .012);
    g.gain.exponentialRampToValueAtTime(.0006, t + len);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(bus);
    o.start(t); o2.start(t); o.stop(t + len + .05); o2.stop(t + len + .05);
  }

  function noise(sec) {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }

  // ── sequencer ──
  function playBar(i, t) {
    pad(CHORDS[i % 4], t);
    const cycle = Math.floor(i / 8), b = i % 8;
    if (cycle % 3 === 2 && b >= 4) return;            // let the pads breathe now and then
    MELODY[b].forEach(([beat, n, v]) => bell(n, t + beat * BEAT, .085 * v, musicBus));
  }
  function schedule() {
    if (next < ctx.currentTime) next = ctx.currentTime + .1;
    while (next < ctx.currentTime + 1.2) { playBar(barI, next); next += BAR; barI++; }
    timer = setTimeout(schedule, 300);
  }

  function setOn(v, delay = 0) {
    init();
    on = v;
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    if (v) {
      musicBus.gain.linearRampToValueAtTime(.55, t + delay + 3);
      if (!timer) { next = Math.max(next, t + delay + .15); schedule(); }
    } else {
      musicBus.gain.linearRampToValueAtTime(0, t + .8);
      clearTimeout(timer); timer = null;
    }
    document.dispatchEvent(new CustomEvent("wanas-sound", { detail: v }));
  }

  // ── UI sounds (own bus, audible immediately) ──
  function blip(freq, dur, vol) {
    if (!on) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * .8, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .006); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + .02);
  }
  function air(t, from, to, dur, vol) {
    const n = noise(dur + .1), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.Q.value = .9;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .4); g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t); n.stop(t + dur + .1);
  }
  function whoosh(up = true) { if (!on) return; air(ctx.currentTime, up ? 300 : 1800, up ? 1800 : 300, .7, .05); }
  function bloom() { if (!on) return; const t = ctx.currentTime; bell(81, t, .045, sfxBus, 1.6); bell(86, t + .09, .035, sfxBus, 1.8); }

  // the gate opening: a deep soft swell, a breath of air, a rising chime, a held D major glow
  function gate() {
    if (!on) return; const t = ctx.currentTime + .03;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(146.8, t + 1.4);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .5); g.gain.linearRampToValueAtTime(0, t + 2.4);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 2.5);
    air(t, 180, 2200, 1.7, .06);
    [62, 69, 74, 78, 81, 86].forEach((m, i) => bell(m, t + .35 + i * .15, .07 - i * .006, sfxBus, 3));
    [62, 66, 69, 74].forEach(m => {
      const p = ctx.createOscillator(), pg = ctx.createGain();
      p.type = "sine"; p.frequency.value = hz(m);
      pg.gain.setValueAtTime(0, t + .9); pg.gain.linearRampToValueAtTime(.03, t + 2); pg.gain.linearRampToValueAtTime(0, t + 4.6);
      p.connect(pg); pg.connect(sfxBus); p.start(t + .9); p.stop(t + 4.7);
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!ctx || !on) return;
    if (document.hidden) { clearTimeout(timer); timer = null; ctx.suspend(); }
    else ctx.resume().then(() => { if (on && !timer) { next = ctx.currentTime + .2; schedule(); } });
  });

  return {
    get on() { return on; },
    toggle() { setOn(!on); }, start(delay = 0) { setOn(true, delay); }, stop() { if (ctx) setOn(false); },
    tick: () => blip(1320, .05, .03), tap: () => blip(520, .1, .04),
    whoosh, bloom, gate,
  };
})();
