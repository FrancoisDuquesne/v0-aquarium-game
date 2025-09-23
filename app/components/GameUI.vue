<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });
const showModal = ref(false);
const tabs = [
  {
    value: "inventory",
    label: "📦 Inventory",
    slot: "inventory" as const,
    onselect: () => openInventory("inventory"),
  },
  {
    value: "store",
    label: "🛒 Store",
    slot: "store" as const,
    onselect: () => openInventory("store"),
  },
  {
    value: "aquarium",
    label: "🌊 Aquarium",
    slot: "aquarium" as const,
    onselect: () => openInventory("aquarium"),
  },
];
const initialTab = ref<"inventory" | "store" | "aquarium">("inventory");
const initialInventoryView = ref<"fish" | "tools">("fish");
type ToolType = "flake" | "spoon";

const toolLabels: Record<ToolType, string> = {
  flake: "🍽️ Flake",
  spoon: "🥄 Spoon",
};

const avg = computed(() => game.averageHunger);
const availableTools = computed<ToolType[]>(() => {
  const tools: ToolType[] = ["flake"];
  if (game.tools.spoonOwned) tools.push("spoon");
  return tools;
});

const activeToolLabel = computed(
  () => toolLabels[game.selectedTool as ToolType] ?? game.selectedTool
);

function cycleTool() {
  const tools = availableTools.value;
  if (!tools.length) return;
  const currentIndex = tools.indexOf(game.selectedTool as ToolType);
  const next = tools[(currentIndex + 1) % tools.length];
  if (next !== game.selectedTool) {
    game.selectTool(next);
  }
}

const pendingDrops = computed(() => game.coinDrops.length);
const collectorStats = computed(
  () =>
    COIN_COLLECTOR_LEVELS.find(
      (entry) => entry.level === game.coinCollector.level
    ) ?? COIN_COLLECTOR_LEVELS[0]
);
const nextCollector = computed(() =>
  nextCollectorLevel(game.coinCollector.level)
);
const collectorCooldownMs = computed(() => {
  const cooldown = collectorStats.value.cooldown;
  if (!Number.isFinite(cooldown)) return Infinity;
  const elapsed = now.value.getTime() - game.coinCollector.lastSweep;
  return Math.max(0, cooldown - elapsed);
});
const collectorReady = computed(() => collectorCooldownMs.value <= 0);
const collectorHasUpgrade = computed(() => game.coinCollector.level > 0);
const collectorButtonLabel = computed(() =>
  collectorReady.value
    ? "🧺 Sweep drops"
    : `🧺 ${Math.ceil(collectorCooldownMs.value / 1000)}s`
);
const canSweep = computed(() => collectorReady.value && pendingDrops.value > 0);

const boostBadges = computed(
  () =>
    game.activeBoosts
      .map((boost) => {
        const remaining = Math.max(
          0,
          Math.ceil((boost.expiresAt - now.value.getTime()) / 1000)
        );
        if (remaining <= 0) return null;
        return {
          id: boost.id,
          label: `${boost.label} · ${remaining}s`,
        };
      })
      .filter(Boolean) as { id: string; label: string }[]
);

function sweepCollector() {
  game.manualCollectorSweep();
}

function openToolModal() {
  initialTab.value = "inventory";
  initialInventoryView.value = "tools";
  showModal.value = true;
}

function openInventory(tab: "inventory" | "store" | "aquarium") {
  initialTab.value = tab;
  initialInventoryView.value = "fish";
  showModal.value = true;
}
</script>

<template>
  <div>
    <div class="absolute top-0 left-0 p-2 flex z-20 flex-col gap-2">
      <div
        class="flex items-center gap-2 sm:gap-4 bg-default/80 rounded-2xl shadow-xl w-fit px-2 py-1 flex-wrap">
        <span class="text-sm font-semibold">💰 {{ game.coins }}</span>
        <span class="text-sm font-semibold">🐟 {{ game.fish.length }}</span>
        <span class="text-sm font-semibold">❤️ {{ avg }}</span>
        <span class="text-sm font-semibold text-success">
          x{{ game.coinMultiplier.toFixed(2) }}%
        </span>
        <div v-if="boostBadges.length" class="flex flex-wrap gap-2">
          <UBadge
            v-for="badge in boostBadges"
            :key="badge.id"
            size="sm"
            :label="`✨ ${badge.label}`"
            class="shadow" />
        </div>
      </div>
      <div class="flex gap-2">
        <UButtonGroup size="xs" class="w-fit shadow-xl rounded-xl">
          <UButton
            color="neutral"
            variant="soft"
            :label="activeToolLabel"
            @click="cycleTool" />
          <UButton
            color="neutral"
            variant="soft"
            icon="i-mdi-chevron-down"
            aria-label="Open tool chooser"
            @click="openToolModal" />
        </UButtonGroup>
        <UButton
          v-if="game.autoFeeder.owned"
          class="w-fit shadow-xl"
          size="xs"
          :variant="game.autoFeeder.active ? 'solid' : 'outline'"
          :color="game.autoFeeder.active ? 'success' : 'neutral'"
          :label="game.autoFeeder.active ? '🤖 On' : '🤖 Off'"
          @click="game.toggleAutoFeeder()" />
        <div
          v-if="collectorHasUpgrade"
          class="flex items-center gap-2 flex-wrap">
          <UButton
            class="w-fit shadow-xl"
            size="xs"
            color="warning"
            :disabled="!canSweep"
            :label="collectorButtonLabel"
            @click="sweepCollector" />
          <!-- <UBadge
            color="warning"
            variant="subtle"
            size="xs"
            :label="`Lvl ${game.coinCollector.level}: ${collectorStats.label}`"
            class="shadow-xl" />
          <UBadge
            v-if="nextCollector"
            color="neutral"
            variant="soft"
            size="xs"
            :label="`Next: ${nextCollector.label} · ${nextCollector.cost} coins`"
            class="shadow" /> -->
        </div>
      </div>
    </div>

    <div
      v-if="game.showHowTo"
      class="absolute bottom-16 left-2 right-2 sm:bottom-20 sm:left-3 sm:right-auto z-20">
      <div
        class="bg-gray-900/80 rounded-lg backdrop-blur border border-gray-700 p-3 sm:p-2 animate-pulse">
        <p class="text-xs sm:text-sm text-gray-300 text-center sm:text-left">
          <span class="hidden sm:inline"
            >👆 Click to drop food • Use the tool selector to switch feeding
            modes</span
          >
          <span class="sm:hidden"
            >👆 Tap to drop food • Use the tool selector</span
          >
        </p>
      </div>
    </div>

    <div class="fixed bottom-4 left-4 right-4 z-20">
      <div
        class="rounded-xl p-1 flex gap-1 bg-muted justify-center w-fit mx-auto">
        <UButton
          v-for="tab in tabs"
          :label="tab.label"
          @click="tab.onselect"
          color="neutral"
          variant="link" />
      </div>
    </div>

    <InventoryModal
      v-model="showModal"
      :initial-tab="initialTab"
      :initial-inventory-view="initialInventoryView" />
  </div>
</template>
