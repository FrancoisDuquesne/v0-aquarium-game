<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });

const autoFeederLabel = computed(() => {
  if (!game.autoFeeder.active) return null;
  const elapsed = now.value.getTime() - game.autoFeeder.lastFeedTime;
  const remaining = Math.max(0, Math.ceil((game.autoFeeder.feedInterval - elapsed) / 1000));
  return remaining > 0 ? `${remaining}s` : "Now";
});

const collectorLevel = computed(() =>
  COIN_COLLECTOR_LEVELS.find((e) => e.level === game.coinCollector.level) ?? COIN_COLLECTOR_LEVELS[0]
);
const nextCollector = computed(() => nextCollectorLevel(game.coinCollector.level));
const collectorCooldownMs = computed(() => {
  const cd = collectorLevel.value.cooldown;
  if (!Number.isFinite(cd)) return Infinity;
  return Math.max(0, cd - (now.value.getTime() - game.coinCollector.lastSweep));
});
const collectorReady = computed(() => collectorCooldownMs.value <= 0);
const canSweep = computed(() => collectorReady.value && game.coinDrops.length > 0);
const collectorLabel = computed(() =>
  collectorReady.value ? "Sweep" : `${Math.ceil(collectorCooldownMs.value / 1000)}s`
);

const hasAnyTool = computed(() =>
  game.tools.spoonOwned || game.autoFeeder.owned || game.coinCollector.level > 0
);
</script>

<template>
  <div class="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col">
    <div
      class="rounded-r-2xl flex flex-col gap-1 px-1.5 py-2"
      style="background: rgba(2,6,23,0.88); border: 1px solid rgba(255,255,255,0.1); border-left: none; backdrop-filter: blur(12px);">

      <!-- Tool selector: Flake -->
      <button
        class="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all focus:outline-none"
        :class="game.selectedTool === 'flake'
          ? 'bg-cyan-500/20 text-cyan-300'
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'"
        title="Flake Feeder"
        @click="game.selectTool('flake')">
        <span class="text-base leading-none">🍽️</span>
        <span class="text-[8px] font-semibold uppercase leading-none">Flake</span>
      </button>

      <!-- Tool selector: Spoon (if owned) -->
      <button
        v-if="game.tools.spoonOwned"
        class="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all focus:outline-none"
        :class="game.selectedTool === 'spoon'
          ? 'bg-cyan-500/20 text-cyan-300'
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'"
        title="Feeding Spoon"
        @click="game.selectTool('spoon')">
        <span class="text-base leading-none">🥄</span>
        <span class="text-[8px] font-semibold uppercase leading-none">Spoon</span>
      </button>

      <!-- Divider -->
      <div v-if="game.autoFeeder.owned || game.coinCollector.level > 0"
        class="h-px mx-1 bg-white/10 my-0.5" />

      <!-- Auto-feeder (if owned) -->
      <button
        v-if="game.autoFeeder.owned"
        class="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all focus:outline-none"
        :class="game.autoFeeder.active
          ? 'bg-emerald-500/20 text-emerald-300'
          : 'text-white/40 hover:text-white/70 hover:bg-white/5'"
        :title="game.autoFeeder.active ? 'Auto-feeder ON — click to pause' : 'Auto-feeder OFF — click to start'"
        @click="game.toggleAutoFeeder()">
        <span class="text-base leading-none">🤖</span>
        <span class="text-[8px] font-semibold uppercase leading-none">
          {{ game.autoFeeder.active ? (autoFeederLabel ?? 'On') : 'Off' }}
        </span>
      </button>

      <!-- Coin collector sweep (if owned) -->
      <button
        v-if="game.coinCollector.level > 0"
        class="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all focus:outline-none"
        :class="canSweep
          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
          : 'text-white/25 cursor-not-allowed'"
        :disabled="!canSweep"
        title="Sweep coin drops"
        @click="game.manualCollectorSweep()">
        <span class="text-base leading-none">🧺</span>
        <span class="text-[8px] font-semibold uppercase leading-none">{{ collectorLabel }}</span>
      </button>
    </div>
  </div>
</template>
