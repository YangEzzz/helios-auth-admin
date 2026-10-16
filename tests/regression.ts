import { createPinia, setActivePinia } from 'pinia'
import { createApp, h, ref } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useSystemTheme } from '@/composables/use-system-theme'
import Layout from '@/layouts/index.vue'
import { useAuthStore } from '@/store/auth'
import Approvals from '@/views/Approvals/index.vue'
import AuditLogs from '@/views/AuditLogs/index.vue'
import Dashboard from '@/views/Dashboard/index.vue'
import Login from '@/views/Login/index.vue'
import MyProjects from '@/views/MyProjects/index.vue'
import Profile from '@/views/Profile/index.vue'
import Detail from '@/views/Projects/Detail/index.vue'
import Projects from '@/views/Projects/index.vue'
import Register from '@/views/Register/index.vue'
import Users from '@/views/Users/index.vue'
import '@/assets/themes.css'
import '@/assets/scrollbar.css'
import '@/style.css'

const requests = ref<string[]>([])
function authRole() {
  return useAuthStore().userInfo?.role === 'user' ? 'user' : 'admin'
}
let failNextMutation = true
let failDashboard = false
let emptyDashboard = false
const project = (id: string) => ({ id, project_name: `项目 ${id}`, project_id_string: id, project_url: '', description: `项目 ${id} 的描述`, role_documentation: [], created_at: '2026-10-12', updated_at: '2026-10-12' })
const ssoConfigs = new Map<string, { client_id: string, name: string, configured: boolean, credential_ready: boolean, enabled: boolean, mixed_enabled: boolean, redirect_uris: string[] }>()
function ssoConfig(id: string) {
  if (!ssoConfigs.has(id)) {
    const existing = new URLSearchParams(location.search).has('sso-existing')
    ssoConfigs.set(id, { client_id: project(id).project_id_string, name: project(id).project_name, configured: existing, credential_ready: existing, enabled: true, mixed_enabled: false, redirect_uris: existing ? ['http://localhost:5173/api/v1/auth/sso/callback', 'https://nexus-api.example.test/api/v1/auth/sso/callback'] : [] })
  }
  return ssoConfigs.get(id)!
}
const dashboardStats = [
  { label: '总用户数', value: '128', trend: '+12 本周新注册', tone: 'info', emphasis: 'users' },
  { label: '待审批', value: '6', trend: '等待管理员处理', tone: 'warning', emphasis: 'approvals' },
  { label: '接入项目', value: '8', trend: '+2 本周新增', tone: 'muted', emphasis: 'projects' },
  { label: '授权记录', value: '346', trend: '+28 近 30 天变更', tone: 'success', emphasis: 'audit' },
]
const users = Array.from({ length: 101 }, (_, index) => ({ id: `u${index + 1}`, name: index === 100 ? '最后一页待审批用户' : `测试成员 ${index + 1}`, email: `user${index}@example.test`, role: index === 1 ? 'super_admin' : 'user', department: '测试部门', status: index === 100 ? 'pending_approval' : index === 0 ? 'rejected' : index === 2 ? 'locked' : 'active', created_at: '2026-10-12T00:00:00Z' }))

