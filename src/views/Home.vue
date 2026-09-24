<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { productApi, searchApi, cartApi } from '@/api'
import { useUserStore } from '@/store/user'
import { formatPrice } from '@/utils/format'
import ProductCard from '@/components/ProductCard.vue'
import SectionHeader from '@/components/SectionHeader.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const goodsList = ref([])
const categories = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 8
const loading = ref(false)
const showSkeleton = ref(false)
const hasLoaded = ref(false)
const keyword = ref('')
const categoryId = ref(null)
const categoryName = ref('')
let skeletonTimer = null

const services = [
  { icon: 'Goods', title: '正品保障', desc: '官方授权 假一赔十' },
  { icon: 'RefreshLeft', title: '7天无理由', desc: '不满意随时退换' },
  { icon: 'Van', title: '快速配送', desc: '当日下单 次日送达' },
  { icon: 'Service', title: '贴心客服', desc: '7×24 小时在线' }
]

const searching = computed(() => !!keyword.value.trim())

const filtering = computed(() => categoryId.value != null)

const sectionTitle = computed(() => {
  if (searching.value) return `“${keyword.value}” 的搜索结果`
  if (filtering.value) return categoryName.value || '分类商品'
  return '热门推荐'
})

const subtitle = computed(() => {
  if (searching.value) return ''
  if (filtering.value) return '该分类下的全部商品'
  return '为你精心挑选的好物'
})

const heroProduct = computed(() => goodsList.value[0] || null)

const heroPrice = computed(() =>
  heroProduct.value ? formatPrice(heroProduct.value.minPrice) : '¥799'
)

/** 列表标识：筛选条件变化时触发列表整体淡入淡出 */
const listKey = computed(
  () => `${categoryId.value ?? 'all'}-${keyword.value || 'all'}-${pageNum.value}`
)

async function loadGoods() {
  loading.value = true

  // 首次加载直接出骨架；后续筛选/翻页只在超过 250ms 时才出骨架，避免快接口闪一下
  clearTimeout(skeletonTimer)
  if (hasLoaded.value) {
    skeletonTimer = window.setTimeout(() => {
      showSkeleton.value = true
    }, 250)
  } else {
    showSkeleton.value = true
  }

  try {
    const params = { pageNum: pageNum.value, pageSize }
    let data

    if (searching.value) {
      params.key = keyword.value.trim()
      data = await searchApi.search(params)
    } else {
      // 按分类筛选：商品表已冗余 category1Id，直接用它查
      if (categoryId.value != null) params.category1Id = categoryId.value
      data = await productApi.spuPage(params)
    }

    goodsList.value = data?.records || []
    total.value = data?.total || 0
  } catch (e) {
    goodsList.value = []
    total.value = 0
  } finally {
    clearTimeout(skeletonTimer)
    loading.value = false
    showSkeleton.value = false
    hasLoaded.value = true
  }
}

async function loadCategories() {
  try {
    const data = await productApi.categoryTree()
    // 取前 7 个：Bento 布局下恰好填满 4 列 × 3 行（1 大 + 4 小 + 2 宽）
    categories.value = Array.isArray(data) ? data.slice(0, 7) : []
  } catch (e) {
    categories.value = []
  }
}

function goDetail(id) {
  router.push(`/goods/${id}`)
}

function goCategory(category) {
  // 再次点击同一个分类 → 取消筛选
  if (filtering.value && categoryId.value === Number(category.id)) {
    router.push({ path: '/' })
    return
  }
  // 按分类 ID 筛选（不再把分类名当搜索关键词）
  router.push({
    path: '/',
    query: { categoryId: category.id, categoryName: category.name }
  })
}

async function addToCart(product) {
  if (!userStore.isLogin) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await cartApi.add({ skuId: product.skuId || product.id, num: 1 })
    ElMessage.success('已加入购物车')
  } catch (e) {
    /* 错误提示由响应拦截器统一处理 */
  }
}

