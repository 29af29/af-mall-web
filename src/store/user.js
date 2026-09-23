import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    cartCount: 0
  }),
  getters: {
    isLogin: (state) => !!state.token,
    userId: (state) => state.userInfo?.userId,
    nickname: (state) => state.userInfo?.nickname || state.userInfo?.username || '未登录'
  },
  actions: {
    async login(form) {
      const data = await authApi.login(form)
      this.token = data.token
      this.userInfo = data
      localStorage.setItem('token', data.token)
      localStorage.setItem('userInfo', JSON.stringify(data))
      return data
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
