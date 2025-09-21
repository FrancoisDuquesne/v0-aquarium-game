<script setup lang="ts">
const props = defineProps<{
  fishId: number;
  type: string;
  hunger: number;
  isBeingFed?: boolean;
}>();

const size =
  FISH_CONFIG.FISH_SIZES[props.type as keyof typeof FISH_CONFIG.FISH_SIZES] ||
  FISH_CONFIG.FISH_SIZES.goldfish;
const hungerColor = computed(() =>
  props.hunger > 70
    ? "text-green-400"
    : props.hunger > 40
    ? "text-yellow-400"
    : "text-red-400"
);
</script>

<template>
  <div
    :data-fishid="props.fishId"
    class="absolute cursor-pointer"
    style="
      left: 0;
      top: 0;
      z-index: 10;
      will-change: transform;
      transform-origin: center;
    ">
    <div
      class="fish-inner relative float-animation transition-transform duration-200 hover:scale-110">
      <div
        v-if="isBeingFed"
        class="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping scale-150" />
      <FishSvg
        :type="props.type"
        :width="size.width"
        :height="size.height"
        class="drop-shadow-lg" />
      <div
        class="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white/50">
        <div
          class="w-full h-full rounded-full"
          :class="hungerColor"
          :style="{ opacity: String(props.hunger / 100) }" />
      </div>
      <div
        v-if="props.hunger > 95 || isBeingFed"
        class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 animate-bounce">
        {{ isBeingFed ? "🍽️" : "❤️" }}
      </div>
    </div>
  </div>
</template>
