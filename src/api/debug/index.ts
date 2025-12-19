import { api } from '@/request'
import type { DebugLogResponse, DebugParams } from '@/api/debug/types.ts'

export const getDebugLog = async (data: DebugParams) => {
  return api.get<DebugLogResponse>({
    url: '/debug/logList',
    params: data
  })
}
