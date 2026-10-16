<script setup lang="ts">
import type { MyProjectMembership } from '@/api/project/type'
import dayjs from 'dayjs'
import {
  Copy,
  FolderOpen,
  KeyRound,
  RefreshCw,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { reqMyProjects } from '@/api/project'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import SearchInput from '@/components/search-input.vue'
import SummaryMetrics from '@/components/summary-metrics.vue'
import { errorMessage } from '@/lib/errors'

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
const loadError = ref('')
const memberships = ref<MyProjectMembership[]>([])

const roleMap: Record<string, { label: string, class: string, iconClass: string, accent: string }> = {
  admin: {
    label: '管理员',
    class: 'border-border bg-muted text-foreground',
    iconClass: 'bg-muted text-foreground ring-border',
    accent: 'from-cyan-500 to-teal-400',
  },
  productor: {
    label: '产品',
    class: 'border-border bg-muted text-foreground',
    iconClass: 'bg-muted text-foreground ring-border',
    accent: 'from-emerald-500 to-lime-400',
  },
  owner: {
    label: '负责人',
    class: 'border-border bg-muted text-foreground',
    iconClass: 'bg-muted text-foreground ring-border',
    accent: 'from-fuchsia-500 to-violet-400',
  },
  developer: {
    label: '开发',
    class: 'border-border bg-muted text-foreground',
    iconClass: 'bg-muted text-foreground ring-border',
    accent: 'from-sky-500 to-blue-400',
  },
  tester: {
    label: '测试者',
    class: 'border-border bg-muted text-foreground',
    iconClass: 'bg-muted text-foreground ring-border',
    accent: 'from-amber-500 to-orange-400',
  },
  viewer: {
    label: '只读',
    class: 'border-border bg-muted text-foreground',
    iconClass: 'bg-muted text-foreground ring-border',
    accent: 'from-slate-500 to-slate-400',
  },
}

const defaultRoleStyle = { label: '只读', class: 'bg-muted text-muted-foreground', iconClass: 'bg-muted text-foreground ring-border', accent: 'from-slate-500 to-slate-400' }

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
  loadError.value = ''
  try {
    const res = await reqMyProjects()
    memberships.value = res.data.projects || []
  }
  catch (error: unknown) {
    loadError.value = errorMessage(error)
    toast.error(loadError.value)
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
  <BasicPage title="我的项目" description="你的项目访问权限与团队角色">
    <template #actions>
      <UiButton variant="outline" :disabled="loading" @click="fetchMyProjects">
        <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />刷新列表
      </UiButton>
    </template>
    <QueryError v-if="loadError" :message="loadError" class="mb-5" @retry="fetchMyProjects" />
    <div class="space-y-6">
      <SummaryMetrics
        :unavailable="!!loadError"
        :loading="loading && !projectCards.length" :items="[
          { label: '授权项目', value: projectCards.length, note: '当前账户拥有访问权限', icon: FolderOpen },
          { label: '角色类型', tone: 'violet', value: new Set(projectCards.map(project => project.role)).size, note: '你在不同项目中的身份', icon: KeyRound },
        ]"
      />
      <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 class="text-base font-semibold">
            项目工作空间
          </h2><p class="mt-1 text-xs text-muted-foreground">
            项目权限由管理员维护，可复制标识用于业务接入。
          </p>
        </div><SearchInput v-model="searchQuery" label="搜索项目" placeholder="搜索项目名称、标识或描述" class="w-full sm:w-80" />
      </header>
      <div v-if="loading && !projectCards.length" class="workspace-panel flex min-h-64 items-center justify-center gap-3" role="status">
        <UiSpinner class="size-5" /><span class="text-sm text-muted-foreground">正在加载项目…</span>
      </div>
      <section v-else-if="!loadError" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="project in filteredProjects" :key="project.id" class="workspace-panel flex min-w-0 flex-col overflow-hidden">
          <div class="flex-1 p-6">
            <div class="mb-5 flex items-start justify-between">
              <div class="flex size-12 items-center justify-center rounded-xl detail-icon text-xl font-semibold">
                {{ project.name.slice(0, 1) }}
              </div><span class="rounded-md border px-2 py-1 text-xs" :class="(roleMap[project.role] ?? defaultRoleStyle).class">{{ (roleMap[project.role] ?? { label: project.role || '未设置' }).label }}</span>
            </div><h3 class="text-lg font-semibold">
              {{ project.name }}
            </h3><p class="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
              {{ project.description }}
            </p><div class="mt-4 rounded-lg bg-muted/50 p-3">
              <p class="text-[11px] text-muted-foreground">
                项目标识
              </p><p class="mt-1 break-all font-mono text-xs">
                {{ project.key }}
              </p>
            </div>
          </div><footer class="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3">
            <span class="text-xs text-muted-foreground">授权于 {{ project.grantedAt ? dayjs(project.grantedAt).format('YYYY-MM-DD') : '未知' }}</span><UiButton variant="ghost" size="sm" class="text-primary" @click="copyProjectKey(project.key)">
              <Copy class="size-3.5" />复制标识
            </UiButton>
          </footer>
        </article>
        <div v-if="!filteredProjects.length" class="workspace-panel col-span-full flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
          <FolderOpen class="size-8 text-primary" /><h3 class="text-base font-medium">
            {{ searchQuery ? '没有匹配的项目' : '暂未获得项目访问权限' }}
          </h3><p class="text-sm text-muted-foreground">
            {{ searchQuery ? '尝试其他关键词，或清除搜索条件。' : '联系管理员为你的账户分配项目与角色。' }}
          </p><UiButton v-if="searchQuery" variant="outline" @click="searchQuery = ''">
            清除搜索
          </UiButton>
        </div>
      </section>
    </div>
  </BasicPage>
</template>
