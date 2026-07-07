# Chaos in Kalanthia

A Blade Runner universe point-and-click adventure built with **Adventure Game Studio (AGS)** — playable in **ScummVM**.

Russell, a replicant soldier, survives a meteor strike on the off-world colony Kalanthia. He must rescue a stranded boy from a collapsing megacomplex, salvage spaceship components from a ruined military base, escape a star destroyer-style warship, and face judgement back on Earth.

## Engine

| Feature | Detail |
|---------|--------|
| Engine | AGS 3.6 Sierra-style template |
| Resolution | 320×200 VGA |
| Interface | Icon bar (walk, look, interact, talk, inventory) |
| Runtime | ScummVM, Windows, Linux, macOS |

## Quick start

1. Install [AGS Editor 3.6.2](https://www.adventuregamestudio.co.uk/create/) (Windows; runs under Wine on Linux)
2. **File → Open** → `game/Game.agf`
3. Press **F5** to build and run, or test the compiled game in [ScummVM](https://www.scummvm.org/)

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for the full workflow.

## Story

Three acts, branching endings:

1. **Kalanthia** — Rescue Robert from collapsing Zero megacomplex (10-minute timer), find ship parts, choose whether to bring Annita and Robert to Earth
2. **Star Destroyer** — Escape jail, disable tractor beam with hot coffee, optional diamond ring
3. **Earth** — Face accusations of terrorism; endings depend on who you brought home

Full design: [docs/DESIGN.md](docs/DESIGN.md)

## Project layout

```
├── game/                  # AGS project (open Game.agf in AGS Editor)
│   ├── Game.agf           # Project file — open this
│   ├── GameLogic.asc      # Timer, endings, global state
│   ├── GlobalScript.asc   # Sierra-style interface
│   └── room*.asc          # Room scripts (stubs for key scenes)
├── docs/
│   ├── DESIGN.md          # Full story, puzzles, room map
│   └── GETTING_STARTED.md # Toolchain and workflow
├── tools/Linux/           # AGS Linux runtime (for testing builds)
└── scripts/
    └── run-scummvm.sh     # Launch compiled game in ScummVM
```

## Current state

- AGS Sierra-style project configured for *Chaos in Kalanthia*
- Protagonist renamed to Russell
- Intro sequence, Zero collapse timer, and ending logic scaffolded in `GameLogic.asc`
- Room script stubs for key scenes (Zero rescue, ship hangar, jail escape, tribunal)
- Placeholder art from AGS template — replace with Blade Runner–inspired assets

## ScummVM compatibility

Build the game in AGS Editor (**Build → Build EXE(s)**), then point ScummVM at the output folder containing `chaos-in-kalanthia.exe` (or the Linux binary).

## License

Fan project. Blade Runner is property of its respective rights holders. AGS template assets follow the [AGS license](https://adventuregamestudio.github.io/ags-manual/Copyright.html).