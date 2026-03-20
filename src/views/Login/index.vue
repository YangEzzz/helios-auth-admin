<script setup lang="ts">
import { ref } from 'vue'
import { reqLogin } from '@/api/user'
import { useAuthStore } from '@/store/auth'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    toast.error('请填写完整信息')
    return
  }

  loading.value = true
  try {
    const res = await reqLogin({ email: email.value, password: password.value })
    
    // Axios 请求返回的是 ResponseData 结构
    authStore.loginSuccess(res.data.token, res.data.user) 
    toast.success('登录成功')

    const redirectParams = route.query?.redirect as string
    router.push(redirectParams || '/dashboard')
  } catch(e: any) {
    toast.error(e.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen p-4 min-w-screen bg-background">
    <main class="flex flex-col gap-6 w-full max-w-md">
      <!-- Logo / Brand -->
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
          H
        </div>
        <h1 class="text-2xl font-bold tracking-tight">
          Helios Auth Admin
        </h1>
        <p class="text-muted-foreground text-sm">
          登录您的管理员账户
        </p>
      </div>

      <!-- Card -->
      <UiCard class="w-full shadow-sm">
        <UiCardHeader>
          <UiCardTitle class="text-xl">
            欢迎回来
          </UiCardTitle>
          <UiCardDescription>
            请输入您的邮箱和密码进行登录
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="grid gap-4">
          <div class="grid gap-2">
            <UiLabel for="login-email">邮箱</UiLabel>
            <UiInput
              id="login-email"
              v-model="email"
              type="email"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center justify-between">
              <UiLabel for="login-password">密码</UiLabel>
              <UiButton
                variant="link"
                class="px-0 h-auto text-xs text-muted-foreground"
                @click="router.push('/forgot-password')"
              >
                忘记密码？
              </UiButton>
            </div>
            <UiInput
              id="login-password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <UiButton class="w-full mt-2" :disabled="loading" @click="handleLogin">
            <UiSpinner v-if="loading" class="mr-2 h-4 w-4" />
            {{ loading ? '登录中...' : '登 录' }}
          </UiButton>
        </UiCardContent>
        <UiCardFooter class="justify-center">
          <p class="text-sm text-muted-foreground">
            没有账户？
            <UiButton variant="link" class="px-1 h-auto" @click="router.push('/register')">
              申请注册
            </UiButton>
          </p>
        </UiCardFooter>
      </UiCard>
    </main>
  </div>
</template>
