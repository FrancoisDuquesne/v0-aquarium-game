<script setup lang="ts">
import { useIntervalFn } from "@vueuse/core";

definePageMeta({ colorMode: "dark" });

const game = useGameStore();
onMounted(() => game.load());
useIntervalFn(() => game.tick(), 5000);
</script>

<template>
  <div
    class="h-screen w-screen relative overflow-hidden bg-gradient-to-b from-blue-400 via-blue-600 to-blue-900">
    <AquariumDisplay />
    <GameUI />
  </div>
</template>
