<script setup lang="ts">
const props = defineProps<{ count?: number }>()
const bubbles = ref<{ id: number; x: number; delay: number }[]>([])
onMounted(() => {
  const interval = setInterval(() => {
    const b = { id: Date.now() + Math.random(), x: Math.random() * 100, delay: Math.random() * 2 }
    bubbles.value = [...bubbles.value.slice(-10), b]
  }, 3000)
  onBeforeUnmount(() => clearInterval(interval))
})
</script>

<template>
  <div>
    <div v-for="b in bubbles" :key="b.id"
         class="absolute w-2 h-2 bg-white/30 rounded-full bubble-animation"
         :style="{ left: `${b.x}%`, animationDelay: `${b.delay}s`, animationDuration: '8s', zIndex: 1 }" />
  </div>
</template>

