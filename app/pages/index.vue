<script setup lang="ts">
import { useIntervalFn } from "@vueuse/core";

definePageMeta({ colorMode: "dark" });

const game = useGameStore();
const toast = useToast();
useIntervalFn(() => game.tick(), 5000);

onMounted(() => {
  function onStorage(e: StorageEvent) {
    if (e.key === "aquarium-game") {
      toast.add({
        title: "Another tab is open",
        description: "Only one tab saves progress. Close other tabs to avoid losing coins.",
        color: "warning",
        duration: 0,
      });
    }
  }
  window.addEventListener("storage", onStorage);
  onUnmounted(() => window.removeEventListener("storage", onStorage));
});
</script>

<template>
  <div
    class="h-screen w-screen relative overflow-hidden bg-gradient-to-b from-blue-400 via-blue-600 to-blue-900 game-fade-in">
    <AquariumDisplay />
    <GameUI />
  </div>
</template>

<style scoped>
.game-fade-in {
  animation: gameFadeIn 0.3s ease both;
}
@keyframes gameFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
