<script setup lang="ts">
const game = useGameStore();
const toast = useToast();
const now = useNow({ interval: 1000 });

const todayMissions = computed(() =>
  game.dailyState.missions.map((m) => {
    const def = MISSION_POOL.find((d) => d.id === m.id);
    return def ? { ...def, progress: m.progress, claimed: m.claimed } : null;
  }).filter(Boolean) as (typeof MISSION_POOL[number] & { progress: number; claimed: boolean })[]
);

const achievementCount = computed(() => game.unlockedAchievements.length);
const totalAchievements = ACHIEVEMENT_DEFINITIONS.length;

const loginStreak = computed(() => game.dailyState.loginStreak);
const nextDayBonus = computed(() =>
  Math.min(100, LOGIN_BONUS_BASE + Math.floor(loginStreak.value / 3) * 10)
);

function missionProgressPct(progress: number, goal: number) {
  return Math.min(100, Math.round((progress / goal) * 100));
}

function claimMission(id: string) {
  const reward = game.claimMission(id);
  if (reward > 0) {
    toast.add({
      title: `Mission complete! +${reward} coins`,
      color: "success",
      duration: 2500,
    });
  }
}

// ── Prestige ───────────────────────────────────────────────────────────────
const showPrestigeConfirm = ref(false);

function confirmPrestige() {
  game.doPrestige();
  showPrestigeConfirm.value = false;
  toast.add({
    title: `✨ Prestige Level ${game.prestigeLevel}!`,
    description: `Your fish have been released. +10% permanent coin multiplier active.`,
    color: "success",
    duration: 6000,
  });
}
</script>