function scrollToRecommend() {
  const el = document.getElementById('recommend')
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onPageChange(page) {
  pageNum.value = page
  loadGoods()
  scrollToRecommend()
}

/** 从路由参数同步筛选条件（关键词 / 分类） */
function syncFromQuery() {
  keyword.value = route.query.key || ''
  categoryId.value = route.query.categoryId ? Number(route.query.categoryId) : null
  categoryName.value = route.query.categoryName || ''
  pageNum.value = 1
}

watch(
  () => route.query,
  () => {
    syncFromQuery()
    loadGoods()
  }
)

onMounted(() => {
  syncFromQuery()
  loadCategories()
  loadGoods()
})
</script>

<template>
  <div class="home">
    <div class="container">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-text">
          <span v-reveal class="hero-tag">Spring Cloud Alibaba 微服务商城</span>
          <h1 v-reveal="80">遇见更好的生活</h1>
          <p v-reveal="160">精选品质好物 · 让每一次选择都值得</p>
          <button v-reveal="240" class="btn-brand" @click="scrollToRecommend">
            探索新品
            <el-icon :size="14"><ArrowRight /></el-icon>
          </button>
        </div>

        <div v-reveal="120" class="hero-visual">
          <span class="orb orb-1"></span>
          <span class="orb orb-2"></span>
          <span class="orb orb-3"></span>

          <div class="hero-card">
            <p class="hc-label">今日推荐</p>
            <p class="hc-name">{{ heroProduct?.name || '无线降噪耳机' }}</p>
            <p class="hc-desc">{{ heroProduct?.brandName || '沉浸音质 · 智能降噪' }}</p>
            <p class="hc-price">{{ heroPrice }}</p>
          </div>
        </div>
      </section>

      <!-- 服务保障 -->
      <section class="service-bar">
        <div
          v-for="(s, i) in services"
          :key="s.title"
          v-reveal="i * 70"
          class="service-item"
        >
          <span class="service-icon">
            <el-icon :size="18"><component :is="s.icon" /></el-icon>
          </span>
          <div>
            <p class="service-title">{{ s.title }}</p>
            <p class="service-desc">{{ s.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 分类（Bento 布局：1 大 + 4 小 + 2 宽） -->
      <section v-if="categories.length" id="category" class="block">
        <SectionHeader
          v-reveal
          title="全部分类"
          subtitle="按品类快速找到心仪好物"
        />
        <div class="bento-grid">
          <div
            v-for="(c, i) in categories"
            :key="c.id"
            v-reveal="i * 60"
            class="bento-item"
            @click="goCategory(c)"
          >
            <span class="bento-icon">{{ (c.name || '分').slice(0, 1) }}</span>
            <div class="bento-text">
              <p class="bento-name">{{ c.name }}</p>
              <p v-if="i === 0" class="bento-desc">精选好物 · 一站购齐</p>
            </div>
            <span class="bento-arrow">
              <el-icon :size="13"><ArrowRight /></el-icon>
            </span>
          </div>
        </div>
      </section>

      <!-- 热门推荐 -->
      <section id="recommend" class="block">
        <SectionHeader
          v-reveal
          :title="sectionTitle"
          :subtitle="subtitle"
        />

        <transition name="skeleton-fade" mode="out-in">
          <div v-if="showSkeleton" key="skeleton" class="goods-grid">
            <div v-for="n in pageSize" :key="n" class="skeleton-card">
              <div class="sk-cover"></div>
              <div class="sk-body">
                <div class="sk-line" style="width: 72%"></div>
                <div class="sk-line sk-line-sm" style="width: 40%"></div>
              </div>
            </div>
          </div>

          <div
            v-else-if="goodsList.length"
            :key="listKey"
            class="goods-grid"
            :class="{ 'is-switching': loading }"
          >
            <ProductCard
              v-for="(g, i) in goodsList"
              :key="g.id"
              v-reveal="i * 70"
              :product="g"
              @select="goDetail(g.id)"
              @add="addToCart"
            />
          </div>

          <el-empty v-else-if="!loading" key="empty" description="暂无商品" />
        </transition>

        <div v-if="!loading && total > pageSize" class="pagination">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="pageNum"
            @current-change="onPageChange"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding-top: 24px;
}

/* ---------------- Hero ---------------- */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  gap: 32px;
  min-height: 300px;
  padding: 48px 56px;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(120deg, #eef3ff 0%, #e6ecfd 45%, #f3e9fa 100%);
  box-shadow: var(--shadow-md);
}

.hero::before,
.hero::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
}

.hero::before {
  width: 320px;
  height: 320px;
  background: rgba(255, 255, 255, 0.75);
  top: -120px;
  left: 32%;
}

.hero::after {
  width: 260px;
  height: 260px;
  background: rgba(197, 178, 236, 0.45);
  bottom: -150px;
  right: 22%;
}

.hero-text {
  position: relative;
  z-index: 2;
  flex: 1;
}

.hero-tag {
  display: inline-block;
  padding: 5px 14px;
  margin-bottom: 18px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  color: var(--brand-500);
}

.hero-text h1 {
  font-size: 38px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.5px;
  color: var(--text-title);
  margin-bottom: 12px;
}

.hero-text p {
  font-size: 15px;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.hero-visual {
  position: relative;
  z-index: 2;
  width: 340px;
  height: 210px;
  flex-shrink: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
}

.orb-1 {
  width: 140px;
  height: 140px;
  top: 6px;
  left: 24px;
  background: linear-gradient(135deg, #a9c4f0, #cbb9ee);
  opacity: 0.85;
  animation: float-a 9s ease-in-out infinite;
}

.orb-2 {
  width: 92px;
  height: 92px;
  top: 88px;
  left: 148px;
  background: linear-gradient(135deg, #dcc8f0, #f0c8de);
  opacity: 0.8;
  animation: float-b 11s ease-in-out infinite;
}

.orb-3 {
  width: 56px;
  height: 56px;
  top: 26px;
  left: 200px;
  background: linear-gradient(135deg, #bcd4f5, #9fc0ef);
  opacity: 0.75;
  animation: float-c 7.5s ease-in-out infinite;
}

@keyframes float-a {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(6px, -14px, 0);
  }
}

@keyframes float-b {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(-8px, -10px, 0);
  }
}

@keyframes float-c {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(4px, 10px, 0);
  }
}

.hero-card {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 194px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.62);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 10px 30px rgba(31, 42, 71, 0.08);
  transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1),
    box-shadow 0.35s ease;
}

