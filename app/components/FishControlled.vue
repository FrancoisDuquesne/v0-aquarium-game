<script setup lang="ts">
const props = defineProps<{
  fishId: number;
  type: string;
  hunger: number;
  health: number;
  boredom: number;
  isBeingFed?: boolean;
}>();

const size =
  FISH_CONFIG.FISH_SIZES[props.type as keyof typeof FISH_CONFIG.FISH_SIZES] ||
  FISH_CONFIG.FISH_SIZES.goldfish;

const barWidth = Math.max(24, Math.min(size.width, 52));

const healthBarClass = computed(() =>
  props.health >= 70 ? "bg-emerald-400" : props.health >= 40 ? "bg-orange-400" : "bg-red-500"
);
const hungerBarClass = computed(() =>
  props.hunger >= HAPPY_THRESHOLD ? "bg-green-400" : props.hunger >= CARE_THRESHOLD ? "bg-yellow-400" : "bg-red-400"
);
const moodBarClass = computed(() => {
  const mood = 100 - props.boredom;
  return mood >= 60 ? "bg-sky-400" : mood >= 30 ? "bg-yellow-400" : "bg-red-400";
});

const floatDelay = `${(props.fishId % 10) * 0.31}s`;
</script>

<template>
  <div
    :data-fishid="props.fishId"
    class="absolute cursor-pointer"
    style="left:0;top:0;z-index:10;will-change:transform;transform-origin:center">
    <div
      class="fish-inner relative float-animation transition-transform duration-200 hover:scale-110"
      :style="{ animationDelay: floatDelay }">
      <div
        v-if="isBeingFed"
        class="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping scale-150" />
      <FishSvg
        :type="props.type"
        :width="size.width"
        :height="size.height"
        class="drop-shadow-lg" />

      <!-- Status bars below fish -->
      <div
        class="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex flex-col gap-px pointer-events-none"
        :style="{ width: barWidth + 'px' }">
        <div class="h-1 w-full bg-black/30 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-[width] duration-700" :class="healthBarClass" :style="{ width: health + '%' }" />
        </div>
        <div class="h-1 w-full bg-black/30 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-[width] duration-700" :class="hungerBarClass" :style="{ width: hunger + '%' }" />
        </div>
        <div class="h-1 w-full bg-black/30 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-[width] duration-700" :class="moodBarClass" :style="{ width: (100 - boredom) + '%' }" />
        </div>
      </div>

      <!-- Fed / very happy bubble -->
      <div
        v-if="isBeingFed || hunger > 95"
        class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs animate-bounce select-none pointer-events-none">
        {{ isBeingFed ? "🍽️" : "❤️" }}
      </div>
    </div>
  </div>
</template>
