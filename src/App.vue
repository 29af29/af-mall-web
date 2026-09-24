<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const route = useRoute()

/* ---------------- 鼠标视差：背景光斑随指针轻微位移 ---------------- */
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

/* ---------------- 回到顶部（带滚动进度环） ---------------- */
const RADIUS = 19
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const showToTop = ref(false)
const scrollProgress = ref(0)

const ringOffset = computed(() => CIRCUMFERENCE * (1 - scrollProgress.value / 100))

function handleScroll() {
  const el = document.documentElement
  const max = el.scrollHeight - el.clientHeight
  showToTop.value = el.scrollTop > 400
  scrollProgress.value = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  // 只在有精确指针的设备上启用视差（触屏跳过）
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
  }
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('scroll', handleScroll)
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

    <transition name="to-top">
      <button
        v-if="showToTop && !route.meta.blank"
        class="to-top"
        title="回到顶部"
        @click="scrollToTop"
      >
        <svg class="to-top-ring" viewBox="0 0 44 44" aria-hidden="true">
          <circle class="ring-bg" cx="22" cy="22" :r="RADIUS" />
          <circle
            class="ring-progress"
            cx="22"
            cy="22"
            :r="RADIUS"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="ringOffset"
          />
        </svg>
        <el-icon :size="15"><Top /></el-icon>
      </button>
    </transition>
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

/* ---------------- 回到顶部 ---------------- */
.to-top {
  position: fixed;
  right: 34px;
  bottom: 44px;
  z-index: 90;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(31, 42, 71, 0.16);
  color: var(--brand-500);
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.25s ease;
}

.to-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(31, 42, 71, 0.22);
}

.to-top:active {
  transform: translateY(-1px) scale(0.96);
}

.to-top-ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 2;
}

.ring-progress {
  fill: none;
  stroke: var(--brand-500);
  stroke-width: 2;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.15s linear;
}

.to-top-enter-active,
.to-top-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.to-top-enter-from,
.to-top-leave-to {
  opacity: 0;
  transform: translate3d(0, 14px, 0) scale(0.9);
}

@media (max-width: 820px) {
  .to-top {
    right: 18px;
    bottom: 26px;
  }
}
</style>
