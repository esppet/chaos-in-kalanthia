# AGS Alternative

If SCI Companion's learning curve is too steep, **Adventure Game Studio (AGS)** is a solid alternative that still targets ScummVM.

## Comparison

| | SCI 1.1 (this project) | AGS Sierra-style |
|---|------------------------|------------------|
| Authenticity | Same engine family as Space Quest IV–VI | Inspired by Sierra, not identical |
| Graphics | 320×200 VGA bitmap | Configurable (320×200 up to HD) |
| Scripting | Sierra Script | AGS Script (C#/Java-like) |
| Editor | SCI Companion (Windows) | AGS Editor (Windows, Wine on Linux) |
| ScummVM | Native SCI engine | AGS engine |
| Community | SCI Programming forums | Large AGS community |

## When to switch

Consider AGS if you want:

- Faster iteration and gentler learning curve
- Higher resolutions or modern effects
- A larger pool of tutorials and templates

Stay with SCI if you want:

- The authentic Space Quest IV/V feel
- VGA pixel art at exactly 320×200
- To publish a game the SCI fan community will recognize

## Starting an AGS version

1. Download [AGS 3.6.2](https://www.adventuregamestudio.co.uk/create/)
2. Create new game → **Sierra-style template**
3. Set game title to "Chaos in Kalanthia"
4. Build and test; compiled game folder works in ScummVM

Template source (for reference): [ags-template-source/Sierra-style](https://github.com/adventuregamestudio/ags-template-source/tree/master/Sierra-style)