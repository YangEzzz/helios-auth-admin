<script setup lang="ts">
import type { ApprovalRow } from './columns'
import type { DataTableProps } from '@/components/data-table/types'
import { computed } from 'vue'
import DataTable from '@/components/data-table/data-table.vue'
import { generateVueTable } from '@/components/data-table/use-generate-vue-table'
import { columns as defaultColumns } from './columns'

const props = defineProps<DataTableProps<ApprovalRow> & {
  onApprove: (id: string) => void
  onReject: (id: string) => void
}>()

// 引入强力计算属性，确保数据变化时表格实例能正确自愈
const table = computed(() => {
  const t = generateVueTable<ApprovalRow>(props)

  // 注入操作回调到 table 的 meta 中，供 columns.ts 使用
  t.setOptions((prev: any) => ({
    ...prev,
    meta: {
      onApprove: props.onApprove,
      onReject: props.onReject,
    },
  }))

  return t
})
</script>

<template>
  <DataTable :columns="props.columns || defaultColumns" :table="table" :data="props.data" :loading="props.loading" />
</template>
