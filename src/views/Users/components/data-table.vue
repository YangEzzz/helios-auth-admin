<script setup lang="ts">
import type { UserRow } from './columns'
import type { DataTableProps } from '@/components/data-table/types'
import DataTable from '@/components/data-table/data-table.vue'
import { generateVueTable } from '@/components/data-table/use-generate-vue-table'
import { useAdminAccess } from '@/composables/use-admin-access'
import { columns as defaultColumns } from './columns'

const props = defineProps<DataTableProps<UserRow> & {
  busy?: boolean
  currentUserId?: string
  onEditRole: (user: UserRow) => void
  onDelete: (user: UserRow) => void
}>()

// 注入强力的计算属性，确保护数据变化时 table 的逻辑一定会刷新
const { canManage } = useAdminAccess()
const table = generateVueTable<UserRow>({
  get data() { return props.data },
  get columns() { return props.columns || defaultColumns },
  get meta() { return { canManage, busy: props.busy, currentUserId: props.currentUserId, onEditRole: props.onEditRole, onDelete: props.onDelete } },
})
</script>

<template>
  <DataTable :columns="props.columns || defaultColumns" :table="table" :data="props.data" :loading="props.loading" />
</template>
