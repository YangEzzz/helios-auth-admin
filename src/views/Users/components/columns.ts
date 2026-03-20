import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Shield, Edit, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

export interface UserRow {
  id: string
  name: string
  email: string
  department: string
  role: string
  status: string
  createdAt: string
}

export const columns: ColumnDef<UserRow>[] = [
  {
    id: 'select',
    header: ({ table }) => h(Checkbox, {
      'checked': table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate'),
      'onUpdate:checked': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Select all',
      'class': 'translate-y-0.5',
    }),
    cell: ({ row }) => h(Checkbox, {
      'checked': row.getIsSelected(),
      'onUpdate:checked': (value: boolean) => row.toggleSelected(!!value),
      'ariaLabel': 'Select row',
      'class': 'translate-y-0.5',
    }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: '成员信息',
    cell: ({ row }) => {
      const u = row.original
      return h('div', { class: 'flex items-center gap-3 py-1' }, [
        h('div', { 
          class: 'h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background shadow-sm' 
        }, u.name.substring(0, 1).toUpperCase()),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'font-bold text-sm truncate max-w-[150px]' }, u.name),
          h('span', { class: 'text-[10px] text-muted-foreground truncate max-w-[150px]' }, u.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'department',
    header: '部门',
    cell: ({ row }) => h('div', { class: 'font-medium text-xs text-muted-foreground/80' }, row.getValue('department'))
  },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      return h(Badge, { variant: role === 'admin' ? 'default' : 'secondary', class: 'font-bold uppercase text-[9px] tracking-widest px-2 py-0.5' }, () => role)
    }
  },
  {
    accessorKey: 'status',
    header: '账户状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h('div', { class: `h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}` }),
        h('span', { class: 'text-[10px] font-bold uppercase' }, status === 'active' ? '正常' : '锁定')
      ])
    }
  },
  {
    accessorKey: 'createdAt',
    header: '加入日期',
    cell: ({ row }) => h('div', { class: 'text-[10px] tabular-nums font-mono text-muted-foreground' }, row.getValue('createdAt'))
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row, table }) => {
      const u = row.original
      const meta = table.options.meta as any
      const isMe = u.id === meta?.currentUserId

      return h('div', { class: 'flex items-center gap-1' }, [
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-8 w-8 rounded-full text-muted-foreground hover:text-primary transition-colors',
          onClick: () => meta?.onEditRole(u)
        }, () => h(Shield, { class: 'h-3.5 w-3.5' })),
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          disabled: isMe,
          class: 'h-8 w-8 rounded-full text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30',
          onClick: () => meta?.onDelete(u.id)
        }, () => h(Trash2, { class: 'h-3.5 w-3.5' }))
      ])
    }
  }
]
