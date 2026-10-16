<script setup lang="ts">
import type { ProjectMemberRow } from './components/member-columns'
import {
  Activity,
  ArrowLeft,
  Globe,
  History,
  Loader2,
  Plus,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  reqAddProjectMember,
  reqAddProjectRoleTemplate,
  reqRemoveProjectMember,
  reqUpdateProject,
  reqUpdateProjectMemberRole,
} from '@/api/project'
import ConfirmDialog from '@/components/confirm-dialog.vue'
import DataTable from '@/components/data-table/data-table.vue'
import { generateVueTable } from '@/components/data-table/use-generate-vue-table'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import SummaryMetrics from '@/components/summary-metrics.vue'

import { useAdminAccess } from '@/composables/use-admin-access'
import { useDiscardConfirmation } from '@/composables/use-discard-confirmation'
import { useProjectResources } from '@/composables/use-project-resources'
import { errorMessage } from '@/lib/errors'
import { columns } from './components/member-columns'
import ProjectSettingsDialog from './components/ProjectSettingsDialog.vue'
import SSOClients from './components/SSOClients.vue'

const route = useRoute()
const projectId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
const { canManage } = useAdminAccess()
const { projectScope, errors, loading, membersLoading, rolesLoading, auditLoading, project, members, roleTemplates, auditLogs, allUsers, fetchMembers, fetchRoleTemplates, fetchAuditLogs, refreshProject, reset } = useProjectResources(projectId)

// --- 状态管理 ---
const detailView = ref('members')
const activeTab = ref('members') // members | audit
const isSettingsDialogOpen = ref(false)

const assignedUserIds = computed(() => new Set(members.value.map(member => member.user_id)))
const availableUsers = computed(() => {
  return allUsers.value.filter(user => user.status === 'active' && !assignedUserIds.value.has(user.id))
})

const isEditRoleDialogOpen = ref(false)
const roleEditForm = reactive({ user_id: '', role: '' })
const editingRole = ref(false)
const isRemoveMemberDialogOpen = ref(false)
const pendingRemoveMemberId = ref('')
const removingMember = ref(false)
const settingsForm = reactive({ project_name: '', project_url: '', description: '' })
const savingSettings = ref(false)

// --- 1. 获取项目详情 ---

function openProjectSettings() {
  if (!canManage())
    return
  settingsForm.project_name = project.value.project_name || ''
  settingsForm.project_url = project.value.project_url || ''
  settingsForm.description = project.value.description || ''
  isSettingsDialogOpen.value = true
}

async function handleUpdateProject() {
  if (!canManage() || savingSettings.value)
    return
  const ticket = projectScope.capture()
  errors.handleUpdateProject = ''
  if (!settingsForm.project_name.trim()) {
    toast.error('项目名称不能为空')
    return
  }

  savingSettings.value = true
  try {
    const res = await reqUpdateProject({
      id: ticket.context,
      project_name: settingsForm.project_name.trim(),
      project_url: settingsForm.project_url.trim(),
      description: settingsForm.description.trim(),
    })
    if (!ticket.isCurrent())
      return
    if (!res.data.project)
      throw new Error('服务器未返回项目资料')
    project.value = res.data.project
    settingsForm.project_name = res.data.project?.project_name || ''
    settingsForm.project_url = res.data.project?.project_url || ''
    settingsForm.description = res.data.project?.description || ''
    isSettingsDialogOpen.value = false
    toast.success('项目资料已更新')
    await fetchAuditLogs()
  }
  catch (cause) {
    if (!ticket.isCurrent())
      return
    errors.handleUpdateProject = errorMessage(cause)
    toast.error(errorMessage(cause) || '保存失败')
  }
  finally {
    savingSettings.value = false
  }
}

// --- 2. 获取项目成员 ---

// --- 3. 获取角色模板 ---

// --- 4. 获取审计日志 ---

// --- 表格逻辑 ---

