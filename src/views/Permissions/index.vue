<script setup lang="ts">
import { Plus, Search, Shield, Trash2, Users } from 'lucide-vue-next'
import { ref } from 'vue'
import { BasicPage } from '@/components/global-layout'

const searchQuery = ref('')

const permissions = ref([
  { id: 1, user: { name: '张伟', email: 'zhangwei@company.com' }, project: 'HeliosPortal', role: 'owner', grantedBy: '系统管理员', grantedAt: '2026-01-12' },
  { id: 2, user: { name: '李娜', email: 'lina@company.com' }, project: 'HeliosPortal', role: 'developer', grantedBy: '张伟', grantedAt: '2026-01-15' },
  { id: 3, user: { name: '陈静', email: 'chenjing@company.com' }, project: 'DataPipeline-v2', role: 'owner', grantedBy: '系统管理员', grantedAt: '2026-01-05' },
  { id: 4, user: { name: '张伟', email: 'zhangwei@company.com' }, project: 'DataPipeline-v2', role: 'developer', grantedBy: '陈静', grantedAt: '2026-01-10' },
  { id: 5, user: { name: '赵磊', email: 'zhaolei@company.com' }, project: 'MonitoringHub', role: 'owner', grantedBy: '系统管理员', grantedAt: '2026-01-20' },
  { id: 6, user: { name: '刘洋', email: 'liuyang@company.com' }, project: 'HeliosPortal', role: 'viewer', grantedBy: '张伟', grantedAt: '2026-01-25' },
  { id: 7, user: { name: '王强', email: 'wangqiang@company.com' }, project: 'DataPipeline-v2', role: 'tester', grantedBy: '陈静', grantedAt: '2026-01-28' },
])

const roleMap = {
  owner: { label: '所有者', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  developer: { label: '开发者', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  tester: { label: '测试者', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  viewer: { label: '只读', class: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
} as const

type RoleKey = keyof typeof roleMap

const filtered = computed(() => {
  if (!searchQuery.value) return permissions.value
  const q = searchQuery.value
  return permissions.value.filter(p =>
    p.user.name.includes(q) || p.user.email.includes(q) || p.project.includes(q),
  )
})

function revoke(id: number) {
  permissions.value = permissions.value.filter(p => p.id !== id)
}

// Summary data
const userCount = computed(() => new Set(permissions.value.map(p => p.user.email)).size)
const projectCount = computed(() => new Set(permissions.value.map(p => p.project)).size)
</script>

<template>
  <BasicPage title="权限管理" description="管理用户与项目之间的授权关系">
    <template #actions>
      <UiButton>
        <Plus class="h-4 w-4 mr-1" />
        新增授权
      </UiButton>
    </template>

    <!-- Summary cards -->
    <div class="grid gap-4 sm:grid-cols-3 mb-4">
      <UiCard class="p-4">
        <div class="flex items-center gap-3">
          <Shield class="h-8 w-8 text-primary p-1.5 rounded-lg bg-primary/10" />
          <div>
            <p class="text-2xl font-bold">{{ permissions.length }}</p>
            <p class="text-xs text-muted-foreground">授权记录</p>
          </div>
        </div>
      </UiCard>
      <UiCard class="p-4">
        <div class="flex items-center gap-3">
          <Users class="h-8 w-8 text-blue-500 p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30" />
          <div>
            <p class="text-2xl font-bold">{{ userCount }}</p>
            <p class="text-xs text-muted-foreground">已授权用户</p>
          </div>
        </div>
      </UiCard>
      <UiCard class="p-4">
        <div class="flex items-center gap-3">
          <Shield class="h-8 w-8 text-green-500 p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30" />
          <div>
            <p class="text-2xl font-bold">{{ projectCount }}</p>
            <p class="text-xs text-muted-foreground">涉及项目</p>
          </div>
        </div>
      </UiCard>
    </div>

    <!-- Search -->
    <div class="flex gap-3 mb-4">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <UiInput v-model="searchQuery" placeholder="搜索用户或项目..." class="pl-9" />
      </div>
    </div>

    <!-- Table -->
    <UiCard>
      <UiTable>
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead>用户</UiTableHead>
            <UiTableHead>项目</UiTableHead>
            <UiTableHead>角色</UiTableHead>
            <UiTableHead class="hidden md:table-cell">授权人</UiTableHead>
            <UiTableHead class="hidden md:table-cell">授权时间</UiTableHead>
            <UiTableHead class="text-right">操作</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="item in filtered" :key="item.id">
            <UiTableCell>
              <div class="flex items-center gap-2">
                <div class="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {{ item.user.name[0] }}
                </div>
                <div>
                  <p class="text-sm font-medium">{{ item.user.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ item.user.email }}</p>
                </div>
              </div>
            </UiTableCell>
            <UiTableCell>
              <span class="text-sm font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{{ item.project }}</span>
            </UiTableCell>
            <UiTableCell>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', roleMap[item.role as RoleKey].class]">
                {{ roleMap[item.role as RoleKey].label }}
              </span>
            </UiTableCell>
            <UiTableCell class="hidden md:table-cell text-sm text-muted-foreground">{{ item.grantedBy }}</UiTableCell>
            <UiTableCell class="hidden md:table-cell text-sm text-muted-foreground">{{ item.grantedAt }}</UiTableCell>
            <UiTableCell class="text-right">
              <UiButton
                size="sm"
                variant="ghost"
                class="h-7 px-2 text-red-500 hover:text-red-600 text-xs"
                @click="revoke(item.id)"
              >
                <Trash2 class="h-3 w-3 mr-1" />撤销
              </UiButton>
            </UiTableCell>
          </UiTableRow>
          <UiTableRow v-if="filtered.length === 0">
            <UiTableCell colspan="6" class="text-center py-10 text-muted-foreground">
              无匹配授权记录
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </UiCard>
  </BasicPage>
</template>
