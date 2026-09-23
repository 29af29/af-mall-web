<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'
import { authApi } from '@/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const mode = ref('login')
const loading = ref(false)

const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({ username: '', password: '', confirm: '' })

const highlights = [
  { icon: 'Goods', title: '精选好物', desc: '数码、家居、零食全品类覆盖' },
  { icon: 'Van', title: '极速配送', desc: '当天下单，次日送达' },
  { icon: 'Lock', title: '安全支付', desc: 'JWT 鉴权 + 分布式事务保障' }
]

function switchMode(next) {
  if (mode.value === next) return
  mode.value = next
}

async function doLogin() {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login({ username: loginForm.username, password: loginForm.password })
    ElMessage.success('登录成功')
    router.push(route.query.redirect || '/')
  } catch (e) {
    /* 错误已在拦截器提示 */
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  if (!registerForm.username || !registerForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  if (registerForm.password !== registerForm.confirm) {
    ElMessage.warning('两次密码不一致')
    return
  }
  loading.value = true
  try {
    await authApi.register({
      username: registerForm.username,
      password: registerForm.password
    })
    ElMessage.success('注册成功，请登录')
    loginForm.username = registerForm.username
    mode.value = 'login'
  } catch (e) {
    /* 错误已在拦截器提示 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧品牌展示 -->
      <aside class="brand-side">
        <span class="orb orb-1"></span>
        <span class="orb orb-2"></span>
        <span class="orb orb-3"></span>

        <div class="brand-head">
          <span class="brand-mark"></span>
          <span class="brand-name">阿飞商城</span>
        </div>

        <h2 class="brand-title">遇见更好的生活</h2>
        <p class="brand-sub">精选品质好物<br />让每一次选择都值得</p>

        <ul class="brand-list">
          <li v-for="h in highlights" :key="h.title">
            <span class="hl-icon">
              <el-icon :size="15"><component :is="h.icon" /></el-icon>
            </span>
            <div>
              <p class="hl-title">{{ h.title }}</p>
              <p class="hl-desc">{{ h.desc }}</p>
            </div>
          </li>
        </ul>
      </aside>

      <!-- 右侧表单 -->
      <section class="form-side">
        <header class="form-head">
          <h3>{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</h3>
          <p>
            {{ mode === 'login' ? '登录后可同步购物车与订单' : '注册只需一步，立即开始选购' }}
          </p>
        </header>

        <div class="tabs">
          <span
            class="tab-slider"
            :style="{ transform: mode === 'login' ? 'translateX(0)' : 'translateX(100%)' }"
          ></span>
          <button
            class="tab"
            :class="{ active: mode === 'login' }"
            type="button"
            @click="switchMode('login')"
          >
            登录
          </button>
          <button
            class="tab"
            :class="{ active: mode === 'register' }"
            type="button"
            @click="switchMode('register')"
          >
            注册
          </button>
        </div>

        <transition name="swap" mode="out-in">
          <form v-if="mode === 'login'" key="login" class="form" @submit.prevent="doLogin">
            <el-input v-model="loginForm.username" placeholder="用户名" size="large">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>

            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>

            <button class="btn-brand submit" type="submit" :disabled="loading">
              {{ loading ? '登录中…' : '登 录' }}
            </button>
          </form>

          <form v-else key="register" class="form" @submit.prevent="doRegister">
            <el-input v-model="registerForm.username" placeholder="用户名" size="large">
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>

            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>

            <el-input
              v-model="registerForm.confirm"
              type="password"
              placeholder="确认密码"
              size="large"
              show-password
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>

            <button class="btn-brand submit" type="submit" :disabled="loading">
              {{ loading ? '注册中…' : '注 册' }}
            </button>
          </form>
        </transition>

        <p class="tip">
          {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
          <span @click="switchMode(mode === 'login' ? 'register' : 'login')">
            {{ mode === 'login' ? '立即注册' : '去登录' }}
          </span>
        </p>

        <p class="demo-tip">体验账号：afei2 / 123456</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.login-card {
  display: flex;
  width: 100%;
  max-width: 940px;
  min-height: 560px;
  border-radius: 26px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 24px 70px rgba(31, 42, 71, 0.14);
  animation: card-in 0.75s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translate3d(0, 26px, 0) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

/* ---------------- 左侧品牌区 ---------------- */
.brand-side {
  position: relative;
  width: 44%;
  padding: 52px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(150deg, #eef3ff 0%, #e4ecfd 45%, #f2e8fa 100%);
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(46px);
}

.orb-1 {
  width: 270px;
  height: 270px;
  top: -110px;
  left: -90px;
  background: #a5c0ef;
  opacity: 0.82;
  animation: orb-drift 16s ease-in-out infinite;
}

.orb-2 {
  width: 230px;
  height: 230px;
  bottom: -100px;
  right: -70px;
  background: #c3b0ec;
  opacity: 0.75;
  animation: orb-drift 21s ease-in-out infinite reverse;
}

.orb-3 {
  width: 150px;
  height: 150px;
  top: 42%;
  right: 6%;
  background: #f1c1de;
  opacity: 0.6;
  animation: orb-drift 13s ease-in-out infinite;
}

@keyframes orb-drift {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(18px, -22px, 0) scale(1.1);
  }
}

.brand-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--brand-gradient);
  box-shadow: 0 6px 16px rgba(91, 111, 216, 0.32);
}

.brand-name {
  font-size: 17px;
  font-weight: 500;
  color: var(--text-title);
}

.brand-title {
  position: relative;
  font-size: 27px;
  font-weight: 500;
  line-height: 1.35;
  letter-spacing: -0.4px;
  color: var(--text-title);
  margin-bottom: 12px;
}

.brand-sub {
  position: relative;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-muted);
  margin-bottom: 34px;
}

