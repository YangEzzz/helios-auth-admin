import { api } from '@/request'
import type { PasteItem, CreatePasteRequest, PasteResponse } from './types'

/**
 * 获取所有公开的剪贴板内容
 * @returns 公开的剪贴板内容列表
 */
export const getPublicPastes = async (): Promise<PasteResponse> => {
  return api.get<PasteItem[]>({
    url: '/pastes/public'
  })
}

/**
 * 获取当前用户的所有剪贴板内容
 * @returns 当前用户的剪贴板内容列表
 */
export const getUserPastes = async (): Promise<PasteResponse> => {
  return api.get<PasteItem[]>({
    url: '/pastes/mine'
  })
}

/**
 * 获取指定ID的剪贴板内容详情
 * @param id 剪贴板ID
 * @returns 剪贴板内容详情
 */
export const getPasteById = async (id: number): Promise<PasteResponse> => {
  return api.get<PasteItem>({
    url: `/pastes/detail/${id}`
  })
}

/**
 * 创建新的剪贴板内容
 * @param data 剪贴板内容数据
 * @returns 创建结果
 */
export const createPaste = async (data: CreatePasteRequest): Promise<PasteResponse> => {
  return api.post<PasteItem>({
    url: '/pastes/create',
    data
  })
}

/**
 * 删除指定ID的剪贴板内容
 * @param id 剪贴板ID
 * @returns 删除结果
 */
export const deletePasteById = async (id: number): Promise<PasteResponse> => {
  return api.delete<null>({
    url: `/pastes/remove/${id}`
  })
}
