<script setup lang="ts">
// Removed unused User type

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  UserRoundCog,
} from 'lucide-vue-next'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'

import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'

// const { user } = defineProps<{ user: User }>()

const authStore = useAuthStore()
const router = useRouter()
const { isMobile, open } = useSidebar()

const user = computed(() => {
  return authStore.userInfo || {
    name: 'User',
    email: 'user@helios.dev',
    avatar: '',
  }
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="size-8 rounded-lg">
              <AvatarImage :src="user.avatar || ''" :alt="user.name || 'User'" />
              <AvatarFallback class="rounded-lg">
                {{ (user.name || 'User').slice(0, 2).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-sm leading-tight text-left">
              <span class="font-semibold truncate">{{ user.name || 'User' }}</span>
              <span class="text-xs truncate">{{ user.email || '' }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="(isMobile || open) ? 'bottom' : 'right'"
          align="start"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar class="size-8 rounded-lg">
              <AvatarImage :src="user.avatar || ''" :alt="user.name || 'User'" />
              <AvatarFallback class="rounded-lg font-black bg-primary/10 text-primary">
                {{ (user.name || 'User').slice(0, 1).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
              <div class="grid flex-1 text-sm leading-tight text-left">
                <span class="font-semibold truncate">{{ user.name || 'User' }}</span>
                <span class="text-xs truncate">{{ user.email || '' }}</span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="router.push('/profile')">
              <BadgeCheck class="size-4" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuItem @click="router.push('/settings')">
              <UserRoundCog class="size-4" />
              账户设置
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuItem @click="handleLogout">
            <LogOut />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
