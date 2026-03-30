<script setup lang="ts">
import type { ApprovalRow } from './components/columns'
import {
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { reqApproveUser, reqRejectUser, reqUserList } from '@/api/user'
import { BasicPage } from '@/components/global-layout'
import { columns } from './components/columns'
import ApproveTable from './components/data-table.vue'

const loading = ref(false)
const rawUsers = ref<any[]>([])
const searchQuery = ref('')

const fetchUsers = async () => {
  loading.value = true
  try {
    const res: any = await reqUserList({ page: 1, page_size: 100 })

    if (Array.isArray(res)) {
      rawUsers.value = res
    }
    else if (res.users && Array.isArray(res.users)) {
      rawUsers.value = res.users
    }
    else if (res.data?.users && Array.isArray(res.data.users)) {
      rawUsers.value = res.data.users
    }
    else if (res.data && Array.isArray(res.data)) {
      rawUsers.value = res.data
    }
    else {
      rawUsers.value = []
    }
  }
  catch {
    toast.error('获取列表失败')
  }
  finally {
    loading.value = false
  }
}

const pendingUsers = computed<ApprovalRow[]>(() => {
  return rawUsers.value
    .filter((u: any) => u.status === 'pending_approval')
    .map((u: any) => ({
      id: u.id,
      name: u.name || '未命名',
      email: u.email,
      department: u.department || '未分配',
      reason: u.reason || '无理由说明',
      status: u.status,
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

const handleApprove = async (id: string) => {
  try {
    await reqApproveUser(id)
    toast.success('审批已通过')
    await fetchUsers()
  }
  catch {
    toast.error('操作失败')
  }
}

const handleReject = async (id: string) => {
  try {
    await reqRejectUser(id)
    toast.info('申请已拒绝')
    await fetchUsers()
  }
  catch {
    toast.error('操作失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <BasicPage title="注册申请审核">
    <template #actions>
      <UiButton variant="outline" size="sm" :disabled="loading" @click="fetchUsers">
        <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
        刷新
      </UiButton>
    </template>

    <div class="space-y-6">
      <section class="rounded-[28px] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-5">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Users class="h-4 w-4" />
            当前展示 {{ filteredPendingUsers.length }} 条待审批记录
          </div>

          <div class="relative w-full sm:max-w-sm">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <UiInput v-model="searchQuery" class="pl-9" placeholder="搜索姓名、邮箱、部门或申请事由..." />
          </div>
        </div>

        <div v-if="!loading && pendingUsers.length === 0" class="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed px-6 text-center">
          <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
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
          v-else
          :data="filteredPendingUsers"
          :columns="columns"
          :loading="loading"
          :on-approve="handleApprove"
          :on-reject="handleReject"
        />
      </section>
    </div>
  </BasicPage>
</template>
