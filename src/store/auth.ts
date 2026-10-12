import type { UserInfo } from '@/api/user/type'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logoutSSOSession } from '@/api/sso/auth'
import { clearLegacyAuth } from '@/utils/session'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const isLogin = ref(false)
  const initialized = ref(false)
  const userInfo = ref<UserInfo | null>(null)

  // Action: 登录成功后保存状态
  const loginSuccess = (_token: string, user: UserInfo) => {
    clearLegacyAuth()
    initialized.value = true
    isLogin.value = true
    userInfo.value = user
  }

  // Action: 会话失效时清理前端状态。
  const clearSession = () => {
    clearLegacyAuth()
    isLogin.value = false
    userInfo.value = null
  }
  const logout = async () => {
    await logoutSSOSession()
    clearSession()
  }

  return {
    isLogin,
    userInfo,
    initialized,
    clearSession,
    loginSuccess,
    logout,
  }
}, {
  // 每次刷新都向后端确认 Cookie 会话。
  persist: false,
})
