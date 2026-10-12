import { ssoRequest } from '@/utils/session'

export interface SSORequestInfo { app_name: string, csrf_token: string, user: { name: string, email: string } | null }
export const getSSORequest = (requestId: string) => ssoRequest<SSORequestInfo>(`/request?id=${encodeURIComponent(requestId)}`)
export const continueSSOLogin = (requestId: string) => ssoRequest<{ redirect_url: string }>('/continue', { request_id: requestId })
export const loginSSORequest = (data: { request_id: string, email: string, password: string }) => ssoRequest<{ user: SSORequestInfo['user'] }>('/login', data)
export const cancelSSORequest = (requestId: string) => ssoRequest<{ redirect_url: string }>('/cancel', { request_id: requestId })
export const logoutSSOSession = () => ssoRequest<unknown>('/logout', {})
