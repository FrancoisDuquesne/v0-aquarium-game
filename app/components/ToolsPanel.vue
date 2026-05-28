<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });

const autoFeederLabel = computed(() => {
  if (!game.autoFeeder.active) return null;
  const elapsed = now.value.getTime() - game.autoFeeder.lastFeedTime;
  const remaining = Math.max(0, Math.ceil((game.autoFeeder.feedInterval - elapsed) / 1000));
  return remaining > 0 ? `${remaining}s` : "Now";
});
</script>

<template>
  <div class="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex flex-col">
    <div
      class="rounded-r-2xl flex flex-col gap-1 px-1.5 py-2"
      style="background: rgba(2,6,23,0.88); border: 1px solid rgba(255,255,255,0.1); border-left: none; backdrop-filter: blur(12px);">

      <!-- Feed tool (single) -->
      <button
        class="w-10 h-10 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all focus:outline-none bg-cyan-500/20 text-cyan-300"
        :title="game.tools.spoonOwned ? 'Scatter Feed (5 flakes per click)' : 'Flake Feed (1 flake per click)'"
        @click="">
        <span class="text-base leading-none">{{ game.tools.spoonOwned ? '🥄' : '🍽️' }}</span>
        <span class="text-[8px] font-semibold uppercase leading-none">Feed</span>
      </button>

      <!-- Divider -->
      <div v-if="game.autoFeeder.owned" class="h-px mx-1 bg-white/10 my-0.5" />

      <!-- Auto-feeder toggle (if owned) -->
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
    </div>
  </div>
</template>
