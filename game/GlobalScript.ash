// Main header script - this will be included into every script in
// the game (local and global). Do not place functions here; rather,
// place import definitions and #define names here to be used by all
// scripts.

// --- GameLogic constants (shared across all scripts) ---
#define ACT_KALANTHIA       1
#define ACT_STAR_DESTROYER  2
#define ACT_EARTH           3

#define ROOM_INTRO              1
#define ROOM_BASE_EXTERIOR      2
#define ROOM_BASE_INTERIOR      3
#define ROOM_ZERO_GROUND        10
#define ROOM_ZERO_UPPER         12
#define ROOM_SPACESHIP_HANGAR   30
#define ROOM_SD_JAIL            40
#define ROOM_SD_VENTS           41
#define ROOM_SD_CONTROL_ROOM    43
#define ROOM_SD_HANGAR          45
#define ROOM_EARTH_TRIBUNAL       50
#define ROOM_EARTH_GAS_CHAMBER    51

#define INV_FUEL_CELL         1
#define INV_NAV_MODULE        2
#define INV_LIFE_SUPPORT      3
#define INV_HOT_COFFEE        4
#define INV_DIAMOND_RING      5
#define INV_WIRE              6

#define FLAG_ROBERT_RESCUED       1
#define FLAG_ANNITA_ALLIED        2
#define FLAG_FUEL_CELL_FOUND      3
#define FLAG_NAV_MODULE_FOUND     4
#define FLAG_LIFE_SUPPORT_FOUND   5
#define FLAG_SHIP_READY           6
#define FLAG_ANNITA_CONVINCED     7
#define FLAG_ANNITA_ROBERT_ABOARD  8
#define FLAG_TRACTOR_DISABLED     9
#define FLAG_RING_GIFTED          10

#define TIMER_ZERO_COLLAPSE  1
#define ZERO_COLLAPSE_SECONDS  600

enum GameEnding {
  eEndingNone = 0,
  eEndingBadGasChamber,
  eEndingGoodSurvivors,
  eEndingGoodRomance
};

import int gCurrentAct;
import int gGameEnding;
import int gRobertRescued;
import int gAnnitaOnboard;
import int gRobertOnboard;
import int gRingGifted;
import int gShipComponentsFound;

import void StartZeroCollapseTimer();
import void StopZeroCollapseTimer();
import void OnZeroCollapseExpired();
import bool HasAllShipComponents();
import void CheckShipReady();
import void PlayIntroSequence();
import void TriggerEnding(GameEnding ending);