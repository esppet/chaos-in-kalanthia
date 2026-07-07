# Chaos in Kalanthia

A comedic sci-fi point-and-click adventure in the spirit of Sierra's *Space Quest* — built with the **Sierra SCI 1.1** engine and playable in **ScummVM**.

## Why SCI 1.1?

Space Quest IV–VI used Sierra's SCI engine with a VGA point-and-click interface. This project uses the same technology via [SCI Companion 3](https://scicompanion.com/), so the finished game runs in ScummVM's native SCI interpreter — the same one that plays the original Space Quest games.

| Feature | Detail |
|---------|--------|
| Resolution | 320×200 VGA, 256 colors |
| Interface | Icon bar (walk, look, hand, talk, inventory) |
| Audio | MIDI music + digital sound effects |
| Saves | Sierra-style save/restore |
| Runtime | ScummVM, DOSBox, or original Sierra interpreter |

## Quick start

1. Install [SCI Companion 3](https://scicompanion.com/) (Windows; works under Wine on Linux)
2. **File → Open** → `game/resource.map`
3. Press **F5** to run, or test in [ScummVM](https://www.scummvm.org/)

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the full workflow.

## Project layout

```
├── game/                  # SCI 1.1 game (open resource.map in SCI Companion)
│   ├── src/               # Script source code
│   ├── msg/               # Message definitions
│   ├── poly/              # Walkable area polygons
│   └── resource.map       # Resource index — open this file to start
├── docs/
│   ├── DESIGN.md          # Story, puzzles, rooms (fill this in)
│   ├── GETTING_STARTED.md # Toolchain and workflow
│   └── AGS_ALTERNATIVE.md # Plan B if SCI is too steep
└── scripts/
    └── run-scummvm.sh     # Launch game in ScummVM from CLI
```

## Current state

The game boots to a title screen and includes a demo room with the full SCI1.1 interface (icon bar, inventory, save/restore, death handler). Replace the template art and scripts with your own content.

## Design your game

Open [docs/DESIGN.md](docs/DESIGN.md) and fill in the premise, characters, rooms, and puzzles.

## ScummVM compatibility

ScummVM detects the `game/` folder as an SCI 1.1 game automatically. No special packaging needed — point ScummVM at the directory containing `resource.map`.

## Alternative engine

Prefer something easier? [Adventure Game Studio](https://www.adventuregamestudio.co.uk/) with the Sierra-style template also produces ScummVM-compatible games. See [docs/AGS_ALTERNATIVE.md](docs/AGS_ALTERNATIVE.md).

## License

Game content: TBD. SCI template resources are based on the [SCI11 Template Redux](https://github.com/EricOakford/SCI11_Template_Redux) project.