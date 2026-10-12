export const ADMIN_ROLES = ['admin', 'super_admin'] as const
export const roleLabels: Record<string, string> = { admin: '管理员', super_admin: '超级管理员', user: '正式成员' }
export const statusLabels: Record<string, string> = { active: '正常', locked: '已锁定', pending_approval: '待审批', rejected: '已拒绝' }

export function isAdminRole(role: unknown): boolean {
  return typeof role === 'string' && (ADMIN_ROLES as readonly string[]).includes(role)
}

export function accountStatusAction(status: string | undefined): 'lock' | 'unlock' | null {
  return status === 'active' ? 'lock' : status === 'locked' ? 'unlock' : null
}
