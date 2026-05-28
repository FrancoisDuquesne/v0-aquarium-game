<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });
const isCollapsed = ref(false);

const autoFeederLabel = computed(() => {
  if (!game.autoFeeder.active) return null;
  const elapsed = now.value.getTime() - game.autoFeeder.lastFeedTime;
  const remaining = Math.max(0, Math.ceil((game.autoFeeder.feedInterval - elapsed) / 1000));
  return remaining > 0 ? `${remaining}s` : "Now";
});

const pendingDrops = computed(() => game.coinDrops.length);

const autoFeederButtonLabel = computed(() => {
  if (!game.autoFeeder.active) return "🤖  Auto-feeder  ·  Paused";
  return autoFeederLabel.value
    ? `🤖  Auto-feeder  ·  ${autoFeederLabel.value}`
    : "🤖  Auto-feeder  ·  Active";
});
</script>

<template>
  <!-- Pull tab — visible while collapsed -->
  <button
    v-if="isCollapsed"
    class="fixed bottom-24 left-0 z-50 h-20 w-7 flex flex-col items-center justify-center gap-1.5 rounded-r-xl focus:outline-none transition-colors hover:bg-white/5"
    style="background: rgba(2,6,23,0.82); border: 1px solid rgba(255,255,255,0.1); border-left: none; backdrop-filter: blur(12px);"
    title="Expand tools"
    @click="isCollapsed = false">
    <UIcon name="i-mdi-chevron-right" class="w-3.5 h-3.5 text-white/50 shrink-0" />
    <span class="text-white/40 font-semibold uppercase tracking-wider select-none"
      style="writing-mode: vertical-rl; font-size: 10px; letter-spacing: 0.1em;">Tools</span>
  </button>

  <!-- Panel -->
  <div
    class="fixed bottom-20 left-4 z-50 rounded-2xl flex flex-col overflow-hidden w-60"
    :style="{
      background: 'rgba(2,6,23,0.82)',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      transition: 'transform 280ms ease-in-out, opacity 280ms ease-in-out',
      transform: isCollapsed ? 'translateX(calc(-100% - 1rem))' : 'translateX(0)',
      opacity: isCollapsed ? '0' : '1',
      pointerEvents: isCollapsed ? 'none' : undefined,
    }">

    <!-- Header -->
    <div class="flex items-center justify-between pl-4 pr-2 py-2"
      style="border-bottom: 1px solid rgba(255,255,255,0.07);">
      <span class="text-xs font-bold uppercase tracking-widest text-white/40">Tools</span>
      <UButton
        icon="i-mdi-chevron-left"
        variant="ghost"
        color="neutral"
        size="xs"
        title="Collapse"
        @click="isCollapsed = true" />
    </div>

    <div class="p-3 flex flex-col gap-2">

      <!-- Feed mode (informational) -->
      <div class="rounded-xl px-3 py-3 flex items-center gap-3"
        style="background: rgba(6,182,212,0.10); border: 1px solid rgba(6,182,212,0.22);">
        <span class="text-xl leading-none shrink-0">{{ game.tools.spoonOwned ? '🥄' : '🍽️' }}</span>
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-sm font-semibold text-cyan-300">
            {{ game.tools.spoonOwned ? 'Scatter Feed' : 'Flake Feed' }}
          </span>
          <span class="text-xs text-white/40">
            {{ game.tools.spoonOwned ? '5 flakes per click' : '1 flake per click' }}
          </span>
        </div>
        <div class="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
      </div>

      <!-- Auto-feeder toggle (if owned) -->
      <UButton
        v-if="game.autoFeeder.owned"
        :color="game.autoFeeder.active ? 'success' : 'neutral'"
        :variant="game.autoFeeder.active ? 'soft' : 'ghost'"
        :label="autoFeederButtonLabel"
        block
        @click="game.toggleAutoFeeder()" />

      <div class="h-px mx-1" style="background: rgba(255,255,255,0.07);" />

      <!-- Collect All -->
      <UButton
        :color="pendingDrops > 0 ? 'warning' : 'neutral'"
        :variant="pendingDrops > 0 ? 'soft' : 'ghost'"
        :label="pendingDrops > 0 ? `💰  Collect All  ·  ${pendingDrops}` : '💰  Collect All'"
        :disabled="pendingDrops === 0"
        block
        @click="pendingDrops > 0 ? game.collectAll() : undefined" />

    </div>
  </div>
</template>
