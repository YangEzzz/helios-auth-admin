<script setup lang="ts">
import type {
  ActivityFeedItem,
  DashboardPayload,
  DashboardStat,
  MyProjectItem,
  TrendPoint,
} from '@/api/dashboard/type'
import dayjs from 'dayjs'
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  RefreshCw,
  Shield,
  Sparkles,
  User,
  Users,
  XCircle,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import { reqDashboard } from '@/api/dashboard'
import { BasicPage } from '@/components/global-layout'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const loading = ref(false)
const dashboard = ref<DashboardPayload | null>(null)

const roleMode = computed(() => dashboard.value?.role_mode ?? 'user')
const currentUser = computed(() => authStore.userInfo)
const adminData = computed(() => dashboard.value?.admin)
const userData = computed(() => dashboard.value?.user)
const generatedAtLabel = computed(() => {
  if (!dashboard.value?.generated_at)
    return '暂未同步'
  return dayjs(dashboard.value.generated_at).format('YYYY-MM-DD HH:mm:ss')
})

const statusMap = {
  pending: { label: '待处理', class: 'bg-amber-500/12 text-amber-700 border-amber-500/20 dark:text-amber-300' },
  approved: { label: '已通过', class: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/20 dark:text-emerald-300' },
  rejected: { label: '已拒绝', class: 'bg-rose-500/12 text-rose-700 border-rose-500/20 dark:text-rose-300' },
} as const

const roleMap: Record<string, { label: string, class: string }> = {
  owner: { label: 'Owner', class: 'bg-fuchsia-500/12 text-fuchsia-700 border-fuchsia-500/20 dark:text-fuchsia-300' },
  developer: { label: '开发者', class: 'bg-sky-500/12 text-sky-700 border-sky-500/20 dark:text-sky-300' },
  tester: { label: '测试者', class: 'bg-amber-500/12 text-amber-700 border-amber-500/20 dark:text-amber-300' },
  viewer: { label: '只读', class: 'bg-slate-500/12 text-slate-700 border-slate-500/20 dark:text-slate-300' },
}

function statIcon(stat: DashboardStat) {
  switch (stat.emphasis) {
    case 'users':
      return Users
    case 'approvals':
      return Clock3
    case 'projects':
      return FolderKanban
    case 'audit':
      return Shield
    case 'roles':
      return Shield
    case 'access':
      return Activity
    default:
      return Sparkles
  }
}

function statIconClass(stat: DashboardStat) {
  switch (stat.tone) {
    case 'success':
      return 'text-emerald-500'
    case 'warning':
      return 'text-amber-500'
    case 'accent':
      return 'text-violet-500'
    case 'muted':
      return 'text-muted-foreground'
    default:
      return 'text-sky-500'
  }
}

function activityToneClass(item: ActivityFeedItem) {
  switch (item.tone) {
    case 'success':
      return 'bg-emerald-500/12 text-emerald-600 border-emerald-500/20'
    case 'danger':
      return 'bg-rose-500/12 text-rose-600 border-rose-500/20'
    case 'info':
      return 'bg-sky-500/12 text-sky-600 border-sky-500/20'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function activityIcon(item: ActivityFeedItem) {
  switch (item.tone) {
    case 'success':
      return CheckCircle2
    case 'danger':
      return XCircle
    default:
      return Activity
  }
}

function roleBadge(project: MyProjectItem) {
  return roleMap[project.role] ?? {
    label: project.role || '未设置',
    class: 'bg-muted text-muted-foreground border-border',
  }
}

async function fetchDashboard() {
  loading.value = true
  try {
    const res = await reqDashboard()
    dashboard.value = res.data
  }
  catch (error: any) {
    toast.error(error.message || '仪表盘加载失败')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})

const projectHighlights = computed(() => (userData.value?.projects ?? []).slice(0, 3))

const trendMax = computed(() => {
  const values = adminData.value?.project_trend?.map(point => point.value) ?? []
  return Math.max(...values, 1)
})

function trendHeight(point: TrendPoint) {
  return `${Math.max((point.value / trendMax.value) * 100, 10)}%`
}
</script>

<template>
  <BasicPage title="仪表盘" description="系统状态、授权节奏与个人工作流概览">
    <template #actions>
      <UiButton variant="outline" size="sm" :disabled="loading" @click="fetchDashboard">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
        刷新数据
      </UiButton>
    </template>

    <div class="space-y-6">
      <section class="relative overflow-hidden rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.15),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.04),_rgba(255,255,255,0))] p-6 sm:p-8">
        <div class="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(90deg,_transparent,_rgba(255,255,255,0.18))] lg:block" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl space-y-3">
            <div class="inline-flex items-center gap-2 rounded-full border border-white/50 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles class="h-3.5 w-3.5 text-primary" />
              数据更新时间 {{ generatedAtLabel }}
            </div>
            <div class="space-y-2">
              <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
                {{ userData?.welcome_title || `你好，${currentUser?.name || 'Helios 用户'}` }}
              </h2>
              <p class="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                {{ roleMode === 'admin' ? adminData?.system_headline : userData?.welcome_note }}
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div class="rounded-2xl border border-white/50 bg-background/85 p-4 backdrop-blur">
              <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                当前身份
              </p>
              <p class="mt-2 text-lg font-semibold">
                {{ roleMode === 'admin' ? '管理员视角' : '个人工作台' }}
              </p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ currentUser?.email || '未读取到邮箱' }}
              </p>
            </div>
            <div class="rounded-2xl border border-white/50 bg-background/85 p-4 backdrop-blur">
              <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                账号状态
              </p>
              <p class="mt-2 text-lg font-semibold capitalize">
                {{ userData?.account_status || currentUser?.status || 'unknown' }}
              </p>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ roleMode === 'admin' ? '可查看审批、项目与审计节奏' : '可查看授权项目与最近行为' }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section v-if="loading && !dashboard" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <UiCard v-for="index in 4" :key="index" class="rounded-3xl border-border/50">
          <UiCardContent class="space-y-4 p-6">
            <UiSkeleton class="h-4 w-20" />
            <UiSkeleton class="h-9 w-28" />
            <UiSkeleton class="h-4 w-32" />
          </UiCardContent>
        </UiCard>
      </section>

      <template v-else-if="dashboard">
        <section v-if="roleMode === 'admin'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <UiCard v-for="stat in adminData?.stats" :key="stat.label" class="rounded-3xl border-border/50 shadow-sm">
            <UiCardContent class="p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm text-muted-foreground">
                    {{ stat.label }}
                  </p>
                  <p class="mt-3 text-3xl font-semibold tracking-tight">
                    {{ stat.value }}
                  </p>
                </div>
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                  <component :is="statIcon(stat)" class="h-5 w-5" :class="[statIconClass(stat)]" />
                </div>
              </div>
              <p class="mt-4 text-sm text-muted-foreground">
                {{ stat.trend }}
              </p>
            </UiCardContent>
          </UiCard>
        </section>

        <section v-else class="grid gap-4 md:grid-cols-3">
          <UiCard v-for="stat in userData?.summary" :key="stat.label" class="rounded-3xl border-border/50 shadow-sm">
            <UiCardContent class="p-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm text-muted-foreground">
                    {{ stat.label }}
                  </p>
                  <p class="mt-3 text-3xl font-semibold tracking-tight">
                    {{ stat.value }}
                  </p>
                </div>
                <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                  <component :is="statIcon(stat)" class="h-5 w-5" :class="[statIconClass(stat)]" />
                </div>
              </div>
              <p class="mt-4 text-sm text-muted-foreground">
                {{ stat.trend }}
              </p>
            </UiCardContent>
          </UiCard>
        </section>

        <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <UiCard v-if="roleMode === 'admin'" class="rounded-3xl border-border/50 shadow-sm">
            <UiCardHeader class="space-y-1 pb-2">
              <UiCardTitle>最近审批节奏</UiCardTitle>
              <UiCardDescription>优先关注最新通过与拒绝动作，减少待处理堆积。</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div
                v-for="item in adminData?.approval_feed"
                :key="item.id"
                class="flex items-center gap-4 rounded-2xl border border-border/50 bg-muted/20 p-4"
              >
                <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-background shadow-sm">
                  <User class="h-5 w-5 text-muted-foreground" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-medium">
                      {{ item.name }}
                    </p>
                    <span class="rounded-full border px-2 py-0.5 text-xs font-medium" :class="[statusMap[item.status].class]">
                      {{ statusMap[item.status].label }}
                    </span>
                  </div>
                  <p class="mt-1 truncate text-sm text-muted-foreground">
                    {{ item.email }}
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">
                    处理人：{{ item.operator }} · {{ item.time }}
                  </p>
                </div>
              </div>

              <div v-if="!adminData?.approval_feed?.length" class="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                最近还没有审批动作。
              </div>
            </UiCardContent>
          </UiCard>

          <UiCard v-else class="rounded-3xl border-border/50 shadow-sm">
            <UiCardHeader class="space-y-1 pb-2">
              <UiCardTitle>授权项目速览</UiCardTitle>
              <UiCardDescription>优先展示最近拿到权限的项目，方便继续进入工作流。</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-4">
              <div
                v-for="project in projectHighlights"
                :key="project.id"
                class="rounded-2xl border border-border/50 bg-muted/20 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold">
                      {{ project.name }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{ project.project_key }}
                    </p>
                  </div>
                  <span class="rounded-full border px-2 py-0.5 text-xs font-medium" :class="[roleBadge(project).class]">
                    {{ roleBadge(project).label }}
                  </span>
                </div>
                <p class="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {{ project.description || '暂无描述' }}
                </p>
                <div class="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>授权于 {{ project.granted_at }}</span>
                  <span>{{ project.granted_at_text }}</span>
                </div>
              </div>

              <div v-if="!projectHighlights.length" class="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                还没有项目授权记录。
              </div>
            </UiCardContent>
          </UiCard>

          <UiCard class="rounded-3xl border-border/50 shadow-sm">
            <UiCardHeader class="space-y-1 pb-2">
              <UiCardTitle>{{ roleMode === 'admin' ? '项目新增趋势' : '快捷入口' }}</UiCardTitle>
              <UiCardDescription>
                {{ roleMode === 'admin' ? '过去 7 天项目创建走势，帮助判断接入节奏。' : '把最常用的入口放在首页，减少跳转成本。' }}
              </UiCardDescription>
            </UiCardHeader>
            <UiCardContent>
              <div v-if="roleMode === 'admin'" class="flex h-[220px] items-end gap-3">
                <div v-for="point in adminData?.project_trend" :key="point.label" class="flex flex-1 flex-col items-center gap-3">
                  <div class="flex h-[170px] w-full items-end">
                    <div
                      class="w-full rounded-t-2xl bg-[linear-gradient(180deg,_rgba(14,165,233,0.95),_rgba(34,197,94,0.45))] transition-all"
                      :style="{ height: trendHeight(point) }"
                    />
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-medium">
                      {{ point.value }}
                    </p>
                    <p class="text-xs text-muted-foreground">
                      {{ point.label }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-else class="grid gap-3">
                <RouterLink
                  to="/my-projects"
                  class="group flex items-center justify-between rounded-2xl border border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
                      <FolderKanban class="h-5 w-5" />
                    </div>
                    <div>
                      <p class="text-sm font-medium">
                        我的项目
                      </p>
                      <p class="text-xs text-muted-foreground">
                        查看全部项目授权与角色
                      </p>
                    </div>
                  </div>
                  <ArrowRight class="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </RouterLink>
                <RouterLink
                  to="/profile"
                  class="group flex items-center justify-between rounded-2xl border border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                      <User class="h-5 w-5" />
                    </div>
                    <div>
                      <p class="text-sm font-medium">
                        个人中心
                      </p>
                      <p class="text-xs text-muted-foreground">
                        更新头像、密码与个人资料
                      </p>
                    </div>
                  </div>
                  <ArrowRight class="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </RouterLink>
              </div>
            </UiCardContent>
          </UiCard>
        </section>

        <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <UiCard class="rounded-3xl border-border/50 shadow-sm">
            <UiCardHeader class="space-y-1 pb-2">
              <UiCardTitle>{{ roleMode === 'admin' ? '系统动态流' : '我的最近动态' }}</UiCardTitle>
              <UiCardDescription>
                {{ roleMode === 'admin' ? '按最近变化排序，快速判断系统里刚发生了什么。' : '按时间顺序整理你的访问与授权痕迹。' }}
              </UiCardDescription>
            </UiCardHeader>
            <UiCardContent>
              <div class="max-h-[420px] space-y-4 overflow-y-auto pr-2">
                <div
                  v-for="item in (roleMode === 'admin' ? adminData?.activity_feed : userData?.activity_feed)"
                  :key="item.id"
                  class="flex gap-4 rounded-2xl border border-border/50 bg-background p-4"
                >
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border" :class="[activityToneClass(item)]">
                    <component :is="activityIcon(item)" class="h-4 w-4" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-medium">
                        {{ item.action }}
                      </p>
                      <span class="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{{ item.resource || '系统' }}</span>
                    </div>
                    <p class="mt-2 text-sm leading-6 text-muted-foreground">
                      {{ item.detail }}
                    </p>
                    <p class="mt-2 text-xs text-muted-foreground">
                      {{ item.time }}
                    </p>
                  </div>
                </div>

                <div
                  v-if="!(roleMode === 'admin' ? adminData?.activity_feed?.length : userData?.activity_feed?.length)"
                  class="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground"
                >
                  暂无动态记录。
                </div>
              </div>
            </UiCardContent>
          </UiCard>

          <UiCard v-if="roleMode === 'admin'" class="rounded-3xl border-border/50 shadow-sm">
            <UiCardHeader class="space-y-1 pb-2">
              <UiCardTitle>管理动作建议</UiCardTitle>
              <UiCardDescription>把高频操作放到同一块区域，方便继续处理。</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="grid gap-3">
              <RouterLink to="/approvals" class="rounded-2xl border border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                <p class="text-sm font-medium">
                  处理账户审批
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  优先清理待审核用户，减少注册阻塞。
                </p>
              </RouterLink>
              <RouterLink to="/projects" class="rounded-2xl border border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                <p class="text-sm font-medium">
                  查看项目接入
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  检查项目创建节奏和成员授权情况。
                </p>
              </RouterLink>
              <RouterLink to="/audit-logs" class="rounded-2xl border border-border/50 bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5">
                <p class="text-sm font-medium">
                  进入审计日志
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  追踪敏感操作、排查异常变更。
                </p>
              </RouterLink>
            </UiCardContent>
          </UiCard>

          <UiCard v-else class="rounded-3xl border-border/50 shadow-sm">
            <UiCardHeader class="space-y-1 pb-2">
              <UiCardTitle>全部授权项目</UiCardTitle>
              <UiCardDescription>更完整的项目列表，适合快速扫一遍角色和时间。</UiCardDescription>
            </UiCardHeader>
            <UiCardContent class="space-y-3">
              <div
                v-for="project in userData?.projects"
                :key="project.id"
                class="rounded-2xl border border-border/50 bg-muted/20 p-4"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium">
                      {{ project.name }}
                    </p>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {{ project.project_key }}
                    </p>
                  </div>
                  <span class="rounded-full border px-2 py-0.5 text-xs font-medium" :class="[roleBadge(project).class]">
                    {{ roleBadge(project).label }}
                  </span>
                </div>
                <div class="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{{ project.granted_at }}</span>
                  <span>{{ project.granted_at_text }}</span>
                </div>
              </div>

              <div v-if="!userData?.projects?.length" class="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                当前没有已授权项目。
              </div>
            </UiCardContent>
          </UiCard>
        </section>
      </template>
    </div>
  </BasicPage>
</template>
