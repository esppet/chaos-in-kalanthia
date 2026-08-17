# Getting Started

Play in a browser: [https://esppet.github.io/chaos-in-kalanthia/](https://esppet.github.io/chaos-in-kalanthia/)

The playable game is the HTML5 build. From the repo root:

```bash
./scripts/run-web.sh
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/). Rooms and puzzles live in `web/js/world.js`.

The rest of this page is the older Adventure Game Studio / ScummVM toolchain, kept for the project in `game/`.

## Prerequisites

| Tool | Purpose | Download |
|------|---------|----------|
| **AGS Editor 3.6.2** | Create and build the game | [adventuregamestudio.co.uk/create](https://www.adventuregamestudio.co.uk/create/) |
| **ScummVM** | Test ScummVM-compatible builds | [scummvm.org/downloads](https://www.scummvm.org/downloads/) |

AGS Editor is a Windows application. On Linux, use the project's install script (Wine + bundled editor).

### Linux install

```bash
# Full install: AGS Editor + Wine + ScummVM (needs sudo)
./scripts/install-ags-linux.sh

# Editor/runtime only, no sudo (Wine must be installed separately)
./scripts/install-ags-linux.sh --local
```

If Wine is not installed yet:

```bash
sudo apt install wine winetricks scummvm
./scripts/install-ags-linux.sh
```

Launch the editor:

```bash
./scripts/run-ags-editor.sh game/Game.agf
```

Run a compiled build with the bundled Linux runtime:

```bash
./scripts/run-ags-game.sh
```

The installer downloads AGS 3.6.2 to `tools/ags-editor/` (gitignored). The first Wine run installs .NET 4.5 via winetricks — this can take several minutes.

## Open the project

1. Launch **AGS Editor 3.6.2**
2. **File → Open** → select `game/Game.agf`
3. The editor loads the Sierra-style template with Chaos in Kalanthia settings

## Run the game

### In AGS Editor

Press **F5** to compile and run.

### Build for distribution

1. **Build → Build EXE(s)**
2. Output goes to `game/Compiled/` (Windows) or use **Build → Target: Linux** for a Linux binary
3. Test in ScummVM: **Add Game** → point at the folder with the `.exe` or Linux binary

### From command line (Linux build)

```bash
./scripts/run-scummvm.sh
```

Requires a compiled game in `game/Compiled/`.

## Development workflow

1. Read [DESIGN.md](DESIGN.md) for the full story and room map
2. Create rooms in AGS Editor matching the room numbers in the design doc
3. Each room auto-links to `room{N}.asc` script files already in the repo
4. Draw backgrounds (320×200), place walkable areas, add hotspots and characters
5. Implement puzzles in room scripts and `GameLogic.asc`
6. Build and test in ScummVM regularly

## Key scripts

| File | Purpose |
|------|---------|
| `GameLogic.asc` | Acts, Zero timer, ship components, endings |
| `GameLogic.ash` | Room/inventory/flag constants |
| `GlobalScript.asc` | Sierra interface, intro sequence, ego responses |
| `room12.asc` | Zero rescue — 10-minute collapse timer |
| `room30.asc` | Spaceship hangar — departure choice |
| `room40.asc` | Star destroyer jail escape |
| `room43.asc` | Tractor beam — hot coffee puzzle |
| `room50.asc` | Earth tribunal — ending resolution |
| `room51.asc` | Bad ending — gas chamber |

## Adding rooms

Room numbers are defined in `GameLogic.ash`. To add a room:

1. In AGS Editor: **Rooms → Create new room** with the matching number
2. The corresponding `room{N}.asc` script is picked up automatically
3. Register hotspots and characters in the editor; implement logic in the script

## Inventory items

Create inventory items in AGS Editor matching the IDs in `GameLogic.ash`:

| ID | Item |
|----|------|
| 1 | Fuel cell |
| 2 | Nav module |
| 3 | Life support unit |
| 4 | Hot coffee |
| 5 | Diamond ring |
| 6 | Wire |

## ScummVM notes

- Build with AGS 3.6.x for best ScummVM compatibility
- ScummVM's AGS engine supports Sierra-style games well ([compatibility list](https://www.scummvm.org/compatibility/))
- Test early and often — some AGS 3.6 features have partial ScummVM support

## Resources

- [AGS Manual](https://adventuregamestudio.github.io/ags-manual/)
- [Sierra-style template docs](https://adventuregamestudio.github.io/ags-manual/v3/TemplateSierraStyle.html)
- [AGS Forums](https://www.adventuregamestudio.co.uk/forums/)
- [ScummVM AGS wiki](https://wiki.scummvm.org/index.php/AGS)