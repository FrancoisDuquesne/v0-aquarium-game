<script setup lang="ts">
import { seededRng } from '~/utils/economy'
import type { GeneticsData } from '~/utils/game-config'

const props = defineProps<{
  type: string
  width?: number
  height?: number
  class?: string
  fishId?: number
  genetics?: GeneticsData
  generation?: number
}>()

const VIEWBOXES: Record<string, string> = {
  goldfish:        '0 0 56 36',
  angelfish:       '0 0 42 56',
  neon:            '0 0 44 18',
  tropical:        '0 0 48 30',
  shark:           '0 0 64 30',
  betta:           '0 0 58 40',
  'cherry-barb':   '0 0 42 20',
  guppy:           '0 0 48 30',
  'pearl-gourami': '0 0 54 30',
  'tiger-barb':    '0 0 40 28',
  'jewel-cichlid': '0 0 50 32',
}

const viewBox = computed(() => VIEWBOXES[props.type] || VIEWBOXES.goldfish)

// Deterministic per-fish visual variation seeded by fishId
const traits = computed(() => {
  const id = props.fishId ?? 0
  const rng = seededRng(id * 97 + 41)
  const r0 = rng()  // hue shift
  const r1 = rng()  // saturation
  const r2 = rng()  // brightness
  return {
    hue: (r0 - 0.5) * 22,   // ±11°
    sat: 0.88 + r1 * 0.24,  // 0.88–1.12
    bri: 0.95 + r2 * 0.10,  // 0.95–1.05
  }
})

// CSS filter string combining per-fish randomness + genetics
const filterStyle = computed(() => {
  const t    = traits.value
  const g    = props.genetics
  const mut  = g?.mutation
  const gen  = props.generation ?? 0

  let hue = t.hue
  let sat = t.sat
  let bri = t.bri

  // Bred fish are slightly more vibrant per generation
  if (gen > 0) {
    sat = Math.min(sat * (1 + gen * 0.07), 1.6)
    bri = Math.min(bri * (1 + gen * 0.02), 1.25)
  }

  // Genetics modifiers
  const coinMod   = g?.coinMod   ?? 1
  const speedMod  = g?.speedMod  ?? 1
  const healthMod = g?.healthMod ?? 1
  const hungerMod = g?.hungerMod ?? 1

  // High coin output → brighter/warmer
  if (coinMod > 1.1)   bri  = Math.min(bri  * (1 + (coinMod  - 1) * 0.22), 1.35)
  // Swift fish → cooler blue hue
  if (speedMod > 1.15) hue -= (speedMod - 1) * 25
  // Hardy fish → richer saturation, slight green tint
  if (healthMod > 1.1) { sat = Math.min(sat * 1.1, 1.55); hue -= 8 }
  // Voracious fish → warmer
  if (hungerMod > 1.2) hue += (hungerMod - 1) * 15

  // Mutation overrides take full control of color
  if (mut === 'golden')   return 'sepia(0.55) hue-rotate(18deg) saturate(2.4) brightness(1.22)'
  if (mut === 'sickly')   return `hue-rotate(${hue.toFixed(1)}deg) saturate(0.18) brightness(0.72) contrast(0.82)`
  if (mut === 'lethargic')return `hue-rotate(${hue.toFixed(1)}deg) saturate(${(sat*0.55).toFixed(2)}) brightness(${(bri*0.84).toFixed(2)})`
  if (mut === 'swift')    return `hue-rotate(${(hue-20).toFixed(1)}deg) saturate(${(sat*1.18).toFixed(2)}) brightness(${(bri*1.06).toFixed(2)})`
  if (mut === 'hardy')    return `hue-rotate(${(hue-10).toFixed(1)}deg) saturate(${(sat*1.15).toFixed(2)}) brightness(${(bri*1.07).toFixed(2)})`
  if (mut === 'voracious')return `hue-rotate(${(hue+12).toFixed(1)}deg) saturate(${(sat*1.28).toFixed(2)}) brightness(${bri.toFixed(2)})`

  return `hue-rotate(${hue.toFixed(1)}deg) saturate(${sat.toFixed(2)}) brightness(${bri.toFixed(2)})`
})


