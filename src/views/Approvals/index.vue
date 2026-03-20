<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { reqUserList, reqApproveUser, reqRejectUser } from '@/api/user'
import { BasicPage } from '@/components/global-layout'
import { toast } from 'vue-sonner'
import ApproveTable from './components/data-table.vue'
import { columns } from './components/columns'
import type { ApprovalRow } from './components/columns'

// 状态管理
const loading = ref(false)
const rawUsers = ref<any[]>([])

// 1. 获取列表
async function fetchUsers() {
  loading.value = true
  try {
    const res: any = await reqUserList({ page: 1, page_size: 100 })
    
    // 终极扫描逻辑：在不同嵌套深度中挖掘用户数组
    if (Array.isArray(res)) {
      rawUsers.value = res
    } else if (res.users && Array.isArray(res.users)) {
      rawUsers.value = res.users
    } else if (res.data?.users && Array.isArray(res.data.users)) {
      rawUsers.value = res.data.users
    } else if (res.data && Array.isArray(res.data)) {
      rawUsers.value = res.data
    } else {
      rawUsers.value = []
    }
  } catch (e: any) {
    toast.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 2. 映射逻辑 (仅筛选待审批状态)
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
      createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '未知'
    }))
})

// 3. 各种操作
async function handleApprove(id: string) {
  try {
    await reqApproveUser(id)
    toast.success('审批已通过')
    await fetchUsers()
  } catch (e: any) {
    toast.error('操作失败')
  }
}

async function handleReject(id: string) {
  if (!confirm('确定要拒绝该注册申请吗？')) return
  try {
    await reqRejectUser(id)
    toast.info('申请已拒绝')
    await fetchUsers()
  } catch (e: any) {
    toast.error('操作失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <BasicPage title="注册申请审核" description="管理待审核的新成员申请。">
    <div class="mt-4">
      <ApproveTable 
        :data="pendingUsers" 
        :columns="columns"
        :loading="loading" 
        @approve="handleApprove"
        @reject="handleReject"
      />
    </div>
  </BasicPage>
</template>
