<script setup lang="ts">
import { useIntervalFn } from "@vueuse/core";
import { fishAgeRatio, fishLifespan, fishLifeStage, fishSizeMultiplier } from "~/utils/economy";

const emit = defineEmits<{ (e: "go-to-shop"): void }>();

const game = useGameStore();

// Live clock for listing countdown
const now = ref(Date.now());
useIntervalFn(() => { now.value = Date.now(); }, 1000);

function listingTimeLeft(sellsByMs: number): string {
  const secs = Math.max(0, Math.ceil((sellsByMs - now.value) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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
const unhappyFish = computed(() => game.fish.filter((f) => f.boredom > BOREDOM_HIGH_THRESHOLD).length);

const statusFilters = computed(() => [
  { id: "all",     label: `All · ${game.fish.length}`,        title: "All fish"            },
  { id: "healthy", label: `😊 ${healthyFish.value}`,          title: "Well-fed (happy)"    },
  { id: "hungry",  label: `🍽️ ${hungryFish.value}`,          title: "Hungry (needs food)" },
  { id: "bored",   label: `😟 ${unhappyFish.value}`,          title: "Bored"               },
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
    else v = (a.bornAt ?? a.id) - (b.bornAt ?? b.id);
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
  { id: "boredom", label: "Mood"    },
  { id: "type",    label: "Species" },
  { id: "id",      label: "Age"     },
];

// ── Life cycle helpers ─────────────────────────────────────────────────────────
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getFishBornAt(f: { bornAt?: number; type: string; genetics?: { healthMod?: number; mutation?: string } }): number {
  return f.bornAt ?? (Date.now() - Math.round(FISH_LIFESPAN_BASE_MS * LIFE_STAGE_JUVENILE_END));
}

function getFishAgeRatio(f: { bornAt?: number; type: string; genetics?: { healthMod?: number; mutation?: string } }): number {
  return fishAgeRatio(getFishBornAt(f), f.type, f.genetics);
}

function getFishStage(f: { bornAt?: number; type: string; genetics?: { healthMod?: number; mutation?: string } }) {
  return fishLifeStage(getFishAgeRatio(f));
}

function ageTimeLeft(f: { bornAt?: number; type: string; genetics?: { healthMod?: number; mutation?: string } }): string {
  const lifespan = fishLifespan(f.type, f.genetics);
  const msLeft = Math.max(0, lifespan - (now.value - getFishBornAt(f)));
  if (msLeft === 0) return "0h";
  const days = msLeft / MS_PER_DAY;
  if (days < 1) return `${Math.ceil(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

function stageColor(f: { bornAt?: number; type: string; genetics?: { healthMod?: number; mutation?: string } }): string {
  const stage = getFishStage(f);
  if (stage === "juvenile") return "text-cyan-400";
  if (stage === "adult")    return "text-emerald-400";
  return "text-amber-400";
}

function ageBarColor(ageRatio: number): string {
  if (ageRatio < LIFE_STAGE_JUVENILE_END) return "bg-cyan-400";
  if (ageRatio < LIFE_STAGE_ADULT_END)    return "bg-emerald-400";
  if (ageRatio < 0.85)                    return "bg-amber-400";
  return "bg-red-400";
}
</script>

<template>
  <div class="flex flex-col h-full">

    <!-- Filter bar -->
    <div class="sticky top-0 z-10 px-4 pt-3 pb-2 space-y-2"
      style="background: rgba(2,6,23,0.97); border-bottom: 1px solid rgba(255,255,255,0.06);">

      <!-- Status + sort row -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex gap-1.5 flex-wrap">
          <UButton
            v-for="f in statusFilters"
            :key="f.id"
            size="sm"
            :color="statusFilter === f.id ? 'primary' : 'neutral'"
            :variant="statusFilter === f.id ? 'soft' : 'ghost'"
            class="rounded-full"
            :title="f.title"
            @click="statusFilter = (f.id as typeof statusFilter.value)">
            {{ f.label }}
          </UButton>
        </div>
        <div class="ml-auto flex items-center gap-1.5 shrink-0">
          <USelect
            v-model="sortKey"
            :items="sortOptions.map(o => ({ label: o.label, value: o.id }))"
            size="sm" />
          <UButton
            :icon="sortDir === 'desc' ? 'i-mdi-arrow-down' : 'i-mdi-arrow-up'"
            variant="ghost"
            color="neutral"
            size="sm"
            :title="sortDir === 'desc' ? 'Descending' : 'Ascending'"
            @click="sortDir = sortDir === 'desc' ? 'asc' : 'desc'" />
        </div>
      </div>

      <!-- Species row (only when 2+ species owned) -->
      <div v-if="showSpeciesRow" class="flex gap-1.5 overflow-x-auto pb-0.5">
        <UButton
          size="sm"
          :color="selectedSpecies === 'all' ? 'primary' : 'neutral'"
          :variant="selectedSpecies === 'all' ? 'soft' : 'ghost'"
          class="shrink-0 rounded-full"
          @click="selectedSpecies = 'all'">
          All
        </UButton>
        <UButton
          v-for="(count, type) in fishCounts"
          :key="type"
          size="sm"
          :color="selectedSpecies === type ? 'primary' : 'neutral'"
          :variant="selectedSpecies === type ? 'soft' : 'ghost'"
          class="shrink-0 rounded-full"
          @click="selectedSpecies = selectedSpecies === type ? 'all' : (type as string)">
          <FishSvg :type="type as string" :width="18" :height="12" />
          <span>{{ fishName(type as string) }}</span>
          <span class="opacity-60">{{ count }}</span>
        </UButton>
      </div>
    </div>

    <!-- Fish grid -->
    <div class="flex-1 overflow-y-auto p-4">
      <div
        v-if="sorted.length"
        class="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">

        <div
          v-for="f in sorted"
          :key="f.id"
          class="relative rounded-xl p-3 flex flex-col gap-2"
          :class="game.isListed(f.id) ? 'fish-card--listed' : ''"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);">

          <!-- Delete button (top-right, hidden while listed) -->
          <UButton
            v-if="!game.isListed(f.id)"
            icon="i-mdi-delete"
            variant="ghost"
            color="error"
            size="xs"
            class="absolute top-2 right-2"
            aria-label="Remove fish"
            @click="game.removeFish(f.id)" />

          <!-- Listed badge (top-right when listed) -->
          <div v-else class="absolute top-2 right-2 listed-badge">🏷</div>

          <!-- Fish identity -->
          <div class="flex items-center gap-2 pr-5">
            <div class="w-9 h-7 flex items-center justify-center rounded-lg shrink-0"
              style="background: rgba(255,255,255,0.06);">
              <FishSvg :type="f.type" v-bind="fishPreviewSize(f.type)" :fish-id="f.id" :genetics="f.genetics" :generation="f.generation" class="drop-shadow-sm" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-white truncate leading-tight">
                {{ f.name || fishName(f.type) }}
                <span v-if="f.careStreak > 0" class="text-orange-400 text-xs"> 🔥{{ f.careStreak }}</span>
              </p>
              <p class="text-xs text-white/35 truncate">
                {{ fishName(f.type) }}
                <span v-if="f.personality" :title="PERSONALITY_PROFILES[f.personality as PersonalityType]?.label">
                  · {{ PERSONALITY_PROFILES[f.personality as PersonalityType]?.icon }}
                </span>
                <span :class="stageColor(f)" class="ml-0.5">· {{ LIFE_STAGE_INFO[getFishStage(f)].icon }}</span>
              </p>
            </div>
          </div>

          <!-- Stat bars -->
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5">
              <span class="text-xs w-3 text-center leading-none">❤️</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.health >= 70 ? 'bg-emerald-400' : f.health >= 40 ? 'bg-orange-400' : 'bg-red-500'"
                  :style="{ width: f.health + '%' }" />
              </div>
              <span class="text-xs text-white/30 tabular-nums w-5 text-right">{{ Math.round(f.health) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs w-3 text-center leading-none">🍽️</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.hunger >= HAPPY_THRESHOLD ? 'bg-green-400' : f.hunger >= CARE_THRESHOLD ? 'bg-yellow-400' : 'bg-red-400'"
                  :style="{ width: f.hunger + '%' }" />
              </div>
              <span class="text-xs text-white/30 tabular-nums w-5 text-right">{{ Math.round(f.hunger) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs w-3 text-center leading-none">😊</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-500"
                  :class="f.boredom < 30 ? 'bg-green-400' : f.boredom < BOREDOM_HIGH_THRESHOLD ? 'bg-yellow-400' : 'bg-red-400'"
                  :style="{ width: (100 - f.boredom) + '%' }" />
              </div>
              <span class="text-xs text-white/30 tabular-nums w-5 text-right">{{ Math.round(100 - f.boredom) }}</span>
            </div>
            <!-- Age bar -->
            <div class="flex items-center gap-1.5" title="Life remaining">
              <span class="text-xs w-3 text-center leading-none">{{ LIFE_STAGE_INFO[getFishStage(f)].icon }}</span>
              <div class="flex-1 h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.08);">
                <div class="h-full rounded-full transition-all duration-1000"
                  :class="ageBarColor(getFishAgeRatio(f))"
                  :style="{ width: (getFishAgeRatio(f) * 100) + '%' }" />
              </div>
              <span class="text-xs tabular-nums text-right"
                :class="getFishAgeRatio(f) >= LIFE_STAGE_ADULT_END ? 'text-amber-400/70' : 'text-white/30'"
                style="min-width: 3.5rem;">
                {{ ageTimeLeft(f) }} left
              </span>
            </div>
          </div>

          <!-- Listed state: countdown + cancel + sell now -->
          <template v-if="game.isListed(f.id)">
            <div class="listing-row">
              <div class="listing-info">
                <span class="listing-price">{{ game.getListingFor(f.id)?.price.toLocaleString() }} 🪙</span>
                <span class="listing-countdown">{{ listingTimeLeft(game.getListingFor(f.id)!.sellsByMs) }}</span>
              </div>
              <button class="listing-cancel" @click="game.cancelListing(f.id)">✕ Cancel</button>
            </div>
            <UButton
              color="warning"
              variant="soft"
              size="xs"
              class="w-full sell-now-btn"
              title="Skip the wait — sell instantly at 60% of listing price"
              @click="game.sellFishNow(f.id)">
              Sell now · {{ Math.round((game.getListingFor(f.id)?.price ?? game.fishMarketValue(f)) * 0.6).toLocaleString() }} 🪙
            </UButton>
          </template>

          <!-- Normal state: feed + list buttons -->
          <template v-else>
            <div class="flex gap-1.5">
              <UButton
                color="success"
                variant="soft"
                size="sm"
                label="Feed"
                class="flex-1"
                @click="game.feedFish(f.id, FEED_AMOUNT)" />
              <UButton
                color="neutral"
                variant="soft"
                size="sm"
                :title="`List on market for ${game.fishMarketValue(f)} 🪙 · sells in 20 min`"
                @click="game.listFishForSale(f.id)">
                <span class="text-[10px] text-white/55">List</span>
                <span class="list-price">{{ game.fishMarketValue(f).toLocaleString() }}🪙</span>
              </UButton>
            </div>
          </template>
        </div>

        <!-- Buy more fish card -->
        <button
          class="rounded-xl p-3 flex flex-col items-center justify-center gap-2 text-white/25 hover:text-cyan-400 transition-all focus:outline-none group"
          style="border: 2px dashed rgba(255,255,255,0.1); min-height: 120px;"
          @click="emit('go-to-shop')">
          <span class="text-2xl group-hover:scale-110 transition-transform">+</span>
          <span class="text-xs font-medium">Buy fish</span>
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

<style scoped>
.fish-card--listed {
  border-color: rgba(245,158,11,0.35) !important;
  background: rgba(245,158,11,0.05) !important;
}

.listed-badge {
  font-size: 14px;
  line-height: 1;
}

.list-price {
  font-size: 10px;
  font-weight: 700;
  color: rgba(251,191,36,0.75);
  font-variant-numeric: tabular-nums;
}

.sell-now-btn {
  font-size: 10px !important;
  opacity: 0.72;
  letter-spacing: 0.01em;
}
.sell-now-btn:hover { opacity: 1; }

.listing-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(245,158,11,0.08);
  border: 1px solid rgba(245,158,11,0.2);
}
.listing-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.listing-price {
  font-size: 11px;
  font-weight: 700;
  color: #fbbf24;
}
.listing-countdown {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, monospace;
  color: rgba(245,158,11,0.6);
}
.listing-cancel {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s;
  flex-shrink: 0;
}
.listing-cancel:hover { color: rgba(255,255,255,0.65); }
</style>
