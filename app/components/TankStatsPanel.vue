<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });
const isCollapsed = ref(false);

const breakdown = computed(() => maintenanceBreakdown(game.fish, game.upgrades));
const coinsPerMinute = computed(() =>
  game.fish.reduce((sum, f) => sum + coinsPerMinuteFor(f.type), 0)
);
const netPerMinute = computed(() => coinsPerMinute.value - breakdown.value.total);
const nextChargeIn = computed(() => {
  const elapsed = now.value.getTime() - game.lastMaintenanceTick;
  return Math.max(0, Math.ceil((MAINTENANCE_INTERVAL_MS - elapsed) / 1000));
});

const breakdownRows = [
  { icon: "⚡", label: "Power",  key: "power" as const },
  { icon: "💧", label: "Water",  key: "water" as const },
  { icon: "🍤", label: "Food",   key: "food"  as const },
];

const SPARK_W = 140;
const SPARK_H = 40;

const sparkPoints = computed(() => {
  const history = game.netIncomeHistory;
  if (history.length < 2) return "";
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  return history
    .map((v, i) => {
      const x = (i / (history.length - 1)) * SPARK_W;
      const y = SPARK_H - ((v - min) / range) * (SPARK_H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
});

const zeroY = computed(() => {
  const history = game.netIncomeHistory;
  if (!history.length) return SPARK_H / 2;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const y = SPARK_H - ((0 - min) / range) * (SPARK_H - 4) - 2;
  return Math.max(2, Math.min(SPARK_H - 2, y));
});

const latestNet = computed(() => {
  const h = game.netIncomeHistory;
  return h.length ? h[h.length - 1] : null;
});
</script>

<template>
  <!-- Pull tab — visible while collapsed -->
  <button
    v-if="isCollapsed"
    class="fixed top-16 left-0 z-50 h-20 w-7 flex flex-col items-center justify-center gap-1.5 rounded-r-xl focus:outline-none transition-colors hover:bg-white/5"
    style="background: rgba(2,6,23,0.82); border: 1px solid rgba(255,255,255,0.1); border-left: none; backdrop-filter: blur(12px);"
    title="Expand stats"
    @click="isCollapsed = false">
    <UIcon name="i-mdi-chevron-right" class="w-3.5 h-3.5 text-white/50 shrink-0" />
    <span class="text-white/40 font-semibold uppercase tracking-wider select-none"
      style="writing-mode: vertical-rl; font-size: 10px; letter-spacing: 0.1em;">Stats</span>
  </button>

  <!-- Panel -->
  <div
    class="fixed top-14 left-4 z-50 rounded-2xl flex flex-col overflow-hidden w-64"
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
      <span class="text-xs font-bold uppercase tracking-widest text-white/40">Tank Stats</span>
      <UButton
        icon="i-mdi-chevron-left"
        variant="ghost"
        color="neutral"
        size="xs"
        title="Collapse"
        @click="isCollapsed = true" />
    </div>

    <div class="p-3 flex flex-col gap-3">

      <!-- 3 summary tiles -->
      <div class="grid grid-cols-3 gap-1.5">
        <div class="rounded-lg p-2 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-xs text-white/40 mb-0.5">Cost/cycle</p>
          <p class="text-sm font-bold text-red-400">-{{ breakdown.total }}</p>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-xs text-white/40 mb-0.5">Income/min</p>
          <p class="text-sm font-bold text-emerald-400">+{{ abbreviateCoins(coinsPerMinute) }}</p>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-xs text-white/40 mb-0.5">Net/min</p>
          <p class="text-sm font-bold" :class="netPerMinute >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ netPerMinute >= 0 ? '+' : '' }}{{ abbreviateCoins(netPerMinute) }}
          </p>
        </div>
      </div>

      <!-- Sparkline -->
      <div class="rounded-lg p-2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-xs text-white/30 font-semibold uppercase tracking-wide">Net history</span>
          <span v-if="latestNet !== null" class="text-xs font-bold tabular-nums"
            :class="latestNet >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ latestNet >= 0 ? '+' : '' }}{{ latestNet }}/min
          </span>
        </div>
        <svg :width="SPARK_W" :height="SPARK_H" class="w-full overflow-visible">
          <line :x1="0" :y1="zeroY" :x2="SPARK_W" :y2="zeroY"
            stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3 3" />
          <polyline v-if="sparkPoints"
            :points="sparkPoints"
            fill="none"
            :stroke="latestNet !== null && latestNet >= 0 ? '#34d399' : '#f87171'"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round" />
          <text v-else x="50%" y="55%" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="10">
            Collecting data…
          </text>
        </svg>
      </div>

      <!-- Breakdown rows -->
      <div class="space-y-1">
        <div v-for="row in breakdownRows" :key="row.key"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style="background: rgba(255,255,255,0.03);">
          <span class="text-sm w-5 text-center shrink-0">{{ row.icon }}</span>
          <span class="flex-1 text-xs text-white/50">{{ row.label }}</span>
          <span class="text-xs font-bold tabular-nums text-red-400/80">-{{ breakdown[row.key] }}</span>
        </div>
      </div>

      <p class="text-xs text-white/30 text-center">
        Next charge in <span class="text-white/50 font-semibold">{{ nextChargeIn }}s</span>
      </p>
    </div>
  </div>
</template>
