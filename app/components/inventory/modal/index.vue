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
const activeTab = ref<"inventory" | "store" | "aquarium">("inventory");
const inventoryView = ref<"fish" | "tools">("fish");
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

watch(
  () => props.initialTab,
  (tab) => {
    if (!open.value) {
      activeTab.value = tab;
    }
  },
  { immediate: true }
);

watch(
  () => props.initialInventoryView,
  (view) => {
    if (!open.value) {
      inventoryView.value = view;
    }
  },
  { immediate: true }
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
            <UBadge :label="`💰 ${Math.floor(game.coins)}`" />
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
