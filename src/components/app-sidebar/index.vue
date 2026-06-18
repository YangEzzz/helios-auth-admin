<script lang="ts" setup>
import type { NavGroup, NavItem } from './types'
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { sidebarData } from './data/sidebar-data'
import NavFooter from './nav-footer.vue'
import NavTeam from './nav-team.vue'
import TeamSwitcher from './team-switcher.vue'

const authStore = useAuthStore()

const canShowItem = (item: NavItem, role?: string) => {
  return !item.roles?.length || (!!role && item.roles.includes(role))
}

const visibleNavMain = computed<NavGroup[]>(() => {
  const role = authStore.userInfo?.role
  return sidebarData.navMain
    .map(group => ({
      ...group,
      items: group.items.filter(item => canShowItem(item, role)),
    }))
    .filter(group => group.items.length > 0)
})
</script>

<template>
  <UiSidebar collapsible="icon" class="z-50">
    <UiSidebarHeader>
      <TeamSwitcher :teams="sidebarData.teams" />
    </UiSidebarHeader>

    <UiSidebarContent>
      <NavTeam :nav-main="visibleNavMain" />
    </UiSidebarContent>

    <UiSidebarFooter>
      <NavFooter :user="sidebarData.user" />
    </UiSidebarFooter>

    <UiSidebarRail />
  </UiSidebar>
</template>
