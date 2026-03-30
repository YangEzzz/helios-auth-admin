import type { DashboardPayload } from './type'
import type { ResponseData } from '@/request'
import request from '@/request'

export const reqDashboard = () => {
  return request.get<any, ResponseData<DashboardPayload>>('/api/v1/dashboard')
}
