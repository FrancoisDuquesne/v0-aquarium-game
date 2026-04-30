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
  upgrades: { gourmetFeed: boolean; luxeDecor: boolean; clarityFilters: boolean },
  decorations: string[]
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
  const decor = decorations.length * DECOR_MAINTENANCE_COST;
  return Math.ceil(power + water + food + decor);
}

export function maintenanceBreakdown(
  fish: Array<{ type: string }>,
  upgrades: { gourmetFeed: boolean; luxeDecor: boolean; clarityFilters: boolean },
  decorations: string[]
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
  const decor = +(decorations.length * DECOR_MAINTENANCE_COST).toFixed(1);
  return { power, water, food, decor, total: Math.ceil(power + water + food + decor) };
}
