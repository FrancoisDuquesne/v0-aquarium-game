<script setup lang="ts">
const game = useGameStore();
const now = useNow({ interval: 1000 });
const showModal = ref(false);
const showResetConfirm = ref(false);
const showOfflineModal = ref(false);
const offlineAmount = ref(0);
const hasOpenedStore = ref(false);

const toast = useToast();

type Section = "fish" | "shop" | "tools" | "tank";

const menuItems = [
  [
    {
      label: "Reset game",
      icon: "i-mdi-trash-can-outline",
      color: "error" as const,
      onSelect: () => { showResetConfirm.value = true; },
    },
  ],
];

const initialSection = ref<Section>("fish");
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
  initialSection.value = "tools";
  showModal.value = true;
}

function openSection(section: Section) {
  initialSection.value = section;
  showModal.value = true;
  if (section === "shop") hasOpenedStore.value = true;
}

// ── Hungry fish badge ──────────────────────────────────────────────────────
const hungryFishCount = computed(
  () => game.fish.filter((f) => f.hunger < CARE_THRESHOLD).length
);

// ── Tutorial ───────────────────────────────────────────────────────────────
const tutorialStep = computed(() => {
  if (!game.hasEverFed) return 0;
  if (!game.hasEverCollected) return 1;
  if (!hasOpenedStore.value) return 2;
  return -1;
});

const tutorialMessage = computed(() => {
  if (tutorialStep.value === 0) return "👆 Tap the tank to drop food for your fish!";
  if (tutorialStep.value === 1) return "💰 Tap a glowing coin to collect it!";
  if (tutorialStep.value === 2) return "🛒 Open the Shop below to buy more fish and upgrades!";
  return "";
});

// ── Death toasts ───────────────────────────────────────────────────────────
const fishNameMap = Object.fromEntries(FISH_SHOP_ITEMS.map((item) => [item.type, item.name]));

watch(
  () => game.pendingDeaths,
  (deaths) => {
    if (!deaths.length) return;
    deaths.forEach((d) => {
      const species = fishNameMap[d.type] ?? d.type;
      toast.add({
        title: `${d.name} has died 💔`,
        description: `Your ${species} didn't make it. Remember to keep your fish fed!`,
        color: "error",
        duration: 6000,
      });
    });
    game.clearPendingDeaths();
  },
  { deep: true }
);

// ── Storage warning ────────────────────────────────────────────────────────
watch(
  () => game.pendingStorageWarning,
  (val) => {
    if (val) {
      toast.add({
        title: "Storage full",
        description: "Progress may not be saving. Clear some browser storage and reload.",
        color: "warning",
        duration: 0,
      });
      game.clearStorageWarning();
    }
  }
);

// ── Offline earnings splash ────────────────────────────────────────────────
watch(
  () => game.pendingOfflineReward,
  (amount) => {
    if (amount > 0) {
      offlineAmount.value = amount;
      showOfflineModal.value = true;
      game.clearOfflineReward();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <div class="absolute top-0 right-0 p-2 z-20">
      <UDropdownMenu :items="menuItems" :ui="{ content: 'min-w-40' }">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-mdi-dots-vertical"
          size="xs"
          class="bg-default/80 shadow-xl rounded-xl"
          aria-label="Menu" />
      </UDropdownMenu>
    </div>

    <div class="absolute top-0 left-0 p-2 flex z-20 flex-col gap-2">
      <div
        class="flex items-center gap-2 sm:gap-4 bg-default/80 rounded-2xl shadow-xl w-fit px-2 py-1 flex-wrap">
        <span
          class="text-sm font-semibold"
          :class="game.coins < 0 ? 'text-red-400' : game.coins < MAINTENANCE_WARNING_THRESHOLD ? 'text-yellow-400' : ''"
          >💰 {{ abbreviateCoins(game.coins) }}</span
        >
        <span class="text-sm font-semibold">🐟 {{ game.fish.length }} / {{ game.tankCapacity }}</span>
        <span class="text-sm font-semibold">🍽️ {{ avg }}</span>
        <span v-if="game.coinMultiplier > 1" class="text-sm font-semibold text-success">
          ×{{ game.coinMultiplier.toFixed(2) }}
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
        </div>
      </div>
    </div>

    <!-- Tutorial hint -->
    <div
      v-if="tutorialStep >= 0"
      class="absolute bottom-16 left-2 right-2 sm:bottom-20 sm:left-3 sm:right-auto z-20">
      <div
        class="bg-gray-900/85 rounded-lg backdrop-blur border border-gray-600/60 p-3 animate-pulse">
        <p class="text-xs sm:text-sm text-white text-center sm:text-left">
          {{ tutorialMessage }}
        </p>
      </div>
    </div>

    <!-- Bottom nav -->
    <div class="fixed bottom-4 left-4 right-4 z-20">
      <div class="rounded-2xl p-1 flex gap-0.5 justify-center w-fit mx-auto shadow-2xl"
        style="background: rgba(2,6,23,0.88); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px);">
        <!-- Fish -->
        <div class="relative">
          <button
            class="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-all focus:outline-none"
            @click="openSection('fish')">
            <span class="text-base leading-none">🐟</span>
            <span class="text-[10px] font-semibold uppercase tracking-wide leading-none">Fish</span>
          </button>
          <span
            v-if="hungryFishCount > 0"
            class="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center pointer-events-none leading-none">
            {{ hungryFishCount }}
          </span>
        </div>
        <!-- Shop -->
        <button
          class="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-all focus:outline-none"
          :class="tutorialStep === 2 ? 'ring-2 ring-yellow-400/60 animate-pulse text-yellow-300/80' : ''"
          @click="openSection('shop')">
          <span class="text-base leading-none">🛒</span>
          <span class="text-[10px] font-semibold uppercase tracking-wide leading-none">Shop</span>
        </button>
        <!-- Tools -->
        <button
          class="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-all focus:outline-none"
          @click="openSection('tools')">
          <span class="text-base leading-none">⚒️</span>
          <span class="text-[10px] font-semibold uppercase tracking-wide leading-none">Tools</span>
        </button>
        <!-- Tank -->
        <button
          class="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-white/50 hover:text-white/80 transition-all focus:outline-none"
          @click="openSection('tank')">
          <span class="text-base leading-none">🌊</span>
          <span class="text-[10px] font-semibold uppercase tracking-wide leading-none">Tank</span>
        </button>
      </div>
    </div>

    <InventoryModal
      v-model="showModal"
      :initial-section="initialSection" />

    <!-- Reset confirmation -->
    <UModal v-model:open="showResetConfirm" :overlay="false">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🗑️</span>
            <div>
              <p class="font-semibold text-base">Reset game?</p>
              <p class="text-sm text-muted-foreground">All progress will be lost permanently.</p>
            </div>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="showResetConfirm = false" />
            <UButton color="error" label="Reset" @click="game.resetGame()" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Offline earnings splash -->
    <UModal v-model:open="showOfflineModal" :overlay="false">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🐠</span>
            <div>
              <p class="font-semibold text-base">Welcome back!</p>
              <p class="text-sm text-muted-foreground">Your fish were busy while you were away.</p>
            </div>
          </div>
          <div class="bg-muted rounded-xl p-4 text-center">
            <span class="text-2xl font-bold text-yellow-400">💰 +{{ offlineAmount }}</span>
            <p class="text-xs text-muted mt-1">coins earned while offline</p>
          </div>
          <UButton color="info" label="Dive Back In 🌊" block @click="showOfflineModal = false" />
        </div>
      </template>
    </UModal>
  </div>
</template>