// No business API request leaves this page. All responses and mutations use test memory.
window.fetch = async (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(raw, window.location.href)
  const method = init?.method || (input instanceof Request ? input.method : 'GET')
  const id = url.searchParams.get('id') || url.searchParams.get('project_id') || 'A'
  let data: unknown = {}
  if (method !== 'GET') {
    const body = input instanceof Request ? await input.clone().text() : String(init?.body || '')
    requests.value.push((url.pathname.endsWith('/sso/login') || url.pathname.endsWith('/register')) ? `${url.pathname}: [credentials omitted]` : `${url.pathname}: ${body}`)
    await new Promise(resolve => setTimeout(resolve, 200))
    if (failNextMutation) {
      failNextMutation = false
      return new Response(JSON.stringify({ code: 500, message: '模拟请求失败，请重试' }), { headers: { 'Content-Type': 'application/json' } })
    }
    data = url.pathname.endsWith('/sso/login') ? { user: { id: 'fixture', name: '测试管理员', email: 'fixture@example.test', role: 'admin', status: 'active' } } : url.pathname.includes('project/update') ? { project: project(JSON.parse(body).id) } : {}
    if (url.pathname.includes('/sso/projects/')) {
      const config = ssoConfig(url.pathname.split('/')[5]!)
      if (url.pathname.endsWith('/rotate')) {
        data = { client_secret: 'fixture-only-project-secret' }
      }
      else {
        const creating = !config.credential_ready
        Object.assign(config, JSON.parse(body), { configured: true, credential_ready: true, mixed_enabled: false })
        data = { config, client_secret: creating ? 'fixture-only-project-secret' : '' }
      }
    }
  }
  else if (url.pathname.endsWith('/sso/session')) {
    data = { user: { id: 'fixture', name: '测试管理员', email: 'fixture@example.test', role: 'admin' }, csrf_token: 'fixture' }
  }
  else if (url.pathname.endsWith('/dashboard')) {
    await new Promise(resolve => setTimeout(resolve, 600))
    if (failDashboard) {
      failDashboard = false
      return new Response(JSON.stringify({ code: 500, message: '模拟网络错误，请重试' }), { headers: { 'Content-Type': 'application/json' } })
    }
    data = { generated_at: '2026-10-13T04:00:00Z', role_mode: authRole(), admin: { stats: dashboardStats, system_headline: '当前有 6 个账户申请待处理，查看最近的授权与项目变更。', approval_feed: emptyDashboard ? [] : [{ id: 'a1', name: '林晓', email: 'lin@example.test', status: 'approved', operator: '管理员', time: '10 分钟前' }, { id: 'a2', name: '陈宇', email: 'chen@example.test', status: 'pending', operator: '系统', time: '30 分钟前' }], activity_feed: emptyDashboard ? [] : [{ id: 'l1', action: '成员授权', detail: '林晓获得多语言工作空间的开发者角色', resource: '多语言工作空间', time: '10 分钟前', tone: 'success' }, { id: 'l2', action: '项目创建', detail: '团队知识库已接入 Helios', resource: '团队知识库', time: '1 小时前', tone: 'info' }] }, user: { welcome_title: '你好，测试成员', welcome_note: '查看你的项目与最近访问记录。', summary: dashboardStats.slice(0, 3), projects: [], activity_feed: [], account_status: 'active' } }
  }
  else if (url.pathname.endsWith('/projects') || url.pathname.endsWith('/projects/list')) {
    data = { projects: [{ ...project('A'), project_name: '多语言工作空间', project_id_string: 'nexus-multilingual' }, { ...project('B'), project_name: '团队知识库', project_id_string: 'team-knowledge' }] }
  }
  else if (url.pathname.endsWith('/my-projects')) {
    data = { projects: ['A', 'B'].map((id, index) => ({ id, role_in_project: index === 0 ? 'developer' : 'viewer', created_at: '2026-10-13', project: { ...project(id), project_name: index === 0 ? '多语言工作空间' : '团队知识库', project_id_string: index === 0 ? 'nexus-multilingual' : 'team-knowledge' } })) }
  }
  else if (url.pathname.endsWith('/me')) {
    data = { id: 'fixture', name: '测试管理员', email: 'fixture@example.test', role: 'admin', status: 'active', department: '产品与研发', created_at: '2026-08-01' }
  }
  else if (url.pathname.endsWith('/users/list')) {
    const page = Number(url.searchParams.get('page') || 1)
    data = { users: users.slice((page - 1) * 100, page * 100), total: 101, page, page_size: 100, total_pages: 2 }
  }
  else if (url.pathname.endsWith('/project')) {
    await new Promise(resolve => setTimeout(resolve, id === 'A' ? 600 : 10))
    data = { project: project(id) }
  }
  else if (url.pathname.endsWith('/members')) {
    data = { members: [{ id, user_id: 'u2', role_in_project: 'developer', created_at: '2026-10-12', user: { id: 'u2', name: `成员 ${id}`, email: 'member@example.test' } }] }
  }
  else if (url.pathname.endsWith('/role_templates')) {
    data = { role_templates: [{ id: 'developer', role_name: 'developer', description: '开发者' }] }
  }
  else if (url.pathname.includes('/sso/projects/')) {
    data = { config: ssoConfig(url.pathname.split('/')[5]!) }
  }
  else if (url.pathname.endsWith('/audit_logs')) {
    data = { logs: [], total: 0, page: 1, page_size: 10, total_pages: 1 }
  }
  return new Response(JSON.stringify({ code: 200, data, message: '' }), { headers: { 'Content-Type': 'application/json' } })
}

async function mountFixture() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.userInfo = { id: 'fixture', name: '测试管理员', email: 'fixture@example.test', role: 'admin', status: 'active' }
  auth.isLogin = true
  auth.initialized = true
  const router = createRouter({ history: createMemoryHistory(), scrollBehavior: () => ({ top: 0, left: 0 }), routes: [{ path: '/register', component: Register }, { path: '/login', component: Login }, { path: '/', component: Layout, children: [{ path: 'profile', component: Profile, meta: { title: '个人资料' } }, { path: 'my-projects', component: MyProjects }, { path: 'dashboard', component: Dashboard }, { path: 'users', component: Users }, { path: 'approvals', component: Approvals }, { path: 'projects', component: Projects }, { path: 'projects/:id', component: Detail, name: 'project-detail', meta: { title: '项目详情' } }, { path: 'audit-logs', component: AuditLogs }] }] })
  await router.push('/dashboard')
  createApp({ setup() {
    useSystemTheme()
  }, render: () => h(TooltipProvider, {}, { default: () => h('div', [
    h(RouterView),
    h('nav', { 'aria-label': '本地测试控制', 'class': 'relative z-50 flex flex-wrap gap-2 border-t bg-background p-3 md:ml-64' }, [
      ...[['仪表盘', '/dashboard'], ['登录预览', '/login'], ['注册预览', '/register'], ['我的项目', '/my-projects'], ['个人资料', '/profile'], ['项目列表', '/projects'], ['用户列表', '/users'], ['审批队列', '/approvals'], ['项目 A', '/projects/A'], ['项目 B', '/projects/B'], ['日志列表', '/audit-logs']].map(([name, url]) => h('button', { onClick: () => router.push(url!), class: 'rounded border p-2' }, name)),
      h('button', { onClick: () => { failDashboard = true }, class: 'rounded border p-2' }, '下次概览请求失败'),
      h('button', { onClick: () => { emptyDashboard = !emptyDashboard }, class: 'rounded border p-2' }, '切换空动态'),
      h('button', { onClick: () => { auth.userInfo!.role = 'user' }, class: 'rounded border p-2' }, '模拟普通用户'),
      h('button', { onClick: () => { auth.userInfo!.role = 'admin' }, class: 'rounded border p-2' }, '恢复管理员'),
    ]),

    h('pre', { 'aria-label': '模拟请求记录', 'class': 'whitespace-pre-wrap break-all p-4 text-xs' }, requests.value.join('\n')),
  ]) }) }).use(pinia).use(router).mount('#app')
}
mountFixture().catch(console.error)
