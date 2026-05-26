export type UpgradeId = "gourmetFeed" | "luxeDecor" | "clarityFilters";

export interface FishShopItem {
  type: string;
  name: string;
  cost: number;
  desc: string;
}

export interface UpgradeShopItem {
  id: UpgradeId;
  name: string;
  cost: number;
  desc: string;
  effect: string;
  icon: string;
}

export interface DecorShopItem {
  id: string;
  name: string;
  cost: number;
  desc: string;
  icon: string;
}

export interface PowerUpShopItem {
  id: string;
  name: string;
  cost: number;
  desc: string;
  duration: string;
  icon: string;
}

export interface CoinCollectorLevel {
  level: number;
  label: string;
  cost: number;
  cooldown: number;
  capacity: number;
  description: string;
}

export interface DecorationPreset {
  label: string;
  left: string;
  bottom: string;
  scale: number;
  emoji: string;
}

export const AVAILABLE_BACKGROUNDS = [
  "/backgrounds/0.webp",
  "/backgrounds/1.webp",
  "/backgrounds/2.webp",
  "/backgrounds/3.webp",
  "/backgrounds/4.webp",
  "/backgrounds/5.webp",
  "/backgrounds/6.webp",
  "/backgrounds/7.webp",
  "/backgrounds/9.webp",
  "/backgrounds/10.webp",
] as const;

export const BACKGROUND_LABELS: Record<string, string> = {
  "/backgrounds/0.webp": "Coral Reef",
  "/backgrounds/1.webp": "Ocean Blue",
  "/backgrounds/2.webp": "Tropical Lagoon",
  "/backgrounds/3.webp": "Deep Sea",
  "/backgrounds/4.webp": "Kelp Forest",
  "/backgrounds/5.webp": "Sandy Shallows",
  "/backgrounds/6.webp": "Rocky Cave",
  "/backgrounds/7.webp": "Night Reef",
  "/backgrounds/9.webp": "Arctic Depths",
  "/backgrounds/10.webp": "Sunlit Waters",
};

export const DEFAULT_BACKGROUND = AVAILABLE_BACKGROUNDS[0];

export const DECORATION_PRESETS: Record<string, DecorationPreset> = {
  "coral-arch": {
    label: "Coral Arch",
    left: "20%",
    bottom: "8%",
    scale: 1.1,
    emoji: "🪸",
  },
  "kelp-forest": {
    label: "Kelp Forest",
    left: "80%",
    bottom: "7%",
    scale: 1.2,
    emoji: "🌿",
  },
  "bubble-column": {
    label: "Bubble Column",
    left: "50%",
    bottom: "14%",
    scale: 1.05,
    emoji: "🫧",
  },
};

export const FLOOR_Y = 96;
export const SINK_SPEED_PER_S = 6;
export const REST_DURATION_MS = 5000;
export const DETECT_RADIUS = 16;
export const EAT_RADIUS = 3;
export const FEED_AMOUNT = 20;
export const MAX_FLAKES = 60;
export const COIN_FLOOR_Y = 94;
export const COIN_FALL_MIN_MS = 900;
export const COIN_FALL_PER_PCT = 22;
export const SPOON_SCATTER_COUNT = 8;
export const SPOON_SCATTER_RADIUS = 24;
export const AUTO_FEEDER_DISPENSE_COUNT = 8;
export const AUTO_FEEDER_DISPENSE_TOP_RANGE = 6;
export const SPOON_COST = 200;
export const AUTO_FEEDER_COST = 500;
export const FLAKE_COST = 0.5;
export const SPOON_COST_PER_USE = 2;
export const AUTO_FEEDER_COST_PER_USE = 3;

