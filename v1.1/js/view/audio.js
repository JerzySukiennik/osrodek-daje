// Real CC0 samples from assets/audio/manifest.json. One pick per category is "live"; the jukebox panel swaps picks.

const KEY = "osrodek.lab3.audio";

let ctx = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let manifest = { categories: [], tracks: [] };
const byCat = new Map();
const buffers = new Map();
const picks = new Map();
let musicEl = null;
let musicId = null;
let settings = { muted: false, music: 0.5, sfx: 0.8 };

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  musicGain = ctx.createGain();
  sfxGain = ctx.createGain();
  musicGain.connect(master);
  sfxGain.connect(master);
  master.connect(ctx.destination);
  applyVolumes();
  return ctx;
}

function applyVolumes() {
  if (!master) return;
  master.gain.value = settings.muted ? 0 : 1;
  sfxGain.gain.value = settings.sfx;
  musicGain.gain.value = settings.music * 0.55;
  if (musicEl) musicEl.volume = settings.muted ? 0 : settings.music * 0.55;
}

export async function loadAudio(url = "assets/audio/manifest.json") {
  try {
    const res = await fetch(url);
    manifest = await res.json();
  } catch (e) {
    console.warn("audio manifest missing", e);
    return manifest;
  }
  for (const t of manifest.tracks) {
    if (!byCat.has(t.cat)) byCat.set(t.cat, []);
    byCat.get(t.cat).push(t);
  }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
  if (saved.settings) settings = { ...settings, ...saved.settings };
  for (const [cat, list] of byCat) {
    const want = saved.picks && saved.picks[cat];
    picks.set(cat, list.some((t) => t.id === want) ? want : list[0].id);
  }
  return manifest;
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ picks: Object.fromEntries(picks), settings }));
  } catch (e) {}
}

export const audio = {
  manifest: () => manifest,
  categories: () => manifest.categories,
  tracksIn: (cat) => byCat.get(cat) || [],
  pick: (cat) => picks.get(cat),
  setPick(cat, id) { picks.set(cat, id); persist(); },
  settings: () => ({ ...settings }),
  setSetting(key, value) { settings[key] = value; applyVolumes(); persist(); },
  trackById: (id) => manifest.tracks.find((t) => t.id === id)
};

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === "suspended") c.resume();
  if (musicEl && musicEl.paused && musicId) musicEl.play().catch(() => {});
}

export function setMuted(m) { settings.muted = m; applyVolumes(); persist(); }

async function bufferFor(track) {
  if (!track) return null;
  if (buffers.has(track.id)) return buffers.get(track.id);
  const c = ensure();
  if (!c) return null;
  const p = fetch(track.file).then((r) => r.arrayBuffer()).then((b) => c.decodeAudioData(b)).catch(() => null);
  buffers.set(track.id, p);
  return p;
}

export function preview(id) {
  const track = audio.trackById(id);
  if (!track) return;
  if (track.cat === "music") { playMusic(id); return; }
  playTrack(track, 1, 1);
}

async function playTrack(track, volume = 1, rate = 1) {
  const c = ensure();
  if (!c || settings.muted || c.state !== "running") return;
  const buf = await bufferFor(track);
  if (!buf) return;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = c.createGain();
  g.gain.value = volume;
  src.connect(g).connect(sfxGain);
  src.start();
}

export function play(cat, { volume = 1, rate = 1 } = {}) {
  const id = picks.get(cat);
  if (!id) return;
  playTrack(audio.trackById(id), volume, rate);
}

export function playMusic(id) {
  const track = audio.trackById(id || picks.get("music"));
  if (!track) return;
  if (musicEl && musicId === track.id && !musicEl.paused) return;
  stopMusic();
  musicEl = new Audio(track.file);
  musicEl.loop = true;
  musicEl.volume = settings.muted ? 0 : settings.music * 0.55;
  musicId = track.id;
  musicEl.play().catch(() => {});
}

export function stopMusic() {
  if (musicEl) { musicEl.pause(); musicEl.src = ""; }
  musicEl = null;
  musicId = null;
}

export function currentMusic() { return musicId; }

export const sfx = {
  swallow(size) {
    if (size > 0.75) play("swallow-big", { rate: 1.1 - Math.min(0.3, size * 0.1) });
    else play("swallow-small", { rate: 1.25 - Math.min(0.5, size * 0.6) });
  },
  bump(force) { play("bump", { volume: Math.min(1, 0.25 + force), rate: 0.9 + Math.random() * 0.3 }); },
  spit(power) { play("spit", { rate: 0.95 + power * 0.35 }); },
  grow() { play("grow", { volume: 0.7 }); },
  burp() { play("pop", { rate: 0.8 }); },
  ignite() { play("fire"); },
  burnout() { play("fire", { volume: 0.5, rate: 0.85 }); },
  steam() { play("steam"); },
  splash() { play("water"); },
  fountain() { play("water", { volume: 0.9, rate: 0.85 }); },
  fuse() { play("whoosh", { volume: 0.5, rate: 1.4 }); },
  liftoff() { play("whoosh", { rate: 1.15 }); },
  explode() { play("explosion"); },
  launch() { play("rocket"); },
  uproot() { play("uproot"); },
  join() { play("join"); },
  leave() { play("ui-back"); },
  select() { play("ui-select"); },
  back() { play("ui-back"); },
  error() { play("ui-error"); },
  buy() { play("buy"); },
  star() { play("star"); },
  jingle() { play("jingle"); },
  dog() { play("dog"); }
};
