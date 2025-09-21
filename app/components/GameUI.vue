<script setup lang="ts">
const game = useGameStore();
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
    <div class="absolute top-2 left-2 flex z-20 flex-col gap-2">
      <div class="flex flex-wrap gap-2">
        <UBadge
          color="neutral"
          variant="subtle"
          size="lg"
          :label="`💰 ${game.coins}`"
          class="shadow-xl" />
        <UBadge
          color="neutral"
          variant="subtle"
          size="lg"
          :label="`🐟 ${game.fish.length}`"
          class="shadow-xl" />
        <UBadge
          color="neutral"
          variant="subtle"
          size="lg"
          :label="`❤️ ${avg}%`"
          class="shadow-xl" />
      </div>
      <div class="flex flex-col gap-2">
        <UButtonGroup size="xs" class="w-fit shadow-xl rounded-xl">
          <UButton
            color="warning"
            :label="activeToolLabel"
            @click="cycleTool" />
          <UButton
            color="warning"
            variant="soft"
            icon="i-mdi-chevron-down"
            aria-label="Open tool chooser"
            @click="openToolModal" />
        </UButtonGroup>
        <UButton
          v-if="game.autoFeeder.owned"
          class="w-fit shadow-xl"
          :variant="game.autoFeeder.active ? 'solid' : 'outline'"
          :color="game.autoFeeder.active ? 'success' : 'neutral'"
          :label="game.autoFeeder.active ? '🤖 On' : '🤖 Off'"
          @click="game.toggleAutoFeeder()" />
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
