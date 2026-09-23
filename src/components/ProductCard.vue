<script setup>
import { ref, computed } from 'vue'
import CountUp from '@/components/CountUp.vue'
import { flyToCart } from '@/utils/animation'

const props = defineProps({
  product: { type: Object, required: true },
  badge: { type: String, default: '' }
})

const emit = defineEmits(['select', 'add'])

const cardRef = ref(null)
const coverRef = ref(null)

const cover = computed(() => props.product.mainImage || '')
const initial = computed(() => (props.product.name || '商').slice(0, 1))

/* 记录鼠标位置，驱动卡片上的径向光斑 */
function handleMouseMove(event) {
  const el = cardRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  el.style.setProperty('--my', `${event.clientY - rect.top}px`)
}

/* 加购：先从商品图飞向购物车，再交给业务层处理 */
function handleAdd() {
  flyToCart(coverRef.value, props.product.mainImage)
  emit('add', props.product)
}
</script>

<template>
  <article
    ref="cardRef"
    class="product-card"
    @mousemove="handleMouseMove"
    @click="emit('select', product)"
  >
    <div ref="coverRef" class="cover">
      <img v-if="cover" :src="cover" :alt="product.name" loading="lazy" />
      <div v-else class="cover-placeholder">{{ initial }}</div>
      <span v-if="badge" class="badge">{{ badge }}</span>
    </div>

    <div class="body">
      <h3 class="name" :title="product.name">{{ product.name }}</h3>
      <p class="brand">{{ product.brandName || '阿飞严选' }}</p>

      <div class="foot">
        <CountUp class="price-value" :value="product.minPrice" />
        <button class="add-btn" title="加入购物车" @click.stop="handleAdd">
          <el-icon :size="15"><Plus /></el-icon>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.28s ease, transform 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.product-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
}

/* 鼠标跟随光斑 */
.product-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  background: radial-gradient(
    200px circle at var(--mx, 50%) var(--my, 50%),
    rgba(123, 143, 232, 0.16),
    transparent 65%
  );
}

.product-card:hover::after {
  opacity: 1;
}

.cover {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--surface-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.product-card:hover .cover img {
  transform: scale(1.07);
}

.cover-placeholder {
  font-size: 52px;
  font-weight: 500;
  color: #cdd5e8;
}

.badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: 11px;
  color: var(--text-on-brand);
  background: var(--brand-gradient);
}

.body {
  position: relative;
  padding: 14px 16px 16px;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-title);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.product-card:hover .name {
  color: var(--brand-500);
}

.brand {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-hint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.price-value {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.3px;
  color: var(--accent-500);
}

.add-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--brand-gradient);
  color: var(--text-on-brand);
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
}

.add-btn:hover {
  transform: scale(1.16);
  box-shadow: 0 6px 16px rgba(91, 111, 216, 0.38);
}

.add-btn:active {
  transform: scale(0.94);
}
</style>
