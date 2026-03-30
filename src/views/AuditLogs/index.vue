<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Activity,
  Download,
  RotateCcw,
  Search,
  UserCircle2,
} from 'lucide-vue-next'
import dayjs from 'dayjs'
import { BasicPage } from '@/components/global-layout'
import { getAuditLogs } from '@/api/audit'
import type { AuditLog } from '@/api/audit/type'

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const resourceFilter = ref('')

const pageSizeOptions = ['10', '20', '50']

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const hasFilter = computed(() => resourceFilter.value.trim().length > 0)
const pageStart = computed(() => total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1)
const pageEnd = computed(() => Math.min(page.value * pageSize.value, total.value))

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await getAuditLogs({
      page: page.value,
      page_size: pageSize.value,
      resource: resourceFilter.value.trim() || undefined
    })

    if (res.code === 200) {
      logs.value = res.data.logs
      total.value = res.data.total
    }
  } catch (error) {
    console.error('Failed to fetch audit logs', error)
  } finally {
    loading.value = false
  }
}

watch([page, pageSize], fetchLogs, { immediate: true })

function applyFilter() {
  if (page.value !== 1) {
    page.value = 1
    return
  }
  fetchLogs()
}

function resetFilter() {
  resourceFilter.value = ''
  applyFilter()
}

function handleRefresh() {
  fetchLogs()
}

function getOperatorName(log: AuditLog) {
  if (!log.user)
    return '系统'

  return log.user.name || log.user.username || log.user.email || '未知用户'
}

function getOperatorHint(log: AuditLog) {
  if (!log.user)
    return '系统行为'

  return log.user.email || log.user.username || '已认证成员'
}

function getInitials(name: string) {
  return name.replace(/\s+/g, '').slice(0, 2).toUpperCase()
}

function getActionLabel(log: AuditLog) {
  return log.action_name || log.action
}

function getDetailLabel(log: AuditLog) {
  return log.details_name || log.details || getActionLabel(log)
}

function getResourceLabel(log: AuditLog) {
  return log.resource_name || log.resource || '未标记对象'
}

function getActionTone(action: string) {
  const normalized = action.toLowerCase()

  if (normalized.includes('delete') || normalized.includes('remove') || normalized.includes('reject')) {
    return 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-300'
  }

  if (normalized.includes('login') || normalized.includes('logout')) {
    return 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-300'
  }

  if (normalized.includes('approve') || normalized.includes('add') || normalized.includes('create')) {
    return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300'
  }

  if (normalized.includes('update') || normalized.includes('set')) {
    return 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300'
  }

  return 'bg-muted text-muted-foreground border-border'
}

