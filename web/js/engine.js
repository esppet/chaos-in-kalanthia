import {
  findPath,
  nearestOnPoly,
  pointInPoly,
  polyContains,
  approachPoint,
} from "./pathfind.js";
import { Soundtrack } from "./music.js";
import { CommandTerm } from "./terminal.js";

export const W = 640;
export const H = 360;
export const SAVE_KEY = "chaos-in-kalanthia-save";

export class Adventure {
  constructor(root, world) {
    this.root = root;
    this.canvas = root.querySelector("#game");
    this.ctx = this.canvas.getContext("2d");
    this.world = world;
    this.images = new Map();
    this.verb = "walk";
    this.activeItem = null;
    this.inventory = [];
    this.flags = {};
    this.roomId = null;
    this.player = { x: 320, y: 320, dir: "down", path: [], speed: 88 };
    this.walkPhase = 0;
    this.moving = false;
    this.pending = null;
    this.speech = [];
    this.speechVisible = null;
    this.mode = "title";
    this.fade = 1;
    this.fadeDir = 0;
    this.afterFade = null;
    this.afterSpeech = null;
    this.debug = new URLSearchParams(location.search).has("debug");
    this.keys = new Set();
    this.status = "";
    this.hoverName = "";
    this.last = 0;
    this.busy = false;
    this.onHud = this.onHud.bind(this);
    this.onPointer = this.onPointer.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onKey = this.onKey.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.tick = this.tick.bind(this);
    this.music = new Soundtrack();
    this.term = null;
    this.shake = null;
    this.emerge = null;
  }

  trapped() {
    return this.roomId === "base-exterior" && !this.flag("outOfFridge") && !this.emerge;
  }

  shakeProp(id, seconds) {
    this.shake = { id, t: seconds, dur: seconds };
  }

  openTerminal() {
    this.term?.open();
  }

  onTerminalRead() {
    if (this.flag("logRead")) return;
    this.setFlag("logRead");
    if (!this.has("dataslug")) this.give("dataslug");
    this._logJustRead = true;
  }

  onTerminalClose() {
    if (this._logJustRead) {
      this._logJustRead = false;
      this.say("A kid in a falling building. Of course.");
    }
  }

  startEmerge() {
    this.emerge = {
      t: 0,
      climb: 0.55,
      dur: 1.6,
      x0: 82,
      y0: 306,
      x1: 176,
      y1: 322,
    };
    this.player.x = 82;
    this.player.y = 306;
    this.player.dir = "right";
    this.shakeProp("fridge", 0.4);
  }

  room() {
    return this.world.rooms[this.roomId];
  }

  flag(name) {
    return !!this.flags[name];
  }

  setFlag(name, value = true) {
    this.flags[name] = value;
    this.autosave();
  }

  has(id) {
    return this.inventory.includes(id);
  }

  give(id) {
    if (!this.has(id)) this.inventory.push(id);
    this.renderInventory();
    this.autosave();
  }

  take(id) {
    this.inventory = this.inventory.filter((x) => x !== id);
    if (this.activeItem === id) this.activeItem = null;
    this.renderInventory();
    this.autosave();
  }