<template>
  <div class="flex flex-col h-full overflow-y-auto p-4 space-y-6">

    <!-- Login streak -->
    <div class="rounded-xl p-4 flex items-center gap-4"
      style="background: linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08)); border: 1px solid rgba(14,165,233,0.2);">
      <div class="text-3xl leading-none">🌅</div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white">Day {{ loginStreak }} Login Streak</p>
        <p class="text-xs text-white/50 mt-0.5">
          Tomorrow's bonus: {{ nextDayBonus }} coins
        </p>
      </div>
      <div class="shrink-0 flex flex-col items-end">
        <div class="flex gap-0.5">
          <div
            v-for="i in Math.min(loginStreak, 7)"
            :key="i"
            class="w-2.5 h-2.5 rounded-sm"
            :class="i <= loginStreak ? 'bg-cyan-400' : 'bg-white/10'" />
          <div
            v-for="i in Math.max(0, 7 - loginStreak)"
            :key="'e' + i"
            class="w-2.5 h-2.5 rounded-sm bg-white/10" />
        </div>
        <p class="text-xs text-white/30 mt-1">7-day preview</p>
      </div>
    </div>

    <!-- Daily missions -->
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
        Today's Missions
      </h3>
      <div v-if="todayMissions.length" class="space-y-2.5">
        <div
          v-for="m in todayMissions"
          :key="m.id"
          class="rounded-xl p-3 flex flex-col gap-2"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <span class="text-base leading-none shrink-0">{{ m.icon }}</span>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">{{ m.title }}</p>
                <p class="text-xs text-white/40 truncate">{{ m.desc }}</p>
              </div>
            </div>
            <!-- Claim / claimed state -->
            <UBadge
              v-if="m.claimed"
              color="success"
              variant="soft"
              :label="`✓ +${m.reward}`"
              class="shrink-0" />
            <UButton
              v-else-if="m.progress >= m.goal"
              color="warning"
              variant="soft"
              size="sm"
              :label="`Claim +${m.reward}`"
              class="shrink-0"
              @click="claimMission(m.id)" />
            <span v-else class="shrink-0 text-xs text-white/30 tabular-nums">
              {{ m.progress }}/{{ m.goal }}
            </span>
          </div>
          <!-- Progress bar -->
          <div class="h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="m.claimed ? 'bg-emerald-400' : m.progress >= m.goal ? 'bg-yellow-400' : 'bg-cyan-500'"
              :style="{ width: missionProgressPct(m.progress, m.goal) + '%' }" />
          </div>
        </div>
      </div>
      <div v-else class="text-xs text-white/30 text-center py-4">
        Missions refresh daily — check back tomorrow!
      </div>
    </div>

    <!-- Achievements -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-semibold uppercase tracking-widest text-white/40">
          Achievements
        </h3>
        <span class="text-xs text-white/30">{{ achievementCount }} / {{ totalAchievements }}</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div
          v-for="ach in ACHIEVEMENT_DEFINITIONS"
          :key="ach.id"
          class="rounded-xl p-3 flex items-center gap-3 transition-all"
          :class="game.unlockedAchievements.includes(ach.id)
            ? 'border border-yellow-500/25'
            : 'border border-transparent opacity-40'"
          :style="game.unlockedAchievements.includes(ach.id)
            ? 'background: rgba(234,179,8,0.08)'
            : 'background: rgba(255,255,255,0.03)'">
          <span class="text-2xl leading-none shrink-0">{{ ach.icon }}</span>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-white truncate">{{ ach.name }}</p>
            <p class="text-xs text-white/40 leading-snug">{{ ach.desc }}</p>
          </div>
          <span
            v-if="game.unlockedAchievements.includes(ach.id)"
            class="ml-auto shrink-0 text-yellow-400 text-sm">
            ✓
          </span>
        </div>
      </div>
    </div>

    <!-- Prestige -->
    <div>
      <h3 class="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
        The Great Release
      </h3>
      <div class="rounded-xl p-4 flex flex-col gap-3"
        style="background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);">
        <div class="flex items-center gap-3">
          <span class="text-3xl leading-none">✨</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white">
              Prestige Level {{ game.prestigeLevel }}
            </p>
            <p class="text-xs text-white/50 mt-0.5">
              {{ game.prestigeLevel > 0 ? `+${game.prestigeLevel * 10}% permanent coin bonus active` : 'Release your fish to earn a permanent bonus' }}
            </p>
          </div>
        </div>
        <div v-if="!game.canPrestige" class="space-y-1.5">
          <p class="text-xs text-white/40">Requirements:</p>
          <div class="flex items-center gap-2 text-xs"
            :class="game.fish.length >= PRESTIGE_MIN_FISH ? 'text-emerald-400' : 'text-white/30'">
            <span>{{ game.fish.length >= PRESTIGE_MIN_FISH ? '✓' : '○' }}</span>
            <span>{{ game.fish.length }}/{{ PRESTIGE_MIN_FISH }} fish in tank</span>
          </div>
          <div class="flex items-center gap-2 text-xs"
            :class="game.coins >= PRESTIGE_MIN_COINS ? 'text-emerald-400' : 'text-white/30'">
            <span>{{ game.coins >= PRESTIGE_MIN_COINS ? '✓' : '○' }}</span>
            <span>{{ abbreviateCoins(game.coins) }}/{{ PRESTIGE_MIN_COINS }} coins</span>
          </div>
        </div>
        <div v-else class="space-y-2">
          <p class="text-xs text-yellow-300/80 leading-snug">
            Release all fish back to the ocean and restart with {{ PRESTIGE_START_COINS + PRESTIGE_START_BONUS }} coins.
            <span class="font-semibold text-yellow-300">Gain +10% permanent coin multiplier.</span>
          </p>
          <UButton
            v-if="!showPrestigeConfirm"
            color="primary"
            variant="soft"
            :label="`✨ Prestige (Level ${game.prestigeLevel + 1})`"
            block
            @click="showPrestigeConfirm = true" />
          <div v-else class="flex flex-col gap-2">
            <p class="text-xs text-red-300/80 font-semibold">⚠️ This will release all your fish. Are you sure?</p>
            <div class="flex gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                label="Cancel"
                class="flex-1"
                @click="showPrestigeConfirm = false" />
              <UButton
                color="error"
                variant="soft"
                label="Confirm ✨"
                class="flex-1"
                @click="confirmPrestige" />
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
