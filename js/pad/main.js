// Phone pad: join by QR/code, floating joystick anywhere on the left zone, hold-to-charge SPIT button, live belly/element status.

import { MSG, PROTO, ROOM_CODE_LEN } from "../shared/protocol.js";

const INPUT_HZ = 30;

export async function startPad(root) {
  const params = new URLSearchParams(location.search);
  root.hidden = false;
  document.body.classList.add("is-pad");

  let cid = sessionStorage.getItem("osrodek.cid");
  if (!cid) {
    cid = "p" + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem("osrodek.cid", cid);
  }

  function showJoin(message) {
    root.innerHTML = `
      <div class="pad-join">
        <h1>OŚRODEK<br>DAJE</h1>
        <p>Type the 4-letter code from the TV</p>
        <input id="pj-code" maxlength="${ROOM_CODE_LEN}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD">
        <button id="pj-go">JOIN</button>
        <small id="pj-msg">${message || ""}</small>
      </div>`;
    const input = root.querySelector("#pj-code");
    const go = () => {
      const code = input.value.toUpperCase().replace(/[^A-Z]/g, "");
      if (code.length === ROOM_CODE_LEN) connect(code);
    };
    root.querySelector("#pj-go").onclick = go;
    input.oninput = () => { input.value = input.value.toUpperCase(); if (input.value.length === ROOM_CODE_LEN) go(); };
  }

  function showStatus(text) {
    root.innerHTML = `<div class="pad-join"><h1>OŚRODEK<br>DAJE</h1><p>${text}</p></div>`;
  }

  async function connect(code) {
    showStatus("Connecting…");
    let client = null;
    try {
      const { connectClient } = await import("../net/netclient.js");
      client = await connectClient({
        roomCode: code,
        cid,
        handlers: {
          onOpen() { client.sendEvent({ type: MSG.JOIN, proto: PROTO }); },
          onEvent(msg) {
            if (msg.type === MSG.WELCOME) showPad(client, msg);
            if (msg.type === MSG.REJECT) { client.close(); showJoin(msg.reason === "full" ? "Room is full (4 holes max)" : "Wrong game version — reload"); }
            if (msg.type === MSG.KICK) { client.close(); showJoin("Disconnected by the host"); }
          },
          onPad(msg) { if (padApi) padApi.status(msg); },
          onClose() { padApi = null; showJoin("Connection lost — join again"); }
        }
      });
    } catch (e) {
      showJoin(e && e.message === "room-not-found" ? "No such room. Check the code on the TV." : "Could not connect. Same Wi-Fi as the TV?");
    }
  }

  let padApi = null;

  function showPad(client, welcome) {
    root.innerHTML = `
      <div class="pad" style="--pc:${welcome.color}">
        <div class="pad-top"><b>${welcome.name} HOLE</b><span id="pd-info">⌀ 0.9 m · 0 eaten</span><i id="pd-mode">${client.mode() === "rtc" ? "" : "slow link"}</i></div>
        <div class="pad-stick" id="pd-stick"><div class="ring" id="pd-ring"><div class="knob" id="pd-knob"></div></div><em>drag anywhere here</em></div>
        <button class="pad-spit" id="pd-spit"><span id="pd-el"></span><b>SPIT</b><small id="pd-belly">belly empty</small></button>
      </div>`;
    const stick = root.querySelector("#pd-stick");
    const ring = root.querySelector("#pd-ring");
    const knob = root.querySelector("#pd-knob");
    const spit = root.querySelector("#pd-spit");
    const state = { x: 0, y: 0, b: 0 };
    let pid = null;
    let ox = 0, oy = 0;
    const RADIUS = 64;

    stick.addEventListener("pointerdown", (e) => {
      if (pid != null) return;
      pid = e.pointerId;
      try { stick.setPointerCapture(pid); } catch (err) {}
      const r = stick.getBoundingClientRect();
      ox = e.clientX; oy = e.clientY;
      ring.style.left = ox - r.left + "px";
      ring.style.top = oy - r.top + "px";
      ring.classList.add("on");
      knob.style.transform = "translate(-50%,-50%)";
      e.preventDefault();
    });
    stick.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      let dx = e.clientX - ox, dy = e.clientY - oy;
      const d = Math.hypot(dx, dy);
      if (d > RADIUS) {
        ox += (dx / d) * (d - RADIUS);
        oy += (dy / d) * (d - RADIUS);
        const r = stick.getBoundingClientRect();
        ring.style.left = ox - r.left + "px";
        ring.style.top = oy - r.top + "px";
        dx = e.clientX - ox; dy = e.clientY - oy;
      }
      state.x = dx / RADIUS;
      state.y = -dy / RADIUS;
      knob.style.transform = `translate(-50%,-50%) translate(${dx}px,${dy}px)`;
    });
    const release = (e) => {
      if (e.pointerId !== pid) return;
      pid = null;
      state.x = state.y = 0;
      ring.classList.remove("on");
    };
    stick.addEventListener("pointerup", release);
    stick.addEventListener("pointercancel", release);

    const press = (down) => (e) => { state.b = down ? 1 : 0; spit.classList.toggle("down", down); e.preventDefault(); };
    spit.addEventListener("pointerdown", press(true));
    spit.addEventListener("pointerup", press(false));
    spit.addEventListener("pointercancel", press(false));
    spit.addEventListener("pointerleave", press(false));
    root.addEventListener("contextmenu", (e) => e.preventDefault());

    const timer = setInterval(() => client.sendInput(state), 1000 / INPUT_HZ);
    if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(() => {});

    const info = root.querySelector("#pd-info");
    const belly = root.querySelector("#pd-belly");
    const elIcon = root.querySelector("#pd-el");
    const padEl = root.querySelector(".pad");
    padApi = {
      status(msg) {
        info.textContent = `⌀ ${msg.d} m · ${msg.eaten} eaten`;
        elIcon.textContent = msg.el === "fire" ? "🔥" : msg.el === "water" ? "💧" : "";
        padEl.dataset.el = msg.el || "";
        spit.querySelector("b").textContent = msg.el === "water" ? "FOUNTAIN" : "SPIT";
        belly.textContent = msg.el === "water" ? "hold & release" : msg.n ? `${msg.top}${msg.n > 1 ? " +" + (msg.n - 1) : ""}` : "belly empty";
      }
    };
    window.addEventListener("pagehide", () => { clearInterval(timer); client.close(); });
  }

  const code = (params.get("room") || "").toUpperCase();
  if (code.length === ROOM_CODE_LEN) connect(code); else showJoin("");
}
