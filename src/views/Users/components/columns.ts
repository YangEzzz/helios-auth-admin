import type { ColumnDef } from '@tanstack/vue-table'
import { LockKeyhole, Shield, UnlockKeyhole } from 'lucide-vue-next'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
    accessorKey: 'name',
    header: '成员信息',
    cell: ({ row }) => {
      const u = row.original
      return h('div', { class: 'flex items-center gap-3 py-1' }, [
        h('div', {
          class: 'h-9 w-9 rounded-xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm',
        }, u.name.substring(0, 1).toUpperCase()),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'font-semibold text-sm truncate max-w-[180px]' }, u.name),
          h('span', { class: 'text-xs text-muted-foreground truncate max-w-[220px]' }, u.email),
        ]),
      ])
    },
  },
  {
    accessorKey: 'department',
    header: '部门',
    cell: ({ row }) => h('div', { class: 'font-medium text-xs text-muted-foreground/80' }, row.getValue('department')),
  },
  {
    accessorKey: 'role',
    header: '角色',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const label = role === 'admin' ? '管理员' : '成员'
      return h(Badge, {
        variant: role === 'admin' ? 'default' : 'secondary',
        class: 'font-medium text-xs px-2 py-0.5',
      }, () => label)
    },
  },
  {
    accessorKey: 'status',
    header: '账户状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const isActive = status === 'active'
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h('div', { class: `h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]' : 'bg-destructive'}` }),
        h('span', { class: `text-xs font-medium ${isActive ? 'text-emerald-700 dark:text-emerald-300' : 'text-destructive'}` }, isActive ? '正常' : '锁定'),
      ])
    },
  },
  {
    accessorKey: 'createdAt',
    header: '加入日期',
    cell: ({ row }) => h('div', { class: 'text-xs tabular-nums font-mono text-muted-foreground' }, row.getValue('createdAt')),
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row, table }) => {
      const u = row.original
      const meta = table.options.meta as any
      const isMe = u.id === meta?.currentUserId
      const isLocked = u.status !== 'active'
      const StatusIcon = isLocked ? UnlockKeyhole : LockKeyhole
      const statusTooltip = isLocked ? '解锁用户' : '锁定用户'

      return h('div', { class: 'flex items-center gap-1' }, [
        h(Tooltip, {}, () => [
          h(TooltipTrigger, { asChild: true }, () => h(Button, {
            variant: 'ghost',
            size: 'icon',
            class: 'h-8 w-8 rounded-lg text-muted-foreground hover:text-primary transition-colors',
            onClick: () => meta?.onEditRole(u),
          }, () => h(Shield, { class: 'h-3.5 w-3.5' }))),
          h(TooltipContent, {}, () => h('p', '修改角色')),
        ]),
        h(Tooltip, {}, () => [
          h(TooltipTrigger, { asChild: true }, () => h(Button, {
            variant: 'ghost',
            size: 'icon',
            disabled: isMe,
            class: `h-8 w-8 rounded-lg text-muted-foreground transition-colors disabled:opacity-30 ${isLocked ? 'hover:text-emerald-600' : 'hover:text-destructive'}`,
            onClick: () => meta?.onDelete(u),
          }, () => h(StatusIcon, { class: 'h-3.5 w-3.5' }))),
          h(TooltipContent, {}, () => h('p', isMe ? '不能操作当前账号' : statusTooltip)),
        ]),
      ])
    },
  },
]
