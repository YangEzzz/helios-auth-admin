import type { UserInfo } from '@/api/user/type'

interface SessionInfo { user: UserInfo | null, csrf_token: string }
let csrfToken = ''
let bootstrap: Promise<SessionInfo> | null = null
export const apiBaseURL = (import.meta.env.VITE_APP_API_BASE_URL || (import.meta.env.PROD ? 'https://helios-api.team-tool.top' : '')).replace(/\/$/, '')

export function clearLegacyAuth() {
  localStorage.removeItem('auth_token')
}

export async function ssoRequest<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseURL}/api/sso${path}`, {
    method: data === undefined ? 'GET' : 'POST',
    credentials: 'include',
    headers: data === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': await getCSRFToken() },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    signal: AbortSignal.timeout(15000),
  })
  const result = await response.json()
  if (!response.ok || result.code !== 200)
    throw new Error(result.message || '请求失败，请重试')
  return result.data as T
}

export function sessionInfo(): Promise<SessionInfo> {
  if (!bootstrap) {
    clearLegacyAuth()
    bootstrap = ssoRequest<SessionInfo>('/session')
      .then((data) => {
        csrfToken = data.csrf_token
        return data
      })
      .finally(() => { bootstrap = null })
  }
  return bootstrap
}

export async function getCSRFToken(): Promise<string> {
  if (!csrfToken)
    await sessionInfo()
  return csrfToken
}

export function safeReturnPath(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    && !/[\\\r\n]/.test(value) && !value.startsWith('/sso/') && value !== '/login'
    ? value
    : '/dashboard'
}
