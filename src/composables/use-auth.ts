import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/store/auth'

export function useAuth() {
  const router = useRouter()

  const authStore = useAuthStore()
  const loading = ref(false)

  async function logout() {
    if (loading.value)
      return
    loading.value = true
    try {
      await authStore.logout()
      await router.push('/login')
    }
    catch (cause) {
      toast.error(cause instanceof Error ? cause.message : '退出失败，请重试')
    }
    finally { loading.value = false }
  }

  async function login() {
    await router.push({ path: '/login', query: router.currentRoute.value.query })
  }

  return {
    loading,
    logout,
    login,
  }
}
