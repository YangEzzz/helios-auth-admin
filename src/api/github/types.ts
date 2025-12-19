// GitHub热门项目
export interface GithubTrendingItem {
  id: string | number // unique
  title: string
  url: string
  extra: {
    desc?: string
    date?: number | string
    star?: false | string
    codeLang?: string
    codeColor?: string
    fork?: string
    todayStar?: string
  }
}

// GitHub热门项目响应
export interface GithubTrendingResponse {
  code: number
  message: string
  data: GithubTrendingItem[]
}

export enum GithubSince {
  TODAY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}
