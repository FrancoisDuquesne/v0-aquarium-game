<script setup lang="ts">
// Static bubble definitions — CSS handles all animation, no reactive overhead
const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.round(4 + (i * 5.5) % 92),
  size: [4, 5, 6, 4, 7, 5, 4, 6, 5, 7, 4, 5, 6, 4, 8, 5, 6, 4][i],
  delay: +(i * 0.65 % 9).toFixed(2),
  duration: +(7 + (i * 0.9) % 5).toFixed(1),
  drift: Math.round(-8 + (i * 3) % 16),
}));
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    <div
      v-for="b in BUBBLES"
      :key="b.id"
      class="absolute rounded-full bg-white/25 bubble"
      :style="{
        left: b.x + '%',
        bottom: '-12px',
        width: b.size + 'px',
        height: b.size + 'px',
        animationDelay: b.delay + 's',
        animationDuration: b.duration + 's',
        '--drift': b.drift + 'px',
      }" />
  </div>
</template>

<style scoped>
.bubble {
  animation: bubbleFloat var(--duration, 8s) ease-in infinite;
  animation-delay: var(--delay, 0s);
}

@keyframes bubbleFloat {
  0%   { transform: translateY(0) translateX(0) scale(1);     opacity: 0; }
  5%   { opacity: 0.6; }
  50%  { transform: translateY(-45vh) translateX(var(--drift)) scale(1.06); opacity: 0.45; }
  90%  { opacity: 0.2; }
  100% { transform: translateY(-100vh) translateX(calc(var(--drift) * 1.5)) scale(0.8); opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .bubble { animation: none; }
}
</style>
