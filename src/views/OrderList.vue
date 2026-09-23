<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { orderApi, payApi } from '@/api'
import { formatPrice, orderStatusText, formatDateTime } from '@/utils/format'

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)
const status = ref(null)
const payingId = ref(null)

const tabs = [
  { label: '全部', value: null },
  { label: '待付款', value: 1 },
  { label: '已付款', value: 2 },
  { label: '已发货', value: 3 },
  { label: '已完成', value: 4 },
  { label: '已取消', value: 5 },
  { label: '已关闭', value: 6 }
]

const STATUS_CLASS = {
  1: 'is-warning',
  2: 'is-info',
  3: 'is-shipping',
  4: 'is-success',
  5: 'is-muted',
  6: 'is-muted'
}

function statusClass(value) {
  return STATUS_CLASS[value] || 'is-muted'
}

async function load() {
  loading.value = true
  try {
    const params = { pageNum: pageNum.value, pageSize }
    if (status.value != null) params.status = status.value
    const data = await orderApi.page(params)
    list.value = data?.records || []
    total.value = data?.total || 0
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function changeStatus(value) {
  if (status.value === value) return
  status.value = value
  pageNum.value = 1
  load()
}

function onPageChange(page) {
  pageNum.value = page
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 支付成功后订单状态是异步变更的：
 * pay 服务在回调里只更新支付记录 + 写本地消息表，由 PayMessageSendTask（每 10s）
 * 投递 RabbitMQ，order 服务消费后才把 status 改成 2。
 * 所以这里轮询等待状态真正落库，避免用户看到「支付成功但订单还是待付款」。
 */
function waitOrderPaid(orderId, { maxTries = 10, interval = 1200 } = {}) {
  return new Promise((resolve) => {
    let tries = 0

    const tick = async () => {
      tries += 1
      try {
        const detail = await orderApi.detail(orderId)
        if (detail?.status === 2) {
          resolve(true)
          return
        }
      } catch (e) {
        /* 单次查询失败不中断轮询 */
      }
      if (tries >= maxTries) {
        resolve(false)
        return
      }
      setTimeout(tick, interval)
    }

    tick()
  })
}

async function pay(order) {
  payingId.value = order.id
  try {
    const res = await payApi.pay({ orderId: order.id, payType: 1 })
    await payApi.mock(res.payNo)

    const synced = await waitOrderPaid(order.id)
    load()

    if (synced) {
      ElMessage.success('支付成功')
    } else {
      ElMessage.warning('支付已受理，订单状态同步稍有延迟，请稍后刷新查看')
    }
  } catch (e) {
    /* 错误已在拦截器提示 */
  } finally {
    payingId.value = null
  }
}

async function cancel(order) {
  try {
    await ElMessageBox.confirm(`确定取消订单 ${order.orderNo} 吗？`, '取消订单', {
      type: 'warning',
      confirmButtonText: '取消订单',
      cancelButtonText: '再想想'
    })
  } catch (e) {
    return
  }
  try {
    await orderApi.cancel(order.id)
    ElMessage.success('已取消订单')
    load()
  } catch (e) {
    /* 错误已在拦截器提示 */
  }
}

onMounted(load)
</script>

<template>
  <div class="container order-page">
    <header class="page-head">
      <h2 class="page-title">我的订单</h2>
      <span v-if="total" class="page-sub">共 {{ total }} 笔订单</span>
    </header>

    <!-- 状态筛选 -->
    <div class="filter-bar">
      <button
        v-for="t in tabs"
        :key="t.label"
        type="button"
        class="filter-btn"
        :class="{ active: status === t.value }"
        @click="changeStatus(t.value)"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-loading="loading" class="order-list">
      <article v-for="o in list" :key="o.id" class="order-card">
        <header class="order-head">
          <span class="order-no">订单号 {{ o.orderNo }}</span>
          <span class="order-time">{{ formatDateTime(o.createTime) }}</span>
          <span class="status-badge" :class="statusClass(o.status)">
            {{ orderStatusText(o.status) }}
          </span>
        </header>

        <div class="order-body">
          <div class="order-goods">
            <div class="og-img">
              <img v-if="o.goodsPic" :src="o.goodsPic" :alt="o.goodsTitle" loading="lazy" />
              <span v-else>{{ (o.goodsTitle || '商').slice(0, 1) }}</span>
            </div>
            <div class="og-info">
              <p class="og-title" :title="o.goodsTitle">{{ o.goodsTitle }}</p>
              <p class="og-num">共 {{ o.goodsNum }} 件</p>
            </div>
          </div>

          <div class="order-amount">
            <span class="amount-label">实付</span>
            <span class="price amount-value">
              {{ formatPrice(o.payAmount ?? o.totalAmount) }}
            </span>
          </div>

          <div class="order-actions">
            <button
              v-if="o.status === 1"
              class="btn-pay"
              :disabled="payingId === o.id"
              @click="pay(o)"
            >
              {{ payingId === o.id ? '处理中…' : '去支付' }}
            </button>
            <button v-if="o.status === 1" class="btn-ghost" @click="cancel(o)">
              取消订单
            </button>
          </div>
        </div>
      </article>

      <el-empty v-if="!loading && list.length === 0" description="这里还没有订单">
        <el-button type="primary" round @click="$router.push('/')">去逛逛</el-button>
      </el-empty>
    </div>

    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="pageNum"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.order-page {
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

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
}

/* ---------------- 状态筛选 ---------------- */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 20px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-family: inherit;
  color: var(--text-body);
  cursor: pointer;
  transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease,
    transform 0.22s ease;
}

.filter-btn:hover {
  border-color: var(--brand-400);
  color: var(--brand-500);
}

.filter-btn.active {
  background: var(--brand-gradient);
  color: #fff;
  box-shadow: 0 6px 16px rgba(91, 111, 216, 0.26);
}

/* ---------------- 订单卡 ---------------- */
.order-list {
  min-height: 200px;
}

.order-card {
  padding: 20px 24px;
  margin-bottom: 16px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.28s ease, transform 0.28s ease;
}

.order-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.order-head {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.order-no {
  color: var(--text-body);
  font-weight: 500;
}

.order-time {
  color: var(--text-hint);
  margin-left: auto;
}

.status-badge {
  padding: 4px 13px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  white-space: nowrap;
}

.status-badge.is-warning {
  background: var(--accent-soft);
  color: var(--accent-500);
}

.status-badge.is-info {
  background: var(--brand-soft);
  color: var(--brand-500);
}

.status-badge.is-shipping {
  background: #e6f6f2;
  color: #0f8a6d;
}

.status-badge.is-success {
  background: #eff7e6;
  color: #5a8f22;
}

.status-badge.is-muted {
  background: var(--surface-sunken);
  color: var(--text-hint);
}

.order-body {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 18px;
}

.order-goods {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.og-img {
  width: 68px;
  height: 68px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 22px;
  color: #cdd5e8;
}

.og-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.order-card:hover .og-img img {
  transform: scale(1.08);
}

.og-info {
  min-width: 0;
}

.og-title {
  font-size: 14px;
  color: var(--text-title);
  line-height: 1.5;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.og-num {
  font-size: 12px;
  color: var(--text-hint);
}

.order-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 104px;
}

.amount-label {
  font-size: 12px;
  color: var(--text-hint);
}

.amount-value {
  font-size: 20px;
  letter-spacing: -0.3px;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 168px;
  justify-content: flex-end;
}

.btn-pay {
  padding: 9px 22px;
  border: none;
  border-radius: var(--radius-pill);
  background: var(--brand-gradient);
  font-size: 13px;
  font-family: inherit;
  color: #fff;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.22s ease;
}

.btn-pay:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(91, 111, 216, 0.3);
}

.btn-pay:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-ghost {
  padding: 9px 20px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: transparent;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-body);
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.btn-ghost:hover {
  border-color: var(--brand-400);
  color: var(--brand-500);
  background: var(--brand-soft);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 26px;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 860px) {
  .order-body {
    flex-wrap: wrap;
  }
  .order-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
