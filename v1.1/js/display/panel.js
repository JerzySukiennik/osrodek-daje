// Lab panel: ratings + notes → feedback/*.json, screen variant picker, audio jukebox, live tuning, spawn tools.

import { TUNE, TUNE_META, TUNE_DEFAULTS, saveTune, resetTune } from "../shared/tune.js";
import { PROPS, PROP_ORDER } from "../shared/props.js";
import { SCENES } from "../shared/scenes.js";
import { preview, playMusic, stopMusic, currentMusic } from "../view/audio.js";

const RATINGS = [
  ["feel", "Hole movement feel"],
  ["edge", "Objects teetering / tipping in"],
  ["growth", "Growth pacing"],
  ["spit", "Spitting"],
  ["fire", "Fire"],
  ["water", "Water"],
  ["look", "Look & colours"],
  ["characters", "Characters"],
  ["models", "Prop models"],
  ["menu", "Menu as a diorama"],
  ["lobby", "Lobby"],
  ["shop", "Shop"],
  ["sound", "Sound & music"],
  ["pad", "Phone pad"]
];

const KEY = "osrodek.lab3.feedback";

export function createPanel(root, api) {
  let state = { ratings: {}, notes: "", issues: [], screenPicks: {} };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}

  const el = document.createElement("aside");
  el.className = "panel";
  el.hidden = true;
  el.innerHTML = `
    <header><b>LAB PANEL</b><span id="pn-stats"></span><button id="pn-close" title="Close (P)">✕</button></header>
    <nav>
      <button data-tab="review" class="on">Review</button>
      <button data-tab="screens">Screens</button>
      <button data-tab="sound">Sound</button>
      <button data-tab="tune">Tuning</button>
      <button data-tab="tools">Tools</button>
    </nav>
    <section data-pane="review">
      <p class="lead">Rate what you feel, write what is wrong. <b>Save</b> drops a JSON into the project's <code>feedback/</code> folder — that is what Claude reads next.</p>
      <div id="pn-ratings"></div>
      <label class="fl">Notes</label>
      <textarea id="pn-notes" rows="5" placeholder="Anything: what feels off, what is great, ideas…"></textarea>
      <label class="fl">Changes / problems</label>
      <div class="row"><input id="pn-issue" placeholder="One problem or change per line, Enter to add"><button id="pn-add">Add</button></div>
      <ul id="pn-issues"></ul>
      <div class="row end"><span id="pn-saved"></span><button id="pn-save" class="primary">Save feedback</button></div>
    </section>
    <section data-pane="screens" hidden>
      <p class="lead">Every screen is a diorama: drive a hole into a label to press it. Try all three layouts of each and mark the winner.</p>
      <div id="pn-screens"></div>
    </section>
    <section data-pane="sound" hidden>
      <p class="lead">Every sound in the game, grouped by what triggers it. Pick the one you like per group — the game uses your pick immediately and the choice goes into the feedback file. All CC0.</p>
      <div class="row"><label class="vol">Music <input type="range" id="pn-vol-music" min="0" max="1" step="0.05"></label><label class="vol">SFX <input type="range" id="pn-vol-sfx" min="0" max="1" step="0.05"></label><button id="pn-mute">Mute</button></div>
      <div id="pn-sound"></div>
    </section>
    <section data-pane="tune" hidden>
      <p class="lead">Live. Your values are saved in this browser and included in the feedback file.</p>
      <div id="pn-tune"></div>
      <div class="row end"><button id="pn-tune-reset">Reset to defaults</button></div>
    </section>
    <section data-pane="tools" hidden>
      <div class="row"><button id="pn-reset">Reset scene (R)</button><button id="pn-bot">Add bot (B)</button><button id="pn-nobots">Remove bots (N)</button></div>
      <div class="row"><button id="pn-stars">+5 ★</button><button id="pn-crew">Reset crew progress</button></div>
      <label class="fl">Spawn in front of the mouse hole</label>
      <div class="row"><select id="pn-prop"></select><button id="pn-spawn">Spawn</button><button id="pn-spawn5">×5</button></div>
      <label class="fl">Force element on the mouse hole</label>
      <div class="row"><button data-el="fire">Fire</button><button data-el="water">Water</button><button data-el="">None</button></div>
    </section>`;
  root.appendChild(el);

  const btn = document.createElement("button");
  btn.className = "panel-open";
  btn.textContent = "LAB PANEL";
  root.appendChild(btn);

  const $ = (s) => el.querySelector(s);
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  function toggle(force) {
    el.hidden = force == null ? !el.hidden : !force;
    btn.hidden = !el.hidden;
  }
  btn.onclick = () => toggle(true);
  $("#pn-close").onclick = () => toggle(false);

  el.querySelectorAll("nav button").forEach((b) => {
    b.onclick = () => {
      el.querySelectorAll("nav button").forEach((x) => x.classList.toggle("on", x === b));
      el.querySelectorAll("section").forEach((s) => (s.hidden = s.dataset.pane !== b.dataset.tab));
    };
  });

  const ratingsEl = $("#pn-ratings");
  function renderRatings() {
    ratingsEl.innerHTML = "";
    for (const [key, label] of RATINGS) {
      const row = document.createElement("div");
      row.className = "rate";
      row.innerHTML = `<span>${label}</span><div></div>`;
      for (let i = 1; i <= 5; i++) {
        const s = document.createElement("button");
        s.textContent = String(i);
        s.className = state.ratings[key] === i ? "on" : "";
        s.onclick = () => { state.ratings[key] = state.ratings[key] === i ? undefined : i; persist(); renderRatings(); };
        row.lastChild.appendChild(s);
      }
      ratingsEl.appendChild(row);
    }
  }
  renderRatings();

  const notes = $("#pn-notes");
  notes.value = state.notes || "";
  notes.oninput = () => { state.notes = notes.value; persist(); };

  const issuesEl = $("#pn-issues");
  function renderIssues() {
    issuesEl.innerHTML = "";
    state.issues.forEach((text, i) => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = text;
      const x = document.createElement("button");
      x.textContent = "✕";
      x.onclick = () => { state.issues.splice(i, 1); persist(); renderIssues(); };
      li.append(span, x);
      issuesEl.appendChild(li);
    });
  }
  renderIssues();
  const issueInput = $("#pn-issue");
  function addIssue() {
    const v = issueInput.value.trim();
    if (!v) return;
    state.issues.push(v);
    issueInput.value = "";
    persist();
    renderIssues();
  }
  $("#pn-add").onclick = addIssue;
  issueInput.onkeydown = (e) => { if (e.key === "Enter") addIssue(); };

  const screensEl = $("#pn-screens");
  function renderScreens() {
    screensEl.innerHTML = "";
    for (const kind of ["menu", "lobby", "shop"]) {
      const group = document.createElement("div");
      group.className = "variants";
      group.innerHTML = `<label class="fl">${kind}</label>`;
      const row = document.createElement("div");
      row.className = "row";
      SCENES[kind].forEach((scene, i) => {
        const b = document.createElement("button");
        const live = api.scenes().screen === kind && api.scenes().variant[kind] === i;
        b.className = (live ? "on " : "") + (state.screenPicks[kind] === scene.id ? "win" : "");
        b.innerHTML = `<b>${scene.variant}</b> ${scene.title.split("— ")[1] || ""}`;
        b.onclick = () => { api.show(kind, i); renderScreens(); };
        row.appendChild(b);
      });
      const win = document.createElement("button");
      win.textContent = "★ this one wins";
      win.className = "wide";
      win.onclick = () => {
        const cur = api.scenes();
        state.screenPicks[kind] = SCENES[kind][cur.variant[kind]].id;
        persist();
        renderScreens();
      };
      group.append(row, win);
      const picked = state.screenPicks[kind];
      if (picked) {
        const p = document.createElement("small");
        p.className = "picked";
        p.textContent = "winner: " + picked;
        group.appendChild(p);
      }
      screensEl.appendChild(group);
    }
  }
  renderScreens();

  const soundEl = $("#pn-sound");
  function renderSound() {
    soundEl.innerHTML = "";
    const cats = api.audio.categories() || [];
    if (!cats.length) {
      soundEl.innerHTML = "<p class='lead'>No audio manifest found — run <code>python3 Niepotrzebne/build_audio.py</code>.</p>";
      return;
    }
    for (const cat of cats) {
      const list = api.audio.tracksIn(cat.id);
      const group = document.createElement("div");
      group.className = "jukebox";
      group.innerHTML = `<label class="fl">${cat.label} <em>${list.length}</em></label>`;
      const wrap = document.createElement("div");
      wrap.className = "jb-list";
      for (const track of list) {
        const b = document.createElement("button");
        b.className = "jb" + (api.audio.pick(cat.id) === track.id ? " on" : "") + (currentMusic() === track.id ? " playing" : "");
        b.innerHTML = `<b>${track.label}</b><small>${track.seconds}s · ${track.author}</small>`;
        b.title = track.source + " · " + track.license;
        b.onclick = () => {
          api.audio.setPick(cat.id, track.id);
          preview(track.id);
          renderSound();
        };
        wrap.appendChild(b);
      }
      group.appendChild(wrap);
      soundEl.appendChild(group);
    }
    const stop = document.createElement("button");
    stop.textContent = "Stop music";
    stop.className = "wide";
    stop.onclick = () => { stopMusic(); renderSound(); };
    soundEl.appendChild(stop);
  }
  renderSound();

  const volMusic = $("#pn-vol-music");
  const volSfx = $("#pn-vol-sfx");
  const settings = api.audio.settings();
  volMusic.value = settings.music;
  volSfx.value = settings.sfx;
  volMusic.oninput = () => api.audio.setSetting("music", Number(volMusic.value));
  volSfx.oninput = () => api.audio.setSetting("sfx", Number(volSfx.value));
  $("#pn-mute").onclick = () => {
    const muted = !api.audio.settings().muted;
    api.audio.setSetting("muted", muted);
    $("#pn-mute").textContent = muted ? "Unmute" : "Mute";
  };

  $("#pn-save").onclick = async () => {
    const changed = {};
    for (const k of Object.keys(TUNE_DEFAULTS)) if (TUNE[k] !== TUNE_DEFAULTS[k]) changed[k] = TUNE[k];
    const payload = {
      phase: "lab-03", savedAt: new Date().toISOString(), ratings: state.ratings, notes: state.notes,
      issues: state.issues, screenPicks: state.screenPicks, tuneChanged: changed, tune: { ...TUNE },
      session: api.getSnapshot(), screen: `${innerWidth}x${innerHeight}`, stats: { ...api.getStats() }
    };
    const saved = $("#pn-saved");
    try {
      const r = await fetch("/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      saved.textContent = `Saved → ${j.file}`;
    } catch (e) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      a.download = "osrodek-lab03-feedback.json";
      a.click();
      saved.textContent = "No dev server — downloaded the file instead";
    }
  };

  const tuneEl = $("#pn-tune");
  function renderTune() {
    tuneEl.innerHTML = "";
    for (const [key, meta] of Object.entries(TUNE_META)) {
      const row = document.createElement("label");
      row.className = "tune";
      const val = document.createElement("output");
      val.textContent = String(TUNE[key]);
      const input = document.createElement("input");
      input.type = "range";
      input.min = meta.min; input.max = meta.max; input.step = meta.step; input.value = TUNE[key];
      input.oninput = () => { TUNE[key] = Number(input.value); val.textContent = input.value; val.classList.toggle("dirty", TUNE[key] !== TUNE_DEFAULTS[key]); saveTune(); };
      val.classList.toggle("dirty", TUNE[key] !== TUNE_DEFAULTS[key]);
      const name = document.createElement("span");
      name.textContent = meta.label;
      row.append(name, input, val);
      tuneEl.appendChild(row);
    }
  }
  renderTune();
  $("#pn-tune-reset").onclick = () => { resetTune(); renderTune(); };

  $("#pn-reset").onclick = () => api.resetLevel();
  $("#pn-bot").onclick = () => api.addBot();
  $("#pn-nobots").onclick = () => api.removeBots();
  $("#pn-stars").onclick = () => api.shell.award(5);
  $("#pn-crew").onclick = () => api.shell.resetCrew();
  const sel = $("#pn-prop");
  for (const type of PROP_ORDER) {
    const o = document.createElement("option");
    o.value = type;
    o.textContent = PROPS[type].label;
    sel.appendChild(o);
  }
  sel.value = "crate";
  $("#pn-spawn").onclick = () => api.spawn(sel.value);
  $("#pn-spawn5").onclick = () => { for (let i = 0; i < 5; i++) setTimeout(() => api.spawn(sel.value), i * 120); };
  el.querySelectorAll("[data-el]").forEach((b) => (b.onclick = () => api.element(b.dataset.el || null)));

  return {
    toggle,
    refreshScreens: renderScreens,
    tick() {
      const s = api.getStats();
      $("#pn-stats").textContent = `${s.fps} fps · ${s.stepMs.toFixed(1)} ms/step · ${s.props} props · ${s.awake} awake`;
    }
  };
}
