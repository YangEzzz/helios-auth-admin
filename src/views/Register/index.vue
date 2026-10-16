<script setup lang="ts">
import { Camera, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { reqRegister, reqUploadAvatar } from '@/api/user'
import AuthShell from '@/components/auth-shell.vue'
import { errorMessage } from '@/lib/errors'

const showPassword = ref(false)
const composing = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const submitError = ref('')
onMounted(() => {
  document.title = '申请账户 · Helios'
})
const form = ref({
  name: '',
  email: '',
  department: '',
  reason: '',
  password: '',
  confirmPassword: '',
  avatar: '',
})
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length)
    return

  const file = input.files[0]
  if (!file)
    return

  if (file.size > 10 * 1024 * 1024) {
    toast.error('头像大小不能超过 10MB')
    return
  }

  uploading.value = true
  try {
    const res = await reqUploadAvatar(file)
    const newAvatarUrl = res.data?.url
    if (!newAvatarUrl) {
      throw new Error('上传返回数据异常')
    }
    form.value.avatar = newAvatarUrl
    toast.success('头像上传成功')
  }
  catch (e: unknown) {
    toast.error(errorMessage(e) || '头像上传失败')
  }
  finally {
    uploading.value = false
  }
}
const loading = ref(false)
const submitted = ref(false)

async function handleRegister() {
  if (loading.value || uploading.value || composing.value)
    return
  fieldErrors.value = {}
  submitError.value = ''
  if (!form.value.name.trim())
    fieldErrors.value['reg-name'] = '请输入姓名'
  if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(form.value.email.trim()))
    fieldErrors.value['reg-email'] = '请输入有效的邮箱地址'
  if (!form.value.password)
    fieldErrors.value['reg-password'] = '请设置登录密码'
  if (!form.value.confirmPassword || form.value.password !== form.value.confirmPassword)
    fieldErrors.value['reg-confirm'] = '请确认两次输入的密码一致'
  const firstError = Object.keys(fieldErrors.value)[0]
  if (firstError) {
    document.getElementById(firstError)?.focus()
    return
  }

  loading.value = true
  try {
    await reqRegister(form.value)
    submitted.value = true
    toast.success('申请提交成功')
  }
  catch (e: unknown) {
    submitError.value = errorMessage(e) || '申请提交失败，请重试'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell :title="submitted ? '申请已提交' : '加入团队工作空间'" :description="submitted ? '你的账户申请已进入审批队列。' : '填写账户信息，管理员审批通过后即可登录。'" wide>
    <div v-if="submitted" class="rounded-xl border bg-muted/40 p-8 text-center">
      <CheckCircle class="mx-auto mb-5 size-12 text-primary" />
      <p class="text-sm leading-6 text-muted-foreground">
        等待管理员审批后，使用你的邮箱和密码登录。
      </p>
      <UiButton as-child class="mt-6">
        <RouterLink to="/login">
          返回登录
        </RouterLink>
      </UiButton>
    </div>
    <form v-else novalidate class="space-y-5" :aria-busy="loading" @compositionstart="composing = true" @compositionend="composing = false" @submit.prevent="handleRegister">
      <div class="mb-6 flex items-center gap-4 rounded-xl border border-dashed bg-muted/30 p-4">
        <input ref="fileInput" type="file" class="hidden" accept="image/*" aria-label="选择头像文件" @change="handleFileChange">
        <button type="button" aria-label="上传或更换头像" :disabled="uploading || loading" class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground hover:bg-accent" @click="triggerUpload">
          <Loader2 v-if="uploading" class="size-5 animate-spin" /><img v-else-if="form.avatar" :src="form.avatar" alt="账户头像" class="h-full w-full object-cover"><Camera v-else class="size-5" />
        </button>
        <div>
          <p class="text-sm font-medium">
            添加头像 <span class="text-xs font-normal text-muted-foreground">可选</span>
          </p><p class="mt-1 text-xs text-muted-foreground">
            图片大小不超过 10 MB
          </p>
        </div>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <UiLabel for="reg-name">
            姓名 <span class="text-destructive">*</span>
          </UiLabel><UiInput id="reg-name" v-model="form.name" autocomplete="name" placeholder="你的姓名" class="h-11" :aria-invalid="!!fieldErrors['reg-name']" aria-describedby="reg-name-error" /><p id="reg-name-error" class="text-xs text-destructive">
            {{ fieldErrors['reg-name'] }}
          </p>
        </div>
        <div class="space-y-2">
          <UiLabel for="reg-dept">
            部门
          </UiLabel><UiInput id="reg-dept" v-model="form.department" autocomplete="organization" placeholder="所在部门或团队" class="h-11" />
        </div>
      </div>
      <div class="space-y-2">
        <UiLabel for="reg-email">
          邮箱 <span class="text-destructive">*</span>
        </UiLabel><UiInput id="reg-email" v-model="form.email" type="email" autocomplete="username" placeholder="name@example.com" class="h-11" :aria-invalid="!!fieldErrors['reg-email']" aria-describedby="reg-email-error" /><p id="reg-email-error" class="text-xs text-destructive">
          {{ fieldErrors['reg-email'] }}
        </p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <UiLabel for="reg-password">
            密码 <span class="text-destructive">*</span>
          </UiLabel><div class="relative">
            <UiInput id="reg-password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="设置登录密码" class="h-11 pr-10" :aria-invalid="!!fieldErrors['reg-password']" aria-describedby="reg-password-error" /><button type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword" class="absolute right-1 top-1.5 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" @click="showPassword = !showPassword">
              <component :is="showPassword ? EyeOff : Eye" class="size-4" />
            </button>
          </div><p id="reg-password-error" class="text-xs text-destructive">
            {{ fieldErrors['reg-password'] }}
          </p>
        </div>
        <div class="space-y-2">
          <UiLabel for="reg-confirm">
            确认密码 <span class="text-destructive">*</span>
          </UiLabel><UiInput id="reg-confirm" v-model="form.confirmPassword" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="再次输入密码" class="h-11" :aria-invalid="!!fieldErrors['reg-confirm']" aria-describedby="reg-confirm-error" /><p id="reg-confirm-error" class="text-xs text-destructive">
            {{ fieldErrors['reg-confirm'] }}
          </p>
        </div>
      </div>
      <div class="space-y-2">
        <UiLabel for="reg-reason">
          申请原因
        </UiLabel><UiTextarea id="reg-reason" v-model="form.reason" placeholder="你希望访问哪些项目？" rows="3" />
      </div>
      <p v-if="submitError" role="alert" class="text-sm text-destructive">
        {{ submitError }}
      </p>
      <UiButton type="submit" class="h-12 w-full" :disabled="loading || uploading">
        <UiSpinner v-if="loading" class="size-4" />提交申请
      </UiButton>
      <p class="border-t pt-5 text-center text-sm text-muted-foreground">
        已有账户？<RouterLink to="/login" class="ml-1 font-medium text-primary hover:underline">
          返回登录
        </RouterLink>
      </p>
    </form>
  </AuthShell>
</template>
