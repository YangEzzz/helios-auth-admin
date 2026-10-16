<script setup lang="ts">
import type { ApprovalRow } from './components/columns'
import type { UserInfo } from '@/api/user/type'
import {
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { fetchUserDirectory, reqApproveUser, reqRejectUser } from '@/api/user'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import SearchInput from '@/components/search-input.vue'
import SummaryMetrics from '@/components/summary-metrics.vue'
import { useAdminAccess } from '@/composables/use-admin-access'
import { useLatestQuery } from '@/composables/use-latest-query'
import { errorMessage } from '@/lib/errors'
import { columns } from './components/columns'
import ApproveTable from './components/data-table.vue'

const { canManage } = useAdminAccess()
const { data: rawUsers, loading, error: loadError, refresh: fetchUsers } = useLatestQuery<UserInfo[]>(fetchUserDirectory, [])
const searchQuery = ref('')

const pendingUsers = computed<ApprovalRow[]>(() => {
  return rawUsers.value
    .filter(u => u.status === 'pending_approval')
    .map(u => ({
      id: u.id,
      name: u.name || '未命名',
      email: u.email,
      department: u.department || '未分配',
      reason: u.reason || '无理由说明',
      status: u.status || 'pending_approval',
      createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '未知',
    }))
})

const filteredPendingUsers = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword)
    return pendingUsers.value

  return pendingUsers.value.filter(user =>
    user.name.toLowerCase().includes(keyword)
    || user.email.toLowerCase().includes(keyword)
    || user.department.toLowerCase().includes(keyword)
    || user.reason.toLowerCase().includes(keyword),
  )
})

const approving = ref(false)
const approvalError = ref('')
const handleApprove = async (id: string) => {
  if (!canManage() || approving.value)
    return
  approving.value = true
  approvalError.value = ''
  try {
    await reqApproveUser(id)
    toast.success('审批已通过')
    await fetchUsers()
  }
  catch (cause) {
    approvalError.value = errorMessage(cause)
    toast.error('操作失败')
  }
  finally { approving.value = false }
}

const handleReject = async (id: string) => {
  if (!canManage() || approving.value)
    return
  approving.value = true
  approvalError.value = ''
  try {
    await reqRejectUser(id)
    toast.info('申请已拒绝')
    await fetchUsers()
  }
  catch (cause) {
    approvalError.value = errorMessage(cause)
    toast.error('操作失败')
  }
  finally { approving.value = false }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <BasicPage title="账户审批" description="处理待审批注册申请">
    <template #actions>
      <UiButton variant="outline" size="sm" :disabled="loading" @click="fetchUsers">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
        刷新
      </UiButton>
    </template>

    <div class="space-y-6">
      <QueryError v-if="loadError" :message="loadError" @retry="fetchUsers" />
      <SummaryMetrics
        :unavailable="!!loadError"
        :loading="loading && !rawUsers.length" :items="[
          { label: '待审批申请', tone: 'warning', value: pendingUsers.length, note: '等待确认身份与申请用途' },
          { label: '已激活账户', tone: 'success', value: rawUsers.filter(user => user.status === 'active').length, note: '当前可以登录的团队成员' },
          { label: '已拒绝账户', tone: 'warning', value: rawUsers.filter(user => user.status === 'rejected').length, note: '未获批准的注册账户' },
        ]"
      />
      <section class="workspace-panel overflow-hidden">
        <header class="panel-heading">
          <div><h2>注册申请队列</h2><p>确认申请人、所属部门及访问用途后处理</p></div><span class="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{{ pendingUsers.length }} 条待处理</span>
        </header>
        <div class="p-5 sm:p-6">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Users class="h-4 w-4" />
              当前展示 {{ filteredPendingUsers.length }} 条待审批记录
            </div>

            <div class="relative w-full sm:max-w-sm">
              <SearchInput v-model="searchQuery" label="搜索账户" placeholder="搜索姓名、邮箱或部门" />
            </div>
          </div>

          <p v-if="approvalError" role="alert" class="mb-4 text-sm text-destructive">
            {{ approvalError }}
          </p>
          <div v-if="!loading && !loadError && pendingUsers.length === 0" class="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed px-6 text-center">
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-foreground">
              <ShieldAlert class="h-6 w-6" />
            </div>
            <p class="text-base font-medium">
              当前没有待处理申请
            </p>
            <p class="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              审批队列已经清空，可以稍后刷新查看是否有新的注册请求进入。
            </p>
          </div>

          <ApproveTable
            v-else-if="!loadError"
            :data="filteredPendingUsers"
            :columns="columns"
            :loading="loading"
            :busy="approving" :on-approve="handleApprove"
            :on-reject="handleReject"
          />
        </div>
      </section>
      <p class="text-xs leading-6 text-muted-foreground">
        审批通过后账户可登录，项目访问权限仍需单独配置。
      </p>
    </div>
  </BasicPage>
</template>
