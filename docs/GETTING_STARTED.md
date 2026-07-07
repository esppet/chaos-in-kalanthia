# Getting Started

## Prerequisites

| Tool | Purpose | Download |
|------|---------|----------|
| **SCI Companion 3** | Editor, compiler, resource tools | [scicompanion.com](https://scicompanion.com/) |
| **ScummVM** | Run and test the game | [scummvm.org/downloads](https://www.scummvm.org/downloads/) |
| **DOSBox** | Optional fallback runner (bundled with SCI Companion) | [dosbox.com](https://www.dosbox.com/) |

SCI Companion is a Windows application. On Linux, run it via Wine or use a Windows VM.

## Open the project

1. Launch **SCI Companion 3**
2. **File → Open** → select `game/resource.map`
3. The Explorer tab shows all game resources (views, pics, scripts, sounds, etc.)

## Run the game

### In SCI Companion

- Press **F5** or click the green play button
- Default profile uses DOSBox; switch to the **ScummVM** profile in **Game → Properties** for closer-to-production testing

### In ScummVM

1. Open ScummVM
2. **Add Game…**
3. Choose the `game/` directory (the folder containing `resource.map`)
4. ScummVM should detect it as an SCI game
5. Launch

Or from the command line (once ScummVM is installed):

```bash
./scripts/run-scummvm.sh
```

## Create content

Work through the official [SCI 1.1 step-by-step tutorial](https://scicompanion.com/Documentation/sci11_tutorial.html). The template already includes:

- Title screen with Start / Restore / Quit (`src/rTitle.sc`)
- Icon bar with walk, look, use, talk, inventory (`src/IconBar.sc`)
- Demo room with ego, obstacles, and messages (`src/rTestRoom.sc`)
- Save / restore, death handler, debug mode

### Typical workflow

1. **Draw a background** — Pic editor (320×200 VGA bitmap)
2. **Create a room script** — Copy `rTestRoom.sc`, assign a new room number in `game.ini`
3. **Add views** — Character / object sprites with loops and cels
4. **Write messages** — Message editor for all in-game text
5. **Hook up puzzles** — `Feature`, `Interact`, `Approach` classes in room scripts
6. **Compile** — SCI Companion rebuilds `resource.000` automatically
7. **Test** — F5 or ScummVM

## Key files

```
game/
├── resource.map      ← Open this in SCI Companion
├── resource.000      ← Compiled game resources (auto-generated)
├── resource.msg      ← Message data
├── game.ini          ← Resource name registry
├── src/              ← Script source (.sc)
├── msg/              ← Message headers (.shm)
├── poly/             ← Walkable polygon headers (.shp)
└── RESOURCE.CFG      ← DOS audio/video driver config
```

## Rebuilding resources

If resources get out of sync:

- **Tools → Rebuild resources** in SCI Companion

## Version control tips

- Commit `src/`, `msg/`, `poly/`, and `game.ini` — these are your source
- `resource.000` / `resource.map` change on every compile; commit them too so the game is playable without rebuilding
- `.sco` object files are build artifacts (gitignored)

## Alternative: AGS

If SCI feels too low-level, [Adventure Game Studio](https://www.adventuregamestudio.co.uk/) with the **Sierra-style template** is a good alternative. AGS games also run in ScummVM. See `docs/AGS_ALTERNATIVE.md`.