import type { AuditLogQueryReq, AuditLogRes } from './type'
import request from '@/request'

export function getAuditLogs(params: AuditLogQueryReq) {
  return request.get<unknown, AuditLogRes>('/api/v1/audit_logs', {
    params,
  })
}
