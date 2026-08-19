import { isCompatibleSave, SAVE_VERSION } from "./engine.js";
import { world } from "./world.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const goodBase = {
  version: SAVE_VERSION,
  roomId: world.startRoom,
  player: { x: 10, y: 10, dir: "down" },
  inventory: [],
  flags: {},
};

assert(isCompatibleSave(goodBase, world), "well-formed current-version save is accepted");

assert(!isCompatibleSave(null, world), "null is rejected");
assert(!isCompatibleSave(undefined, world), "undefined is rejected");
assert(!isCompatibleSave("nope", world), "non-object is rejected");

assert(
  !isCompatibleSave({ ...goodBase, version: SAVE_VERSION - 1 }, world),
  "older save version is rejected, not silently accepted"
);
assert(
  !isCompatibleSave({ ...goodBase, version: undefined }, world),
  "save with no version field (pre-versioning) is rejected"
);

assert(
  !isCompatibleSave({ ...goodBase, roomId: "no-such-room" }, world),
  "save pointing at a room that no longer exists is rejected"
);
assert(
  !isCompatibleSave({ ...goodBase, roomId: 123 }, world),
  "non-string roomId is rejected"
);

assert(
  !isCompatibleSave({ ...goodBase, inventory: "crowbar" }, world),
  "non-array inventory is rejected"
);

assert(
  !isCompatibleSave({ ...goodBase, flags: null }, world),
  "null flags is rejected"
);
assert(
  !isCompatibleSave({ ...goodBase, flags: "outOfFridge" }, world),
  "non-object flags is rejected"
);

assert(
  !isCompatibleSave({ ...goodBase, player: { x: "10", y: 10 } }, world),
  "non-numeric player.x is rejected"
);
assert(
  !isCompatibleSave({ ...goodBase, player: null }, world),
  "missing player is rejected"
);

console.log("save compatibility checks passed");
