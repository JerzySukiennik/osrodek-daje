// Screen flow: menu → lobby → level select → level → results, plus the shop. Every screen is a
// real diorama you drive a hole around; buttons are tagged props, so "click" means "swallow".

import { SCENES, SHOP_ITEMS, labelsFor, buildSelectScene, selectLabels } from "../shared/scenes.js";
import { LEVELS, STARS_PER_LEVEL, levelById } from "../shared/levels.js";

const KEY = "osrodek.crew";

export function createShell({ load, respawn, fx, sfx, music, players }) {
  let saved = { spent: 0, owned: [], variant: { menu: 0, lobby: 0, shop: 0 }, progress: {} };
  try { saved = { ...saved, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}

  const state = {
    screen: "menu", scene: null, owned: saved.owned, variant: saved.variant,
    progress: saved.progress || {}, spent: saved.spent || 0, claimed: new Map(), level: null
  };

  const earnedTotal = () => Object.values(state.progress).reduce((n, list) => n + list.length, 0);
  const stars = () => earnedTotal() - state.spent;
  state.starsOf = stars;

  const persist = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ spent: state.spent, owned: state.owned, variant: state.variant, progress: state.progress }));
    } catch (e) {}
  };

  function labelState() {
    const slots = [];
    for (const [idx, id] of state.claimed) {
      const p = players.get(id);
      if (p) slots[idx] = { name: p.name, color: p.color };
    }
    return { stars: stars(), owned: state.owned, slots, ready: state.claimed.size };
  }

  function refreshLabels() {
    if (!state.scene) return;
    if (state.scene.kind === "level") fx.setLabels([]);
    else if (state.scene.kind === "select") fx.setLabels(selectLabels(state.scene, STARS_PER_LEVEL));
    else fx.setLabels(labelsFor(state.scene, labelState()));
  }

  function nextLevel() {
    const unfinished = LEVELS.find((l) => !(state.progress[l.id] || []).includes("finish"));
    return unfinished || LEVELS[0];
  }

  function show(screen, arg) {
    state.screen = screen;
    if (screen === "level") {
      const lvl = typeof arg === "string" ? levelById(arg) : nextLevel();
      state.level = lvl;
      state.scene = lvl;
    } else if (screen === "select") {
      state.level = null;
      state.scene = buildSelectScene(LEVELS, state.progress);
    } else {
      state.level = null;
      const list = SCENES[screen];
      const idx = arg == null ? state.variant[screen] : arg;
      state.variant[screen] = Math.max(0, Math.min(list.length - 1, idx));
      state.scene = list[state.variant[screen]];
      if (screen === "lobby") state.claimed.clear();
    }
    persist();
    load(state.scene);
    refreshLabels();
    music(state.scene.kind);
  }

  function finishLevel(levelId, earnedIds) {
    const had = state.progress[levelId] || [];
    const merged = Array.from(new Set([...had, ...earnedIds]));
    state.progress[levelId] = merged;
    persist();
    return { gained: merged.length - had.length, total: merged.length };
  }

  function itemFor(tag) {
    return state.scene ? state.scene.items.find((i) => i.tag === tag) : null;
  }

  function onSwallow(tag, holeId, pos) {
    if (!tag) return null;
    const [kind, key] = tag.split(":");
    const item = itemFor(tag);
    const keep = () => { if (item) respawn(item); };
    if (kind === "menu") {
      if (key === "play") { sfx.select(); show("lobby"); return "lobby"; }
      if (key === "shop") { sfx.select(); show("shop"); return "shop"; }
      if (key === "levels") { sfx.select(); show("select"); return "select"; }
    }
    if (kind === "select") {
      if (key === "back") { sfx.back(); show("menu"); return "menu"; }
      sfx.jingle();
      show("level", key);
      return "level";
    }
    if (kind === "lobby") {
      if (key === "start") { sfx.jingle(); show("level"); return "level"; }
      const idx = Number(key.replace("slot", ""));
      state.claimed.set(idx, holeId);
      keep();
      sfx.star();
      const p = players.get(holeId);
      fx.popup(p ? p.name + " ready" : "ready", pos[0], 1.2, pos[2], p ? p.color : null);
      refreshLabels();
      return "claim";
    }
    if (kind === "shop") {
      if (key === "exit") { sfx.back(); show("menu"); return "menu"; }
      const shopItem = SHOP_ITEMS.find((s) => s.id === key);
      if (!shopItem) return null;
      if (state.owned.includes(key)) { keep(); sfx.error(); fx.popup("already owned", pos[0], 1.2, pos[2]); return "owned"; }
      if (stars() < shopItem.cost) { keep(); sfx.error(); fx.popup("need " + (shopItem.cost - stars()) + " ★ more", pos[0], 1.2, pos[2]); return "poor"; }
      state.spent += shopItem.cost;
      state.owned.push(key);
      keep();
      sfx.buy();
      fx.popup(shopItem.name + " bought", pos[0], 1.2, pos[2], "#ffc400");
      persist();
      refreshLabels();
      return "bought";
    }
    if (kind === "star") {
      sfx.star();
      fx.popup("hidden star", pos[0], 1.4, pos[2], "#ffc400");
      return "star";
    }
    return null;
  }

  return {
    state,
    show,
    stars,
    finishLevel,
    onSwallow,
    refreshLabels,
    award(n) {
      state.spent = Math.max(0, state.spent - n);
      persist();
      refreshLabels();
    },
    cycleVariant(step) {
      if (!SCENES[state.screen]) return;
      const list = SCENES[state.screen];
      show(state.screen, (state.variant[state.screen] + step + list.length) % list.length);
    },
    resetCrew() {
      state.spent = 0;
      state.owned = [];
      state.progress = {};
      persist();
      refreshLabels();
    }
  };
}