export const FISH_CONFIG = {
  WAYPOINT_MIN_INTERVAL: 1200,
  WAYPOINT_MAX_INTERVAL: 6000,
  ANIMATION_FPS: 60,
  MOVEMENT_SPEED: 0.012,
  LEVY_MU: 1.8,
  WAYPOINT_MIN_STEP: 7,
  WAYPOINT_MAX_STEP: 22,
  BOUNDARY_LEFT: 5,
  BOUNDARY_RIGHT: 95,
  BOUNDARY_TOP: 15,
  BOUNDARY_BOTTOM: 78,
  FISH_SIZES: {
    neon: { width: 20, height: 14 },
    goldfish: { width: 40, height: 28 },
    tropical: { width: 60, height: 42 },
    angelfish: { width: 50, height: 80 },
    shark: { width: 160, height: 112 },
    betta: { width: 34, height: 26 },
    "cherry-barb": { width: 28, height: 16 },
    guppy: { width: 26, height: 16 },
    "pearl-gourami": { width: 48, height: 30 },
    "tiger-barb": { width: 30, height: 18 },
    "jewel-cichlid": { width: 44, height: 28 },
  },
} as const;

export interface SpeciesProfile {
  levyMu: number;
  speedScale: number;
  depthBias?: number;       // preferred Y% (0=top, 100=bottom), exerts soft pull on waypoints
  waypointMin?: number;
  waypointMax?: number;
  schooling?: boolean;      // weakly attracts toward same-species fish
  territorial?: boolean;    // weakly repels same-species fish
}

export const SPECIES_PROFILES: Record<string, SpeciesProfile> = {
  goldfish:       { levyMu: 1.8, speedScale: 1.0 },
  angelfish:      { levyMu: 2.0, speedScale: 0.8, depthBias: 28 },
  neon:           { levyMu: 1.2, speedScale: 1.3, waypointMin: 700,  waypointMax: 3000, schooling: true },
  tropical:       { levyMu: 1.7, speedScale: 1.1 },
  shark:          { levyMu: 2.5, speedScale: 1.5, depthBias: 65, waypointMin: 2000, waypointMax: 8000 },
  betta:          { levyMu: 1.6, speedScale: 0.9, depthBias: 35, territorial: true },
  "cherry-barb":  { levyMu: 1.3, speedScale: 1.2, schooling: true },
  guppy:          { levyMu: 1.3, speedScale: 1.2, schooling: true },
  "pearl-gourami":{ levyMu: 2.0, speedScale: 0.85, depthBias: 30 },
  "tiger-barb":   { levyMu: 1.4, speedScale: 1.3, schooling: true },
  "jewel-cichlid":{ levyMu: 1.9, speedScale: 1.0, depthBias: 55, territorial: true },
};

export const DEFAULT_AUTO_FEEDER = {
  owned: false,
  active: false,
  lastFeedTime: 0,
  feedInterval: 30_000,
};

export const DEFAULT_TOOLS = { spoonOwned: false };

export const DEFAULT_COIN_COLLECTOR = { level: 0, lastSweep: 0 };

export const DEFAULT_UPGRADES = {
  gourmetFeed: false,
  luxeDecor: false,
  clarityFilters: false,
};

export const DEFAULT_DECORATIONS: string[] = [];

export const DEFAULT_BOOSTS: Array<{
  id: string;
  label: string;
  expiresAt: number;
  multiplier: number;
}> = [];

export const DROP_MAX = 36;
export const DROP_FLOOR_Y = 94;
export const DROP_FALL_DURATION_MIN = 900;
export const DROP_FALL_DURATION_PER_PCT = 22;
export const BASE_DROP_LIFETIME = 40_000;

export const CARE_STREAK_MAX = 5;
export const BASE_HUNGER_DECAY = 0.5;
export const MIN_HUNGER_DECAY = 0.2;
export const GOURMET_DECAY_REDUCTION = 0.15;
export const GOURMET_FEED_BONUS = 5;
export const CARE_THRESHOLD = 60;
export const HAPPY_THRESHOLD = 80;
export const AUTO_FEEDER_FEED_AMOUNT = 15;

export const BOOST_DEFINITIONS: Record<
  string,
  { label: string; durationMs: number; multiplier: number }
