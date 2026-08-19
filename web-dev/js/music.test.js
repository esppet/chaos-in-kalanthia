/** Exclusive-playback checks for the room soundtrack. */

let fakeNow = 0;
const rafQueue = [];

globalThis.localStorage = {
  getItem: () => null,
  setItem() {},
};
globalThis.performance = { now: () => fakeNow };
globalThis.requestAnimationFrame = (cb) => {
  const id = (rafQueue.at(-1)?.id || 0) + 1;
  rafQueue.push({ id, cb });
  return id;
};
globalThis.cancelAnimationFrame = (id) => {
  const i = rafQueue.findIndex((item) => item.id === id);
  if (i >= 0) rafQueue.splice(i, 1);
};

class FakeAudio {
  constructor(src) {
    this.src = src;
    this.loop = false;
    this.preload = "";
    this.volume = 0;
    this.paused = true;
    this.currentTime = 0;
  }
  addEventListener(type, fn, opts) {
    if (type === "canplaythrough") {
      queueMicrotask(fn);
    }
    void opts;
  }
  play() {
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

globalThis.Audio = FakeAudio;

function tick(ms) {
  fakeNow += ms;
  const batch = rafQueue.splice(0);
  for (const { cb } of batch) cb(fakeNow);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function playing(music) {
  return [...music.clips.entries()]
    .filter(([, audio]) => !audio.paused)
    .map(([id]) => id);
}

const { Soundtrack } = await import("./music.js");

const music = new Soundtrack();
await music.load({
  title: "title.ogg",
  courtyard: "courtyard.ogg",
  command: "command.ogg",
});

music.play("title");
tick(600);
assert(playing(music).join() === "title", `only title after first cue, got ${playing(music)}`);

music.play("courtyard");
tick(200);
assert(playing(music).includes("title"), "title still fading out");
assert(playing(music).includes("courtyard"), "courtyard fading in");

music.play("command");
tick(600);
assert(
  playing(music).join() === "command",
  `cancelled fade must not leave two cues running, got ${playing(music)}`
);
assert(music.clips.get("title").paused, "title halted");
assert(music.clips.get("courtyard").paused, "courtyard halted");
assert(music.clips.get("title").volume === 0, "title silent");
assert(music.clips.get("courtyard").volume === 0, "courtyard silent");

music.play("command");
tick(600);
assert(playing(music).join() === "command", "same-id play must not spawn a second voice");
assert(music.clips.get("title").paused && music.clips.get("courtyard").paused, "others stay dead");

console.log("music exclusive playback passed");
