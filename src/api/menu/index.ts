import { api } from '@/request'
import type { MenuItem, CreateMenuRequest, UpdateMenuRequest, MenuResponse } from './types'

/**
 * 获取当前用户的菜单列表
 * @returns 菜单树数据
 */
export const fetchUserMenus = async () => {
  return api.get<MenuItem[]>({
    url: '/menus/user'
  })
}

/**
 * 获取所有菜单列表(仅管理员)
 * @returns 菜单树数据
 */
export const fetchAllMenus = async () => {
  return api.get<MenuItem[]>({
    url: '/menus/all'
  })
}

/**
 * 创建菜单
 * @param data 菜单数据
 * @returns 创建结果
 */
export const createMenu = async (data: CreateMenuRequest): Promise<MenuResponse> => {
  return api.post<MenuItem>({
    url: '/menus/createMenus',
    data
  })
}

/**
 * 更新菜单
 * @param data 菜单数据
 * @returns 更新结果
 */
export const updateMenu = async (data: UpdateMenuRequest): Promise<MenuResponse> => {
  return api.post<MenuItem>({
    url: `/menus/updateMenus`,
    data
  })
}

/**
 * 删除菜单
 * @param id 菜单ID
 * @returns 删除结果
 */
export const deleteMenu = async (id: number): Promise<MenuResponse> => {
  return api.post({
    url: `/menus/deleteMenus`,
    data: { id }
  })
}

// 重新导出类型
export * from './types'