> = {
  "treasure-frenzy": {
    label: "Treasure Frenzy",
    durationMs: 120_000,
    multiplier: 1.75,
  },
  "lunar-tide": {
    label: "Lunar Tide",
    durationMs: 300_000,
    multiplier: 1.35,
  },
};

export const COIN_RATE: Record<string, number> = {
  neon: 0.5,
  goldfish: 0.33,
  angelfish: 0.67,
  tropical: 1.0,
  shark: 2.0,
  betta: 0.55,
  "cherry-barb": 0.45,
  guppy: 0.4,
  "pearl-gourami": 0.6,
  "tiger-barb": 0.5,
  "jewel-cichlid": 0.75,
};

export const OFFLINE_INTERVAL_MS = 5_000;
export const OFFLINE_MAX_MS = 24 * 60 * 60 * 1000;

// Health & boredom
export const HEALTH_DECAY_RATE = 1.5;
export const HEALTH_REGEN_RATE = 0.3;
export const HEALTH_LOW_THRESHOLD = 40;
export const HEALTH_HIGH_THRESHOLD = 70;
export const BOREDOM_BASE_RATE = 1.5;
export const BOREDOM_DECOR_REDUCTION = 1.5;
export const BOREDOM_FRIEND_REDUCTION = 1.0;
export const BOREDOM_FEED_BONUS = 15;
export const BOREDOM_HIGH_THRESHOLD = 75;

// Maintenance system
export const MAINTENANCE_INTERVAL_MS = 60_000;
export const MAINTENANCE_GRACE_LIMIT = -100;
export const MAINTENANCE_WARNING_THRESHOLD = 50;
export const BASE_POWER_COST = 1;
export const POWER_PER_UPGRADE = 0.5;
export const FOOD_MAINTENANCE_BASE = 0.5;
export const FOOD_PER_FISH = 0.4;
export const DECOR_MAINTENANCE_COST = 0.5;
export const MAINTENANCE_WATER_COST: Record<string, number> = {
  shark: 2.0,
  tropical: 1.0,
  angelfish: 0.8,
  "jewel-cichlid": 0.75,
  "pearl-gourami": 0.65,
  betta: 0.6,
  goldfish: 0.5,
  "tiger-barb": 0.45,
  "cherry-barb": 0.4,
  guppy: 0.35,
  neon: 0.3,
};

export const COIN_COLLECTOR_LEVELS: CoinCollectorLevel[] = [
  {
    level: 0,
    label: "Manual scooping",
    cost: 0,
    cooldown: Number.POSITIVE_INFINITY,
    capacity: 0,
    description: "Click coins yourself to collect them.",
  },
  {
    level: 1,
    label: "Glass Scoop Drone",
    cost: 350,
    cooldown: 12_000,
    capacity: 4,
    description: "Sweeps a few nearby drops every 12s.",
  },
  {
    level: 2,
    label: "Magnet Siphon",
    cost: 650,
    cooldown: 8_000,
    capacity: 8,
    description: "Grabs most drops in range every 8s.",
  },
  {
    level: 3,
    label: "Nimbus Collector",
    cost: 950,
    cooldown: 5_000,
    capacity: 16,
    description: "Vacuum collects nearly everything instantly.",
  },
];

export const FISH_SHOP_ITEMS: FishShopItem[] = [
  {
    type: "goldfish",
    name: "Goldfish",
    cost: 50,
    desc: "Hardy beginner fish with calm behavior.",
  },
  {
    type: "angelfish",
    name: "Angelfish",
    cost: 100,
    desc: "Graceful swimmer; light schooling tendencies.",
  },
  {
    type: "neon",
    name: "Neon Tetra",
    cost: 75,
    desc: "Small, vibrant, and schools strongly.",
  },
  {
    type: "tropical",
    name: "Tropical Fish",
    cost: 150,
    desc: "Colorful mid-water fish; loose schooling.",
  },
  {
    type: "betta",
    name: "Betta",
    cost: 120,
    desc: "Flowing fins and bold colors; prefers its space.",
  },
  {
    type: "cherry-barb",
    name: "Cherry Barb",
    cost: 90,
    desc: "Peaceful schooling barb with a red hue.",
  },
  {
    type: "guppy",
    name: "Guppy",
    cost: 60,
    desc: "Active, hardy livebearer; great in groups.",
  },
  {
    type: "pearl-gourami",
    name: "Pearl Gourami",
    cost: 140,
    desc: "Elegant with pearly spots; gentle demeanor.",
  },
  {
    type: "tiger-barb",
    name: "Tiger Barb",
    cost: 110,
    desc: "Striped and lively; energetic schooling fish.",
  },
  {
    type: "jewel-cichlid",
    name: "Jewel Cichlid",
    cost: 170,
    desc: "Striking red coloration; more territorial.",
  },
  {
    type: "shark",
    name: "Baby Shark",
    cost: 300,
    desc: "Impressive and swift; the highest coin earner in the tank.",
  },
];

