# Ośrodek Daje

Couch co-op puzzle game where every player is a hole in the ground — a love letter to Donut County.
One screen runs the world, phones are the controllers (QR / room code, WebRTC).

**Status: Lab 01** — not a game yet. A baseplate for judging the core: hole physics (objects teeter on the rim
and tip in), growth, spitting, fire, water, and the phone pad.

## Run

```bash
node Niepotrzebne/devserver.mjs
```

Open `http://localhost:5191` on the computer, scan the QR with a phone on the same Wi-Fi.

| Input | Action |
|---|---|
| Click the grass | spawn a mouse-driven dev hole (follows the cursor) |
| Hold / release `Space` | charge and spit the last swallowed thing (fountain when full of water) |
| `B` / `N` | add a bot / remove bots |
| `R` | reset the level |
| `P` | lab panel: ratings + notes → `feedback/*.json`, live tuning, spawn tools |

## How the hole works

Rapier has no "ground with a hole". Props near a hole switch collision group: they stop touching the real
ground and stand on that hole's *rig* instead — a fixed body of ~170 overlapping cuboids arranged in rings
around an empty 40-gon, teleported with the hole every step. Pieces only switch on under props that need
them, and switch off where they would cover another hole. Rendering cuts the ground with a stencil mask.

`js/sim` is headless (no three.js, no DOM): `cd Niepotrzebne && npm i && node test/sim.test.mjs`.
