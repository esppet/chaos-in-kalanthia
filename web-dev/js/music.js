/** Looping room cues. Only one clip is allowed to play. Starts on first user gesture. */

const MUTE_KEY = "chaos-in-kalanthia-dev-music-muted";
const FADE_MS = 600;

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
    if (!id) return;
    const next = this.clips.get(id);
    if (!next) return;

    this._cancelFade();

    if (this.current === id) {
      this._haltOthers(id);
      if (!this.muted && next.paused) this._start(next, this.volume);
      return;
    }

    this.current = id;
    if (this.muted) {
      this._haltAll();
      return;
    }

    const outgoing = [];
    for (const [cid, audio] of this.clips) {
      if (cid === id) continue;
      if (!audio.paused && audio.volume > 0.01) {
        outgoing.push({ audio, from: audio.volume });
      } else {
        this._halt(audio);
      }
    }

    this._start(next, 0);
    this._crossfade(outgoing, next);
  }

  _crossfade(outgoing, next) {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / FADE_MS);
      next.volume = this.volume * t;
      for (const { audio, from } of outgoing) {
        audio.volume = from * (1 - t);
      }
      if (t < 1) {
        this._fade = requestAnimationFrame(step);
        return;
      }
      for (const { audio } of outgoing) this._halt(audio);
      next.volume = this.volume;
      this._fade = null;
    };
    this._fade = requestAnimationFrame(step);
  }

  _cancelFade() {
    if (this._fade) {
      cancelAnimationFrame(this._fade);
      this._fade = null;
    }
  }

  _halt(audio) {
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {
      /* ignore unseekable */
    }
    audio.volume = 0;
  }

  _haltOthers(keepId) {
    for (const [id, audio] of this.clips) {
      if (id !== keepId) this._halt(audio);
    }
  }

  _haltAll() {
    for (const audio of this.clips.values()) this._halt(audio);
  }

  _start(audio, volume) {
    audio.volume = volume;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {});
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    if (muted) {
      this._cancelFade();
      this._haltAll();
      return;
    }
    const cur = this.current && this.clips.get(this.current);
    if (cur) this._start(cur, this.volume);
  }

  toggle() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  unlock() {
    const clip = this.current && this.clips.get(this.current);
    if (!clip || this.muted) return;
    this._start(clip, clip.volume || this.volume);
  }

  stop() {
    this._cancelFade();
    this.current = null;
    this._haltAll();
  }
}
