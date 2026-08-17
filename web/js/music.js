/** Looping room cues with a short crossfade. Starts on first user gesture. */

const MUTE_KEY = "chaos-in-kalanthia-music-muted";
const FADE_MS = 1400;

export class Soundtrack {
  constructor() {
    this.clips = new Map();
    this.current = null;
    this.muted = localStorage.getItem(MUTE_KEY) === "1";
    this.volume = 0.48;
    this.ready = false;
    this._fade = null;
  }

  async load(manifest) {
    await Promise.all(
      Object.entries(manifest).map(([id, src]) => {
        const audio = new Audio(src);
        audio.loop = true;
        audio.preload = "auto";
        audio.volume = 0;
        this.clips.set(id, audio);
        return new Promise((resolve) => {
          const done = () => resolve();
          audio.addEventListener("canplaythrough", done, { once: true });
          audio.addEventListener("error", done, { once: true });
        });
      })
    );
    this.ready = true;
  }

  play(id) {
    if (!id || this.current === id) return;
    const next = this.clips.get(id);
    if (!next) return;
    const prev = this.current ? this.clips.get(this.current) : null;
    this.current = id;
    if (this.muted) {
      next.pause();
      if (prev) prev.pause();
      return;
    }
    next.volume = 0;
    const start = next.play();
    if (start && start.catch) start.catch(() => {});
    this._crossfade(prev, next);
  }

  _crossfade(prev, next) {
    if (this._fade) cancelAnimationFrame(this._fade);
    const t0 = performance.now();
    const from = prev && !prev.paused ? prev.volume : 0;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / FADE_MS);
      if (next) next.volume = this.volume * t;
      if (prev && prev !== next) prev.volume = from * (1 - t);
      if (t < 1) {
        this._fade = requestAnimationFrame(step);
        return;
      }
      if (prev && prev !== next) {
        prev.pause();
        prev.currentTime = 0;
        prev.volume = 0;
      }
      this._fade = null;
    };
    this._fade = requestAnimationFrame(step);
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted) {
      for (const audio of this.clips.values()) {
        audio.pause();
        audio.volume = 0;
      }
      return;
    }
    const cur = this.current && this.clips.get(this.current);
    if (cur) {
      cur.volume = this.volume;
      const p = cur.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  unlock() {
    // Browsers block audio until a gesture; poke the current (or title) clip.
    const clip = this.clips.get(this.current || "title");
    if (!clip || this.muted) return;
    const p = clip.play();
    if (p && p.catch) p.catch(() => {});
  }
}
