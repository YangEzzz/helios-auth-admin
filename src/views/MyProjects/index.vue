<script setup lang="ts">
import { ExternalLink, FolderOpen, Search, ShieldCheck } from 'lucide-vue-next'
import { ref } from 'vue'
import { BasicPage } from '@/components/global-layout'

const searchQuery = ref('')

const myProjects = ref([
  { id: 1, name: 'HeliosPortal', description: '统一认证门户，提供单点登录与权限管理功能', role: 'developer', grantedAt: '2026-01-15' },
  { id: 2, name: 'DataPipeline-v2', description: '数据处理流水线系统，支持实时数据同步与批量处理', role: 'tester', grantedAt: '2026-01-28' },
  { id: 3, name: 'DocumentCenter', description: '企业内部文档中心与知识库', role: 'viewer', grantedAt: '2026-02-10' },
])

const roleMap = {
  owner: { label: '所有者', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  developer: { label: '开发者', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  tester: { label: '测试者', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  viewer: { label: '只读', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
} as const

type RoleKey = keyof typeof roleMap

const filtered = computed(() => {
  if (!searchQuery.value) return myProjects.value
  return myProjects.value.filter(p => p.name.includes(searchQuery.value) || p.description.includes(searchQuery.value))
})
</script>

<template>
  <BasicPage title="我的项目" description="查看我已获授权访问的项目列表">
    <!-- Search -->
    <div class="flex gap-3 mb-4">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <UiInput v-model="searchQuery" placeholder="搜索项目名称..." class="pl-9" />
      </div>
    </div>

    <!-- Project Cards Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
      <UiCard
        v-for="project in filtered"
        :key="project.id"
        class="flex flex-col group hover:border-primary/50 transition-colors duration-200"
      >
        <UiCardHeader class="pb-3">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <FolderOpen class="h-5 w-5 text-primary" />
              </div>
              <div class="min-w-0">
                <UiCardTitle class="text-base truncate">{{ project.name }}</UiCardTitle>
              </div>
            </div>
          </div>
        </UiCardHeader>
        <UiCardContent class="flex-1 pb-3">
          <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[40px]">
            {{ project.description }}
          </p>
          
          <div class="mt-4 p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck class="w-3.5 h-3.5" /> 我的角色</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', roleMap[project.role as RoleKey].class]">
                {{ roleMap[project.role as RoleKey].label }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xs text-muted-foreground">授权时间</span>
              <span class="text-xs font-mono">{{ project.grantedAt }}</span>
            </div>
          </div>
        </UiCardContent>
        <UiCardFooter class="pt-3 border-t">
          <UiButton variant="outline" class="w-full h-8 text-xs">
            <ExternalLink class="h-3 w-3 mr-1.5" />
            进入项目工作台
          </UiButton>
        </UiCardFooter>
      </UiCard>

      <!-- Empty State -->
      <div
        v-if="filtered.length === 0"
        class="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-card rounded-xl border border-dashed"
      >
        <FolderOpen class="h-12 w-12 mb-4 opacity-20" />
        <p class="text-base font-medium text-foreground">暂无项目权限</p>
        <p class="text-sm mt-1">您尚未被授权访问任何项目，或者没有匹配的搜索结果</p>
      </div>
    </div>
  </BasicPage>
</template>
