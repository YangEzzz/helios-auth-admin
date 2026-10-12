<script setup lang="ts">
import type { ProjectMemberRow } from './components/member-columns'
import {
  Activity,
  ArrowLeft,
  Clock,
  Globe,
  History,
  Loader2,
  Plus,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
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

import { useAdminAccess } from '@/composables/use-admin-access'
import { useDiscardConfirmation } from '@/composables/use-discard-confirmation'
import { useProjectResources } from '@/composables/use-project-resources'
import { errorMessage } from '@/lib/errors'
import { columns } from './components/member-columns'
import ProjectSettingsDialog from './components/ProjectSettingsDialog.vue'
import SSOClients from './components/SSOClients.vue'

const router = useRouter()
const route = useRoute()
const projectId = computed(() => typeof route.params.id === 'string' ? route.params.id : '')
const { canManage } = useAdminAccess()
const { projectScope, errors, loading, membersLoading, rolesLoading, auditLoading, project, members, roleTemplates, auditLogs, allUsers, fetchMembers, fetchRoleTemplates, fetchAuditLogs, refreshProject, reset } = useProjectResources(projectId)

// --- 状态管理 ---
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

const stats = computed(() => [
  { label: '项目成员', value: members.value.length.toString(), icon: Users, color: 'text-primary' },
  { label: '自定义角色', value: roleTemplates.value.length.toString(), icon: ShieldCheck, color: 'text-primary' },
  { label: '最近操作', value: auditLogs.value.length > 0 ? formatAction(auditLogs.value[0]?.action || '') : '--', icon: History, color: 'text-primary' },
  { label: '系统状态', value: '正常', icon: Globe, color: 'text-primary' },
])

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
  <BasicPage :title="`项目：${project.project_name || '详情'}`" :description="project.description || '项目暂无详细描述信息'">
    <template #actions>
      <UiButton variant="outline" size="sm" @click="router.back()">
        <ArrowLeft class="h-4 w-4 mr-2" /> 返回列表
      </UiButton>
      <UiButton size="sm" variant="secondary" :disabled="!canManage() || operationBusy || loading || Boolean(errors.fetchProjectDetail)" class="shadow-none border border-border/60" @click="openProjectSettings">
        <Settings class="h-3 w-3 mr-2" /> 设置
      </UiButton>
    </template>

    <QueryError v-for="(message, key) in errors" v-show="message" :key="key" :message="message" @retry="refreshProject" />
    <div v-if="loading" class="flex flex-col items-center justify-center py-40">
      <div class="h-14 w-14 rounded-full border-4 border-primary/10 border-t-primary animate-spin mb-6" />
      <p class="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-black">
        正在加载项目资料…
      </p>
    </div>

    <div v-else class="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <!-- Stats Overview -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UiCard v-for="stat in stats" :key="stat.label" class="border-none shadow-sm bg-muted/20 relative group overflow-hidden">
          <UiCardContent class="p-6 flex items-center justify-between">
            <div class="relative z-10">
              <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {{ stat.label }}
              </p>
              <p class="text-xl font-black mt-1 tabular-nums truncate max-w-[150px]">
                {{ stat.value }}
              </p>
            </div>
            <div class="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-md transition-all group-hover:scale-110" :class="[stat.color]">
              <component :is="stat.icon" class="h-5 w-5" />
            </div>
          </UiCardContent>
          <div class="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
        </UiCard>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <div class="md:col-span-2 min-w-0 space-y-6">
          <!-- Main Content Card with Tabs -->
          <UiCard class="border-border/40 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
              <Users class="h-32 w-32 rotate-12" />
            </div>
            <UiCardHeader class="flex flex-wrap items-center justify-between gap-3 space-y-0 pb-2 relative z-10">
              <div>
                <UiCardTitle class="flex items-center gap-3 font-black tracking-tight text-lg">
                  <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                    <Users class="h-4 w-4 text-primary" />
                  </div>
                  成员档案
                </UiCardTitle>
                <UiCardDescription class="text-sm ml-11">
                  当前项目的成员访问控制列表。
                </UiCardDescription>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all" :class="[activeTab === 'members' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted']"
                  @click="activeTab = 'members'"
                >
                  成员
                </button>
                <button
                  class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all" :class="[activeTab === 'audit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted']"
                  @click="activeTab = 'audit'"
                >
                  审计
                </button>
                <UiDialog v-model:open="isAddMemberDialogOpen">
                  <UiDialogTrigger as-child>
                    <UiButton size="sm" variant="outline" class="h-8 rounded-lg font-black text-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10">
                      <Plus class="h-3 w-3 mr-1" /> 授权新成员
                    </UiButton>
                  </UiDialogTrigger>
                  <UiDialogContent>
                    <UiDialogHeader>
                      <UiDialogTitle class="font-black text-primary">
                        项目授权发行中心
                      </UiDialogTitle>
                      <UiDialogDescription>正在通过安全链路向目标用户发出授权访问邀约。</UiDialogDescription>
                    </UiDialogHeader>
                    <div class="grid gap-4 py-4">
                      <div class="grid gap-2">
                        <UiLabel class="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">
                          目标用户身份
                        </UiLabel>
                        <UiSelect v-model="addForm.user_id">
                          <UiSelectTrigger class="h-11">
                            <UiSelectValue placeholder="搜索用户云端档案" />
                          </UiSelectTrigger>
                          <UiSelectContent>
                            <UiSelectItem v-for="u in availableUsers" :key="u.id" :value="u.id">
                              {{ u.name }} ({{ u.email }})
                            </UiSelectItem>
                          </UiSelectContent>
                        </UiSelect>
                      </div>
                      <div class="grid gap-2">
                        <UiLabel class="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">
                          授予成员角色
                        </UiLabel>
                        <UiSelect v-model="addForm.role">
                          <UiSelectTrigger class="h-11">
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
                        执行授权指令
                      </UiButton>
                    </UiDialogFooter>
                  </UiDialogContent>
                </UiDialog>
              </div>
            </UiCardHeader>
            <UiCardContent class="px-6 pb-6 relative z-10">
              <!-- Tab: Members -->
              <div v-if="activeTab === 'members'" class="animate-in fade-in duration-300">
                <DataTable
                  v-if="members.length > 0"
                  :data="members"
                  :columns="columns"
                  :table="table"
                  :loading="membersLoading"
                  class="border-none"
                />
                <div v-else class="py-8 text-center border-2 border-dashed rounded-3xl opacity-20 italic font-black uppercase text-xs tracking-widest">
                  暂无成员登记记录
                </div>
              </div>

              <!-- Tab: Audit Logs -->
              <div v-if="activeTab === 'audit'" class="p-6 animate-in slide-in-from-right-4 duration-500">
                <div v-if="auditLoading" class="py-12 flex justify-center">
                  <Loader2 class="h-8 w-8 animate-spin text-primary/50" />
                </div>
                <div v-else-if="auditLogs.length > 0" class="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
                  <div v-for="log in auditLogs" :key="log.id" class="relative">
                    <div class="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-sm shadow-primary/20" />
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-3">
                        <span class="text-[10px] font-black uppercase tracking-tighter bg-primary/10 text-primary px-2 py-0.5 rounded leading-none border border-primary/20 shadow-sm shadow-primary/5">
                          {{ formatAction(log.action) }}
                        </span>
                        <span class="text-[10px] font-mono text-muted-foreground/60 flex items-center">
                          <Clock class="h-2.5 w-2.5 mr-1" />
                          {{ new Date(log.created_at).toLocaleString() }}
                        </span>
                      </div>
                      <div class="flex items-start gap-2.5">
                        <div class="h-7 w-7 rounded-sm bg-muted flex items-center justify-center border border-border/40 overflow-hidden">
                          <img v-if="log.user?.avatar" :src="log.user.avatar" class="h-full w-full object-cover">
                          <UserCheck v-else class="h-3.5 w-3.5 opacity-40 text-primary" />
                        </div>
                        <div class="flex flex-col">
                          <span class="text-xs font-black text-foreground leading-tight">{{ log.user?.name || '系统内核' }}</span>
                          <span class="text-xs text-muted-foreground font-medium italic underline underline-offset-4 decoration-border/60">{{ log.details }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="py-12 text-center text-muted-foreground/30 flex flex-col items-center">
                  <Activity class="h-12 w-12 mb-4 opacity-10" />
                  <p class="text-xs font-black uppercase tracking-widest italic">
                    暂无操作流水记录
                  </p>
                </div>
              </div>
            </UiCardContent>
          </UiCard>

          <!-- Role Templates Card -->
          <UiCard class="border-border/40 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
              <ShieldCheck class="h-32 w-32 rotate-12" />
            </div>
            <UiCardHeader class="flex flex-wrap items-center justify-between gap-3 space-y-0 pb-5 relative z-10">
              <div>
                <UiCardTitle class="flex items-center gap-3 font-black tracking-tight text-lg">
                  <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                    <ShieldCheck class="h-4 w-4 text-primary" />
                  </div>
                  项目角色定义
                </UiCardTitle>
                <UiCardDescription class="text-sm ml-11">
                  预设本项目中可供分配给成员的各类身份（如管理员、开发者等）。
                </UiCardDescription>
              </div>
              <UiButton size="sm" variant="outline" class="h-8 rounded-lg font-black text-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10" @click="isAddRoleTemplateDialogOpen = true">
                <Plus class="h-3 w-3 mr-1" /> 添加角色模板
              </UiButton>
            </UiCardHeader>
            <UiCardContent class="px-6 pb-6 relative z-10">
              <div v-if="rolesLoading" class="py-8 flex justify-center opacity-30">
                <Loader2 class="h-6 w-6 animate-spin" />
              </div>
              <div v-else-if="roleTemplates.length > 0" class="grid gap-4 md:grid-cols-2">
                <div v-for="rt in roleTemplates" :key="rt.id" class="p-5 rounded-3xl border border-border/40 bg-muted/5 hover:bg-primary/5 hover:border-primary/20 transition-all group/rt shadow-inner relative overflow-hidden">
                  <div class="flex items-center gap-4 mb-2">
                    <div class="h-7 w-7 rounded-lg bg-background flex items-center justify-center shadow-sm text-primary group-hover/rt:scale-110 transition-transform">
                      <ShieldAlert class="h-3.5 w-3.5" />
                    </div>
                    <h4 class="text-sm font-black uppercase tracking-widest">
                      {{ rt.role_name }}
                    </h4>
                  </div>
                  <p class="text-xs text-muted-foreground/80 leading-relaxed font-bold ml-11">
                    {{ rt.description || '暂无模型描述信息' }}
                  </p>
                </div>
              </div>
              <div v-else class="py-12 text-center border-2 border-dashed rounded-3xl opacity-20 italic font-black uppercase text-xs tracking-widest">
                等待添加角色定义...
              </div>
            </UiCardContent>
          </UiCard>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <UiCard class="border-border/40 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
              <Globe class="h-32 w-32 rotate-12" />
            </div>
            <UiCardHeader class="flex flex-wrap items-center justify-between gap-3 space-y-0 pb-2 relative z-10">
              <div>
                <UiCardTitle class="flex items-center gap-3 font-black tracking-tight text-lg">
                  <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                    <Settings class="h-4 w-4 text-primary" />
                  </div>
                  项目注册信息
                </UiCardTitle>
                <UiCardDescription class="text-sm ml-11">
                  项目核心元数据。需要修改名称或描述时请使用顶部设置。
                </UiCardDescription>
              </div>
            </UiCardHeader>
            <UiCardContent class="px-6 pb-6 relative z-10 space-y-4">
              <div class="space-y-2">
                <label class="text-xs uppercase font-black text-muted-foreground tracking-widest">
                  项目名称
                </label>
                <div class="truncate rounded-xl border border-border/40 bg-muted/5 px-4 py-3 text-sm font-bold">
                  {{ project.project_name || '--' }}
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs uppercase font-black text-muted-foreground tracking-widest">
                  项目描述
                </label>
                <div class="min-h-[72px] rounded-xl border border-border/40 bg-muted/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {{ project.description || '暂无描述' }}
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs uppercase font-black text-muted-foreground tracking-widest">
                  项目标识
                </label>
                <div class="truncate rounded-xl border border-border/40 bg-muted/5 px-4 py-3 font-mono text-xs font-black">
                  {{ project.project_id_string || '--' }}
                </div>
                <p class="text-[11px] leading-relaxed text-muted-foreground">
                  该标识用于业务系统接入与权限验证，创建后不可修改；如果标识填错，需要新建项目。
                </p>
              </div>

              <div class="space-y-2">
                <label class="text-xs uppercase font-black text-muted-foreground tracking-widest">
                  项目网址
                </label>
                <div class="truncate rounded-xl border border-border/40 bg-muted/5 px-4 py-3 font-mono text-xs font-black">
                  {{ project.project_url || '未配置网址' }}
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">创建于</label>
                  <div class="text-xs font-mono font-bold bg-muted/5 px-3 py-2 rounded-lg border border-border/40">
                    {{ project.created_at ? new Date(project.created_at).toLocaleDateString() : '--' }}
                  </div>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-widest">更新于</label>
                  <div class="text-xs font-mono font-bold bg-muted/5 px-3 py-2 rounded-lg border border-border/40">
                    {{ project.updated_at ? new Date(project.updated_at).toLocaleDateString() : '--' }}
                  </div>
                </div>
              </div>
            </UiCardContent>
          </UiCard>
        </div>
      </div>
    </div>

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
          <UiDialogTitle class="font-black">
            角色重新定义
          </UiDialogTitle>
          <UiDialogDescription>正在通过安全核心修改该对象的权柄等级。</UiDialogDescription>
        </UiDialogHeader>
        <div class="py-4">
          <UiSelect v-model="roleEditForm.role">
            <UiSelectTrigger class="h-12 rounded-xl">
              <UiSelectValue placeholder="重新分发权限" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="rt in roleTemplates" :key="rt.id" :value="rt.role_name" class="font-black uppercase text-xs tracking-widest">
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
          <UiButton :disabled="editingRole" class="px-8 shadow-xl shadow-primary/20" @click="handleUpdateRole">
            提交变更
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <UiDialog v-model:open="isAddRoleTemplateDialogOpen">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle class="font-black text-primary">
            新增权限定义模型
          </UiDialogTitle>
          <UiDialogDescription>正在构建抽象的权柄模型，应用于本项目所有成员。</UiDialogDescription>
        </UiDialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <UiLabel class="text-xs font-black uppercase tracking-widest opacity-40">
              模型唯一标识
            </UiLabel>
            <UiInput v-model="roleTemplateForm.role_name" placeholder="E.G. PLATFORM_OWNER" class="h-11 font-mono uppercase" />
          </div>
          <div class="grid gap-2">
            <UiLabel class="text-xs font-black uppercase tracking-widest opacity-40">
              模型功能描述
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
          <UiButton :disabled="addingTemplate" class="px-8 shadow-xl shadow-primary/20" @click="handleAddRoleTemplate">
            初始化此模型
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
    <SSOClients v-if="!loading && !errors.fetchProjectDetail" :project-id="projectId" />
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

<style scoped>
/* 骨架屏和微动效 */
.before\:from-primary\/50::before {
  content: '';
}
</style>
