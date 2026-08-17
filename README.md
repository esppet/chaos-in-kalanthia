# Chaos in Kalanthia

A Blade Runner–universe point-and-click adventure. The playable game is a **browser** Sierra-style engine. The original Adventure Game Studio / ScummVM project is still in `game/` as reference.

Russell, a replicant soldier, survives a meteor strike on the off-world colony Kalanthia. He must rescue a stranded boy from a collapsing megacomplex, salvage spaceship components from a ruined military base, escape a star destroyer-style warship, and face judgement back on Earth.

## Play (browser)

**Live:** [https://esppet.github.io/chaos-in-kalanthia/](https://esppet.github.io/chaos-in-kalanthia/)

Or run it locally:

```bash
./scripts/run-web.sh
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/) on this machine. From another device on the same network, use the `other devices` URL the script prints (port 8765). Optional port: `./scripts/run-web.sh 9000`.

| Control | Action |
|---------|--------|
| Click | Walk, or apply the current verb |
| 1 / 2 / 3 / 4 | Walk / Look / Use / Talk |
| I | Inventory |
| Esc | Save / load / restart |
| WASD or arrows | Walk |
| Space or click | Advance dialogue |
| `?debug=1` | Show walkable floor and hotspots |

Saves live in this browser (`localStorage`).

## Current playable slice

Intro → military base courtyard → command room.

1. Search the gantry wreckage for a **crowbar**
2. Force the **blast door**
3. Read the **command terminal** — Zero is collapsing; Annita's son Robert is still inside; the hangar ship needs three parts
4. Take the **road to town** for the end card

Full story, room map, and endings: [docs/DESIGN.md](docs/DESIGN.md)

## Project layout

```
├── web/                   # Playable HTML5 game (open this)
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
