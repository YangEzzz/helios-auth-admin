<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  ArrowLeft, Settings, Users, ShieldCheck, Activity, Globe, Plus, 
  ShieldAlert, Loader2, History, Clock, UserCheck
} from 'lucide-vue-next'
import { BasicPage } from '@/components/global-layout'
import { 
  reqProjectDetail, reqProjectMembers, reqAddProjectMember, 
  reqAddProjectRoleTemplate, reqProjectRoleTemplates,
  reqRemoveProjectMember, reqUpdateProjectMemberRole,
  reqProjectAuditLogs
} from '@/api/project'
import { reqUserList } from '@/api/user'
import { toast } from 'vue-sonner'

// Tanstack Table 相关
import { 
  getCoreRowModel, 
  useVueTable,
} from '@tanstack/vue-table'
import DataTable from '@/components/data-table/data-table.vue'
import { columns } from './components/member-columns'

const router = useRouter()
const route = useRoute()
const projectId = route.params.id as string

// --- 状态管理 ---
const loading = ref(true)
const membersLoading = ref(false)
const rolesLoading = ref(false)
const auditLoading = ref(false)
const activeTab = ref('members') // members | audit

const project = ref<any>({ name: '加载中...', description: '', project_id_string: '--' })
const members = ref<any[]>([])
const roleTemplates = ref<any[]>([])
const auditLogs = ref<any[]>([])
const allUsers = ref<any[]>([])

// --- 1. 获取项目详情 ---
async function fetchProjectDetail() {
  loading.value = true
  try {
    const res: any = await reqProjectDetail(projectId)
    project.value = res.project || res.data || res || {}
  } catch (e: any) {
    toast.error('获取项目详情失败')
    router.push('/projects')
  } finally {
    loading.value = false
  }
}

// --- 2. 获取项目成员 ---
async function fetchMembers() {
  membersLoading.value = true
  try {
    const res: any = await reqProjectMembers(projectId)
    const data = res.members || res.data || res || []
    members.value = Array.isArray(data) ? data.map(m => ({
      id: m.id,
      user_id: m.user_id,
      name: m.user?.name || m.name || '未知',
      email: m.user?.email || m.email || '',
      role: m.role || 'guest',
      joined_at: m.created_at ? new Date(m.created_at).toLocaleDateString() : '--'
    })) : []
  } catch (e: any) {} finally {
    membersLoading.value = false
  }
}

// --- 3. 获取角色模板 ---
async function fetchRoleTemplates() {
  rolesLoading.value = true
  try {
    const res: any = await reqProjectRoleTemplates(projectId)
    roleTemplates.value = res.role_templates || res.data || []
  } catch (e: any) {} finally {
    rolesLoading.value = false
  }
}

// --- 4. 获取审计日志 ---
async function fetchAuditLogs() {
  auditLoading.value = true
  try {
    const res: any = await reqProjectAuditLogs(projectId)
    auditLogs.value = res.audit_logs || res.data || []
  } catch (e: any) {} finally {
    auditLoading.value = false
  }
}

