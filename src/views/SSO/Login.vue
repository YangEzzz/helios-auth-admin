<script setup lang="ts">
import { Eye, EyeOff, ShieldCheck } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ssoRequest } from '@/utils/session'

interface RequestInfo { app_name: string, csrf_token: string, user: { name: string, email: string } | null }
const route = useRoute()
const requestID = typeof route.query.request === 'string' ? route.query.request : ''
const info = ref<RequestInfo | null>(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const email = ref('')
const password = ref('')
const visible = ref(false)
const emailField = ref<{ $el: HTMLInputElement } | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!requestID)
      throw new Error('登录请求已失效，请返回应用重新登录')
    info.value = await ssoRequest<RequestInfo>(`/request?id=${encodeURIComponent(requestID)}`)
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '无法加载登录请求，请重试' }
  finally { loading.value = false }
}

async function continueLogin() {
  const result = await ssoRequest<{ redirect_url: string }>('/continue', { request_id: requestID })
  window.location.assign(result.redirect_url)
}

async function submit() {
  if (busy.value)
    return
  error.value = ''
  if (!info.value?.user && (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email.value) || !password.value)) {
    error.value = '请填写有效的邮箱和密码'
    emailField.value?.$el?.focus()
    return
  }
  busy.value = true
  try {
    if (!info.value?.user) {
      const result = await ssoRequest<{ user: RequestInfo['user'] }>('/login', { request_id: requestID, email: email.value, password: password.value })
      password.value = ''
      if (info.value)
        info.value.user = result.user
    }
    await continueLogin()
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '登录失败，请重试' }
  finally { busy.value = false }
}

async function switchAccount() {
  if (busy.value)
    return
  busy.value = true
  error.value = ''
  try {
    await ssoRequest('/logout', {})
    if (info.value)
      info.value.user = null
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '切换账号失败，请重试' }
  finally { busy.value = false }
}

async function cancel() {
  if (busy.value)
    return
  busy.value = true
  try {
    const result = await ssoRequest<{ redirect_url: string }>('/cancel', { request_id: requestID })
    window.location.assign(result.redirect_url)
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '无法取消，请关闭窗口返回应用' }
  finally { busy.value = false }
}

onMounted(load)
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-background p-6">
    <div class="grid w-full max-w-sm gap-6">
      <div class="flex items-center gap-3">
        <img src="/helios-icon.svg" alt="" class="size-10 rounded-lg">
        <div>
          <p class="font-semibold tracking-tight">
            Helios
          </p><p class="text-xs text-muted-foreground">
            统一账号登录
          </p>
        </div>
      </div>
      <UiCard>
        <UiCardHeader>
          <ShieldCheck class="mb-2 size-7 text-primary" aria-hidden="true" />
          <UiCardTitle class="text-xl">
            {{ info ? `登录 ${info.app_name}` : '准备登录' }}
          </UiCardTitle>
          <UiCardDescription>使用你的 Helios 账号继续访问应用。</UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="grid gap-4">
          <div v-if="loading" class="flex min-h-48 items-center justify-center" role="status">
            <UiSpinner class="size-5" /><span class="sr-only">正在加载登录请求</span>
          </div>
          <form v-else-if="info" class="grid gap-4" novalidate @submit.prevent="submit">
            <div v-if="info.user" class="rounded-lg border bg-muted/40 p-4">
              <p class="font-medium">
                {{ info.user.name }}
              </p>
              <p class="mt-1 break-all text-sm text-muted-foreground">
                {{ info.user.email }}
              </p>
              <UiButton type="button" variant="link" class="mt-2 h-auto cursor-pointer p-0" :disabled="busy" @click="switchAccount">
                切换账号
              </UiButton>
            </div>
            <template v-else>
              <div class="grid gap-2">
                <UiLabel for="sso-email">
                  邮箱
                </UiLabel>
                <UiInput id="sso-email" ref="emailField" v-model="email" type="email" autocomplete="username" placeholder="请输入邮箱" :disabled="busy" :aria-invalid="!!error" aria-describedby="sso-error" />
              </div>
              <div class="grid gap-2">
                <UiLabel for="sso-password">
                  密码
                </UiLabel>
                <div class="relative">
                  <UiInput id="sso-password" v-model="password" :type="visible ? 'text' : 'password'" autocomplete="current-password" class="pr-11" :disabled="busy" :aria-invalid="!!error" aria-describedby="sso-error" />
                  <button type="button" class="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" :aria-label="visible ? '隐藏密码' : '显示密码'" :aria-pressed="visible" @click="visible = !visible">
                    <EyeOff v-if="visible" class="size-4" /><Eye v-else class="size-4" />
                  </button>
                </div>
              </div>
            </template>
            <div id="sso-error" class="min-h-10 text-sm text-destructive" aria-live="polite">
              <p v-if="error" role="alert">
                {{ error }}
              </p>
            </div>
            <UiButton type="submit" class="h-11 w-full cursor-pointer" :disabled="busy" :aria-busy="busy">
              <UiSpinner v-if="busy" class="mr-2 size-4" />{{ info.user ? '继续进入应用' : '登录并进入应用' }}
            </UiButton>
            <UiButton type="button" variant="ghost" class="w-full cursor-pointer" :disabled="busy" @click="cancel">
              取消登录
            </UiButton>
          </form>
          <template v-else>
            <p role="alert" class="text-sm text-destructive">
              {{ error }}
            </p><UiButton variant="outline" class="cursor-pointer" @click="load">
              重新加载
            </UiButton>
          </template>
        </UiCardContent>
      </UiCard>
      <p class="text-xs leading-relaxed text-muted-foreground">
        应用只能获得你的账号资料和对应项目角色。密码仅用于 Helios 账号验证。
      </p>
    </div>
  </main>
</template>
