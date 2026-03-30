import type { ColumnDef } from '@tanstack/vue-table'
import { Check, X } from 'lucide-vue-next'
import { h } from 'vue'
import { Button } from '@/components/ui/button'

export interface ApprovalRow {
  id: string
  name: string
  email: string
  department: string
  reason: string
  status: string
  createdAt: string
}

export const columns: ColumnDef<ApprovalRow>[] = [
  {
    accessorKey: 'name',
    header: '申请者',
    cell: ({ row }) => {
      const u = row.original
      return h('div', { class: 'flex items-center gap-3 py-1' }, [
        h('div', {
          class: 'h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background shadow-sm',
        }, u.name.substring(0, 1).toUpperCase()),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'font-bold text-sm truncate max-w-[150px]' }, u.name),
          h('span', { class: 'text-[10px] text-muted-foreground truncate max-w-[150px]' }, u.email),
        ]),
      ])
    },
  },
  {
    accessorKey: 'department',
    header: '所属部门',
    cell: ({ row }) => h('div', { class: 'text-sm' }, row.getValue('department')),
  },
  {
    accessorKey: 'reason',
    header: '申请事由',
    cell: ({ row }) => {
      const reason = row.getValue('reason') as string
      return h('div', {
        class: 'max-w-[200px] truncate text-muted-foreground transition-colors hover:text-foreground cursor-default',
        title: reason,
      }, reason)
    },
  },
  {
    accessorKey: 'createdAt',
    header: '申请日期',
    cell: ({ row }) => h('div', { class: 'text-muted-foreground tabular-nums' }, row.getValue('createdAt')),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, '操作'),
    cell: ({ row, table }) => {
      const u = row.original
      const meta = table.options.meta as any

      return h('div', { class: 'flex justify-end gap-2' }, [
        h(Button, {
          variant: 'outline',
          size: 'sm',
          class: 'text-green-600 hover:text-green-700 hover:bg-green-50 h-8 font-bold border-green-100',
          onClick: () => meta?.onApprove(u.id),
        }, () => h('div', { class: 'flex items-center' }, [
          h(Check, { class: 'h-4 w-4 mr-1' }),
          '通过',
        ])),
        h(Button, {
          variant: 'outline',
          size: 'sm',
          class: 'text-red-600 hover:text-red-700 hover:bg-red-50 h-8 font-bold border-red-100',
          onClick: () => meta?.onReject(u.id),
        }, () => h('div', { class: 'flex items-center' }, [
          h(X, { class: 'h-4 w-4 mr-1' }),
          '拒绝',
        ])),
      ])
    },
  },
]
