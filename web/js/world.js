/** First playable slice: intro + military base. Designed to grow room-by-room. */

export const world = {
  startRoom: "base-exterior",
  music: {
    title: "assets/music/title.ogg",
    courtyard: "assets/music/courtyard.ogg",
    command: "assets/music/command.ogg",
  },
  intro: [
    "Kalanthia. Off-world colony.",
    "A meteor strike has shattered the surface.",
    "Replicant soldier Russell wakes in the wreckage of the military base.",
    "His only way off this rock is a ship — if it still flies.",
  ],
  items: {
    crowbar: {
      name: "crowbar",
      icon: "assets/items/crowbar.png",
      look: "A bent steel crowbar. Ugly. Honest. Still the best argument in the room.",
    },
    dataslug: {
      name: "command slug",
      icon: "assets/items/dataslug.png",
      look: "A scuffed command slug. Emergency log from the last people who thought they had time.",
    },
  },
  rooms: {
    "base-exterior": {
      name: "Military Base — Courtyard",
      bg: "assets/rooms/base-exterior.png",
      music: "courtyard",
      start: { x: 360, y: 318, dir: "right" },
      scaleTop: [230, 0.52],
      scaleBot: [350, 0.78],
      walkable: [
        [168, 252],
        [268, 246],
        [300, 258],
        [448, 252],
        [518, 262],
        [568, 286],
        [572, 332],
        [540, 348],
        [176, 350],
        [154, 318],
      ],
      onEnter(game) {
        if (!game.flag("wokeInWreckage")) {
          game.setFlag("wokeInWreckage");
          game.say([
            "The sky's still falling. I need a way out.",
            "If the hangar ship's intact, it still needs parts. And a door that opens.",
          ]);
        }
      },
      hotspots: [
        {
          id: "sky",
          name: "burning sky",
          rect: [0, 0, 470, 145],
          look: "Meteor fire on the horizon. And that tower — Zero. That's where the kid is.",
          use: (game) => game.say("I can't punch a meteor. Already checked."),
          talk: "The sky doesn't answer. It just keeps falling.",
        },
        {
          id: "zero",
          name: "Apartment Building Zero",
          rect: [148, 48, 130, 115],
          approach: [220, 260],
          look: (game) =>
            game.flag("logRead")
              ? "Zero. Top floors still standing. Robert's up there, and the clock is running."
              : "A megacomplex on the horizon. Ugly. Huge. On fire. Someone's still in there.",
          use: (game) => tryTown(game),
          walk: (game) => tryTown(game),
          take: (game) => game.say("I'd pocket the whole building if I could. Later."),
          talk: "Too far to shout. I'll have to go there.",
        },
        {
          id: "road",
          name: "road to town",
          rect: [148, 168, 140, 78],
          approach: [220, 260],
          look: (game) =>
            game.flag("logRead")
              ? "Smoke over the colony town. That's Zero. The building's coming down."
              : "A cracked road toward the colony town. Something big is burning out there.",
          use: (game) => tryTown(game),
          walk: (game) => tryTown(game),
          talk: "If anyone's still on that road, they're not talking.",
        },
        {
          id: "crowbar-prop",
          name: "crowbar",
          image: "assets/items/crowbar.png",
          rect: [68, 248, 72, 54],
          approach: [176, 318],
          visible: (game) => !game.has("crowbar"),
          look: "A crowbar jammed through a girder. That's leverage.",
          use: (game) => takeCrowbar(game),
          take: (game) => takeCrowbar(game),
          talk: "If I ask nicely, it still won't unstick itself.",
        },
        {
          id: "wreckage-left",
          name: "twisted gantry",
          rect: [0, 175, 155, 180],
          approach: [175, 320],
          look: (game) =>
            game.has("crowbar")
              ? "Just scrap now. I already took the only useful thing."
              : "Collapsed gantry. Something straight and steel is wedged in the pile.",
          use: (game) => takeCrowbar(game),
          take: (game) => takeCrowbar(game),
          talk: "The metal groans. That's the only conversation it's offering.",
        },
        {
          id: "wreckage-mid",
          name: "scrap pile",
          rect: [286, 158, 155, 82],
          look: "A hangar roof, last I saw it. Now it's modern art.",
          use: (game) => game.say("Already picked through. Nothing left but rust."),
        },
        {
          id: "door",
          name: "blast door",
          rect: [512, 112, 98, 118],
          approach: [500, 278],
          look: (game) =>
            game.flag("doorForced")
              ? "The door's been convinced. It won't be sealing again."
              : "A rusted blast door. Jammed since the impact. The wheel's frozen.",
          use: (game) => forceDoor(game),
          useItem: (game, item) => {
            if (item === "crowbar") forceDoor(game);
            else game.say("That's not going to move a blast door.");
          },
          talk: "I knock. The colony doesn't answer.",
          walk: (game) => forceDoor(game),
        },
        {
          id: "beacon",
          name: "warning beacon",
          rect: [598, 248, 40, 108],
          look: "A warning beacon still spinning. Optimistic little machine.",
          use: (game) => game.say("It's doing its job. Unlike the rest of this base."),
        },
        {
          id: "puddle",
          name: "chemical puddle",
          rect: [400, 286, 150, 52],
          look: "Coolant, rain, or something that used to be a person. I'm not tasting it.",
        },
      ],
    },
    "base-interior": {
      name: "Military Base — Command",
      bg: "assets/rooms/base-interior.png",
      music: "command",
      start: { x: 168, y: 318, dir: "right" },
      scaleTop: [250, 0.62],
      scaleBot: [350, 0.88],
      walkable: [
        [96, 286],
        [170, 262],
        [478, 262],
        [528, 288],
        [510, 348],
        [108, 350],
        [88, 322],
      ],
      onEnter(game) {
        if (!game.flag("seenCommand")) {
          game.setFlag("seenCommand");
          game.say("Emergency lights. That means something still has power.");
        }
      },
      hotspots: [
        {
          id: "exit",
          name: "courtyard door",
          rect: [8, 68, 122, 210],
          approach: [150, 318],
          look: "The courtyard. Meteor weather. Home sweet wreckage.",
          use: (game) => game.changeRoom("base-exterior", { x: 490, y: 286, dir: "left" }),
          walk: (game) => game.changeRoom("base-exterior", { x: 490, y: 286, dir: "left" }),
        },
        {
          id: "locker",
          name: "personnel locker",
          rect: [168, 102, 100, 148],
          approach: [220, 286],
          look: "A locker hanging open. Whoever ran, they ran light.",
          use: (game) =>
            game.say("Empty shelves. Someone beat me to the rations, the ammo, and the good boots."),
          talk: "If there's a ghost in there, it's the quiet type.",
        },
        {
          id: "schematic",
          name: "ship schematic",
          rect: [286, 78, 210, 118],
          look: "A transport silhouette. Fuel cell. Nav module. Life support. Three organs missing, and she's just a coffin with wings.",
          use: (game) =>
            game.say("I can't repair a ship by staring at a wall. But now I know what to steal."),
          talk: "I ask it where the parts are. It remains decorative.",
        },
        {
          id: "terminal",
          name: "command terminal",
          rect: [498, 138, 132, 128],
          approach: [470, 300],
          look: (game) =>
            game.flag("logRead")
              ? "The terminal's still looping the last emergency broadcast."
              : "A cracked command terminal. Green static. It wants to talk.",
          use: (game) => readLog(game),
          useItem: (game, item) => {
            if (item === "dataslug") game.say("That's where it came from. It has nothing new to add.");
            else game.say("The terminal wants a slug, not whatever this is.");
          },
          talk: (game) => readLog(game),
        },
        {
          id: "floor",
          name: "standing water",
          rect: [180, 300, 300, 50],
          look: "The floor's a mirror. I look like someone who should already be gone.",
        },
      ],
    },
  },
};

