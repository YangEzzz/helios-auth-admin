<script setup lang="ts">
import type { ApprovalRow } from './columns'
import type { DataTableProps } from '@/components/data-table/types'
import DataTable from '@/components/data-table/data-table.vue'
import { generateVueTable } from '@/components/data-table/use-generate-vue-table'
import { useAdminAccess } from '@/composables/use-admin-access'
import { columns as defaultColumns } from './columns'

const props = defineProps<DataTableProps<ApprovalRow> & {
  busy?: boolean
  onApprove: (id: string) => void
  onReject: (id: string) => void
}>()

// 引入强力计算属性，确保数据变化时表格实例能正确自愈
const { canManage } = useAdminAccess()
const table = generateVueTable<ApprovalRow>({
  get data() { return props.data },
  get columns() { return props.columns || defaultColumns },
  get meta() { return { canManage, busy: props.busy, onApprove: props.onApprove, onReject: props.onReject } },
})
</script>

<template>
  <DataTable :columns="props.columns || defaultColumns" :table="table" :data="props.data" :loading="props.loading" />
</template>
