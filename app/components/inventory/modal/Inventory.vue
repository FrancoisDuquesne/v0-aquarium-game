<script setup lang="ts">
const props = defineProps<{
  view: "fish" | "tools";
}>();

const emit = defineEmits<{
  (e: "update:view", value: "fish" | "tools"): void;
  (e: "go-to-store"): void;
}>();

const game = useGameStore();

const inventoryView = computed({
  get: () => props.view,
  set: (value) => emit("update:view", value),
});

const inventoryTabs = [
  { value: "fish", label: "🐟 Fish", slot: "fish" as const },
  {
    value: "tools",
    label: "⛏️ Tools",
    slot: "tools" as const,
  },
];

const selectedSpecies = ref<"all" | string>("all");
const healthFilter = ref<"all" | "healthy" | "hungry" | "bored">("all");
const sortKey = ref<"hunger" | "health" | "boredom" | "type" | "id">("hunger");
const sortDir = ref<"asc" | "desc">("desc");

const fishCounts = computed(() =>
  game.fish.reduce((acc: Record<string, number>, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {})
);
const averageHunger = computed(() => game.averageHunger);
const healthyFish = computed(
  () => game.fish.filter((f) => f.hunger >= HAPPY_THRESHOLD).length
);
const hungryFish = computed(
  () => game.fish.filter((f) => f.hunger < CARE_THRESHOLD).length
);
const boredFish = computed(
  () => game.fish.filter((f) => f.boredom > BOREDOM_HIGH_THRESHOLD).length
);

const filtered = computed(() =>
  game.fish.filter(
    (f) =>
      (selectedSpecies.value === "all" || f.type === selectedSpecies.value) &&
      (healthFilter.value === "all"
        ? true
        : healthFilter.value === "healthy"
        ? f.hunger >= HAPPY_THRESHOLD
        : healthFilter.value === "hungry"
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

const shopNameMap = Object.fromEntries(
  FISH_SHOP_ITEMS.map((item) => [item.type, item.name])
);
function fishName(type: string): string {
  return shopNameMap[type] ?? type;
}

const fishIndexMap = computed(() => {
  const byAge = [...game.fish].sort((a, b) => a.id - b.id);
  return new Map(byAge.map((f, i) => [f.id, i + 1]));
});

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

const goToStore = () => emit("go-to-store");
</script>

<template>
  <div class="flex flex-col h-full p-3">
    <UTabs
      v-model="inventoryView"
      :items="inventoryTabs"
      variant="link"
      orientation="vertical"
      class="w-full"
      :ui="{
        list: 'bg-default rounded-lg',
        root: 'items-start h-full gap-4',
        content: 'flex flex-col h-full flex-1 overflow-hidden',
      }">
      <template #fish>
        <div class="flex-1 overflow-y-auto space-y-4 pr-1">
          <div class="flex gap-4 items-center justify-between">
            <div class="flex gap-4 grow">
              <div>
                <div class="text-xs text-muted mb-2">Status</div>
                <div class="flex gap-2 items-center overflow-x-auto">
                  <UButton
                    variant="outline"
                    size="sm"
                    :color="healthFilter === 'all' ? 'info' : 'neutral'"
                    :label="`Total: ${game.fish.length}`"
                    @click="healthFilter = 'all'" />
                  <UButton
                    variant="outline"
                    size="sm"
                    :color="healthFilter === 'healthy' ? 'info' : 'neutral'"
                    :label="`❤️ Healthy: ${healthyFish}`"
                    @click="healthFilter = 'healthy'" />
                  <UButton
                    variant="outline"
                    size="sm"
                    :color="healthFilter === 'hungry' ? 'info' : 'neutral'"
                    :label="`🍽️ Hungry: ${hungryFish}`"
                    @click="healthFilter = 'hungry'" />
                  <UButton
                    variant="outline"
                    size="sm"
                    :color="healthFilter === 'bored' ? 'info' : 'neutral'"
                    :label="`😴 Bored: ${boredFish}`"
                    @click="healthFilter = 'bored'" />
                </div>
              </div>

              <div>
                <div class="text-xs text-muted mb-2">Species</div>
                <div class="flex gap-2 items-center overflow-x-auto">
                  <UButton
                    variant="outline"
                    size="sm"
                    :color="selectedSpecies === 'all' ? 'info' : 'neutral'"
                    label="All"
                    @click="selectedSpecies = 'all'" />
                  <UButton
                    v-for="(count, type) in fishCounts"
                    :key="type"
                    variant="outline"
                    size="sm"
                    :color="selectedSpecies === type ? 'info' : 'neutral'"
                    @click="
                      selectedSpecies =
                        selectedSpecies === type ? 'all' : (type as string)
                    ">
                    <div class="flex items-center gap-2">
                      <div
                        class="flex items-center justify-center bg-muted border border-muted rounded">
                        <FishSvg
                          :type="type as string"
                          :width="24"
                          :height="16" />
                      </div>
                      <div class="text-left text-xs">
                        {{ fishName(type as string) }}
                      </div>
                      <div class="text-[10px] text-muted">{{ count }} fish</div>
                    </div>
                  </UButton>
                </div>
              </div>
            </div>
            <div>
              <div class="text-xs text-muted mb-2">Sort by</div>
              <div class="flex gap-2 items-center overflow-x-auto">
                <USelect
                  v-model="sortKey"
                  size="sm"
                  :items="[
                    { id: 'hunger', label: 'Hunger' },
                    { id: 'health', label: 'Health' },
                    { id: 'boredom', label: 'Boredom' },
                    { id: 'type', label: 'Species' },
                    { id: 'id', label: 'Age' },
                  ]"
                  value-key="id" />
                <USelect
                  v-model="sortDir"
                  size="sm"
                  :items="[
                    { id: 'desc', label: 'Desc' },
                    { id: 'asc', label: 'Asc' },
                  ]"
                  value-key="id" />
              </div>
            </div>
          </div>

          <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            <UCard v-for="f in sorted" :key="f.id" class="p-2">
              <div class="flex items-center gap-2">
                <div class="w-10 h-8 flex items-center justify-center bg-muted border border-muted rounded shrink-0">
                  <FishSvg :type="f.type" v-bind="fishPreviewSize(f.type)" class="drop-shadow-sm" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-xs truncate font-medium">{{ fishName(f.type) }}</div>
                  <div class="text-[10px] text-muted">Fish #{{ fishIndexMap.get(f.id) }}</div>
                </div>
              </div>

              <div class="mt-2 space-y-1.5">
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] w-3">❤️</span>
                  <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="f.health >= 70 ? 'bg-emerald-400' : f.health >= 40 ? 'bg-orange-400' : 'bg-red-500'"
                      :style="{ width: f.health + '%' }" />
                  </div>
                  <span class="text-[10px] text-muted tabular-nums w-6 text-right">{{ Math.round(f.health) }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] w-3">🍽️</span>
                  <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="f.hunger >= HAPPY_THRESHOLD ? 'bg-green-400' : f.hunger >= CARE_THRESHOLD ? 'bg-yellow-400' : 'bg-red-400'"
                      :style="{ width: f.hunger + '%' }" />
                  </div>
                  <span class="text-[10px] text-muted tabular-nums w-6 text-right">{{ Math.round(f.hunger) }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] w-3">😴</span>
                  <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-500"
                      :class="f.boredom < 30 ? 'bg-green-400' : f.boredom < BOREDOM_HIGH_THRESHOLD ? 'bg-yellow-400' : 'bg-red-400'"
                      :style="{ width: f.boredom + '%' }" />
                  </div>
                  <span class="text-[10px] text-muted tabular-nums w-6 text-right">{{ Math.round(f.boredom) }}</span>
                </div>
              </div>

              <div class="flex gap-2 mt-2">
                <UButton size="xs" color="success" variant="soft" block label="Feed" @click="game.feedFish(f.id, FEED_AMOUNT)" />
                <UButton size="xs" color="error" variant="soft" block icon="i-mdi-trash-can" @click="game.removeFish(f.id)" />
              </div>
            </UCard>

            <UButton
              color="neutral"
              variant="outline"
              block
              @click="() => goToStore()"
              icon="i-mdi-plus"
              label="Buy more fish"
              class="border-dashed border-2 ring-0 rounded-xl border-default hover:border-info hover:text-info" />
          </div>

          <div
            v-if="!sorted.length"
            class="text-center text-muted text-sm py-6">
            No fish match the current filters.
          </div>
        </div>
      </template>
      <template #tools>
        <div class="flex-1 overflow-y-auto space-y-4 pr-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <UCard>
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    class="w-10 h-8 flex items-center justify-center bg-muted border border-muted rounded text-2xl">
                    🍽️
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs truncate">Flake Feeder</div>
                    <div class="text-[10px] text-muted font-medium">
                      Standard tool
                    </div>
                  </div>
                </div>
                <UButton
                  size="xs"
                  :color="game.selectedTool === 'flake' ? 'info' : 'neutral'"
                  :label="game.selectedTool === 'flake' ? 'Selected' : 'Select'"
                  @click="game.selectTool('flake')" />
              </div>
              <p class="text-[11px] text-muted mt-2">
                Sprinkle food at the tap location.
              </p>
            </UCard>

            <UCard>
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    class="w-10 h-8 flex items-center justify-center bg-muted border border-muted rounded text-2xl">
                    🥄
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs truncate">Feeding Spoon</div>
                    <div class="text-[10px] text-yellow-400 font-semibold">
                      {{ SPOON_COST }} coins
                    </div>
                  </div>
                </div>
                <UButton
                  v-if="game.tools.spoonOwned"
                  size="xs"
                  :color="game.selectedTool === 'spoon' ? 'info' : 'neutral'"
                  :label="game.selectedTool === 'spoon' ? 'Selected' : 'Select'"
                  @click="game.selectTool('spoon')" />
                <UButton
                  v-else
                  size="xs"
                  color="info"
                  label="Buy"
                  :disabled="game.coins < SPOON_COST"
                  @click="game.buySpoon(SPOON_COST)" />
              </div>
              <p class="text-[11px] text-muted mt-2">
                Drop a handful of flakes with one click.
              </p>
            </UCard>

            <UCard>
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    class="w-10 h-8 flex items-center justify-center bg-muted border border-muted rounded text-2xl">
                    🤖
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs truncate">Auto Feeder</div>
                    <div class="text-[10px] text-yellow-400 font-semibold">
                      {{ AUTO_FEEDER_COST }} coins
                    </div>
                  </div>
                </div>
                <UButton
                  v-if="game.autoFeeder.owned"
                  size="xs"
                  :color="game.autoFeeder.active ? 'error' : 'success'"
                  :label="game.autoFeeder.active ? 'Turn Off' : 'Turn On'"
                  @click="game.toggleAutoFeeder()" />
                <UButton
                  v-else
                  size="xs"
                  color="info"
                  label="Buy"
                  :disabled="game.coins < AUTO_FEEDER_COST"
                  @click="game.buyAutoFeeder(AUTO_FEEDER_COST)" />
              </div>
              <p class="text-[11px] text-muted mt-2">
                Feeds fish automatically every 30 seconds.
              </p>
            </UCard>

            <UCard>
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    class="w-10 h-8 flex items-center justify-center bg-muted border border-muted rounded text-2xl">
                    🧺
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-xs truncate">Coin Collector</div>
                    <div class="text-[10px] text-muted">{{ collectorStats.label }}</div>
                  </div>
                </div>
                <UButton
                  v-if="nextCollector"
                  size="xs"
                  color="info"
                  :label="`Upgrade · ${nextCollector.cost}`"
                  :disabled="game.coins < nextCollector.cost"
                  @click="game.buyCoinCollectorUpgrade()" />
                <UBadge v-else color="success" variant="soft" label="Maxed" class="self-start" />
              </div>
              <p class="text-[11px] text-muted mt-2">{{ collectorDescription }}</p>
            </UCard>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
