/** Apartment Building Zero: lobby, ten halls, roof, lab. */

const HALL_WALK = [
  [70, 278],
  [200, 262],
  [420, 258],
  [540, 268],
  [590, 300],
  [570, 348],
  [90, 350],
  [50, 318],
];

function hallTemplate(n) {
  const room = {
    name: `Zero — Floor ${n}`,
    bg: "assets/rooms/zero-hall.png",
    music: "command",
    floor: n,
    start: { x: 180, y: 318, dir: "right" },
    scaleTop: [250, 0.58],
    scaleBot: [350, 0.82],
    walkable: HALL_WALK.map((p) => [...p]),
    onEnter(game) {
      if (!game.flags.seenFloor) game.flags.seenFloor = {};
      if (!game.flags.seenFloor[n]) {
        game.flags.seenFloor[n] = true;
        if (n === 1) game.say("Floor one. Nine more of this. The kid's at the top.");
        else if (n === 2) game.say("Two. Something about this landing feels lived-in.");
        else if (n === 10) game.say("Ten. If the roof door still works, this is the last lock.");
        else if (n === 5) game.say("Five. The building ticks like a clock with a grudge.");
      }
    },
    hotspots: [
      {
        id: "stairs-up",
        name: "stairs up",
        rect: [88, 118, 130, 145],
        approach: [170, 300],
        look:
          n === 10
            ? "The stairwell ends. The heavy door is the only way higher."
            : "Concrete going up. The rail is warmer than it should be.",
        use: (game) => goUp(game, n),
        walk: (game) => goUp(game, n),
      },
      {
        id: "stairs-down",
        name: "stairs down",
        rect: [70, 248, 90, 50],
        approach: [160, 310],
        look: n === 1 ? "Back to the lobby. Annita's still down there." : `Down to ${n - 1}.`,
        use: (game) => goDown(game, n),
        walk: (game) => goDown(game, n),
      },
      {
        id: "elevator",
        name: "elevator",
        rect: [568, 88, 68, 190],
        approach: [540, 310],
        look: "The call lamp is still on. That's not comfort. That's bait.",
        use: (game) => rideElevator(game),
        walk: (game) => rideElevator(game),
        talk: "I don't talk to shafts.",
      },
      {
        id: "radiator",
        name: "radiator",
        rect: [6, 208, 78, 78],
        approach: [130, 312],
        look: (game) => lookRadiator(game, n),
        use: (game) => lookRadiator(game, n),
        take: (game) => tryTakeServiceKey(game, n),
      },
      {
        id: "service-key",
        name: "soot-black key",
        image: "assets/items/service-key.png",
        rect: [28, 248, 22, 16],
        approach: [130, 312],
        visible: (game) => n === 2 && game.flag("lookedRadiator") && !game.has("serviceKey"),
        look: "A service key, taped behind the radiator and painted with soot. Easy to miss.",
        use: (game) => tryTakeServiceKey(game, n),
        take: (game) => tryTakeServiceKey(game, n),
      },
      {
        id: "plant",
        name: "dead plant",
        rect: [498, 198, 62, 88],
        approach: [490, 308],
        look: "It died of the same thing the tenants did. Thirst, then fire.",
        use: (game) => game.say("I turn the pot. Dirt. Roots. No key. Not this one."),
        take: (game) => game.say("I'm not stealing a corpse."),
      },
      {
        id: "wreck-door",
        name: "blown apartment",
        rect: [268, 148, 70, 108],
        approach: [280, 300],
        look: "The door took a hit. Nobody is asking for help from this one.",
        use: (game) => game.say("A room full of sky. Not useful."),
      },
      {
        id: "special-door",
        name: n === 10 ? "roof access" : n === 2 ? "apartment 2" : "apartment door",
        rect: [348, 138, 78, 118],
        approach: [380, 300],
        look: (game) => lookSpecialDoor(game, n),
        use: (game) => useSpecialDoor(game, n),
        useItem: (game, item) => useSpecialDoor(game, n, item),
        walk: (game) => useSpecialDoor(game, n),
      },
      {
        id: "hall",
        name: "corridor",
        rect: [180, 300, 280, 48],
        look: `Floor ${n}. Same cracks. Same heat. Same bad idea.`,
      },
    ],
  };
  return room;
}

function goUp(game, n) {
  if (n >= 10) {
    useSpecialDoor(game, 10);
    return;
  }
  game.changeRoom(`zero-floor-${n + 1}`, { x: 180, y: 318, dir: "right" });
}

