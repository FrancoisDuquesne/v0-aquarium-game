<script setup lang="ts">
const game = useGameStore();
const open = defineModel<boolean>({ required: true });
const props = withDefaults(
  defineProps<{
    initialTab?: "inventory" | "store" | "aquarium";
    initialInventoryView?: "fish" | "tools";
  }>(),
  { initialTab: "inventory", initialInventoryView: "fish" }
);
const activeTab = ref(props.initialTab);
const inventoryView = ref(props.initialInventoryView);
const tabs = [
  {
    value: "inventory",
    label: "📦 Inventory",
    slot: "inventory" as const,
  },
  {
    value: "store",
    label: "🛒 Store",
    slot: "store" as const,
  },
  {
    value: "aquarium",
    label: "🌊 Aquarium",
    slot: "aquarium" as const,
  },
];

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = props.initialTab;
      inventoryView.value = props.initialInventoryView;
    }
  }
);

const goToStore = () => {
  activeTab.value = "store";
};
</script>

<template>
  <UModal
    v-model:open="open"
    :overlay="false"
    :ui="{
      content: 'w-[95vw] sm:w-[90vw] lg:w-[80vw] max-w-none bg-default/80',
    }">
    <template #content>
      <UTabs
        v-model="activeTab"
        :items="tabs"
        variant="link"
        :ui="{
          list: 'bg-default',
          root: 'gap-0',
          content: 'h-[70vh]',
        }">
        <template #list-trailing>
          <div class="flex items-center gap-2 ml-auto">
            <UBadge
            :label="`💰 ${abbreviateCoins(game.coins)}`"
            :color="game.coins < 0 ? 'error' : game.coins < MAINTENANCE_WARNING_THRESHOLD ? 'warning' : 'neutral'" />
            <UButton
              color="neutral"
              variant="ghost"
              @click="open = false"
              icon="i-mdi-close" />
          </div>
        </template>
        <template #inventory>
          <InventoryModalInventory
            v-model:view="inventoryView"
            @go-to-store="goToStore" />
        </template>
        <template #store>
          <InventoryModalStore />
        </template>
        <template #aquarium>
          <InventoryModalAquarium />
        </template>
      </UTabs>
    </template>
  </UModal>
</template>
