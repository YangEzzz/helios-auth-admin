import type { SSOClient } from '@/api/sso/clients'
import { onScopeDispose, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { toast } from 'vue-sonner'
import { listSSOClients, rotateSSOClientSecret, saveSSOClient } from '@/api/sso/clients'
import { useRequestScope } from '@/composables/use-request-scope'

type Client = SSOClient
export function useSSOClients(getProjectId: () => string, canManage: () => boolean) {
  const scope = useRequestScope(() => getProjectId())
  let loadVersion = 0
  const loaded = ref(false)
  const clients = ref<Client[]>([])
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const secret = ref('')
  const showSecret = ref(false)
  const editing = ref(false)
  const confirmRotation = ref(false)
  const form = reactive({ client_id: '', name: '', redirects: '', enabled: true })

  async function load() {
    const ticket = scope.capture()
    const version = ++loadVersion
    loaded.value = false
    loading.value = true
    error.value = ''
    try {
      const result = (await listSSOClients(ticket.context)).data.clients
      if (ticket.isCurrent() && version === loadVersion) {
        clients.value = result
        loaded.value = true
      }
    }
    catch (cause) {
      if (ticket.isCurrent() && version === loadVersion)
        error.value = cause instanceof Error ? cause.message : '无法加载接入配置，请重试'
    }
    finally {
      if (ticket.isCurrent() && version === loadVersion)
        loading.value = false
    }
  }

  function edit(client?: Client) {
    editing.value = !!client
    form.client_id = client?.client_id || ''
    form.name = client?.name || ''
    form.redirects = client?.redirect_uris.join('\n') || ''
    form.enabled = client?.enabled ?? true
    secret.value = ''
    showSecret.value = false
    error.value = ''
  }

  async function save() {
    const ticket = scope.capture()
    if (!canManage() || !loaded.value || busy.value)
      return
    error.value = ''
    if (!form.client_id.trim() || !form.name.trim() || !form.redirects.trim()) {
      error.value = '请填写应用标识、名称和回调地址'
      return
    }
    busy.value = true
    try {
      const result = await saveSSOClient({
        client_id: form.client_id.trim(),
        project_id: ticket.context,
        name: form.name.trim(),
        enabled: form.enabled,
        redirect_uris: form.redirects.split('\n').map(value => value.trim()).filter(Boolean),
      })
      if (!ticket.isCurrent())
        return
      editing.value = true
      secret.value = result.data.client_secret
      showSecret.value = false
      toast.success('接入配置已保存')
      await load()
    }
    catch (cause) {
      if (ticket.isCurrent())
        error.value = cause instanceof Error ? cause.message : '保存失败，请重试'
    }
    finally {
      if (ticket.isCurrent())
        busy.value = false
    }
  }

  async function rotate() {
    const ticket = scope.capture()
    if (!canManage() || !loaded.value || busy.value)
      return
    busy.value = true
    error.value = ''
    try {
      const result = await rotateSSOClientSecret(form.client_id)
      if (!ticket.isCurrent())
        return
      secret.value = result.data.client_secret
      showSecret.value = false
      confirmRotation.value = false
      toast.success('密钥已更新，请同步更新应用后端配置')
    }
    catch (cause) {
      if (ticket.isCurrent())
        error.value = cause instanceof Error ? cause.message : '更新密钥失败，请重试'
    }
    finally {
      if (ticket.isCurrent())
        busy.value = false
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret.value)
      toast.success('密钥已复制')
    }
    catch { error.value = '无法复制，请显示密钥后手动复制' }
  }

  watch(() => getProjectId(), () => {
    scope.invalidate()
    clients.value = []
    secret.value = ''
    busy.value = false
    edit()
    load()
  }, { immediate: true })
  onScopeDispose(() => {
    secret.value = ''
  })
  function canLeave() {
    if (busy.value) {
      toast.info('请等待接入配置操作完成')
      return false
    }
    return true
  }
  onBeforeRouteLeave(canLeave)
  onBeforeRouteUpdate(canLeave)

  return { clients, loading, busy, error, secret, showSecret, editing, confirmRotation, form, load, edit, save, rotate, copySecret, loaded }
}