function goDown(game, n) {
  if (n <= 1) {
    game.changeRoom("zero-lobby", { x: 500, y: 318, dir: "left" });
    return;
  }
  game.changeRoom(`zero-floor-${n - 1}`, { x: 180, y: 318, dir: "right" });
}

function lookRadiator(game, n) {
  if (n !== 2) {
    game.say("Cold iron. Same radiator as every other floor.");
    return;
  }
  if (game.has("serviceKey")) {
    game.say("I already robbed it.");
    return;
  }
  game.setFlag("lookedRadiator");
  game.say("It's been pried off the wall. There's soot in the gap. Something taped back there.");
}

function tryTakeServiceKey(game, n) {
  if (n !== 2) {
    game.say("Nothing but rust.");
    return;
  }
  if (game.has("serviceKey")) {
    game.say("I already have the key.");
    return;
  }
  if (!game.flag("lookedRadiator")) {
    game.say("A radiator. Unless I look closer, that's all it is.");
    return;
  }
  game.give("serviceKey");
  game.say("A service key, black with soot. Someone hid this on purpose.");
}

function lookSpecialDoor(game, n) {
  if (n === 10) {
    return game.flag("roofUnlocked")
      ? "The roof door is open. Heat and sky on the other side."
      : "A service door. Roof access. The lock is still proud of itself.";
  }
  if (n === 2) {
    return game.flag("aptUnlocked")
      ? "Apartment 2. The lock gave. Cold air and chemicals inside."
      : "A heavier door than the others. Someone reinforced this apartment.";
  }
  return "Another deadbolt. Another empty life.";
}

function useSpecialDoor(game, n, item) {
  if (n === 10) {
    if (game.flag("roofUnlocked")) {
      game.changeRoom("zero-roof", { x: 300, y: 322, dir: "up" });
      return;
    }
    if (item === "serviceKey" || game.activeItem === "serviceKey") {
      game.setFlag("roofUnlocked");
      game.activeItem = null;
      game.say(["The soot key turns. The seal pops.", "Heat hits me in the face."]);
      game.changeRoom("zero-roof", { x: 300, y: 322, dir: "up" });
      return;
    }
    game.say("Locked. A service key would do it. Not a crowbar.");
    return;
  }
  if (n === 2) {
    if (game.flag("aptUnlocked")) {
      game.changeRoom("zero-lab", { x: 168, y: 318, dir: "right" });
      return;
    }
    if (item === "aptKey" || game.activeItem === "aptKey") {
      game.setFlag("aptUnlocked");
      game.activeItem = null;
      game.say("The brass key fits. Whoever ran this lab didn't want visitors.");
      game.changeRoom("zero-lab", { x: 168, y: 318, dir: "right" });
      return;
    }
    game.say("Locked from a better key than the soot one. Different teeth.");
    return;
  }
  game.say("Jammed or locked. Not the door I need.");
}

function leaveLobby(game) {
  if (game.flag("robertRescued")) game.flags.zeroEscaped = true;
  game.changeRoom("zero-street", { x: 420, y: 286, dir: "left" });
}

function rideElevator(game) {
  game.say([
    "The call button still works. That's the trap.",
    "The car thinks about it. Then the cable remembers the meteor.",
  ]);
  game.afterSpeech = () =>
    game.die("The shaft", "The elevator takes you to the basement. Permanently.");
}

function takeAptKey(game) {
  if (game.has("aptKey")) {
    game.say("Already in my pocket.");
    return;
  }
  if (!game.flag("lookedHvac")) {
    game.say("Junction boxes. Unless I look closer, that's all they are.");
    return;
  }
  game.give("aptKey");
  game.say("A brass apartment key, wired to the grounding strap. Easy to walk past.");
}

function takePart(game, id, line) {
  if (game.has(id)) {
    game.say("Already carrying that organ.");
    return;
  }
  game.give(id);
  game.say(line);
}

function talkRobert(game) {
  if (game.flag("robertRescued")) {
    game.say("He nods at the horizon. He isn't going near the edge.");
    return;
  }
  game.setFlag("robertRescued");
  game.converse({
    actor: "robert",
    playerStand: { x: 300, y: 318, dir: "right" },
    actorStand: { x: 368, y: 300, facing: "left" },
    lines: [
      { who: "robert", text: "You're military. Mum said not to open for anyone." },
      { who: "russell", text: "Your mum is downstairs. She sent me." },
      { who: "robert", text: "The stairs were on fire. I came up." },
      { who: "russell", text: "Stay off the edge. I'll get you down." },
    ],
  });
}

