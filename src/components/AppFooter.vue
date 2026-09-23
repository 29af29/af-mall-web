<script setup>
const columns = [
  { title: '购物指南', links: ['购物流程', '会员介绍', '常见问题', '联系客服'] },
  { title: '配送方式', links: ['上门自提', '限时达服务', '配送服务查询', '运费标准'] },
  { title: '支付方式', links: ['在线支付', '货到付款', '分期付款', '公司转账'] },
  { title: '售后服务', links: ['售后政策', '价格保护', '退款说明', '返修退换'] }
]
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-top">
        <div class="brand-col">
          <div class="brand">
            <span class="brand-mark"></span>
            <span class="brand-name">阿飞商城</span>
          </div>
          <p class="brand-desc">精选品质好物，让每一次选择都值得</p>
          <p class="brand-meta">
            Java 17 · Spring Boot 3 · Spring Cloud Alibaba · Nacos · Gateway · Sentinel
          </p>
        </div>

        <div class="link-cols">
          <div v-for="col in columns" :key="col.title" class="link-col">
            <h4>{{ col.title }}</h4>
            <ul>
              <li v-for="link in col.links" :key="link">
                <span class="link">{{ link }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 阿飞商城 · 学习与技术演示项目，非商业用途</span>
        <span>Powered by Vue 3 + Vite</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 64px;
  padding: 48px 0 28px;
  background: rgba(255, 255, 255, 0.66);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border-top: 1px solid rgba(255, 255, 255, 0.7);
}

.footer-top {
  display: flex;
  gap: 64px;
  padding-bottom: 36px;
  border-bottom: 1px solid var(--border);
}

.brand-col {
  flex-shrink: 0;
  width: 260px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: var(--brand-gradient);
}

.brand-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-title);
}

.brand-desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 10px;
}

.brand-meta {
  font-size: 12px;
  color: var(--text-hint);
  line-height: 1.7;
}

.link-cols {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.link-col h4 {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-title);
  margin-bottom: 14px;
}

.link-col li + li {
  margin-top: 10px;
}

.link {
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.link:hover {
  color: var(--brand-500);
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 22px;
  font-size: 12px;
  color: var(--text-hint);
}

@media (max-width: 900px) {
  .footer-top {
    flex-direction: column;
    gap: 32px;
  }
  .brand-col {
    width: 100%;
  }
  .link-cols {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
