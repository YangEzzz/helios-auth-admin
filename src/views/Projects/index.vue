<script setup lang="ts">
import { Edit, FolderOpen, Plus, Search, Trash2, Users, Activity } from 'lucide-vue-next'
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { reqCreateProject, reqDeleteProject, reqListProjects } from '@/api/project'
import { BasicPage } from '@/components/global-layout'
import { toast } from 'vue-sonner'

const router = useRouter()
const searchQuery = ref('')
const loading = ref(false)
const rawProjects = ref<any[]>([])

// 1. 获取项目列表
async function fetchProjects() {
  loading.value = true
  try {
    const res: any = await reqListProjects()
    // 终极兼容：根据后端 JSON 可能出现的各种结构进行尝试
    let list = []
    if (Array.isArray(res)) {
      list = res
    } else if (res.data) {
      list = Array.isArray(res.data) ? res.data : (res.data.projects || [])
    } else if (res.projects) {
      list = res.projects
    }
    rawProjects.value = list
  } catch (e: any) {
    toast.error('加载项目失败')
  } finally {
    loading.value = false
  }
}

// 2. 数据转换映射
const projects = computed(() => {
  return (rawProjects.value || []).map(p => ({
    id: p.id,
    name: p.project_name,
    description: p.description || '暂无描述',
    project_id_string: p.project_id_string,
    memberCount: 0,
    roleTemplate: 'engineering',
    status: 'active',
    createdAt: p.created_at ? p.created_at.split('T')[0] : '',
    owner: 'Admin'
  }))
})

// UI 配置等
const roleTemplates = {
  engineering: { label: '工程模板', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  product: { label: '产品模板', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  ops: { label: '运维模板', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  security: { label: '安全模板', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const

const statusMap = {
  active: { label: '进行中', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  archived: { label: '已归档', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
} as const

type TemplateKey = keyof typeof roleTemplates
type StatusKey = keyof typeof statusMap

const filtered = computed(() => {
  if (!searchQuery.value) return projects.value
  return projects.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
    p.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 3. 删除项目
async function deleteProject(id: string) {
  if (!confirm('确定要删除该项目吗？这可能会影响所有关联的授权。')) return
  try {
    await reqDeleteProject({ id })
    toast.success('项目已删除')
    await fetchProjects()
  } catch (e: any) {
    toast.error('删除失败')
  }
}

// 4. 新建项目逻辑
const isCreateDialogOpen = ref(false)
const createForm = reactive({
  project_name: '',
  project_id_string: '',
  description: ''
})
const creating = ref(false)

async function handleCreateProject() {
  if (!createForm.project_name || !createForm.project_id_string) {
    toast.error('请填写必填项')
    return
  }
  
  creating.value = true
  try {
    await reqCreateProject({ ...createForm })
    toast.success('项目创建成功')
    isCreateDialogOpen.value = false
    // 重置
    createForm.project_name = ''
    createForm.project_id_string = ''
    createForm.description = ''
    await fetchProjects()
  } catch (e: any) {
    toast.error(e.message || '创建失败')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <BasicPage title="项目管理" description="管理系统接入项目，配置鉴权标识与角色模板">
    <template #actions>
      <!-- 新增项目弹窗 -->
      <UiDialog v-model:open="isCreateDialogOpen">
        <UiDialogTrigger as-child>
          <UiButton>
            <Plus class="h-4 w-4 mr-1" />
            新建项目
          </UiButton>
        </UiDialogTrigger>
        <UiDialogContent class="sm:max-w-[425px]">
          <UiDialogHeader>
            <UiDialogTitle>创建新项目</UiDialogTitle>
            <UiDialogDescription>
              创建一个新项目以开始进行权限管理。ID String 将作为全局唯一标识。
            </UiDialogDescription>
          </UiDialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <UiLabel for="name">项目名称</UiLabel>
              <UiInput id="name" v-model="createForm.project_name" placeholder="例如：Helios 内部管理系统" />
            </div>
            <div class="grid gap-2">
              <UiLabel for="id-string">项目 ID String</UiLabel>
              <UiInput id="id-string" v-model="createForm.project_id_string" placeholder="例如：helios-admin-system" />
              <p class="text-[10px] text-muted-foreground">推荐使用小写字母、数字和连字符 (kebab-case)</p>
            </div>
            <div class="grid gap-2">
              <UiLabel for="description">描述</UiLabel>
              <UiTextarea id="description" v-model="createForm.description" placeholder="请输入项目简要描述..." rows="3" />
            </div>
          </div>
          <UiDialogFooter>
            <UiButton variant="outline" @click="isCreateDialogOpen = false">取消</UiButton>
            <UiButton :disabled="creating" @click="handleCreateProject">
              <UiSpinner v-if="creating" class="mr-2 h-4 w-4" />
              确认创建
            </UiButton>
          </UiDialogFooter>
        </UiDialogContent>
      </UiDialog>
    </template>

    <!-- Search & Filter -->
    <div class="flex items-center gap-3 mb-6">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <UiInput v-model="searchQuery" placeholder="搜索项目..." class="pl-9" />
      </div>
      <UiButton variant="outline" size="icon" @click="fetchProjects" :disabled="loading">
        <Activity :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
      </UiButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading && projects.length === 0" class="flex flex-col items-center justify-center py-24">
      <UiSpinner class="h-8 w-8 mb-4" />
      <p class="text-sm text-muted-foreground">正在加载项目列表...</p>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="project in filtered"
        :key="project.id"
        @click="router.push(`/projects/${project.id}`)"
        class="group relative flex flex-col bg-card rounded-2xl border border-border/40 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden"
      >
        <!-- Top Decoration (Subtle Gradient) -->
        <div class="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/50 to-primary/10"></div>

        <div class="px-6 pt-7 pb-5">
          <div class="flex items-start justify-between mb-4">
            <div class="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm shadow-primary/10">
              <FolderOpen class="h-6 w-6" />
            </div>
            <div :class="['text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest', statusMap[project.status as StatusKey].class]">
              {{ statusMap[project.status as StatusKey].label }}
            </div>
          </div>

          <div class="space-y-1">
            <h3 class="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">{{ project.name }}</h3>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded uppercase letter-spacing-wide">
                {{ project.project_id_string }}
              </span>
            </div>
          </div>

          <p class="mt-4 text-sm text-muted-foreground/80 leading-relaxed line-clamp-2 min-h-[3rem]">
            {{ project.description }}
          </p>

          <div class="mt-6 pt-5 border-t border-border/40 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Users class="h-3.5 w-3.5" />
                {{ project.memberCount }}
              </div>
              <div :class="['text-[10px] px-2 py-1 rounded-md font-bold uppercase', roleTemplates[project.roleTemplate as TemplateKey].class]">
                {{ roleTemplates[project.roleTemplate as TemplateKey].label }}
              </div>
            </div>

            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
              <UiButton size="icon" variant="ghost" class="h-8 w-8 rounded-full hover:bg-muted" @click="router.push(`/projects/${project.id}`)">
                <FolderOpen class="h-3.5 w-3.5" />
              </UiButton>
              <UiButton 
                size="icon" 
                variant="ghost" 
                class="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                @click="deleteProject(project.id)"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filtered.length === 0"
        class="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl"
      >
        <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <FolderOpen class="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p class="font-medium">未发现任何项目</p>
        <p class="text-sm text-muted-foreground mt-1">开始创建你的第一个项目吧</p>
      </div>
    </div>
  </BasicPage>
</template>
