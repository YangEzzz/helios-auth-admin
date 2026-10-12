import { computed } from 'vue'
import { sidebarData } from '@/components/app-sidebar/data/sidebar-data'
import { useAuthStore } from '@/store/auth'

export function useSidebar() {
  const auth = useAuthStore()
  const navData = computed(() => sidebarData.navMain.map(group => ({ ...group, items: group.items.filter(item => !item.roles?.length || item.roles.includes(auth.userInfo?.role || '')) })).filter(group => group.items.length))
  const otherPages = computed(() => [])
  return { navData, otherPages, settingsNavItems: [] }
}
