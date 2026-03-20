<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { computed, ref, reactive, onMounted } from 'vue'
import { reqUserList, reqRejectUser, reqSetUserRole } from '@/api/user'
import { BasicPage } from '@/components/global-layout'
import { useAuthStore } from '@/store/auth'
import { toast } from 'vue-sonner'
import UserTable from './components/data-table.vue'
import { columns } from './components/columns'
import type { UserRow } from './components/columns'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userInfo?.id)

// 状态管理
const loading = ref(false)
const rawUsers = ref<any[]>([])

// 1. 获取列表
async function fetchUsers() {
  loading.value = true
  try {
    const res: any = await reqUserList({ page: 1, page_size: 100 })
    // 保留最严密的扫描逻辑
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

// 2. 只有“非待审批”的用户才会出现在在这个列表（恢复过滤）
const users = computed<UserRow[]>(() => {
  return rawUsers.value
    .filter((u: any) => u.status !== 'pending_approval')
    .map((u: any) => ({
      id: u.id,
      name: u.name || '未命名',
      email: u.email,
      department: u.department || '未分配',
      role: u.role || 'user',
      status: u.status || 'active',
      createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '未知'
    }))
})

// 3. 各种操作回调
async function handleReject(id: string) {
  if (!confirm('确定要锁定该用户吗？')) return
  try {
    await reqRejectUser(id)
    toast.success('操作执行成功')
    await fetchUsers()
  } catch (e: any) {
    toast.error('操作失败')
  }
}

// 角色对话框
const isRoleDialogOpen = ref(false)
const roleForm = reactive({ target_user_id: '', new_role: 'user', target_username: '' })
const settingRole = ref(false)

function openRoleDialog(user: any) {
  roleForm.target_user_id = user.id
  roleForm.target_username = user.name
  roleForm.new_role = user.role
  isRoleDialogOpen.value = true
}

async function handleSetRole() {
  settingRole.value = true
  try {
    await reqSetUserRole({ 
      target_user_id: roleForm.target_user_id, 
      new_role: roleForm.new_role 
    })
    toast.success('权限更新成功')
    isRoleDialogOpen.value = false
    await fetchUsers()
  } catch (e: any) {
    toast.error(e.message || '更新失败')
  } finally {
    settingRole.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <BasicPage title="成员管理" description="管理系统已注册的账户与权限分配">

    <div class="mt-4">
      <UserTable 
        :data="users" 
        :columns="columns"
        :loading="loading" 
        :current-user-id="currentUserId"
        @edit-role="openRoleDialog"
        @delete="handleReject"
      />
    </div>

    <!-- 简单弹窗 -->
    <UiDialog v-model:open="isRoleDialogOpen">
      <UiDialogContent class="sm:max-w-md">
        <UiDialogHeader>
          <UiDialogTitle>修改角色</UiDialogTitle>
          <UiDialogDescription>
            为用户 "{{ roleForm.target_username }}" 设置全局权限。
          </UiDialogDescription>
        </UiDialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
             <UiLabel>新角色</UiLabel>
             <UiSelect v-model="roleForm.new_role">
               <UiSelectTrigger>
                 <UiSelectValue placeholder="请选择角色" />
               </UiSelectTrigger>
               <UiSelectContent>
                 <UiSelectGroup>
                   <UiSelectItem value="admin">管理员 (Admin)</UiSelectItem>
                   <UiSelectItem value="user">正式成员 (User)</UiSelectItem>
                 </UiSelectGroup>
               </UiSelectContent>
             </UiSelect>
          </div>
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="isRoleDialogOpen = false">取消</UiButton>
          <UiButton :disabled="settingRole" @click="handleSetRole">
            <UiSpinner v-if="settingRole" class="mr-2 h-4 w-4" />
            保存
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </BasicPage>
</template>