async function handleConfirmRemoveMember() {
  if (!canManage() || removingMember.value)
    return
  const ticket = projectScope.capture()
  errors.handleConfirmRemoveMember = ''
  if (!pendingRemoveMemberId.value)
    return

  removingMember.value = true
  try {
    await reqRemoveProjectMember({ project_id: ticket.context, user_id: pendingRemoveMemberId.value })
    if (!ticket.isCurrent())
      return
    toast.success('成员已移除')
    isRemoveMemberDialogOpen.value = false
    pendingRemoveMemberId.value = ''
    await fetchMembers()
    await fetchAuditLogs()
  }
  catch (cause) {
    if (!ticket.isCurrent())
      return
    errors.handleConfirmRemoveMember = errorMessage(cause)
    toast.error('移除失败')
  }
  finally {
    removingMember.value = false
  }
}

// --- 其余业务逻辑 ---

const isAddMemberDialogOpen = ref(false)
const addForm = reactive({ user_id: '', role: '' })
const adding = ref(false)

async function handleAddMember() {
  if (!canManage() || adding.value)
    return
  const ticket = projectScope.capture()
  errors.handleAddMember = ''
  if (!addForm.user_id || !addForm.role)
    return toast.error('请选择用户和角色')
  adding.value = true
  try {
    await reqAddProjectMember({ project_id: ticket.context, ...addForm })
    if (!ticket.isCurrent())
      return
    toast.success('成员已加入项目')
    isAddMemberDialogOpen.value = false
    addForm.user_id = ''
    addForm.role = ''
    await fetchMembers()
    await fetchAuditLogs()
  }
  catch (cause) {
    if (!ticket.isCurrent())
      return
    errors.handleAddMember = errorMessage(cause)
    toast.error(errorMessage(cause) || '添加失败')
  }
  finally {
    adding.value = false
  }
}

async function handleUpdateRole() {
  if (!canManage() || editingRole.value)
    return
  const ticket = projectScope.capture()
  errors.handleUpdateRole = ''
  editingRole.value = true
  try {
    await reqUpdateProjectMemberRole({ project_id: ticket.context, ...roleEditForm })
    if (!ticket.isCurrent())
      return
    toast.success('角色更新成功')
    isEditRoleDialogOpen.value = false
    await fetchMembers()
    await fetchAuditLogs()
  }
  catch (cause) {
    if (!ticket.isCurrent())
      return
    errors.handleUpdateRole = errorMessage(cause)
    toast.error('修改失败')
  }
  finally {
    editingRole.value = false
  }
}

const isAddRoleTemplateDialogOpen = ref(false)
const roleTemplateForm = reactive({ role_name: '', description: '' })
const addingTemplate = ref(false)

async function handleAddRoleTemplate() {
  if (!canManage() || addingTemplate.value)
    return
  const ticket = projectScope.capture()
  errors.handleAddRoleTemplate = ''
  if (!roleTemplateForm.role_name)
    return toast.error('角色名必填')
  addingTemplate.value = true
  try {
    await reqAddProjectRoleTemplate({ project_id: ticket.context, ...roleTemplateForm })
    if (!ticket.isCurrent())
      return
    toast.success('角色模板定义成功')
    isAddRoleTemplateDialogOpen.value = false
    await fetchRoleTemplates()
    await fetchAuditLogs()
  }
  catch (cause) {
    if (!ticket.isCurrent())
      return
    errors.handleAddRoleTemplate = errorMessage(cause)
    toast.error('定义失败')
  }
  finally {
    addingTemplate.value = false
  }
}

// 格式化展示 Action
function formatAction(action: string) {
  const map: Record<string, string> = {
    create_project: '项目初始化',
    add_member: '授权新成员',
    remove_member: '权限回收',
    update_member_role: '等级重授',
    add_role_template: '添加角色模板',
    update_project: '更新项目',
    delete_project: '项目销毁',
  }
  return map[action] || action
}

