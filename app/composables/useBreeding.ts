import {
  INCUBATOR_COST,
  INCUBATION_DURATION_MS,
  BREEDING_COOLDOWN_MS,
  MIN_PARENT_HEALTH,
  MIN_PARENT_HUNGER,
  BASE_MORTALITY_CHANCE,
  SICKLY_WATCH_DURATION_MS,
  DEFAULT_INCUBATOR,
  type IncubatorState,
  type GeneticsData,
} from "~/utils/game-config";
import { fishAgeRatio, fishLifeStage } from "~/utils/economy";
import type { Ref, ComputedRef } from "vue";

type FishData = {
  id: number;
  type: string;
  name: string;
  x: number;
  y: number;
  hunger: number;
  health: number;
  boredom: number;
  speed: number;
  coinProgress: number;
  careStreak: number;
  genetics?: GeneticsData;
  generation?: number;
  parentIds?: [number, number];
  sicklyWatchUntil?: number;
  bornAt?: number;
  [key: string]: unknown;
};

export function setupBreeding(deps: {
  incubator: IncubatorState;
  pendingBreedingResult: Ref<{ success: boolean; baby?: FishData; deathReason?: string } | null>;
  fish: Ref<FishData[]>;
  coins: Ref<number>;
  tankCapacity: ComputedRef<number>;
  normalizeFish: (entry: Partial<FishData>) => FishData;
  nextId: () => number;
  save: () => void;
}) {
  const { incubator, pendingBreedingResult, fish, coins, tankCapacity, normalizeFish, nextId, save } = deps;

  function canBreed(fish1Id: number, fish2Id: number): { valid: boolean; reason?: string } {
    if (!incubator.owned) return { valid: false, reason: "Incubator not owned" };
    if (incubator.breeding) return { valid: false, reason: "Already breeding" };

    const now = Date.now();
    if (now - incubator.lastBreedTime < BREEDING_COOLDOWN_MS) {
      const remaining = Math.ceil((BREEDING_COOLDOWN_MS - (now - incubator.lastBreedTime)) / 1000);
      return { valid: false, reason: `Cooldown: ${remaining}s remaining` };
    }

    const fish1 = fish.value.find(f => f.id === fish1Id);
    const fish2 = fish.value.find(f => f.id === fish2Id);

    if (!fish1 || !fish2) return { valid: false, reason: "Fish not found" };
    if (fish1.id === fish2.id) return { valid: false, reason: "Cannot breed fish with itself" };
    if (fish1.type !== fish2.type) return { valid: false, reason: "Fish must be same species" };
    if (fish1.health < MIN_PARENT_HEALTH || fish2.health < MIN_PARENT_HEALTH)
      return { valid: false, reason: `Both fish need ${MIN_PARENT_HEALTH}+ health` };
    if (fish1.hunger < MIN_PARENT_HUNGER || fish2.hunger < MIN_PARENT_HUNGER)
      return { valid: false, reason: `Both fish need ${MIN_PARENT_HUNGER}+ hunger` };

    const defaultBornAt = Date.now() - Math.round(FISH_LIFESPAN_BASE_MS * LIFE_STAGE_JUVENILE_END);
    const age1 = fishAgeRatio(fish1.bornAt ?? defaultBornAt, fish1.type, fish1.genetics);
    const age2 = fishAgeRatio(fish2.bornAt ?? defaultBornAt, fish2.type, fish2.genetics);
    if (age1 < LIFE_STAGE_JUVENILE_END || age2 < LIFE_STAGE_JUVENILE_END)
      return { valid: false, reason: "Both fish must be adult (not juvenile)" };
    if (fish.value.length >= tankCapacity.value && !incubator.queuedBaby)
      return { valid: false, reason: "Tank is full" };

    return { valid: true };
  }

  function buyIncubator(): boolean {
    if (coins.value < INCUBATOR_COST || incubator.owned) return false;
    coins.value -= INCUBATOR_COST;
    incubator.owned = true;
    save();
    return true;
  }

  function startBreeding(fish1Id: number, fish2Id: number): { success: boolean; reason?: string } {
    const check = canBreed(fish1Id, fish2Id);
    if (!check.valid) return { success: false, reason: check.reason };

    const parent1 = fish.value.find(f => f.id === fish1Id)!;
    const parent2 = fish.value.find(f => f.id === fish2Id)!;

    incubator.breeding = {
      parent1Id: fish1Id,
      parent2Id: fish2Id,
      startedAt: Date.now(),
      babyType: parent1.type,
      babyGenetics: calculateBabyGenetics(parent1, parent2),
      babyName: generateBabyName(),
    };

    save();
    return { success: true };
  }

  function cancelBreeding(): boolean {
    if (!incubator.breeding) return false;
    incubator.breeding = null;
    save();
    return true;
  }

  function getBreedingProgress(): { progress: number; remainingMs: number } | null {
    if (!incubator.breeding) return null;
    const elapsed = Date.now() - incubator.breeding.startedAt;
    return {
      progress: Math.min(1, elapsed / INCUBATION_DURATION_MS),
      remainingMs: Math.max(0, INCUBATION_DURATION_MS - elapsed),
    };
  }

  function checkIncubation(): { hatched: boolean; baby?: FishData; died?: boolean; deathReason?: string } | null {
    if (!incubator.breeding) return null;

    const elapsed = Date.now() - incubator.breeding.startedAt;
    if (elapsed < INCUBATION_DURATION_MS) return null;

    const breeding = incubator.breeding;
    const parent1 = fish.value.find(f => f.id === breeding.parent1Id);
    const parent2 = fish.value.find(f => f.id === breeding.parent2Id);

    let mortalityChance = BASE_MORTALITY_CHANCE;
    if (parent1 && parent2 && checkInbreeding(parent1, parent2)) mortalityChance += 0.10;
    if (breeding.babyGenetics.mutation === "sickly") mortalityChance += 0.15;

    const defaultBornAt = Date.now() - Math.round(FISH_LIFESPAN_BASE_MS * LIFE_STAGE_JUVENILE_END);
    const p1Age = parent1 ? fishAgeRatio(parent1.bornAt ?? defaultBornAt, parent1.type, parent1.genetics) : 0.4;
    const p2Age = parent2 ? fishAgeRatio(parent2.bornAt ?? defaultBornAt, parent2.type, parent2.genetics) : 0.4;
    if (fishLifeStage(p1Age) === "senior" || fishLifeStage(p2Age) === "senior")
      mortalityChance += ELDER_BREED_MORTALITY_BONUS;

    const died = Math.random() < mortalityChance;
    incubator.lastBreedTime = Date.now();
    incubator.breeding = null;

    if (died) {
      save();
      return {
        hatched: false, died: true,
        deathReason: breeding.babyGenetics.mutation === "sickly"
          ? "The sickly baby didn't survive incubation..."
          : "Sadly, the baby didn't survive...",
      };
    }

    const maxGen = Math.max(parent1?.generation ?? 0, parent2?.generation ?? 0);
    const babyFish: FishData = normalizeFish({
      id: nextId(),
      type: breeding.babyType,
      name: breeding.babyName,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      hunger: 100,
      health: Math.round(100 * (breeding.babyGenetics.healthMod ?? 1)),
      speed: 2 * (breeding.babyGenetics.speedMod ?? 1),
      genetics: breeding.babyGenetics,
      generation: maxGen + 1,
      parentIds: [breeding.parent1Id, breeding.parent2Id],
      sicklyWatchUntil: breeding.babyGenetics.mutation === "sickly"
        ? Date.now() + SICKLY_WATCH_DURATION_MS : undefined,
      bornAt: Date.now(),
    });

    if (fish.value.length >= tankCapacity.value) {
      incubator.queuedBaby = {
        type: babyFish.type,
        genetics: babyFish.genetics!,
        name: babyFish.name,
        generation: babyFish.generation!,
        parentIds: babyFish.parentIds!,
      };
      save();
      return { hatched: true, baby: babyFish };
    }

    fish.value.push(babyFish);
    save();
    return { hatched: true, baby: babyFish };
  }

  function spawnQueuedBaby(): FishData | null {
    if (!incubator.queuedBaby) return null;
    if (fish.value.length >= tankCapacity.value) return null;

    const queued = incubator.queuedBaby;
    const babyFish: FishData = normalizeFish({
      id: nextId(),
      type: queued.type,
      name: queued.name,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      hunger: 100,
      health: Math.round(100 * (queued.genetics.healthMod ?? 1)),
      speed: 2 * (queued.genetics.speedMod ?? 1),
      genetics: queued.genetics,
      generation: queued.generation,
      parentIds: queued.parentIds,
      sicklyWatchUntil: queued.genetics.mutation === "sickly"
        ? Date.now() + SICKLY_WATCH_DURATION_MS : undefined,
      bornAt: Date.now(),
    });

    fish.value.push(babyFish);
    incubator.queuedBaby = null;
    save();
    return babyFish;
  }

  function getEligibleBreedingPartners(fishId: number): FishData[] {
    const target = fish.value.find(f => f.id === fishId);
    if (!target) return [];
    return fish.value.filter(f =>
      f.id !== fishId &&
      f.type === target.type &&
      f.health >= MIN_PARENT_HEALTH &&
      f.hunger >= MIN_PARENT_HUNGER
    );
  }

  function clearBreedingResult() {
    pendingBreedingResult.value = null;
  }

  return {
    canBreed, buyIncubator, startBreeding, cancelBreeding, getBreedingProgress,
    checkIncubation, spawnQueuedBaby, getEligibleBreedingPartners, clearBreedingResult,
  };
}

export { DEFAULT_INCUBATOR };
