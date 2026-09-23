<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { cartApi } from '@/api'
import { formatPrice } from '@/utils/format'
import CountUp from '@/components/CountUp.vue'

const router = useRouter()

const cart = ref({ items: [], totalPrice: 0, totalCount: 0 })
const loading = ref(false)

const selectedItems = computed(() => cart.value.items.filter((i) => i.selected))

const selectedTotal = computed(() =>
  selectedItems.value.reduce((sum, i) => sum + i.price * i.num, 0)
)

const selectedCount = computed(() =>
  selectedItems.value.reduce((sum, i) => sum + i.num, 0)
)

const allSelected = computed(
  () => cart.value.items.length > 0 && cart.value.items.every((i) => i.selected)
)

async function load() {
  loading.value = true
  try {
    cart.value = await cartApi.list()
  } catch (e) {
    cart.value = { items: [], totalPrice: 0, totalCount: 0 }
  } finally {
    loading.value = false
  }
}

async function changeNum(item, num) {
  if (!num || num <= 0) return
  try {
    await cartApi.updateNum(item.skuId, num)
    load()
  } catch (e) {
    load()
  }
}

async function toggleSelect(item) {
  await cartApi.select(item.skuId, !item.selected)
  load()
}

async function toggleAll() {
  await cartApi.selectAll(!allSelected.value)
  load()
}

async function removeItem(item) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.title}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch (e) {
    return
  }
  await cartApi.remove(item.skuId)
  ElMessage.success('已删除')
  load()
}

function goCheckout() {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('请先勾选商品')
    return
  }
  router.push('/order/confirm')
}

onMounted(load)
</script>

<template>
  <div class="container cart-page">
    <header class="page-head">
      <h2 class="page-title">购物车</h2>
      <span v-if="cart.items.length" class="head-count">
        共 {{ cart.items.length }} 种商品
      </span>
    </header>

    <div v-loading="loading" class="cart-layout">
      <template v-if="cart.items.length">
        <!-- 商品列表 -->
        <section class="cart-list">
          <div class="list-head">
            <el-checkbox :model-value="allSelected" @change="toggleAll">全选</el-checkbox>
            <span>商品信息</span>
            <span class="t-right">单价</span>
            <span class="t-center">数量</span>
            <span class="t-right">小计</span>
            <span></span>
          </div>

          <transition-group name="row" tag="div" class="rows">
            <div v-for="item in cart.items" :key="item.skuId" class="cart-item">
              <el-checkbox
                :model-value="item.selected"
                @change="toggleSelect(item)"
              />

              <div class="goods">
                <div class="goods-img">
                  <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
                  <span v-else>{{ (item.title || '商').slice(0, 1) }}</span>
                </div>
                <div class="goods-meta">
                  <p class="goods-title" :title="item.title">{{ item.title }}</p>
                  <p class="goods-sub">库存 {{ item.stock ?? '—' }} 件</p>
                </div>
              </div>

              <span class="price col-price">{{ formatPrice(item.price) }}</span>

              <div class="col-num">
                <el-input-number
                  :model-value="item.num"
                  :min="1"
                  :max="item.stock || 99"
                  size="small"
                  controls-position="right"
                  @change="(v) => changeNum(item, v)"
                />
              </div>

              <span class="price sub-total">{{ formatPrice(item.price * item.num) }}</span>

              <button class="del-btn" title="删除" @click="removeItem(item)">
                <el-icon :size="15"><Delete /></el-icon>
              </button>
            </div>
          </transition-group>
        </section>

        <!-- 结算卡 -->
        <aside class="checkout">
          <h3 class="checkout-title">订单结算</h3>

          <div class="sum-row">
            <span>商品总价</span>
            <CountUp class="price" :value="selectedTotal" />
          </div>
          <div class="sum-row">
            <span>优惠券</span>
            <span class="free">暂无可用</span>
          </div>
          <div class="sum-row">
            <span>运费</span>
            <span class="free">免运费</span>
          </div>

          <div class="sum-total">
            <span>合计</span>
            <CountUp class="price total-price" :value="selectedTotal" />
          </div>

          <button
            class="btn-brand pay-btn"
            :disabled="selectedItems.length === 0"
            @click="goCheckout"
          >
            去结算{{ selectedCount ? ` (${selectedCount})` : '' }}
          </button>

          <p class="checkout-hint">
            已选 {{ selectedItems.length }} 种 · 共 {{ selectedCount }} 件
          </p>
        </aside>
      </template>

      <el-empty v-else-if="!loading" class="empty" description="购物车还是空的">
        <el-button type="primary" round @click="router.push('/')">去逛逛</el-button>
      </el-empty>
    </div>
  </div>
