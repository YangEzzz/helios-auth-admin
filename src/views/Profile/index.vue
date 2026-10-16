<script setup lang="ts">
import type { UserInfo } from '@/api/user/type'
import {
  Building2,
  Camera,
  Clock,
  Fingerprint,
  Loader2,
  Mail,
  Shield,
  User,
} from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { reqSaveAvatar, reqUploadAvatar, reqUserInfo } from '@/api/user'
import { BasicPage } from '@/components/global-layout'
import QueryError from '@/components/query-error.vue'
import { roleLabels as roleMap, statusLabels } from '@/lib/accounts'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/store/auth'

const authStore = useAuthStore()
const loading = ref(false)
const loadError = ref('')
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const userInfo = ref<UserInfo | null>(null)

// 初始化获取最新用户信息
onMounted(async () => {
  fetchUserInfo()
})

async function fetchUserInfo() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await reqUserInfo()
    userInfo.value = res.data
  }
  catch (e: unknown) {
    loadError.value = errorMessage(e)
    toast.error('获取用户信息失败')
  }
  finally {
    loading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  if (uploading.value)
    return
  const input = event.target as HTMLInputElement
  if (!input.files?.length)
    return

  const file = input.files[0]
  if (!file)
    return

  uploading.value = true
  try {
    // 1. 发起上传
    const uploadRes = await reqUploadAvatar(file)
    const newAvatarUrl = uploadRes?.data?.url

    if (!newAvatarUrl) {
      throw new Error('服务器未返回有效的头像地址')
    }

    // 2. 将 URL 保存到用户记录
    await reqSaveAvatar(newAvatarUrl)

    // 3. 更新本地状态
    if (userInfo.value) {
      userInfo.value.avatar = newAvatarUrl
    }

    // 4. 同步更新状态池（如果有的话）
    if (authStore.userInfo) {
      authStore.userInfo.avatar = newAvatarUrl
    }

    toast.success('头像更新成功')
  }
  catch (e: unknown) {
    toast.error(errorMessage(e) || '头像更新失败')
  }
  finally {
    uploading.value = false
    input.value = '' // 清除 input
  }
}
</script>

<template>
  <BasicPage title="个人资料" description="查看账户身份、团队信息与全局访问角色">
    <QueryError v-if="loadError" :message="loadError" class="mb-5" @retry="fetchUserInfo" />
    <div v-if="loading" class="workspace-panel flex min-h-80 items-center justify-center" role="status">
      <Loader2 class="size-6 animate-spin text-primary" />
    </div>
    <div v-else-if="userInfo" class="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <section class="workspace-panel overflow-hidden">
        <div class="profile-cover flex h-28 items-end justify-center">
          <Shield class="mb-5 size-10 text-[var(--brand-caption)]" />
        </div>
        <div class="p-6 text-center">
          <input ref="fileInput" type="file" class="hidden" accept="image/*" aria-label="选择新头像" @change="handleFileChange">
          <button type="button" :disabled="uploading" aria-label="更换头像" class="relative mx-auto -mt-16 flex size-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-muted font-display text-3xl font-semibold text-primary hover:bg-accent" @click="triggerUpload">
            <Loader2 v-if="uploading" class="size-6 animate-spin" /><img v-else-if="userInfo.avatar" :src="userInfo.avatar" alt="当前账户头像" class="h-full w-full object-cover"><span v-else>{{ userInfo.name?.slice(0, 1) }}</span>
          </button>
          <h2 class="mt-5 text-xl font-semibold">
            {{ userInfo.name }}
          </h2><p class="mt-2 break-all text-xs text-muted-foreground">
            {{ userInfo.email }}
          </p><span class="mt-4 inline-block rounded-md bg-primary/10 px-3 py-1 text-xs text-primary">{{ statusLabels[userInfo.status || ''] || userInfo.status }}</span>
          <UiButton variant="outline" class="mt-6 w-full" :disabled="uploading" @click="triggerUpload">
            <Camera class="size-4" />更换头像
          </UiButton>
        </div>
        <div class="border-t bg-muted/30 p-5">
          <p class="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield class="size-4 text-primary" />全局角色
          </p><p class="mt-2 text-sm font-semibold">
            {{ roleMap[userInfo.role] || userInfo.role }}
          </p><p class="mt-2 text-xs leading-6 text-muted-foreground">
            项目角色由对应项目单独分配。
          </p>
        </div>
      </section>
      <section class="workspace-panel overflow-hidden">
        <header class="panel-heading">
          <div><h2>账户信息</h2><p>用于识别你的团队身份</p></div><User class="size-5 text-muted-foreground" />
        </header>
        <dl class="divide-y divide-border px-6">
          <div
            v-for="item in [
              { label: '显示姓名', value: userInfo.name, icon: User },
              { label: '电子邮箱', value: userInfo.email, icon: Mail },
              { label: '所属部门', value: userInfo.department || '未填写', icon: Building2 },
              { label: '账户标识', value: userInfo.id, icon: Fingerprint },
              { label: '注册时间', value: userInfo.created_at ? new Date(userInfo.created_at).toLocaleString('zh-CN') : '未知', icon: Clock },
            ]" :key="item.label" class="flex items-start gap-4 py-5"
          >
            <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <component :is="item.icon" class="size-4" />
            </div><div class="min-w-0">
              <dt class="text-xs text-muted-foreground">
                {{ item.label }}
              </dt><dd class="mt-2 break-all text-sm font-medium">
                {{ item.value }}
              </dd>
            </div>
          </div>
        </dl>
        <footer class="border-t bg-muted/30 px-6 py-4 text-xs leading-6 text-muted-foreground">
          这里支持更新头像。如需变更账户信息或访问权限，请联系管理员。
        </footer>
      </section>
    </div>
  </BasicPage>
</template>

<style scoped>
.profile-cover {
  background: var(--brand-ink);
}
</style>
