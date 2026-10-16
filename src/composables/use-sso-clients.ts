import type { ProjectSSOConfig } from '@/api/sso/clients'
import { onScopeDispose, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { toast } from 'vue-sonner'
import { getProjectSSOConfig, rotateProjectSSOSecret, saveProjectSSOConfig } from '@/api/sso/clients'
import { useRequestScope } from '@/composables/use-request-scope'

export function useSSOClients(getProjectId: () => string, canManage: () => boolean) {
  const scope = useRequestScope(() => getProjectId())
  let loadVersion = 0
  const loaded = ref(false)
  const config = ref<ProjectSSOConfig>()
  const loading = ref(false)
  const busy = ref(false)
  const error = ref('')
  const secret = ref('')
  const showSecret = ref(false)
  const confirmRotation = ref(false)
  const form = reactive({ redirects: '', enabled: true })

  async function load() {
    const ticket = scope.capture()
    const version = ++loadVersion
    loaded.value = false
    loading.value = true
    error.value = ''
    try {
      const result = (await getProjectSSOConfig(ticket.context)).data.config
      if (ticket.isCurrent() && version === loadVersion) {
        if (!config.value) {
          form.redirects = result.redirect_uris.join('\n')
          form.enabled = result.enabled
        }
        config.value = result
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

  async function save() {
    const ticket = scope.capture()
    if (!canManage() || !loaded.value || busy.value)
      return
    error.value = ''
    if (!form.redirects.trim()) {
      error.value = '请填写项目后端的 SSO 登录回调地址'
      return
    }
    busy.value = true
    try {
      const result = await saveProjectSSOConfig(ticket.context, {
        enabled: form.enabled,
        redirect_uris: form.redirects.split('\n').map(value => value.trim()).filter(Boolean),
      })
      if (!ticket.isCurrent())
        return
      config.value = result.data.config
      form.redirects = result.data.config.redirect_uris.join('\n')
      if (result.data.client_secret) {
        secret.value = result.data.client_secret
        showSecret.value = false
      }
      toast.success('登录配置已保存')
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
    if (!canManage() || !loaded.value || !config.value?.credential_ready || busy.value)
      return
    busy.value = true
    error.value = ''
    try {
      const result = await rotateProjectSSOSecret(ticket.context)
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
    config.value = undefined
    secret.value = ''
    busy.value = false
    form.redirects = ''
    form.enabled = true
    confirmRotation.value = false
    showSecret.value = false
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

  return { config, loading, busy, error, secret, showSecret, confirmRotation, form, load, save, rotate, copySecret, loaded }
}
