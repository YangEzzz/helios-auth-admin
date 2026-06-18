<script lang="ts" setup>
import type { Team } from './types'
import type { ProjectInfo } from '@/api/project/type'
import {
  ChevronsUpDown,
  ExternalLink,
  FolderOpen,
  Loader2,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { reqListProjects, reqMyProjects } from '@/api/project'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar'
import { useAuthStore } from '@/store/auth'

const { teams } = defineProps<{
  teams: Team[]
}>()

const { isMobile, open } = useSidebar()
const router = useRouter()
const authStore = useAuthStore()

const activeTeam = computed(() => teams[0])
const projects = ref<ProjectInfo[]>([])
const loading = ref(false)
const menuOpen = ref(false)

const canReadAllProjects = computed(() => {
  const role = authStore.userInfo?.role
  return role === 'admin' || role === 'super_admin'
})

function normalizeProjectUrl(url?: string) {
  const trimmed = url?.trim()
  if (!trimmed)
    return ''
  if (/^https?:\/\//i.test(trimmed))
    return trimmed
  return `https://${trimmed}`
}

async function fetchProjects() {
  loading.value = true
  try {
    if (canReadAllProjects.value) {
      const res = await reqListProjects()
      projects.value = res.data.projects || []
      return
    }

    const res = await reqMyProjects()
    projects.value = (res.data.projects || [])
      .map(item => item.project)
      .filter(Boolean) as ProjectInfo[]
  }
  catch {
    projects.value = []
  }
  finally {
    loading.value = false
  }
}

function openProject(project: ProjectInfo) {
  const url = normalizeProjectUrl(project.project_url)
  if (!url) {
    toast.info('该项目还没有配置网址')
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
  menuOpen.value = false
}

function goProjects() {
  menuOpen.value = false
  router.push('/projects')
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu v-model:open="menuOpen" @update:open="value => value && fetchProjects()">
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div class="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg bg-transparent text-sidebar-primary-foreground">
              <img
                v-if="activeTeam.logoUrl"
                :src="activeTeam.logoUrl"
                :alt="activeTeam.name"
                class="h-full w-full object-contain"
              >
              <component :is="activeTeam.logo" v-else class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ activeTeam.name }}</span>
              <span class="truncate text-xs">{{ activeTeam.plan }}</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          class="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
          align="start"
          :side="(isMobile || open) ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            项目入口
          </DropdownMenuLabel>

          <div v-if="loading" class="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            正在加载项目...
          </div>

          <template v-else-if="projects.length > 0">
            <DropdownMenuItem
              v-for="project in projects"
              :key="project.id"
              class="gap-2 p-2"
              @click="openProject(project)"
            >
              <div class="flex size-7 items-center justify-center rounded-md border bg-background text-primary">
                <FolderOpen class="size-4" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">
                  {{ project.project_name }}
                </div>
                <div class="truncate font-mono text-[11px] text-muted-foreground">
                  {{ project.project_url || '未配置网址' }}
                </div>
              </div>
              <ExternalLink v-if="project.project_url" class="size-3.5 text-muted-foreground" />
            </DropdownMenuItem>
          </template>

          <div v-else class="px-2 py-3 text-xs text-muted-foreground">
            暂无可用项目入口
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem class="gap-2 p-2 text-muted-foreground" @click="goProjects">
            <div class="flex size-7 items-center justify-center rounded-md border bg-background">
              <FolderOpen class="size-4" />
            </div>
            查看全部项目
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
