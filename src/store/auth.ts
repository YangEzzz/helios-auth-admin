import { defineStore } from 'pinia'
import type { UserInfo } from '@/api/user/type'
import { ref } from 'vue'
import { isLoggedIn, removeToken, setToken } from '@/utils/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isLogin = ref(isLoggedIn())
  const userInfo = ref<UserInfo | null>(null)

  // Action: 登录成功后保存状态
  const loginSuccess = (token: string, user: UserInfo) => {
    setToken(token)
    isLogin.value = true
    userInfo.value = user
  }

  // Action: 退出登录或 token 失效时清理状态
  const logout = () => {
    removeToken()
    isLogin.value = false
    userInfo.value = null
  }

  return {
    isLogin,
    userInfo,
    loginSuccess,
    logout,
  }
}, {
  // 关闭用户信息持久化，确保每次刷新页面都通过 token 重新向后端校验
  persist: false,
})