export const TANK_UPGRADES: UpgradeShopItem[] = [
  {
    id: "gourmetFeed",
    name: "Gourmet Feed Blend",
    cost: 320,
    desc: "Premium flakes that slow hunger decay and restore extra energy.",
    effect: "Keeps fish well-fed for longer, making coin drops more frequent.",
    icon: "🍤",
  },
  {
    id: "clarityFilters",
    name: "Clarity Filters",
    cost: 280,
    desc: "Advanced filtration keeps the water pristine for longer.",
    effect: "Coin drops linger on screen longer before fading.",
    icon: "🌀",
  },
  {
    id: "luxeDecor",
    name: "Luxe Mood Lighting",
    cost: 420,
    desc: "Soft lighting that makes fish happier and coins sparkle brighter.",
    effect: "+15% value boost to all coin drops.",
    icon: "💡",
  },
];

export const DECOR_ITEMS: DecorShopItem[] = [
  {
    id: "coral-arch",
    name: "Coral Archway",
    cost: 260,
    desc: "A vibrant coral centerpiece that gives your tank instant depth.",
    icon: "🪸",
  },
  {
    id: "kelp-forest",
    name: "Kelp Forest",
    cost: 210,
    desc: "Tall kelp fronds that sway gently and make shy fish bolder.",
    icon: "🌿",
  },
  {
    id: "bubble-column",
    name: "Bubble Column",
    cost: 190,
    desc: "Playful bubbles for ambience and a hint that coins float longer.",
    icon: "🫧",
  },
];

export const POWER_UP_ITEMS: PowerUpShopItem[] = [
  {
    id: "treasure-frenzy",
    name: "Treasure Frenzy",
    cost: 180,
    desc: "Kick off a 2 minute coin rush with hefty drop values.",
    duration: "120s",
    icon: "⚡",
  },
  {
    id: "lunar-tide",
    name: "Lunar Tide Beacon",
    cost: 260,
    desc: "Summon a gentle 5 minute tide that buffs earnings.",
    duration: "300s",
    icon: "🌙",
  },
];

export const FISH_NAMES: string[] = [
  'Bubbles', 'Finn', 'Coral', 'Ripple', 'Pearl', 'Splash', 'Marina', 'Azul', 'Goldie', 'Sapphire',
  'Jade', 'Cobalt', 'Sunny', 'Misty', 'Shimmer', 'Glimmer', 'Luna', 'River', 'Brook', 'Eddy',
  'Glow', 'Jewel', 'Lagoon', 'Nova', 'Pebble', 'Teal', 'Wave', 'Zephyr', 'Mochi', 'Waffles',
  'Pepper', 'Noodle', 'Dumpling', 'Ginger', 'Clover', 'Poppy', 'Daisy', 'Cosmo', 'Driftwood', 'Reef',
  'Skye', 'Harbor', 'Cove', 'Tide', 'Riptide', 'Comet', 'Stardust', 'Fable', 'Prism', 'Nimbus',
];

export const TANK_CAPACITY_BASE = 8;

export interface TankExpansionItem {
  id: string;
  name: string;
  slots: number;
  cost: number;
  desc: string;
  icon: string;
}

