/**
 * src/api/project/type.ts
 * 项目管理相关类型定义
 */

export interface ProjectInfo {
  id: string
  project_name: string
  project_id_string: string
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

export interface ListProjectResult {
  projects: ProjectInfo[]
  code: number
}

export interface CreateProjectData {
  project_name: string
  project_id_string: string
  description?: string
}

export interface DeleteProjectData {
  id: string
}
