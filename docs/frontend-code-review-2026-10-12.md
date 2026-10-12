# Helios 前端企业级代码审查

日期：2026-10-12。范围：当前 `helios-auth-admin` 工作区的业务页面、认证/权限入口、请求层、共享组件和工程规范。此次仅审查，没有修改 Helios 源码。Nexus 修复是另一项独立工作，不代表此项目的问题已修复。

## 结论与验证

确认 14 项问题：1 项 P1、11 项 P2、2 项 P3。构建未通过，暂不满足生产交付门禁。已有 Cookie 会话、SSO 校验和敏感密钥掩码设计值得保留；没有发现证据可以认定前端问题绕过了后端授权。

| 检查                                                                           | 结果                                                              |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `pnpm exec eslint . --format json --output-file node_modules/.tmp/review.json` | 163 个错误、130 个警告                                            |
| `pnpm build`                                                                   | 失败，vue-tsc 阶段 26 个类型错误；Vite 构建未执行                 |
| 实际函数的隔离复现                                                             | 日志分页竞态、确认框提前关闭均验证成立                            |
| 后端接口对照                                                                   | 用户列表真实分页，返回 total/total_pages；page_size 最大支持 1000 |

未运行 Helios 浏览器端到端测试、真实账户操作、屏幕阅读器或移动端回归。没有部署或访问生产账户。临时 lint 结果位于忽略目录 node_modules，不是交付文件。

## 确认问题

### 1. [P1] 项目详情固定初始路由 ID，切换项目可能继续操作旧项目

位置：`src/views/Projects/Detail/index.vue:46`、`79`、`110`、`207`、`241`、`260`、`318`；`src/layouts/index.vue` 的无 key RouterView。

`const projectId = route.params.id as string` 只执行一次，数据仅 onMounted 加载。同一路由记录从 `/projects/A` 到 `/projects/B` 会复用组件，URL 变为 B，展示和成员/角色更新仍使用 A。SSOClients 接收的也仍是这个旧 ID。容易让管理员在错误项目上更新成员或权限。

建议：以 computed 读取路由 ID，建立以项目 ID 为 key 的查询和 mutation 上下文；切换前处理未保存表单，返回后拒绝旧响应。验收“同组件路由 A→B”而不只是进入/退出详情页。

### 2. [P2] 用户与审批只查询第一页，本地过滤导致遗漏数据

位置：`src/views/Users/index.vue:30`、`36–48`；`src/views/Approvals/index.vue:23`、`36`；`src/views/Projects/Detail/index.vue:224`。

用户和审批页面只请求 page=1、page_size=100，然后在本地分别过滤 pending_approval。超过 100 个账号时，后续账号永远不进入这些页面，前 100 个用户即使没有待审批，也不能证明全系统没有申请。项目成员添加的可选用户同样只取前 1000 条。

已对照 `helios-auth-service/internal/router/api/v1/user.go:120–151`：接口使用真实分页并返回 total/total_pages。

建议：服务器按状态、搜索条件过滤并分页；展示准确 total。用户选择使用远程搜索或分页加载，不用固定首批作为全量列表。

### 3. [P2] 共享确认框在异步操作成功前关闭

位置：`src/components/confirm-dialog.vue:36–39`；使用者包括项目删除、成员移除和用户锁定。

`handleConfirm` 发出 confirm 后立即关闭。调用者的请求尚未完成，loading 已不能在弹窗内呈现；失败时没有原弹窗的上下文和重试入口。事件也不会等待父级 Promise。

提取实际函数复现：confirm 已发出，但在任何网络结果产生前 `openModel.value` 已是 false。

建议：父组件拥有 open 状态，成功后关闭；错误保留弹窗并显示行内反馈。组件负责 busy/disabled、焦点和关闭约束，不替业务决定操作成功。

### 4. [P2] 审计日志旧响应覆盖新页，loading 也存在竞态

位置：`src/views/AuditLogs/index.vue:29–51`。

page/pageSize 变化及显式刷新均直接发请求，没有取消、请求序号或查询键。第 1 页慢于第 2 页返回后，会显示“第 2 页”却展示第 1 页日志；旧 finally 也可以提前清除 loading。

使用实际 fetchLogs 函数与两个模拟延迟 Promise 复现：`visible page: 2 / displayed data: ['page1']`。

