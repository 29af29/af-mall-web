<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  moreText: { type: String, default: '查看更多' },
  moreTo: { type: String, default: '' }
})
</script>

<template>
  <div class="section-header">
    <div class="left">
      <h2 class="title">{{ title }}</h2>
      <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
    </div>

    <router-link v-if="moreTo" :to="moreTo" class="more">
      <span>{{ moreText }}</span>
      <el-icon :size="13"><ArrowRight /></el-icon>
    </router-link>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}

.left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.title {
  font-size: 22px;
  font-weight: 500;
  color: var(--text-title);
  letter-spacing: -0.2px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-muted);
}

.more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.more:hover {
  color: var(--brand-500);
}
</style>
