import {
  DEFAULT_GENETICS,
  MUTATION_DEFINITIONS,
  BABY_NAME_PREFIXES,
  BABY_NAME_SUFFIXES,
  type GeneticsData,
  type MutationType,
} from "~/utils/game-config";

export type BreedParent = {
  genetics?: GeneticsData;
  parentIds?: [number, number];
};

export function generateBabyName(): string {
  const prefix = BABY_NAME_PREFIXES[Math.floor(Math.random() * BABY_NAME_PREFIXES.length)];
  const suffix = BABY_NAME_SUFFIXES[Math.floor(Math.random() * BABY_NAME_SUFFIXES.length)];
  return prefix + suffix;
}

export function inheritTrait(parent1Val: number, parent2Val: number, isHunger = false): number {
  const roll = Math.random();
  const avg = (parent1Val + parent2Val) / 2;
  const better = isHunger ? Math.min(parent1Val, parent2Val) : Math.max(parent1Val, parent2Val);
  const worse = isHunger ? Math.max(parent1Val, parent2Val) : Math.min(parent1Val, parent2Val);

  if (roll < 0.70) {
    return avg + (Math.random() - 0.5) * 0.1;
  } else if (roll < 0.90) {
    const bonus = isHunger ? -0.05 - Math.random() * 0.1 : 0.05 + Math.random() * 0.1;
    return better + bonus;
  } else if (roll < 0.98) {
    const penalty = isHunger ? 0.05 + Math.random() * 0.1 : -0.05 - Math.random() * 0.1;
    return worse + penalty;
  } else {
    const extreme = Math.random() < 0.5
      ? (isHunger ? 0.7 : 1.3 + Math.random() * 0.2)
      : (isHunger ? 1.3 + Math.random() * 0.2 : 0.6 + Math.random() * 0.1);
    return extreme;
  }
}

export function rollMutation(): MutationType | undefined {
  const roll = Math.random();
  const mutations: MutationType[] = ["golden", "hardy", "swift", "sickly", "lethargic", "voracious"];
  for (let i = 0; i < mutations.length; i++) {
    if (roll < (i + 1) * 0.02) return mutations[i];
  }
  return undefined;
}

export function calculateBabyGenetics(parent1: BreedParent, parent2: BreedParent): GeneticsData {
  const p1g = parent1.genetics ?? DEFAULT_GENETICS;
  const p2g = parent2.genetics ?? DEFAULT_GENETICS;

  const genetics: GeneticsData = {
    speedMod:  clamp(inheritTrait(p1g.speedMod,  p2g.speedMod),        0.6, 1.5),
    coinMod:   clamp(inheritTrait(p1g.coinMod,   p2g.coinMod),         0.6, 1.6),
    hungerMod: clamp(inheritTrait(p1g.hungerMod, p2g.hungerMod, true), 0.7, 1.6),
    healthMod: clamp(inheritTrait(p1g.healthMod, p2g.healthMod),       0.6, 1.4),
  };

  const mutation = rollMutation();
  if (mutation) {
    genetics.mutation = mutation;
    const effects = MUTATION_DEFINITIONS[mutation].effects;
    if (effects.speedMod)  genetics.speedMod  *= effects.speedMod;
    if (effects.coinMod)   genetics.coinMod   *= effects.coinMod;
    if (effects.hungerMod) genetics.hungerMod *= effects.hungerMod;
    if (effects.healthMod) genetics.healthMod *= effects.healthMod;
  }

  return genetics;
}

export function checkInbreeding(parent1: BreedParent, parent2: BreedParent): boolean {
  if (!parent1.parentIds || !parent2.parentIds) return false;
  const p1Parents = new Set(parent1.parentIds);
  for (const id of parent2.parentIds) {
    if (p1Parents.has(id)) return true;
  }
  return false;
}
