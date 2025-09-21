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
const healthFilter = ref<"all" | "healthy" | "hungry">("all");
const sortKey = ref<"hunger" | "type" | "id">("hunger");
const sortDir = ref<"asc" | "desc">("desc");

const fishCounts = computed(() =>
  game.fish.reduce((acc: Record<string, number>, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
  }, {})
);
const averageHunger = computed(() => game.averageHunger);
const healthyFish = computed(
  () => game.fish.filter((f) => f.hunger > 70).length
);
const hungryFish = computed(
  () => game.fish.filter((f) => f.hunger < 40).length
);

const filtered = computed(() =>
  game.fish.filter(
    (f) =>
      (selectedSpecies.value === "all" || f.type === selectedSpecies.value) &&
      (healthFilter.value === "all"
        ? true
        : healthFilter.value === "healthy"
        ? f.hunger > 70
        : f.hunger < 40)
  )
);

const sorted = computed(() =>
  [...filtered.value].sort((a, b) => {
    let v = 0;
    if (sortKey.value === "hunger") v = a.hunger - b.hunger;
    else if (sortKey.value === "type") v = a.type.localeCompare(b.type);
    else v = a.id - b.id;
    return sortDir.value === "asc" ? v : -v;
  })
);

const speciesNames: Record<string, string> = {
  goldfish: "Goldfish",
  angelfish: "Angelfish",
  neon: "Neon Tetra",
  tropical: "Tropical Fish",
  shark: "Baby Shark",
  betta: "Betta",
  "cherry-barb": "Cherry Barb",
  guppy: "Guppy",
  "pearl-gourami": "Pearl Gourami",
  "tiger-barb": "Tiger Barb",
  "jewel-cichlid": "Jewel Cichlid",
};

function getPreview(type: string) {
  const size =
    (FISH_CONFIG.FISH_SIZES as any)[type] || FISH_CONFIG.FISH_SIZES.goldfish;
  return {
    w: Math.min(size.width * 0.8, 48),
    h: Math.min(size.height * 0.8, 32),
  };
}

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
                        {{ speciesNames[type as string] ?? type }}
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
                    { id: 'type', label: 'Species' },
                    { id: 'id', label: 'ID' },
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
                <div
                  class="w-10 h-8 flex items-center justify-center bg-muted border border-muted rounded">
                  <FishSvg
                    :type="f.type"
                    v-bind="getPreview(f.type)"
                    class="drop-shadow-sm" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs truncate">
                    {{ speciesNames[f.type] ?? f.type }}
                  </div>
                  <div class="text-[10px] text-muted">ID: {{ f.id }}</div>
                </div>
                <div
                  class="ml-auto w-2 h-2 rounded-full"
                  :class="
                    f.hunger > 70
                      ? 'bg-green-500'
                      : f.hunger > 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  " />
              </div>
              <div
                class="text-[11px] text-muted flex items-center justify-between mt-2">
                <span>Hunger: {{ f.hunger }}%</span>
                <span class="text-gray-500"
                  >Speed: {{ f.speed.toFixed(1) }}</span
                >
              </div>
              <div class="flex gap-2 mt-2">
                <UButton
                  size="xs"
                  color="success"
                  variant="soft"
                  block
                  label="Feed"
                  @click="game.feedFish(f.id, 20)" />
                <UButton
                  size="xs"
                  color="error"
                  variant="soft"
                  block
                  icon="i-mdi-trash-can"
                  @click="game.removeFish(f.id)" />
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
                      200 coins
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
                  :disabled="game.coins < 200"
                  @click="game.buySpoon(200)" />
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
                      500 coins
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
                  :disabled="game.coins < 500"
                  @click="game.buyAutoFeeder(500)" />
              </div>
              <p class="text-[11px] text-muted mt-2">
                Feeds fish automatically every 30 seconds.
              </p>
            </UCard>

            <UButton
              color="neutral"
              variant="outline"
              block
              @click="() => goToStore()"
              icon="i-mdi-plus"
              label="Browse the store"
              class="border-dashed border-2 min-h-20 ring-0 rounded-xl border-default hover:border-info hover:text-info" />
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