const operationBusy = computed(() => savingSettings.value || removingMember.value || adding.value || editingRole.value || addingTemplate.value)
const table = generateVueTable({
  get data() { return members.value },
  columns,
  get meta() {
    return {
      canManage,
      get busy() { return operationBusy.value },
      onRemoveMember: (userId: string) => {
        if (!canManage())
          return
        pendingRemoveMemberId.value = userId
        isRemoveMemberDialogOpen.value = true
      },
      onEditRole: (member: ProjectMemberRow) => {
        if (!canManage())
          return
        roleEditForm.user_id = member.user_id
        roleEditForm.role = member.role
        isEditRoleDialogOpen.value = true
      },
    }
  },
})

const isDirty = computed(() => (isSettingsDialogOpen.value && (settingsForm.project_name !== project.value.project_name || settingsForm.description !== project.value.description || settingsForm.project_url !== (project.value.project_url || ''))) || (isAddMemberDialogOpen.value && Boolean(addForm.user_id || addForm.role)) || (isEditRoleDialogOpen.value && Boolean(roleEditForm.user_id)) || (isAddRoleTemplateDialogOpen.value && Boolean(roleTemplateForm.role_name || roleTemplateForm.description)))
const { showDiscardDialog, confirmDiscard, resolveDiscard } = useDiscardConfirmation(() => isDirty.value)
async function canLeaveProject() {
  if (operationBusy.value) {
    toast.info('请等待当前操作完成')
    return false
  }
  return confirmDiscard()
}
async function closeSettings() {
  if (!savingSettings.value && await confirmDiscard())
    isSettingsDialogOpen.value = false
}
onBeforeRouteLeave(canLeaveProject)
onBeforeRouteUpdate(async (to, from) => to.params.id === from.params.id || await canLeaveProject())
watch(projectId, () => {
  reset()
  isSettingsDialogOpen.value = false
  isRemoveMemberDialogOpen.value = false
  isAddMemberDialogOpen.value = false
  isEditRoleDialogOpen.value = false
  isAddRoleTemplateDialogOpen.value = false
  members.value = []
  roleTemplates.value = []
  auditLogs.value = []
  allUsers.value = []
  refreshProject()
}, { flush: 'sync' })
onMounted(refreshProject)
</script>

