import type { SidebarData, Team, User } from '../types'

import {
  AudioWaveform,
  ClipboardList,
  Command,
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
    plan: 'Enterprise',
  },
  {
    name: 'Acme Corp.',
    logo: AudioWaveform,
    plan: 'Startup',
  },
  {
    name: 'Evil Corp.',
    logo: Command,
    plan: 'Free',
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
        { title: '账户审批', url: '/approvals', icon: UserCheck },
        { title: '用户管理', url: '/users', icon: Users },
        { title: '项目管理', url: '/projects', icon: FolderOpen },
        { title: '操作日志', url: '/audit-logs', icon: ClipboardList },
      ],
    },
  ],
}
