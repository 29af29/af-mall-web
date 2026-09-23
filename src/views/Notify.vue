<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { notifyApi } from '@/api'
import { formatDateTime } from '@/utils/format'

const list = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)
const markingAll = ref(false)

const unreadCount = computed(() => list.value.filter((n) => n.isRead === 0).length)

async function load() {
  loading.value = true
  try {
    const data = await notifyApi.list({ pageNum: pageNum.value, pageSize })
    list.value = data?.records || []
    total.value = data?.total || 0
  } catch (e) {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function markRead(item) {
  if (item.isRead === 1) return
  try {
    await notifyApi.markRead(item.id)
    load()
  } catch (e) {
    /* 错误已在拦截器提示 */
  }
}

async function markAllRead() {
  if (!unreadCount.value) return
  markingAll.value = true
  try {
    await notifyApi.markAllRead()
    ElMessage.success('已全部标记为已读')
    load()
  } catch (e) {
    /* 错误已在拦截器提示 */
  } finally {
    markingAll.value = false
  }
}

function onPageChange(page) {
  pageNum.value = page
  load()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(load)
</script>

<template>
  <div class="container notify-page">
    <header class="page-head">
      <div class="head-text">
        <h2 class="page-title">通知中心</h2>
        <p class="page-sub">
          <template v-if="unreadCount">本页有 {{ unreadCount }} 条未读消息</template>
          <template v-else>本页消息都已读完</template>
        </p>
      </div>

      <button
        class="btn-ghost"
        :disabled="!unreadCount || markingAll"
        @click="markAllRead"
      >
        {{ markingAll ? '处理中…' : '全部标为已读' }}
      </button>
    </header>

    <div v-loading="loading" class="notify-list">
      <article
        v-for="n in list"
        :key="n.id"
        class="notify-item"
        :class="{ unread: n.isRead === 0 }"
        @click="markRead(n)"
      >
        <span class="notify-icon">
          <el-icon :size="16"><Bell /></el-icon>
        </span>

        <div class="notify-body">
          <div class="notify-row">
            <h3 class="notify-title">{{ n.title }}</h3>
            <span class="notify-time">{{ formatDateTime(n.createTime) }}</span>
          </div>
          <p class="notify-text">{{ n.content }}</p>
        </div>

        <span v-if="n.isRead === 0" class="unread-dot" title="未读"></span>
      </article>

      <el-empty v-if="!loading && list.length === 0" description="暂无通知" />
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
.notify-page {
  padding-top: 24px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-head .page-title {
  margin-bottom: 6px;
}

.page-sub {
  font-size: 13px;
  color: var(--text-muted);
}

.btn-ghost {
  padding: 9px 20px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-family: inherit;
  color: var(--text-body);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
}

.btn-ghost:hover:not(:disabled) {
  border-color: var(--brand-400);
  color: var(--brand-500);
  background: var(--brand-soft);
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------------- 通知列表 ---------------- */
.notify-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.notify-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px 20px 26px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  overflow: hidden;
  transition: box-shadow 0.26s ease, transform 0.26s ease, background 0.26s ease;
}

.notify-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* 未读：左侧色条 + 淡品牌底 */
.notify-item.unread {
  background: linear-gradient(100deg, rgba(238, 241, 253, 0.9), #fff 55%);
}

.notify-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--brand-gradient);
}

.notify-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: var(--surface-sunken);
  color: var(--text-hint);
  transition: background 0.26s ease, color 0.26s ease, transform 0.26s ease;
}

.notify-item.unread .notify-icon {
  background: var(--brand-soft);
  color: var(--brand-500);
}

.notify-item:hover .notify-icon {
  transform: scale(1.08) rotate(-6deg);
}

.notify-body {
  flex: 1;
  min-width: 0;
}

.notify-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 8px;
}

.notify-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-title);
  line-height: 1.5;
}

.notify-item.unread .notify-title {
  color: var(--brand-600);
}

.notify-time {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-hint);
}

.notify-text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.unread-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  margin-top: 16px;
  border-radius: 50%;
  background: var(--accent-500);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 26px;
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 700px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .notify-row {
    flex-direction: column;
    gap: 4px;
  }
  .notify-time {
    margin-left: 0;
  }
}
</style>
