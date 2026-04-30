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
export const DROP_FALL_DURATION_MIN = 20_000;
export const DROP_FALL_DURATION_PER_PCT = 22;
export const BASE_DROP_LIFETIME = 22_000;

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
