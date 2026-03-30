<script setup lang="ts">
import type { MyProjectMembership } from '@/api/project/type'
import dayjs from 'dayjs'
import {
  ArrowRight,
  FolderOpen,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
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

const roleMap: Record<string, { label: string, class: string, accent: string }> = {
  owner: {
    label: 'Owner',
    class: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300',
    accent: 'from-fuchsia-500/80 to-violet-500/35',
  },
  developer: {
    label: '开发者',
    class: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    accent: 'from-sky-500/80 to-cyan-500/35',
  },
  tester: {
    label: '测试者',
    class: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    accent: 'from-amber-500/80 to-orange-500/35',
  },
  viewer: {
    label: '只读',
    class: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
    accent: 'from-slate-500/80 to-slate-400/35',
  },
}

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

onMounted(() => {
  fetchMyProjects()
})
</script>

<template>
  <BasicPage title="我的项目" description="查看当前账号已获授权的项目列表">
    <template #actions>
      <UiButton variant="outline" size="sm" :disabled="loading" @click="fetchMyProjects">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
        刷新列表
      </UiButton>
    </template>

    <div class="space-y-6">
      <section class="space-y-4">
        <div class="flex flex-col gap-3 rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(135deg,_rgba(15,23,42,0.03),_rgba(255,255,255,0))] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div class="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles class="h-4 w-4 text-primary" />
            共 {{ projectCards.length }} 个已授权项目
          </div>
          <div class="relative w-full sm:max-w-sm">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <UiInput v-model="searchQuery" class="pl-9" placeholder="搜索项目名称、标识或描述..." />
          </div>
        </div>

        <div v-if="loading && !projectCards.length" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <UiCard v-for="index in 6" :key="index" class="rounded-3xl border-border/50">
            <UiCardContent class="space-y-4 p-6">
              <UiSkeleton class="h-5 w-24" />
              <UiSkeleton class="h-4 w-32" />
              <UiSkeleton class="h-16 w-full" />
              <UiSkeleton class="h-10 w-full" />
            </UiCardContent>
          </UiCard>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <UiCard
            v-for="project in filteredProjects"
            :key="project.id"
            class="group overflow-hidden rounded-3xl border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
          >
            <div class="h-1.5 w-full bg-gradient-to-r" :class="[(roleMap[project.role] ?? roleMap.viewer).accent]" />
            <UiCardHeader class="pb-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex min-w-0 items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FolderOpen class="h-5 w-5" />
                  </div>
                  <div class="min-w-0">
                    <UiCardTitle class="truncate text-base">
                      {{ project.name }}
                    </UiCardTitle>
                    <p class="mt-1 truncate text-xs text-muted-foreground">
                      {{ project.key }}
                    </p>
                  </div>
                </div>
                <span class="rounded-full border px-2.5 py-1 text-xs font-medium" :class="[(roleMap[project.role] ?? roleMap.viewer).class]">
                  {{ (roleMap[project.role] ?? { label: project.role || '未设置' }).label }}
                </span>
              </div>
            </UiCardHeader>

            <UiCardContent class="space-y-4">
              <p class="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
                {{ project.description }}
              </p>

              <div class="rounded-2xl border border-border/50 bg-muted/25 p-4">
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>授权日期</span>
                  <span class="font-mono text-foreground">{{ dayjs(project.grantedAt).format('YYYY-MM-DD') }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>最近变化</span>
                  <span>{{ project.grantedAtText }}</span>
                </div>
              </div>
            </UiCardContent>

            <UiCardFooter class="border-t border-border/50 pt-4">
              <div class="flex w-full items-center justify-end">
                <RouterLink
                  :to="`/projects/${project.id}`"
                  class="inline-flex items-center gap-1 text-sm font-medium text-primary transition-transform group-hover:translate-x-0.5"
                >
                  查看详情
                  <ArrowRight class="h-4 w-4" />
                </RouterLink>
              </div>
            </UiCardFooter>
          </UiCard>

          <div
            v-if="!filteredProjects.length"
            class="col-span-full flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed bg-card px-6 text-center"
          >
            <FolderOpen class="mb-4 h-12 w-12 text-muted-foreground/30" />
            <p class="text-base font-medium">
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
