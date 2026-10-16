export function createSSOIntegrationGuide(heliosApiBaseUrl: string, projectIdentifier: string, projectLoginCallbackUrl: string) {
  const settings = [
    { label: 'Helios 登录服务地址', variable: 'heliosApiBaseUrl', source: '由部署 Helios 的人提供。你的后端向这个服务查询登录结果。下面带入的是当前环境地址，上线时要换成线上 Helios API 地址。', value: heliosApiBaseUrl },
    { label: '当前项目的标识', variable: 'projectIdentifier', source: '直接取当前项目的「项目标识」。Helios 用它判断用户要登录哪个项目，不需要再创建一个应用标识。', value: projectIdentifier },
    { label: '当前项目的登录密钥', variable: 'projectSsoSecret', source: '首次保存登录配置时由 Helios 生成，仅显示一次。交给项目后端保存，用来证明请求来自你的项目；不放进网页代码。遗失后需更新项目密钥，并同步所有环境。', value: '从本页生成的项目密钥处取得；这里不会显示真实密钥' },
    { label: '你的项目接收登录结果的接口', variable: 'projectLoginCallbackUrl', source: '由你编写项目后端接口，并确定浏览器能访问它的完整地址。把这个地址同时填入 Helios 本页和项目后端配置；两处必须完全一致。', value: projectLoginCallbackUrl },
  ]
  const temporaryValues = [
    { variable: 'loginRequestState', field: 'state', meaning: '项目后端每次登录新生成的随机编号。登录前保存；回调时比较，确认收到的是同一次、同一个浏览器发起的登录。不是项目标识。' },
    { variable: 'loginProofSecret', field: 'code_verifier', meaning: '项目后端为这一次登录生成的随机校验原文。只保存在后端，换取用户信息时才发送。不是项目的长期登录密钥。' },
    { variable: 'loginProofHash', field: 'code_challenge', meaning: '对 loginProofSecret 做 SHA-256 后得到的 base64url 字符串。发起登录时先发送它，Helios 随后用它核对校验原文。' },
    { variable: 'authorizationCode', field: '回调 URL 中的 code', meaning: 'Helios 登录成功后发回的一次性授权码。项目后端在 1 分钟内用它换取用户身份；它不是用户 ID，也不是登录会话。' },
    { variable: 'exchangeResult.code', field: '响应 JSON 中的 code', meaning: '换取身份接口的结果状态，200 表示成功。虽然也叫 code，但它与回调 URL 中的授权码完全不同。' },
  ]
  const setupCode = `// 以下都是「你的项目后端」里的变量。
const heliosApiBaseUrl = ${JSON.stringify(heliosApiBaseUrl)}; // Helios API 的地址
const projectIdentifier = ${JSON.stringify(projectIdentifier)}; // 当前项目的标识
const projectLoginCallbackUrl = ${JSON.stringify(projectLoginCallbackUrl)}; // 你的后端回调接口

// 把 Helios 生成的项目密钥配置到后端环境变量 PROJECT_SSO_SECRET。
// PROJECT_SSO_SECRET 是此示例选择的配置名，可按项目自己的配置规范调整。
const projectSsoSecret = process.env.PROJECT_SSO_SECRET;`
  const startCode = `// Node.js 后端核心代码；放进你自己实现的「开始登录」接口。
import { randomBytes, createHash } from 'node:crypto';

const loginRequestState = randomBytes(32).toString('base64url');
const loginProofSecret = randomBytes(32).toString('base64url');
const loginProofHash = createHash('sha256')
  .update(loginProofSecret).digest('base64url');

// 此处必须先写入你的服务端登录事务存储：
// 保存 loginRequestState、loginProofSecret、projectLoginCallbackUrl、
// 当前浏览器的会话 ID 和到期时间（例如 10 分钟）。
// 每次登录单独保存，不能用一个全局变量保存所有用户的值。

const heliosLoginUrl = new URL(heliosApiBaseUrl + '/api/sso/authorize');
heliosLoginUrl.searchParams.set('client_id', projectIdentifier);
heliosLoginUrl.searchParams.set('redirect_uri', projectLoginCallbackUrl);
heliosLoginUrl.searchParams.set('state', loginRequestState);
heliosLoginUrl.searchParams.set('code_challenge', loginProofHash);
heliosLoginUrl.searchParams.set('code_challenge_method', 'S256');

// 你的开始登录接口向浏览器返回 HTTP 302，
// Location 设置为 heliosLoginUrl.toString()。浏览器就会打开 Helios。`
  const callbackCode = `// 放在你的项目后端回调接口中；这是核心片段，不是完整服务。
// 先从回调 URL 取出 state，并在服务端查找对应的登录事务：
// 必须属于当前浏览器、未过期、未被消费。否则立即拒绝。
// error=access_denied 表示取消登录：清理该事务，返回项目登录页。

// 以下变量来自回调 URL 或上一步保存的服务端事务：
// authorizationCode：回调 URL 的 code 查询参数。
// savedLoginProofSecret：服务端事务中保存的 loginProofSecret 原值。
// savedProjectLoginCallbackUrl：服务端事务中保存的回调地址原值。

const identityResponse = await fetch(heliosApiBaseUrl + '/api/sso/exchange', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Basic ' + Buffer.from(
      projectIdentifier + ':' + projectSsoSecret
    ).toString('base64'),
  },
  body: JSON.stringify({
    code: authorizationCode,
    redirect_uri: savedProjectLoginCallbackUrl,
    code_verifier: savedLoginProofSecret,
  }),
  signal: AbortSignal.timeout(15000),
});
const exchangeResult = await identityResponse.json();
if (!identityResponse.ok || exchangeResult.code !== 200)
  throw new Error('登录校验失败，请重新登录');
if (exchangeResult.data.project_id_string !== projectIdentifier)
  throw new Error('登录结果不属于当前项目');

const heliosUserId = exchangeResult.data.user.id; // Helios 中这个用户的唯一 ID
const userRoleInProject = exchangeResult.data.role_in_project; // 这个用户在当前项目中的角色

// 按 userRoleInProject 检查你的项目允许哪些角色登录。
// 原子消费服务端登录事务，防止回调重复处理。
// 用 heliosUserId 查找或建立本地用户，再创建你项目自己的登录会话。
// 写入 HttpOnly、SameSite=Lax Cookie（线上还要 Secure），最后跳转到项目首页。
// 以上步骤及异常处理需接入你自己的后端框架与会话存储。`
  const steps = [
    { title: '第一步：准备四项配置', text: '先按上面的说明取得四个值。示例中的变量名可以改；发给 Helios 的接口字段名不能改。', code: setupCode },
    { title: '第二步：让「登录」按钮打开 Helios', text: '你需要在项目后端实现一个「开始登录」接口，前端登录按钮访问它。后端生成本次登录的随机数据并保存，然后让浏览器跳转到 Helios。', code: startCode },
    { title: '第三步：在你的回调接口中确认是谁登录了', text: '你需要再实现一个接收 GET 请求的回调接口。用户在 Helios 登录后，浏览器会访问它，并带上 state 和 code。先确认是当前浏览器发起的那次登录，再由后端向 Helios 换取用户身份。', code: callbackCode },
    { title: '第四步：让用户在你的项目里保持登录', text: 'Helios 验证身份后，你的项目仍需创建自己的登录会话。业务接口通过这个会话识别用户，退出项目时清除它。接入前还要在 Helios 给用户分配当前项目的角色。无权限、取消、超时、授权码已使用等情况都应返回项目登录页，不创建会话。', code: '' },
  ]
  const environmentNote = '本地与线上各配置自己的 projectLoginCallbackUrl，并把两个完整地址登记在 Helios。回调属于你的项目，不属于 Helios。例如本地 http://localhost:5173/api/v1/auth/sso/callback 只有在前端把 /api 转发给项目后端时才可用；线上可以是 https://api.your-project.example/api/v1/auth/sso/callback。路径是示例，由你实现。代码不会自动创建这些接口。'
  const fieldMapping = 'client_id ← projectIdentifier（当前项目标识）\nredirect_uri ← projectLoginCallbackUrl（项目后端的回调地址）\nstate ← loginRequestState（本次登录随机编号）\ncode_challenge ← loginProofHash（校验原文的摘要）\ncode_verifier ← loginProofSecret（本次登录校验原文）\nHTTP Basic 用户名 ← projectIdentifier；密码 ← projectSsoSecret'
  const copyText = `# Helios SSO：你的项目要做什么\nHelios 负责验证用户身份；你的项目负责接收结果、检查项目角色并创建自己的登录会话。\n\n## 四项固定配置\n${settings.map(item => `${item.label}（${item.variable}）\n来源和用途：${item.source}\n当前示例：${item.value}`).join('\n\n')}\n\n## 每次登录临时生成或收到的值\n${temporaryValues.map(item => `${item.variable} → ${item.field}\n${item.meaning}`).join('\n\n')}\n\n## 变量与接口字段的对应关系\n${fieldMapping}\n\n${steps.map(step => `${step.title}\n${step.text}\n${step.code ? `\n\`\`\`javascript\n${step.code}\n\`\`\`` : ''}`).join('\n\n')}\n\n## 本地与线上\n${environmentNote}`
  return { settings, temporaryValues, steps, fieldMapping, environmentNote, copyText }
}
