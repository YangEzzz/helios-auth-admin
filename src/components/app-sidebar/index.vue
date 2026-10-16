<script lang="ts" setup>
import type { NavGroup, NavItem } from './types'
import { computed } from 'vue'
import ThemePopover from '@/components/custom-theme/theme-popover.vue'
import ToggleTheme from '@/components/toggle-theme.vue'
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
    <UiSidebarHeader class="border-b border-sidebar-border px-3 py-6">
      <TeamSwitcher :teams="sidebarData.teams" />
    </UiSidebarHeader>

    <UiSidebarContent class="px-2 py-4">
      <NavTeam :nav-main="visibleNavMain" />
    </UiSidebarContent>

    <div class="mx-4 mb-5 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4 group-data-[collapsible=icon]:hidden">
      <p class="text-xs font-semibold text-sidebar-foreground">
        身份与访问控制
      </p>
      <p class="mt-2 text-xs leading-5 text-sidebar-foreground/65">
        从账户审批到项目授权，在同一个工作空间管理。
      </p>
    </div>
    <UiSidebarFooter class="border-t border-sidebar-border px-3 py-4">
      <div class="mb-3 flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
        <span class="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">外观与导航</span>
        <div class="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
          <ToggleTheme /><ThemePopover /><UiSidebarTrigger class="hidden md:flex" aria-label="展开或收起导航" />
        </div>
      </div>
      <NavFooter :user="sidebarData.user" />
    </UiSidebarFooter>

    <UiSidebarRail />
  </UiSidebar>
</template>
