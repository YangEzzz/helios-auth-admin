import { api } from '@/request'

export interface SSOClient { client_id: string, name: string, enabled: boolean, redirect_uris: string[] }
export interface SaveSSOClient extends SSOClient { project_id: string }
const CLIENTS_URL = '/api/v1/sso/clients'
export const listSSOClients = (projectId: string) => api.get<{ clients: SSOClient[] }>({ url: CLIENTS_URL, params: { project_id: projectId } })
export const saveSSOClient = (data: SaveSSOClient) => api.post<{ client: SSOClient, client_secret: string }>({ url: CLIENTS_URL, data })
export const rotateSSOClientSecret = (clientId: string) => api.post<{ client_secret: string }>({ url: `${CLIENTS_URL}/${encodeURIComponent(clientId)}/rotate`, data: {} })
