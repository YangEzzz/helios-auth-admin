<script setup lang="ts">
import { useCookies } from '@vueuse/integrations/useCookies'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

import { sidebarData } from '@/components/app-sidebar/data/sidebar-data'
import AppSidebar from '@/components/app-sidebar/index.vue'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { SIDEBAR_COOKIE_NAME } from '@/components/ui/sidebar/utils'
import { useThemeStore } from '@/store'

const defaultOpen = useCookies([SIDEBAR_COOKIE_NAME])
const themeStore = useThemeStore()
const { contentLayout } = storeToRefs(themeStore)
const route = useRoute()
const pageTitle = computed(() => String(route.meta.title || sidebarData.navMain.flatMap(group => group.items).find(item => item.url === route.path)?.title || '工作空间'))
watch(pageTitle, title => document.title = `${title} · Helios`, { immediate: true })
</script>

<template>
  <SidebarProvider :default-open="defaultOpen.get(SIDEBAR_COOKIE_NAME)">
    <a href="#page-content" class="skip-link">跳转到页面内容</a>
    <AppSidebar />
    <SidebarInset class="min-w-0">
      <SidebarTrigger class="fixed left-3 top-3 z-40 size-9 border bg-card shadow-sm md:hidden" aria-label="打开导航菜单" />
      <div
        id="page-content" tabindex="-1"
        class="app-content min-w-0 grow px-4 pb-6 pt-16 outline-none sm:px-8 md:py-8"
        :class="contentLayout === 'centered' ? 'mx-auto w-full max-w-[1560px]' : 'w-full'"
      >
        <router-view />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