export const TANK_EXPANSION_ITEMS: TankExpansionItem[] = [
  { id: "small-expansion", name: "Compact Extension", slots: 4, cost: 2_000, desc: "A modular side panel that squeezes in 4 more fish.", icon: "🪣" },
  { id: "large-expansion", name: "Open-Water Wing", slots: 8, cost: 8_000, desc: "A full side wing that comfortably hosts 8 more fish.", icon: "🏊" },
  { id: "mega-expansion", name: "Deep-Sea Chamber", slots: 14, cost: 30_000, desc: "A cavernous vault that fits 14 more fish.", icon: "🌊" },
];

export function fishPreviewSize(type: string) {
  const size =
    FISH_CONFIG.FISH_SIZES[type as keyof typeof FISH_CONFIG.FISH_SIZES] ??
    FISH_CONFIG.FISH_SIZES.goldfish;
  return {
    w: Math.min(size.width * 0.8, 48),
    h: Math.min(size.height * 0.8, 32),
  };
}

// ── Background ecosystem effects ──────────────────────────────────────────────
export interface BackgroundEffect {
  fishType?: string;            // if set, coin bonus applies only to this species
  coinMult?: number;            // multiplier on that fish's coin output
  hungerDecayMod?: number;      // subtracted from base decay (slows hunger loss)
  dropLifetimeBonus?: number;   // extra ms added to coin drop lifetime
  label: string;
  icon: string;
}

export const BACKGROUND_EFFECTS: Record<string, BackgroundEffect> = {
  "/backgrounds/0.webp":  { fishType: "tropical",      coinMult: 1.10, label: "+10% coins for Tropical Fish",  icon: "🪸" },
  "/backgrounds/1.webp":  { fishType: "neon",           coinMult: 1.15, label: "+15% coins for Neon Tetras",    icon: "✨" },
  "/backgrounds/2.webp":  { fishType: "guppy",          coinMult: 1.15, label: "+15% coins for Guppies",        icon: "🐡" },
  "/backgrounds/3.webp":  { fishType: "shark",          coinMult: 1.25, label: "+25% coins for Baby Shark",     icon: "🦈" },
  "/backgrounds/4.webp":  { hungerDecayMod: 0.10,       label: "Food lasts 20% longer (all fish)",             icon: "🌿" },
  "/backgrounds/5.webp":  { fishType: "goldfish",       coinMult: 1.15, label: "+15% coins for Goldfish",       icon: "🏖️" },
  "/backgrounds/6.webp":  { fishType: "jewel-cichlid",  coinMult: 1.20, label: "+20% coins for Jewel Cichlid", icon: "🪨" },
  "/backgrounds/7.webp":  { fishType: "angelfish",      coinMult: 1.15, label: "+15% coins for Angelfish",      icon: "🌙" },
  "/backgrounds/9.webp":  { dropLifetimeBonus: 6000,    label: "Coin drops last 6s longer",                    icon: "❄️" },
  "/backgrounds/10.webp": { coinMult: 1.08,             label: "+8% coins for all fish",                       icon: "☀️" },
};

// ── Medicine ───────────────────────────────────────────────────────────────────
export const MEDICINE_COST = 80;
export const MEDICINE_HEAL_AMOUNT = 40;

// ── Rare visitor fish ──────────────────────────────────────────────────────────
export const VISITOR_DURATION_MS = 180_000;              // 3 min window
export const VISITOR_REWARD_BASE = 50;                   // base coins when fed
export const VISITOR_SPAWN_DELAY_MIN_MS = 90_000;        // earliest 1.5 min
export const VISITOR_SPAWN_DELAY_MAX_MS = 300_000;       // latest 5 min

export const VISITOR_SPECIES = ["angelfish", "shark", "betta", "tropical", "jewel-cichlid"] as const;
export const VISITOR_NAMES = ["Glimmer", "Azure", "Specter", "Nimbus", "Oracle", "Phantom", "Solstice", "Dusk"];

