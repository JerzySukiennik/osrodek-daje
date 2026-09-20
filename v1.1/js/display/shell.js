// Screen flow: menu → lobby → level → shop, every screen a real diorama you drive a hole around.
// Owns the crew's stars and purchases; buttons are tagged props, so "click" means "swallow".

import { SCENES, SHOP_ITEMS, labelsFor } from "../shared/scenes.js";
import { LAB_LEVEL, buildLevel } from "../shared/level.js";

const KEY = "osrodek.crew";

export function createShell({ load, respawn, fx, sfx, music, players }) {
  let saved = { stars: 12, owned: [], variant: { menu: 0, lobby: 0, shop: 0 } };
  try { saved = { ...saved, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch (e) {}

  const state = { screen: "menu", scene: null, stars: saved.stars, owned: saved.owned, variant: saved.variant, ready: 0, claimed: new Map() };

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify({ stars: state.stars, owned: state.owned, variant: state.variant })); } catch (e) {}
  };

  function labelState() {
    const slots = [];
    for (const [idx, id] of state.claimed) {
      const p = players.get(id);
      if (p) slots[idx] = { name: p.name, color: p.color };
    }
    return { stars: state.stars, owned: state.owned, slots, ready: state.claimed.size };
  }

  function refreshLabels() {
    if (!state.scene) return;
    fx.setLabels(state.scene.kind === "level" ? [] : labelsFor(state.scene, labelState()));
  }

  function show(screen, variantIndex) {
    state.screen = screen;
    if (screen === "level") {
      state.scene = { ...LAB_LEVEL, kind: "level", title: "Baseplate", items: buildLevel() };
    } else {
      const list = SCENES[screen];
      const idx = variantIndex == null ? state.variant[screen] : variantIndex;
      state.variant[screen] = Math.max(0, Math.min(list.length - 1, idx));
      state.scene = list[state.variant[screen]];
      if (screen === "lobby") state.claimed.clear();
    }
    persist();
    load(state.scene);
    refreshLabels();
    music(state.scene.kind);
  }

  function award(n) {
    state.stars += n;
    persist();
    refreshLabels();
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
      if (key === "play") { sfx.jingle(); show("level"); return "level"; }
      if (key === "shop") { sfx.select(); show("shop"); return "shop"; }
      if (key === "levels") { sfx.select(); show("lobby"); return "lobby"; }
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
      if (state.stars < shopItem.cost) { keep(); sfx.error(); fx.popup("need " + (shopItem.cost - state.stars) + " ★ more", pos[0], 1.2, pos[2]); return "poor"; }
      state.stars -= shopItem.cost;
      state.owned.push(key);
      keep();
      sfx.buy();
      fx.popup(shopItem.name + " bought", pos[0], 1.2, pos[2], "#ffc400");
      persist();
      refreshLabels();
      return "bought";
    }
    return null;
  }

  return {
    state,
    show,
    award,
    onSwallow,
    refreshLabels,
    cycleVariant(step) {
      if (state.screen === "level") return;
      const list = SCENES[state.screen];
      show(state.screen, (state.variant[state.screen] + step + list.length) % list.length);
    },
    resetCrew() {
      state.stars = 12;
      state.owned = [];
      persist();
      refreshLabels();
    }
  };
}
