// 剪贴板条目类型
export interface PasteItem {
  id: number
  content: string
  contentType: 'text' | 'image'
  createdAt: string
  creator: {
    id: number
    name: string
    email: string
  }
  isPublic: boolean
}

// 创建剪贴板请求参数
export interface CreatePasteRequest {
  content: string
  isPublic?: boolean
  contentType?: 'text' | 'image'
}

// 剪贴板响应类型
export interface PasteResponse {
  code: number
  message: string
  data: PasteItem | PasteItem[] | null
}