// ── Prestige ("The Great Release") ────────────────────────────────────────────
export const PRESTIGE_MIN_FISH = 8;
export const PRESTIGE_MIN_COINS = 2000;
export const PRESTIGE_START_COINS = 150;
export const PRESTIGE_START_BONUS = 150;       // extra per prestige level beyond first
export const PRESTIGE_COIN_BONUS_PER_LEVEL = 0.10; // +10% coin multiplier per prestige

// ── Daily system ───────────────────────────────────────────────────────────────
export const LOGIN_BONUS_BASE = 15;
export const DAILY_MISSION_COUNT = 3;

// ── Fish personalities ─────────────────────────────────────────────────────────
export type PersonalityType = "lazy" | "active" | "curious" | "anxious";

export interface PersonalityProfile {
  label: string;
  icon: string;
  boredomMod: number; // multiplier on boredom accumulation rate
  speedMod: number;   // multiplier on movement speed (visual only)
  lore: string;
}

export const PERSONALITY_PROFILES: Record<PersonalityType, PersonalityProfile> = {
  lazy:    { label: "Lazy",    icon: "😴", boredomMod: 0.6,  speedMod: 0.8,  lore: "Happy to drift at half-pace and snooze in a corner." },
  active:  { label: "Active",  icon: "⚡", boredomMod: 1.4,  speedMod: 1.25, lore: "Zooms around non-stop and gets bored fast without stimulation." },
  curious: { label: "Curious", icon: "🔭", boredomMod: 0.85, speedMod: 1.1,  lore: "Explores every corner of the tank with a calm, inquisitive gaze." },
  anxious: { label: "Anxious", icon: "😰", boredomMod: 1.6,  speedMod: 1.15, lore: "Startles easily and needs frequent care to stay settled." },
};

export const PERSONALITY_POOL: PersonalityType[] = ["lazy", "active", "curious", "anxious"];

// ── Achievements ───────────────────────────────────────────────────────────────
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  condition:
    | "fish-count"
    | "total-coins"
    | "care-streak"
    | "decor-count"
    | "upgrade-count"
    | "species-count"
    | "auto-feeder"
    | "expansion-owned"
    | "feed-count"
    | "tank-full";
  threshold?: number;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  { id: "first-fish",   name: "First Splash",      desc: "Have 1 fish in the tank.",                   icon: "🐟", condition: "fish-count",    threshold: 1     },
  { id: "first-feed",   name: "Feeding Time",       desc: "Feed a fish for the first time.",             icon: "🍽️", condition: "feed-count",   threshold: 1     },
  { id: "coin-100",     name: "Petty Cash",          desc: "Collect 100 coins in total.",                icon: "🪙", condition: "total-coins",  threshold: 100   },
  { id: "coin-1k",      name: "Coin Hoarder",        desc: "Collect 1,000 coins in total.",              icon: "💰", condition: "total-coins",  threshold: 1000  },
  { id: "coin-10k",     name: "Deep Pockets",        desc: "Collect 10,000 coins in total.",             icon: "💎", condition: "total-coins",  threshold: 10000 },
  { id: "five-fish",    name: "School's Out",        desc: "Have 5 fish in the tank at once.",           icon: "🐠", condition: "fish-count",    threshold: 5     },
  { id: "tank-full",    name: "Full House",           desc: "Fill the tank to capacity.",                icon: "🏠", condition: "tank-full"                      },
  { id: "streak-3",     name: "Hot Streak",           desc: "Reach a care streak of 3 on any fish.",     icon: "🔥", condition: "care-streak",  threshold: 3     },
  { id: "streak-5",     name: "On Fire",              desc: "Reach the maximum care streak of 5.",       icon: "🌋", condition: "care-streak",  threshold: 5     },
  { id: "any-decor",    name: "Interior Design",      desc: "Buy any decoration.",                       icon: "🪸", condition: "decor-count",  threshold: 1     },
  { id: "all-decor",    name: "Aquascape Artist",     desc: "Own all decorations.",                      icon: "🌿", condition: "decor-count",  threshold: 3     },
  { id: "any-upgrade",  name: "Tech Savvy",           desc: "Buy any tank upgrade.",                     icon: "⚙️", condition: "upgrade-count", threshold: 1    },
  { id: "all-upgrades", name: "Fully Equipped",       desc: "Own all tank upgrades.",                    icon: "🔧", condition: "upgrade-count", threshold: 3    },
  { id: "five-species", name: "Collector",             desc: "Own 5 different species.",                  icon: "📚", condition: "species-count", threshold: 5    },
  { id: "auto-feeder",  name: "Never Miss a Meal",    desc: "Install the auto-feeder.",                  icon: "🤖", condition: "auto-feeder"                    },
];

