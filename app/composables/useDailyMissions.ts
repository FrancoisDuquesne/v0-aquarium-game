import { MISSION_POOL, DAILY_MISSION_COUNT } from "~/utils/game-config";
import type { Ref } from "vue";

export interface DailyMission {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface DailyState {
  date: string;
  loginStreak: number;
  bonusClaimed: boolean;
  missions: DailyMission[];
  feedCount: number;
  coinsCollected: number;
  dropsCollected: number;
}

export function generateDailyMissions(): DailyMission[] {
  const pool = [...MISSION_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, DAILY_MISSION_COUNT).map((def) => ({
    id: def.id,
    progress: 0,
    claimed: false,
  }));
}

export function setupDailyMissions(deps: {
  dailyState: Ref<DailyState>;
  coins: Ref<number>;
  save: () => void;
}) {
  const { dailyState, coins, save } = deps;

  function updateMissionProgress(type: string, value: number) {
    dailyState.value.missions.forEach((m) => {
      if (m.claimed) return;
      const def = MISSION_POOL.find((d) => d.id === m.id);
      if (!def || def.type !== type) return;
      m.progress = Math.min(def.goal, value);
    });
  }

  function claimMission(id: string): number {
    const missionState = dailyState.value.missions.find((m) => m.id === id);
    if (!missionState || missionState.claimed) return 0;
    const def = MISSION_POOL.find((d) => d.id === id);
    if (!def || missionState.progress < def.goal) return 0;
    missionState.claimed = true;
    coins.value += def.reward;
    save();
    return def.reward;
  }

  return { updateMissionProgress, claimMission };
}
