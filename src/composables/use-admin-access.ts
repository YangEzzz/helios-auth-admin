import { computed } from 'vue'
import { isAdminRole } from '@/lib/accounts'
import { useAuthStore } from '@/store/auth'

export function useAdminAccess() {
  const auth = useAuthStore()
  const allowed = computed(() => isAdminRole(auth.userInfo?.role))
  return { allowed, canManage: () => allowed.value }
}