// --- 表格逻辑 ---
const table = useVueTable({
  get data() { return members.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  meta: {
    onRemoveMember: async (userId: string) => {
      if (!confirm('确定要将该成员移出项目吗？')) return
      try {
        await reqRemoveProjectMember({ project_id: projectId, user_id: userId })
        toast.success('成员已移除')
        await fetchMembers()
        await fetchAuditLogs() // 刷新审计
      } catch (e: any) {
        toast.error('移除失败')
      }
    },
    onEditRole: (member: any) => {
      roleEditForm.user_id = member.user_id
      roleEditForm.role = member.role
      isEditRoleDialogOpen.value = true
    }
  }
})

// --- 其余业务逻辑 ---
async function fetchAllUsers() {
  try {
    const res: any = await reqUserList({ page: 1, page_size: 1000 })
    // 采用终极扫描逻辑
    if (Array.isArray(res)) {
      allUsers.value = res
    } else if (res.users && Array.isArray(res.users)) {
      allUsers.value = res.users
    } else if (res.data?.users && Array.isArray(res.data.users)) {
      allUsers.value = res.data.users
    } else if (res.data && Array.isArray(res.data)) {
      allUsers.value = res.data
    } else {
      allUsers.value = []
    }
  } catch (e: any) {
    console.error('Fetch all users failed', e)
  }
}

const isAddMemberDialogOpen = ref(false)
const addForm = reactive({ user_id: '', role: '' })
const adding = ref(false)

async function handleAddMember() {
  if (!addForm.user_id || !addForm.role) return toast.error('请选择用户和角色')
  adding.value = true
  try {
    await reqAddProjectMember({ project_id: projectId, ...addForm })
    toast.success('成员已加入项目')
    isAddMemberDialogOpen.value = false
    await fetchMembers()
    await fetchAuditLogs()
  } catch (e: any) {
    toast.error(e.message || '添加失败')
  } finally {
    adding.value = false
  }
}

const isEditRoleDialogOpen = ref(false)
const roleEditForm = reactive({ user_id: '', role: '' })
const editingRole = ref(false)

async function handleUpdateRole() {
  editingRole.value = true
  try {
    await reqUpdateProjectMemberRole({ project_id: projectId, ...roleEditForm })
    toast.success('角色更新成功')
    isEditRoleDialogOpen.value = false
    await fetchMembers()
    await fetchAuditLogs()
  } catch (e: any) {
    toast.error('修改失败')
  } finally {
    editingRole.value = false
  }
}

const isAddRoleTemplateDialogOpen = ref(false)
const roleTemplateForm = reactive({ role_name: '', description: '' })
const addingTemplate = ref(false)

async function handleAddRoleTemplate() {
  if (!roleTemplateForm.role_name) return toast.error('角色名必填')
  addingTemplate.value = true
  try {
    await reqAddProjectRoleTemplate({ project_id: projectId, ...roleTemplateForm })
    toast.success('角色模板定义成功')
    isAddRoleTemplateDialogOpen.value = false
    await fetchRoleTemplates()
    await fetchAuditLogs()
  } catch (e: any) {
    toast.error('定义失败')
  } finally {
    addingTemplate.value = false
  }
}

// 格式化展示 Action
function formatAction(action: string) {
  const map: Record<string, string> = {
    'create_project': '项目初始化',
    'add_member': '授权新成员',
    'remove_member': '权限回收',
    'update_member_role': '等级重授',
    'add_role_template': '添加角色模板',
    'delete_project': '项目销毁'
  }
  return map[action] || action
}

const stats = computed(() => [
  { label: '项目成员', value: members.value.length.toString(), icon: Users, color: 'text-primary' },
  { label: '自定义角色', value: roleTemplates.value.length.toString(), icon: ShieldCheck, color: 'text-primary' },
  { label: '最近操作', value: auditLogs.value.length > 0 ? formatAction(auditLogs.value[0].action) : '--', icon: History, color: 'text-primary' },
  { label: '系统状态', value: '正常', icon: Globe, color: 'text-primary' },
])

onMounted(() => {
  fetchProjectDetail()
  fetchMembers()
  fetchRoleTemplates()
  fetchAuditLogs()
  fetchAllUsers()
})
</script>

<template>
  <BasicPage :title="`项目：${project.project_name || project.name || '详情'}`" :description="project.description || '项目暂无详细描述信息'">
    <template #actions>
      <UiButton variant="outline" size="sm" @click="router.back()">
        <ArrowLeft class="h-4 w-4 mr-2" /> 返回列表
      </UiButton>
      <UiButton size="sm" variant="secondary" :disabled="loading" class="shadow-none border border-border/60">
        <Settings class="h-3 w-3 mr-2" /> 设置
      </UiButton>
    </template>

    <div v-if="loading" class="flex flex-col items-center justify-center py-40">
       <div class="h-14 w-14 rounded-full border-4 border-primary/10 border-t-primary animate-spin mb-6"></div>
       <p class="text-[10px] text-muted-foreground tracking-[0.3em] uppercase font-black">Decrypting Project Vault...</p>
    </div>

    <div v-else class="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <!-- Stats Overview -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UiCard v-for="stat in stats" :key="stat.label" class="border-none shadow-sm bg-muted/20 relative group overflow-hidden">
          <UiCardContent class="p-6 flex items-center justify-between">
             <div class="relative z-10">
              <p class="text-xs font-bold text-muted-foreground uppercase tracking-widest">{{ stat.label }}</p>
              <p class="text-xl font-black mt-1 tabular-nums truncate max-w-[150px]">{{ stat.value }}</p>
            </div>
            <div :class="['h-12 w-12 rounded-2xl bg-background flex items-center justify-center shadow-md transition-all group-hover:scale-110', stat.color]">
              <component :is="stat.icon" class="h-5 w-5" />
            </div>
          </UiCardContent>
          <div class="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
        </UiCard>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <div class="md:col-span-2 space-y-6">
          <!-- Main Content Card with Tabs -->
          <UiCard class="border-border/40 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
               <Users class="h-32 w-32 rotate-12" />
            </div>
            <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div>
                <UiCardTitle class="flex items-center gap-3 font-black tracking-tight text-lg">
                  <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                    <Users class="h-4 w-4 text-primary" />
                  </div>
                  成员档案
                </UiCardTitle>
                <UiCardDescription class="text-sm ml-11">当前项目的成员访问控制列表。</UiCardDescription>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  @click="activeTab = 'members'"
                  :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', 
                    activeTab === 'members' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted']"
                >成员</button>
                <button 
                  @click="activeTab = 'audit'"
                  :class="['px-3 py-1.5 text-xs font-bold rounded-lg transition-all', 
                    activeTab === 'audit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted']"
                >审计</button>
                <UiDialog v-model:open="isAddMemberDialogOpen">
                  <UiDialogTrigger as-child>
                    <UiButton size="sm" variant="outline" class="h-8 rounded-lg font-black text-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10">
                      <Plus class="h-3 w-3 mr-1" /> 授权新成员
                    </UiButton>
                  </UiDialogTrigger>
                  <UiDialogContent>
                    <UiDialogHeader>
                      <UiDialogTitle class="font-black text-primary">项目授权发行中心</UiDialogTitle>
                      <UiDialogDescription>正在通过安全链路向目标用户发出授权访问邀约。</UiDialogDescription>
                    </UiDialogHeader>
                    <div class="grid gap-4 py-4">
                      <div class="grid gap-2">
                        <UiLabel class="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">目标用户身份</UiLabel>
                        <UiSelect v-model="addForm.user_id">
                          <UiSelectTrigger class="h-11">
                            <UiSelectValue placeholder="搜索用户云端档案" />
                          </UiSelectTrigger>
                          <UiSelectContent>
                            <UiSelectItem v-for="u in allUsers" :key="u.id" :value="u.id">
                              {{ u.name }} ({{ u.email }})
                            </UiSelectItem>
                          </UiSelectContent>
                        </UiSelect>
                      </div>
                      <div class="grid gap-2">
                        <UiLabel class="text-xs font-black uppercase tracking-widest text-muted-foreground pl-1">授予成员角色</UiLabel>
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
                    <UiDialogFooter>
                      <UiButton variant="outline" @click="isAddMemberDialogOpen = false">取消</UiButton>
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
                      <div class="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background shadow-sm shadow-primary/20"></div>
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
                              <img v-if="log.user?.avatar" :src="log.user.avatar" class="h-full w-full object-cover" />
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
                   <p class="text-xs font-black uppercase tracking-widest italic">暂无操作流水记录</p>
                </div>
              </div>
            </UiCardContent>
          </UiCard>

          <!-- Role Templates Card -->
          <UiCard class="border-border/40 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
               <ShieldCheck class="h-32 w-32 rotate-12" />
            </div>
            <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-5 relative z-10">
              <div>
                <UiCardTitle class="flex items-center gap-3 font-black tracking-tight text-lg">
                  <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                    <ShieldCheck class="h-4 w-4 text-primary" />
                  </div>
                  项目角色定义
                </UiCardTitle>
                <UiCardDescription class="text-sm ml-11">预设本项目中可供分配给成员的各类身份（如管理员、开发者等）。</UiCardDescription>
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
                      <h4 class="text-sm font-black uppercase tracking-widest">{{ rt.role_name }}</h4>
                   </div>
                   <p class="text-xs text-muted-foreground/80 leading-relaxed font-bold ml-11">{{ rt.description || '暂无模型描述信息' }}</p>
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
            <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <div>
                <UiCardTitle class="flex items-center gap-3 font-black tracking-tight text-lg">
                  <div class="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-inner">
                    <Activity class="h-4 w-4 text-primary" />
                  </div>
                  系统注册信息
                </UiCardTitle>
                <UiCardDescription class="text-sm ml-11">项目核心元数据与时间档案。</UiCardDescription>
              </div>
            </UiCardHeader>
            <UiCardContent class="px-6 pb-6 relative z-10 space-y-4">
              <div class="space-y-2">
                <label class="text-xs uppercase font-black text-muted-foreground tracking-widest">项目云端标识</label>
                <div class="font-mono text-xs font-black bg-muted/5 px-4 py-3 rounded-xl border border-border/40 truncate">
                  {{ project.project_id_string || '--' }}
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
    <UiDialog v-model:open="isEditRoleDialogOpen">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle class="font-black">角色重新定义</UiDialogTitle>
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
        <UiDialogFooter>
          <UiButton variant="outline" @click="isEditRoleDialogOpen = false">取消</UiButton>
          <UiButton :disabled="editingRole" class="px-8 shadow-xl shadow-primary/20" @click="handleUpdateRole">
            提交变更
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <UiDialog v-model:open="isAddRoleTemplateDialogOpen">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle class="font-black text-primary">新增权限定义模型</UiDialogTitle>
          <UiDialogDescription>正在构建抽象的权柄模型，应用于本项目所有成员。</UiDialogDescription>
        </UiDialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <UiLabel class="text-xs font-black uppercase tracking-widest opacity-40">模型唯一标识</UiLabel>
            <UiInput v-model="roleTemplateForm.role_name" placeholder="E.G. PLATFORM_OWNER" class="h-11 font-mono uppercase" />
          </div>
          <div class="grid gap-2">
            <UiLabel class="text-xs font-black uppercase tracking-widest opacity-40">模型功能描述</UiLabel>
            <UiTextarea v-model="roleTemplateForm.description" class="min-h-[100px]" />
          </div>
        </div>
        <UiDialogFooter>
          <UiButton variant="outline" @click="isAddRoleTemplateDialogOpen = false">取消</UiButton>
          <UiButton :disabled="addingTemplate" class="px-8 shadow-xl shadow-primary/20" @click="handleAddRoleTemplate">
             初始化此模型
          </UiButton>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

  </BasicPage>
</template>

<style scoped>
/* 骨架屏和微动效 */
.before\:from-primary\/50::before {
  content: '';
}
</style>
