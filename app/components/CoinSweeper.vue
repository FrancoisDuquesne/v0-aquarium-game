<script setup lang="ts">
const game = useGameStore();

const xPct = ref(5);
const facingRight = ref(true);
const isSweeping = ref(false);
let sweepTimeout: ReturnType<typeof setTimeout> | null = null;

// % per second for each level
const SPEED = [0, 5, 9, 15];

const show = computed(() => game.coinCollector.level > 0);
const speed = computed(() => SPEED[game.coinCollector.level] ?? 0);

let frameHandle: number | null = null;
let lastTs = 0;

function loop(ts: number) {
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  if (show.value && speed.value > 0) {
    xPct.value += speed.value * (facingRight.value ? 1 : -1) * dt;
    if (xPct.value >= 93) { xPct.value = 93; facingRight.value = false; }
    else if (xPct.value <= 4) { xPct.value = 4; facingRight.value = true; }
  }
  frameHandle = requestAnimationFrame(loop);
}

onMounted(() => {
  lastTs = performance.now();
  frameHandle = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  if (frameHandle != null) cancelAnimationFrame(frameHandle);
  if (sweepTimeout != null) clearTimeout(sweepTimeout);
});

watch(() => game.coinCollector.lastSweep, (newVal, oldVal) => {
  if (!newVal || newVal === oldVal) return;
  isSweeping.value = true;
  if (sweepTimeout) clearTimeout(sweepTimeout);
  sweepTimeout = setTimeout(() => { isSweeping.value = false; }, 700);
});
</script>