</template>

<style scoped>
.cart-page {
  padding-top: 24px;
}

.page-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.page-head .page-title {
  margin-bottom: 0;
}

.head-count {
  font-size: 13px;
  color: var(--text-muted);
}

.cart-layout {
  display: flex;
  align-items: flex-start;
  gap: 22px;
  min-height: 260px;
}

/* ---------------- 商品列表 ---------------- */
.cart-list {
  position: relative;
  flex: 1;
  min-width: 0;
  padding: 8px 26px 20px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.list-head,
.cart-item {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 104px 132px 108px 48px;
  align-items: center;
  gap: 12px;
}

.list-head {
  padding: 16px 0 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-hint);
}

.cart-item {
  padding: 18px 0;
  transition: background 0.2s ease;
}

.cart-item + .cart-item {
  border-top: 1px solid var(--border);
}

.cart-item:hover {
  background: rgba(245, 247, 252, 0.7);
}

.t-right {
  text-align: right;
}

.t-center {
  text-align: center;
}

.goods {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.goods-img {
  width: 74px;
  height: 74px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 24px;
  color: #cdd5e8;
}

.goods-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.cart-item:hover .goods-img img {
  transform: scale(1.08);
}

.goods-meta {
  min-width: 0;
}

.goods-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-title);
  line-height: 1.5;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goods-sub {
  font-size: 12px;
  color: var(--text-hint);
}

.col-price {
  font-size: 14px;
  color: var(--text-body);
  text-align: right;
}

.col-num {
  display: flex;
  justify-content: center;
}

.col-num :deep(.el-input-number) {
  width: 108px;
}

.sub-total {
  font-size: 16px;
  font-weight: 500;
  text-align: right;
}

.del-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-hint);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.del-btn:hover {
  background: var(--accent-soft);
  color: var(--accent-500);
  transform: scale(1.08);
}

/* ---------------- 结算卡 ---------------- */
.checkout {
  position: sticky;
  top: 88px;
  width: 288px;
  flex-shrink: 0;
  padding: 24px 22px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.checkout-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-title);
  padding-bottom: 16px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border);
}

.sum-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 0;
  font-size: 13px;
  color: var(--text-muted);
}

.free {
  color: var(--text-body);
}

.sum-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-strong);
  font-size: 14px;
  color: var(--text-title);
}

.total-price {
  font-size: 26px;
  letter-spacing: -0.5px;
}

.pay-btn {
  width: 100%;
  margin-top: 20px;
  padding: 13px 26px;
  font-size: 15px;
}

.pay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.checkout-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-hint);
}

/* ---------------- 行入场过渡 ---------------- */
.row-enter-active,
.row-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.row-enter-from {
  opacity: 0;
  transform: translateX(-14px);
}

.row-leave-to {
  opacity: 0;
  transform: translateX(14px);
}

.row-leave-active {
  position: absolute;
}

.empty {
  width: 100%;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 1024px) {
  .cart-layout {
    flex-direction: column;
  }
  .checkout {
    position: static;
    width: 100%;
  }
}

@media (max-width: 760px) {
  .list-head {
    display: none;
  }
  .cart-list {
    padding: 8px 18px 16px;
  }
  .cart-item {
    grid-template-columns: 40px minmax(0, 1fr) 44px;
    row-gap: 10px;
  }
  .col-price,
  .col-num,
  .sub-total {
    grid-column: 2 / 4;
    text-align: left;
    display: flex;
    justify-content: flex-start;
  }
}
</style>
