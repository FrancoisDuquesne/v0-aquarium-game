<script setup lang="ts">
const game = useGameStore();
const open = defineModel<boolean>({ required: true });

type Section = "fish" | "shop" | "tools" | "tank";

const props = withDefaults(
  defineProps<{ initialSection?: Section }>(),
  { initialSection: "fish" }
);

const activeSection = ref<Section>(props.initialSection);

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) activeSection.value = props.initialSection;
  }
);

const hungryFishCount = computed(
  () => game.fish.filter((f) => f.hunger < CARE_THRESHOLD).length
);

const sections: { id: Section; icon: string; label: string }[] = [
  { id: "fish",  icon: "🐟", label: "Fish"  },
  { id: "shop",  icon: "🛒", label: "Shop"  },
  { id: "tools", icon: "⚒️", label: "Tools" },
  { id: "tank",  icon: "🌊", label: "Tank"  },
];

const goToShop = () => { activeSection.value = "shop"; };
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-x-0 bottom-0 z-50 flex flex-col">
        <!-- Backdrop -->
        <div class="fixed inset-0 -z-10" @click="open = false" />

        <!-- Drawer panel -->
        <div
          class="relative rounded-t-2xl flex flex-col overflow-hidden"
          style="height: 72vh; background: rgba(2, 6, 23, 0.97); border-top: 1px solid rgba(255,255,255,0.08); box-shadow: 0 -8px 40px rgba(0,0,0,0.6);">

          <!-- Teal ambient glow at top edge -->
          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-cyan-500/40 blur-sm pointer-events-none" />
          <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-8 bg-cyan-500/5 pointer-events-none" />

          <!-- Drag handle -->
          <button
            class="flex justify-center items-center pt-2.5 pb-2 w-full focus:outline-none"
            aria-label="Close panel"
            @click="open = false">
            <div class="w-8 h-1 rounded-full bg-white/20 hover:bg-white/35 transition-colors" />
          </button>

          <!-- Body: icon rail + content -->
          <div class="flex flex-1 min-h-0">

            <!-- Icon rail -->
            <nav class="w-14 flex flex-col items-center pt-1 pb-3 gap-0.5 shrink-0"
              style="border-right: 1px solid rgba(255,255,255,0.06);">
              <button
                v-for="sec in sections"
                :key="sec.id"
                class="relative w-12 h-14 flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all focus:outline-none"
                :class="activeSection === sec.id
                  ? 'text-cyan-400'
                  : 'text-white/35 hover:text-white/60'"
                @click="activeSection = sec.id">
                <!-- Active left bar -->
                <div
                  v-if="activeSection === sec.id"
                  class="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-cyan-400" />
                <!-- Active bg -->
                <div
                  v-if="activeSection === sec.id"
                  class="absolute inset-0 rounded-xl bg-cyan-500/10" />
                <span class="relative text-lg leading-none">{{ sec.icon }}</span>
                <span class="relative text-[9px] font-semibold uppercase tracking-wide leading-none">{{ sec.label }}</span>
                <!-- Hungry fish badge on Fish icon -->
                <span
                  v-if="sec.id === 'fish' && hungryFishCount > 0"
                  class="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none pointer-events-none">
                  {{ hungryFishCount }}
                </span>
              </button>
            </nav>

            <!-- Content area -->
            <div class="flex-1 min-w-0 overflow-y-auto">
              <InventoryModalInventory
                v-if="activeSection === 'fish'"
                @go-to-shop="goToShop" />
              <InventoryModalStore
                v-else-if="activeSection === 'shop'" />
              <InventoryModalTools
                v-else-if="activeSection === 'tools'" />
              <InventoryModalAquarium
                v-else-if="activeSection === 'tank'" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 280ms cubic-bezier(0.32, 0.72, 0, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateY(100%);
}
</style>
