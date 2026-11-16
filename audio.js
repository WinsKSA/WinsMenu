/* ونس برو — generative lounge soundtrack + UI sounds (Web Audio, no files).
   Warm pad on a slow chord loop, an oud-like pluck improvising in maqam Hijaz on D,
   a soft frame-drum pulse and vinyl crackle, all through a generated reverb. */
window.WanasAudio = (() => {
  let ctx, master, music, sfx, verb, on = false, started = false, timer = null, step = 0;
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // D Hijaz: D Eb F# G A Bb C
  const HIJAZ = [62, 63, 66, 67, 69, 70, 72, 74, 75, 78, 79, 81];
  // chords (midi): Dm(add9) · Bbmaj7 · Gm9 · A7sus→A7(b9) — hijaz-friendly cadence
  const CHORDS = [[50, 57, 62, 65, 69, 76], [46, 53, 57, 62, 65, 69], [43, 50, 58, 62, 65, 69], [45, 52, 57, 61, 64, 70]];
  const BAR = 4.8; // seconds per chord

  function impulse(sec = 3.2, decay = 2.6) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(master);
    verb = ctx.createConvolver(); verb.buffer = impulse();
    const wet = ctx.createGain(); wet.gain.value = .55; verb.connect(wet); wet.connect(comp);
    music = ctx.createGain(); music.gain.value = .9; music.connect(comp); music.connect(verb);
    sfx = ctx.createGain(); sfx.gain.value = .7; sfx.connect(comp); sfx.connect(verb);
    crackle();
  }

  function pad(notes, t) {
    notes.forEach((n, i) => {
      for (const det of [-7, 6]) {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = i < 1 ? "sine" : "sawtooth"; o.frequency.value = hz(n); o.detune.value = det;
        f.type = "lowpass"; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1100, t + BAR * .5); f.frequency.linearRampToValueAtTime(600, t + BAR);
        f.Q.value = .5;
        const peak = i < 1 ? .09 : .022;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 1.4); g.gain.setValueAtTime(peak, t + BAR - .6); g.gain.linearRampToValueAtTime(0, t + BAR + 1.2);
        o.connect(f); f.connect(g); g.connect(music); o.start(t); o.stop(t + BAR + 1.4);
      }
    });
  }

  function pluck(n, t, vel = .18) {
    // oud-ish: bright saw → resonant lowpass with fast envelope + slight pitch fall
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = "sawtooth"; o2.type = "triangle";
    o.frequency.setValueAtTime(hz(n) * 1.006, t); o.frequency.exponentialRampToValueAtTime(hz(n), t + .08);
    o2.frequency.value = hz(n) * 2;
    f.type = "lowpass"; f.Q.value = 6; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(420, t + .5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .005); g.gain.exponentialRampToValueAtTime(.0008, t + 1.3);
    const g2 = ctx.createGain(); g2.gain.value = .25;
    o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(music);
    o.start(t); o2.start(t); o.stop(t + 1.4); o2.stop(t + 1.4);
  }

  function drum(t, low = true, vel = .35) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(low ? 110 : 220, t); o.frequency.exponentialRampToValueAtTime(low ? 48 : 120, t + .18);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(.001, t + (low ? .45 : .16));
    o.connect(g); g.connect(music); o.start(t); o.stop(t + .5);
    if (!low) { // slap texture
      const n = noise(.08), nf = ctx.createBiquadFilter(), ng = ctx.createGain();
      nf.type = "bandpass"; nf.frequency.value = 2400; ng.gain.setValueAtTime(vel * .35, t); ng.gain.exponentialRampToValueAtTime(.001, t + .08);
      n.connect(nf); nf.connect(ng); ng.connect(music); n.start(t);
    }
  }

  function noise(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = b; return s;
  }

  function crackle() {
    const len = ctx.sampleRate * 4, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() < .0009 ? (Math.random() * 2 - 1) * .6 : (Math.random() * 2 - 1) * .006;
    const s = ctx.createBufferSource(); s.buffer = b; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 900;
    const g = ctx.createGain(); g.gain.value = .35; s.connect(f); f.connect(g); g.connect(music); s.start();
  }

  // phrase generator: wandering stepwise motion in hijaz, resolving to chord tones
  let idx = 4;
  function bar(t) {
    const chord = CHORDS[step % CHORDS.length];
    pad(chord, t);
    // dum-tek rhythm (maqsum-lite): D . T . . T D . T .
    const beat = BAR / 8;
    [[0, 1], [3, 0], [4, 1], [6, 0]].forEach(([b, low]) => drum(t + b * beat, !!low, low ? .14 : .06));
    // melody: 5–8 notes per bar
    const n = 5 + Math.floor(Math.random() * 4);
    let tt = t + beat * .5;
    for (let k = 0; k < n; k++) {
      idx = Math.max(0, Math.min(HIJAZ.length - 1, idx + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
      const note = HIJAZ[idx];
      pluck(note, tt, .06 + Math.random() * .05);
      if (Math.random() < .25) pluck(note, tt + beat * .25, .05); // tremolo flick
      tt += beat * [.5, 1, 1, 1.5][Math.floor(Math.random() * 4)];
      if (tt > t + BAR - beat * .5) break;
    }
    step++;
  }

  function loop() {
    let next = ctx.currentTime + .1;
    const tick = () => {
      while (next < ctx.currentTime + 1.5) { bar(next); next += BAR; }
      timer = setTimeout(tick, 400);
    };
    tick();
  }

  function setOn(v) {
    init();
    on = v;
    if (ctx.state === "suspended") ctx.resume();
    if (v && !started) { started = true; loop(); }
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(v ? .32 : 0, t + (v ? 5 : .6));
    try { localStorage.setItem("wanas-sound", v ? "1" : "0"); } catch (e) {}
    document.dispatchEvent(new CustomEvent("wanas-sound", { detail: v }));
  }

  // ── UI sounds ──
  function blip(freq = 880, dur = .09, type = "sine", vol = .12) {
    if (!on) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * .7, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + .02);
  }
  function whoosh(up = true) {
    if (!on) return; const t = ctx.currentTime, n = noise(.9), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(up ? 300 : 2400, t); f.frequency.exponentialRampToValueAtTime(up ? 2600 : 300, t + .8);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.22, t + .3); g.gain.exponentialRampToValueAtTime(.001, t + .9);
    n.connect(f); f.connect(g); g.connect(sfx); n.start(t);
  }
  function bloom() { if (!on) return; const t = ctx.currentTime; [74, 78, 81].forEach((m, i) => pluck(m, t + i * .06, .1)); }
  function gate() {
    if (!on) return; const t = ctx.currentTime;
    whoosh(true);
    [50, 57, 62, 66, 69, 74].forEach((m, i) => pluck(m, t + .25 + i * .14, .07));
  }

  return {
    get on() { return on; },
    toggle() { setOn(!on); }, start() { setOn(true); }, stop() { if (ctx) setOn(false); },
    tick: () => blip(1200, .05, "triangle", .07), tap: () => blip(660, .12, "sine", .1),
    whoosh, bloom, gate,
  };
})();
