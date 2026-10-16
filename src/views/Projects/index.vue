<script setup lang="ts">
import type { ProjectInfo } from '@/api/project/type'
import { ArrowRight, FolderOpen, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { reqCreateProject, reqDeleteProject, reqListProjects } from '@/api/project'
import ConfirmDialog from '@/components/confirm-dialog.vue'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import SearchInput from '@/components/search-input.vue'
import SummaryMetrics from '@/components/summary-metrics.vue'
import { useAdminAccess } from '@/composables/use-admin-access'
import { useLatestQuery } from '@/composables/use-latest-query'
import { errorMessage } from '@/lib/errors'

const router = useRouter()
const searchQuery = ref('')
const { canManage } = useAdminAccess()
const { data: rawProjects, loading, error: loadError, refresh: fetchProjects } = useLatestQuery<ProjectInfo[]>(async () => (await reqListProjects()).data.projects, [])

// 1. 获取项目列表
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
    || p.project_id_string.toLowerCase().includes(searchQuery.value.toLowerCase())
    || p.description.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// 3. 删除项目
const isDeleteDialogOpen = ref(false)
const pendingDeleteProjectId = ref('')
const deleting = ref(false)
const deleteError = ref('')

function deleteProject(id: string) {
  pendingDeleteProjectId.value = id
  isDeleteDialogOpen.value = true
}

async function handleConfirmDeleteProject() {
  if (!canManage() || deleting.value)
    return
  deleteError.value = ''
  if (!pendingDeleteProjectId.value)
    return

  deleting.value = true
  try {
    await reqDeleteProject({ id: pendingDeleteProjectId.value })
    toast.success('项目已删除')
    isDeleteDialogOpen.value = false
    pendingDeleteProjectId.value = ''
    await fetchProjects()
  }
  catch (cause) {
    deleteError.value = errorMessage(cause)
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
const createError = ref('')

async function handleCreateProject() {
  if (!canManage() || creating.value)
    return
  if (!createForm.project_name || !createForm.project_id_string) {
    toast.error('请填写必填项')
    return
  }

  createError.value = ''
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
  catch (e: unknown) {
    createError.value = errorMessage(e)
    toast.error(createError.value)
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
    <QueryError v-if="loadError" :message="loadError" @retry="fetchProjects" />
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
          <p v-if="createError" class="text-sm text-destructive" role="alert">
            {{ createError }}
          </p>
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

    <SummaryMetrics
      :unavailable="!!loadError"
      class="mb-6" :loading="loading && !projects.length" :items="[
        { label: '接入项目', value: projects.length, note: '由 Helios 管理的业务项目' },
        { label: '已配置入口', value: projects.filter(project => project.project_url).length, note: '已填写应用访问地址' },
        { label: '待配置入口', value: projects.filter(project => !project.project_url).length, note: '可在项目设置中补充网址' },
      ]"
    />
    <section class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold">
          应用目录 <span class="ml-2 text-sm font-normal text-muted-foreground">{{ filtered.length }} 个项目</span>
        </h2><p class="mt-1 text-xs text-muted-foreground">
          选择项目，管理成员、角色与单点登录。
        </p>
      </div>
      <div class="flex gap-2">
        <SearchInput v-model="searchQuery" label="搜索项目" placeholder="搜索项目名称、标识或描述" class="w-full sm:w-80" /><UiButton variant="outline" size="icon" aria-label="刷新项目列表" :disabled="loading" class="size-10" @click="fetchProjects">
          <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />
        </UiButton>
      </div>
    </section>

    <!-- Loading State -->
    <div v-if="loading && projects.length === 0" class="flex flex-col items-center justify-center py-24">
      <UiSpinner class="h-8 w-8 mb-4" />
      <p class="text-sm text-muted-foreground">
        正在加载项目列表...
      </p>
    </div>

    <div v-else-if="!loadError" class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="project in filtered" :key="project.id" class="workspace-panel group flex min-w-0 flex-col overflow-hidden transition-colors hover:border-primary/50">
        <div class="flex-1 p-6">
          <div class="mb-5 flex items-start justify-between">
            <div class="flex size-12 items-center justify-center rounded-xl detail-icon font-display text-xl font-semibold">
              {{ project.name.slice(0, 1) }}
            </div><span class="rounded-md bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">业务项目</span>
          </div>
          <h3 class="text-lg font-semibold">
            <RouterLink :to="`/projects/${project.id}`" class="hover:text-primary hover:underline underline-offset-4">
              {{ project.name }}
            </RouterLink>
          </h3>
          <p class="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">
            {{ project.description }}
          </p>
          <div class="mt-5 rounded-lg bg-muted/55 px-3 py-2.5">
            <p class="text-[11px] text-muted-foreground">
              项目标识
            </p><p class="mt-1 break-all font-mono text-xs">
              {{ project.project_id_string }}
            </p>
          </div>
          <p class="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <FolderOpen class="size-3.5" />{{ project.project_url ? '已配置应用入口' : '尚未配置应用入口' }}
          </p>
        </div>
        <footer class="flex items-center justify-between border-t bg-muted/20 px-5 py-3">
          <span class="text-xs text-muted-foreground">创建于 {{ project.createdAt || '未知日期' }}</span><div class="flex items-center gap-1">
            <UiButton variant="ghost" size="sm" class="text-primary" :aria-label="`查看${project.name}详情`" @click="router.push(`/projects/${project.id}`)">
              管理<ArrowRight class="size-3.5" />
            </UiButton><UiButton size="icon" variant="ghost" class="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" :aria-label="`删除${project.name}`" @click="deleteProject(project.id)">
              <Trash2 class="size-3.5" />
            </UiButton>
          </div>
        </footer>
      </article>

      <!-- Empty State -->
      <div
        v-if="filtered.length === 0"
        class="col-span-full flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 text-center"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <FolderOpen class="h-6 w-6" />
        </div>
        <p class="text-sm font-medium">
          {{ searchQuery ? '没有匹配的项目' : '还没有接入项目' }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">
          {{ searchQuery ? '尝试其他关键词，或清除搜索条件。' : '创建项目后即可配置成员与访问权限。' }}
        </p>
        <UiButton v-if="searchQuery" variant="outline" class="mt-4" @click="searchQuery = ''">
          清除搜索
        </UiButton>
      </div>
    </div>

    <ConfirmDialog
      v-model:open="isDeleteDialogOpen"
      cancel-button-text="取消"
      confirm-button-text="删除项目"
      destructive
      :error="deleteError" :is-loading="deleting"
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
