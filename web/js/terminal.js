/** In-world command terminal: shell + nano for help.txt */

const HELP_TXT = `KALANTHIA COMMAND  --  EMERGENCY PACKET
STATUS: LAST INTACT LOG

Apartment Building Zero is collapsing.
Civilian ANNITA reports her son ROBERT
is still on the upper floors.

Command is gone.

Anyone left: hangar transport is missing
  - fuel cell
  - nav module
  - life support

-- END OF FILE --
`;

export class CommandTerm {
  constructor(root, game) {
    this.root = root;
    this.game = game;
    this.el = root.querySelector("#crt");
    this.out = root.querySelector("#crt-out");
    this.input = root.querySelector("#crt-in");
    this.promptEl = root.querySelector("#crt-prompt");
    this.lineEl = root.querySelector("#crt-line");
    this.nanoEl = root.querySelector("#crt-nano");
    this.nanoBody = root.querySelector("#crt-nano-body");
    this.mode = "shell";
    this.history = [];
    this.histIdx = 0;
    this._onKey = this._onKey.bind(this);
    this._bind();
  }

  get isOpen() {
    return !!(this.el && this.el.dataset.open === "1");
  }

  _bind() {
    this.input?.addEventListener("keydown", this._onKey);
    this.root.querySelector("#crt-power")?.addEventListener("click", () => this.close());
    this.el?.addEventListener("pointerdown", () => {
      if (this.mode === "shell") this.input?.focus();
    });
    window.addEventListener("keydown", (ev) => {
      if (!this.isOpen || this.mode !== "nano") return;
      if ((ev.ctrlKey && ev.key.toLowerCase() === "x") || ev.key === "Escape") {
        ev.preventDefault();
        this._closeNano();
      }
    });
  }

  open() {
    if (!this.el) return;
    this.el.hidden = false;
    this.el.removeAttribute("hidden");
    this.el.dataset.open = "1";
    this.mode = "shell";
    if (this.nanoEl) this.nanoEl.hidden = true;
    if (this.lineEl) this.lineEl.hidden = false;
    if (this.out) this.out.innerHTML = "";
    this._print("KALANTHIA CMD  MK-7  emergency shell");
    this._print("single user. type 'help' if you still can.");
    this._print("");
    if (this.input) {
      this.input.value = "";
      requestAnimationFrame(() => this.input.focus());
    }
    this.histIdx = this.history.length;
  }

  close() {
    if (!this.el || this.el.hidden) return;
    this.el.hidden = true;
    this.el.removeAttribute("data-open");
    this.input?.blur();
    this.game.onTerminalClose?.();
  }

  _print(text, cls) {
    const line = document.createElement("div");
    if (cls) line.className = cls;
    line.textContent = text;
    this.out.append(line);
    this.out.scrollTop = this.out.scrollHeight;
  }

  _onKey(ev) {
    if (!this.isOpen) return;
    if (this.mode === "nano") {
      ev.preventDefault();
      if (ev.key === "x" && ev.ctrlKey) this._closeNano();
      if (ev.key === "Escape") this._closeNano();
      return;
    }
    if (ev.key === "Escape") {
      ev.preventDefault();
      this.close();
      return;
    }
    if (ev.key === "ArrowUp") {
      ev.preventDefault();
      if (!this.history.length) return;
      this.histIdx = Math.max(0, this.histIdx - 1);
      this.input.value = this.history[this.histIdx] || "";
      return;
    }
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      this.histIdx = Math.min(this.history.length, this.histIdx + 1);
      this.input.value = this.history[this.histIdx] || "";
      return;
    }
    if (ev.key === "Enter") {
      ev.preventDefault();
      const raw = this.input.value;
      this._print("root@cmd:~# " + raw, "cmd");
      this.input.value = "";
      if (raw.trim()) {
        this.history.push(raw);
        this.histIdx = this.history.length;
        this._exec(raw.trim());
      }
      this.out.scrollTop = this.out.scrollHeight;
    }
  }

  _exec(raw) {
    const parts = raw.split(/\s+/);
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1);
    if (cmd === "help") {
      this._print("ls          list files");
      this._print("cat FILE    print a file");
      this._print("nano FILE   open a file");
      this._print("clear       clear screen");
      this._print("exit        power down");
      return;
    }
    if (cmd === "ls" || cmd === "dir") {
      this._print("help.txt");
      return;
    }
    if (cmd === "pwd") {
      this._print("/mnt/cmd/emergency");
      return;
    }
    if (cmd === "whoami") {
      this._print("russell");
      return;
    }
    if (cmd === "clear") {
      this.out.innerHTML = "";
      return;
    }
    if (cmd === "exit" || cmd === "logout" || cmd === "quit") {
      this.close();
      return;
    }
    if (cmd === "cat") {
      if (this._isHelp(args[0])) {
        HELP_TXT.split("\n").forEach((ln) => this._print(ln));
        this.game.onTerminalRead?.();
      } else if (!args[0]) this._print("cat: missing file");
      else this._print("cat: " + args[0] + ": No such file");
      return;
    }
    if (cmd === "nano") {
      if (this._isHelp(args[0])) this._openNano();
      else if (!args[0]) this._print("Usage: nano help.txt");
      else this._print("nano: " + args[0] + ": No such file");
      return;
    }
    this._print(cmd + ": command not found");
  }

  _isHelp(name) {
    if (!name) return false;
    const n = name.replace(/^\.\//, "").toLowerCase();
    return n === "help.txt" || n === "help";
  }

  _openNano() {
    this.mode = "nano";
    this.lineEl.hidden = true;
    this.nanoEl.hidden = false;
    this.nanoBody.textContent = HELP_TXT;
    this.game.onTerminalRead?.();
  }

  _closeNano() {
    this.mode = "shell";
    this.nanoEl.hidden = true;
    this.lineEl.hidden = false;
    this._print("help.txt  [ Read only ]");
    this.input.focus();
  }
}
