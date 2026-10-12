import type { ListUserResult, UserInfo } from '@/api/user/type'

/** The current API has no status/search filters; consume every declared page before local filtering. */
export async function collectUsers(load: (page: number) => Promise<ListUserResult>): Promise<UserInfo[]> {
  const users = new Map<string, UserInfo>()
  let page = 1
  let pages = 1
  do {
    const result = await load(page)
    if (result.page !== page)
      throw new Error('用户分页响应异常，请刷新重试')
    result.users.forEach(user => users.set(user.id, user))
    pages = Math.max(1, result.total_pages)
    page++
  } while (page <= pages)
  return [...users.values()]
}
