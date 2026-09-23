import axios from 'axios'
import { ElMessage } from 'element-plus'

// Axios 实例：baseURL 走 /api，由 vite 代理到网关 8000
const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一处理 Result 结构 {code, message, data}
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 业务成功
    if (res.code === 200) {
      return res.data
    }
    // 业务层未登录（兜底）
    if (res.code === 401) {
      handleUnauthorized(res.message)
      return Promise.reject(res)
    }
    // 其他业务异常
    ElMessage.error(res.message || '操作失败')
    return Promise.reject(res)
  },
  (error) => {
    // HTTP 层错误（网关 401 拦截等）
    const status = error.response?.status
    const msg = error.response?.data?.message
    if (status === 401) {
      handleUnauthorized(msg || '登录已过期')
    } else if (status === 429) {
      ElMessage.warning(msg || '系统繁忙，请稍后再试')
    } else {
      ElMessage.error(msg || '网络异常，请稍后重试')
    }
    return Promise.reject(error)
  }
)

function handleUnauthorized(message) {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  ElMessage.error(message || '请先登录')
  // 避免重复跳转
  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

export default request
