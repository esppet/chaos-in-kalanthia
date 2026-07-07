# Chaos in Kalanthia — Design Document

A comedic sci-fi point-and-click adventure in the spirit of Sierra's *Space Quest* series.

## Vision

**Genre:** Point-and-click adventure (SCI1.1 / Sierra VGA style)  
**Tone:** Humorous, self-aware, slightly absurd  
**Engine:** Sierra SCI 1.1 — runs natively in [ScummVM](https://www.scummvm.org/)  
**Resolution:** 320×200, 256-color VGA  

## Premise

*(Fill in your story here.)*

> Example hook: A hapless space janitor aboard the research station *Kalanthia* must survive a cascade of cosmic mishaps after an experiment tears a hole in reality.

## Protagonist

| Field | Notes |
|-------|-------|
| Name | |
| Occupation | |
| Personality | Awkward, resourceful, prone to bad luck |
| Goal | |
| Flaw | |

## Setting

- **Primary location:** Kalanthia station / planet
- **Era:** Far-future, retro-tech aesthetic (monitors, chunky buttons, vacuum tubes beside holograms)
- **Key areas:** *(list rooms as you design them)*

## Gameplay

### Interface (SCI1.1 point-and-click)

- Icon bar: Walk, Look, Hand, Talk, Inventory, Menu
- Right-click or icon bar to switch verbs
- Inventory panel with scroll support (already in template)
- Save / restore / restart / quit via menu

### Puzzle philosophy

- **Sierra-style:** Multiple solutions acceptable; some dead-ends OK if fair
- **Humor payoff:** Failed attempts should be funny, not punishing
- **Item combination:** Classic inventory puzzles
- **Timed sequences:** Use sparingly

## Story structure

| Act | Location(s) | Goal | Key puzzle(s) |
|-----|-------------|------|---------------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## Characters

| Name | Role | Location | Notes |
|------|------|----------|-------|
| | Protagonist | | |
| | | | |

## Room list

Track rooms here as you add them in SCI Companion. Room numbers are assigned in `game.ini`.

| Room # | Script | Pic | Description | Status |
|--------|--------|-----|-------------|--------|
| 100 | rTitle | pTitle | Title screen | Template |
| 101 | rTestRoom | pRoom101 | Demo / test room | Template |
| | | | | |

## Inventory items

| Item # | View | Name | Purpose |
|--------|------|------|---------|
| | | | |

## Audio

- **Music:** MIDI (`.snd` resources) — AdLib / General MIDI compatible
- **SFX:** Digital audio (SCI1.1 `audio` resources)
- **Speech:** Optional — SCI1.1 supports talker lip-sync

## Death scenes

Space Quest lives on its death messages. Track them:

| # | Trigger | Message | Easter egg? |
|---|---------|---------|--------------|
| | | | |

## Scoring

- Max score: 999 (default in template — adjust in `GameInit.sc`)
- Optional point list per puzzle

## Localization

SCI1.1 message resources support multiple languages. Message files live in `game/msg/`.

## References

- [SCI Companion SCI 1.1 tutorial](https://scicompanion.com/Documentation/sci11_tutorial.html)
- [ScummVM SCI fan games](https://wiki.scummvm.org/index.php/SCI/Fan_Games)
- Space Quest IV–VI for tone, pacing, and puzzle density