function talkAnnitaAfter(game) {
  if (game.flag("robertRescued") && !game.flag("annitaReunited")) {
    game.setFlag("annitaReunited");
    game.converse({
      actor: "annita",
      playerStand: { x: 338, y: 292, dir: "right" },
      actorStand: { x: 400, y: 290, facing: "left" },
      lines: [
        { who: "annita", text: "Robert—" },
        { who: "russell", text: "On the roof. He's waiting. The stairs still hold." },
        { who: "annita", text: "Bring him. I'll be here." },
      ],
    });
    return true;
  }
  return false;
}

export function attachZero(world) {
  world.items.serviceKey = {
    name: "soot key",
    icon: "assets/items/service-key.png",
    look: "A blacked-out service key. Found behind a radiator on floor two.",
  };
  world.items.aptKey = {
    name: "brass key",
    icon: "assets/items/apt-key.png",
    look: "A brass apartment key. Pulled off a roof grounding strap.",
  };
  world.items.fuelCell = {
    name: "fuel cell",
    icon: "assets/items/fuel-cell.png",
    look: "A ship fuel cell. Heavy. Still warm. One of three organs.",
  };
  world.items.navModule = {
    name: "nav module",
    icon: "assets/items/nav-module.png",
    look: "A nav brick. The screen still thinks it has a sky to read.",
  };
  world.items.lifeSupport = {
    name: "life support",
    icon: "assets/items/life-support.png",
    look: "Life support. The gauge is in the green. For now.",
  };

  world.rooms["zero-lobby"] = {
    name: "Zero — Lobby",
    bg: "assets/rooms/zero-lobby.png",
    music: "command",
    start: { x: 320, y: 322, dir: "up" },
    scaleTop: [250, 0.56],
    scaleBot: [350, 0.84],
    walkable: [
      [70, 286],
      [180, 268],
      [400, 262],
      [500, 270],
      [560, 300],
      [540, 348],
      [90, 350],
      [50, 320],
    ],
    onEnter(game) {
      game.startZeroClock();
      if (!game.flag("seenLobby")) {
        game.setFlag("seenLobby");
        game.say([
          "Lobby. Stairs to the right. Elevator to the left.",
          "The clock in my head just started. Ten minutes.",
        ]);
      }
    },
    hotspots: [
      {
        id: "exit",
        name: "street doors",
        rect: [220, 88, 220, 130],
        approach: [320, 300],
        look: "The street. Annita. Meteor weather.",
        use: (game) => leaveLobby(game),
        walk: (game) => leaveLobby(game),
      },
      {
        id: "elevator",
        name: "elevator",
        rect: [8, 78, 120, 200],
        approach: [150, 318],
        look: "The shaft is a throat. The car is still down there, pretending.",
        use: (game) => rideElevator(game),
        walk: (game) => rideElevator(game),
      },
      {
        id: "stairs",
        name: "stairs",
        rect: [500, 70, 130, 200],
        approach: [500, 310],
        look: "Ten floors of this. The rail is already warm.",
        use: (game) => game.changeRoom("zero-floor-1", { x: 180, y: 318, dir: "right" }),
        walk: (game) => game.changeRoom("zero-floor-1", { x: 180, y: 318, dir: "right" }),
      },
      {
        id: "board",
        name: "fallen directory",
        rect: [360, 188, 130, 90],
        look: "The tenant list. Names I don't have time to read.",
      },
    ],
  };

  for (let n = 1; n <= 10; n++) {
    world.rooms[`zero-floor-${n}`] = hallTemplate(n);
  }

  world.rooms["zero-roof"] = {
    name: "Zero — Roof",
    bg: "assets/rooms/zero-roof.png",
    music: "courtyard",
    start: { x: 300, y: 322, dir: "up" },
    scaleTop: [250, 0.52],
    scaleBot: [350, 0.78],
    walkable: [
      [80, 276],
      [200, 258],
      [480, 258],
      [560, 280],
      [560, 348],
      [90, 350],
    ],
    onEnter(game) {
      if (!game.flag("seenRoof")) {
        game.setFlag("seenRoof");
        game.say([
          "The whole colony is on fire. The base is a speck on the horizon.",
          "And there's the boy.",
        ]);
      }
    },
    hotspots: [
      {
        id: "hatch",
        name: "stairwell",
        rect: [0, 300, 120, 56],
        approach: [140, 330],
        look: "The way back down. Ten floors of the same bad hallway.",
        use: (game) => game.changeRoom("zero-floor-10", { x: 380, y: 300, dir: "down" }),
        walk: (game) => game.changeRoom("zero-floor-10", { x: 380, y: 300, dir: "down" }),
      },
      {
        id: "view",
        name: "burning colony",
        rect: [180, 0, 400, 200],
        look: "Kalanthia, end of shift. The military base is still out there. Small. Standing.",
        talk: "The planet doesn't answer. It just burns.",
      },
      {
        id: "base",
        name: "military base",
        rect: [400, 88, 150, 80],
        look: "Home. The blast door. The fridge. It looks honest from here.",
      },
      {
        id: "hvac",
        name: "junction boxes",
        rect: [8, 188, 170, 120],
        approach: [180, 310],
        look: (game) => {
          if (game.has("aptKey")) return "I already took the only useful wire.";
          game.setFlag("lookedHvac");
          return "One grounding strap is thicker than it should be. Something is wired to it.";
        },
        use: (game) => takeAptKey(game),
        take: (game) => takeAptKey(game),
      },
      {
        id: "apt-key",
        name: "brass key",
        image: "assets/items/apt-key.png",
        rect: [48, 268, 22, 16],
        approach: [180, 310],
        visible: (game) => game.flag("lookedHvac") && !game.has("aptKey"),
        look: "A brass key lashed to the grounding strap. Easy to walk past.",
        use: (game) => takeAptKey(game),
        take: (game) => takeAptKey(game),
      },
      {
        id: "robert",
        name: "Robert",
        image: "assets/sprites/robert-down.png",
        imageLeft: "assets/sprites/robert-down.png",
        imageRight: "assets/sprites/robert-down.png",
        facing: "left",
        meet: true,
        rect: [344, 220, 48, 80],
        approach: [300, 318],
        look: (game) =>
          game.flag("robertRescued")
            ? "Annita's boy. He's staying off the edge. Smarter than the building."
            : "A kid on a roof in a meteor storm. That would be Robert.",
        talk: (game) => talkRobert(game),
        walk: (game) => talkRobert(game),
        use: (game) => game.say("He's not a crate. I'll talk to him."),
        take: (game) => game.say("I'm not putting a child in my inventory."),
      },
    ],
  };

  world.rooms["zero-lab"] = {
    name: "Zero — Apartment 2",
    bg: "assets/rooms/zero-lab.png",
    music: "command",
    start: { x: 168, y: 318, dir: "right" },
    scaleTop: [250, 0.6],
    scaleBot: [350, 0.86],
    walkable: [
      [96, 286],
      [170, 262],
      [500, 262],
      [560, 300],
      [530, 348],
      [100, 350],
    ],
    onEnter(game) {
      if (!game.flag("seenLab")) {
        game.setFlag("seenLab");
        game.say("A lab pretending to be a home. Or the other way around. The ship's organs are here.");
      }
    },
    hotspots: [
      {
        id: "exit",
        name: "hallway door",
        rect: [0, 70, 120, 210],
        approach: [150, 318],
        look: "Back to the identical hallway.",
        use: (game) => game.changeRoom("zero-floor-2", { x: 380, y: 300, dir: "left" }),
        walk: (game) => game.changeRoom("zero-floor-2", { x: 380, y: 300, dir: "left" }),
      },
      {
        id: "window",
        name: "broken window",
        rect: [250, 88, 150, 110],
        look: "The same fire. Closer. I already know how this story ends if I stay.",
      },
      {
        id: "fuel-cell",
        name: "fuel cell",
        rect: [400, 188, 110, 70],
        approach: [420, 300],
        look: "A ship fuel cell on a bench that used to hold dinner.",
        use: (game) => takePart(game, "fuelCell", "Fuel cell. One organ down."),
        take: (game) => takePart(game, "fuelCell", "Fuel cell. One organ down."),
      },
      {
        id: "nav-module",
        name: "nav module",
        rect: [500, 168, 70, 80],
        approach: [500, 300],
        look: "A nav brick. The CRT still thinks it has somewhere to go.",
        use: (game) => takePart(game, "navModule", "Nav module. She'll know which way is up."),
        take: (game) => takePart(game, "navModule", "Nav module. She'll know which way is up."),
      },
      {
        id: "life-support",
        name: "life support",
        rect: [568, 128, 70, 150],
        approach: [530, 310],
        look: "Life support. Gauge in the green. Rare, today.",
        use: (game) => takePart(game, "lifeSupport", "Life support. The ship can breathe."),
        take: (game) => takePart(game, "lifeSupport", "Life support. The ship can breathe."),
      },
    ],
  };

  world._talkAnnitaAfter = talkAnnitaAfter;
}
