/** Developer-only room jumper. Stripped on promote to stable. */

export function attachDevTools(game) {
  const dock = document.createElement("div");
  dock.id = "dev-dock";
  dock.innerHTML = `
    <button type="button" id="dev-rooms-toggle" title="Screen selector (F2)">Screens</button>
    <div id="dev-rooms" hidden>
      <div class="dev-rooms-head">Jump to screen</div>
      <div id="dev-rooms-list"></div>
    </div>
  `;
  document.body.append(dock);

  const list = dock.querySelector("#dev-rooms-list");
  const panel = dock.querySelector("#dev-rooms");
  const rooms = Object.entries(game.world.rooms);
  rooms.sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  for (const [id, room] of rooms) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = room.name || id;
    btn.dataset.room = id;
    btn.title = id;
    list.append(btn);
  }

  const toggle = () => {
    panel.hidden = !panel.hidden;
  };
  dock.querySelector("#dev-rooms-toggle").addEventListener("click", toggle);
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "F2") {
      ev.preventDefault();
      toggle();
    }
  });
  list.addEventListener("click", (ev) => {
    const id = ev.target?.dataset?.room;
    if (!id) return;
    game.music.unlock();
    game.jumpToRoom(id);
    for (const btn of list.querySelectorAll("button")) {
      btn.classList.toggle("here", btn.dataset.room === id);
    }
  });
}
