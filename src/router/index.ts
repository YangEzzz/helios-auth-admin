import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { reqUserInfo } from '@/api/user'
import { getToken } from '@/utils/auth'

// 基础路由 - 不需要权限控制的路由
const baseRoutes: RouteRecordRaw[] = [
  // ===== 认证路由（无需登录）=====
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login/index.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/Register/index.vue'),
  },

  // ===== 主应用路由（需要登录）=====
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('@/layouts/index.vue'),
    children: [
      // 仪表盘
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
      },
      // 个人资料
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { title: '个人资料', icon: 'User', showInMenu: false }
      },
      // 我的项目
      {
        path: 'my-projects',
        name: 'my-projects',
        component: () => import('@/views/MyProjects/index.vue'),
      },
      // 账户审批
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('@/views/Approvals/index.vue'),
        meta: { title: '账户审批', icon: 'UserPlus', showInMenu: true }
      },
      // 用户管理
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users/index.vue'),
        meta: { title: '用户管理', icon: 'User', showInMenu: true }
      },
      // 项目管理
      {
        path: 'projects',
        name: 'projects',
        component: () => import('@/views/Projects/index.vue'),
      },
      // 项目详情/具体管理
      {
        path: 'projects/:id',
        name: 'project-detail',
        component: () => import('@/views/Projects/Detail/index.vue'),
        meta: { title: '项目详情', showInMenu: false }
      },
      // 权限管理
      {
        path: 'permissions',
        name: 'permissions',
        component: () => import('@/views/Permissions/index.vue'),
      },
      // 操作日志
      {
        path: 'audit-logs',
        name: 'audit-logs',
        component: () => import('@/views/AuditLogs/index.vue'),
      },
    ],
  },

  // ===== 旧版 Auth 路由（保留兼容性）=====
  {
    path: '/tasks',
    component: () => import('@/layouts/index.vue'),
    children: [
      {
        path: '',
        name: 'tasks',
        component: () => import('@/views/Tasks/index.vue'),
      },
    ],
  },
  {
    path: '/auth',
    children: [
      {
        path: 'sign-in',
        name: 'sign-in',
        component: () => import('@/views/Auth/SignIn.vue'),
      },
      {
        path: 'sign-in-2',
        name: 'sign-in-2',
        component: () => import('@/views/Auth/SignIn2.vue'),
      },
      {
        path: 'sign-up',
        name: 'sign-up',
        component: () => import('@/views/Auth/SignUp.vue'),
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/Auth/ForgotPassword.vue'),
      },
      {
        path: 'otp',
        name: 'otp',
        component: () => import('@/views/Auth/Otp.vue'),
      },
    ],
  },
  // Error routes - 错误页面路由
  {
    path: '/errors',
    children: [
      {
        path: '401',
        name: 'error-401',
        component: () => import('@/views/Errors/401.vue'),
      },
      {
        path: '403',
        name: 'error-403',
        component: () => import('@/views/Errors/403.vue'),
      },
      {
        path: '404',
        name: 'error-404',
        component: () => import('@/views/Errors/404.vue'),
      },
      {
        path: '500',
        name: 'error-500',
        component: () => import('@/views/Errors/500.vue'),
      },
      {
        path: '503',
        name: 'error-503',
        component: () => import('@/views/Errors/503.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_APP_PUBLIC_PATH),
  routes: baseRoutes,
  scrollBehavior: (_, __, savedPosition) => {
    return savedPosition || { top: 0, left: 0 }
  },
})

// 路由白名单，不需要登录即可进入
const whiteList = ['/login', '/register']

// 全局前置守卫：登录鉴权与重定向
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  const token = getToken()

  if (token) {
    if (to.path === '/login' || to.path === '/register') {
      next({ path: '/' })
    } else {
      // 关键：如果有 token 但没有用户信息，说明是刷新页面或伪造 token
      if (!authStore.userInfo) {
        try {
          // 调用后端接口获取用户信息，校验 token 真实性
          const res = await reqUserInfo()
          // 假设返回结构是 { code: 200, data: { ...UserInfo }, message: "" }
          authStore.userInfo = res.data 
          next()
        } catch (error) {
          // Token 校验失败（后端返回 401 等）
          authStore.logout()
          next({ path: '/login', query: { redirect: to.fullPath } })
        }
      } else {
        next()
      }
    }
  } else {
    // 未登录状态下
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
})

// 清除路由和登出时重置路由状态
export const resetRouter = async () => {
  // const permissionStore = await initStore()
  // permissionStore.resetRoutes()
}

export default router
