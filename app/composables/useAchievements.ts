import { ACHIEVEMENT_DEFINITIONS } from "~/utils/game-config";
import type { Ref, ComputedRef } from "vue";

type UpgradesState = Record<string, boolean>;
type AutoFeeder = { owned: boolean };
type FishEntry = { id: number; type: string };

export function setupAchievements(deps: {
  fish: Ref<FishEntry[]>;
  upgrades: UpgradesState;
  autoFeeder: AutoFeeder;
  purchasedExpansions: Ref<string[]>;
  tankCapacity: ComputedRef<number>;
  totalCoinsCollected: Ref<number>;
  maxCareStreakEver: Ref<number>;
  totalFeedCount: Ref<number>;
  unlockedAchievements: Ref<string[]>;
  pendingAchievementUnlocks: Ref<string[]>;
}) {
  const {
    fish, upgrades, autoFeeder, purchasedExpansions, tankCapacity,
    totalCoinsCollected, maxCareStreakEver, totalFeedCount,
    unlockedAchievements, pendingAchievementUnlocks,
  } = deps;

  function checkAchievements() {
    const fishTypes = new Set(fish.value.map((f) => f.type));
    const upgradeCount = Object.values(upgrades).filter(Boolean).length;
    const isTankFull = fish.value.length >= tankCapacity.value;

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (unlockedAchievements.value.includes(def.id)) continue;
      let unlocked = false;
      switch (def.condition) {
        case "fish-count":      unlocked = fish.value.length >= (def.threshold ?? 1); break;
        case "total-coins":     unlocked = totalCoinsCollected.value >= (def.threshold ?? 0); break;
        case "care-streak":     unlocked = maxCareStreakEver.value >= (def.threshold ?? 1); break;
        case "upgrade-count":   unlocked = upgradeCount >= (def.threshold ?? 1); break;
        case "species-count":   unlocked = fishTypes.size >= (def.threshold ?? 1); break;
        case "auto-feeder":     unlocked = autoFeeder.owned; break;
        case "expansion-owned": unlocked = purchasedExpansions.value.length > 0; break;
        case "feed-count":      unlocked = totalFeedCount.value >= (def.threshold ?? 1); break;
        case "tank-full":       unlocked = isTankFull; break;
      }
      if (unlocked) {
        unlockedAchievements.value.push(def.id);
        pendingAchievementUnlocks.value.push(def.id);
      }
    }
  }

  function shiftAchievementUnlock(): string | null {
    if (!pendingAchievementUnlocks.value.length) return null;
    return pendingAchievementUnlocks.value.shift() ?? null;
  }

  return { checkAchievements, shiftAchievementUnlock };
}
