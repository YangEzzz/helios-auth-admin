<script setup lang="ts">
import { computed } from 'vue'
import type { UserRow } from './columns'
import type { DataTableProps } from '@/components/data-table/types'
import DataTable from '@/components/data-table/data-table.vue'
import { generateVueTable } from '@/components/data-table/use-generate-vue-table'
import { columns as defaultColumns } from './columns'

const props = defineProps<DataTableProps<UserRow> & {
  currentUserId?: string
  onEditRole: (user: UserRow) => void
  onDelete: (id: string) => void
}>()

// 注入强力的计算属性，确保护数据变化时 table 的逻辑一定会刷新
const table = computed(() => {
  const t = generateVueTable<UserRow>(props)
  
  // 实时注入 meta 给 columns 逻辑
  t.setOptions((prev: any) => ({
    ...prev,
    meta: {
      currentUserId: props.currentUserId,
      onEditRole: props.onEditRole,
      onDelete: props.onDelete
    }
  }))
  
  return t
})
</script>

<template>
  <DataTable :columns="props.columns || defaultColumns" :table="table" :data="props.data" :loading="props.loading" />
</template>
