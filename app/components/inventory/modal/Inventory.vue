<script setup lang="ts">
const emit = defineEmits<{ (e: "go-to-shop"): void }>();

const game = useGameStore();

const selectedSpecies = ref<"all" | string>("all");
const statusFilter = ref<"all" | "healthy" | "hungry" | "bored">("all");
const sortKey = ref<"hunger" | "health" | "boredom" | "type" | "id">("hunger");
const sortDir = ref<"asc" | "desc">("desc");

const fishCounts = computed(() =>
  game.fish.reduce((acc: Record<string, number>, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {})
);

const speciesKeys = computed(() => Object.keys(fishCounts.value));
const showSpeciesRow = computed(() => speciesKeys.value.length >= 2);

const healthyFish = computed(() => game.fish.filter((f) => f.hunger >= HAPPY_THRESHOLD).length);
const hungryFish  = computed(() => game.fish.filter((f) => f.hunger < CARE_THRESHOLD).length);
const boredFish   = computed(() => game.fish.filter((f) => f.boredom > BOREDOM_HIGH_THRESHOLD).length);

const statusFilters = computed(() => [
  { id: "all",     label: `All · ${game.fish.length}` },
  { id: "healthy", label: `❤️ ${healthyFish.value}`   },
  { id: "hungry",  label: `🍽️ ${hungryFish.value}`   },
  { id: "bored",   label: `😴 ${boredFish.value}`    },
]);

const filtered = computed(() =>
  game.fish.filter(
    (f) =>
      (selectedSpecies.value === "all" || f.type === selectedSpecies.value) &&
      (statusFilter.value === "all"
        ? true
        : statusFilter.value === "healthy"
        ? f.hunger >= HAPPY_THRESHOLD
        : statusFilter.value === "hungry"
        ? f.hunger < CARE_THRESHOLD
        : f.boredom > BOREDOM_HIGH_THRESHOLD)
  )
);

const sorted = computed(() =>
  [...filtered.value].sort((a, b) => {
    let v = 0;
    if (sortKey.value === "hunger") v = a.hunger - b.hunger;
    else if (sortKey.value === "health") v = a.health - b.health;
    else if (sortKey.value === "boredom") v = a.boredom - b.boredom;
    else if (sortKey.value === "type") v = a.type.localeCompare(b.type);
    else v = a.id - b.id;
    return sortDir.value === "asc" ? v : -v;
  })
);

const shopNameMap = Object.fromEntries(FISH_SHOP_ITEMS.map((item) => [item.type, item.name]));
function fishName(type: string): string {
  return shopNameMap[type] ?? type;
}

const sortOptions = [
  { id: "hunger",  label: "Hunger"  },
  { id: "health",  label: "Health"  },
  { id: "boredom", label: "Boredom" },
  { id: "type",    label: "Species" },
  { id: "id",      label: "Age"     },
];
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Filter bar -->
    <div class="sticky top-0 z-10 px-4 pt-3 pb-2 space-y-2"
      style="background: rgba(2,6,23,0.97); border-bottom: 1px solid rgba(255,255,255,0.06);">

      <!-- Status + sort row -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="f in statusFilters"
            :key="f.id"
            class="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all focus:outline-none"
            :class="statusFilter === f.id
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'bg-white/6 text-white/40 hover:text-white/60 border border-transparent'"
            @click="statusFilter = (f.id as typeof statusFilter.value)">
            {{ f.label }}
          </button>
        </div>
        <div class="ml-auto flex items-center gap-1.5 shrink-0">
          <select
            v-model="sortKey"
            class="bg-white/6 border border-white/10 text-white/60 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500/40">
            <option v-for="o in sortOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
          </select>
          <button
            class="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all bg-white/6 border border-white/10 text-white/50 hover:text-white/80 focus:outline-none"
            :title="sortDir === 'desc' ? 'Descending' : 'Ascending'"
            @click="sortDir = sortDir === 'desc' ? 'asc' : 'desc'">
            {{ sortDir === 'desc' ? '↓' : '↑' }}
          </button>
        </div>
      </div>

      <!-- Species row (only when 2+ species owned) -->
      <div v-if="showSpeciesRow" class="flex gap-1.5 overflow-x-auto pb-0.5">
        <button
          class="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all focus:outline-none"
          :class="selectedSpecies === 'all'
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            : 'bg-white/6 text-white/40 hover:text-white/60 border border-transparent'"
          @click="selectedSpecies = 'all'">
          All
        </button>
        <button
          v-for="(count, type) in fishCounts"
          :key="type"
          class="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all focus:outline-none"
          :class="selectedSpecies === type
            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            : 'bg-white/6 text-white/40 hover:text-white/60 border border-transparent'"
          @click="selectedSpecies = selectedSpecies === type ? 'all' : (type as string)">
          <FishSvg :type="type as string" :width="18" :height="12" />
          <span>{{ fishName(type as string) }}</span>
          <span class="opacity-60">{{ count }}</span>
        </button>
      </div>
    </div>

    <!-- Fish grid -->
    <div class="flex-1 overflow-y-auto p-4">
      <div
        v-if="sorted.length"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">

        <div
          v-for="f in sorted"
          :key="f.id"
          class="relative rounded-xl p-3 flex flex-col gap-2"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">

          <!-- Delete button (top-right) -->
          <button
            class="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all focus:outline-none"
            aria-label="Remove fish"
            @click="game.removeFish(f.id)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>

          <!-- Fish identity -->
          <div class="flex items-center gap-2 pr-5">
            <div class="w-9 h-7 flex items-center justify-center rounded-lg shrink-0"
              style="background: rgba(255,255,255,0.06);">
              <FishSvg :type="f.type" v-bind="fishPreviewSize(f.type)" class="drop-shadow-sm" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-white truncate leading-tight">
                {{ f.name || fishName(f.type) }}
                <span v-if="f.careStreak > 0" class="text-orange-400 text-[10px]"> 🔥{{ f.careStreak }}</span>
              </p>
              <p class="text-[10px] text-white/35 truncate">{{ fishName(f.type) }}</p>
            </div>
          </div>

          <!-- Stat bars -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] w-3 text-center leading-none">❤️</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.health >= 70 ? 'bg-emerald-400' : f.health >= 40 ? 'bg-orange-400' : 'bg-red-500'"
                  :style="{ width: f.health + '%' }" />
              </div>
              <span class="text-[10px] text-white/30 tabular-nums w-5 text-right">{{ Math.round(f.health) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] w-3 text-center leading-none">🍽️</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.hunger >= HAPPY_THRESHOLD ? 'bg-green-400' : f.hunger >= CARE_THRESHOLD ? 'bg-yellow-400' : 'bg-red-400'"
                  :style="{ width: f.hunger + '%' }" />
              </div>
              <span class="text-[10px] text-white/30 tabular-nums w-5 text-right">{{ Math.round(f.hunger) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] w-3 text-center leading-none">😴</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.boredom < 30 ? 'bg-green-400' : f.boredom < BOREDOM_HIGH_THRESHOLD ? 'bg-yellow-400' : 'bg-red-400'"
                  :style="{ width: f.boredom + '%' }" />
              </div>
              <span class="text-[10px] text-white/30 tabular-nums w-5 text-right">{{ Math.round(f.boredom) }}</span>
            </div>
          </div>

          <!-- Feed button -->
          <button
            class="w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all focus:outline-none"
            @click="game.feedFish(f.id, FEED_AMOUNT)">
            Feed
          </button>
        </div>

        <!-- Buy more fish card -->
        <button
          class="rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-white/25 hover:text-cyan-400 transition-all focus:outline-none group"
          style="border: 2px dashed rgba(255,255,255,0.1); min-height: 120px;"
          @click="emit('go-to-shop')">
          <span class="text-2xl group-hover:scale-110 transition-transform">+</span>
          <span class="text-[11px] font-medium">Buy fish</span>
        </button>
      </div>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center h-40 gap-2 text-white/30">
        <span class="text-3xl">🐟</span>
        <p class="text-sm">No fish match the filters.</p>
      </div>
    </div>
  </div>
</template>
