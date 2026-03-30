import request from '@/request'
import type { AuditLogRes, AuditLogQueryReq } from './type'

export function getAuditLogs(params: AuditLogQueryReq) {
  return request.get<any, AuditLogRes>('/api/v1/audit_logs', {
    params,
  })
}
