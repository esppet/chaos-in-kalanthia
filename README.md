# Chaos in Kalanthia

A Blade Runner–universe point-and-click adventure. The playable game is a **browser** Sierra-style engine. The original Adventure Game Studio / ScummVM project is still in `game/` as reference.

Russell, a replicant soldier, survives a meteor strike on the off-world colony Kalanthia. He must rescue a stranded boy from a collapsing megacomplex, salvage spaceship components from a ruined military base, escape a star destroyer-style warship, and face judgement back on Earth.

## Play (browser)

Two builds are published from this repo:

| Build | URL | Source | How often |
|-------|-----|--------|-----------|
| **Stable** | [https://esppet.github.io/chaos-in-kalanthia/](https://esppet.github.io/chaos-in-kalanthia/) | `web/` | Promoted when a slice is ready |
| **Developer** | [https://esppet.github.io/chaos-in-kalanthia/dev/](https://esppet.github.io/chaos-in-kalanthia/dev/) | `web-dev/` | Daily work |

Saves do not mix: each build uses its own `localStorage` key.

Or run it locally:

```bash
./scripts/run-web.sh       # stable, port 8765
./scripts/run-web-dev.sh   # developer, port 8766
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/) or [http://127.0.0.1:8766/](http://127.0.0.1:8766/). From another device on the same network, use the `other devices` URL the script prints. Optional port: `./scripts/run-web.sh 9000`.

To copy the developer game over the stable one: `./scripts/promote-dev.sh` (backs up `web/` first).

| Control | Action |
|---------|--------|
| Click | Walk, or apply the current verb |
| 1 / 2 / 3 / 4 / 5 | Walk / Look / Use / Pick up / Talk |
| I | Inventory |
| Esc | Save / load / restart |
| WASD or arrows | Walk |
| Space or click | Advance dialogue |
| M | Music on/off |
| `?debug=1` | Show walkable floor and hotspots |

Saves live in this browser (`localStorage`).

The score is an MT-32 / Roland SC-55 loop set (title, courtyard, command). Courtyard is a countdown pulse. The command room is computer-room ambience — PSU hum, CRT, modem tones. Earlier versions live in `web/assets/music/archive/`.

## Current playable slice

Intro → military base courtyard → command room → street at Zero.

1. Search the gantry wreckage for a **crowbar**
2. Force the **blast door**
3. Read the **command terminal** — Zero is collapsing; Annita's son Robert is still inside; the hangar ship needs three parts
4. Take the **road to town** to stand under Apartment Building Zero
5. Talk to **Annita**, then enter the lobby — a **ten-minute clock** starts
6. Do not take the elevator. Climb ten identical floors
7. Floor 2 hides a soot-black **service key**. Floor 10's roof door needs it
8. On the roof: **Robert**, the burning colony, and a hidden **brass key**
9. The brass key opens apartment 2 — a lab with the three ship parts

Full story, room map, and endings: [docs/DESIGN.md](docs/DESIGN.md)

## Project layout

```
├── web/                   # Stable HTML5 game
├── web-dev/               # Developer HTML5 game (daily work)
│   ├── index.html
│   ├── js/                # Engine, pathfinding, room scripts
│   └── assets/            # Rooms, Russell, items, UI
├── game/                  # Original AGS Sierra-style project
├── docs/DESIGN.md         # Story, puzzles, room map
└── scripts/run-web.sh     # Local server (ES modules need http)
```

## Adding a room

Rooms are data in `web/js/world.js`: background, walkable polygon, start point, and hotspots (`look` / `use` / `talk` / `useItem`). Drop a 640×360 PNG in `web/assets/rooms/` and register it. `?debug=1` is the fastest way to tune the floor polygon.

## AGS / ScummVM (archived path)

The AGS 3.6 Sierra-style project in `game/` was the first attempt, aimed at ScummVM. Tooling: [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md). New rooms and art should go into `web/` unless you specifically want the AGS build.

## License

Fan project. Blade Runner is property of its respective rights holders. VT323 font is SIL Open Font License. AGS template assets in `game/` follow the [AGS license](https://adventuregamestudio.github.io/ags-manual/Copyright.html).
