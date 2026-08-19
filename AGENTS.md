# Agent notes

- **Daily work goes in `web-dev/` only.** The playable developer URL is `/dev/`.
- **Do not edit `web/`** (the stable public build) unless the user explicitly asks to update or promote the stable game.
- To copy developer → stable, use `./scripts/promote-dev.sh` and only when asked.
- Back up `web-dev/` before gameplay changes. Saves for the two builds use different `localStorage` keys.
