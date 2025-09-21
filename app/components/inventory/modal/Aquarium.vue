<script setup lang="ts">
import { useGameStore } from "~/stores/game";

const game = useGameStore();
const router = useRouter();

const { data: backgroundPaths, pending } = await useAsyncData(
  "backgrounds",
  () => $fetch<string[]>("/api/backgrounds")
);

function toLabel(path: string) {
  const filename = path.split("/").pop() ?? "";
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const aquariumBackgrounds = computed(() =>
  (backgroundPaths.value ?? [])
    .map((src) => ({
      src,
      label: toLabel(src),
      href: router.resolve({ path: src }).href,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
);

const selectedBackground = computed(() => game.background);
</script>

<template>
  <div class="h-full overflow-y-auto p-3 space-y-4">
    <div>
      <h3 class="text-sm mb-2">Background image</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <UCard
          v-for="bg in aquariumBackgrounds"
          :key="bg.src"
          class="p-2 cursor-pointer relative transition border border-default"
          :class="
            selectedBackground === bg.src
              ? 'ring-2 ring-info border-info'
              : 'hover:border-info/60'
          "
          @click="game.setBackground(bg.src)">
          <div class="relative">
            <img
              :src="bg.href"
              :alt="`${bg.label} preview`"
              class="w-full h-64 object-cover rounded" />
          </div>
          <UBadge
            v-if="selectedBackground === bg.src"
            color="info"
            class="absolute top-2 right-2"
            label="Active" />
        </UCard>
      </div>
      <p
        v-if="!pending && !aquariumBackgrounds.length"
        class="text-sm text-muted">
        Drop image files into <code>/public/backgrounds/</code> and they will
        appear here automatically.
      </p>
    </div>
  </div>
</template>
