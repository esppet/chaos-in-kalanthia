import { Adventure } from "./engine.js";
import { world } from "./world.js";
import { attachDevTools } from "./devtools.js";

const game = new Adventure(document.getElementById("app"), world);
attachDevTools(game);
game.start().catch((err) => {
  const boot = document.getElementById("boot");
  boot.hidden = false;
  boot.textContent = "Failed to start: " + err.message;
  console.error(err);
});
