import { createPinia, setActivePinia } from 'pinia'
import { createApp, h, ref } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/auth'
import Approvals from '@/views/Approvals/index.vue'
import AuditLogs from '@/views/AuditLogs/index.vue'
import Detail from '@/views/Projects/Detail/index.vue'
import Users from '@/views/Users/index.vue'
import '@/style.css'

const requests = ref<string[]>([])
let failNextMutation = true
const users = Array.from({ length: 101 }, (_, index) => ({ id: `u${index + 1}`, name: index === 100 ? '最后一页待审批用户' : `测试成员 ${index + 1}`, email: `user${index}@example.test`, role: index === 1 ? 'super_admin' : 'user', department: '测试部门', status: index === 100 ? 'pending_approval' : index === 0 ? 'rejected' : index === 2 ? 'locked' : 'active', created_at: '2026-10-12T00:00:00Z' }))
const project = (id: string) => ({ id, project_name: `项目 ${id}`, project_id_string: id, project_url: '', description: `项目 ${id} 的描述`, role_documentation: [], created_at: '2026-10-12', updated_at: '2026-10-12' })

// No business API request leaves this page. All responses and mutations use test memory.
window.fetch = async (input, init) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const url = new URL(raw, window.location.href)
  const method = init?.method || (input instanceof Request ? input.method : 'GET')
  const id = url.searchParams.get('id') || url.searchParams.get('project_id') || 'A'
  let data: unknown = {}
  if (method !== 'GET') {
    const body = input instanceof Request ? await input.clone().text() : String(init?.body || '')
    requests.value.push(`${url.pathname}: ${body}`)
    await new Promise(resolve => setTimeout(resolve, 200))
    if (failNextMutation) {
      failNextMutation = false
      return new Response(JSON.stringify({ code: 500, message: '模拟请求失败，请重试' }), { headers: { 'Content-Type': 'application/json' } })
    }
    data = url.pathname.includes('project/update') ? { project: project(JSON.parse(body).id) } : {}
  }
  else if (url.pathname.endsWith('/sso/session')) {
    data = { user: { id: 'fixture', name: '测试管理员', email: 'fixture@example.test', role: 'admin' }, csrf_token: 'fixture' }
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
  else if (url.pathname.endsWith('/sso/clients')) {
    data = { clients: [] }
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
  auth.userInfo = { id: 'fixture', name: '测试管理员', email: 'fixture@example.test', role: 'admin' }
  auth.isLogin = true
  auth.initialized = true
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/users', component: Users }, { path: '/approvals', component: Approvals }, { path: '/projects/:id', component: Detail }, { path: '/audit-logs', component: AuditLogs }] })
  await router.push('/users')
  createApp({ render: () => h(TooltipProvider, {}, { default: () => h('div', [
    h('nav', { class: 'flex flex-wrap gap-2 border-b p-3' }, [
      ...[['用户列表', '/users'], ['审批队列', '/approvals'], ['项目 A', '/projects/A'], ['项目 B', '/projects/B'], ['日志列表', '/audit-logs']].map(([name, url]) => h('button', { onClick: () => router.push(url!), class: 'rounded border p-2' }, name)),
      h('button', { onClick: () => { auth.userInfo!.role = 'user' }, class: 'rounded border p-2' }, '模拟普通用户'),
      h('button', { onClick: () => { auth.userInfo!.role = 'admin' }, class: 'rounded border p-2' }, '恢复管理员'),
    ]),
    h(RouterView),
    h('pre', { 'aria-label': '模拟请求记录', 'class': 'whitespace-pre-wrap p-4 text-xs' }, requests.value.join('\n')),
  ]) }) }).use(pinia).use(router).mount('#app')
}
mountFixture().catch(console.error)
