<script setup lang="ts">
export type CoinTier =
  | "copper"
  | "silver"
  | "gold"
  | "note"
  | "bundle"
  | "silver-bar"
  | "gold-bar"
  | "chest"
  | "crown";

const props = defineProps<{ type: CoinTier }>();

const svgInner = computed(() => {
  switch (props.type) {
    case "copper":
      return `<circle cx="12" cy="12" r="10" fill="#b87333" stroke="#7a3b10" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="7.5" fill="none" stroke="#d4956a" stroke-width="0.7"/>
              <text x="12" y="16.5" text-anchor="middle" fill="#fff5e0" font-size="10" font-weight="bold" font-family="sans-serif">¢</text>`;
    case "silver":
      return `<circle cx="12" cy="12" r="10" fill="#c8cdd4" stroke="#8f9499" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="7.5" fill="none" stroke="#eef0f3" stroke-width="0.7"/>
              <text x="12" y="16.5" text-anchor="middle" fill="#4a5568" font-size="10" font-weight="bold" font-family="sans-serif">S</text>`;
    case "gold":
      return `<circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="7.5" fill="none" stroke="#fffacd" stroke-width="0.7"/>
              <text x="12" y="16.5" text-anchor="middle" fill="#7a4f00" font-size="11" font-weight="bold" font-family="sans-serif">$</text>`;
    case "note":
      return `<rect x="1" y="7" width="22" height="10" rx="2" fill="#2D6A4F" stroke="#1B4332" stroke-width="1"/>
              <rect x="3" y="9.5" width="4" height="5" rx="0.8" fill="#1B4332" opacity="0.6"/>
              <rect x="17" y="9.5" width="4" height="5" rx="0.8" fill="#1B4332" opacity="0.6"/>
              <circle cx="12" cy="12" r="2.8" fill="none" stroke="#52B788" stroke-width="1"/>
              <text x="12" y="15.5" text-anchor="middle" fill="#95D5B2" font-size="8" font-weight="bold" font-family="sans-serif">$</text>`;
    case "bundle":
      return `<rect x="1" y="12" width="22" height="7" rx="1.5" fill="#1B4332" stroke="#081C15" stroke-width="0.8"/>
              <rect x="1" y="8.5" width="22" height="7" rx="1.5" fill="#2D6A4F" stroke="#1B4332" stroke-width="0.8"/>
              <rect x="1" y="5" width="22" height="7" rx="1.5" fill="#52B788" stroke="#2D6A4F" stroke-width="0.8"/>
              <text x="12" y="11" text-anchor="middle" fill="#D8F3DC" font-size="5.5" font-weight="bold" font-family="sans-serif">$$$</text>`;
    case "silver-bar":
      return `<rect x="3" y="8" width="18" height="11" rx="2" fill="#CBD5E1" stroke="#94A3B8" stroke-width="1"/>
              <line x1="5" y1="11.5" x2="19" y2="11.5" stroke="#E2E8F0" stroke-width="1"/>
              <line x1="5" y1="14.5" x2="19" y2="14.5" stroke="#E2E8F0" stroke-width="1"/>
              <text x="12" y="20" text-anchor="middle" fill="#475569" font-size="4.5" font-family="sans-serif" font-style="italic">Ag</text>`;
    case "gold-bar":
      return `<rect x="3" y="8" width="18" height="11" rx="2" fill="#FDE68A" stroke="#D97706" stroke-width="1"/>
              <line x1="5" y1="11.5" x2="19" y2="11.5" stroke="#FFFBEB" stroke-width="1"/>
              <line x1="5" y1="14.5" x2="19" y2="14.5" stroke="#FFFBEB" stroke-width="1"/>
              <text x="12" y="20" text-anchor="middle" fill="#92400E" font-size="4.5" font-family="sans-serif" font-style="italic">Au</text>`;
    case "chest":
      return `<path d="M3 12 Q3 5.5 12 5.5 Q21 5.5 21 12 Z" fill="#A16207" stroke="#78350F" stroke-width="1"/>
              <path d="M3 12 Q3 8.5 12 8.5 Q21 8.5 21 12 Z" fill="#CA8A04"/>
              <rect x="3" y="12" width="18" height="8" rx="1" fill="#78350F" stroke="#451A03" stroke-width="0.8"/>
              <rect x="3" y="13.5" width="18" height="2.5" fill="#B45309"/>
              <rect x="9.5" y="10.5" width="5" height="4" rx="0.5" fill="#FCD34D" stroke="#B45309" stroke-width="0.5"/>
              <circle cx="7.5" cy="11" r="1.8" fill="#FBBF24"/>
              <circle cx="16.5" cy="11" r="1.8" fill="#FBBF24"/>`;
    case "crown":
      return `<path d="M2 19.5 L2 10 L7.5 15 L12 4.5 L16.5 15 L22 10 L22 19.5 Z" fill="#FCD34D" stroke="#D97706" stroke-width="1"/>
              <rect x="2" y="17.5" width="20" height="2.5" rx="0.5" fill="#D97706"/>
              <circle cx="12" cy="6.5" r="2" fill="#DC2626"/>
              <circle cx="2.5" cy="11" r="1.5" fill="#7C3AED"/>
              <circle cx="21.5" cy="11" r="1.5" fill="#7C3AED"/>
              <circle cx="7" cy="18.8" r="1" fill="#FEF08A"/>
              <circle cx="17" cy="18.8" r="1" fill="#FEF08A"/>`;
    default:
      return `<circle cx="12" cy="12" r="10" fill="#b87333" stroke="#7a3b10" stroke-width="1.5"/>`;
  }
});
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    v-html="svgInner"
    aria-hidden="true"
    class="shrink-0 drop-shadow-sm" />
</template>
