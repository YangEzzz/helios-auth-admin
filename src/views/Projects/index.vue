<script setup lang="ts">
import { Activity, ArrowRight, FolderOpen, Plus, Search, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { reqCreateProject, reqDeleteProject, reqListProjects } from '@/api/project'
import ConfirmDialog from '@/components/confirm-dialog.vue'
import { BasicPage } from '@/components/global-layout'

const router = useRouter()
const searchQuery = ref('')
const loading = ref(false)
const rawProjects = ref<any[]>([])

// 1. 获取项目列表
async function fetchProjects() {
  loading.value = true
  try {
    const res = await reqListProjects()
    rawProjects.value = res.data.projects
  }
  catch {
    toast.error('加载项目失败')
  }
  finally {
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
    project_url: p.project_url,
    createdAt: p.created_at ? p.created_at.split('T')[0] : '',
  }))
})

const filtered = computed(() => {
  if (!searchQuery.value)
    return projects.value
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    || p.description.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 3. 删除项目
const isDeleteDialogOpen = ref(false)
const pendingDeleteProjectId = ref('')
const deleting = ref(false)

function deleteProject(id: string) {
  pendingDeleteProjectId.value = id
  isDeleteDialogOpen.value = true
}

async function handleConfirmDeleteProject() {
  if (!pendingDeleteProjectId.value)
    return

  deleting.value = true
  try {
    await reqDeleteProject({ id: pendingDeleteProjectId.value })
    toast.success('项目已删除')
    pendingDeleteProjectId.value = ''
    await fetchProjects()
  }
  catch {
    toast.error('删除失败')
  }
  finally {
    deleting.value = false
  }
}

// 4. 新建项目逻辑
const isCreateDialogOpen = ref(false)
const createForm = reactive({
  project_name: '',
  project_id_string: '',
  project_url: '',
  description: '',
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
    createForm.project_url = ''
    createForm.description = ''
    await fetchProjects()
  }
  catch (e: any) {
    toast.error(e.message || '创建失败')
  }
  finally {
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
              <UiLabel for="name">
                项目名称
              </UiLabel>
              <UiInput id="name" v-model="createForm.project_name" placeholder="例如：Helios 内部管理系统" />
            </div>
            <div class="grid gap-2">
              <UiLabel for="id-string">
                项目 ID String
              </UiLabel>
              <UiInput id="id-string" v-model="createForm.project_id_string" placeholder="例如：helios-admin-system" />
              <p class="text-[10px] leading-relaxed text-muted-foreground">
                推荐使用小写字母、数字和连字符 (kebab-case)。项目标识创建后不可修改，请确认后再创建。
              </p>
            </div>
            <div class="grid gap-2">
              <UiLabel for="project-url">
                项目网址
              </UiLabel>
              <UiInput id="project-url" v-model="createForm.project_url" placeholder="例如：https://nexus.example.com" />
              <p class="text-[10px] leading-relaxed text-muted-foreground">
                用于左上角项目入口跳转到对应业务系统，可稍后在项目设置中补充。
              </p>
            </div>
            <div class="grid gap-2">
              <UiLabel for="description">
                描述
              </UiLabel>
              <UiTextarea id="description" v-model="createForm.description" placeholder="请输入项目简要描述..." rows="3" />
            </div>
          </div>
          <UiDialogFooter>
            <UiButton variant="outline" @click="isCreateDialogOpen = false">
              取消
            </UiButton>
            <UiButton :disabled="creating" @click="handleCreateProject">
              <UiSpinner v-if="creating" class="mr-2 h-4 w-4" />
              确认创建
            </UiButton>
          </UiDialogFooter>
        </UiDialogContent>
      </UiDialog>
    </template>

    <section class="mb-4 rounded-2xl border border-border/60 bg-card p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold">
              项目列表
            </p>
            <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {{ filtered.length }} / {{ projects.length }}
            </span>
          </div>
          <p class="mt-1 text-sm text-muted-foreground">
            管理业务系统接入标识、角色模板与成员授权。
          </p>
        </div>

        <div class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div class="relative flex-1 lg:w-80">
            <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <UiInput v-model="searchQuery" placeholder="搜索项目名称、标识或描述" class="h-10 rounded-xl pl-9" />
          </div>
          <UiButton variant="outline" size="icon" :disabled="loading" class="h-10 w-10 rounded-xl" @click="fetchProjects">
            <Activity class="h-4 w-4" :class="[loading ? 'animate-spin' : '']" />
          </UiButton>
        </div>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading && projects.length === 0" class="flex flex-col items-center justify-center py-24">
      <UiSpinner class="h-8 w-8 mb-4" />
      <p class="text-sm text-muted-foreground">
        正在加载项目列表...
      </p>
    </div>

    <div v-else class="space-y-2">
      <article
        v-for="project in filtered"
        :key="project.id"
        class="group grid cursor-pointer gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 transition-colors duration-200 hover:border-primary/30 hover:bg-muted/20 lg:grid-cols-[1fr_220px_112px]"
        @click="router.push(`/projects/${project.id}`)"
      >
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <FolderOpen class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <div class="flex min-w-0 flex-wrap items-center gap-2">
              <h3 class="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                {{ project.name }}
              </h3>
              <span class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                active
              </span>
            </div>
            <p class="mt-1 line-clamp-1 text-sm text-muted-foreground">
              {{ project.description }}
            </p>
          </div>
        </div>

        <div class="flex min-w-0 flex-col justify-center rounded-xl bg-muted/25 px-3 py-2">
          <span class="text-xs text-muted-foreground">项目标识</span>
          <span class="mt-0.5 truncate font-mono text-sm font-medium text-foreground">
            {{ project.project_id_string }}
          </span>
        </div>

        <div class="flex items-center justify-between gap-2 lg:justify-end" @click.stop>
          <div class="mr-auto text-xs text-muted-foreground lg:mr-2">
            {{ project.createdAt || '未知日期' }}
          </div>
          <UiButton
            size="icon"
            variant="ghost"
            class="h-8 w-8 rounded-lg"
            @click="router.push(`/projects/${project.id}`)"
          >
            <ArrowRight class="h-4 w-4" />
          </UiButton>
          <UiButton
            size="icon"
            variant="ghost"
            class="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
            @click="deleteProject(project.id)"
          >
            <Trash2 class="h-4 w-4" />
          </UiButton>
        </div>
      </article>

      <!-- Empty State -->
      <div
        v-if="filtered.length === 0"
        class="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 text-center"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FolderOpen class="h-6 w-6" />
        </div>
        <p class="text-sm font-medium">
          未发现任何项目
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          开始创建你的第一个项目吧
        </p>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="isDeleteDialogOpen"
      cancel-button-text="取消"
      confirm-button-text="删除项目"
      destructive
      :is-loading="deleting"
      @confirm="handleConfirmDeleteProject"
    >
      <template #title>
        确定删除该项目？
      </template>
      <template #description>
        删除后会影响所有关联成员授权、角色模板与业务接入，请确认后再继续。
      </template>
    </ConfirmDialog>
  </BasicPage>
</template>
