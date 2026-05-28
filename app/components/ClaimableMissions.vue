<script setup lang="ts">
const game = useGameStore();
const toast = useToast();

const claimable = computed(() =>
  game.dailyState.missions
    .map((m) => {
      const def = MISSION_POOL.find((d) => d.id === m.id);
      return def && !m.claimed && m.progress >= def.goal
        ? { ...def, progress: m.progress }
        : null;
    })
    .filter(Boolean) as (typeof MISSION_POOL[number] & { progress: number })[]
);

function claim(id: string) {
  const reward = game.claimMission(id);
  if (reward > 0) {
    toast.add({ title: `Mission complete! +${reward} coins`, color: "success", duration: 2500 });
  }
}
</script>

<template>
  <TransitionGroup
    tag="div"
    name="mission"
    class="fixed right-4 bottom-24 z-40 flex flex-col-reverse gap-2 items-end pointer-events-none">
    <div
      v-for="m in claimable"
      :key="m.id"
      class="flex items-center gap-3 rounded-2xl pl-4 pr-3 py-3 pointer-events-auto"
      style="background: rgba(2,6,23,0.96); border: 1px solid rgba(234,179,8,0.35); box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(234,179,8,0.08); backdrop-filter: blur(12px); min-width: 220px;">
      <span class="text-2xl leading-none shrink-0">{{ m.icon }}</span>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white leading-tight">{{ m.title }}</p>
        <p class="text-xs text-white/45 leading-snug">{{ m.desc }}</p>
      </div>
      <UButton
        color="warning"
        variant="soft"
        size="sm"
        :label="`+${m.reward}`"
        @click="claim(m.id)" />
    </div>
  </TransitionGroup>
</template>

<style scoped>
.mission-enter-active {
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}
.mission-leave-active {
  transition: transform 250ms ease-in, opacity 250ms ease-in;
}
.mission-enter-from {
  transform: translateX(110%);
  opacity: 0;
}
.mission-leave-to {
  transform: translateX(110%);
  opacity: 0;
}
</style>