function handleExport() {
  if (logs.value.length === 0)
    return

  const rows = logs.value.map(log => ({
    操作时间: dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss'),
    操作人: getOperatorName(log),
    身份标识: getOperatorHint(log),
    操作类型: getActionLabel(log),
    操作内容: getDetailLabel(log),
    操作对象: getResourceLabel(log),
    IP地址: log.ip_address || '-',
  }))

  const firstRow = rows[0]
  if (!firstRow)
    return

  const headers = Object.keys(firstRow)
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(header => `"${String(row[header as keyof typeof row]).replace(/"/g, '""')}"`)
        .join(',')
    )
  ].join('\n')

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-page-${page.value}-${dayjs().format('YYYYMMDD-HHmmss')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <BasicPage title="操作日志" description="查看系统所有操作的审计记录">
    <template #actions>
      <div class="flex gap-2">
        <UiButton variant="outline" size="sm" @click="handleRefresh" :disabled="loading">
          <RotateCcw class="mr-1 h-4 w-4" :class="{ 'animate-spin': loading }" />
          刷新
        </UiButton>
        <UiButton variant="outline" size="sm" @click="handleExport" :disabled="logs.length === 0">
          <Download class="mr-1 h-4 w-4" />
          导出当前页
        </UiButton>
      </div>
    </template>

    <UiCard class="overflow-hidden border-border/60">
      <UiCardContent class="space-y-4 p-4 md:p-5">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex flex-1 flex-col gap-3 sm:flex-row">
            <div class="relative flex-1 xl:max-w-sm">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <UiInput
                v-model="resourceFilter"
                placeholder="按操作对象筛选，例如项目名、用户标识"
                class="pl-9"
                @keyup.enter="applyFilter"
              />
            </div>

            <UiButton variant="outline" @click="applyFilter" :disabled="loading">
              查询
            </UiButton>

            <UiButton v-if="hasFilter" variant="ghost" @click="resetFilter" :disabled="loading">
              清空
            </UiButton>
          </div>

          <div class="flex items-center gap-3 self-end xl:self-auto">
            <span class="text-sm text-muted-foreground">每页</span>
            <UiSelect :model-value="String(pageSize)" @update:model-value="value => pageSize = Number(value)">
              <UiSelectTrigger class="w-[92px]">
                <UiSelectValue />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem v-for="option in pageSizeOptions" :key="option" :value="option">
                  {{ option }} 条
                </UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>

        <div class="rounded-2xl border border-border/60">
          <div class="relative min-h-[420px] overflow-x-auto">
            <UiTable>
              <UiTableHeader class="bg-muted/30">
                <UiTableRow class="hover:bg-transparent">
                  <UiTableHead class="w-[180px]">时间</UiTableHead>
                  <UiTableHead class="w-[220px]">操作人</UiTableHead>
                  <UiTableHead class="min-w-[360px]">操作内容</UiTableHead>
                  <UiTableHead class="w-[220px]">操作对象</UiTableHead>
                  <UiTableHead class="w-[140px] text-right">IP 地址</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <template v-if="loading && logs.length === 0">
                  <UiTableRow v-for="i in 6" :key="i">
                    <UiTableCell><UiSkeleton class="h-10 w-full rounded-xl" /></UiTableCell>
                    <UiTableCell><UiSkeleton class="h-10 w-full rounded-xl" /></UiTableCell>
                    <UiTableCell><UiSkeleton class="h-10 w-full rounded-xl" /></UiTableCell>
                    <UiTableCell><UiSkeleton class="h-10 w-full rounded-xl" /></UiTableCell>
                    <UiTableCell><UiSkeleton class="ml-auto h-10 w-24 rounded-xl" /></UiTableCell>
                  </UiTableRow>
                </template>

                <template v-else-if="logs.length > 0">
                  <UiTableRow v-for="log in logs" :key="log.id" class="align-top">
                    <UiTableCell class="py-4">
                      <div class="flex flex-col">
                        <span class="font-medium tabular-nums">
                          {{ dayjs(log.created_at).format('YYYY-MM-DD') }}
                        </span>
                        <span class="text-xs tabular-nums text-muted-foreground">
                          {{ dayjs(log.created_at).format('HH:mm:ss') }}
                        </span>
                      </div>
                    </UiTableCell>

                    <UiTableCell class="py-4">
                      <div class="flex items-center gap-3">
                        <UiAvatar class="h-10 w-10 border bg-muted/40">
                          <UiAvatarFallback class="text-xs font-semibold">
                            {{ getInitials(getOperatorName(log)) }}
                          </UiAvatarFallback>
                        </UiAvatar>
                        <div class="min-w-0">
                          <p class="truncate text-sm font-semibold">{{ getOperatorName(log) }}</p>
                          <p class="truncate text-xs text-muted-foreground">{{ getOperatorHint(log) }}</p>
                        </div>
                      </div>
                    </UiTableCell>

                    <UiTableCell class="py-4">
                      <div class="space-y-2">
                        <UiBadge
                          variant="outline"
                          class="rounded-full px-2.5 py-1 text-xs font-medium"
                          :class="getActionTone(log.action)"
                        >
                          {{ getActionLabel(log) }}
                        </UiBadge>
                        <p class="text-sm leading-6 text-foreground/90">
                          {{ getDetailLabel(log) }}
                        </p>
                      </div>
                    </UiTableCell>

                    <UiTableCell class="py-4">
                      <div class="inline-flex max-w-full items-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/25 px-3 py-2 text-sm">
                        <UserCircle2 class="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span class="truncate">{{ getResourceLabel(log) }}</span>
                      </div>
                    </UiTableCell>

                    <UiTableCell class="py-4 text-right">
                      <span class="rounded-lg bg-muted px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                        {{ log.ip_address || '-' }}
                      </span>
                    </UiTableCell>
                  </UiTableRow>
                </template>

                <UiTableRow v-else>
                  <UiTableCell colspan="5" class="py-16">
                    <div class="flex flex-col items-center gap-3 text-center">
                      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <Activity class="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div class="space-y-1">
                        <p class="text-sm font-medium">没有找到匹配的日志记录</p>
                        <p class="text-sm text-muted-foreground">
                          {{ hasFilter ? '可以尝试缩短筛选关键词，或清空后重新查询。' : '当前还没有可展示的操作日志。' }}
                        </p>
                      </div>
                    </div>
                  </UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>

            <div
              v-if="loading && logs.length > 0"
              class="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
            >
              <UiSpinner class="h-8 w-8" />
            </div>
          </div>
        </div>
      </UiCardContent>

      <div
        v-if="total > 0"
        class="flex flex-col gap-3 border-t px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:px-5"
      >
        <p class="text-muted-foreground">
          第 <span class="font-medium text-foreground">{{ page }}</span> / {{ totalPages }} 页，
          当前显示 {{ pageStart }} - {{ pageEnd }} 条，共 {{ total }} 条
        </p>

        <UiPagination :total="total" :sibling-count="1" show-edges :default-page="1" :items-per-page="pageSize">
          <UiPaginationContent v-slot="{ items }" class="flex items-center gap-1">
            <UiPaginationFirst @click="page = 1" />
            <UiPaginationPrevious @click="page = Math.max(1, page - 1)" />

            <template v-for="(item, index) in items" :key="`${item.type}-${index}`">
              <UiPaginationItem v-if="item.type === 'page'" :value="item.value" as-child>
                <UiButton
                  class="h-9 w-9 p-0"
                  :variant="item.value === page ? 'default' : 'outline'"
                  @click="page = item.value"
                >
                  {{ item.value }}
                </UiButton>
              </UiPaginationItem>
              <UiPaginationEllipsis v-else :index="index" />
            </template>

            <UiPaginationNext @click="page = Math.min(totalPages, page + 1)" />
            <UiPaginationLast @click="page = totalPages" />
          </UiPaginationContent>
        </UiPagination>
      </div>
    </UiCard>
  </BasicPage>
</template>
