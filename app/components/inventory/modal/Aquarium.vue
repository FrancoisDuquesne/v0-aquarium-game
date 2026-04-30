<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });

function toLabel(path: string) {
  const base = (path.split("/").pop() ?? "").replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const backgrounds = computed(() =>
  AVAILABLE_BACKGROUNDS.map((src) => ({ src, label: toLabel(src) })).sort((a, b) =>
    a.label.localeCompare(b.label)
  )
);

const activeDecor = computed(() =>
  game.decorations.map((id) => DECORATION_PRESETS[id]).filter(Boolean)
);

const breakdown = computed(() =>
  maintenanceBreakdown(game.fish, game.upgrades, game.decorations)
);
const nextChargeIn = computed(() => {
  const elapsed = now.value.getTime() - game.lastMaintenanceTick;
  return Math.max(0, Math.ceil((MAINTENANCE_INTERVAL_MS - elapsed) / 1000));
});
const coinsPerMinute = computed(() =>
  game.fish.reduce((sum, f) => sum + coinsPerMinuteFor(f.type), 0)
);
const netPerMinute = computed(() => coinsPerMinute.value - breakdown.value.total);
const debtWarning = computed(() => game.coins < 0);
const fundWarning = computed(() => game.coins >= 0 && game.coins < MAINTENANCE_WARNING_THRESHOLD);

const categories = [
  { icon: "⚡", label: "Electricity", desc: "Base power + upgrades",          key: "power" as const },
  { icon: "💧", label: "Water",       desc: "Per-fish filtration",             key: "water" as const },
  { icon: "🍤", label: "Food",        desc: "Base supply + per fish",          key: "food"  as const },
  { icon: "🪸", label: "Décor",       desc: "Decoration upkeep",               key: "decor" as const },
];
</script>

<template>
  <div class="p-4 flex flex-col gap-5 overflow-y-auto h-full">

    <!-- Debt / low-funds banners -->
    <div v-if="debtWarning"
      class="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
      style="background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.3);">
      <span class="text-lg shrink-0">💀</span>
      <div>
        <p class="font-semibold text-red-300">In debt! {{ abbreviateCoins(game.coins) }} coins</p>
        <p class="text-xs text-red-300/60 mt-0.5">Tank running on reserves. Earn coins to recover.</p>
      </div>
    </div>
    <div v-else-if="fundWarning"
      class="rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
      style="background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.25);">
      <span class="text-lg shrink-0">⚠️</span>
      <div>
        <p class="font-semibold text-yellow-300">Funds running low</p>
        <p class="text-xs text-yellow-300/60 mt-0.5">Less than {{ MAINTENANCE_WARNING_THRESHOLD }} coins — feed your fish!</p>
      </div>
    </div>

    <!-- Background section -->
    <section class="space-y-2.5">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-white/30">Background</h3>
      <div class="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
        <div
          v-for="bg in backgrounds"
          :key="bg.src"
          class="shrink-0 w-24 snap-start rounded-xl overflow-hidden cursor-pointer transition-all relative"
          :style="game.background === bg.src
            ? 'border: 2px solid #22d3ee; outline: 2px solid rgba(34,211,238,0.2);'
            : 'border: 2px solid rgba(255,255,255,0.06);'"
          @click="game.setBackground(bg.src)">
          <img :src="bg.src" :alt="bg.label" class="w-full h-14 object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <p class="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-semibold text-white/80 truncate leading-tight">
            {{ bg.label }}
          </p>
          <div v-if="game.background === bg.src"
            class="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
            <span class="text-[8px] text-slate-950 font-bold">✓</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Decorations -->
    <section class="space-y-2.5">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-white/30">Active Decorations</h3>
      <div v-if="activeDecor.length" class="flex flex-wrap gap-2">
        <span
          v-for="d in activeDecor"
          :key="d.label"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);">
          <span>{{ d.emoji }}</span>
          <span class="text-white/60">{{ d.label }}</span>
        </span>
      </div>
      <p v-else class="text-xs text-white/30">None — buy some in the Shop → Décor tab.</p>
    </section>

    <!-- Operating costs -->
    <section class="space-y-3">
      <h3 class="text-[10px] font-bold uppercase tracking-widest text-white/30">Operating Costs</h3>

      <!-- 3-stat summary -->
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-xl p-3 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-[10px] text-white/35 mb-1">Per cycle</p>
          <p class="text-base font-bold text-red-400">-{{ breakdown.total }}</p>
        </div>
        <div class="rounded-xl p-3 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-[10px] text-white/35 mb-1">Income/min</p>
          <p class="text-base font-bold text-emerald-400">+{{ abbreviateCoins(coinsPerMinute) }}</p>
        </div>
        <div class="rounded-xl p-3 text-center" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);">
          <p class="text-[10px] text-white/35 mb-1">Net/min</p>
          <p class="text-base font-bold" :class="netPerMinute >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ netPerMinute >= 0 ? "+" : "" }}{{ abbreviateCoins(netPerMinute) }}
          </p>
        </div>
      </div>
      <p class="text-[11px] text-white/30 text-center">
        Next charge in <span class="text-white/60 font-semibold">{{ nextChargeIn }}s</span>
      </p>

      <!-- Breakdown rows -->
      <div class="space-y-1.5">
        <div v-for="cat in categories" :key="cat.label"
          class="flex items-center gap-3 rounded-lg px-3 py-2"
          style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
          <span class="text-base w-6 text-center shrink-0">{{ cat.icon }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-white/70">{{ cat.label }}</p>
            <p class="text-[10px] text-white/30 truncate">{{ cat.desc }}</p>
          </div>
          <span class="text-xs font-bold tabular-nums text-red-400/80 shrink-0">-{{ breakdown[cat.key] }}</span>
        </div>
      </div>

      <!-- Tips -->
      <div class="rounded-xl p-3 space-y-1.5"
        style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);">
        <p class="text-[10px] font-semibold text-white/35">💡 Tips to reduce costs</p>
        <ul class="text-[10px] text-white/30 space-y-0.5 list-disc list-inside">
          <li>Fewer fish = lower water &amp; food costs</li>
          <li>Sharks cost 4× more water than neons</li>
          <li>Each tank upgrade adds ½ coin/cycle to electricity</li>
          <li>Decorations each add ½ coin/cycle</li>
          <li>Offline maintenance runs at 25% rate</li>
        </ul>
      </div>
    </section>
  </div>
</template>
