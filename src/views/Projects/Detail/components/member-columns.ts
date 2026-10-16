import type { ColumnDef } from '@tanstack/vue-table'
import { ShieldCheck, UserMinus } from 'lucide-vue-next'
import { h } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ProjectMemberRow {
  id: string
  user_id: string
  name: string
  email: string
  avatar?: string
  role: string
  joined_at: string
}

export const columns: ColumnDef<ProjectMemberRow>[] = [
  {
    accessorKey: 'name',
    header: '成员',
    cell: ({ row }) => {
      const u = row.original

      const avatarContent = u.avatar
        ? h('img', { src: u.avatar, alt: '', class: 'h-full w-full object-cover' })
        : h('span', {}, u.name.substring(0, 1).toUpperCase())

      return h('div', { class: 'flex items-center gap-3 py-1' }, [
        h('div', {
          class: 'h-8 w-8 rounded-full bg-muted border border-primary/10 flex items-center justify-center text-primary font-medium text-xs  overflow-hidden',
        }, [avatarContent]),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'font-medium text-xs truncate max-w-[120px]' }, u.name),
          h('span', { class: 'text-xs text-muted-foreground break-all max-w-[220px]' }, u.email),
        ]),
      ])
    },
  },
  {
    accessorKey: 'role',
    header: '项目角色',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const variants = {
        owner: 'default',
        developer: 'secondary',
        guest: 'outline',
      } as const
      return h(Badge, {
        variant: variants[role as keyof typeof variants] || 'outline',
        class: 'font-medium text-xs tracking-normal px-2 py-0.5',
      }, () => role)
    },
  },
  {
    accessorKey: 'joined_at',
    header: '入组日期',
    cell: ({ row }) => h('div', { class: 'text-xs font-mono text-muted-foreground' }, row.getValue('joined_at')),
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row, table }) => {
      const u = row.original
      const meta = table.options.meta as { canManage: () => boolean, busy: boolean, onEditRole: (member: ProjectMemberRow) => void, onRemoveMember: (id: string) => void } | undefined

      return h('div', { class: 'flex items-center gap-1' }, [
        h(Button, {
          'variant': 'ghost',
          'size': 'icon',
          'disabled': !meta?.canManage() || meta.busy,
          'class': 'h-7 w-7 rounded-full text-muted-foreground hover:text-primary transition-colors',
          'aria-label': `编辑 ${u.name} 的项目角色`,
          'onClick': () => meta?.onEditRole(u),
        }, () => h(ShieldCheck, { class: 'h-3.5 w-3.5' })),
        h(Button, {
          'variant': 'ghost',
          'size': 'icon',
          'disabled': !meta?.canManage() || meta.busy,
          'class': 'h-7 w-7 rounded-full text-muted-foreground hover:text-destructive transition-colors',
          'aria-label': `移除项目成员 ${u.name}`,
          'onClick': () => meta?.onRemoveMember(u.user_id),
        }, () => h(UserMinus, { class: 'h-3.5 w-3.5' })),
      ])
    },
  },
]
