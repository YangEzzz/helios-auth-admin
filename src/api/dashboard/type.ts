export interface DashboardStat {
  label: string
  value: string
  trend: string
  tone: string
  emphasis: string
}

export interface ApprovalFeedItem {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  time: string
  operator: string
  occurred_at: string
}

export interface ActivityFeedItem {
  id: string
  action: string
  detail: string
  resource: string
  time: string
  tone: string
  occurred_at: string
}

export interface TrendPoint {
  label: string
  value: number
}

export interface MyProjectItem {
  id: string
  name: string
  project_key: string
  description: string
  role: string
  granted_at: string
  granted_at_text: string
}

export interface AdminDashboardData {
  stats: DashboardStat[]
  approval_feed: ApprovalFeedItem[]
  activity_feed: ActivityFeedItem[]
  project_trend: TrendPoint[]
  system_headline: string
}

export interface UserDashboardData {
  welcome_title: string
  welcome_note: string
  summary: DashboardStat[]
  projects: MyProjectItem[]
  activity_feed: ActivityFeedItem[]
  account_status: string
}

export interface DashboardPayload {
  generated_at: string
  role_mode: 'admin' | 'user'
  admin?: AdminDashboardData
  user?: UserDashboardData
}
