/**
 * src/api/user/type.ts
 * 用户及认证相关类型定义
 */

// 登录接口请求参数
export interface LoginData {
  email?: string
  password?: string
}

// 登录接口返回的实际数据
export interface LoginResult {
  token: string
  user: UserInfo
}

// 注册接口请求参数
export interface RegisterData {
  name?: string
  email?: string
  department?: string
  reason?: string
  password?: string
  confirmPassword?: string
}

// 用户基础信息
export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  status?: string
  created_at?: string
}

// 用户列表分页返回
export interface ListUserResult {
  users: UserInfo[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 审核动作参数
export interface ApproveUserParams {
  id: string
}
