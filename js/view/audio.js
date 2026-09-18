// Placeholder synth SFX (WebAudio) until the real, rated audio set arrives in phase 3.

let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === "suspended") c.resume();
}

export function setMuted(m) { muted = m; }

function tone(type, f0, f1, dur, gain, delay = 0) {
  const c = ensure();
  if (!c || muted || c.state !== "running") return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, gain, freq, q = 0.8, type = "bandpass") {
  const c = ensure();
  if (!c || muted || c.state !== "running") return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export const sfx = {
  swallow(size) {
    const base = 520 / (0.6 + size * 1.6);
    tone("sine", base * 1.8, base * 0.5, 0.16 + size * 0.06, 0.5);
    if (size > 0.8) tone("triangle", 120, 45, 0.35, 0.5, 0.03);
  },
  spit(power) { tone("square", 160, 620 + power * 500, 0.16, 0.18); noise(0.12, 0.2, 1800); },
  burp() { tone("sawtooth", 140, 70, 0.18, 0.12); },
  ignite() { noise(0.35, 0.3, 900, 0.5); },
  burnout() { noise(0.25, 0.22, 400, 0.6, "lowpass"); },
  steam() { noise(0.9, 0.3, 5200, 0.4, "highpass"); },
  splash() { noise(0.3, 0.35, 1400, 0.7); tone("sine", 500, 180, 0.2, 0.2); },
  fountain() { noise(1.0, 0.3, 2600, 0.5); },
  fuse() { noise(0.5, 0.12, 6000, 2); },
  liftoff() { tone("sawtooth", 300, 1400, 0.9, 0.12); noise(0.9, 0.18, 3000, 0.6); },
  explode() { noise(0.5, 0.6, 300, 0.4, "lowpass"); tone("sine", 140, 40, 0.5, 0.6); tone("square", 1800, 900, 0.12, 0.08, 0.05); },
  launch() { noise(3.5, 0.5, 220, 0.4, "lowpass"); tone("sawtooth", 60, 140, 3.2, 0.25); },
  uproot() { tone("triangle", 220, 90, 0.2, 0.25); },
  join() { tone("sine", 440, 440, 0.1, 0.25); tone("sine", 660, 660, 0.14, 0.25, 0.1); },
  leave() { tone("sine", 440, 300, 0.2, 0.2); }
};
