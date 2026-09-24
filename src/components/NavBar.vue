<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { cartApi, notifyApi, searchApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const keyword = ref('')
const cartCount = ref(0)
const unreadCount = ref(0)
const scrolled = ref(false)
const cartPop = ref(false)

/* 搜索联想 */
const suggestions = ref([])
const showSuggest = ref(false)
const activeIndex = ref(-1)
let suggestTimer = null

const isLogin = computed(() => userStore.isLogin)
const nickname = computed(() => userStore.nickname)

const navs = [
  { label: '首页', to: '/' },
  { label: '全部分类', hash: 'category' },
  { label: '热门推荐', hash: 'recommend' },
  { label: '我的订单', to: '/order', auth: true }
]

function goHome() {
  keyword.value = ''
  router.push('/')
}

function doSearch() {
  const key = keyword.value.trim()
  closeSuggest()
  router.push({ path: '/', query: key ? { key } : {} })
}

/* ---------------- 搜索联想 ---------------- */
async function fetchSuggest() {
  const kw = keyword.value.trim()
  if (!kw) {
    suggestions.value = []
    showSuggest.value = false
    return
  }
  try {
    const data = await searchApi.suggest(kw)
    suggestions.value = Array.isArray(data) ? data.slice(0, 8) : []
    showSuggest.value = suggestions.value.length > 0
    activeIndex.value = -1
  } catch (e) {
    suggestions.value = []
    showSuggest.value = false
  }
}

/** 输入防抖：300ms 内不再输入才发请求 */
function onInput() {
  clearTimeout(suggestTimer)
  suggestTimer = setTimeout(fetchSuggest, 300)
}

function pickSuggestion(text) {
  keyword.value = text
  doSearch()
}

function onSearchKeydown(event) {
  if (!showSuggest.value || !suggestions.value.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value =
      (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Escape') {
    closeSuggest()
  }
}

function onSearchEnter() {
  if (showSuggest.value && activeIndex.value >= 0) {
    pickSuggestion(suggestions.value[activeIndex.value])
    return
  }
  doSearch()
}

function closeSuggest() {
  showSuggest.value = false
  activeIndex.value = -1
}

function onSearchBlur() {
  // 延迟关闭，保证候选词的点击能先触发
  window.setTimeout(closeSuggest, 150)
}

function requireLogin() {
  if (isLogin.value) return true
  router.push({ path: '/login', query: { redirect: route.fullPath } })
  return false
}

function onNav(item) {
  if (item.auth && !requireLogin()) return

  if (item.hash) {
    const scroll = () => {
      const el = document.getElementById(item.hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (route.path === '/') {
      scroll()
    } else {
      router.push({ path: '/', hash: '#' + item.hash })
    }
    return
  }

  router.push(item.to)
}

function goCart() {
  if (requireLogin()) router.push('/cart')
}

function goNotify() {
  if (requireLogin()) router.push('/notify')
}

function goOrder() {
  if (requireLogin()) router.push('/order')
}

function goLogin() {
  router.push('/login')
}

function logout() {
  userStore.logout()
  cartCount.value = 0
  unreadCount.value = 0
  ElMessage.success('已退出登录')
  router.push('/')
}

async function loadBadge() {
  if (!isLogin.value) {
    cartCount.value = 0
    unreadCount.value = 0
    return
  }
  try {
    const [count, unread] = await Promise.all([cartApi.count(), notifyApi.unread()])
    cartCount.value = count || 0
    unreadCount.value = unread || 0
  } catch (e) {
    /* 角标失败不影响导航使用 */
  }
}

/* 滚动收缩：滚过 40px 后导航变矮、阴影加深 */
function handleScroll() {
  scrolled.value = window.scrollY > 40
}

/* 加购成功（飞入动画落点）：刷新角标并让角标弹一下 */
function handleCartAdded() {
  loadBadge()
  cartPop.value = false
  requestAnimationFrame(() => {
    cartPop.value = true
  })
  window.setTimeout(() => {
    cartPop.value = false
  }, 520)
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('cart:added', handleCartAdded)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('cart:added', handleCartAdded)
})

watch(() => route.fullPath, loadBadge, { immediate: true })
watch(() => userStore.token, loadBadge)
</script>

<template>
  <header class="navbar" :class="{ scrolled }">
    <div class="container navbar-inner">
      <div class="logo" @click="goHome">
        <span class="logo-mark"></span>
        <span class="logo-text">阿飞商城</span>
      </div>

      <nav class="navs">
        <span
          v-for="item in navs"
          :key="item.label"
          class="nav-item"
          :class="{ active: item.to && route.path === item.to }"
          @click="onNav(item)"
        >
          {{ item.label }}
        </span>
      </nav>

      <div class="search">
        <el-input
          v-model="keyword"
          placeholder="搜索商品、品牌…"
          clearable
          @input="onInput"
          @focus="onInput"
          @keydown="onSearchKeydown"
          @keyup.enter="onSearchEnter"
          @blur="onSearchBlur"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <transition name="suggest">
          <div v-if="showSuggest && suggestions.length" class="suggest-panel">
            <div
              v-for="(s, i) in suggestions"
              :key="s"
              class="suggest-item"
              :class="{ active: i === activeIndex }"
              @mousedown.prevent="pickSuggestion(s)"
            >
              <el-icon :size="13"><Search /></el-icon>
              <span class="suggest-text">{{ s }}</span>
            </div>
          </div>
        </transition>
      </div>

      <div class="actions">
        <div class="action" title="通知中心" @click="goNotify">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
            <el-icon :size="19"><Bell /></el-icon>
          </el-badge>
        </div>

        <div class="action" title="购物车" data-cart-anchor @click="goCart">
          <el-badge
            :value="cartCount"
            :hidden="cartCount === 0"
            :max="99"
            :class="{ 'badge-pop': cartPop }"
          >
            <el-icon :size="19"><ShoppingCart /></el-icon>
          </el-badge>
        </div>

        <el-dropdown v-if="isLogin" trigger="click">
          <span class="user-entry">
            <span class="avatar">{{ nickname.slice(0, 1) }}</span>
            <span class="nickname">{{ nickname }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="goOrder">我的订单</el-dropdown-item>
              <el-dropdown-item @click="goNotify">通知中心</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button v-else type="primary" round size="small" @click="goLogin">
          登录 / 注册
        </el-button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

/* 滚动收缩态 */
.navbar.scrolled {
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 4px 22px rgba(31, 42, 71, 0.07);
}

.navbar-inner {
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 28px;
  transition: height 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.navbar.scrolled .navbar-inner {
  height: 56px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}

.logo-mark {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--brand-gradient);
  box-shadow: 0 4px 12px rgba(91, 111, 216, 0.3);
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo:hover .logo-mark {
  transform: rotate(-8deg) scale(1.06);
}

.logo-mark::after {
  content: '';
  position: absolute;
  top: 9px;
  left: 9px;
  width: 14px;
  height: 14px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.85);
}

.logo-text {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-title);
}

.navs {
  display: flex;
  align-items: center;
  gap: 26px;
}

.nav-item {
  position: relative;
  padding: 6px 0;
  font-size: 14px;
  color: var(--text-body);
  cursor: pointer;
  transition: color 0.2s ease;
}

.nav-item::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--brand-gradient);
  transform: scaleX(0);
  transition: transform 0.25s ease;
}

.nav-item:hover,
.nav-item.active {
  color: var(--brand-500);
}

.nav-item:hover::after,
.nav-item.active::after {
  transform: scaleX(1);
}

.search {
  position: relative;
  flex: 1;
  max-width: 300px;
  margin-left: auto;
  transition: max-width 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* ---------------- 搜索联想下拉 ---------------- */
.suggest-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 200;
  padding: 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.97);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  box-shadow: 0 14px 36px rgba(31, 42, 71, 0.14);
}

