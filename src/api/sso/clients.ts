import { api } from '@/request'

export interface ProjectSSOConfig {
  client_id: string
  name: string
  configured: boolean
  credential_ready: boolean
  enabled: boolean
  mixed_enabled: boolean
  redirect_uris: string[]
}
const projectURL = (projectId: string) => `/api/v1/sso/projects/${encodeURIComponent(projectId)}`
export const getProjectSSOConfig = (projectId: string) => api.get<{ config: ProjectSSOConfig }>({ url: projectURL(projectId) })
export const saveProjectSSOConfig = (projectId: string, data: { enabled: boolean, redirect_uris: string[] }) => api.post<{ config: ProjectSSOConfig, client_secret: string }>({ url: projectURL(projectId), data })
export const rotateProjectSSOSecret = (projectId: string) => api.post<{ client_secret: string }>({ url: `${projectURL(projectId)}/rotate`, data: {} })
