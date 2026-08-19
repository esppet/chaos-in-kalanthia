import { findPath, nearestOnPoly, pointInPoly } from "./pathfind.js";
import { world } from "./world.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const square = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
];

assert(pointInPoly(50, 50, square), "center inside");
assert(!pointInPoly(150, 50, square), "outside to the right");
assert(!pointInPoly(-1, 50, square), "outside to the left");

const near = nearestOnPoly(150, 50, square, 4);
assert(near.x <= 100 && near.y >= 0, "nearest is pulled back onto the poly");

const path = findPath(10, 10, 90, 90, square, 8);
assert(path.length >= 2, "path has endpoints");
assert(path[0].x === 10 && path[0].y === 10, "path starts at origin");

for (const [id, room] of Object.entries(world.rooms)) {
  assert(pointInPoly(room.start.x, room.start.y, room.walkable), `${id} start is walkable`);
  for (const hs of room.hotspots) {
    if (!hs.approach) continue;
    const [x, y] = hs.approach;
    assert(pointInPoly(x, y, room.walkable), `${id}/${hs.id} approach is walkable`);
  }
}

console.log("pathfind + world checks passed");
