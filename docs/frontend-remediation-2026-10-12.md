# Helios 前端审查修复记录

日期：2026-10-12。对应 `frontend-code-review-2026-10-12.md` 中的 14 项确认问题。修复已落地于当前工作区，未提交或部署。原审查报告保留修复前证据。

## 逐项处理

| 原编号 | 修复结果                                                                                             | 主要实现                                         |
| ------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1      | 路由 ID 响应式，查询和提交绑定项目上下文，旧响应失效；操作期间阻止离开，未保存设置有放弃确认         | use-project-resources、use-request-scope、Detail |
| 2      | 用户目录遍历所有分页并去重；后续页失败不会作为完整结果展示；用户、审批、添加成员共享目录             | paged-users、fetchUserDirectory                  |
| 3      | 父组件成功后关闭确认框；失败显示错误并允许重试，busy 时阻止重复与关闭                                | confirm-dialog 及调用方                          |
| 4      | 审计查询采用请求序号，同时保护 data/error/loading                                                    | use-latest-query、AuditLogs                      |
| 5      | 集中维护 admin/super_admin、状态标签和操作矩阵；仅 active/locked 有锁定转换，未知状态只读            | lib/accounts、Users、Profile                     |
| 6      | 稳定表格实例，动态分页总数，回调驱动服务端分页，业务行 ID 保持选择；客户端页数和空数据分页显示已修复 | generateVueTable、table-pagination               |
| 7      | 依据 Axios config 识别二进制，下载返回 Blob；移除无调用者的未实现 stream，use-axios 复用唯一客户端   | request、use-axios                               |
| 8      | 修正 Zod API、可能为空的对象、DTO 字段及 erasable enum 等；删除无引用的图表示例链                    | 生产构建已恢复                                   |
| 9      | API 泛型默认 unknown，页面使用 DTO/明确行模型；共享用户、项目查询及错误解析                          | api、composables、lib/errors                     |
| 10     | 列表提供持久错误和重试；SSO 配置读取失败时隐藏新建表单                                               | query-error、use-latest-query、use-sso-clients   |
| 11     | mutation 函数入口校验权限和 busy；成功后清空，失败保留输入与上下文                                   | Users、Approvals、Projects、Detail、SSOClients   |
| 12     | 搜索/图标/表单有可访问名称，分页与关闭统一中文；共享基础组件复用；修正嵌套 main 和详情窄屏溢出       | 共享 UI、业务页、UX-CONTRACT                     |
| 13     | 统一允许声明与箭头函数，自动格式化，lint 零警告门禁与 CI                                             | eslint、package.json、frontend.yml               |
| 14     | 提取项目资源控制器、设置弹窗、SSO 控制器；演示 Tasks 仅开发路由，旧认证入口转向实际登录/注册         | Detail、SSOClients、router                       |

审计 CSV 同时采用文本保护和双引号转义；一次性 SSO 密钥在项目变化/销毁时清空，迟到响应不能恢复旧密钥。用户目录暂以完整分页加载保证正确性：现有接口没有状态/搜索过滤，超大用户规模仍建议后续提供服务端筛选和远程用户选择。

## 验证

- `pnpm check`：lint 零错误、零警告，vue-tsc 通过，9 项回归测试通过。
- `pnpm build`：生产构建通过，生产路由不包含 Tasks 示例。
- premium strict 静态契约审计：0 findings，证据 `premium-audit.json`。
- 本地浏览器使用真实页面组件与内存 API：第 101 个待审批账号可见；锁定失败弹窗保留并重试关闭；普通用户审批按钮禁用；A→B 迟到响应不覆盖 B，保存请求 ID 为 B；未保存设置取消会进入放弃确认。
- 375px：项目设置弹窗宽 343px，位于视口内；详情成员表格在容器内滚动，不撑宽整个页面。
- 同步修正 Nexus 相同表格辅助函数的客户端分页回归，Nexus check 通过。

## 验证边界

浏览器 fixture 仅操作内存测试数据，没有操作真实账号、项目或密钥。未执行真实 SSO 跨应用联调、屏幕阅读器人工测试、电子表格软件打开 CSV 测试或生产部署。自动测试覆盖关键状态与契约，不能替代真实后端集成验收。