.suggest-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-body);
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.suggest-item:hover,
.suggest-item.active {
  background: var(--brand-soft);
  color: var(--brand-500);
}

.suggest-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-enter-active,
.suggest-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.suggest-enter-from,
.suggest-leave-to {
  opacity: 0;
  transform: translate3d(0, -6px, 0);
}

.search:focus-within {
  max-width: 380px;
}

.search :deep(.el-input__wrapper) {
  padding: 3px 14px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px var(--border) inset;
  transition: box-shadow 0.2s ease;
}

.search :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border-strong) inset;
}

.search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--brand-400) inset;
}

.actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action {
  display: flex;
  align-items: center;
  color: var(--text-body);
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.action:hover {
  color: var(--brand-500);
  transform: translateY(-2px);
}

/* 加购后角标弹跳（保留 Element Plus 自身的位移，只叠加缩放） */
.badge-pop :deep(.el-badge__content) {
  animation: badge-pop 0.52s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop {
  0% {
    transform: translateY(-50%) translateX(100%) scale(1);
  }
  35% {
    transform: translateY(-50%) translateX(100%) scale(1.55);
  }
  100% {
    transform: translateY(-50%) translateX(100%) scale(1);
  }
}

.user-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  outline: none;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-on-brand);
  background: var(--brand-gradient);
  transition: box-shadow 0.25s ease;
}

.user-entry:hover .avatar {
  box-shadow: 0 0 0 3px rgba(91, 111, 216, 0.18);
}

.nickname {
  font-size: 13px;
  color: var(--text-title);
}

@media (max-width: 1100px) {
  .navs {
    display: none;
  }
}

@media (max-width: 820px) {
  .search {
    max-width: 160px;
  }
  .nickname {
    display: none;
  }
}
</style>
