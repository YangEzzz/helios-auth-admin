<script setup lang="ts">
import type { UserRow } from './components/columns'
import type { UserInfo } from '@/api/user/type'
import {
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { fetchUserDirectory, reqLockUser, reqSetUserRole, reqUnlockUser } from '@/api/user'
import ConfirmDialog from '@/components/confirm-dialog.vue'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import SearchInput from '@/components/search-input.vue'
import SummaryMetrics from '@/components/summary-metrics.vue'
import { useAdminAccess } from '@/composables/use-admin-access'
import { useLatestQuery } from '@/composables/use-latest-query'
import { accountStatusAction } from '@/lib/accounts'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/auth'
import { columns } from './components/columns'
import UserTable from './components/data-table.vue'

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userInfo?.id)

// 状态管理
const { canManage } = useAdminAccess()
const { data: rawUsers, loading, error: loadError, refresh: fetchUsers } = useLatestQuery<UserInfo[]>(fetchUserDirectory, [])
const searchQuery = ref('')
const roleFilter = ref('all')
const statusFilter = ref('all')

// 1. 获取列表
// 2. 只有“非待审批”的用户才会出现在在这个列表（恢复过滤）
const users = computed<UserRow[]>(() => {
  return rawUsers.value
    .filter(u => u.status !== 'pending_approval')
    .map(u => ({
      id: u.id,
      name: u.name || '未命名',
      email: u.email,
      department: u.department || '未分配',
      role: u.role || 'user',
      status: u.status || 'unknown',
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
      || (user.status === statusFilter.value)
    return matchesKeyword && matchesRole && matchesStatus
  })
})

// 3. 各种操作回调
const isStatusDialogOpen = ref(false)
const changingStatus = ref(false)
const statusError = ref('')
const pendingStatusUser = ref<UserRow | null>(null)
const pendingStatusAction = computed(() => accountStatusAction(pendingStatusUser.value?.status))

function handleToggleStatus(user: UserRow) {
  if (!canManage() || !accountStatusAction(user.status) || user.id === currentUserId.value)
    return
  pendingStatusUser.value = user
  isStatusDialogOpen.value = true
}

async function handleConfirmStatusChange() {
  if (!canManage() || changingStatus.value || !pendingStatusUser.value || !pendingStatusAction.value)
    return

  statusError.value = ''
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
    isStatusDialogOpen.value = false
    pendingStatusUser.value = null
    await fetchUsers()
  }
  catch (cause) {
    statusError.value = errorMessage(cause)
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
const roleError = ref('')

function openRoleDialog(user: UserRow) {
  if (!canManage())
    return
  roleForm.target_user_id = user.id
  roleForm.target_username = user.name
  roleForm.new_role = user.role
  isRoleDialogOpen.value = true
}

async function handleSetRole() {
  if (!canManage() || settingRole.value || !roleForm.target_user_id)
    return
  roleError.value = ''
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
  catch (e: unknown) {
    roleError.value = errorMessage(e)
    toast.error(roleError.value)
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
  <BasicPage title="用户管理" description="管理系统已注册的账户与权限分配">
    <QueryError v-if="loadError" :message="loadError" @retry="fetchUsers" />
    <SummaryMetrics
      :unavailable="!!loadError"
      class="mb-6" :loading="loading && !rawUsers.length" :items="[
        { label: '账户总数', value: users.length, note: '不含待审批的账户申请', icon: Users },
        { label: '管理账户', tone: 'violet', value: users.filter(user => ['admin', 'super_admin'].includes(user.role)).length, note: '管理员与超级管理员', icon: ShieldCheck },
        { label: '已锁定', tone: 'warning', value: users.filter(user => user.status === 'locked').length, note: '当前被限制登录的账户', icon: LockKeyhole },
      ]"
    />
    <section class="workspace-panel overflow-hidden">
      <div class="p-5 sm:p-6">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold">
                账户目录
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
              <SearchInput v-model="searchQuery" label="搜索账户" placeholder="搜索姓名、邮箱或部门" />
            </div>
            <UiButton variant="outline" size="icon" :disabled="loading" aria-label="刷新成员列表" class="h-10 w-10 rounded-xl" @click="fetchUsers">
              <RefreshCw class="h-4 w-4" :class="[loading ? 'animate-spin' : '']" />
            </UiButton>
          </div>
        </div>

        <div class="mt-5 flex flex-col gap-3 border-t pt-4 xl:flex-row xl:items-center">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="mr-2 text-xs text-muted-foreground">角色</span>
            <button
              v-for="item in [
                { label: '全部角色', value: 'all' },
                { label: '管理员', value: 'admin' },
                { label: '超级管理员', value: 'super_admin' },
                { label: '正式成员', value: 'user' },
              ]"
              :key="item.value"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              :class="[roleFilter === item.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted']"
              :aria-pressed="roleFilter === item.value"
              @click="roleFilter = item.value"
            >
              {{ item.label }}
            </button>
          </div><div class="flex flex-wrap items-center gap-1.5">
            <span class="mr-2 text-xs text-muted-foreground">状态</span>
            <button
              v-for="item in [
                { label: '全部状态', value: 'all' },
                { label: '正常', value: 'active' },
                { label: '锁定', value: 'locked' },
              ]"
              :key="item.value"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              :class="[statusFilter === item.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted']"
              :aria-pressed="statusFilter === item.value"
              @click="statusFilter = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
      <div class="border-t p-4 sm:p-6">
        <UserTable
          v-if="!loadError || users.length"
          :data="filteredUsers"
          :columns="columns"
          :loading="loading"
          :busy="changingStatus || settingRole" :current-user-id="currentUserId"
          @edit-role="openRoleDialog"
          @delete="handleToggleStatus"
        />
        <p v-else class="py-16 text-center text-sm text-muted-foreground">
          暂时无法读取账户目录，请重试。
        </p>
      </div>
    </section>

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
        <p v-if="roleError" class="text-sm text-destructive" role="alert">
          {{ roleError }}
        </p>
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
      :error="statusError" :is-loading="changingStatus"
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
