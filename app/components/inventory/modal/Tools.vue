<script setup lang="ts">
const game = useGameStore();

const collectorStats = computed(
  () =>
    COIN_COLLECTOR_LEVELS.find((e) => e.level === game.coinCollector.level) ??
    COIN_COLLECTOR_LEVELS[0]
);
const nextCollector = computed(() => nextCollectorLevel(game.coinCollector.level));
const collectorDescription = computed(() => {
  const s = collectorStats.value;
  if (!Number.isFinite(s.cooldown)) return "Click coins manually to collect them.";
  return `Collects up to ${s.capacity} drops every ${Math.round(s.cooldown / 1000)}s.`;
});
</script>

<template>
  <div class="p-4 space-y-3">
    <!-- Flake Feeder -->
    <div class="rounded-xl bg-white/5 border border-white/8 p-4 flex items-start gap-3">
      <div class="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center text-xl shrink-0">🍽️</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-white">Flake Feeder</p>
            <p class="text-[11px] text-white/40 mt-0.5">Standard tool — always available</p>
          </div>
          <button
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all"
            :class="game.selectedTool === 'flake'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/8 text-white/50 hover:bg-white/12 border border-transparent'"
            @click="game.selectTool('flake')">
            {{ game.selectedTool === 'flake' ? '✓ Selected' : 'Select' }}
          </button>
        </div>
        <p class="text-[11px] text-white/40 mt-2">Sprinkle food at the tap location.</p>
      </div>
    </div>

    <!-- Feeding Spoon -->
    <div class="rounded-xl bg-white/5 border border-white/8 p-4 flex items-start gap-3">
      <div class="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center text-xl shrink-0">🥄</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-white">Feeding Spoon</p>
            <p v-if="!game.tools.spoonOwned" class="text-[11px] text-yellow-400/80 font-medium mt-0.5">
              {{ SPOON_COST }} coins
            </p>
            <p v-else class="text-[11px] text-white/40 mt-0.5">Owned</p>
          </div>
          <button
            v-if="game.tools.spoonOwned"
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all"
            :class="game.selectedTool === 'spoon'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/8 text-white/50 hover:bg-white/12 border border-transparent'"
            @click="game.selectTool('spoon')">
            {{ game.selectedTool === 'spoon' ? '✓ Selected' : 'Select' }}
          </button>
          <button
            v-else
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
            :disabled="game.coins < SPOON_COST"
            @click="game.buySpoon(SPOON_COST)">
            Buy
          </button>
        </div>
        <p class="text-[11px] text-white/40 mt-2">Drop a handful of flakes with one click.</p>
      </div>
    </div>

    <!-- Auto Feeder -->
    <div class="rounded-xl bg-white/5 border border-white/8 p-4 flex items-start gap-3">
      <div class="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center text-xl shrink-0">🤖</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-white">Auto Feeder</p>
            <p v-if="!game.autoFeeder.owned" class="text-[11px] text-yellow-400/80 font-medium mt-0.5">
              {{ AUTO_FEEDER_COST }} coins
            </p>
            <p v-else class="text-[11px] mt-0.5"
              :class="game.autoFeeder.active ? 'text-emerald-400' : 'text-white/40'">
              {{ game.autoFeeder.active ? 'Active' : 'Paused' }}
            </p>
          </div>
          <button
            v-if="game.autoFeeder.owned"
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-all"
            :class="game.autoFeeder.active
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10'
              : 'bg-white/8 text-white/50 hover:bg-white/12 border border-transparent'"
            @click="game.toggleAutoFeeder()">
            {{ game.autoFeeder.active ? 'Turn Off' : 'Turn On' }}
          </button>
          <button
            v-else
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
            :disabled="game.coins < AUTO_FEEDER_COST"
            @click="game.buyAutoFeeder(AUTO_FEEDER_COST)">
            Buy
          </button>
        </div>
        <p class="text-[11px] text-white/40 mt-2">Feeds fish automatically every 30 seconds.</p>
      </div>
    </div>

    <!-- Coin Collector -->
    <div class="rounded-xl bg-white/5 border border-white/8 p-4 flex items-start gap-3">
      <div class="w-10 h-10 rounded-lg bg-white/8 flex items-center justify-center text-xl shrink-0">🧺</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-white">Coin Collector</p>
            <p class="text-[11px] text-white/40 mt-0.5">{{ collectorStats.label }}</p>
          </div>
          <button
            v-if="nextCollector"
            class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
            :disabled="game.coins < nextCollector.cost"
            @click="game.buyCoinCollectorUpgrade()">
            Upgrade · {{ nextCollector.cost }}
          </button>
          <span v-else class="shrink-0 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            Maxed
          </span>
        </div>
        <p class="text-[11px] text-white/40 mt-2">{{ collectorDescription }}</p>
      </div>
    </div>
  </div>
</template>