<template>
  <BasicPage :title="project.project_name || '项目详情'" :description="project.description || '管理项目成员、角色与应用接入'">
    <template #actions>
      <UiButton as-child variant="outline">
        <RouterLink to="/projects">
          <ArrowLeft class="size-4" />返回列表
        </RouterLink>
      </UiButton>
      <UiButton :disabled="!canManage() || operationBusy || loading || Boolean(errors.fetchProjectDetail)" @click="openProjectSettings">
        <Settings class="size-4" />项目设置
      </UiButton>
    </template>
    <QueryError v-for="(message, key) in errors" v-show="message" :key="key" :message="message" class="mb-4" @retry="refreshProject" />
    <div v-if="loading" class="workspace-panel flex min-h-80 flex-col items-center justify-center gap-4" role="status">
      <Loader2 class="size-6 animate-spin text-primary" /><p class="text-sm text-muted-foreground">
        正在加载项目资料…
      </p>
    </div>
    <div v-else-if="!errors.fetchProjectDetail" class="space-y-6">
      <section class="workspace-panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div class="flex size-14 shrink-0 items-center justify-center rounded-xl detail-icon font-display text-2xl font-semibold">
          {{ project.project_name?.slice(0, 1) || 'P' }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="section-kicker mb-2">
            PROJECT WORKSPACE
          </p><p class="break-all font-mono text-sm">
            {{ project.project_id_string }}
          </p><p class="mt-2 break-all text-xs text-muted-foreground">
            {{ project.project_url || '尚未配置应用入口' }}
          </p>
        </div>
        <div class="flex items-center gap-2 text-xs text-muted-foreground">
          <Globe class="size-4 text-primary" />项目访问配置
        </div>
      </section>
      <SummaryMetrics
        :items="[
          { label: '项目成员', value: members.length, note: '已分配项目访问角色', icon: Users },
          { label: '项目角色', tone: 'violet', value: roleTemplates.length, note: '可供成员分配的角色模板', icon: ShieldCheck },
          { label: '近期操作', tone: 'success', value: auditLogs.length, note: '本次读取的项目操作记录', icon: History },
        ]"
      />
      <UiTabs v-model="detailView" class="space-y-5">
        <UiTabsList class="h-11 gap-1 bg-transparent p-0">
          <UiTabsTrigger value="members" class="px-5">
            成员与角色
          </UiTabsTrigger><UiTabsTrigger value="applications" class="px-5">
            应用接入
          </UiTabsTrigger><UiTabsTrigger value="overview" class="px-5">
            项目资料
          </UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="members" class="space-y-6">
          <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section class="workspace-panel min-w-0 overflow-hidden">
              <header class="panel-heading">
                <div><h2>成员访问权限</h2><p>管理当前项目的成员与角色分配</p></div><UiButton size="sm" :disabled="!canManage() || operationBusy" @click="isAddMemberDialogOpen = true">
                  <Plus class="size-4" />添加成员
                </UiButton>
              </header>
              <UiTabs v-model="activeTab" class="p-4 sm:p-6">
                <UiTabsList class="mb-4">
                  <UiTabsTrigger value="members">
                    成员列表
                  </UiTabsTrigger><UiTabsTrigger value="audit">
                    项目审计
                  </UiTabsTrigger>
                </UiTabsList>
                <UiTabsContent value="members">
                  <DataTable v-if="members.length > 0 || membersLoading" :data="members" :columns="columns" :table="table" :loading="membersLoading" /><div v-else class="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Users class="size-8 text-primary" /><p>当前项目还没有成员</p><p class="text-xs">
                      添加成员并选择角色后，即可分配访问权限。
                    </p>
                  </div>
                </UiTabsContent>
                <UiTabsContent value="audit">
                  <div v-if="auditLoading" class="flex min-h-56 items-center justify-center" role="status">
                    <Loader2 class="size-6 animate-spin text-primary" />
                  </div><ol v-else-if="auditLogs.length" class="divide-y divide-border">
                    <li v-for="log in auditLogs" :key="log.id" class="py-4">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{{ formatAction(log.action) }}</span><span class="text-xs text-muted-foreground">{{ new Date(log.created_at).toLocaleString('zh-CN') }}</span>
                      </div><p class="mt-3 text-sm">
                        {{ log.user?.name || '系统' }}
                      </p><p class="mt-1 break-words text-xs leading-6 text-muted-foreground">
                        {{ log.details }}
                      </p>
                    </li>
                  </ol><div v-else class="flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Activity class="size-8 text-primary" />暂无操作记录。
                  </div>
                </UiTabsContent>
              </UiTabs>
            </section>
            <section class="workspace-panel overflow-hidden">
              <header class="panel-heading">
                <div><h2>角色模板</h2><p>当前项目的访问身份</p></div><UiButton variant="ghost" size="icon" aria-label="添加角色模板" :disabled="!canManage() || operationBusy" @click="isAddRoleTemplateDialogOpen = true">
                  <Plus class="size-4" />
                </UiButton>
              </header><div class="p-5">
                <div v-if="rolesLoading" class="py-8 text-center" role="status">
                  <Loader2 class="mx-auto size-5 animate-spin" />
                </div><div v-else-if="roleTemplates.length" class="space-y-3">
                  <div v-for="rt in roleTemplates" :key="rt.id" class="rounded-lg border bg-muted/30 p-4">
                    <div class="flex items-center gap-2">
                      <ShieldCheck class="size-4 shrink-0 text-primary" /><h3 class="break-all font-mono text-sm font-medium">
                        {{ rt.role_name }}
                      </h3>
                    </div><p class="mt-2 text-xs leading-6 text-muted-foreground">
                      {{ rt.description || '暂无角色说明' }}
                    </p>
                  </div>
                </div><p v-else class="py-8 text-center text-sm text-muted-foreground">
                  还没有角色模板。
                </p><UiButton variant="outline" class="mt-4 w-full" :disabled="!canManage() || operationBusy" @click="isAddRoleTemplateDialogOpen = true">
                  <Plus class="size-4" />添加角色模板
                </UiButton>
              </div>
            </section>
          </div>
        </UiTabsContent>
        <UiTabsContent value="applications" force-mount class="data-[state=inactive]:hidden">
          <SSOClients :project-id="projectId" />
        </UiTabsContent>
        <UiTabsContent value="overview">
          <section class="workspace-panel overflow-hidden">
            <header class="panel-heading">
              <div><h2>项目资料</h2><p>应用身份与接入信息</p></div><UiButton variant="outline" size="sm" :disabled="!canManage() || operationBusy" @click="openProjectSettings">
                编辑资料
              </UiButton>
            </header><dl class="grid gap-x-10 gap-y-6 p-6 sm:grid-cols-2">
              <div>
                <dt class="text-xs text-muted-foreground">
                  项目名称
                </dt><dd class="mt-2 text-sm font-medium">
                  {{ project.project_name }}
                </dd>
              </div><div>
                <dt class="text-xs text-muted-foreground">
                  项目标识
                </dt><dd class="mt-2 break-all font-mono text-sm">
                  {{ project.project_id_string }}
                </dd><p class="mt-2 text-xs leading-5 text-muted-foreground">
                  项目创建后不可修改，用于业务系统识别。
                </p>
              </div><div class="sm:col-span-2">
                <dt class="text-xs text-muted-foreground">
                  项目描述
                </dt><dd class="mt-2 text-sm leading-7">
                  {{ project.description || '暂无描述' }}
                </dd>
              </div><div class="sm:col-span-2">
                <dt class="text-xs text-muted-foreground">
                  应用网址
                </dt><dd class="mt-2 break-all font-mono text-sm">
                  {{ project.project_url || '未配置网址' }}
                </dd>
              </div><div>
                <dt class="text-xs text-muted-foreground">
                  创建时间
                </dt><dd class="mt-2 text-sm">
                  {{ project.created_at ? new Date(project.created_at).toLocaleDateString('zh-CN') : '未知' }}
                </dd>
              </div><div>
                <dt class="text-xs text-muted-foreground">
                  最近更新
                </dt><dd class="mt-2 text-sm">
                  {{ project.updated_at ? new Date(project.updated_at).toLocaleDateString('zh-CN') : '未知' }}
                </dd>
              </div>
            </dl>
          </section>
        </UiTabsContent>
      </UiTabs>
    </div>
    <UiDialog v-model:open="isAddMemberDialogOpen">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle class="font-semibold text-primary">
            添加项目成员
          </UiDialogTitle>
          <UiDialogDescription>选择成员与项目角色，为其分配访问权限。</UiDialogDescription>
        </UiDialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <UiLabel class="text-xs font-semibold uppercase tracking-normal text-muted-foreground pl-1">
              选择成员
            </UiLabel>
            <UiSelect v-model="addForm.user_id">
              <UiSelectTrigger class="h-11 w-full">
                <UiSelectValue placeholder="选择已激活的用户" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="u in availableUsers" :key="u.id" :value="u.id">
                  {{ u.name }} ({{ u.email }})
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
          <div class="grid gap-2">
            <UiLabel class="text-xs font-semibold uppercase tracking-normal text-muted-foreground pl-1">
              项目角色
            </UiLabel>
            <UiSelect v-model="addForm.role">
              <UiSelectTrigger class="h-11 w-full">
                <UiSelectValue :placeholder="roleTemplates.length > 0 ? '选择授予角色' : '警告: 请先添加角色模板'" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="rt in roleTemplates" :key="rt.id" :value="rt.role_name">
                  {{ rt.role_name.toUpperCase() }}
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>
        <p v-if="errors.handleAddMember" class="text-sm text-destructive" role="alert">
          {{ errors.handleAddMember }}
        </p>
        <UiDialogFooter>
          <UiButton variant="outline" @click="isAddMemberDialogOpen = false">
            取消
          </UiButton>
          <UiButton :disabled="adding || roleTemplates.length === 0" @click="handleAddMember">
            添加成员
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
    <!-- Dialogs -->
    <ProjectSettingsDialog v-model:name="settingsForm.project_name" v-model:description="settingsForm.description" v-model:url="settingsForm.project_url" :open="isSettingsDialogOpen" :busy="savingSettings" :project-key="project.project_id_string" :error="errors.handleUpdateProject" @close="closeSettings" @save="handleUpdateProject" />

    <ConfirmDialog
      v-model:open="isRemoveMemberDialogOpen"
      cancel-button-text="取消"
      confirm-button-text="移出成员"
      destructive
      :error="errors.handleConfirmRemoveMember" :is-loading="removingMember"
      @confirm="handleConfirmRemoveMember"
    >
      <template #title>
        确定移出该成员？
      </template>
      <template #description>
        该成员将失去当前项目的访问权限。此操作会写入项目审计日志。
      </template>
    </ConfirmDialog>

    <UiDialog v-model:open="isEditRoleDialogOpen">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle class="font-semibold">
            修改成员角色
          </UiDialogTitle>
          <UiDialogDescription>选择该成员在当前项目中的角色。</UiDialogDescription>
        </UiDialogHeader>
        <div class="py-4">
          <UiSelect v-model="roleEditForm.role">
            <UiSelectTrigger class="h-11 w-full">
              <UiSelectValue placeholder="请选择角色" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="rt in roleTemplates" :key="rt.id" :value="rt.role_name" class="font-semibold uppercase text-xs tracking-normal">
                {{ rt.role_name }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>
        <p v-if="errors.handleUpdateRole" class="text-sm text-destructive" role="alert">
          {{ errors.handleUpdateRole }}
        </p>
        <UiDialogFooter>
          <UiButton variant="outline" @click="isEditRoleDialogOpen = false">
            取消
          </UiButton>
          <UiButton :disabled="editingRole" class="px-8 " @click="handleUpdateRole">
            保存角色
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <UiDialog v-model:open="isAddRoleTemplateDialogOpen">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle class="font-semibold text-primary">
            添加角色模板
          </UiDialogTitle>
          <UiDialogDescription>定义项目中可分配给成员的角色与说明。</UiDialogDescription>
        </UiDialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <UiLabel class="text-xs font-semibold uppercase tracking-normal ">
              角色名称
            </UiLabel>
            <UiInput v-model="roleTemplateForm.role_name" placeholder="例如 developer" class="h-11 font-mono uppercase" />
          </div>
          <div class="grid gap-2">
            <UiLabel class="text-xs font-semibold uppercase tracking-normal ">
              角色说明
            </UiLabel>
            <UiTextarea v-model="roleTemplateForm.description" class="min-h-[100px]" />
          </div>
        </div>
        <p v-if="errors.handleAddRoleTemplate" class="text-sm text-destructive" role="alert">
          {{ errors.handleAddRoleTemplate }}
        </p>
        <UiDialogFooter>
          <UiButton variant="outline" @click="isAddRoleTemplateDialogOpen = false">
            取消
          </UiButton>
          <UiButton :disabled="addingTemplate" class="px-8 " @click="handleAddRoleTemplate">
            添加角色模板
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
    <UiAlertDialog :open="showDiscardDialog" @update:open="value => { if (!value) resolveDiscard(false) }">
      <UiAlertDialogContent class="z-[100]">
        <UiAlertDialogHeader><UiAlertDialogTitle>放弃未保存的修改？</UiAlertDialogTitle><UiAlertDialogDescription>切换项目或离开页面将丢弃当前表单。</UiAlertDialogDescription></UiAlertDialogHeader><UiAlertDialogFooter>
          <UiAlertDialogCancel @click="resolveDiscard(false)">
            继续编辑
          </UiAlertDialogCancel><UiButton variant="destructive" @click="resolveDiscard(true)">
            放弃修改
          </UiButton>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </BasicPage>
</template>