建议：用查询 key 或请求序号保护 data、total、error、loading；筛选/页大小变化重置或夹紧页码，保留可恢复的查询上下文。

### 5. [P2] 用户角色和状态展示没有覆盖真实枚举

位置：`src/views/Users/components/columns.ts` 的 role/status 列；`src/views/Users/index.vue:65`、`75`；`src/views/Profile/index.vue:84–95`。

路由明确接受 admin/super_admin，但用户角色列只有 admin 显示管理员，super_admin 会显示成员。状态列把所有非 active 统一显示锁定，锁定筛选和操作也采用相同二分法；被拒绝的注册账号等状态可能被误导为可解锁。Profile 状态表使用 pending，而审批页面使用 pending_approval，词汇不一致。

建议：集中维护角色/状态枚举、展示标签和允许的操作矩阵；未知值明确只读，不把任何非 active 都当作 locked。服务端仍必须独立校验状态转换。

### 6. [P2] 通用表格服务端分页和选择缺少稳定契约

位置：`src/components/data-table/use-generate-vue-table.ts` 的 useServerPagination、onPaginationChange、pageCount 与 rowSelection。

pageCount 在初始化时取快照；服务端分页 state 读 props，更新回调却只写本地 ref，table.nextPage 等 API 无法驱动实际查询。未配置业务 getRowId，默认行索引会让翻页或重排后的选择对应错误对象。整体 table 配置还以 any 绕过类型。

建议：动态 pageCount、明确服务端分页回调、业务行 ID、manualSorting/manualFiltering 分工；覆盖 total 改变、重排和分页 API 的测试。当前不能据此断言每个使用客户端分页的页面都已经出错。

### 7. [P2] 下载与流请求方法不符合声明的返回类型

位置：`src/request/index.ts:105`、`139–150`、`160–167`。

二进制判断读取 response.request.responseType，不能作为 fetch adapter 的可靠配置入口，应读取 response.config。下载方法声明 Promise<Blob>，但没有明确提取 AxiosResponse.data。stream 判断原生 Response，现有 Axios 拦截链没有转换到该类型的路径。

建议：明确区分业务 JSON 和原始二进制响应，下载返回 Blob；流另建可验证的传输入口，或移除未支持且无使用者的 API。统一 use-axios，避免第二套请求客户端绕开会话策略。

### 8. [P2] 26 个类型错误阻断发布构建

位置：构建日志中以下文件。

- team-switcher 6 个 activeTeam 可能为空错误；team.validator 4 个不匹配当前 Zod API 的 error 参数。
- custom-color 1 个可能为空；use-axios 引用不存在的 utils/env。
- request/types 的 enum 与 erasableSyntaxOnly 冲突。
- Approvals 缺少 BasicPage 必需的 description。
- overview-chart 的 chart 组件、@unovis/vue 缺失，并有回调隐式 any；recent-sales 索引可能为空。
- Dashboard 模板分支将已缩窄的 user 再与 admin 比较。
- MyProjects 有 3 处角色映射可能为空；Project Detail 1 处可能为空、2 处日志 user.avatar 类型缺失。

建议：修正实现和数据类型，不关闭 strict 或通过全局 any 掩盖。build 已包含 vue-tsc，这是正确门禁，应保留并让它在 CI 中执行。

### 9. [P2] 业务页面绕过现有 DTO，重复维护实体与转换

位置：Users、Approvals、Projects、Profile、Project Detail 中的 ref<any>/any[]；`src/api/user/type.ts`、`src/api/project/type.ts`。

项目已有 DTO，但页面再次使用 any 持有实体和映射回调，掩盖了缺少 department/reason/日志 avatar 等真实契约差异。成员、项目、用户和审计展示字段在多处重写，类型错误已体现出这种漂移。

建议：让 API DTO 与显示模型各自明确，使用纯映射函数，catch 使用 unknown 与统一错误解析。共享项目查询、用户查询与日期格式；不要抽成接管所有业务的巨型 CRUD 工具。

### 10. [P2] 加载失败被当作空数据，缺少可恢复的错误状态

位置：`src/views/AuditLogs/index.vue:44–46`；Users、Approvals、MyProjects 的 fetch 函数；SSOClients 的 load/template。

