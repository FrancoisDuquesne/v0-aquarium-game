<script setup lang="ts">
import type { GeneticsData } from '~/utils/game-config'

const props = defineProps<{
  fishId: number;
  type: string;
  name?: string;
  hunger: number;
  health: number;
  boredom: number;
  careStreak?: number;
  isBeingFed?: boolean;
  sizeMultiplier?: number;
  genetics?: GeneticsData;
  generation?: number;
}>();

const emit = defineEmits<{ (e: "play", fishId: number): void }>();

const baseSize =
  FISH_CONFIG.FISH_SIZES[props.type as keyof typeof FISH_CONFIG.FISH_SIZES] ||
  FISH_CONFIG.FISH_SIZES.goldfish;

const scaledWidth  = computed(() => Math.round(baseSize.width  * (props.sizeMultiplier ?? 1.0)));
const scaledHeight = computed(() => Math.round(baseSize.height * (props.sizeMultiplier ?? 1.0)));
const barWidth     = computed(() => Math.max(24, Math.min(scaledWidth.value, 52)));

const healthBarClass = computed(() =>
  props.health >= HEALTH_HIGH_THRESHOLD ? "bg-emerald-400" : props.health >= HEALTH_LOW_THRESHOLD ? "bg-orange-400" : "bg-red-500"
);
const hungerBarClass = computed(() =>
  props.hunger >= HAPPY_THRESHOLD ? "bg-green-400" : props.hunger >= CARE_THRESHOLD ? "bg-yellow-400" : "bg-red-400"
);
const moodBarClass = computed(() => {
  const mood = 100 - props.boredom;
  return mood >= 60 ? "bg-sky-400" : mood >= 30 ? "bg-yellow-400" : "bg-red-400";
});

const floatDelay = `-${(props.fishId % 10) * 0.3}s`;
const floatDuration = `${2.5 + (props.fishId % 5) * 0.2}s`;
</script>

<template>
  <div
    :data-fishid="props.fishId"
    class="absolute cursor-pointer group"
    style="left:0;top:0;z-index:10;will-change:transform;transform-origin:center">
    <div
      class="fish-inner relative float-animation transition-transform duration-200 hover:scale-110"
      :style="{ animationDelay: floatDelay, animationDuration: floatDuration }"
      @click.stop="emit('play', props.fishId)">
      <div
        v-if="isBeingFed"
        class="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping scale-150" />
      <FishSvg
        :type="props.type"
        :width="scaledWidth"
        :height="scaledHeight"
        :fish-id="props.fishId"
        :genetics="props.genetics"
        :generation="props.generation"
        class="drop-shadow-lg" />

      <!-- Always-visible hunger strip (thin bar just below fish) -->
      <div
        class="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 pointer-events-none rounded-full overflow-hidden"
        :style="{ width: Math.round(scaledWidth * 0.65) + 'px', height: '2px', background: 'rgba(0,0,0,0.3)' }">
        <div class="h-full rounded-full transition-[width] duration-700" :class="hungerBarClass" :style="{ width: hunger + '%' }" />
      </div>

      <!-- Hover / active (touch) full stat panel -->
      <div
        class="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col gap-[3px] pointer-events-none px-1.5 py-1 rounded-md opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150"
        :style="{ width: (barWidth + 10) + 'px', background: 'rgba(0,0,0,0.55)' }">
        <div class="flex items-center gap-1">
          <span class="text-[8px] leading-none w-3 text-center shrink-0">❤️</span>
          <div class="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-[width] duration-700" :class="healthBarClass" :style="{ width: health + '%' }" />
          </div>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[8px] leading-none w-3 text-center shrink-0">🍽️</span>
          <div class="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-[width] duration-700" :class="hungerBarClass" :style="{ width: hunger + '%' }" />
          </div>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[8px] leading-none w-3 text-center shrink-0">😊</span>
          <div class="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-[width] duration-700" :class="moodBarClass" :style="{ width: (100 - boredom) + '%' }" />
          </div>
        </div>
      </div>

      <!-- Fish name label -->
      <div
        v-if="name"
        class="absolute bottom-full left-1/2 -translate-x-1/2 pb-0.5 pointer-events-none whitespace-nowrap">
        <span
          class="fish-label text-[10px] text-white font-semibold leading-none select-none flex items-center gap-0.5"
          style="text-shadow: 0 1px 3px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,0.8)">
          {{ name }}<span v-if="careStreak && careStreak > 0" class="text-[8px] text-orange-400">🔥{{ careStreak }}</span>
        </span>
      </div>

      <!-- Fed / very happy bubble -->
      <div
        v-if="isBeingFed || hunger > 95"
        class="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
        <span class="fish-label text-xs select-none">{{ isBeingFed ? "🍽️" : "❤️" }}</span>
      </div>

      <!-- Boredom indicator -->
      <div
        v-if="boredom > BOREDOM_HIGH_THRESHOLD && !isBeingFed"
        class="absolute -top-5 -right-1 select-none pointer-events-none opacity-80">
        <span class="fish-label text-xs">😟</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fish-label {
  display: inline-block;
  transform: scaleX(var(--face, 1));
}
</style>
