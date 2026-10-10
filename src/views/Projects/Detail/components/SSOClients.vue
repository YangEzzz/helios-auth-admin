<script setup lang="ts">
import { Copy, Eye, EyeOff, KeyRound } from 'lucide-vue-next'
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { api } from '@/request'

interface Client { client_id: string, name: string, enabled: boolean, redirect_uris: string[] }
const props = defineProps<{ projectId: string }>()
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
  loading.value = true
  error.value = ''
  try {
    clients.value = (await api.get<{ clients: Client[] }>({ url: '/api/v1/sso/clients', params: { project_id: props.projectId } })).data.clients
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '无法加载接入配置，请重试' }
  finally { loading.value = false }
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
  if (busy.value)
    return
  error.value = ''
  if (!form.client_id.trim() || !form.name.trim() || !form.redirects.trim()) {
    error.value = '请填写应用标识、名称和回调地址'
    return
  }
  busy.value = true
  try {
    const result = await api.post<{ client: Client, client_secret: string }>({ url: '/api/v1/sso/clients', data: {
      client_id: form.client_id.trim(),
      project_id: props.projectId,
      name: form.name.trim(),
      enabled: form.enabled,
      redirect_uris: form.redirects.split('\n').map(value => value.trim()).filter(Boolean),
    } })
    editing.value = true
    secret.value = result.data.client_secret
    showSecret.value = false
    toast.success('接入配置已保存')
    await load()
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '保存失败，请重试' }
  finally { busy.value = false }
}

async function rotate() {
  if (busy.value)
    return
  busy.value = true
  error.value = ''
  try {
    const result = await api.post<{ client_secret: string }>({ url: `/api/v1/sso/clients/${encodeURIComponent(form.client_id)}/rotate`, data: {} })
    secret.value = result.data.client_secret
    showSecret.value = false
    confirmRotation.value = false
    toast.success('密钥已更新，请同步更新应用后端配置')
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '更新密钥失败，请重试' }
  finally { busy.value = false }
}

async function copySecret() {
  try {
    await navigator.clipboard.writeText(secret.value)
    toast.success('密钥已复制')
  }
  catch { error.value = '无法复制，请显示密钥后手动复制' }
}

onMounted(load)
</script>

<template>
  <UiCard class="mt-6">
    <UiCardHeader>
      <UiCardTitle class="flex items-center gap-2">
        <KeyRound class="size-5" />统一登录接入
      </UiCardTitle>
      <UiCardDescription>将应用绑定到当前项目；登录时只授予此项目的角色。</UiCardDescription>
    </UiCardHeader>
    <UiCardContent class="grid gap-6">
      <div v-if="loading" class="flex min-h-16 items-center gap-2" role="status">
        <UiSpinner class="size-4" />正在加载接入应用
      </div>
      <div v-else class="grid gap-2">
        <p v-if="!clients.length" class="text-sm text-muted-foreground">
          尚未登记接入应用，可在下方创建。
        </p>
        <div v-for="client in clients" :key="client.client_id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div>
            <p class="font-medium">
              {{ client.name }}
            </p><p class="text-xs text-muted-foreground">
              {{ client.client_id }} · {{ client.enabled ? '已启用' : '已停用' }}
            </p>
          </div>
          <UiButton variant="outline" class="cursor-pointer" :disabled="busy" @click="edit(client)">
            编辑接入配置
          </UiButton>
        </div>
        <UiButton v-if="editing" variant="ghost" class="w-fit cursor-pointer" :disabled="busy" @click="edit()">
          新增接入应用
        </UiButton>
      </div>
      <form class="grid gap-4" novalidate @submit.prevent="save">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <UiLabel for="sso-client-id">
              应用标识
            </UiLabel><UiInput id="sso-client-id" v-model="form.client_id" placeholder="nexus-web" :disabled="busy || editing" aria-describedby="sso-config-error" />
          </div>
          <div class="grid gap-2">
            <UiLabel for="sso-client-name">
              应用名称
            </UiLabel><UiInput id="sso-client-name" v-model="form.name" placeholder="Nexus 多语言工作台" :disabled="busy" />
          </div>
        </div>
        <div class="grid gap-2">
          <UiLabel for="sso-redirects">
            允许的回调地址
          </UiLabel><UiTextarea id="sso-redirects" v-model="form.redirects" class="min-h-24 resize-none" :disabled="busy" placeholder="https://nexus.example.com/api/v1/auth/sso/callback" aria-describedby="sso-redirects-help" /><p id="sso-redirects-help" class="text-xs text-muted-foreground">
            每行一个完整地址，必须精确匹配。正式环境使用 HTTPS。
          </p>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-sm"><input v-model="form.enabled" type="checkbox" class="size-4 accent-primary" :disabled="busy">启用此应用的统一登录</label>
        <p id="sso-config-error" class="min-h-5 text-sm text-destructive" aria-live="polite">
          {{ error }}
        </p>
        <div class="flex flex-wrap gap-3">
          <UiButton type="submit" class="cursor-pointer" :disabled="busy" :aria-busy="busy">
            <UiSpinner v-if="busy" class="mr-2 size-4" />保存接入配置
          </UiButton><UiButton v-if="editing" type="button" variant="outline" class="cursor-pointer" :disabled="busy" @click="confirmRotation = true">
            更新应用密钥
          </UiButton><UiButton type="button" variant="ghost" class="cursor-pointer" :disabled="busy" @click="load">
            刷新列表
          </UiButton>
        </div>
      </form>
      <div v-if="secret" class="grid gap-3 rounded-lg border bg-muted/40 p-4">
        <p class="font-medium">
          应用密钥仅在本次显示
        </p><p class="text-sm text-muted-foreground">
          请保存到应用后端环境变量。离开页面后无法再次查看。
        </p>
        <div class="flex gap-2">
          <UiInput :model-value="secret" :type="showSecret ? 'text' : 'password'" readonly aria-label="应用密钥" autocomplete="off" /><UiButton variant="outline" class="cursor-pointer" :aria-label="showSecret ? '隐藏密钥' : '显示密钥'" @click="showSecret = !showSecret">
            <EyeOff v-if="showSecret" class="size-4" /><Eye v-else class="size-4" />
          </UiButton><UiButton variant="outline" class="cursor-pointer" aria-label="复制密钥" @click="copySecret">
            <Copy class="size-4" />
          </UiButton>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
  <UiAlertDialog v-model:open="confirmRotation">
    <UiAlertDialogContent>
      <UiAlertDialogHeader><UiAlertDialogTitle>更新 {{ form.name }} 的密钥？</UiAlertDialogTitle><UiAlertDialogDescription>旧密钥将立即失效。请将新密钥同步到应用后端，否则用户将无法完成登录。</UiAlertDialogDescription></UiAlertDialogHeader><UiAlertDialogFooter>
        <UiAlertDialogCancel :disabled="busy">
          取消
        </UiAlertDialogCancel><UiButton :disabled="busy" @click="rotate">
          更新密钥
        </UiButton>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
