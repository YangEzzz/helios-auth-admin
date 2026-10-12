import request from '@/request'

export function useAxios() {
  return { axiosInstance: request }
}
