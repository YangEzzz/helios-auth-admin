import type { ListUserResult, LoginData, LoginResult, RegisterData, RegisterResult, UserInfo } from './type'
import type { ResponseData } from '@/request'
/**
 * src/api/user/index.ts
 * 用户及认证相关接口封装 (Axios 版)
 */
import request from '@/request'

const API = {
  LOGIN_URL: '/api/login',
  REGISTER_URL: '/api/register',
  USER_INFO_URL: '/api/v1/me',
  LOGOUT_URL: '/api/logout',
  USER_LIST_URL: '/api/v1/users/list',
  APPROVE_USER_URL: '/api/v1/approve_user',
  REJECT_USER_URL: '/api/v1/reject_user',
  LOCK_USER_URL: '/api/v1/lock_user',
  UNLOCK_USER_URL: '/api/v1/unlock_user',
  SET_ROLE_URL: '/api/v1/set_user_role',
  UPLOAD_AVATAR_URL: '/api/v1/upload/avatar',
  UPDATE_AVATAR_URL: '/api/v1/avatar',
} as const

// 登录
export const reqLogin = (data: LoginData) => {
  return request.post<any, ResponseData<LoginResult>>(API.LOGIN_URL, data)
}

// 注册
export const reqRegister = (data: RegisterData) => {
  return request.post<any, ResponseData<RegisterResult>>(API.REGISTER_URL, data)
}

// 获取当前用户信息
export const reqUserInfo = () => {
  return request.get<any, ResponseData<UserInfo>>(API.USER_INFO_URL)
}

// 退出登录
export const reqLogout = () => {
  return request.post<any, ResponseData<Record<string, never>>>(API.LOGOUT_URL)
}

// 获取用户列表 (带分页)
export const reqUserList = (params: { page: number, page_size: number }) => {
  return request.get<any, ResponseData<ListUserResult>>(API.USER_LIST_URL, { params })
}

// 审批用户通过
export const reqApproveUser = (id: string) => {
  return request.post<any, ResponseData<Record<string, never>>>(API.APPROVE_USER_URL, { id })
}

// 拒绝注册申请
export const reqRejectUser = (id: string) => {
  return request.post<any, ResponseData<Record<string, never>>>(API.REJECT_USER_URL, { id })
}

// 锁定已注册用户
export const reqLockUser = (id: string) => {
  return request.post<any, ResponseData<Record<string, never>>>(API.LOCK_USER_URL, { id })
}

// 解锁已注册用户
export const reqUnlockUser = (id: string) => {
  return request.post<any, ResponseData<Record<string, never>>>(API.UNLOCK_USER_URL, { id })
}

/**
 * 更新用户全局角色
 */
export const reqSetUserRole = (data: { target_user_id: string, new_role: string }) => {
  return request.post<any, ResponseData<Record<string, never>>>(API.SET_ROLE_URL, data)
}

/**
 * 上传头像接口
 * @param file 图片文件
 * @returns 返回上传后的 URL
 */
export const reqUploadAvatar = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<any, ResponseData<{ url: string }>>(API.UPLOAD_AVATAR_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 保存头像 URL 到数据库
 */
export const reqSaveAvatar = (avatar: string) => {
  return request.post<any, ResponseData<{ avatar: string }>>(API.UPDATE_AVATAR_URL, { avatar })
}
