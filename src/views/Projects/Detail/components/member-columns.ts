import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserMinus, ShieldCheck } from 'lucide-vue-next'

export interface ProjectMemberRow {
  id: string
  user_id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'developer' | 'guest'
  joined_at: string
}

export const columns: ColumnDef<ProjectMemberRow>[] = [
  {
    accessorKey: 'name',
    header: '成员',
    cell: ({ row }) => {
      const u = row.original
      
      const avatarContent = u.avatar 
        ? h('img', { src: u.avatar, class: 'h-full w-full object-cover' })
        : h('span', {}, u.name.substring(0, 1).toUpperCase())

      return h('div', { class: 'flex items-center gap-3 py-1' }, [
        h('div', { 
          class: 'h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-sm overflow-hidden' 
        }, [avatarContent]),
        h('div', { class: 'flex flex-col min-w-0' }, [
          h('span', { class: 'font-bold text-xs truncate max-w-[120px]' }, u.name),
          h('span', { class: 'text-[9px] text-muted-foreground truncate max-w-[120px]' }, u.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'role',
    header: '项目角色',
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const variants = {
        owner: 'default',
        developer: 'secondary',
        guest: 'outline'
      } as const
      return h(Badge, { 
        variant: variants[role as keyof typeof variants] || 'outline', 
        class: 'font-bold uppercase text-[9px] tracking-widest px-2 py-0.5' 
      }, () => role)
    }
  },
  {
    accessorKey: 'joined_at',
    header: '入组日期',
    cell: ({ row }) => h('div', { class: 'text-[10px] font-mono text-muted-foreground' }, row.getValue('joined_at'))
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row, table }) => {
      const u = row.original
      const meta = table.options.meta as any

      return h('div', { class: 'flex items-center gap-1' }, [
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-7 w-7 rounded-full text-muted-foreground hover:text-primary transition-colors',
          onClick: () => meta?.onEditRole(u)
        }, () => h(ShieldCheck, { class: 'h-3.5 w-3.5' })),
        h(Button, {
          variant: 'ghost',
          size: 'icon',
          class: 'h-7 w-7 rounded-full text-muted-foreground hover:text-destructive transition-colors',
          onClick: () => meta?.onRemoveMember(u.user_id)
        }, () => h(UserMinus, { class: 'h-3.5 w-3.5' }))
      ])
    }
  }
]
