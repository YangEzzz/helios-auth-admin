<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { reqRegister, reqUploadAvatar } from '@/api/user'
import { toast } from 'vue-sonner'
import { CheckCircle, Camera, Loader2 } from 'lucide-vue-next'

const router = useRouter()
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
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file) return
  
  if (file.size > 2 * 1024 * 1024) {
    toast.error('头像大小不能超过 2MB')
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
  } catch (e: any) {
    toast.error(e.message || '头像上传失败')
  } finally {
    uploading.value = false
  }
}
const loading = ref(false)
const submitted = ref(false)

async function handleRegister() {
  if (!form.value.name || !form.value.email || !form.value.password) {
    toast.error('请填写必要信息')
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    toast.error('两次输入的密码不一致')
    return
  }
  
  loading.value = true
  try {
    await reqRegister(form.value)
    submitted.value = true
    toast.success('申请提交成功')
  } catch (e: any) {
    toast.error(e.message || '申请提交失败')
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
          申请管理后台账户
        </p>
      </div>

      <!-- 提交成功状态 -->
      <UiCard v-if="submitted" class="w-full shadow-sm">
        <UiCardContent class="flex flex-col items-center gap-4 py-8">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
            <CheckCircle class="h-8 w-8" />
          </div>
          <div class="text-center">
            <h2 class="text-lg font-semibold">
              申请已提交
            </h2>
            <p class="text-sm text-muted-foreground mt-1">
              您的账户申请已提交，管理员审批后将通过邮件通知您。
            </p>
          </div>
          <UiButton variant="outline" class="mt-2" @click="router.push('/login')">
            返回登录
          </UiButton>
        </UiCardContent>
      </UiCard>

      <!-- 注册表单 -->
      <UiCard v-else class="w-full shadow-sm">
        <UiCardHeader>
          <UiCardTitle class="text-xl">
            申请账户
          </UiCardTitle>
          <UiCardDescription>
            填写信息后等待管理员审批，审批通过后您将收到邮件通知
          </UiCardDescription>
        </UiCardHeader>
        <UiCardContent class="grid gap-4 pt-4">
          <!-- 头像上传区域 -->
          <div class="flex flex-col items-center gap-3 mb-2">
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />
            <div
              class="relative h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30 cursor-pointer overflow-hidden group hover:border-primary/50 transition-colors"
              @click="triggerUpload"
            >
              <template v-if="form.avatar">
                <img :src="form.avatar" class="h-full w-full object-cover" />
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera class="h-6 w-6 text-white" />
                </div>
              </template>
              <template v-else-if="uploading">
                 <Loader2 class="h-8 w-8 animate-spin text-primary/50" />
              </template>
              <template v-else>
                <div class="flex flex-col items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Camera class="h-8 w-8" />
                  <span class="text-[10px] font-black uppercase tracking-tighter">上传头像</span>
                </div>
              </template>
            </div>
          </div>

          <div class="grid gap-2">
            <UiLabel for="reg-name">姓名</UiLabel>
            <UiInput id="reg-name" v-model="form.name" placeholder="请输入您的姓名" />
          </div>
          <div class="grid gap-2">
            <UiLabel for="reg-email">邮箱</UiLabel>
            <UiInput id="reg-email" v-model="form.email" type="email" placeholder="your@company.com" />
          </div>
          <div class="grid gap-2">
            <UiLabel for="reg-dept">部门</UiLabel>
            <UiInput id="reg-dept" v-model="form.department" placeholder="所在部门" />
          </div>
          <div class="grid gap-2">
            <UiLabel for="reg-reason">申请原因</UiLabel>
            <UiTextarea
              id="reg-reason"
              v-model="form.reason"
              placeholder="简述您申请此账户的用途..."
              rows="3"
            />
          </div>
          <div class="grid gap-2">
            <UiLabel for="reg-password">密码</UiLabel>
            <UiInput id="reg-password" v-model="form.password" type="password" placeholder="设置登录密码" />
          </div>
          <div class="grid gap-2">
            <UiLabel for="reg-confirm">确认密码</UiLabel>
            <UiInput id="reg-confirm" v-model="form.confirmPassword" type="password" placeholder="再次输入密码" />
          </div>
          <UiButton class="w-full mt-2" :disabled="loading" @click="handleRegister">
            <UiSpinner v-if="loading" class="mr-2 h-4 w-4" />
            {{ loading ? '提交中...' : '提交申请' }}
          </UiButton>
        </UiCardContent>
        <UiCardFooter class="justify-center">
          <p class="text-sm text-muted-foreground">
            已有账户？
            <UiButton variant="link" class="px-1 h-auto" @click="router.push('/login')">
              返回登录
            </UiButton>
          </p>
        </UiCardFooter>
      </UiCard>
    </main>
  </div>
</template>
