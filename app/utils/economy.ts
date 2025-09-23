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

export function coinRateFor(type: string) {
  return COIN_RATE[type] ?? 0.33;
}

export function coinsPerMinuteFor(type: string, optimismMultiplier = 1.15) {
  const coinsPerTick = coinRateFor(type) * optimismMultiplier;
  const ticksPerMinute = Math.floor(60_000 / OFFLINE_INTERVAL_MS);
  return coinsPerTick * ticksPerMinute;
}

export interface CoinCollectorLevel {
  level: number;
  label: string;
  cost: number;
  cooldown: number;
  capacity: number;
  description: string;
}

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

export function nextCollectorLevel(currentLevel: number) {
  return COIN_COLLECTOR_LEVELS.find((entry) => entry.level === currentLevel + 1);
}
