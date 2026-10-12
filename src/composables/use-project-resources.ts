import type { ComputedRef } from 'vue'
import type { AuditLog } from '@/api/audit/type'
import type { ProjectInfo, ProjectRoleTemplate } from '@/api/project/type'
import type { UserInfo } from '@/api/user/type'
import type { ProjectMemberRow } from '@/views/Projects/Detail/components/member-columns'
import { reactive, ref } from 'vue'
import { reqProjectAuditLogs, reqProjectDetail, reqProjectMembers, reqProjectRoleTemplates } from '@/api/project'
import { fetchUserDirectory } from '@/api/user'
import { useRequestScope } from '@/composables/use-request-scope'
import { errorMessage } from '@/lib/errors'

export function useProjectResources(projectId: ComputedRef<string>) {
  const projectScope = useRequestScope(() => projectId.value)
  const errors = reactive<Record<string, string>>({})
  const loading = ref(false)
  const membersLoading = ref(false)
  const rolesLoading = ref(false)
  const auditLoading = ref(false)
  const project = ref<ProjectInfo>({ id: '', project_name: '', description: '', project_id_string: '', project_url: '', role_documentation: [], created_at: '', updated_at: '' })
  const members = ref<ProjectMemberRow[]>([])
  const roleTemplates = ref<ProjectRoleTemplate[]>([])
  const auditLogs = ref<AuditLog[]>([])
  const allUsers = ref<UserInfo[]>([])

  async function query<T>(key: string, busy: { value: boolean }, load: (id: string) => Promise<T>, commit: (result: T) => void) {
    const ticket = projectScope.captureLatest(key)
    errors[key] = ''
    busy.value = true
    try {
      const result = await load(ticket.context)
      if (ticket.isCurrent())
        commit(result)
    }
    catch (cause) {
      if (ticket.isCurrent())
        errors[key] = errorMessage(cause)
    }
    finally {
      if (ticket.isCurrent())
        busy.value = false
    }
  }

  const fetchProjectDetail = () => query('fetchProjectDetail', loading, async id => (await reqProjectDetail(id)).data.project, (value) => {
    project.value = value
  })
  const fetchMembers = () => query('fetchMembers', membersLoading, async id => (await reqProjectMembers(id)).data.members, (value) => {
    members.value = value.map(member => ({ id: member.id, user_id: member.user_id, name: member.user?.name || '未知', email: member.user?.email || '', avatar: member.user?.avatar, role: member.role_in_project, joined_at: member.created_at ? new Date(member.created_at).toLocaleDateString('zh-CN') : '暂无' }))
  })
  const fetchRoleTemplates = () => query('fetchRoleTemplates', rolesLoading, async id => (await reqProjectRoleTemplates(id)).data.role_templates, (value) => {
    roleTemplates.value = value
  })
  const fetchAuditLogs = () => query('fetchAuditLogs', auditLoading, async id => (await reqProjectAuditLogs(id)).data.logs, (value) => {
    auditLogs.value = value
  })
  const usersLoading = ref(false)
  const fetchAllUsers = () => query('fetchAllUsers', usersLoading, fetchUserDirectory, (value) => {
    allUsers.value = value
  })
  function refreshProject() {
    return Promise.all([fetchProjectDetail(), fetchMembers(), fetchRoleTemplates(), fetchAuditLogs(), fetchAllUsers()])
  }
  function reset() {
    projectScope.invalidate()
    members.value = []
    roleTemplates.value = []
    auditLogs.value = []
    allUsers.value = []
    Object.keys(errors).forEach((key) => {
      errors[key] = ''
    })
  }
  return { projectScope, errors, loading, membersLoading, rolesLoading, auditLoading, project, members, roleTemplates, auditLogs, allUsers, fetchProjectDetail, fetchMembers, fetchRoleTemplates, fetchAuditLogs, fetchAllUsers, refreshProject, reset }
}
