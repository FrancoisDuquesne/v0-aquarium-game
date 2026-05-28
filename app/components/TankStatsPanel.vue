<script setup lang="ts">
const emit = defineEmits<{ (e: "close"): void }>();
const game = useGameStore();
const now = useNow({ interval: 1000 });

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

// Sparkline
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
  <div
    class="absolute bottom-20 right-4 z-30 rounded-2xl flex flex-col overflow-hidden w-64"
    style="background: rgba(2,6,23,0.95); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.6); backdrop-filter: blur(12px);">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5"
      style="border-bottom: 1px solid rgba(255,255,255,0.07);">
      <span class="text-[11px] font-bold uppercase tracking-widest text-white/40">Tank Stats</span>
      <button class="text-white/30 hover:text-white/60 transition-colors focus:outline-none text-xs" @click="emit('close')">✕</button>
    </div>

    <div class="p-3 flex flex-col gap-3">

      <!-- 3 summary tiles -->
      <div class="grid grid-cols-3 gap-1.5">
        <div class="rounded-lg p-2 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-[9px] text-white/30 mb-0.5">Cost/cycle</p>
          <p class="text-sm font-bold text-red-400">-{{ breakdown.total }}</p>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-[9px] text-white/30 mb-0.5">Income/min</p>
          <p class="text-sm font-bold text-emerald-400">+{{ abbreviateCoins(coinsPerMinute) }}</p>
        </div>
        <div class="rounded-lg p-2 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-[9px] text-white/30 mb-0.5">Net/min</p>
          <p class="text-sm font-bold" :class="netPerMinute >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ netPerMinute >= 0 ? '+' : '' }}{{ abbreviateCoins(netPerMinute) }}
          </p>
        </div>
      </div>

      <!-- Sparkline -->
      <div class="rounded-lg p-2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
        <div class="flex items-center justify-between mb-1.5">
          <span class="text-[9px] text-white/30 font-semibold uppercase tracking-wide">Net income history</span>
          <span v-if="latestNet !== null" class="text-[9px] font-bold tabular-nums"
            :class="latestNet >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ latestNet >= 0 ? '+' : '' }}{{ latestNet }}/min
          </span>
        </div>
        <svg :width="SPARK_W" :height="SPARK_H" class="w-full overflow-visible">
          <!-- Zero line -->
          <line :x1="0" :y1="zeroY" :x2="SPARK_W" :y2="zeroY"
            stroke="rgba(255,255,255,0.12)" stroke-width="1" stroke-dasharray="3 3" />
          <!-- Sparkline -->
          <polyline v-if="sparkPoints"
            :points="sparkPoints"
            fill="none"
            :stroke="latestNet !== null && latestNet >= 0 ? '#34d399' : '#f87171'"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round" />
          <!-- No data placeholder -->
          <text v-else x="50%" y="55%" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="9">
            Collecting data…
          </text>
        </svg>
      </div>

      <!-- Breakdown rows -->
      <div class="space-y-1">
        <div v-for="row in breakdownRows" :key="row.key"
          class="flex items-center gap-2 px-2 py-1 rounded-lg"
          style="background: rgba(255,255,255,0.03);">
          <span class="text-sm w-5 text-center shrink-0">{{ row.icon }}</span>
          <span class="flex-1 text-[11px] text-white/50">{{ row.label }}</span>
          <span class="text-[11px] font-bold tabular-nums text-red-400/80">-{{ breakdown[row.key] }}</span>
        </div>
      </div>

      <p class="text-[10px] text-white/25 text-center">
        Next charge in <span class="text-white/50 font-semibold">{{ nextChargeIn }}s</span>
      </p>
    </div>
  </div>
</template>