  async loadImages() {
    const paths = new Set();
    for (const room of Object.values(this.world.rooms)) {
      if (room.bg) paths.add(room.bg);
      for (const hs of room.hotspots || []) {
        if (hs.image) paths.add(hs.image);
        if (hs.baseImage) paths.add(hs.baseImage);
      }
    }
    for (const item of Object.values(this.world.items)) {
      if (item.icon) paths.add(item.icon);
    }
    paths.add("assets/sprites/russell-emerge.png");
    for (const dir of ["down", "up", "left", "right"]) {
      paths.add(`assets/sprites/russell-${dir}.png`);
      paths.add(`assets/sprites/russell-${dir}-walk.png`);
    }
    await Promise.all(
      [...paths].map(
        (src) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              this.images.set(src, img);
              resolve();
            };
            img.onerror = () => reject(new Error("Failed to load " + src));
            img.src = src;
          })
      )
    );
  }

  img(src) {
    return this.images.get(src);
  }

  bind() {
    this.root.addEventListener("click", this.onHud);
    this.canvas.addEventListener("pointerdown", this.onPointer);
    this.canvas.addEventListener("pointermove", this.onMove);
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKeyUp);
    this.root.querySelectorAll("[data-verb]").forEach((btn) => {
      btn.addEventListener("click", () => this.setVerb(btn.dataset.verb));
    });
    this.root.querySelector("#btn-inv")?.addEventListener("click", () => {
      this.toggleInventory();
    });
    this.root.querySelector("#btn-menu")?.addEventListener("click", () => {
      this.toggleMenu();
    });
    this.root.querySelector("#btn-begin")?.addEventListener("click", () => {
      this.music.unlock();
      this.startIntro();
    });
    this.root.querySelector("#btn-continue")?.addEventListener("click", () => {
      this.music.unlock();
      if (this.load()) this.enterPlay();
    });
    this.root.querySelectorAll("[data-music-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.music.toggle();
        this.syncMusicButtons();
      });
    });
    this.root.querySelector("#title")?.addEventListener("click", () => {
      this.music.unlock();
    });
    this.root.querySelector("#btn-save")?.addEventListener("click", () => {
      this.save();
      this.say("Game saved.");
      this.toggleMenu(false);
    });
    this.root.querySelector("#btn-load")?.addEventListener("click", () => {
      if (this.load()) {
        this.toggleMenu(false);
        this.say("Loaded.");
      }
    });
    this.root.querySelector("#btn-restart")?.addEventListener("click", () => {
      this.reset();
      this.toggleMenu(false);
      this.startIntro();
    });
    this.root.querySelector("#btn-resume")?.addEventListener("click", () => {
      this.toggleMenu(false);
    });
    this.root.querySelector("#speech")?.addEventListener("click", () => {
      if (this.speechVisible) this.advanceSpeech();
    });
    this.root.querySelector("#btn-end-title")?.addEventListener("click", () => {
      this.root.querySelector("#endcard").hidden = true;
      this.mode = "title";
      this.root.querySelector("#title").hidden = false;
      this.music.stop();
      this.refreshContinue();
    });
    this.fit();
    window.addEventListener("resize", () => this.fit());
  }

  fit() {
    const stage = this.root.querySelector("#stage");
    const scaler = this.root.querySelector("#scaler");
    const maxW = window.innerWidth - 24;
    const maxH = window.innerHeight - 24;
    const scale = Math.min(maxW / W, maxH / H);
    scaler.style.width = `${W * scale}px`;
    scaler.style.height = `${H * scale}px`;
    stage.style.transform = `scale(${scale})`;
    this.scale = scale;
  }

  canvasPoint(ev) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - r.left) / r.width) * W,
      y: ((ev.clientY - r.top) / r.height) * H,
    };
  }

  setVerb(verb) {
    this.verb = verb;
    if (verb !== "use") this.activeItem = null;
    this.root.querySelectorAll("[data-verb]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.verb === verb);
    });
    this.updateCursor();
    this.updateStatus();
    this.renderInventory();
  }

  updateCursor() {
    const kind = this.speechVisible ? "wait" : this.verb;
    this.canvas.style.cursor = `url("assets/ui/cursor-${kind}.png") 4 4, crosshair`;
  }

  hotspotAt(x, y) {
    const room = this.room();
    if (!room) return null;
    const list = [...(room.hotspots || [])].reverse();
    for (const hs of list) {
      if (hs.visible && !hs.visible(this)) continue;
      if (polyContains(hs, x, y)) return hs;
    }
    return null;
  }

  updateStatus(hs) {
    const el = this.root.querySelector("#status");
    if (this.speechVisible) {
      el.textContent = "";
      return;
    }
    const name = hs?.name || this.hoverName;
    let text = "";
    if (this.activeItem && name) {
      const item = this.world.items[this.activeItem];
      text = `Use ${item.name} on ${name}`;
    } else if (this.activeItem) {
      text = `Use ${this.world.items[this.activeItem].name} on...`;
    } else if (name) {
      const verbWord = {
        walk: "Walk to",
        look: "Look at",
        use: "Use",
        pickup: "Pick up",
        talk: "Talk to",
      }[this.verb];
      text = `${verbWord} ${name}`;
    }
    el.textContent = text;
  }

  onMove(ev) {
    if (this.mode !== "play") return;
    const { x, y } = this.canvasPoint(ev);
    const hs = this.hotspotAt(x, y);
    this.hoverName = hs?.name || "";
    this.updateStatus(hs);
  }

  onHud(ev) {
    const t = ev.target;
    const slot = t.closest?.("#inventory [data-item]");
    if (slot) {
      ev.preventDefault();
      this.clickItem(slot.dataset.item);
    }
  }

  clickItem(id) {
    if (this.speechVisible) {
      this.advanceSpeech();
      return;
    }
    if (this.verb === "look") {
      this.say(this.world.items[id].look);
      return;
    }
    if (this.verb === "talk") {
      this.say("It's not much of a conversationalist.");
      return;
    }
    if (this.activeItem === id) {
      this.activeItem = null;
    } else {
      this.verb = "use";
      this.activeItem = id;
      this.setVerb("use");
      this.toggleInventory(false);
    }
    this.renderInventory();
    this.updateStatus();
  }

  onPointer(ev) {
    if (this.term?.isOpen) return;
    if (this.mode !== "play") return;
    if (this.fadeDir) return;
    if (!this.root.querySelector("#menu").hidden) return;
    const { x, y } = this.canvasPoint(ev);
    if (this.speechVisible) {
      this.advanceSpeech();
      return;
    }
    if (this.emerge) return;
    const hs = this.hotspotAt(x, y);
    if (this.trapped()) {
      if (hs?.id === "fridge") {
        if (this.verb === "look" && !this.speechVisible) {
          this.doLook(hs);
        } else {
          this.speech = [];
          this.speechVisible = null;
          this.root.querySelector("#speech").hidden = true;
          this.busy = false;
          if (hs.use) hs.use(this);
        }
      } else if (this.speechVisible) {
        this.advanceSpeech();
      } else {
        this.say("The door won't give. I need to hit it from the inside.");
      }
      return;
    }
    if (this.verb === "look") {
      this.doLook(hs);
      return;
    }
    if (this.verb === "talk") {
      this.doTalk(hs);
      return;
    }
    if (this.verb === "pickup") {
      if (!hs) {
        this.say("Nothing to pick up.");
        return;
      }
      this.walkThen(() => this.doTake(hs), hs);
      return;
    }
    if (this.verb === "use" || this.activeItem) {
      if (!hs) {
        this.say(this.activeItem ? "There's nothing to use that on." : "Use it on what?");
        return;
      }
      this.walkThen(() => this.doUse(hs), hs);
      return;
    }
    // Walk. If the hotspot wants a default walk-to, go to its approach.
    if (hs?.walk) {
      this.walkThen(() => hs.walk(this), hs);
      return;
    }
    this.walkTo(x, y);
  }

  doLook(hs) {
    if (!hs) {
      this.say("Nothing worth writing home about.");
      return;
    }
    const text = typeof hs.look === "function" ? hs.look(this) : hs.look;
    this.say(text || "Nothing special.");
  }

  doTalk(hs) {
    if (!hs) {
      this.say("Talking to myself won't get me off this rock.");
      return;
    }
    if (hs.talk) {
      const text = typeof hs.talk === "function" ? hs.talk(this) : hs.talk;
      if (text) this.say(text);
      return;
    }
    this.say("I don't think it speaks.");
  }

  doUse(hs) {
    if (this.activeItem && hs.useItem) {
      hs.useItem(this, this.activeItem);
      return;
    }
    if (this.activeItem) {
      this.say("That doesn't work.");
      return;
    }
    if (hs.use) {
      hs.use(this);
      return;
    }
    this.say("I can't use that.");
  }

  doTake(hs) {
    if (hs.take) {
      hs.take(this);
      return;
    }
    this.say("I can't pick that up.");
  }

  walkThen(action, hs) {
    const room = this.room();
    const dest = approachPoint(hs, room.walkable);
    if (!dest) {
      action();
      return;
    }
    const dx = dest.x - this.player.x;
    const dy = dest.y - this.player.y;
    if (dx * dx + dy * dy < 22 * 22) {
      action();
      return;
    }
    this.pending = action;
    this.walkTo(dest.x, dest.y);
  }

  walkTo(x, y) {
    const room = this.room();
    if (!room) return;
    const dest = nearestOnPoly(x, y, room.walkable, 4);
    this.player.path = findPath(this.player.x, this.player.y, dest.x, dest.y, room.walkable, 8);
    this.moving = this.player.path.length > 0;
  }

  onKey(ev) {
    if (this.term?.isOpen) return;
    if (ev.repeat && ev.key !== "ArrowUp" && ev.key !== "ArrowDown" && ev.key !== "ArrowLeft" && ev.key !== "ArrowRight" && ev.key !== "w" && ev.key !== "a" && ev.key !== "s" && ev.key !== "d") {
      return;
    }
    if (ev.key === "Escape") {
      if (this.mode === "play") this.toggleMenu();
      return;
    }
    if (this.mode !== "play") return;
    if (this.speechVisible && (ev.key === " " || ev.key === "Enter")) {
      ev.preventDefault();
      this.advanceSpeech();
      return;
    }
    if (ev.key === "1") this.setVerb("walk");
    if (ev.key === "2") this.setVerb("look");
    if (ev.key === "3") this.setVerb("use");
    if (ev.key === "4") this.setVerb("pickup");
    if (ev.key === "5") this.setVerb("talk");
    if (ev.key === "i" || ev.key === "I") this.toggleInventory();
    if (ev.key === "m" || ev.key === "M") {
      this.music.toggle();
      this.syncMusicButtons();
    }
    if (ev.key === "`") {
      this.debug = !this.debug;
    }
    this.keys.add(ev.key);
  }

  onKeyUp(ev) {
    this.keys.delete(ev.key);
  }

  say(lines) {
    const list = Array.isArray(lines) ? lines : [lines];
    this.speech.push(...list.filter(Boolean));
    if (!this.speechVisible) this.advanceSpeech();
  }

  advanceSpeech() {
    const next = this.speech.shift();
    const box = this.root.querySelector("#speech");
    if (!next) {
      this.speechVisible = null;
      box.hidden = true;
      this.busy = false;
      this.updateCursor();
      if (this.afterSpeech) {
        const fn = this.afterSpeech;
        this.afterSpeech = null;
        fn();
      }
      return;
    }
    this.speechVisible = next;
    this.busy = true;
    box.hidden = false;
    box.textContent = next;
    this.updateCursor();
    this.updateStatus();
  }

  toggleInventory(force) {
    const el = this.root.querySelector("#inventory");
    const open = force ?? el.hidden;
    el.hidden = !open;
    if (open) this.renderInventory();
  }

  toggleMenu(force) {
    const el = this.root.querySelector("#menu");
    const open = force ?? el.hidden;
    el.hidden = !open;
    if (!el.hidden) {
      const has = !!localStorage.getItem(SAVE_KEY);
      this.root.querySelector("#btn-load").disabled = !has;
    }
  }

  renderInventory() {
    const el = this.root.querySelector("#inv-slots");
    el.innerHTML = "";
    for (const id of this.inventory) {
      const item = this.world.items[id];
      const btn = document.createElement("button");
      btn.className = "slot" + (this.activeItem === id ? " active" : "");
      btn.dataset.item = id;
      btn.title = item.name;
      const img = document.createElement("img");
      img.src = item.icon;
      img.alt = item.name;
      img.draggable = false;
      btn.append(img);
      const cap = document.createElement("span");
      cap.textContent = item.name;
      btn.append(cap);
      el.append(btn);
    }
    if (!this.inventory.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Pockets empty.";
      el.append(empty);
    }
  }

  changeRoom(id, spawn) {
    const go = () => {
      this.afterFade = () => {
        this.roomId = id;
        const room = this.room();
        const s = spawn || room.start;
        this.player.x = s.x;
        this.player.y = s.y;
        this.player.dir = s.dir || this.player.dir;
        this.player.path = [];
        this.moving = false;
        this.pending = null;
        this.root.querySelector("#room-name").textContent = room.name;
        if (room.music) this.music.play(room.music);
        if (room.onEnter) room.onEnter(this);
        this.autosave();
      };
      this.fadeDir = 1;
    };
    if (this.speechVisible || this.speech.length) this.afterSpeech = go;
    else go();
  }

  playerScale() {
    const room = this.room();
    const [y0, s0] = room.scaleTop || [220, 0.62];
    const [y1, s1] = room.scaleBot || [350, 1.02];
    const t = Math.max(0, Math.min(1, (this.player.y - y0) / (y1 - y0 || 1)));
    return s0 + (s1 - s0) * t;
  }

  faceToward(x, y) {
    const dx = x - this.player.x;
    const dy = y - this.player.y;
    if (Math.abs(dx) > Math.abs(dy)) this.player.dir = dx < 0 ? "left" : "right";
    else this.player.dir = dy < 0 ? "up" : "down";
  }

  stepPlayer(dt) {
    if (this.busy || this.speechVisible) return;
    if (!this.root.querySelector("#menu").hidden) return;
    if (this.trapped()) return;
    if (this.emerge) return;
    if (this.term?.isOpen) return;
    const room = this.room();
    if (!room) return;

    const axis = this.axis();
    if (axis.x || axis.y) {
      this.pending = null;
      const nx = this.player.x + axis.x * this.player.speed * dt;
      const ny = this.player.y + axis.y * this.player.speed * dt;
      if (pointInPoly(nx, this.player.y, room.walkable)) this.player.x = nx;
      if (pointInPoly(this.player.x, ny, room.walkable)) this.player.y = ny;
      this.faceToward(this.player.x + axis.x, this.player.y + axis.y);
      this.moving = true;
      this.walkPhase += dt;
      return;
    }

    if (!this.player.path.length) {
      if (this.moving && this.pending) {
        const act = this.pending;
        this.pending = null;
        this.moving = false;
        act();
        return;
      }
      this.moving = false;
      return;
    }
    const dest = this.player.path[0];
    const dx = dest.x - this.player.x;
    const dy = dest.y - this.player.y;
    const dist = Math.hypot(dx, dy);
    const step = this.player.speed * dt;
    if (dist < 1.5 || step >= dist) {
      this.player.x = dest.x;
      this.player.y = dest.y;
      this.player.path.shift();
    } else {
      this.player.x += (dx / dist) * step;
      this.player.y += (dy / dist) * step;
      this.faceToward(dest.x, dest.y);
    }
    this.moving = true;
    this.walkPhase += dt;
  }

  axis() {
    let x = 0, y = 0;
    if (this.keys.has("ArrowLeft") || this.keys.has("a")) x -= 1;
    if (this.keys.has("ArrowRight") || this.keys.has("d")) x += 1;
    if (this.keys.has("ArrowUp") || this.keys.has("w")) y -= 1;
    if (this.keys.has("ArrowDown") || this.keys.has("s")) y += 1;
    if (x && y) {
      x *= 0.707;
      y *= 0.707;
    }
    return { x, y };
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    const room = this.room();
    if (room) {
      const bg = this.img(room.bg);
      if (bg) ctx.drawImage(bg, 0, 0, W, H);
      for (const hs of room.hotspots || []) {
        if (hs.visible && !hs.visible(this)) continue;
        if (hs.baseImage && hs.baseRect) {
          const base = this.img(hs.baseImage);
          if (base) ctx.drawImage(base, hs.baseRect[0], hs.baseRect[1], hs.baseRect[2], hs.baseRect[3]);
        }
        if (!hs.image || !hs.rect) continue;
        const im = this.img(hs.image);
        if (!im) continue;
        let ox = 0;
        if (this.shake && this.shake.id === hs.id && this.shake.t > 0) {
          const k = this.shake.t / this.shake.dur;
          ox = Math.sin(this.shake.t * 70) * 3 * k;
        }
        ctx.drawImage(im, hs.rect[0] + ox, hs.rect[1], hs.rect[2], hs.rect[3]);
      }
      this.drawPlayer(ctx);
      if (this.debug) this.drawDebug(ctx, room);
    }
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(4, 3, 6, ${this.fade})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  stepEmerge(dt) {
    const e = this.emerge;
    if (!e) return;
    e.t += dt;
    this.player.dir = "right";
    if (e.t < e.climb) {
      this.player.x = e.x0;
      this.player.y = e.y0;
      this.moving = false;
      return;
    }
    const u = Math.min(1, (e.t - e.climb) / (e.dur - e.climb));
    const ease = 1 - (1 - u) * (1 - u);
    this.player.x = e.x0 + (e.x1 - e.x0) * ease;
    this.player.y = e.y0 + (e.y1 - e.y0) * ease;
    this.moving = true;
    this.walkPhase += dt;
    if (u < 1) return;
    this.emerge = null;
    this.moving = false;
    this.player.x = e.x1;
    this.player.y = e.y1;
    this.setFlag("wokeInWreckage");
    this.say([
      "The door gives. I climb out of a fridge.",
      "Meteor insurance. One star.",
      "The sky's still falling. I need a way out.",
    ]);
    this.autosave();
  }

  drawPlayer(ctx) {
    if (this.trapped()) return;
    const climbing = this.emerge && this.emerge.t < this.emerge.climb;
    const walking = this.moving && !this.speechVisible && !climbing;
    const useWalk = walking && Math.floor(this.walkPhase * 6) % 2 === 1;
    const src = climbing
      ? "assets/sprites/russell-emerge.png"
      : `assets/sprites/russell-${this.player.dir}${useWalk ? "-walk" : ""}.png`;
    const im = this.img(src) || this.img(`assets/sprites/russell-${this.player.dir}.png`);
    if (!im) return;
    const scale = this.playerScale();
    const w = im.width * scale;
    const h = im.height * scale;
    const x = this.player.x - w / 2;
    const y = this.player.y - h;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(this.player.x, this.player.y - 2, w * 0.28, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(im, x, y, w, h);
    ctx.restore();
  }

  drawDebug(ctx, room) {
    ctx.save();
    ctx.strokeStyle = "rgba(80, 255, 160, 0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    room.walkable.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
    for (const hs of room.hotspots || []) {
      if (hs.visible && !hs.visible(this)) continue;
      ctx.strokeStyle = "rgba(255, 200, 60, 0.9)";
      if (hs.rect) ctx.strokeRect(...hs.rect);
    }
    ctx.fillStyle = "#fff";
    ctx.font = "10px monospace";
    ctx.fillText(`${this.player.x | 0},${this.player.y | 0} ${this.roomId}`, 8, H - 8);
    ctx.restore();
  }

  snapshot() {
    return {
      roomId: this.roomId,
      player: { x: this.player.x, y: this.player.y, dir: this.player.dir },
      inventory: [...this.inventory],
      flags: { ...this.flags },
    };
  }

  apply(data) {
    this.roomId = data.roomId;
    this.player.x = data.player.x;
    this.player.y = data.player.y;
    this.player.dir = data.player.dir;
    this.player.path = [];
    this.inventory = [...data.inventory];
    this.flags = { ...data.flags };
    if (
      !this.flags.outOfFridge &&
      (this.flags.wokeInWreckage || this.inventory.length || this.flags.doorForced || this.flags.logRead)
    ) {
      this.flags.outOfFridge = true;
    }
    this.pending = null;
    this.speech = [];
    this.speechVisible = null;
    this.root.querySelector("#speech").hidden = true;
    this.root.querySelector("#room-name").textContent = this.room()?.name || "";
    this.renderInventory();
  }

  save() {
    if (!this.roomId) return;
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.snapshot()));
    this.refreshContinue();
  }

  autosave() {
    if (this.mode === "play" && this.roomId) this.save();
  }

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      this.apply(JSON.parse(raw));
      return true;
    } catch {
      return false;
    }
  }

  refreshContinue() {
    const btn = this.root.querySelector("#btn-continue");
    if (btn) btn.hidden = !localStorage.getItem(SAVE_KEY);
  }

  reset() {
    this.inventory = [];
    this.flags = {};
    this.activeItem = null;
    this.speech = [];
    this.speechVisible = null;
    this.player.path = [];
    this.pending = null;
    this.setVerb("walk");
    this.renderInventory();
  }

  startIntro() {
    this.reset();
    this.music.play("title");
    this.mode = "intro";
    this.root.querySelector("#title").hidden = true;
    this.root.querySelector("#menu").hidden = true;
    this.root.querySelector("#endcard").hidden = true;
    const intro = this.root.querySelector("#intro");
    intro.hidden = false;
    const lines = this.world.intro;
    const mount = intro.querySelector("#intro-lines");
    mount.innerHTML = "";
    let i = 0;
    const show = () => {
      if (i >= lines.length) {
        intro.querySelector(".hint").hidden = false;
        return;
      }
      const p = document.createElement("p");
      p.textContent = lines[i++];
      mount.append(p);
      setTimeout(show, 1100);
    };
    show();
    const skip = () => {
      intro.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      this.enterPlay(true);
    };
    const onKey = (ev) => {
      if (ev.key === " " || ev.key === "Enter") skip();
    };
    intro.addEventListener("click", skip);
    window.addEventListener("keydown", onKey);
  }

  enterPlay(fresh) {
    this.mode = "play";
    this.root.querySelector("#title").hidden = true;
    this.root.querySelector("#intro").hidden = true;
    this.root.querySelector("#hud").hidden = false;
    this.root.querySelector("#endcard").hidden = true;
    this.fade = 1;
    this.fadeDir = -1;
    if (fresh || !this.roomId) {
      const start = this.world.startRoom;
      this.roomId = start;
      const room = this.room();
      this.player.x = room.start.x;
      this.player.y = room.start.y;
      this.player.dir = room.start.dir || "right";
      this.root.querySelector("#room-name").textContent = room.name;
      if (room.onEnter) room.onEnter(this);
    }
    const playing = this.room();
    if (playing?.music) this.music.play(playing.music);
    this.updateCursor();
    this.autosave();
  }

  showEnd(title, body) {
    this.mode = "end";
    this.music.play("title");
    this.root.querySelector("#hud").hidden = true;
    const el = this.root.querySelector("#endcard");
    el.hidden = false;
    el.querySelector("h2").textContent = title;
    el.querySelector("p").textContent = body;
  }

  tick(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    if (this.mode === "play") {
      if (this.shake) {
        this.shake.t -= dt;
        if (this.shake.t <= 0) this.shake = null;
      }
      this.stepEmerge(dt);
      this.stepPlayer(dt);
      if (this.fadeDir !== 0) {
        this.fade += this.fadeDir * dt * 2.6;
        if (this.fadeDir > 0 && this.fade >= 1) {
          this.fade = 1;
          this.fadeDir = -1;
          if (this.afterFade) {
            const fn = this.afterFade;
            this.afterFade = null;
            fn();
          }
        } else if (this.fadeDir < 0 && this.fade <= 0) {
          this.fade = 0;
          this.fadeDir = 0;
        }
      }
    }
    if (this.mode === "play" || this.fade > 0) this.draw();
    requestAnimationFrame(this.tick);
  }

  syncMusicButtons() {
    const label = this.music.muted ? "Music: Off" : "Music: On";
    this.root.querySelectorAll("[data-music-toggle]").forEach((btn) => {
      btn.textContent = label;
    });
  }

  async start() {
    await this.loadImages();
    if (this.world.music) await this.music.load(this.world.music);
    this.term = new CommandTerm(this.root, this);
    this.bind();
    this.refreshContinue();
    this.setVerb("walk");
    this.syncMusicButtons();
    this.root.querySelector("#boot").hidden = true;
    this.root.querySelector("#title").hidden = false;
    requestAnimationFrame(this.tick);
  }
}