<template>
  <div
    v-if="show"
    class="absolute pointer-events-none"
    style="bottom: 2%; left: 0; right: 0; height: 0; z-index: 8;">
    <div
      class="absolute bottom-0"
      :style="{
        left: xPct + '%',
        transform: `translateX(-50%) scaleX(${facingRight ? 1 : -1})`,
        willChange: 'transform, left',
      }">

      <!-- Level 1: Glass Scoop Drone -->
      <svg v-if="game.coinCollector.level === 1" width="28" height="22" viewBox="0 0 28 22" fill="none">
        <!-- Scoop arm (front) -->
        <rect x="22" y="11" width="6" height="4" rx="1" fill="#64748b"/>
        <!-- Body -->
        <rect x="2" y="8" width="21" height="11" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="0.6"/>
        <!-- Glass dome -->
        <path d="M6 8 C6 3 22 3 22 8" fill="rgba(186,230,253,0.5)" stroke="#7dd3fc" stroke-width="0.7"/>
        <!-- Eyes (glow brighter while sweeping) -->
        <circle cx="9" cy="13" r="2" :fill="isSweeping ? '#7dd3fc' : '#38bdf8'" :opacity="isSweeping ? 1 : 0.75"/>
        <circle cx="16" cy="13" r="2" :fill="isSweeping ? '#7dd3fc' : '#38bdf8'" :opacity="isSweeping ? 1 : 0.75"/>
        <!-- Wheels -->
        <circle cx="7" cy="20" r="2.5" fill="#334155" stroke="#64748b" stroke-width="0.5"/>
        <circle cx="18" cy="20" r="2.5" fill="#334155" stroke="#64748b" stroke-width="0.5"/>
        <!-- Sweep glow -->
        <circle v-if="isSweeping" cx="25" cy="13" r="5" fill="rgba(56,189,248,0.25)"/>
      </svg>

      <!-- Level 2: Magnet Siphon -->
      <svg v-else-if="game.coinCollector.level === 2" width="40" height="28" viewBox="0 0 40 28" fill="none">
        <!-- Magnet arm (front) -->
        <rect x="28" y="9" width="9" height="3" rx="0.5" fill="#0ea5e9"/>
        <rect x="28" y="15" width="9" height="3" rx="0.5" fill="#0ea5e9"/>
        <rect x="35" y="8" width="2" height="11" rx="0.5" fill="#38bdf8"/>
        <!-- Magnet field glow -->
        <ellipse v-if="isSweeping" cx="37" cy="13.5" rx="6" ry="8" fill="rgba(56,189,248,0.22)" stroke="rgba(56,189,248,0.35)" stroke-width="0.6"/>
        <!-- Body -->
        <rect x="2" y="7" width="27" height="14" rx="2" fill="#1e3a5f" stroke="#38bdf8" stroke-width="0.8"/>
        <!-- Top panel -->
        <rect x="6" y="4" width="18" height="5" rx="1" fill="#0f2a4a" stroke="#38bdf8" stroke-width="0.5"/>
        <!-- Antenna -->
        <line x1="15" y1="4" x2="15" y2="1" stroke="#38bdf8" stroke-width="0.9"/>
        <circle cx="15" cy="0.5" r="1.5" :fill="isSweeping ? '#7dd3fc' : '#38bdf8'"/>
        <!-- Eye lights -->
        <circle cx="9" cy="13.5" r="2.5" :fill="isSweeping ? '#7dd3fc' : '#38bdf8'" :opacity="isSweeping ? 1 : 0.8"/>
        <circle cx="17" cy="13.5" r="2.5" :fill="isSweeping ? '#7dd3fc' : '#38bdf8'" :opacity="isSweeping ? 1 : 0.8"/>
        <!-- Tracks -->
        <rect x="3" y="19" width="11" height="7" rx="3.5" fill="#0f172a" stroke="#38bdf8" stroke-width="0.5"/>
        <rect x="16" y="19" width="11" height="7" rx="3.5" fill="#0f172a" stroke="#38bdf8" stroke-width="0.5"/>
      </svg>

      <!-- Level 3: Nimbus Collector -->
      <svg v-else-if="game.coinCollector.level === 3" width="46" height="24" viewBox="0 0 46 24" fill="none">
        <!-- Jet exhaust (back) -->
        <ellipse cx="4" cy="12" rx="5" ry="6" :fill="isSweeping ? 'rgba(251,191,36,0.4)' : 'rgba(251,191,36,0.15)'" stroke="rgba(251,191,36,0.45)" stroke-width="0.6"/>
        <!-- Hull -->
        <path d="M7 12 L12 5 L34 5 L40 12 L34 19 L12 19 Z" fill="#1c1917" stroke="#fbbf24" stroke-width="0.9"/>
        <path d="M7 12 L12 5 L34 5 L40 12 L34 19 L12 19 Z" :fill="isSweeping ? 'rgba(251,191,36,0.18)' : 'rgba(251,191,36,0.06)'"/>
        <!-- Collection nozzle (front) -->
        <path d="M40 9 L44 11 L44 13 L40 15" fill="none" stroke="#fbbf24" stroke-width="1"/>
        <circle v-if="isSweeping" cx="44" cy="12" r="5" fill="rgba(251,191,36,0.3)"/>
        <!-- Indicator lights -->
        <circle cx="18" cy="12" r="2.5" :fill="isSweeping ? '#fde68a' : '#fbbf24'" :opacity="isSweeping ? 1 : 0.85"/>
        <circle cx="26" cy="12" r="2.5" :fill="isSweeping ? '#fde68a' : '#fbbf24'" :opacity="isSweeping ? 1 : 0.85"/>
        <circle cx="33" cy="12" r="2.5" :fill="isSweeping ? '#fde68a' : '#fbbf24'" :opacity="isSweeping ? 1 : 0.85"/>
        <!-- Wing edge lines -->
        <line x1="14" y1="8" x2="33" y2="8" stroke="#fbbf24" stroke-width="0.4" opacity="0.4"/>
        <line x1="14" y1="16" x2="33" y2="16" stroke="#fbbf24" stroke-width="0.4" opacity="0.4"/>
      </svg>

      <!-- Sweep coin pop -->
      <div
        v-if="isSweeping"
        class="absolute pointer-events-none"
        style="top: -18px; left: 50%; transform: translateX(-50%);">
        <span class="text-xs animate-bounce select-none">💰</span>
      </div>
    </div>
  </div>
</template>