</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="viewBox"
    :class="props.class"
    pointer-events="none"
    overflow="visible"
  >

    <!-- ═══════════════════════════════════════════════════════════════════════
         GOLDFISH (56×36) — round fancy veil-tail goldfish, warm orange
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-if="type === 'goldfish'" :style="{ filter: filterStyle }">
      <!-- outer double veil tail -->
      <g class="fish-tail">
        <path d="M 20 18 L 2 4 L 12 15 L 2 32 L 12 21 Z" fill="#b83c00"/>
        <path d="M 20 18 L 5 8 L 14 16 L 5 28 L 14 20 Z" fill="#f97316" opacity="0.55"/>
        <!-- tail ray lines -->
        <line x1="20" y1="18" x2="4" y2="6"  stroke="#c2410c" stroke-width="0.5" opacity="0.6"/>
        <line x1="20" y1="18" x2="3" y2="18" stroke="#c2410c" stroke-width="0.5" opacity="0.5"/>
        <line x1="20" y1="18" x2="4" y2="30" stroke="#c2410c" stroke-width="0.5" opacity="0.6"/>
      </g>
      <!-- body — round disc, slightly hump-backed -->
      <path
        d="M 20 18 C 20 9 25 4 34 4 C 43 4 49 10 49 18 C 49 26 43 32 34 32 C 25 32 20 27 20 18 Z"
        fill="#f97316"/>
      <!-- belly sheen / gradient highlight -->
      <ellipse cx="35" cy="23" rx="11" ry="7" fill="#fde68a" opacity="0.36"/>
      <!-- dorsal fin — tall sail -->
      <path d="M 25 4 C 23 -1 29 -2 35 -1 C 42 0 44 3 42 4 Z" fill="#c2410c"/>
      <!-- ventral fin pair -->
      <path d="M 30 32 L 33 37 L 37 32 Z" fill="#c2410c" opacity="0.7"/>
      <!-- pectoral fin -->
      <path d="M 39 24 L 47 31 L 38 29 Z" fill="#fb923c" opacity="0.72"/>
      <!-- gill arch -->
      <path d="M 41 7 Q 39 18 41 29" stroke="#ea580c" stroke-width="1.3" fill="none" opacity="0.38"/>
      <!-- eye — large, prominent (goldfish trait) -->
      <circle cx="45" cy="13" r="3.2" fill="#1c1917"/>
      <circle cx="46.2" cy="11.8" r="1.1" fill="white" opacity="0.88"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         ANGELFISH (42×56) — tall triangular disc, silver with dark bars
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'angelfish'" :style="{ filter: filterStyle }">
      <!-- long pointed dorsal fin -->
      <path d="M 26 8 C 22 4 17 1 14 3 L 14 10 C 17 7 22 7 26 8 Z" fill="#64748b" opacity="0.88"/>
      <!-- long pointed anal fin -->
      <path d="M 26 48 C 22 52 17 55 14 53 L 14 46 C 17 49 22 49 26 48 Z" fill="#64748b" opacity="0.88"/>
      <!-- forked tail -->
      <g class="fish-tail fish-tail--flowing">
        <path d="M 14 28 L 2 19 L 12 27 Z" fill="#94a3b8"/>
        <path d="M 14 28 L 2 37 L 12 29 Z" fill="#94a3b8"/>
      </g>
      <!-- body — tall narrow diamond -->
      <path
        d="M 14 28 C 15 18 19 9 26 8 C 31 9 36 17 36 28 C 36 39 31 47 26 48 C 19 47 15 38 14 28 Z"
        fill="#c8d1da"/>
      <!-- belly shimmer -->
      <ellipse cx="27" cy="28" rx="7" ry="11" fill="#e8eef4" opacity="0.45"/>
      <!-- 2 dark vertical bars (characteristic marking) -->
      <path d="M 28 9 Q 30 28 28 47 L 31 47 Q 33 28 31 9 Z" fill="#334155" opacity="0.48"/>
      <path d="M 22 9 Q 24 28 22 47 L 25 47 Q 27 28 25 9 Z" fill="#334155" opacity="0.42"/>
      <!-- pectoral fin -->
      <path d="M 29 34 L 37 40 L 29 38 Z" fill="#94a3b8" opacity="0.7"/>
      <!-- eye -->
      <circle cx="33" cy="21" r="2.8" fill="#1e293b"/>
      <circle cx="34" cy="20" r="0.9" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         NEON TETRA (44×18) — slim torpedo, teal band + red rear stripe
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'neon'" :style="{ filter: filterStyle }">
      <!-- tail — quick twitch -->
      <g class="fish-tail fish-tail--fast">
        <path d="M 8 9 L 1 5 L 7 8 L 1 13 L 7 10 Z" fill="#0e7490"/>
      </g>
      <!-- body — slim torpedo -->
      <path
        d="M 8 9 C 9 5 17 3 27 3 C 36 3 42 6 42 9 C 42 12 36 15 27 15 C 17 15 9 13 8 9 Z"
        fill="#f0f9ff"/>
      <!-- metallic blue-teal dorsal band (most of upper body) -->
      <path d="M 9 6 C 18 4 30 4 41 5.5 L 41 7.5 C 30 6 18 6.5 9 8 Z" fill="#06b6d4"/>
      <!-- iridescent highlight on blue stripe -->
      <path d="M 18 4.5 C 24 4 32 4.2 38 5 L 38 6 C 32 5 24 5 18 5.5 Z" fill="#a5f3fc" opacity="0.55"/>
      <!-- red stripe — lower rear half (characteristic neon marking) -->
      <path d="M 8 10 C 12 11 16 12 24 11.5 L 24 13 C 16 13.5 12 12.5 8 11.5 Z" fill="#f43f5e" opacity="0.92"/>
      <!-- small dorsal fin -->
      <path d="M 21 3 L 24 1 L 29 3 Z" fill="#0e7490" opacity="0.85"/>
      <!-- tiny adipose fin (between dorsal and tail) -->
      <path d="M 13 3.5 L 15 2 L 17 3.5 Z" fill="#0e7490" opacity="0.6"/>
      <!-- small ventral fin -->
      <path d="M 22 15 L 25 17.5 L 27 15 Z" fill="#0369a1" opacity="0.7"/>
      <!-- eye -->
      <circle cx="38" cy="7" r="2.1" fill="#1c1917"/>
      <circle cx="38.8" cy="6.2" r="0.7" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CLOWNFISH / TROPICAL (48×30) — orange anemonefish with 3 white bands
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'tropical'" :style="{ filter: filterStyle }">
      <!-- rounded tail fin -->
      <g class="fish-tail">
        <path d="M 12 15 L 2 8 L 9 13 L 2 22 L 9 17 Z" fill="#c2410c"/>
        <path d="M 12 15 L 4 11 L 9 15 L 4 20 L 9 16 Z" fill="#f97316" opacity="0.5"/>
      </g>
      <!-- body — oval, slightly rounded -->
      <path
        d="M 12 15 C 13 8 18 4 28 4 C 37 4 44 9 44 15 C 44 21 37 26 28 26 C 18 26 13 22 12 15 Z"
        fill="#f97316"/>
      <!-- belly warmth -->
      <ellipse cx="29" cy="19" rx="10" ry="5.5" fill="#fde68a" opacity="0.28"/>
      <!-- white band 1 — rear body (near tail) -->
      <path d="M 18 4.5 Q 16 15 18 25.5 L 22 25.5 Q 20 15 22 4.5 Z" fill="white" opacity="0.95"/>
      <path d="M 17.2 4.5 Q 15.2 15 17.2 25.5 L 18 25.5 Q 16 15 18 4.5 Z" fill="#0f172a" opacity="0.55"/>
      <path d="M 22 4.5 Q 20 15 22 25.5 L 22.8 25.5 Q 20.8 15 22.8 4.5 Z" fill="#0f172a" opacity="0.55"/>
      <!-- white band 2 — mid body -->
      <path d="M 30 4 Q 28 15 30 26 L 34 26 Q 32 15 34 4 Z" fill="white" opacity="0.9"/>
      <path d="M 29.2 4 Q 27.2 15 29.2 26 L 30 26 Q 28 15 30 4 Z" fill="#0f172a" opacity="0.45"/>
      <path d="M 34 4 Q 32 15 34 26 L 34.8 26 Q 32.8 15 34.8 4 Z" fill="#0f172a" opacity="0.45"/>
      <!-- white band 3 — head (eye bar) -->
      <path d="M 39.5 5.5 Q 38 15 39.5 24.5 L 43 24.5 Q 41.5 15 43 5.5 Z" fill="white" opacity="0.85"/>
      <path d="M 38.7 5.5 Q 37.2 15 38.7 24.5 L 39.5 24.5 Q 38 15 39.5 5.5 Z" fill="#0f172a" opacity="0.4"/>
      <!-- dorsal fin — rounded, dark-tipped -->
      <path d="M 19 4 C 21 0 30 0 33 4 Z" fill="#c2410c" opacity="0.88"/>
      <!-- anal fin -->
      <path d="M 23 26 C 25 30 30 30 32 26 Z" fill="#c2410c" opacity="0.75"/>
      <!-- pectoral fin -->
      <path d="M 36 20 L 43 25 L 35 23 Z" fill="#fb923c" opacity="0.7"/>
      <!-- gill line -->
      <path d="M 40 6.5 Q 38 15 40 23.5" stroke="#c2410c" stroke-width="1" fill="none" opacity="0.35"/>
      <!-- eye -->
      <circle cx="42" cy="10.5" r="2.6" fill="#1c1917"/>
      <circle cx="43" cy="9.5" r="0.9" fill="white" opacity="0.85"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         SHARK (64×30) — torpedo body, large dorsal, heterocercal tail
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'shark'" :style="{ filter: filterStyle }">
      <!-- heterocercal caudal fin (upper lobe much larger) -->
      <g class="fish-tail fish-tail--fast">
        <path d="M 17 15 L 2 5 L 14 13 Z"  fill="#475569"/>
        <path d="M 17 15 L 5 21 L 14 16 Z" fill="#64748b" opacity="0.7"/>
      </g>
      <!-- body — elongated torpedo, tapers at both ends -->
      <path
        d="M 17 15 C 18 10 26 6 40 6 C 52 6 61 10 62 15 C 61 20 52 24 40 24 C 26 24 18 20 17 15 Z"
        fill="#7c8fa0"/>
      <!-- white underbelly -->
      <path d="M 18 15 C 20 12 28 10 40 10 C 51 10 59 13 60 15 C 59 17 51 20 40 20 C 28 20 20 18 18 15 Z" fill="#e2e8f0" opacity="0.52"/>
      <!-- large triangular dorsal fin -->
      <path d="M 32 6 L 26 0 L 23 0 L 23 6 Z" fill="#5a6e80"/>
      <!-- secondary small dorsal fin -->
      <path d="M 44 6 L 42 3 L 47 6 Z" fill="#64748b" opacity="0.7"/>
      <!-- pectoral fins (swept back) -->
      <path d="M 44 18 L 54 26 L 43 23 Z" fill="#7c8fa0" opacity="0.78"/>
      <path d="M 42 17 L 34 24 L 42 22 Z" fill="#7c8fa0" opacity="0.5"/>
      <!-- gill slits (3 short lines) -->
      <path d="M 51 8  Q 49.5 15 51 22" stroke="#4a5e70" stroke-width="1.2" fill="none" opacity="0.4"/>
      <path d="M 54 9  Q 52.5 15 54 21" stroke="#4a5e70" stroke-width="0.9" fill="none" opacity="0.3"/>
      <!-- eye — cold, small relative to head -->
      <circle cx="57" cy="11" r="2.4" fill="#1c1917"/>
      <circle cx="57.8" cy="10.2" r="0.8" fill="white" opacity="0.7"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         BETTA (58×40) — jewel fish, huge flowing fan tail + ventral streamers
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'betta'" :style="{ filter: filterStyle }">
      <!-- large flowing fan tail — signature feature -->
      <g class="fish-tail fish-tail--flowing">
        <path d="M 18 20 L 1 3  L 11 16 L 2 28 L 14 23 Z" fill="#be123c"/>
        <path d="M 18 20 L 3 10 L 12 18 L 3 26 Z"         fill="#e11d48" opacity="0.45"/>
        <!-- tail fin rays -->
        <line x1="18" y1="20" x2="2"  y2="5"  stroke="#be123c" stroke-width="0.6" opacity="0.55"/>
        <line x1="18" y1="20" x2="2"  y2="13" stroke="#be123c" stroke-width="0.6" opacity="0.45"/>
        <line x1="18" y1="20" x2="2"  y2="20" stroke="#be123c" stroke-width="0.6" opacity="0.4"/>
        <line x1="18" y1="20" x2="2"  y2="27" stroke="#be123c" stroke-width="0.6" opacity="0.45"/>
        <line x1="18" y1="20" x2="3"  y2="35" stroke="#be123c" stroke-width="0.6" opacity="0.55"/>
      </g>
      <!-- body — compact, deep -->
      <path
        d="M 18 20 C 19 13 24 9 33 9 C 42 9 47 14 47 20 C 47 26 42 31 33 31 C 24 31 19 27 18 20 Z"
        fill="#9f1239"/>
      <!-- iridescent sheen -->
      <ellipse cx="34" cy="23" rx="11" ry="6.5" fill="#fda4af" opacity="0.18"/>
      <!-- tall dorsal fin -->
      <path d="M 24 9 C 22 4 28 2 34 3 C 40 4 43 7 42 9 Z" fill="#be123c" opacity="0.9"/>
      <!-- long flowing ventral fins (hallmark of betta) -->
      <path d="M 31 31 L 22 40 L 28 38 Z" fill="#9f1239" opacity="0.78"/>
      <path d="M 36 31 L 28 40 L 33 39 Z" fill="#be123c" opacity="0.6"/>
      <!-- pectoral fin -->
      <path d="M 37 26 L 45 33 L 37 31 Z" fill="#9f1239" opacity="0.72"/>
      <!-- gill line -->
      <path d="M 39 11 Q 37 20 39 29" stroke="#be123c" stroke-width="1.2" fill="none" opacity="0.38"/>
      <!-- eye -->
      <circle cx="43" cy="14" r="2.8" fill="#1c1917"/>
      <circle cx="44" cy="13" r="0.95" fill="white" opacity="0.85"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         CHERRY BARB (42×20) — slim, deep cherry-red, dark lateral stripe
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'cherry-barb'" :style="{ filter: filterStyle }">
      <g class="fish-tail">
        <path d="M 8 10 L 1 6 L 6 9 L 1 14 L 6 11 Z" fill="#7f1d1d"/>
      </g>
      <!-- body — slim streamlined torpedo -->
      <path
        d="M 8 10 C 9 6 15 3 24 3 C 32 3 38 6 38 10 C 38 14 32 17 24 17 C 15 17 9 14 8 10 Z"
        fill="#dc2626"/>
      <!-- belly highlight -->
      <ellipse cx="24" cy="12" rx="9" ry="3.5" fill="#fca5a5" opacity="0.3"/>
      <!-- dark lateral stripe (from snout to tail — characteristic) -->
      <path d="M 9 9 C 16 8 26 8 38 8.5 L 38 10 C 26 9.5 16 9.5 9 10.5 Z" fill="#7f1d1d" opacity="0.62"/>
      <!-- dorsal fin -->
      <path d="M 17 3 L 21 0 L 27 3 Z" fill="#b91c1c" opacity="0.88"/>
      <!-- anal fin -->
      <path d="M 20 17 L 23 20 L 26 17 Z" fill="#b91c1c" opacity="0.72"/>
      <!-- pectoral fin -->
      <path d="M 28 13 L 34 17 L 27 16 Z" fill="#ef4444" opacity="0.65"/>
      <!-- eye -->
      <circle cx="35" cy="7.5" r="2" fill="#1c1917"/>
      <circle cx="35.8" cy="6.8" r="0.7" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         GUPPY (48×30) — tiny body, enormous ornate fan tail
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'guppy'" :style="{ filter: filterStyle }">
      <!-- huge ornate fan tail — the defining feature -->
      <g class="fish-tail fish-tail--flowing">
        <path d="M 22 15 L 2 2  L 12 12 L 3 20 L 14 18 Z" fill="#1d4ed8"/>
        <path d="M 22 15 L 4 8  L 13 14 Z"                fill="#3b82f6" opacity="0.55"/>
        <path d="M 22 15 L 3 20 L 12 17 Z"                fill="#60a5fa" opacity="0.45"/>
        <path d="M 22 15 L 3 28 L 13 20 L 2 20 Z"         fill="#1d4ed8"/>
        <!-- fan rays -->
        <line x1="22" y1="15" x2="3"  y2="4"  stroke="#3b82f6" stroke-width="0.6" opacity="0.6"/>
        <line x1="22" y1="15" x2="2"  y2="11" stroke="#3b82f6" stroke-width="0.6" opacity="0.5"/>
        <line x1="22" y1="15" x2="2"  y2="15" stroke="#3b82f6" stroke-width="0.6" opacity="0.45"/>
        <line x1="22" y1="15" x2="2"  y2="20" stroke="#3b82f6" stroke-width="0.6" opacity="0.5"/>
        <line x1="22" y1="15" x2="3"  y2="27" stroke="#3b82f6" stroke-width="0.6" opacity="0.6"/>
      </g>
      <!-- body — small, more rounded toward snout -->
      <path
        d="M 22 15 C 23 10 27 7 33 7 C 39 7 44 11 44 15 C 44 19 39 23 33 23 C 27 23 23 20 22 15 Z"
        fill="#60a5fa"/>
      <!-- iridescent body shimmer -->
      <ellipse cx="34" cy="17" rx="8" ry="4.5" fill="#bfdbfe" opacity="0.42"/>
      <!-- dorsal fin -->
      <path d="M 26 7 L 28 4 L 35 6.5 L 34 7 Z" fill="#1d4ed8" opacity="0.88"/>
      <!-- anal fin (small) -->
      <path d="M 26 23 L 29 27 L 32 23 Z" fill="#1d4ed8" opacity="0.72"/>
      <!-- pectoral fin -->
      <path d="M 35 19 L 40 23 L 34 22 Z" fill="#3b82f6" opacity="0.68"/>
      <!-- eye -->
      <circle cx="40" cy="11" r="2.2" fill="#1c1917"/>
      <circle cx="40.8" cy="10.2" r="0.75" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         PEARL GOURAMI (54×30) — elongated oval, iridescent spots, feeler fins
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'pearl-gourami'" :style="{ filter: filterStyle }">
      <g class="fish-tail">
        <path d="M 13 15 L 3 9 L 11 14 L 3 21 L 11 16 Z" fill="#c2410c"/>
      </g>
      <!-- body — elongated oval, brownish-orange -->
      <path
        d="M 13 15 C 14 10 20 6 32 6 C 43 6 50 10 50 15 C 50 20 43 24 32 24 C 20 24 14 20 13 15 Z"
        fill="#c27803"/>
      <!-- belly highlight — lighter orange -->
      <ellipse cx="33" cy="18" rx="13" ry="5.5" fill="#fde68a" opacity="0.3"/>
      <!-- blue lateral stripe (characteristic marking) -->
      <path d="M 14 12 C 24 11 38 11 50 12 L 50 14 C 38 13 24 13 14 14 Z" fill="#1e40af" opacity="0.4"/>
      <!-- dorsal fin -->
      <path d="M 22 6 L 26 2 L 36 5 L 35 6 Z" fill="#92400e" opacity="0.82"/>
      <!-- anal fin -->
      <path d="M 18 24 C 20 28 28 28 32 24 Z" fill="#92400e" opacity="0.65"/>
      <!-- feeler / pelvic fins (distinctive threadlike fins) -->
      <path d="M 34 24 L 39 30" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M 30 24 L 33 29" stroke="#fbbf24" stroke-width="1.3" stroke-linecap="round" opacity="0.75"/>
      <!-- pectoral fin -->
      <path d="M 38 19 L 45 24 L 37 22 Z" fill="#c27803" opacity="0.7"/>
      <!-- gill arch -->
      <path d="M 44 8 Q 42 15 44 22" stroke="#92400e" stroke-width="1.1" fill="none" opacity="0.35"/>
      <!-- pearl spots (iridescent white — scattered rows) -->
      <circle cx="21" cy="11" r="1.1" fill="#fef9c3" opacity="0.82"/>
      <circle cx="26" cy="9.5" r="1.1" fill="#fef9c3" opacity="0.8"/>
      <circle cx="31" cy="9"   r="1.2" fill="#fef9c3" opacity="0.82"/>
      <circle cx="37" cy="10" r="1.1" fill="#fef9c3" opacity="0.78"/>
      <circle cx="42" cy="11" r="1.0" fill="#fef9c3" opacity="0.72"/>
      <circle cx="24" cy="15" r="1.0" fill="#fef9c3" opacity="0.75"/>
      <circle cx="29" cy="14" r="1.1" fill="#fef9c3" opacity="0.78"/>
      <circle cx="35" cy="14" r="1.0" fill="#fef9c3" opacity="0.75"/>
      <circle cx="40" cy="15" r="1.0" fill="#fef9c3" opacity="0.7"/>
      <circle cx="22" cy="19" r="0.9" fill="#fef9c3" opacity="0.65"/>
      <circle cx="28" cy="19" r="1.0" fill="#fef9c3" opacity="0.68"/>
      <circle cx="34" cy="20" r="0.9" fill="#fef9c3" opacity="0.65"/>
      <!-- eye -->
      <circle cx="46" cy="11" r="2.4" fill="#1c1917"/>
      <circle cx="46.9" cy="10.1" r="0.8" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         TIGER BARB (40×28) — tall oval, 4 black vertical bars, orange-gold
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'tiger-barb'" :style="{ filter: filterStyle }">
      <g class="fish-tail fish-tail--fast">
        <path d="M 9 14 L 1 8 L 7 13 L 1 20 L 7 15 Z" fill="#ea580c"/>
      </g>
      <!-- body — tall compressed oval (taller than wide) -->
      <path
        d="M 9 14 C 10 8 15 4 22 4 C 29 4 35 8 35 14 C 35 20 29 24 22 24 C 15 24 10 20 9 14 Z"
        fill="#fbbf24"/>
      <!-- orange-red tone on upper back -->
      <ellipse cx="23" cy="9" rx="10" ry="5" fill="#ea580c" opacity="0.28"/>
      <!-- silver-white belly -->
      <ellipse cx="23" cy="19" rx="9"  ry="4" fill="#fef3c7" opacity="0.45"/>
      <!-- 4 black vertical bars (the signature marking) -->
      <!-- bar 1 — at tail peduncle -->
      <path d="M 9.5 7.5 Q 11 14 9.5 20.5 L 11.5 20.5 Q 13 14 11.5 7.5 Z" fill="#0f172a" opacity="0.72"/>
      <!-- bar 2 — mid-rear -->
      <path d="M 16 4.5 Q 18 14 16 23.5 L 18.5 23.5 Q 20.5 14 18.5 4.5 Z" fill="#0f172a" opacity="0.72"/>
      <!-- bar 3 — mid-front (widest, most prominent) -->
      <path d="M 23 4 Q 25 14 23 24 L 26 24 Q 28 14 26 4 Z" fill="#0f172a" opacity="0.72"/>
      <!-- bar 4 — eye/gill bar -->
      <path d="M 30 5 Q 32 14 30 23 L 32.5 23 Q 34.5 14 32.5 5 Z" fill="#0f172a" opacity="0.65"/>
      <!-- dorsal fin — red-tipped -->
      <path d="M 12 4 L 16 0 L 28 3 L 29 4 Z" fill="#dc2626" opacity="0.9"/>
      <!-- anal fin — red -->
      <path d="M 13 24 L 16 28 L 26 28 L 27 24 Z" fill="#dc2626" opacity="0.78"/>
      <!-- pectoral fin -->
      <path d="M 27 18 L 33 22 L 26 21 Z" fill="#ea580c" opacity="0.65"/>
      <!-- eye -->
      <circle cx="32" cy="9" r="2.2" fill="#1c1917"/>
      <circle cx="32.8" cy="8.2" r="0.75" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         JEWEL CICHLID (50×32) — stocky red oval, teal jewel spots, long dorsal
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else-if="type === 'jewel-cichlid'" :style="{ filter: filterStyle }">
      <g class="fish-tail">
        <path d="M 12 16 L 2 9 L 10 15 L 2 23 L 10 17 Z" fill="#b91c1c"/>
      </g>
      <!-- body — stocky compact oval -->
      <path
        d="M 12 16 C 13 9 19 5 29 5 C 39 5 46 10 46 16 C 46 22 39 27 29 27 C 19 27 13 23 12 16 Z"
        fill="#ef4444"/>
      <!-- orange-yellow belly -->
      <ellipse cx="30" cy="21" rx="13" ry="5.5" fill="#fbbf24" opacity="0.35"/>
      <!-- long continuous dorsal fin (span most of back) -->
      <path d="M 13 5 L 18 1 L 38 1 L 43 5 Z" fill="#b91c1c" opacity="0.88"/>
      <!-- anal fin -->
      <path d="M 14 27 L 20 31 L 38 31 L 41 27 Z" fill="#b91c1c" opacity="0.6"/>
      <!-- pectoral fin -->
      <path d="M 34 21 L 42 27 L 33 25 Z" fill="#ef4444" opacity="0.7"/>
      <!-- gill arch -->
      <path d="M 41 7 Q 39 16 41 25" stroke="#b91c1c" stroke-width="1.2" fill="none" opacity="0.38"/>
      <!-- turquoise iridescent jewel spots (in rows) -->
      <circle cx="21" cy="12" r="1.4" fill="#14b8a6" opacity="0.92"/>
      <circle cx="26" cy="10" r="1.4" fill="#14b8a6" opacity="0.9"/>
      <circle cx="31" cy="9.5" r="1.4" fill="#14b8a6" opacity="0.9"/>
      <circle cx="37" cy="11" r="1.3" fill="#14b8a6" opacity="0.88"/>
      <circle cx="23" cy="17" r="1.2" fill="#2dd4bf" opacity="0.85"/>
      <circle cx="29" cy="16" r="1.3" fill="#2dd4bf" opacity="0.85"/>
      <circle cx="35" cy="17" r="1.2" fill="#2dd4bf" opacity="0.85"/>
      <circle cx="40" cy="18" r="1.1" fill="#2dd4bf" opacity="0.8"/>
      <circle cx="20" cy="21" r="1.0" fill="#5eead4" opacity="0.7"/>
      <circle cx="27" cy="22" r="1.1" fill="#5eead4" opacity="0.72"/>
      <circle cx="33" cy="22" r="1.0" fill="#5eead4" opacity="0.7"/>
      <!-- eye -->
      <circle cx="43" cy="11" r="2.5" fill="#1c1917"/>
      <circle cx="43.9" cy="10.1" r="0.85" fill="white" opacity="0.82"/>
    </g>

    <!-- ═══════════════════════════════════════════════════════════════════════
         FALLBACK — generic fish
    ═══════════════════════════════════════════════════════════════════════ -->
    <g v-else :style="{ filter: filterStyle }">
      <g class="fish-tail">
        <path d="M 14 14 L 2 8 L 11 13 L 2 20 Z" fill="#FF6B35"/>
      </g>
      <path d="M 14 14 C 15 8 20 5 28 5 C 36 5 42 9 42 14 C 42 19 36 23 28 23 C 20 23 15 20 14 14 Z" fill="#FF8C00"/>
      <path d="M 22 5 L 26 1 L 32 5 Z" fill="#FF6B35"/>
      <circle cx="37" cy="10" r="2.2" fill="#1c1917"/>
      <circle cx="37.8" cy="9.2" r="0.75" fill="white" opacity="0.82"/>
    </g>

  </svg>
</template>

<style scoped>
.fish-tail {
  transform-box: fill-box;
  transform-origin: right center;
  animation: tailSway 0.85s ease-in-out infinite alternate;
}

.fish-tail--fast     { animation-duration: 0.5s; }
.fish-tail--flowing  { animation-duration: 1.15s; }

@keyframes tailSway {
  from { transform: rotate(-8deg); }
  to   { transform: rotate(8deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fish-tail { animation: none; }
}
</style>

<script lang="ts">
export default { inheritAttrs: false }
</script>
