<script setup lang="ts">
import { ArrowRight, Eye, EyeOff } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { reqLogin } from '@/api/user'
import AuthShell from '@/components/auth-shell.vue'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/auth'
import { safeReturnPath } from '@/utils/session'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const emailError = ref('')
const passwordError = ref('')
const composing = ref(false)
onMounted(() => {
  document.title = '登录 · Helios'
})

async function handleLogin() {
  if (loading.value || composing.value)
    return
  emailError.value = !email.value.trim() ? '请输入邮箱' : !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email.value.trim()) ? '请输入有效的邮箱地址' : ''
  passwordError.value = password.value ? '' : '请输入密码'
  error.value = ''
  if (emailError.value || passwordError.value) {
    document.getElementById(emailError.value ? 'login-email' : 'login-password')?.focus()
    return
  }
  loading.value = true
  try {
    const res = await reqLogin({ email: email.value.trim(), password: password.value })
    authStore.loginSuccess(res.data.token, res.data.user)
    password.value = ''
    toast.success('登录成功')
    await router.push(safeReturnPath(route.query.redirect))
  }
  catch (cause) {
    error.value = errorMessage(cause) || '登录失败，请检查邮箱和密码后重试'
  }
  finally { loading.value = false }
}
</script>

<template>
  <AuthShell title="欢迎回来" description="登录你的 Helios 账户，继续团队工作。">
    <form novalidate class="space-y-5" :aria-busy="loading" @compositionstart="composing = true" @compositionend="composing = false" @submit.prevent="handleLogin">
      <div class="space-y-2">
        <UiLabel for="login-email">
          邮箱
        </UiLabel>
        <UiInput id="login-email" v-model="email" type="email" autocomplete="username" placeholder="name@example.com" class="h-12 bg-background" :aria-invalid="!!emailError" aria-describedby="login-email-error" :disabled="loading" />
        <p id="login-email-error" class="min-h-4 text-xs text-destructive">
          {{ emailError }}
        </p>
      </div>
      <div class="space-y-2">
        <UiLabel for="login-password">
          密码
        </UiLabel>
        <div class="relative">
          <UiInput id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="请输入密码" class="h-12 bg-background pr-12" :aria-invalid="!!passwordError" aria-describedby="login-password-error" :disabled="loading" />
          <button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword" class="absolute right-1.5 top-2 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" :disabled="loading" @click="showPassword = !showPassword">
            <component :is="showPassword ? EyeOff : Eye" class="size-4" aria-hidden="true" />
          </button>
        </div>
        <p id="login-password-error" class="min-h-4 text-xs text-destructive">
          {{ passwordError }}
        </p>
      </div>
      <UiButton type="submit" class="h-12 w-full" :disabled="loading">
        <UiSpinner v-if="loading" class="size-4" />
        <span>登录</span>
        <ArrowRight v-if="!loading" class="size-4" />
      </UiButton>
      <div class="min-h-10 rounded-md text-sm leading-5 text-destructive" role="alert">
        {{ error }}
      </div>
    </form>
    <div class="border-t pt-6 text-center text-sm text-muted-foreground">
      还没有账户？<RouterLink to="/register" class="ml-1 font-medium text-foreground underline-offset-4 hover:underline">
        申请注册
      </RouterLink>
    </div>
  </AuthShell>
</template>