.brand-list {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.brand-list li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hl-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--brand-500);
}

.hl-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-title);
  margin-bottom: 2px;
}

.hl-desc {
  font-size: 12px;
  color: var(--text-hint);
}

/* ---------------- 右侧表单区 ---------------- */
.form-side {
  flex: 1;
  padding: 56px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-head {
  margin-bottom: 26px;
}

.form-head h3 {
  font-size: 23px;
  font-weight: 500;
  letter-spacing: -0.3px;
  color: var(--text-title);
  margin-bottom: 8px;
}

.form-head p {
  font-size: 13px;
  color: var(--text-muted);
}

/* ---------------- 登录 / 注册 切换 ---------------- */
.tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  margin-bottom: 26px;
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
}

.tab-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  border-radius: var(--radius-pill);
  background: var(--brand-gradient);
  box-shadow: 0 4px 12px rgba(91, 111, 216, 0.28);
  transition: transform 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.tab {
  position: relative;
  z-index: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.25s ease;
}

.tab.active {
  color: #fff;
}

/* ---------------- 表单 ---------------- */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form :deep(.el-input__wrapper) {
  padding: 7px 16px;
  border-radius: 14px;
  background: var(--surface-sunken);
  box-shadow: none;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.form :deep(.el-input__wrapper:hover) {
  background: #eef1f9;
}

.form :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  box-shadow: 0 0 0 1.5px var(--brand-400) inset;
}

.submit {
  width: 100%;
  margin-top: 10px;
  padding: 13px 26px;
  font-size: 15px;
}

.submit:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.tip {
  margin-top: 22px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.tip span {
  margin-left: 2px;
  color: var(--brand-500);
  cursor: pointer;
}

.tip span:hover {
  text-decoration: underline;
}

.demo-tip {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: var(--text-hint);
}

/* ---------------- 表单切换过渡 ---------------- */
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.swap-enter-from {
  opacity: 0;
  transform: translate3d(14px, 0, 0);
}

.swap-leave-to {
  opacity: 0;
  transform: translate3d(-14px, 0, 0);
}

/* ---------------- 响应式 ---------------- */
@media (max-width: 860px) {
  .login-card {
    max-width: 440px;
    min-height: auto;
  }
  .brand-side {
    display: none;
  }
  .form-side {
    padding: 44px 32px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-card,
  .orb {
    animation: none;
  }
}
</style>
