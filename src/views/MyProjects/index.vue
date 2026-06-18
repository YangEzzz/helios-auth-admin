<script setup lang="ts">
import type { MyProjectMembership } from '@/api/project/type'
import dayjs from 'dayjs'
import {
  BadgeCheck,
  Clock3,
  Copy,
  FolderOpen,
  KeyRound,
  RefreshCw,
  Search,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { reqMyProjects } from '@/api/project'
import { BasicPage } from '@/components/global-layout'

interface MyProjectCard {
  id: string
  name: string
  key: string
  description: string
  role: string
  grantedAt: string
  grantedAtText: string
}

const searchQuery = ref('')
const loading = ref(false)
const memberships = ref<MyProjectMembership[]>([])

const roleMap: Record<string, { label: string, class: string, iconClass: string, accent: string }> = {
  admin: {
    label: '管理员',
    class: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
    iconClass: 'bg-cyan-500/10 text-cyan-700 ring-cyan-500/15 dark:text-cyan-300',
    accent: 'from-cyan-500 to-teal-400',
  },
  productor: {
    label: '产品',
    class: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    iconClass: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300',
    accent: 'from-emerald-500 to-lime-400',
  },
  owner: {
    label: '负责人',
    class: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
    iconClass: 'bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/15 dark:text-fuchsia-300',
    accent: 'from-fuchsia-500 to-violet-400',
  },
  developer: {
    label: '开发',
    class: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    iconClass: 'bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:text-sky-300',
    accent: 'from-sky-500 to-blue-400',
  },
  tester: {
    label: '测试者',
    class: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    iconClass: 'bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300',
    accent: 'from-amber-500 to-orange-400',
  },
  viewer: {
    label: '只读',
    class: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    iconClass: 'bg-slate-500/10 text-slate-700 ring-slate-500/15 dark:text-slate-300',
    accent: 'from-slate-500 to-slate-400',
  },
}

const defaultRoleStyle = roleMap.viewer

const humanizeSince = (dateString?: string) => {
  if (!dateString)
    return '未知'

  const diffHours = dayjs().diff(dayjs(dateString), 'hour')

  if (diffHours < 1)
    return '刚刚'
  if (diffHours < 24)
    return `${diffHours} 小时前`

  const diffDays = dayjs().diff(dayjs(dateString), 'day')
  if (diffDays < 7)
    return `${diffDays} 天前`

  return dayjs(dateString).format('YYYY-MM-DD')
}

const projectCards = computed<MyProjectCard[]>(() => {
  return memberships.value
    .filter(item => item.project)
    .map((item) => {
      const project = item.project!
      return {
        id: project.id,
        name: project.project_name,
        key: project.project_id_string,
        description: project.description || '暂无项目描述，建议联系项目负责人补充接入说明。',
        role: item.role_in_project,
        grantedAt: item.created_at,
        grantedAtText: humanizeSince(item.created_at),
      }
    })
})

const filteredProjects = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword)
    return projectCards.value

  return projectCards.value.filter(project =>
    project.name.toLowerCase().includes(keyword)
    || project.key.toLowerCase().includes(keyword)
    || project.description.toLowerCase().includes(keyword),
  )
})

const fetchMyProjects = async () => {
  loading.value = true
  try {
    const res = await reqMyProjects()
    memberships.value = res.data.projects || []
  }
  catch (error: any) {
    toast.error(error.message || '加载我的项目失败')
  }
  finally {
    loading.value = false
  }
}

const copyProjectKey = async (key: string) => {
  try {
    await navigator.clipboard.writeText(key)
    toast.success('项目标识已复制')
  }
  catch {
    toast.error('复制失败，请手动复制')
  }
}

onMounted(() => {
  fetchMyProjects()
})
</script>

<template>
  <BasicPage title="我的项目" description="查看当前账号已获授权的项目与角色">
    <template #actions>
      <UiButton variant="outline" size="sm" :disabled="loading" class="cursor-pointer rounded-full" @click="fetchMyProjects">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
        刷新列表
      </UiButton>
    </template>

    <div class="space-y-5">
      <section class="rounded-2xl border border-border/60 bg-card p-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-semibold text-foreground">
              已授权项目
              <span class="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {{ projectCards.length }}
              </span>
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              查看当前账号在各业务系统中的项目角色
            </p>
          </div>

          <div class="relative w-full lg:max-w-sm">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <UiInput
              v-model="searchQuery"
              class="h-10 rounded-xl pl-9"
              placeholder="搜索项目名称、标识或描述"
            />
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div v-if="loading && !projectCards.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <UiCard v-for="index in 6" :key="index" class="rounded-2xl border-border/50">
            <UiCardContent class="space-y-4 p-6">
              <UiSkeleton class="h-5 w-24" />
              <UiSkeleton class="h-4 w-32" />
              <UiSkeleton class="h-16 w-full" />
              <UiSkeleton class="h-10 w-full" />
            </UiCardContent>
          </UiCard>
        </div>

        <div v-else class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="project in filteredProjects"
            :key="project.id"
            class="group relative overflow-hidden rounded-2xl border border-border/60 bg-card transition-colors duration-200 hover:border-cyan-500/35 hover:bg-cyan-50/35 dark:hover:bg-cyan-950/10"
          >
            <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r" :class="[(roleMap[project.role] ?? defaultRoleStyle).accent]" />

            <div class="relative flex h-full flex-col p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1" :class="[(roleMap[project.role] ?? defaultRoleStyle).iconClass]">
                    <KeyRound class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <h3 class="truncate text-sm font-semibold text-foreground">
                      {{ project.name }}
                    </h3>
                    <p class="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {{ project.key }}
                    </p>
                  </div>
                </div>
                <span class="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold" :class="[(roleMap[project.role] ?? defaultRoleStyle).class]">
                  {{ (roleMap[project.role] ?? { label: project.role || '未设置' }).label }}
                </span>
              </div>

              <p class="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                {{ project.description }}
              </p>

              <div class="mt-4 grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock3 class="h-3.5 w-3.5" />
                    授权时间
                  </div>
                  <p class="mt-2 font-mono text-xs font-semibold text-foreground">
                    {{ project.grantedAt ? dayjs(project.grantedAt).format('YYYY-MM-DD') : '未知' }}
                  </p>
                </div>
                <div class="rounded-xl border border-border/50 bg-muted/20 p-3">
                  <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <BadgeCheck class="h-3.5 w-3.5" />
                    最近变化
                  </div>
                  <p class="mt-2 text-xs font-semibold text-foreground">
                    {{ project.grantedAtText }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-end border-t border-border/60 pt-3">
                <UiButton
                  variant="ghost"
                  size="sm"
                  class="h-8 cursor-pointer rounded-full px-3 text-xs text-cyan-700 hover:bg-cyan-500/10 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                  @click="copyProjectKey(project.key)"
                >
                  <Copy class="mr-1.5 h-3.5 w-3.5" />
                  复制标识
                </UiButton>
              </div>
            </div>
          </article>

          <div
            v-if="!filteredProjects.length"
            class="col-span-full flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center"
          >
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <FolderOpen class="h-6 w-6" />
            </div>
            <p class="text-base font-semibold">
              暂无匹配项目
            </p>
            <p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              可能是当前账号还没有被授予项目权限，或者搜索条件过于严格。
            </p>
          </div>
        </div>
      </section>
    </div>
  </BasicPage>
</template>