日志失败仅 console.error，用户不能区分无日志与加载失败。其他列表主要依赖瞬时 toast，初次失败后通常仍展示空列表；SSOClients 加载失败仍进入新建表单，使用户可能误以为尚未配置应用。

建议：区分 loading/error/empty/no-results，保留错误与重试入口；旧数据刷新失败显示其更新时间和刷新失败状态。无法读取现有 SSO 配置时不要伪装成确定的空列表。

### 11. [P2] 敏感 mutation 缺少提交前重复与权限检查

位置：`src/views/Users/index.vue:81–102`、`118–132`；Projects 的 handleCreateProject；Project Detail 的成员/角色提交函数。

UI 大多禁用按钮，但函数本身不检查 changingStatus/settingRole/creating 等 busy 状态，也没有集中提交前角色校验。旧弹窗保持打开、角色变化或重复调用时仍可能发起请求。后端授权可以拒绝越权，前端则缺少一致的恢复和防重行为。

建议：函数入口同时检查当前能力和 busy；服务端保留独立校验，非幂等创建考虑幂等键；失败时保留表单，成功才清空。前端防重不是服务端幂等保证。

### 12. [P2] 可访问性与本地化在业务页和共享组件间漂移

位置：Users 搜索和刷新入口、Users columns 图标按钮、Project Detail 表单、共享 table-pagination 与 Sheet 关闭按钮、模板 Tasks/Auth 页面。

部分搜索仅有 placeholder，图标操作只有 tooltip 而没有 accessible name；表格分页和关闭按钮仍使用英语，业务页面直接写中文，语言包无法覆盖。共享表单规范与实际绑定不一致，异常提示未稳定关联字段。需要建立界面语言范围，而不能因产品名称包含多语言就假定所有页面已有完整 i18n。

建议：真实 label 或 aria-label、键盘焦点、字段 error/aria-describedby、统一分页与关闭词汇；使用 canonical shadcn-vue 组件。浏览器验证键盘、375px 和错误恢复，静态检查不能证明颜色对比或屏幕阅读器体验。

### 13. [P3] 格式配置与源码惯例冲突，警告噪声过多

位置：`eslint.config.mjs` 与 Profile、Project Detail 等文件。

lint 163 errors、130 warnings；90 条 func-style、82 条模板缩进、32 条单行模板换行、23 条行末空格、18 条尾逗号。函数声明规则与大量既有代码冲突，生成 UI 整目录忽略又使检查覆盖不透明。

建议：先明确函数与 formatter 约定，再独立执行自动格式化；保留语法、类型和安全检查。建立 max-warnings 门禁，避免大量风格噪声淹没逻辑错误。

### 14. [P3] 详情和仪表盘组件承担过多职责，示例代码未隔离

位置：`src/views/Projects/Detail/index.vue`（775 行）、Dashboard、Tasks 与旧 Auth 路由。

详情同时管理项目设置、成员表格、用户候选、角色模板、审计、多个弹窗及 SSO 子模块。列表请求和错误反馈在多页面重复；旧演示 Tasks CRUD 仅 toast，却仍有生产路由。未使用图表示例甚至因缺失依赖阻断全项目 typecheck。

建议：按项目上下文、成员管理、角色模板、审计、设置表单划分；保留已抽取的 SSOClients，并补其项目变化生命周期。确认示例定位后从生产路由隔离或移除未使用代码，不为死代码安装整套图表依赖。

## 安全验证候选

- 审计 CSV 单元格只转义双引号，未处理以 `= + - @` 等开头的外部文本；建议验证在目标电子表格软件中是否被解释为公式，再实施统一安全文本编码。此次没有用真实文件打开软件验证。
- SSOClients 的一次性密钥只保留于内存且默认掩码，这一点正确；还应验证离开、项目切换及迟到响应不会恢复旧密钥。
- 路由、侧栏、命令菜单的管理员枚举分别维护，存在未来漂移风险；目前没有证据证明已经构成后端授权绕过。

## 修复顺序

1. 先修详情路由上下文、全量/服务端分页和日志竞态。
2. 修确认框失败恢复、角色状态矩阵和防重提交。
3. 修 26 个类型错误、请求/表格契约，打通 lint + typecheck + build。
4. 统一 DTO/错误/日期封装，抽取完整领域组件，隔离演示代码。
5. 浏览器验证权限变更、慢请求、错误重试、键盘与窄屏；对审计导出进行安全验证。
