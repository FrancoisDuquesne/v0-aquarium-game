export function coinRateFor(type: string) {
  return COIN_RATE[type] ?? 0.33;
}

export function coinsPerMinuteFor(type: string, optimismMultiplier = 1.15) {
  const coinsPerTick = coinRateFor(type) * optimismMultiplier;
  const ticksPerMinute = Math.floor(60_000 / OFFLINE_INTERVAL_MS);
  return coinsPerTick * ticksPerMinute;
}

export function nextCollectorLevel(currentLevel: number) {
  return COIN_COLLECTOR_LEVELS.find((entry) => entry.level === currentLevel + 1);
}

export function abbreviateCoins(n: number): string {
  const abs = Math.abs(Math.floor(n));
  const sign = n < 0 ? "-" : "";
  const fmt = (v: number) => {
    const s = v.toFixed(1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  if (abs >= 1_000_000_000) return sign + fmt(abs / 1_000_000_000) + "B";
  if (abs >= 1_000_000) return sign + fmt(abs / 1_000_000) + "M";
  if (abs >= 1_000) return sign + fmt(abs / 1_000) + "K";
  return sign + String(abs);
}

export function calculateMaintenance(
  fish: Array<{ type: string }>,
  upgrades: { gourmetFeed: boolean; luxeDecor: boolean; clarityFilters: boolean }
): number {
  const upgradeCount = [
    upgrades.gourmetFeed,
    upgrades.luxeDecor,
    upgrades.clarityFilters,
  ].filter(Boolean).length;
  const power = BASE_POWER_COST + upgradeCount * POWER_PER_UPGRADE;
  const water = fish.reduce(
    (sum, f) => sum + (MAINTENANCE_WATER_COST[f.type] ?? 0.5),
    0
  );
  const food = FOOD_MAINTENANCE_BASE + fish.length * FOOD_PER_FISH;
  return Math.ceil(power + water + food);
}

// ── Fish life cycle ──────────────────────────────────────────────────────────

export function fishLifespan(type: string, genetics?: { healthMod?: number; mutation?: string }): number {
  const base = FISH_LIFESPAN_BY_SPECIES[type] ?? FISH_LIFESPAN_BASE_MS;
  let mult = 1.0;
  if (genetics?.mutation === "hardy")  mult *= 1.25;
  if (genetics?.mutation === "sickly") mult *= 0.75;
  if (genetics?.healthMod != null) mult *= 0.85 + genetics.healthMod * 0.15;
  return Math.round(base * mult);
}

export function fishAgeRatio(bornAt: number, type: string, genetics?: { healthMod?: number; mutation?: string }): number {
  return Math.min(1.0, (Date.now() - bornAt) / fishLifespan(type, genetics));
}

export function fishLifeStage(ageRatio: number): import("~/utils/game-config").LifeStage {
  if (ageRatio < LIFE_STAGE_JUVENILE_END) return "juvenile";
  if (ageRatio < LIFE_STAGE_ADULT_END)    return "adult";
  return "senior";
}

export function fishSizeMultiplier(ageRatio: number): number {
  if (ageRatio < LIFE_STAGE_JUVENILE_END) {
    return 0.5 + (ageRatio / LIFE_STAGE_JUVENILE_END) * 0.5;
  }
  if (ageRatio < LIFE_STAGE_ADULT_END) return 1.0;
  return 1.0 + ((ageRatio - LIFE_STAGE_ADULT_END) / (1.0 - LIFE_STAGE_ADULT_END)) * 0.12;
}

// ── Fish market valuation ────────────────────────────────────────────────────

const MUTATION_MARKET_MULT: Record<string, number> = {
  golden: 2.0, hardy: 1.4, swift: 1.3,
  sickly: 0.4, lethargic: 0.7, voracious: 0.75,
};

export function fishMarketValue(fish: {
  type: string;
  generation?: number;
  careStreak?: number;
  genetics?: { coinMod?: number; healthMod?: number; mutation?: string };
  bornAt?: number;
}): number {
  const base = FISH_SHOP_ITEMS.find(i => i.type === fish.type)?.cost ?? 50;
  const genBonus = 1 + (fish.generation ?? 0) * 0.20;
  const mutMult  = MUTATION_MARKET_MULT[fish.genetics?.mutation ?? ""] ?? 1.0;
  const genetics = (fish.genetics?.coinMod ?? 1) * (fish.genetics?.healthMod ?? 1);
  const streak   = 1 + (fish.careStreak ?? 0) * 0.04;

  let ageMult = 1.0;
  if (fish.bornAt != null) {
    const r = fishAgeRatio(fish.bornAt, fish.type, fish.genetics);
    if (r < LIFE_STAGE_JUVENILE_END) {
      ageMult = 0.6 + (r / LIFE_STAGE_JUVENILE_END) * 0.5;              // 0.6 → 1.1
    } else if (r < LIFE_STAGE_ADULT_END) {
      const t = (r - LIFE_STAGE_JUVENILE_END) / (LIFE_STAGE_ADULT_END - LIFE_STAGE_JUVENILE_END);
      ageMult = 1.1 + t * 0.1;                                           // 1.1 → 1.2
    } else {
      const t = (r - LIFE_STAGE_ADULT_END) / (1.0 - LIFE_STAGE_ADULT_END);
      ageMult = 1.2 - t * 0.6;                                           // 1.2 → 0.6
    }
  }

  return Math.round(base * genBonus * mutMult * genetics * streak * ageMult);
}

// Mulberry32 seeded PRNG — returns a function producing [0, 1) floats
export function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateMarketPool(tankLevel: number, seed: number): import("~/utils/game-config").MarketFish[] {
  const rng      = seededRng(seed);
  const poolSize = Math.min(MARKET_POOL_BASE + Math.floor((tankLevel - 1) / 2), 10);
  const types    = Object.keys(COIN_RATE);

  // Weight type selection by inverse coin rate (cheaper/common fish more likely)
  const maxRate  = Math.max(...Object.values(COIN_RATE));
  const weights  = types.map(t => maxRate - COIN_RATE[t] + 0.2);
  const totalW   = weights.reduce((a, b) => a + b, 0);

  const mutations = ["golden", "hardy", "swift", "sickly", "lethargic", "voracious"] as const;

  return Array.from({ length: poolSize }, (_, i) => {
    // Pick type
    let r = rng() * totalW;
    let type = types[types.length - 1];
    for (let j = 0; j < types.length; j++) { r -= weights[j]; if (r <= 0) { type = types[j]; break; } }

    // Generation: 0 = 60%, 1 = 30%, 2 = 10%
    const genRoll = rng();
    const generation = genRoll < 0.60 ? 0 : genRoll < 0.90 ? 1 : 2;

    // Mutation: 15% chance
    const mutation = rng() < 0.15 ? mutations[Math.floor(rng() * mutations.length)] : undefined;

    // Genetics: ±0.15 around defaults
    const g = (base: number) => +Math.max(0.5, Math.min(1.6, base + (rng() - 0.5) * 0.3)).toFixed(2);
    const genetics: import("~/utils/game-config").GeneticsData = {
      speedMod: g(1.0), coinMod: g(1.0), hungerMod: g(1.0), healthMod: g(1.0), mutation,
    };

    // Pick a name from FISH_NAMES using rng
    const name = FISH_NAMES[Math.floor(rng() * FISH_NAMES.length)];

    const uid = `market-${seed}-${i}`;
    const price = fishMarketValue({ type, generation, careStreak: 0, genetics });
    return { uid, type, name, generation, genetics, price };
  });
}

export function maintenanceBreakdown(
  fish: Array<{ type: string }>,
  upgrades: { gourmetFeed: boolean; luxeDecor: boolean; clarityFilters: boolean }
) {
  const upgradeCount = [
    upgrades.gourmetFeed,
    upgrades.luxeDecor,
    upgrades.clarityFilters,
  ].filter(Boolean).length;
  const power = +(BASE_POWER_COST + upgradeCount * POWER_PER_UPGRADE).toFixed(1);
  const water = +fish
    .reduce((sum, f) => sum + (MAINTENANCE_WATER_COST[f.type] ?? 0.5), 0)
    .toFixed(1);
  const food = +(FOOD_MAINTENANCE_BASE + fish.length * FOOD_PER_FISH).toFixed(1);
  return { power, water, food, total: Math.ceil(power + water + food) };
}
