<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });
const showBgPicker = ref(false);

function toLabel(path: string) {
  const base = (path.split("/").pop() ?? "").replace(/\.[^.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const backgrounds = computed(() =>
  AVAILABLE_BACKGROUNDS.map((src) => ({ src, label: toLabel(src) })).sort((a, b) =>
    a.label.localeCompare(b.label)
  )
);

const currentBgLabel = computed(
  () => backgrounds.value.find((b) => b.src === game.background)?.label ?? "—"
);

const activeDecor = computed(() =>
  game.decorations.map((id) => DECORATION_PRESETS[id]).filter(Boolean)
);

// Maintenance
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
  { icon: "⚡", label: "Electricity", desc: "Base power + tank upgrades", key: "power" as const },
  { icon: "💧", label: "Water",       desc: "Per-fish filtration (sharks are thirsty)", key: "water" as const },
  { icon: "🍤", label: "Food",        desc: "Base supply + per fish", key: "food" as const },
  { icon: "🪸", label: "Décor",       desc: "Decoration upkeep", key: "decor" as const },
];
</script>

<template>
  <div class="p-4 h-full overflow-y-auto flex flex-col gap-5">

    <!-- Debt / low-funds banners -->
    <div v-if="debtWarning"
      class="rounded-xl px-4 py-3 bg-red-950/60 border border-red-700 text-red-300 text-sm flex items-center gap-2">
      <span class="text-lg">💀</span>
      <div>
        <p class="font-semibold">In debt! {{ abbreviateCoins(game.coins) }} coins</p>
        <p class="text-xs opacity-75">Tank running on emergency reserves. Earn coins to recover.</p>
      </div>
    </div>
    <div v-else-if="fundWarning"
      class="rounded-xl px-4 py-3 bg-yellow-950/60 border border-yellow-700 text-yellow-300 text-sm flex items-center gap-2">
      <span class="text-lg">⚠️</span>
      <div>
        <p class="font-semibold">Funds running low</p>
        <p class="text-xs opacity-75">Less than {{ MAINTENANCE_WARNING_THRESHOLD }} coins — feed your fish!</p>
      </div>
    </div>

    <!-- Tank configuration -->
    <section class="flex flex-col gap-3">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tank Configuration</h3>

      <!-- Background row -->
      <div class="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
        <img
          :src="game.background"
          alt="Current background"
          class="w-14 h-9 object-cover rounded shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold">Background</p>
          <p class="text-xs text-muted-foreground truncate">{{ currentBgLabel }}</p>
        </div>
        <UButton size="xs" color="neutral" variant="soft" label="Change" @click="showBgPicker = true" />
      </div>

      <!-- Active decorations -->
      <div class="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2">
        <span class="text-xl w-7 text-center shrink-0">🪸</span>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold">Decorations</p>
          <p class="text-xs text-muted-foreground">
            {{ activeDecor.length ? activeDecor.map(d => d.label).join(', ') : 'None — buy some in the Store' }}
          </p>
        </div>
        <UBadge :label="String(activeDecor.length)" color="neutral" variant="soft" />
      </div>
    </section>

    <!-- Operating costs -->
    <section class="flex flex-col gap-3">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operating Costs</h3>

      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-xl bg-muted/50 p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">Per cycle (60s)</p>
          <p class="text-base font-bold text-red-400">-{{ breakdown.total }}</p>
        </div>
        <div class="rounded-xl bg-muted/50 p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">Income / min</p>
          <p class="text-base font-bold text-green-400">+{{ abbreviateCoins(coinsPerMinute) }}</p>
        </div>
        <div class="rounded-xl bg-muted/50 p-3 text-center">
          <p class="text-xs text-muted-foreground mb-1">Net / min</p>
          <p class="text-base font-bold" :class="netPerMinute >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ netPerMinute >= 0 ? "+" : "" }}{{ abbreviateCoins(netPerMinute) }}
          </p>
        </div>
      </div>

      <p class="text-xs text-muted-foreground text-center">
        Next charge in <span class="font-semibold text-foreground">{{ nextChargeIn }}s</span>
      </p>

      <div class="flex flex-col gap-1.5">
        <div v-for="cat in categories" :key="cat.label"
          class="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
          <span class="text-xl w-7 text-center shrink-0">{{ cat.icon }}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold">{{ cat.label }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ cat.desc }}</p>
          </div>
          <span class="text-sm font-bold tabular-nums text-red-400 shrink-0">-{{ breakdown[cat.key] }}</span>
        </div>
      </div>

      <div class="rounded-xl bg-muted/30 border border-border p-3">
        <p class="text-xs font-semibold text-muted-foreground mb-1">💡 Tips to reduce costs</p>
        <ul class="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li>Fewer fish = lower water &amp; food costs</li>
          <li>Sharks cost 4× more water than neons</li>
          <li>Each tank upgrade adds ½ coin/cycle to electricity</li>
          <li>Decorations each add ½ coin/cycle</li>
          <li>Offline maintenance runs at 25% rate</li>
        </ul>
      </div>
    </section>

  </div>

  <!-- Background picker modal -->
  <UModal v-model:open="showBgPicker" :overlay="false"
    :ui="{ content: 'w-[90vw] max-w-3xl bg-default/90' }">
    <template #content>
      <div class="p-4 flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">Choose Background</h3>
          <UButton color="neutral" variant="ghost" icon="i-mdi-close" @click="showBgPicker = false" />
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div
            v-for="bg in backgrounds"
            :key="bg.src"
            class="relative cursor-pointer rounded-xl overflow-hidden border-2 transition"
            :class="game.background === bg.src ? 'border-info' : 'border-transparent hover:border-white/30'"
            @click="game.setBackground(bg.src); showBgPicker = false">
            <img :src="bg.src" :alt="bg.label" class="w-full h-28 object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <p class="absolute bottom-1.5 left-2 right-2 text-xs font-semibold text-white truncate">{{ bg.label }}</p>
            <div v-if="game.background === bg.src"
              class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-info flex items-center justify-center">
              <span class="text-[8px] text-white font-bold">✓</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
