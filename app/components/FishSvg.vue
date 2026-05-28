<script setup lang="ts">
const props = defineProps<{ type: string; width?: number; height?: number; class?: string }>()

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
</script>

<template>
  <svg :width="width" :height="height" :viewBox="viewBox" :class="props.class" pointer-events="none" overflow="visible">

    <!-- ── Goldfish (56×36) ─── round fancy goldfish, orange ──────────────── -->
    <g v-if="type === 'goldfish'">
      <!-- double veil tail -->
      <g class="fish-tail">
        <path d="M18 18 L3 8 L14 17 L3 28 Z" fill="#c2410c"/>
        <path d="M18 18 L5 12 L13 18 L5 24 Z" fill="#f97316" opacity="0.55"/>
      </g>
      <!-- body -->
      <ellipse cx="33" cy="18" rx="16" ry="11" fill="#f97316"/>
      <!-- belly sheen -->
      <ellipse cx="34" cy="21" rx="10" ry="7" fill="#fde68a" opacity="0.35"/>
      <!-- dorsal fin — attached to body top (y=7) -->
      <path d="M23 7 C21 2 27 0 33 1 C38 2 40 5 39 7 Z" fill="#c2410c"/>
      <!-- pectoral fin -->
      <path d="M36 22 L44 28 L36 26 Z" fill="#fb923c" opacity="0.75"/>
      <!-- gill line -->
      <path d="M39 9 Q37 18 39 27" stroke="#ea580c" stroke-width="1" fill="none" opacity="0.35"/>
      <!-- eye -->
      <circle cx="44" cy="12" r="2.5" fill="#1c1917"/>
      <circle cx="44.8" cy="11.2" r="0.8" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Angelfish (42×56) ─── tall disc, silver with stripes ─────────── -->
    <g v-else-if="type === 'angelfish'">
      <!-- tall dorsal fin -->
      <path d="M36 18 Q30 5 22 3 Q14 5 12 13 L15 16 Q18 7 22 5 Q29 7 34 17 Z" fill="#64748b" opacity="0.85"/>
      <!-- tall anal fin (bottom) -->
      <path d="M36 38 Q30 51 22 53 Q14 51 12 43 L15 40 Q18 49 22 51 Q29 49 34 39 Z" fill="#64748b" opacity="0.85"/>
      <!-- tail -->
      <g class="fish-tail fish-tail--flowing">
        <path d="M14 28 L2 21 L13 27 Z" fill="#94a3b8"/>
        <path d="M14 28 L2 35 L13 29 Z" fill="#94a3b8"/>
      </g>
      <!-- body -->
      <ellipse cx="26" cy="28" rx="13" ry="15" fill="#c8d1da"/>
      <ellipse cx="26" cy="28" rx="8" ry="10" fill="#e2e8f0" opacity="0.45"/>
      <!-- stripes -->
      <path d="M32 14 Q34 28 32 42" stroke="#334155" stroke-width="2.5" fill="none" opacity="0.45"/>
      <path d="M24 13 Q26 28 24 43" stroke="#334155" stroke-width="2.5" fill="none" opacity="0.45"/>
      <!-- pectoral fin -->
      <path d="M30 32 L37 38 L29 37 Z" fill="#94a3b8" opacity="0.7"/>
      <!-- eye -->
      <circle cx="33" cy="22" r="2.5" fill="#1e293b"/>
      <circle cx="33.8" cy="21.2" r="0.8" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Neon Tetra (44×18) ─── slender, teal stripe + red rear ─────── -->
    <g v-else-if="type === 'neon'">
      <g class="fish-tail fish-tail--fast">
        <path d="M8 9 L1 5 L7 9 L1 13 Z" fill="#0891b2"/>
      </g>
      <!-- body -->
      <ellipse cx="25" cy="9" rx="18" ry="5.5" fill="#f0f9ff"/>
      <!-- metallic blue stripe along top half -->
      <path d="M8 5.5 Q24 4.5 42 5.5 L42 7.5 Q24 7 8 7.5 Z" fill="#06b6d4"/>
      <!-- red lower-rear stripe -->
      <path d="M8 9.5 Q14 10 22 11 L22 12.5 Q14 12 8 11 Z" fill="#f43f5e" opacity="0.9"/>
      <!-- small dorsal fin -->
      <path d="M21 3.5 L25 1 L30 3.5 Z" fill="#0e7490" opacity="0.85"/>
      <!-- eye -->
      <circle cx="38" cy="7" r="2" fill="#1c1917"/>
      <circle cx="38.6" cy="6.4" r="0.7" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Tropical / Clownfish (48×30) ─── orange with white bands ────── -->
    <g v-else-if="type === 'tropical'">
      <g class="fish-tail">
        <path d="M11 15 L2 9 L9 14 L2 21 Z" fill="#ea580c"/>
      </g>
      <!-- body -->
      <ellipse cx="28" cy="15" rx="17" ry="11" fill="#f97316"/>
      <!-- white band 1 (mid-body) -->
      <path d="M22 4 Q20 15 22 26 L25 26 Q23 15 25 4 Z" fill="white" opacity="0.95"/>
      <path d="M21.2 4 Q19.2 15 21.2 26 L22 26 Q20 15 22 4 Z" fill="#1c1917" opacity="0.45"/>
      <path d="M25 4 Q23 15 25 26 L25.8 26 Q23.8 15 25.8 4 Z" fill="#1c1917" opacity="0.45"/>
      <!-- white band 2 (through eye area) -->
      <path d="M37 5 Q35 15 37 25 L40 25 Q38 15 40 5 Z" fill="white" opacity="0.9"/>
      <path d="M36.2 5 Q34.2 15 36.2 25 L37 25 Q35 15 37 5 Z" fill="#1c1917" opacity="0.4"/>
      <path d="M40 5 Q38 15 40 25 L40.8 25 Q38.8 15 40.8 5 Z" fill="#1c1917" opacity="0.4"/>
      <!-- dorsal fin -->
      <path d="M19 4 L21 0 L32 0 L34 4 Z" fill="#c2410c" opacity="0.9"/>
      <!-- anal fin -->
      <path d="M23 26 L25 30 L30 26 Z" fill="#c2410c" opacity="0.8"/>
      <!-- pectoral fin -->
      <path d="M34 19 L42 24 L34 23 Z" fill="#fb923c" opacity="0.7"/>
      <!-- eye -->
      <circle cx="41" cy="10" r="2.5" fill="#1c1917"/>
      <circle cx="41.8" cy="9.2" r="0.8" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Shark (64×30) ─── torpedo, large dorsal fin ───────────────────── -->
    <g v-else-if="type === 'shark'">
      <!-- asymmetric caudal fin (upper lobe larger) -->
      <g class="fish-tail fish-tail--fast">
        <path d="M16 15 L2 7 L14 14 Z" fill="#64748b"/>
        <path d="M16 15 L4 21 L14 16 Z" fill="#64748b" opacity="0.7"/>
      </g>
      <!-- body -->
      <path d="M59 15 Q52 6 36 6 Q16 6 16 15 Q16 24 36 24 Q52 24 59 15 Z" fill="#94a3b8"/>
      <!-- white belly -->
      <path d="M57 15 Q50 10 36 10 Q19 11 18 15 Q19 20 36 21 Q50 21 57 15 Z" fill="#e2e8f0" opacity="0.55"/>
      <!-- large dorsal fin -->
      <path d="M24 6 L20 0 L16 0 L16 6 Z" fill="#64748b"/>
      <!-- pectoral fin -->
      <path d="M44 17 L52 26 L42 23 Z" fill="#94a3b8" opacity="0.75"/>
      <!-- gill slit -->
      <path d="M50 8 Q48 15 50 22" stroke="#475569" stroke-width="1.5" fill="none" opacity="0.35"/>
      <!-- eye -->
      <circle cx="54" cy="11" r="2" fill="#1c1917"/>
      <circle cx="54.6" cy="10.4" r="0.7" fill="white" opacity="0.7"/>
    </g>

    <!-- ── Betta (58×40) ─── jewel fish, long flowing fins ───────────────── -->
    <g v-else-if="type === 'betta'">
      <!-- long flowing tail -->
      <g class="fish-tail fish-tail--flowing">
        <path d="M15 20 L1 6 L13 17 L3 29 L15 22 Z" fill="#be123c"/>
        <path d="M15 20 L3 14 L12 20 L3 26 Z" fill="#e11d48" opacity="0.5"/>
      </g>
      <!-- body -->
      <ellipse cx="33" cy="20" rx="17" ry="10" fill="#9b1b30"/>
      <!-- iridescent sheen -->
      <ellipse cx="34" cy="22" rx="11" ry="6" fill="#fda4af" opacity="0.18"/>
      <!-- tall dorsal fin -->
      <path d="M25 10 C23 4 29 2 35 3 C40 4 43 7 42 10 Z" fill="#be123c" opacity="0.9"/>
      <!-- pectoral fin -->
      <path d="M37 27 L45 34 L37 32 Z" fill="#9b1b30" opacity="0.75"/>
      <!-- gill line -->
      <path d="M39 12 Q37 20 39 28" stroke="#be123c" stroke-width="1.2" fill="none" opacity="0.4"/>
      <!-- eye -->
      <circle cx="44" cy="14" r="2.5" fill="#1c1917"/>
      <circle cx="44.8" cy="13.2" r="0.8" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Cherry Barb (42×20) ─── slender, deep red ─────────────────────── -->
    <g v-else-if="type === 'cherry-barb'">
      <g class="fish-tail">
        <path d="M8 10 L1 6 L6 10 L1 14 Z" fill="#991b1b"/>
      </g>
      <!-- body -->
      <ellipse cx="24" cy="10" rx="17" ry="6" fill="#dc2626"/>
      <!-- lateral line -->
      <path d="M8 9 L39 9" stroke="#7f1d1d" stroke-width="1.2" opacity="0.55"/>
      <!-- dorsal fin -->
      <path d="M18 4 L22 1 L28 4 Z" fill="#b91c1c" opacity="0.9"/>
      <!-- anal fin -->
      <path d="M21 16 L24 19 L27 16 Z" fill="#b91c1c" opacity="0.75"/>
      <!-- eye -->
      <circle cx="36" cy="7" r="1.8" fill="#1c1917"/>
      <circle cx="36.6" cy="6.4" r="0.6" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Guppy (48×30) ─── small body, large ornate fan tail ──────────── -->
    <g v-else-if="type === 'guppy'">
      <!-- large fan tail — guppy's defining feature -->
      <g class="fish-tail fish-tail--flowing">
        <path d="M16 15 L2 4 L13 12 L3 24 L16 17 Z" fill="#2563eb"/>
        <path d="M16 15 L5 9 L13 15 L5 21 Z" fill="#60a5fa" opacity="0.55"/>
      </g>
      <!-- body (smaller relative to tail) -->
      <ellipse cx="31" cy="15" rx="14" ry="8" fill="#60a5fa"/>
      <ellipse cx="32" cy="17" rx="9" ry="5" fill="#bfdbfe" opacity="0.4"/>
      <!-- dorsal fin -->
      <path d="M25 7 L27 4 L34 6 L33 7 Z" fill="#1d4ed8" opacity="0.9"/>
      <!-- anal fin -->
      <path d="M26 23 L29 27 L32 23 Z" fill="#1d4ed8" opacity="0.75"/>
      <!-- eye -->
      <circle cx="40" cy="11" r="2" fill="#1c1917"/>
      <circle cx="40.6" cy="10.4" r="0.7" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Pearl Gourami (54×30) ─── oval, pearl spots, feeler fins ──────── -->
    <g v-else-if="type === 'pearl-gourami'">
      <g class="fish-tail">
        <path d="M13 15 L3 9 L11 14 L3 21 Z" fill="#60a5fa"/>
      </g>
      <!-- body -->
      <ellipse cx="31" cy="15" rx="18" ry="9" fill="#7dd3fc"/>
      <ellipse cx="32" cy="17" rx="12" ry="6" fill="#bfdbfe" opacity="0.35"/>
      <!-- dark lateral band -->
      <path d="M13 12 Q31 10 49 12 L49 14 Q31 12 13 14 Z" fill="#0369a1" opacity="0.35"/>
      <!-- dorsal fin -->
      <path d="M22 6 L25 2 L35 5 L34 6 Z" fill="#2563eb" opacity="0.75"/>
      <!-- feeler fins (elongated pelvic fins) -->
      <path d="M34 24 L38 30" stroke="#7dd3fc" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M30 24 L32 29" stroke="#93c5fd" stroke-width="1" stroke-linecap="round" opacity="0.75"/>
      <!-- pearl spots -->
      <circle cx="22" cy="12" r="1.1" fill="#e0f2fe" opacity="0.8"/>
      <circle cx="27" cy="10" r="1.1" fill="#e0f2fe" opacity="0.8"/>
      <circle cx="33" cy="11" r="1.1" fill="#e0f2fe" opacity="0.8"/>
      <circle cx="38" cy="13" r="1.1" fill="#e0f2fe" opacity="0.8"/>
      <circle cx="29" cy="16" r="1"   fill="#e0f2fe" opacity="0.75"/>
      <circle cx="35" cy="17" r="1"   fill="#e0f2fe" opacity="0.75"/>
      <circle cx="24" cy="17" r="0.9" fill="#e0f2fe" opacity="0.7"/>
      <!-- eye -->
      <circle cx="44" cy="11" r="2" fill="#1c1917"/>
      <circle cx="44.6" cy="10.4" r="0.7" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Tiger Barb (40×28) ─── orange oval, 4 black vertical bars ─────── -->
    <g v-else-if="type === 'tiger-barb'">
      <g class="fish-tail fish-tail--fast">
        <path d="M9 14 L1 8 L7 13 L1 20 Z" fill="#ea580c"/>
      </g>
      <!-- body (tall oval) -->
      <ellipse cx="22" cy="14" rx="14" ry="10" fill="#fbbf24"/>
      <!-- 4 black vertical bars -->
      <path d="M22 4 L22 24" stroke="#1c1917" stroke-width="3"   opacity="0.7"/>
      <path d="M27 4 L27 24" stroke="#1c1917" stroke-width="3"   opacity="0.7"/>
      <path d="M16 5 L16 23" stroke="#1c1917" stroke-width="2.5" opacity="0.6"/>
      <path d="M11 7 L11 21" stroke="#1c1917" stroke-width="2"   opacity="0.5"/>
      <!-- dorsal fin (red-tipped) -->
      <path d="M14 4 L18 0 L26 3 L27 4 Z" fill="#dc2626" opacity="0.9"/>
      <!-- anal fin -->
      <path d="M16 24 L19 28 L24 24 Z" fill="#dc2626" opacity="0.8"/>
      <!-- eye -->
      <circle cx="32" cy="9" r="2" fill="#1c1917"/>
      <circle cx="32.6" cy="8.4" r="0.7" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Jewel Cichlid (50×32) ─── red body, turquoise jewel spots ──────── -->
    <g v-else-if="type === 'jewel-cichlid'">
      <g class="fish-tail">
        <path d="M12 16 L2 10 L10 15 L2 22 Z" fill="#b91c1c"/>
      </g>
      <!-- body -->
      <ellipse cx="29" cy="16" rx="18" ry="10" fill="#ef4444"/>
      <ellipse cx="30" cy="18" rx="12" ry="7" fill="#fca5a5" opacity="0.25"/>
      <!-- continuous dorsal fin running along back -->
      <path d="M13 6 L18 2 L36 2 L42 6 Z" fill="#b91c1c" opacity="0.85"/>
      <!-- anal fin -->
      <path d="M15 26 L20 30 L36 30 L40 26 Z" fill="#b91c1c" opacity="0.6"/>
      <!-- turquoise jewel spots (iridescent) -->
      <circle cx="22" cy="13" r="1.2" fill="#2dd4bf" opacity="0.9"/>
      <circle cx="27" cy="11" r="1.2" fill="#2dd4bf" opacity="0.9"/>
      <circle cx="33" cy="12" r="1.2" fill="#2dd4bf" opacity="0.9"/>
      <circle cx="38" cy="14" r="1.2" fill="#2dd4bf" opacity="0.9"/>
      <circle cx="25" cy="17" r="1"   fill="#2dd4bf" opacity="0.8"/>
      <circle cx="32" cy="19" r="1"   fill="#2dd4bf" opacity="0.8"/>
      <circle cx="38" cy="18" r="1"   fill="#2dd4bf" opacity="0.8"/>
      <!-- gill line -->
      <path d="M41 8 Q39 16 41 24" stroke="#b91c1c" stroke-width="1.2" fill="none" opacity="0.4"/>
      <!-- eye -->
      <circle cx="43" cy="11" r="2.2" fill="#1c1917"/>
      <circle cx="43.7" cy="10.3" r="0.7" fill="white" opacity="0.8"/>
    </g>

    <!-- ── Fallback ──────────────────────────────────────────────────────── -->
    <g v-else>
      <g class="fish-tail">
        <path d="M14 14 L2 8 L11 14 L2 20 Z" fill="#FF6B35"/>
      </g>
      <ellipse cx="29" cy="14" rx="16" ry="10" fill="#FF8C00"/>
      <path d="M22 4 L26 0 L32 4 Z" fill="#FF6B35"/>
      <circle cx="39" cy="10" r="2" fill="#1c1917"/>
      <circle cx="39.6" cy="9.4" r="0.7" fill="white" opacity="0.8"/>
    </g>

  </svg>
</template>

<style scoped>
.fish-tail {
  transform-box: fill-box;
  transform-origin: right center;
  animation: tailSway 0.85s ease-in-out infinite alternate;
}

.fish-tail--fast     { animation-duration: 0.55s; }
.fish-tail--flowing  { animation-duration: 1.1s; }

@keyframes tailSway {
  from { transform: rotate(-9deg); }
  to   { transform: rotate(9deg); }
}

@media (prefers-reduced-motion: reduce) {
  .fish-tail { animation: none; }
}
</style>

<script lang="ts">
export default { inheritAttrs: false }
</script>
