import type {
  CreateProjectData,
  DeleteProjectData,
  ListMyProjectsResult,
  ListProjectResult,
} from './type'
import type { ResponseData } from '@/request'
/**
 * src/api/project/index.ts
 * 项目管理相关接口封装 (Axios 版)
 */
import request from '@/request'

const API = {
  LIST_URL: '/api/v1/projects',
  CREATE_URL: '/api/v1/projects',
  DELETE_URL: '/api/v1/delete_project',
  DETAIL_URL: '/api/v1/project',
} as const

/**
 * 获取所有项目列表
 */
export const reqListProjects = () => {
  return request.get<any, ResponseData<ListProjectResult>>(API.LIST_URL)
}

export const reqMyProjects = () => {
  return request.get<any, ResponseData<ListMyProjectsResult>>('/api/v1/my-projects')
}

/**
 * 创建新项目
 */
export const reqCreateProject = (data: CreateProjectData) => {
  return request.post<any, ResponseData<any>>(API.CREATE_URL, data)
}

/**
 * 获取具体项目详情
 */
export const reqProjectDetail = (id: string) => {
  return request.get<any, ResponseData<any>>(API.DETAIL_URL, { params: { id } })
}

/**
 * 获取项目成员列表
 */
export const reqProjectMembers = (projectId: string) => {
  return request.get<any, ResponseData<any>>('/api/v1/project/members', { params: { project_id: projectId } })
}

/**
 * 添加成员到项目
 */
export const reqAddProjectMember = (data: { project_id: string, user_id: string, role: string }) => {
  return request.post<any, ResponseData<any>>('/api/v1/project/member', data)
}

/**
 * 设置项目成员角色
 */
export const reqSetProjectMemberRole = (data: { project_id: string, user_id: string, role: string }) => {
  return request.post<any, ResponseData<any>>('/api/v1/project/member/role', data)
}

/**
 * 为项目添加角色模板
 */
export const reqAddProjectRoleTemplate = (data: { project_id: string, role_name: string, description: string }) => {
  return request.post<any, ResponseData<any>>('/api/v1/add_project_template', data)
}

/**
 * 获取项目的角色模板列表
 */
export const reqProjectRoleTemplates = (projectId: string) => {
  return request.get<any, ResponseData<any>>('/api/v1/project/role_templates', { params: { id: projectId } })
}

/**
 * 移除项目成员
 */
export const reqRemoveProjectMember = (data: { project_id: string, user_id: string }) => {
  return request.post<any, ResponseData<any>>('/api/v1/project/member/remove', data)
}

/**
 * 更新项目成员角色
 */
export const reqUpdateProjectMemberRole = (data: { project_id: string, user_id: string, role: string }) => {
  return request.post<any, ResponseData<any>>('/api/v1/project/member/role', data)
}

/**
 * 获取项目的审计日志列表
 */
export const reqProjectAuditLogs = (projectId: string) => {
  return request.get<any, ResponseData<any>>('/api/v1/project/audit_logs', { params: { id: projectId } })
}

/**
 * 删除项目
 */
export const reqDeleteProject = (data: DeleteProjectData) => {
  return request.post<any, ResponseData<any>>(API.DELETE_URL, data)
}
