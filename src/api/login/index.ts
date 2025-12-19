import { api } from '@/request'
import type {
  LoginRequestType,
  RegisterRequestType,
  LoginResponseType,
  RegisterResponseType
} from '@/api/login/types.ts'

/**
 * 用户登录
 * @param data 登录信息
 * @returns 登录结果
 */
export const login = async (data: LoginRequestType) => {
  return api.post<LoginResponseType>({
    url: '/user/login',
    data
  })
}

/**
 * 用户注册
 * @param data 注册信息
 * @returns 注册结果
 */
export const register = async (data: RegisterRequestType) => {
  return api.post<RegisterResponseType>({
    url: '/user/register',
    data
  })
}

/**
 * 退出登录
 */
export const logout = async () => {
  try {
    // 调用登出API
    const result = await api.post({
      url: '/user/logout'
    })

    // 导入resetRouter函数并重置路由
    const { resetRouter } = await import('@/router')
    await resetRouter()

    return result
  } catch (error) {
    // 即使API调用失败，也执行路由重置
    const { resetRouter } = await import('@/router')
    await resetRouter()

    // 继续抛出错误，让调用方处理
    throw error
  }
}
