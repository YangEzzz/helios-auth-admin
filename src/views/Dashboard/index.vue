<script setup lang="ts">
import {
  Activity,
  CheckCircle2,
  Clock,
  FolderOpen,
  Shield,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useAuthStore } from '@/store/auth'
import { BasicPage } from '@/components/global-layout'

// ==========================================
// User Data & Role State
// ==========================================
const authStore = useAuthStore()

// 真实角色判断：从 store 获取
const currentRole = computed(() => {
  return authStore.userInfo?.role === 'admin' || authStore.userInfo?.role === 'super_admin' ? 'admin' : 'user'
})

const user = computed(() => {
  return authStore.userInfo || {
    name: '访客',
  }
})

// ==========================================
// Admin Data (from previous implementation)
// ==========================================
const adminStats = [
  { label: '总用户数', value: '1,284', icon: Users, change: '+12%', color: 'text-blue-500' },
  { label: '待审批', value: '23', icon: Clock, change: '+3 今日', color: 'text-amber-500' },
  { label: '活跃项目', value: '47', icon: FolderOpen, change: '8 本周新增', color: 'text-green-500' },
  { label: '授权记录', value: '3,891', icon: Shield, change: '+156 本月', color: 'text-purple-500' },
]

const recentApprovals = [
  { name: '张伟', email: 'zhangwei@company.com', status: 'pending', time: '3 分钟前' },
  { name: '李娜', email: 'lina@company.com', status: 'approved', time: '1 小时前' },
  { name: '王强', email: 'wangqiang@company.com', status: 'rejected', time: '2 小时前' },
  { name: '刘洋', email: 'liuyang@company.com', status: 'pending', time: '3 小时前' },
  { name: '陈静', email: 'chenjing@company.com', status: 'approved', time: '5 小时前' },
]

const recentActivity = [
  { action: '用户 admin 审批通过了 李娜 的申请', time: '1 小时前', icon: CheckCircle2, color: 'text-green-500' },
  { action: '用户 admin 拒绝了  王强 的申请', time: '2 小时前', icon: XCircle, color: 'text-red-500' },
  { action: '创建了新项目 "DataPipeline-v2"', time: '3 小时前', icon: FolderOpen, color: 'text-blue-500' },
  { action: '更新了用户 陈静 的项目权限', time: '5 小时前', icon: Shield, color: 'text-purple-500' },
  { action: '系统检测到 3 次异常登录尝试', time: '6 小时前', icon: Activity, color: 'text-amber-500' },
]