.hero-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 38px rgba(31, 42, 71, 0.13);
}

.hc-label {
  font-size: 11px;
  color: var(--brand-500);
  margin-bottom: 8px;
}

.hc-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-title);
  margin-bottom: 4px;
}

.hc-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.hc-price {
  font-size: 18px;
  font-weight: 500;
  color: var(--accent-500);
}

/* ---------------- 服务保障 ---------------- */
.service-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 24px;
  padding: 24px 32px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-sm);
}

.service-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.service-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: var(--brand-soft);
  color: var(--brand-500);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.service-item:hover .service-icon {
  transform: scale(1.12) rotate(-6deg);
}

.service-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-title);
  margin-bottom: 3px;
}

.service-desc {
  font-size: 12px;
  color: var(--text-hint);
}

/* ---------------- 区块 ---------------- */
.block {
  margin-top: 48px;
}

/* ---------------- 分类（Bento 布局） ---------------- */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 128px;
  gap: 16px;
}

.bento-item {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 22px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1), box-shadow 0.3s ease;
}

/* 首卡放大：占 2×2 */
.bento-item:first-child {
  grid-column: span 2;
  grid-row: span 2;
  padding: 26px;
  background: linear-gradient(135deg, #eef1fd 0%, #f3e9fa 100%);
}

/* 第 6、7 个拉宽：各占 2 列，横向排布 */
.bento-item:nth-child(6),
.bento-item:nth-child(7) {
  grid-column: span 2;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
}

.bento-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.bento-icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  font-size: 18px;
  font-weight: 500;
  color: var(--brand-500);
  background: var(--brand-soft);
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bento-item:first-child .bento-icon {
  width: 60px;
  height: 60px;
  border-radius: 19px;
  font-size: 24px;
  background: rgba(255, 255, 255, 0.9);
}

.bento-item:hover .bento-icon {
  transform: scale(1.1) rotate(-6deg);
}

.bento-text {
  min-width: 0;
}

.bento-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bento-item:first-child .bento-name {
  font-size: 18px;
}

.bento-desc {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-muted);
}

.bento-arrow {
  position: absolute;
  right: 20px;
  bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--text-hint);
  opacity: 0;
  transform: translateX(-6px);
  transition: opacity 0.28s ease, transform 0.28s ease, color 0.2s ease;
}

.bento-item:hover .bento-arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--brand-500);
}

/* 宽卡改为横向布局后，箭头贴右侧居中 */
.bento-item:nth-child(6) .bento-arrow,
.bento-item:nth-child(7) .bento-arrow {
  position: static;
  margin-left: auto;
  flex-shrink: 0;
}

/* ---------------- 商品网格 ---------------- */
.goods-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

/* 筛选切换中的旧列表：轻微降透明度，给出"在加载"的反馈而不闪烁 */
.goods-grid.is-switching {
  opacity: 0.5;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

/* ---------------- 骨架屏 ---------------- */
.skeleton-card {
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.8);
}

.sk-cover {
  aspect-ratio: 1 / 1;
  background: linear-gradient(90deg, #eef1f8 25%, #f7f9fd 37%, #eef1f8 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.sk-body {
  padding: 14px 16px 16px;
}

.sk-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef1f8 25%, #f7f9fd 37%, #eef1f8 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

.sk-line + .sk-line {
  margin-top: 10px;
}

.sk-line-sm {
  height: 10px;
}

@keyframes shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}

/* ---------------- 分页 ---------------- */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 1100px) {
  .goods-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 118px;
  }
  .bento-item:first-child,
  .bento-item:nth-child(6),
  .bento-item:nth-child(7) {
    grid-column: span 1;
    grid-row: span 1;
    padding: 20px;
  }
  .bento-item:nth-child(6),
  .bento-item:nth-child(7) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
  }
  .bento-item:first-child .bento-icon {
    width: 46px;
    height: 46px;
    border-radius: 15px;
    font-size: 18px;
  }
  .bento-item:first-child .bento-name {
    font-size: 14px;
  }
  .bento-item:first-child .bento-desc {
    display: none;
  }
  .bento-arrow,
  .bento-item:nth-child(6) .bento-arrow,
  .bento-item:nth-child(7) .bento-arrow {
    position: absolute;
    right: 18px;
    bottom: 18px;
    margin-left: 0;
  }
}

@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 36px 28px;
  }
  .hero-visual {
    width: 100%;
  }
  .service-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  .goods-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orb,
  .sk-cover,
  .sk-line {
    animation: none;
  }
}
</style>
