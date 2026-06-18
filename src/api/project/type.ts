/**
 * src/api/project/type.ts
 * 项目管理相关类型定义
 */
import type { AuditLog } from '@/api/audit/type'

export interface ProjectInfo {
  id: string
  project_name: string
  project_id_string: string
  project_url?: string
  description: string
  role_documentation: string[]
  created_at: string
  updated_at: string
  // 临时兼容字段（如果后端还没实现这些字段的话）
  memberCount?: number
  roleTemplate?: string
  status?: string
  owner?: string
}

export interface MyProjectMembership {
  id: string
  user_id: string
  project_id: string
  role_in_project: string
  created_at: string
  project?: ProjectInfo
}

export interface ListProjectResult {
  projects: ProjectInfo[]
}

export interface ListMyProjectsResult {
  projects: MyProjectMembership[]
}

export interface ProjectDetailResult {
  project: ProjectInfo
}

export interface ProjectRoleTemplate {
  id: string
  project_id: string
  role_name: string
  description: string
  created_at?: string
  updated_at?: string
}

export interface ListProjectRoleTemplatesResult {
  role_templates: ProjectRoleTemplate[]
}

export interface ProjectMember {
  id: string
  user_id: string
  project_id: string
  role_in_project: string
  created_at: string
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export interface ListProjectMembersResult {
  members: ProjectMember[]
}

export interface ProjectAuditLogsResult {
  logs: AuditLog[]
  total: number
  page: number
  page_size: number
}

export interface ProjectMutationResult {
  project?: ProjectInfo
}

export interface CreateProjectData {
  project_name: string
  project_id_string: string
  project_url?: string
  description?: string
}

export interface UpdateProjectData {
  id: string
  project_name: string
  project_url?: string
  description?: string
}

export interface DeleteProjectData {
  id: string
}