// ── Daily missions ─────────────────────────────────────────────────────────────
export interface MissionDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  goal: number;
  reward: number;
  type: "feed" | "collect-coins" | "collect-drops";
}

export const MISSION_POOL: MissionDef[] = [
  { id: "feed-10",   title: "Well Fed",    desc: "Feed your fish 10 times.",        icon: "🍽️", type: "feed",          goal: 10,  reward: 30  },
  { id: "feed-25",   title: "Full Tummy",  desc: "Feed your fish 25 times.",        icon: "🍤", type: "feed",          goal: 25,  reward: 60  },
  { id: "feed-50",   title: "Chef Mode",   desc: "Feed your fish 50 times.",        icon: "🧑‍🍳", type: "feed",          goal: 50,  reward: 100 },
  { id: "coins-50",  title: "Piggy Bank",  desc: "Collect 50 coins today.",         icon: "🪙", type: "collect-coins", goal: 50,  reward: 20  },
  { id: "coins-200", title: "Cash Flow",   desc: "Collect 200 coins today.",        icon: "💰", type: "collect-coins", goal: 200, reward: 50  },
  { id: "coins-500", title: "Payday",      desc: "Collect 500 coins today.",        icon: "💎", type: "collect-coins", goal: 500, reward: 100 },
  { id: "drops-5",   title: "Quick Hands", desc: "Manually pick up 5 coin drops.",  icon: "🖐️", type: "collect-drops", goal: 5,   reward: 25  },
  { id: "drops-20",  title: "Drop Chaser", desc: "Manually pick up 20 coin drops.", icon: "🎯", type: "collect-drops", goal: 20,  reward: 60  },
];

// ── Species lore ───────────────────────────────────────────────────────────────
export const SPECIES_LORE: Record<string, string> = {
  goldfish:          "Originally bred in Tang Dynasty China, goldfish are the world's most popular aquarium fish. Hardy and forgiving — perfect for beginners.",
  angelfish:         "South American cichlids prized for their triangular profile. Prefer calm warm waters and are surprisingly loyal to their keepers.",
  neon:              "A hobby staple since the 1930s. Schools instinctively; the iridescent stripe doubles as a depth gauge in murky jungle streams.",
  tropical:          "A vibrant mid-water species prized for its golden hue. Loose schooling and adaptability make it a versatile tank companion.",
  shark:             "Not a true shark — this freshwater species earned its name from its sleek torpedo profile. Bold, swift, and the top coin earner.",
  betta:             "Native to Southeast Asian rice paddies, bettas breathe air directly. Centuries of selective breeding shaped those spectacular fins.",
  "cherry-barb":     "Named for the deep cherry-red males display during spawning. A peaceful schooling fish from the rivers of Sri Lanka.",
  guppy:             "One of the most studied fish in biology. Guppies adapt to almost any water chemistry and have shaped our grasp of natural selection.",
  "pearl-gourami":   "Those iridescent pearl spots aren't cosmetic — in dim jungle streams they help the fish gauge distances at close range.",
  "tiger-barb":      "Bold, fast, and often mischievous. Tiger barbs love to chase; keep six or more to dilute their nippy tendencies.",
  "jewel-cichlid":   "One of Africa's most vividly colored fish. Fiercely territorial during breeding — the 'jewel' name comes from rival keepers who envy its coloration.",
};
