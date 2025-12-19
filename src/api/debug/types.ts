export interface DebugLog {
  id: number
  content: Record<string, any>
  creator: string
  createdAt: string
}

export interface DebugParams {
  page?: number
  pageSize?: number
}

export interface DebugLogResponse {
  data: DebugLog[]
  page: number
  pageSize: number
  total: number
}
