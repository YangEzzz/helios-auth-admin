import type { SidebarData, Team, User } from '../types'

import {
  ClipboardList,
  FolderOpen,
  GalleryVerticalEnd,
  LayoutDashboard,
  UserCheck,
  Users,
} from 'lucide-vue-next'

const user: User = {
  name: 'Admin',
  email: 'admin@helios.dev',
  avatar: '/avatars/shadcn.jpg',
}

const teams: Team[] = [
  {
    name: 'Helios Auth',
    logo: GalleryVerticalEnd,
    logoUrl: '/helios-icon.svg',
    plan: '项目入口',
  },
]

export const sidebarData: SidebarData = {
  user,
  teams,
  navMain: [
    {
      title: '常规',
      items: [
        { title: '仪表盘', url: '/dashboard', icon: LayoutDashboard },
        { title: '我的项目', url: '/my-projects', icon: FolderOpen },
      ],
    },
    {
      title: '管理',
      items: [
        { title: '账户审批', url: '/approvals', icon: UserCheck, roles: ['admin', 'super_admin'] },
        { title: '用户管理', url: '/users', icon: Users, roles: ['admin', 'super_admin'] },
        { title: '项目管理', url: '/projects', icon: FolderOpen, roles: ['admin', 'super_admin'] },
        { title: '操作日志', url: '/audit-logs', icon: ClipboardList, roles: ['admin', 'super_admin'] },
      ],
    },
  ],
}
