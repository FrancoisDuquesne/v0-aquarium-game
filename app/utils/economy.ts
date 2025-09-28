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
