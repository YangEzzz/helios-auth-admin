<script setup lang="ts">
import type { UserRow } from './components/columns'
import {
  Activity,
  Search,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { reqLockUser, reqSetUserRole, reqUnlockUser, reqUserList } from '@/api/user'
import ConfirmDialog from '@/components/confirm-dialog.vue'
import { BasicPage } from '@/components/global-layout'
import { useAuthStore } from '@/store/auth'
import { columns } from './components/columns'
import UserTable from './components/data-table.vue'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userInfo?.id)

// 状态管理
const loading = ref(false)
const rawUsers = ref<any[]>([])
const searchQuery = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

// 1. 获取列表
async function fetchUsers() {
  loading.value = true
  try {
    const res = await reqUserList({ page: 1, page_size: 100 })
    rawUsers.value = res.data.users
  }
  catch {
    toast.error('获取列表失败')
  }
  finally {
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
      createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString() : '未知',
    }))
})

const filteredUsers = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const matchesKeyword = !keyword
      || user.name.toLowerCase().includes(keyword)
      || user.email.toLowerCase().includes(keyword)
      || user.department.toLowerCase().includes(keyword)
    const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value
    const matchesStatus = statusFilter.value === 'all'
      || (statusFilter.value === 'locked' ? user.status !== 'active' : user.status === statusFilter.value)
    return matchesKeyword && matchesRole && matchesStatus
  })
})

// 3. 各种操作回调
const isStatusDialogOpen = ref(false)
const changingStatus = ref(false)
const pendingStatusUser = ref<UserRow | null>(null)
const pendingStatusAction = computed(() => pendingStatusUser.value?.status === 'active' ? 'lock' : 'unlock')

function handleToggleStatus(user: UserRow) {
  pendingStatusUser.value = user
  isStatusDialogOpen.value = true
}

async function handleConfirmStatusChange() {
  if (!pendingStatusUser.value)
    return

  changingStatus.value = true
  try {
    if (pendingStatusAction.value === 'lock') {
      await reqLockUser(pendingStatusUser.value.id)
      toast.success('用户已锁定')
    }
    else {
      await reqUnlockUser(pendingStatusUser.value.id)
      toast.success('用户已解锁')
    }
    pendingStatusUser.value = null
    await fetchUsers()
  }
  catch {
    toast.error('操作失败')
  }
  finally {
    changingStatus.value = false
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
      new_role: roleForm.new_role,
    })
    toast.success('权限更新成功')
    isRoleDialogOpen.value = false
    await fetchUsers()
  }
  catch (e: any) {
    toast.error(e.message || '更新失败')
  }
  finally {
    settingRole.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <BasicPage title="成员管理" description="管理系统已注册的账户与权限分配">
    <section class="mt-4 rounded-2xl border border-border/60 bg-card p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold">
              成员列表
            </p>
            <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {{ filteredUsers.length }} / {{ users.length }}
            </span>
          </div>
          <p class="mt-1 text-sm text-muted-foreground">
            管理成员状态、全局角色与访问资格。
          </p>
        </div>

        <div class="flex flex-col gap-2 sm:flex-row lg:items-center">
          <div class="relative sm:w-72">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <UiInput v-model="searchQuery" class="h-10 rounded-xl pl-9" placeholder="搜索姓名、邮箱或部门" />
          </div>
          <UiButton variant="outline" size="icon" :disabled="loading" class="h-10 w-10 rounded-xl" @click="fetchUsers">
            <Activity class="h-4 w-4" :class="[loading ? 'animate-spin' : '']" />
          </UiButton>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="item in [
            { label: '全部角色', value: 'all' },
            { label: '管理员', value: 'admin' },
            { label: '正式成员', value: 'user' },
          ]"
          :key="item.value"
          class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="[roleFilter === item.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted']"
          @click="roleFilter = item.value"
        >
          {{ item.label }}
        </button>
        <span class="mx-1 h-7 w-px bg-border" />
        <button
          v-for="item in [
            { label: '全部状态', value: 'all' },
            { label: '正常', value: 'active' },
            { label: '锁定', value: 'locked' },
          ]"
          :key="item.value"
          class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="[statusFilter === item.value ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:bg-muted']"
          @click="statusFilter = item.value"
        >
          {{ item.label }}
        </button>
      </div>
    </section>

    <div class="mt-3 rounded-2xl border border-border/60 bg-card p-3">
      <UserTable
        :data="filteredUsers"
        :columns="columns"
        :loading="loading"
        :current-user-id="currentUserId"
        @edit-role="openRoleDialog"
        @delete="handleToggleStatus"
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
                  <UiSelectItem value="admin">
                    管理员 (Admin)
                  </UiSelectItem>
                  <UiSelectItem value="user">
                    正式成员 (User)
                  </UiSelectItem>
                </UiSelectGroup>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="isRoleDialogOpen = false">
            取消
          </UiButton>
          <UiButton :disabled="settingRole" @click="handleSetRole">
            <UiSpinner v-if="settingRole" class="mr-2 h-4 w-4" />
            保存
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <ConfirmDialog
      v-model:open="isStatusDialogOpen"
      cancel-button-text="取消"
      :confirm-button-text="pendingStatusAction === 'lock' ? '锁定用户' : '解锁用户'"
      :destructive="pendingStatusAction === 'lock'"
      :is-loading="changingStatus"
      @confirm="handleConfirmStatusChange"
    >
      <template #title>
        {{ pendingStatusAction === 'lock' ? '确定锁定该用户？' : '确定解锁该用户？' }}
      </template>
      <template #description>
        <span v-if="pendingStatusAction === 'lock'">
          用户 {{ pendingStatusUser?.name || '该成员' }} 将无法继续正常访问系统。
        </span>
        <span v-else>
          用户 {{ pendingStatusUser?.name || '该成员' }} 将恢复为正常状态，可以继续登录和使用系统。
        </span>
      </template>
    </ConfirmDialog>
  </BasicPage>
</template>
