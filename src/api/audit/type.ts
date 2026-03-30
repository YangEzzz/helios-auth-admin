export interface AuditUser {
  id: string
  name?: string
  username?: string
  email?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  user?: AuditUser
  action: string
  action_name?: string
  resource: string
  resource_name?: string
  details: string
  details_name?: string
  ip_address: string
  created_at: string
}

export interface AuditLogData {
  logs: AuditLog[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AuditLogQueryReq {
  page?: number
  page_size?: number
  resource?: string
}

export interface AuditLogRes {
  code: number
  message: string
  data: AuditLogData
}
