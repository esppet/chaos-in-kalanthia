/** First playable slice: intro, military base, street at Zero. */

export const world = {
  startRoom: "base-exterior",
  music: {
    title: "assets/music/title.ogg?v=5",
    courtyard: "assets/music/courtyard.ogg?v=5",
    command: "assets/music/command.ogg?v=6",
  },
  intro: [
    "Kalanthia. Off-world colony.",
    "A meteor strike has shattered the surface.",
    "Replicant soldier Russell rode out the strike in an old refrigerator.",
    "The door is jammed. Someone has to let him out.",
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
      start: { x: 176, y: 322, dir: "right" },
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
        if (game.flag("outOfFridge") && !game.flag("wokeInWreckage")) {
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
          rect: [108, 282, 52, 36],
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
          id: "fridge",
          name: "refrigerator door",
          image: "assets/items/fridge.png",
          rect: [12, 208, 80, 100],
          baseImage: "assets/items/fridge-rubble.png",
          baseRect: [2, 218, 100, 108],
          approach: [176, 322],
          look: (game) =>
            game.flag("outOfFridge")
              ? "My bunker. One star. Would not ride out a second strike."
              : "An old icebox. I dove in when the sky fell. The door's jammed from the inside.",
          use: (game) => knockFridge(game),
          take: (game) => knockFridge(game),
          talk: (game) => knockFridge(game),
          walk: (game) => knockFridge(game),
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
          rect: [468, 118, 172, 168],
          approach: [470, 300],
          look: (game) =>
            game.flag("logRead")
              ? "The terminal's still looping the last emergency broadcast."
              : "A cracked command terminal. Green static. It wants to talk.",
          use: (game) => game.openTerminal(),
          useItem: (game) => game.openTerminal(),
          talk: (game) => game.openTerminal(),
          walk: (game) => game.openTerminal(),
        },
        {
          id: "floor",
          name: "standing water",
          rect: [180, 300, 300, 50],
          look: "The floor's a mirror. I look like someone who should already be gone.",
        },
      ],
    },
    "zero-street": {
      name: "Apartment Building Zero — Street",
      bg: "assets/rooms/zero-street.png",
      music: "courtyard",
      start: { x: 220, y: 328, dir: "right" },
      scaleTop: [260, 0.52],
      scaleBot: [350, 0.76],
      walkable: [
        [190, 284],
        [270, 268],
        [400, 264],
        [500, 270],
        [558, 288],
        [580, 314],
        [568, 348],
        [228, 350],
        [174, 318],
      ],
      onEnter(game) {
        if (!game.flag("seenZeroStreet")) {
          game.setFlag("seenZeroStreet");
          game.say([
            "There it is. Zero. The log didn't smell like this.",
            "Someone's still standing by the doors.",
          ]);
        }
      },
      hotspots: [
        {
          id: "sky",
          name: "burning sky",
          rect: [0, 0, 300, 140],
          look: "Same sky. Closer fire. I didn't outrun anything.",
          use: (game) => game.say("Still not punching meteors."),
          talk: "The sky keeps dropping the same argument.",
        },
        {
          id: "zero",
          name: "Apartment Building Zero",
          rect: [310, 8, 250, 168],
          approach: [420, 286],
          look: "This close, Zero looks like a broken tooth. Robert's in the part that's still standing.",
          use: (game) => tryZeroDoors(game),
          walk: (game) => tryZeroDoors(game),
          talk: "I shout the kid's name. The building answers with another groan.",
        },
        {
          id: "scrap",
          name: "road wreckage",
          rect: [0, 90, 175, 270],
          approach: [210, 322],
          look: "The road here died the same way the base did. Just more of it.",
          use: (game) => game.say("Already picked through on the way in. Nothing but rust."),
          take: (game) => game.say("I can't pocket a gantry."),
        },
        {
          id: "mid-rubble",
          name: "fallen storeys",
          rect: [248, 170, 120, 58],
          approach: [290, 286],
          look: "Floors that used to be upstairs. Whoever was in them isn't asking for help.",
          use: (game) => game.say("I move a slab. There's only more slab."),
        },
        {
          id: "slab",
          name: "collapsed wall",
          rect: [500, 112, 85, 150],
          approach: [520, 292],
          look: "A whole face of the building peeled off and lay down to die.",
          use: (game) => game.say("Too heavy. The crowbar would just laugh at me."),
        },
        {
          id: "lamp",
          name: "street lamp",
          rect: [558, 68, 78, 200],
          approach: [548, 322],
          look: "Still standing. Still useless. Optimistic, like the beacon back at the base.",
          use: (game) => game.say("No switch. No light. Just a pole with opinions."),
        },
        {
          id: "puddle",
          name: "fire puddle",
          rect: [300, 286, 210, 56],
          look: "Zero burning in a pothole. I look like a man walking into a reflection.",
        },
        {
          id: "road",
          name: "road to the base",
          rect: [155, 150, 155, 95],
          approach: [230, 300],
          look: "The cracked road back to the military base. The ship still needs parts.",
          use: (game) => leaveZeroStreet(game),
          walk: (game) => leaveZeroStreet(game),
          talk: "Nothing on that road but smoke.",
        },
        {
          id: "beacon",
          name: "warning beacon",
          rect: [575, 252, 48, 90],
          approach: [548, 322],
          look: "Another little machine doing its job. This one has a better view of the disaster.",
          use: (game) => game.say("It's already warning everyone. Everyone already knows."),
        },
        {
          id: "lobby",
          name: "lobby doors",
          rect: [378, 172, 100, 80],
          approach: [420, 286],
          look: "The glass is already gone. A dark lobby. Stairs somewhere in the smoke.",
          use: (game) => tryZeroDoors(game),
          useItem: (game, item) => {
            if (item === "crowbar") game.say("The doors aren't the problem. They're already open.");
            else game.say("That won't get me to the top floor.");
          },
          walk: (game) => tryZeroDoors(game),
          talk: "Robert! ... Nothing. Either he can't hear me, or I don't want to know.",
          take: (game) => game.say("I'll take the whole lobby if I have to. After I find a way up."),
        },
        {
          id: "annita",
          name: "Annita",
          image: "assets/sprites/annita-right.png",
          rect: [356, 178, 72, 100],
          approach: [360, 290],
          look: (game) =>
            game.flag("talkedToAnnita")
              ? "Annita. Ash in her hair. She's not leaving until Robert comes out."
              : "A woman by the doors. She's been shouting at the tower until her voice went.",
          use: (game) =>
            game.say("She doesn't need a crowbar. She needs someone who can walk into that."),
          take: (game) => game.say("I'm not carrying her. Her kid's still inside."),
          talk: (game) => talkAnnita(game),
          walk: (game) => talkAnnita(game),
        },
      ],
    },
  },
};