const statusMap = {
  pending: { label: '待审批', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  approved: { label: '已通过', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: '已拒绝', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const

type StatusKey = keyof typeof statusMap

// ==========================================
// User Data (Simplified View)
// ==========================================
const myAccessSummary = [
  { label: '我的项目', value: '3', icon: FolderOpen, color: 'text-primary' },
  { label: '开发者权限', value: '1', icon: ShieldCheck, color: 'text-blue-500' },
  { label: '最近授权', value: '2 天前', icon: Clock, color: 'text-muted-foreground' },
]

const myRecentActivity = [
  { action: '被授予 HeliosPortal 开发者权限', time: '1周前', icon: ShieldCheck, color: 'text-blue-500' },
  { action: '登录系统 (10.0.1.200)', time: '2小时前', icon: Activity, color: 'text-muted-foreground' },
  { action: '更新个人信息', time: '上个月', icon: User, color: 'text-muted-foreground' },
]
</script>

<template>
  <BasicPage title="仪表盘" description="系统概览与快捷入口">
    <!-- Dashboard Actions -->
    <template #actions>
      <!-- 这里可以放置导出报表、时间筛选等真实操作按钮 -->
      <UiButton size="sm" variant="outline">
        <Activity class="h-4 w-4 mr-2" />
        实时监控
      </UiButton>
    </template>

    <!-- ============================================== -->
    <!-- USER VIEW (Simplified)                         -->
    <!-- ============================================== -->
    <template v-if="currentRole === 'user'">
      <!-- Welcome Message -->
      <UiCard class="mb-6 border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10 border-r-0 border-t-0 border-b-0 shadow-none">
        <UiCardContent class="p-5 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-primary mb-1">您好，{{ user.name }}！欢迎来到 Helios Auth Portal</h2>
            <p class="text-sm text-muted-foreground">今天是 2026年2月24日，星期二。您的账户状态：<span class="text-green-600 font-medium">正常</span></p>
          </div>
          <div class="hidden sm:flex h-12 w-12 rounded-full bg-primary/20 items-center justify-center">
            <User class="h-6 w-6 text-primary" />
          </div>
        </UiCardContent>
      </UiCard>

      <!-- Stats Grid (Simplified) -->
      <div class="grid gap-4 sm:grid-cols-3 mb-6">
        <UiCard v-for="stat in myAccessSummary" :key="stat.label" class="p-5">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-muted-foreground">{{ stat.label }}</span>
            <component :is="stat.icon" :class="['h-5 w-5', stat.color]" />
          </div>
          <p class="text-3xl font-bold font-mono">
            {{ stat.value }}
          </p>
        </UiCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Quick Links -->
        <UiCard>
          <UiCardHeader class="pb-3">
            <UiCardTitle class="text-base">快捷入口</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="grid gap-3 sm:grid-cols-2">
              <RouterLink
                v-for="link in [
                  { to: '/my-projects', label: '我的项目', desc: '查看已获授权的项目', icon: FolderOpen },
                  { to: '#', label: '个人中心', desc: '设置与密码修改', icon: User },
                ]"
                :key="link.to"
                :to="link.to"
                class="flex items-start gap-3 rounded-lg border bg-card p-4 hover:bg-muted/50 hover:border-primary/50 transition-colors"
              >
                <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <component :is="link.icon" class="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p class="text-sm font-medium leading-none mb-1.5">
                    {{ link.label }}
                  </p>
                  <p class="text-xs text-muted-foreground leading-snug">
                    {{ link.desc }}
                  </p>
                </div>
              </RouterLink>
            </div>
          </UiCardContent>
        </UiCard>

        <!-- Personal Activity -->
        <UiCard>
          <UiCardHeader class="pb-3">
            <UiCardTitle class="text-base">近期个人动态</UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="space-y-4">
            <div
              v-for="(item, index) in myRecentActivity"
              :key="index"
              class="flex items-start gap-3 relative pb-4 last:pb-0"
            >
              <!-- Timeline vertical line -->
              <div v-if="index !== myRecentActivity.length - 1" class="absolute left-2 top-5 bottom-0 w-px bg-border"></div>
              
              <div class="rounded-full bg-background mt-0.5 relative z-10 w-4 h-4 flex items-center justify-center border border-border">
                <component :is="item.icon" :class="['h-2.5 w-2.5', item.color]" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm leading-snug">
                  {{ item.action }}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ item.time }}
                </p>
              </div>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </template>

    <!-- ============================================== -->
    <!-- ADMIN VIEW (Original)                          -->
    <!-- ============================================== -->
    <template v-else>
      <!-- Stats Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <UiCard v-for="stat in adminStats" :key="stat.label" class="p-5">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-medium text-muted-foreground">{{ stat.label }}</span>
            <component :is="stat.icon" :class="['h-5 w-5', stat.color]" />
          </div>
          <p class="text-2xl font-bold">
            {{ stat.value }}
          </p>
          <p class="text-xs text-muted-foreground mt-1">
            {{ stat.change }}
          </p>
        </UiCard>
      </div>

      <!-- Two column: recent approvals + activity -->
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- 待审批 -->
        <UiCard>
          <UiCardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <UiCardTitle class="text-base">最近审批申请</UiCardTitle>
              <RouterLink
                to="/approvals"
                class="text-xs text-primary hover:underline"
              >
                查看全部
              </RouterLink>
            </div>
          </UiCardHeader>
          <UiCardContent class="space-y-3">
            <div
              v-for="item in recentApprovals"
              :key="item.email"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {{ item.name[0] }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ item.name }}
                  </p>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ item.email }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0">
                <span
                  :class="['text-xs px-2 py-0.5 rounded-full font-medium', statusMap[item.status as StatusKey].class]"
                >
                  {{ statusMap[item.status as StatusKey].label }}
                </span>
                <span class="text-xs text-muted-foreground whitespace-nowrap">{{ item.time }}</span>
              </div>
            </div>
          </UiCardContent>
        </UiCard>

        <!-- 操作日志 -->
        <UiCard>
          <UiCardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <UiCardTitle class="text-base">最近操作记录</UiCardTitle>
              <RouterLink
                to="/audit-logs"
                class="text-xs text-primary hover:underline"
              >
                查看全部
              </RouterLink>
            </div>
          </UiCardHeader>
          <UiCardContent class="space-y-4">
            <div
              v-for="(item, index) in recentActivity"
              :key="index"
              class="flex items-start gap-3"
            >
              <component :is="item.icon" :class="['h-4 w-4 mt-0.5 flex-shrink-0', item.color]" />
              <div class="min-w-0">
                <p class="text-sm leading-snug">
                  {{ item.action }}
                </p>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ item.time }}
                </p>
              </div>
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <!-- Quick Links -->
      <div class="mt-4 grid gap-3 sm:grid-cols-3">
        <RouterLink
          v-for="link in [
            { to: '/approvals', label: '账户审批', desc: '处理待审核用户申请', icon: Clock },
            { to: '/users', label: '用户管理', desc: '管理用户与角色', icon: Users },
            { to: '/projects', label: '项目管理', desc: '创建与管理项目', icon: FolderOpen },
          ]"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
        >
          <div class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <component :is="link.icon" class="h-5 w-5 text-primary" />
          </div>
          <div>
            <p class="text-sm font-medium">
              {{ link.label }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ link.desc }}
            </p>
          </div>
        </RouterLink>
      </div>
    </template>
  </BasicPage>
</template>
