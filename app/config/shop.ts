export interface FishShopItem {
  type: string;
  name: string;
  cost: number;
  desc: string;
}

export type UpgradeId = "gourmetFeed" | "luxeDecor" | "clarityFilters";

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