function knockFridge(game) {
  if (game.flag("outOfFridge")) {
    game.say("I'm already out. The icebox can keep the next meteor.");
    return;
  }
  const n = (game.flags.fridgeHits || 0) + 1;
  game.flags.fridgeHits = n;
  game.shakeProp("fridge", 0.22);
  if (n === 1) game.say("The door shudders. Come on.");
  else if (n === 2) game.say("The seal's warped. Again.");
  else if (n === 3) game.say("One more.");
  else {
    game.setFlag("outOfFridge");
    game.startEmerge();
  }
  game.autosave();
}

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

function tryTown(game) {
  if (!game.flag("logRead")) {
    game.say("Town can wait. If there's a ship on this base, I find out what it needs first.");
    return;
  }
  game.setFlag("headedToZero");
  game.changeRoom("zero-street", { x: 220, y: 328, dir: "right" });
}

function leaveZeroStreet(game) {
  game.changeRoom("base-exterior", { x: 220, y: 268, dir: "down" });
}

function talkAnnita(game) {
  if (game.flag("talkedToAnnita")) {
    game.say("Every minute the stairs get worse. Please.");
    return;
  }
  game.setFlag("talkedToAnnita");
  game.say([
    "You. Military. Please.",
    "My boy is still up there. Robert. Top floors.",
    "The smoke turned me back. I can't reach him.",
  ]);
}

function tryZeroDoors(game) {
  if (!game.flag("talkedToAnnita")) {
    game.say("Someone's at the doors. I should hear her first.");
    return;
  }
  game.say([
    "The lobby's open. Stairs in the dark.",
    "The second I go in, that ten-minute clock starts. Not yet.",
  ]);
}
