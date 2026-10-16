<script setup lang="ts">
import type {
  ActivityFeedItem,
  DashboardPayload,
  DashboardStat,
  MyProjectItem,
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
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { reqDashboard } from '@/api/dashboard'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import { useLatestQuery } from '@/composables/use-latest-query'
import { isAdminRole, statusLabels } from '@/lib/accounts'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()

const { data: dashboard, loading, error: loadError, refresh: fetchDashboard } = useLatestQuery<DashboardPayload | null>(async () => (await reqDashboard()).data, null)

const currentUser = computed(() => authStore.userInfo)
const roleMode = computed(() => dashboard.value?.role_mode ?? (isAdminRole(currentUser.value?.role) ? 'admin' : 'user'))
const adminData = computed(() => dashboard.value?.admin)
const userData = computed(() => dashboard.value?.user)
const stats = computed(() => roleMode.value === 'admin' ? adminData.value?.stats : userData.value?.summary)
const generatedAtLabel = computed(() => {
  if (!dashboard.value?.generated_at)
    return '暂未同步'
  return dayjs(dashboard.value.generated_at).format('YYYY-MM-DD HH:mm:ss')
})

const statusMap = {
  pending: { label: '待处理', class: 'detail-badge', tone: 'warning' },
  approved: { label: '已通过', class: 'detail-badge', tone: 'success' },
  rejected: { label: '已拒绝', class: 'detail-badge', tone: 'warning' },
} as const

const roleMap: Record<string, { label: string, class: string }> = {
  owner: { label: 'Owner', class: 'bg-muted text-foreground border-border' },
  developer: { label: '开发者', class: 'bg-muted text-foreground border-border' },
  tester: { label: '测试者', class: 'bg-muted text-foreground border-border' },
  viewer: { label: '只读', class: 'bg-muted text-foreground border-border' },
}

function statTone(stat: DashboardStat) {
  return stat.emphasis === 'approvals' ? 'warning' : ['audit', 'roles'].includes(stat.emphasis || '') ? 'violet' : stat.emphasis === 'access' ? 'success' : 'info'
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

onMounted(() => {
  fetchDashboard()
})

const quickLinks = computed(() => roleMode.value === 'admin'
  ? [
      { title: '账户审批', note: '处理新成员的注册申请', to: '/approvals', icon: Clock3 },
      { title: '用户管理', note: '维护账户状态与全局角色', to: '/users', icon: Users },
      { title: '项目接入', note: '配置应用与项目访问权限', to: '/projects', icon: FolderKanban },
    ]
  : [
      { title: '我的项目', note: '查看全部项目授权与角色', to: '/my-projects', icon: FolderKanban },
      { title: '个人资料', note: '查看身份资料与账户状态', to: '/profile', icon: User },
    ])
const activityFeed = computed(() => (roleMode.value === 'admin' ? adminData.value?.activity_feed : userData.value?.activity_feed) || [])
const projectHighlights = computed(() => (userData.value?.projects ?? []).slice(0, 3))
</script>

<template>
  <BasicPage title="仪表盘" description="团队身份、项目接入与权限变更的统一视图">
    <template #actions>
      <span class="hidden text-xs text-muted-foreground xl:block">最近同步 {{ generatedAtLabel }}</span>
      <UiButton variant="outline" :disabled="loading" @click="fetchDashboard">
        <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />刷新数据
      </UiButton>
    </template>
    <div class="space-y-6">
      <QueryError v-if="loadError" :message="loadError" @retry="fetchDashboard" />
      <section class="overview-banner grid gap-6 rounded-xl px-6 py-7 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div class="min-w-0">
          <p class="mb-3 text-xs font-medium tracking-wider text-[var(--brand-caption)]">
            HELIOS · {{ roleMode === 'admin' ? '身份与访问控制台' : '个人工作空间' }}
          </p>
          <h2 class="font-display text-2xl font-semibold sm:text-3xl">
            {{ (roleMode === 'user' ? userData?.welcome_title : '') || `你好，${currentUser?.name || 'Helios 用户'}` }}
          </h2>
          <p class="mt-3 max-w-xl text-sm leading-6 text-[var(--brand-caption)]">
            {{ (roleMode === 'admin' ? adminData?.system_headline : userData?.welcome_note) || '查看账户申请，管理项目授权，追踪每一次权限变更。' }}
          </p>
        </div>
        <div class="account-summary min-w-0 border-t border-[var(--brand-border)] pt-5 lg:max-w-72 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div class="flex items-center gap-3">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-lg font-medium">
              {{ currentUser?.name?.slice(0, 1) || 'H' }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium">
                {{ roleMode === 'admin' ? '管理员工作空间' : '成员工作空间' }}
              </p><p class="mt-1 break-all text-xs text-[var(--brand-caption)]">
                {{ currentUser?.email }}
              </p>
            </div>
          </div>
          <p class="mt-4 flex items-center gap-2 text-xs text-[var(--brand-caption)]">
            <Shield class="size-3.5" />账户状态 · {{ statusLabels[userData?.account_status || currentUser?.status || ''] || '状态未知' }}
          </p>
        </div>
      </section>
      <section v-if="loading && !dashboard" class="workspace-panel flex min-h-40 items-center justify-center gap-3" role="status">
        <UiSpinner class="size-5" /><span class="text-sm text-muted-foreground">正在加载概览数据…</span>
      </section>
      <template v-else-if="dashboard">
        <section class="metric-strip" aria-label="数据概览" :aria-busy="loading">
          <div v-for="stat in stats" :key="stat.label" :data-tone="statTone(stat)">
            <p class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              {{ stat.label }}<component :is="statIcon(stat)" class="detail-text size-4" aria-hidden="true" />
            </p>
            <p class="metric-value mt-3">
              {{ stat.value }}
            </p><p class="mt-2 text-xs leading-5 text-muted-foreground">
              {{ stat.trend }}
            </p>
          </div>
        </section>
        <section aria-label="常用操作" class="grid gap-3 sm:grid-cols-2" :class="roleMode === 'admin' ? 'xl:grid-cols-3' : ''">
          <RouterLink v-for="link in quickLinks" :key="link.to" :to="link.to" class="quick-entry group flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-primary/50 hover:bg-accent">
            <div :data-tone="link.to === '/approvals' ? 'warning' : link.to === '/users' ? 'violet' : 'info'" class="detail-icon flex size-10 shrink-0 items-center justify-center rounded-xl">
              <component :is="link.icon" class="size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold">
                {{ link.title }}
              </h3><p class="mt-1 text-xs text-muted-foreground">
                {{ link.note }}
              </p>
            </div><ArrowRight class="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </RouterLink>
        </section>
        <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <section v-if="roleMode === 'admin'" class="workspace-panel overflow-hidden">
            <header class="panel-heading">
              <div><h2>最近审批</h2><p>账户申请与处理结果</p></div><RouterLink to="/approvals" class="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                全部审批<ArrowRight class="size-3.5" />
              </RouterLink>
            </header>
            <div class="divide-y divide-border px-5 sm:px-6">
              <div v-for="item in adminData?.approval_feed" :key="item.id" class="flex flex-wrap items-center gap-3 py-5 sm:flex-nowrap">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-primary">
                  {{ item.name?.slice(0, 1) || 'U' }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-semibold">
                    {{ item.name }}
                  </p><p class="mt-1 break-all text-xs text-muted-foreground">
                    {{ item.email }}
                  </p>
                </div>
                <div class="ml-auto text-right">
                  <span class="rounded-md border px-2 py-1 text-xs font-medium" :class="statusMap[item.status].class" :data-tone="statusMap[item.status].tone">{{ statusMap[item.status].label }}</span><p class="mt-2 text-xs text-muted-foreground">
                    {{ item.time }}
                  </p>
                </div>
              </div>
              <div v-if="!adminData?.approval_feed?.length" class="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <CheckCircle2 class="size-8 text-primary" />最近还没有审批动作。
              </div>
            </div>
            <footer class="flex items-center gap-2 border-t bg-muted/35 px-6 py-3 text-xs text-muted-foreground">
              <Shield class="size-3.5" />审批记录与操作日志保持可追踪。
            </footer>
          </section>
          <section v-else class="workspace-panel overflow-hidden">
            <header class="panel-heading">
              <div><h2>我的授权项目</h2><p>查看角色与最近授权时间</p></div><RouterLink to="/my-projects" class="text-xs font-medium text-primary hover:underline">
                全部项目
              </RouterLink>
            </header>
            <div class="divide-y divide-border px-6">
              <div v-for="project in projectHighlights" :key="project.id" class="py-5">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-semibold">
                      {{ project.name }}
                    </h3><p class="mt-1 font-mono text-xs text-muted-foreground">
                      {{ project.project_key }}
                    </p>
                  </div><span class="rounded-md border px-2 py-1 text-xs" :class="roleBadge(project).class">{{ roleBadge(project).label }}</span>
                </div><p class="mt-3 text-sm text-muted-foreground">
                  {{ project.description }}
                </p><p class="mt-3 text-xs text-muted-foreground">
                  授权于 {{ project.granted_at }}
                </p>
              </div>
              <div v-if="!projectHighlights.length" class="py-20 text-center text-sm text-muted-foreground">
                当前没有已授权项目，联系管理员申请访问。
              </div>
            </div>
          </section>
          <section class="workspace-panel overflow-hidden">
            <header class="panel-heading">
              <div><h2>操作时间线</h2><p>最近的访问与权限变化</p></div><RouterLink v-if="roleMode === 'admin'" to="/audit-logs" class="text-xs font-medium text-primary hover:underline">
                查看日志
              </RouterLink><Activity v-else class="size-4 text-muted-foreground" />
            </header>
            <div class="max-h-[480px] overflow-y-auto px-6 py-5">
              <ol class="activity-timeline">
                <li v-for="item in activityFeed" :key="item.id" class="relative flex gap-4 pb-7 last:pb-0">
                  <div class="timeline-node relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-muted text-foreground">
                    <component :is="activityIcon(item)" class="size-3.5" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap justify-between gap-2">
                      <h3 class="text-sm font-medium">
                        {{ item.action }}
                      </h3><span class="text-xs text-muted-foreground">{{ item.time }}</span>
                    </div><p class="mt-2 break-words text-xs leading-5 text-muted-foreground">
                      {{ item.detail }}
                    </p><span v-if="item.resource" class="mt-2 inline-block rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">{{ item.resource }}</span>
                  </div>
                </li>
              </ol>
              <div v-if="!activityFeed.length" class="py-20 text-center text-sm text-muted-foreground">
                暂无动态记录。
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>
  </BasicPage>
</template>

<style scoped>
.overview-banner {
  background: var(--brand-ink);
  color: var(--brand-text);
}
.activity-timeline li:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 32px;
  bottom: 0;
  width: 1px;
  background: var(--border);
}
</style>
