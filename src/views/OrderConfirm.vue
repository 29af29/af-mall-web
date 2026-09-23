<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { cartApi, orderApi } from '@/api'
import { formatPrice } from '@/utils/format'

const router = useRouter()

const cart = ref({ items: [] })
const loading = ref(false)
const submitting = ref(false)
const form = ref({
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  remark: ''
})

const steps = ['购物车', '确认订单', '支付完成']

const selectedItems = computed(() => cart.value.items.filter((i) => i.selected))

const goodsCount = computed(() =>
  selectedItems.value.reduce((sum, i) => sum + i.num, 0)
)

const totalAmount = computed(() =>
  selectedItems.value.reduce((sum, i) => sum + i.price * i.num, 0)
)

async function load() {
  loading.value = true
  try {
    cart.value = await cartApi.list()
  } catch (e) {
    cart.value = { items: [] }
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (selectedItems.value.length === 0) {
    ElMessage.warning('没有待结算的商品')
    return
  }
  if (!form.value.receiverName || !form.value.receiverPhone || !form.value.receiverAddress) {
    ElMessage.warning('请填写完整的收货信息')
    return
  }
  submitting.value = true
  try {
    const orderItems = selectedItems.value.map((i) => ({ skuId: i.skuId, num: i.num }))
    await orderApi.create({
      orderItems,
      receiverName: form.value.receiverName,
      receiverPhone: form.value.receiverPhone,
      receiverAddress: form.value.receiverAddress,
      remark: form.value.remark,
      totalAmount: totalAmount.value,
      payAmount: totalAmount.value
    })
    // 删除已下单的购物车项
    for (const i of selectedItems.value) {
      try {
        await cartApi.remove(i.skuId)
      } catch (e) {
        /* 单项删除失败不影响下单结果 */
      }
    }
    ElMessage.success('下单成功')
    router.push('/order')
  } catch (e) {
    /* 错误已在拦截器提示 */
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="container confirm-page">
    <header class="page-head">
      <h2 class="page-title">确认订单</h2>
      <p class="page-sub">请核对收货信息与商品清单</p>
    </header>

    <!-- 步骤条 -->
    <ol class="steps">
      <li v-for="(label, i) in steps" :key="label" :class="{ active: i === 1, done: i === 0 }">
        <span class="step-index">
          <el-icon v-if="i === 0" :size="12"><Check /></el-icon>
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="step-label">{{ label }}</span>
        <span v-if="i < steps.length - 1" class="step-line"></span>
      </li>
    </ol>

    <div v-loading="loading" class="confirm-layout">
      <div class="main-col">
        <!-- 收货信息 -->
        <section class="card block">
          <h3 class="block-title">
            <el-icon :size="16"><Location /></el-icon>
            收货信息
          </h3>

          <div class="form-grid">
            <label class="field">
              <span class="field-label">收货人</span>
              <el-input v-model="form.receiverName" placeholder="请输入收货人姓名" size="large">
                <template #prefix><el-icon><User /></el-icon></template>
              </el-input>
            </label>

            <label class="field">
              <span class="field-label">手机号</span>
              <el-input
                v-model="form.receiverPhone"
                placeholder="请输入手机号"
                size="large"
                maxlength="11"
              >
                <template #prefix><el-icon><Iphone /></el-icon></template>
              </el-input>
            </label>

            <label class="field full">
              <span class="field-label">收货地址</span>
              <el-input v-model="form.receiverAddress" placeholder="请输入详细地址" size="large">
                <template #prefix><el-icon><MapLocation /></el-icon></template>
              </el-input>
            </label>

            <label class="field full">
              <span class="field-label">订单备注</span>
              <el-input v-model="form.remark" placeholder="选填，如：请尽快发货" size="large">
                <template #prefix><el-icon><EditPen /></el-icon></template>
              </el-input>
            </label>
          </div>
        </section>

        <!-- 商品清单 -->
        <section class="card block">
          <h3 class="block-title">
            <el-icon :size="16"><ShoppingBag /></el-icon>
            商品清单
          </h3>

          <div v-for="i in selectedItems" :key="i.skuId" class="goods-row">
            <div class="goods-img">
              <img v-if="i.image" :src="i.image" :alt="i.title" loading="lazy" />
              <span v-else>{{ (i.title || '商').slice(0, 1) }}</span>
            </div>
            <div class="goods-meta">
              <p class="goods-title" :title="i.title">{{ i.title }}</p>
              <p class="goods-price">
                {{ formatPrice(i.price) }}<span class="times">×</span>{{ i.num }}
              </p>
            </div>
            <span class="price goods-subtotal">{{ formatPrice(i.price * i.num) }}</span>
          </div>

          <el-empty
            v-if="!loading && selectedItems.length === 0"
            description="没有待结算的商品"
          >
            <el-button type="primary" round @click="router.push('/cart')">回到购物车</el-button>
          </el-empty>
        </section>
      </div>

      <!-- 费用明细 -->
      <aside v-if="selectedItems.length" class="summary card">
        <h3 class="summary-title">费用明细</h3>

        <div class="sum-row">
          <span>商品金额</span>
          <span class="price">{{ formatPrice(totalAmount) }}</span>
        </div>
        <div class="sum-row">
          <span>运费</span>
          <span class="free">免运费</span>
        </div>

        <div class="sum-total">
          <span>应付金额</span>
          <span class="price total">{{ formatPrice(totalAmount) }}</span>
        </div>

        <button class="btn-brand submit-btn" :disabled="submitting" @click="submit">
          {{ submitting ? '提交中…' : '提交订单' }}
        </button>

        <p class="summary-hint">共 {{ goodsCount }} 件商品</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.confirm-page {
  padding-top: 24px;
}

.page-head {
  margin-bottom: 20px;
}

.page-head .page-title {
  margin-bottom: 6px;
}

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
}

/* ---------------- 步骤条 ---------------- */
.steps {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
  padding: 18px 28px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-sm);
}

.steps li {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.steps li:last-child {
  flex: 0 0 auto;
}

.step-index {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-sunken);
  font-size: 12px;
  color: var(--text-hint);
}

.steps li.active .step-index {
  background: var(--brand-gradient);
  color: #fff;
  box-shadow: 0 4px 12px rgba(91, 111, 216, 0.3);
}

.steps li.done .step-index {
  background: var(--brand-soft);
  color: var(--brand-500);
}

.step-label {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.steps li.active .step-label {
  color: var(--text-title);
  font-weight: 500;
}

.steps li.done .step-label {
  color: var(--brand-500);
}

.step-line {
  flex: 1;
  height: 1px;
  margin-left: 8px;
  background: linear-gradient(90deg, var(--border-strong), transparent);
}

/* ---------------- 布局 ---------------- */
.confirm-layout {
  display: flex;
  align-items: flex-start;
  gap: 22px;
  min-height: 200px;
}

.main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.block {
  padding: 24px 26px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-title);
  padding-bottom: 16px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.block-title .el-icon {
  color: var(--brand-500);
}

/* ---------------- 表单 ---------------- */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 13px;
  color: var(--text-muted);
}

.form-grid :deep(.el-input__wrapper) {
  padding: 5px 14px;
  border-radius: 13px;
  background: var(--surface-sunken);
  box-shadow: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.form-grid :deep(.el-input__wrapper:hover) {
  background: #eef1f9;
}

.form-grid :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow: 0 0 0 1.5px var(--brand-400) inset;
}

/* ---------------- 商品清单 ---------------- */
.goods-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
}

.goods-row + .goods-row {
  border-top: 1px solid var(--border);
}

.goods-img {
  width: 62px;
  height: 62px;
  flex-shrink: 0;
  border-radius: 13px;
  background: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 20px;
  color: #cdd5e8;
}

.goods-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.goods-meta {
  flex: 1;
  min-width: 0;
}

.goods-title {
  font-size: 14px;
  color: var(--text-title);
  line-height: 1.5;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.goods-price {
  font-size: 12px;
  color: var(--text-hint);
}

.times {
  margin: 0 5px;
}

.goods-subtotal {
  font-size: 15px;
}

/* ---------------- 费用明细 ---------------- */
.summary {
  position: sticky;
  top: 88px;
  width: 300px;
  flex-shrink: 0;
  padding: 24px 22px;
}

.summary-title {
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

.total {
  font-size: 26px;
  letter-spacing: -0.5px;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
  padding: 13px 26px;
  font-size: 15px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.summary-hint {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-hint);
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 1024px) {
  .confirm-layout {
    flex-direction: column;
  }
  .summary {
    position: static;
    width: 100%;
  }
}

@media (max-width: 760px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .steps {
    padding: 16px 20px;
  }
  .step-label {
    display: none;
  }
}
</style>
