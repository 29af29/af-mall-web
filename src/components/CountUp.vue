<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { formatPrice } from '@/utils/format'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  duration: { type: Number, default: 620 }
})

const display = ref(0)
let rafId = null

function animate(from, to) {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion || from === to) {
    display.value = to
    return
  }

  const startTime = performance.now()

  const step = (now) => {
    const progress = Math.min((now - startTime) / props.duration, 1)
    // easeOutCubic：起步快、收尾稳
    const eased = 1 - Math.pow(1 - progress, 3)
    display.value = from + (to - from) * eased

    if (progress < 1) {
      rafId = requestAnimationFrame(step)
    } else {
      rafId = null
    }
  }

  rafId = requestAnimationFrame(step)
}

onMounted(() => {
  animate(0, Number(props.value) || 0)
})

watch(
  () => props.value,
  (to, from) => {
    animate(Number(from) || 0, Number(to) || 0)
  }
)

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <span class="count-up">{{ formatPrice(Math.round(display)) }}</span>
</template>

<style scoped>
.count-up {
  font-variant-numeric: tabular-nums;
}
</style>