function takeCrowbar(game) {
  if (game.has("crowbar")) {
    game.say("I already took the crowbar. I'm not decorating with scrap.");
    return;
  }
  game.give("crowbar");
  game.say("A crowbar. Ugly, but it'll do.");
}

function forceDoor(game) {
  if (game.flag("doorForced")) {
    game.changeRoom("base-interior", { x: 168, y: 318, dir: "right" });
    return;
  }
  if (game.has("crowbar") || game.activeItem === "crowbar") {
    game.setFlag("doorForced");
    game.activeItem = null;
    game.say(["The wheel screams. The seal gives.", "After you, Russell."]);
    game.changeRoom("base-interior", { x: 168, y: 318, dir: "right" });
    return;
  }
  game.say("Jammed. I need leverage — something long and unfriendly.");
}

function readLog(game) {
  if (game.flag("logRead")) {
    game.say("Same loop. Zero is falling. A woman named Annita. A boy named Robert. Three missing ship parts.");
    return;
  }
  game.setFlag("logRead");
  if (!game.has("dataslug")) game.give("dataslug");
  game.say([
    "EMERGENCY LOG — last intact packet.",
    "Apartment Building Zero is collapsing. Civilian Annita reports her son Robert is still on the upper floors.",
    "Command is gone. Anyone left: the hangar ship is missing a fuel cell, nav module, and life support.",
    "A kid in a falling building. Of course.",
  ]);
}

function tryTown(game) {
  if (!game.flag("logRead")) {
    game.say("Town can wait. If there's a ship on this base, I find out what it needs first.");
    return;
  }
  game.setFlag("headedToZero");
  game.showEnd(
    "To be continued",
    "Zero is coming down. Annita's boy is still inside. Next: the megacomplex, a ten-minute clock, and a ship that will not fly until you feed it."
  );
}
