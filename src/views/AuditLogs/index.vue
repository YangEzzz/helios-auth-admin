<script setup lang="ts">
import { Activity, Download, Filter, Search } from 'lucide-vue-next'
import { ref } from 'vue'
import { BasicPage } from '@/components/global-layout'

const searchQuery = ref('')
const typeFilter = ref('all')

const logs = ref([
  { id: 1, operator: '系统管理员', action: '审批通过', target: '用户 李娜 的账户申请', ip: '192.168.1.101', type: 'approval', time: '2026-02-24 10:15:32' },
  { id: 2, operator: '张伟', action: '新增授权', target: '为 刘洋 授予 HeliosPortal 观察者权限', ip: '10.0.0.55', type: 'permission', time: '2026-02-24 09:43:10' },
  { id: 3, operator: '系统管理员', action: '审批拒绝', target: '用户 王强 的账户申请', ip: '192.168.1.101', type: 'approval', time: '2026-02-24 09:12:05' },
  { id: 4, operator: '陈静', action: '创建项目', target: 'DataPipeline-v2', ip: '10.0.0.88', type: 'project', time: '2026-02-24 08:30:00' },
  { id: 5, operator: '张伟', action: '修改角色', target: '将 王强 角色从 developer 更改为 tester', ip: '10.0.0.55', type: 'role', time: '2026-02-23 17:45:22' },
  { id: 6, operator: '赵磊', action: '登录系统', target: '从 IP 10.0.1.200 登录', ip: '10.0.1.200', type: 'auth', time: '2026-02-23 16:00:11' },
  { id: 7, operator: '系统', action: '安全告警', target: '检测到 3 次异常登录尝试 (IP: 203.0.113.50)', ip: '203.0.113.50', type: 'security', time: '2026-02-23 15:30:00' },
  { id: 8, operator: '陈静', action: '撤销权限', target: '撤销 王磊 在 MonitoringHub 的开发者权限', ip: '10.0.0.88', type: 'permission', time: '2026-02-23 14:22:33' },
  { id: 9, operator: '张伟', action: '更新项目', target: '修改了 HeliosPortal 的角色模板配置', ip: '10.0.0.55', type: 'project', time: '2026-02-23 11:05:17' },
  { id: 10, operator: '系统管理员', action: '创建用户', target: '手动创建用户账户 zhangsan@company.com', ip: '192.168.1.101', type: 'auth', time: '2026-02-23 09:30:45' },
])

const typeOptions = [
  { value: 'all', label: '全部' },
  { value: 'approval', label: '审批' },
  { value: 'permission', label: '权限' },
  { value: 'project', label: '项目' },
  { value: 'role', label: '角色' },
  { value: 'auth', label: '认证' },
  { value: 'security', label: '安全' },
]

const typeMap = {
  approval: { label: '审批', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  permission: { label: '权限', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  project: { label: '项目', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  role: { label: '角色', class: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  auth: { label: '认证', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  security: { label: '安全', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const

type TypeKey = keyof typeof typeMap

const filtered = computed(() => {
  return logs.value.filter((log) => {
    const matchSearch = !searchQuery.value
      || log.operator.includes(searchQuery.value)
      || log.action.includes(searchQuery.value)
      || log.target.includes(searchQuery.value)
    const matchType = typeFilter.value === 'all' || log.type === typeFilter.value
    return matchSearch && matchType
  })
})
</script>

<template>
  <BasicPage title="操作日志" description="查看系统所有操作的审计记录">
    <template #actions>
      <UiButton variant="outline" size="sm">
        <Download class="h-4 w-4 mr-1" />
        导出日志
      </UiButton>
    </template>

    <!-- Stats -->
    <div class="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/40 border">
      <Activity class="h-4 w-4 text-muted-foreground" />
      <span class="text-sm text-muted-foreground">今日共 <strong class="text-foreground">{{ logs.filter(l => l.time.startsWith('2026-02-24')).length }}</strong> 条操作记录</span>
      <span class="text-muted-foreground">·</span>
      <span class="text-sm text-muted-foreground">全部 <strong class="text-foreground">{{ logs.length }}</strong> 条</span>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <UiInput v-model="searchQuery" placeholder="搜索操作人、行为或目标..." class="pl-9" />
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <Filter class="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div class="flex gap-1 flex-wrap">
          <UiButton
            v-for="opt in typeOptions"
            :key="opt.value"
            :variant="typeFilter === opt.value ? 'default' : 'outline'"
            size="sm"
            @click="typeFilter = opt.value"
          >
            {{ opt.label }}
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Table -->
    <UiCard>
      <UiTable>
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead>时间</UiTableHead>
            <UiTableHead>操作人</UiTableHead>
            <UiTableHead>类型</UiTableHead>
            <UiTableHead>行为</UiTableHead>
            <UiTableHead class="hidden lg:table-cell">详情</UiTableHead>
            <UiTableHead class="hidden md:table-cell">IP 地址</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow v-for="log in filtered" :key="log.id">
            <UiTableCell class="text-xs text-muted-foreground whitespace-nowrap">
              {{ log.time }}
            </UiTableCell>
            <UiTableCell class="text-sm font-medium">{{ log.operator }}</UiTableCell>
            <UiTableCell>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', typeMap[log.type as TypeKey].class]">
                {{ typeMap[log.type as TypeKey].label }}
              </span>
            </UiTableCell>
            <UiTableCell class="text-sm">{{ log.action }}</UiTableCell>
            <UiTableCell class="hidden lg:table-cell">
              <p class="text-xs text-muted-foreground max-w-xs truncate">{{ log.target }}</p>
            </UiTableCell>
            <UiTableCell class="hidden md:table-cell text-xs font-mono text-muted-foreground">{{ log.ip }}</UiTableCell>
          </UiTableRow>
          <UiTableRow v-if="filtered.length === 0">
            <UiTableCell colspan="6" class="text-center py-10 text-muted-foreground">
              无匹配日志记录
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </UiCard>
  </BasicPage>
</template>
