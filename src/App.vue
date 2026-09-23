<script setup>
import { useRoute } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()

/* 鼠标视差：背景光斑随指针轻微反向位移，给页面增加空间层次感 */
let rafId = null
let latestX = 0
let latestY = 0

function applyParallax() {
  rafId = null
  const root = document.documentElement
  root.style.setProperty('--parallax-x', `${latestX * 22}px`)
  root.style.setProperty('--parallax-y', `${latestY * 22}px`)
}

function handleMouseMove(event) {
  latestX = event.clientX / window.innerWidth - 0.5
  latestY = event.clientY / window.innerHeight - 0.5
  if (rafId === null) {
    rafId = requestAnimationFrame(applyParallax)
  }
}

onMounted(() => {
  // 只在有精确指针的设备上启用（触屏设备跳过）
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
  }
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="app-layout">
    <div class="parallax-layer" aria-hidden="true"></div>

    <NavBar v-if="!route.meta.blank" />

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <AppFooter v-if="!route.meta.blank" />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}
</style>
