import { Adventure } from "./engine.js";
import { Soundtrack } from "./music.js";
import { world } from "./world.js";

const game = new Adventure(document.getElementById("app"), world);
game.start().catch((err) => {
  const boot = document.getElementById("boot");
  boot.hidden = false;
  boot.textContent = "Failed to start: " + err.message;
  console.error(err);
});
