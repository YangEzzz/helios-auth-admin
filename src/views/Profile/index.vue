<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/auth'
import { reqUploadAvatar, reqSaveAvatar, reqUserInfo } from '@/api/user'
import { toast } from 'vue-sonner'
import { 
  User, 
  Mail, 
  Building2, 
  Shield, 
  Clock, 
  Camera, 
  Loader2,
  CheckCircle2,
  Fingerprint
} from 'lucide-vue-next'

const authStore = useAuthStore()
const loading = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const userInfo = ref<any>(null)

// 初始化获取最新用户信息
onMounted(async () => {
  fetchUserInfo()
})

async function fetchUserInfo() {
  loading.value = true
  try {
    const res = await reqUserInfo()
    userInfo.value = res.data
  } catch (e: any) {
    toast.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  if (!file) return

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
  } catch (e: any) {
    toast.error(e.message || '头像更新失败')
  } finally {
    uploading.value = false
    input.value = '' // 清除 input
  }
}

const statusMap: Record<string, { label: string, color: string }> = {
  'active': { label: '正常激活', color: 'bg-green-500' },
  'pending': { label: '等待审批', color: 'bg-yellow-500' },
  'rejected': { label: '未通过', color: 'bg-red-500' },
  'locked': { label: '已锁定', color: 'bg-gray-500' }
}

const roleMap: Record<string, string> = {
  'super_admin': '超级管理员',
  'admin': '系统管理员',
  'user': '普通用户'
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header -->
    <div class="mb-8 flex items-end justify-between">
      <div>
        <h1 class="text-3xl font-black tracking-tight flex items-center gap-3">
          个人资料
          <span class="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">Profile</span>
        </h1>
        <p class="text-muted-foreground mt-1 text-sm">管理您的个人身份信息与账户设置。</p>
      </div>
    </div>

    <div v-if="loading" class="py-20 flex justify-center">
       <Loader2 class="h-10 w-10 animate-spin text-primary/30" />
    </div>

    <div v-else-if="userInfo" class="grid gap-8 md:grid-cols-12">
      <!-- Left: Avatar Card -->
      <div class="md:col-span-4 space-y-6">
        <UiCard class="border-border/40 shadow-sm overflow-hidden bg-muted/5">
          <UiCardContent class="p-8 flex flex-col items-center">
            <div class="relative group">
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleFileChange"
              />
              <div 
                class="h-32 w-32 rounded-full border-4 border-background shadow-xl overflow-hidden cursor-pointer relative transition-transform hover:scale-105 active:scale-95"
                @click="triggerUpload"
              >
                <img 
                  v-if="userInfo.avatar" 
                  :src="userInfo.avatar" 
                  class="h-full w-full object-cover"
                />
                <div v-else class="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-black text-3xl">
                  {{ userInfo.name?.substring(0, 1).toUpperCase() }}
                </div>

                <!-- Overlay on hover -->
                <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera class="h-6 w-6 text-white mb-1" />
                   <span class="text-[8px] text-white font-black uppercase tracking-widest">更换头像</span>
                </div>

                <!-- Loading Spinner Overlay -->
                <div v-if="uploading" class="absolute inset-0 bg-background/80 flex items-center justify-center">
                   <Loader2 class="h-8 w-8 animate-spin text-primary" />
                </div>
              </div>
            </div>

            <h2 class="mt-6 text-xl font-black tracking-tight">{{ userInfo.name }}</h2>
            <div class="flex items-center gap-2 mt-2">
               <div :class="['h-2 w-2 rounded-full', statusMap[userInfo.status]?.color || 'bg-gray-400']"></div>
               <span class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{{ statusMap[userInfo.status]?.label || userInfo.status }}</span>
            </div>
          </UiCardContent>
        </UiCard>

        <!-- Role Info -->
        <UiCard class="border-border/40 shadow-sm border-l-4 border-l-primary/40 bg-primary/5">
           <UiCardContent class="p-6">
              <div class="flex items-center gap-3 mb-2">
                 <Shield class="h-4 w-4 text-primary" />
                 <span class="text-xs font-black uppercase tracking-widest">系统授信角色</span>
              </div>
              <p class="text-lg font-black">{{ roleMap[userInfo.role] || userInfo.role }}</p>
              <p class="text-[10px] text-muted-foreground mt-1 tracking-tighter italic">该角色决定了您在系统内的全局操作权限。</p>
           </UiCardContent>
        </UiCard>
      </div>

      <!-- Right: Detailed Info -->
      <div class="md:col-span-8 space-y-6">
        <UiCard class="border-border/40 shadow-sm overflow-hidden">
          <UiCardHeader class="border-b border-border/40 bg-muted/10">
            <UiCardTitle class="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <User class="h-4 w-4 opacity-40" />
              基础账户信息
            </UiCardTitle>
          </UiCardHeader>
          <UiCardContent class="p-0">
            <div class="divide-y divide-border/40">
               <!-- ID -->
               <div class="p-6 flex items-center justify-between group hover:bg-muted/5 transition-colors">
                  <div class="flex items-center gap-4">
                     <div class="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <Fingerprint class="h-5 w-5 text-muted-foreground/50" />
                     </div>
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">账户唯一标识 (UID)</p>
                        <p class="text-xs font-mono mt-1 select-all">{{ userInfo.id }}</p>
                     </div>
                  </div>
               </div>

               <!-- Name -->
               <div class="p-6 flex items-center justify-between group hover:bg-muted/5 transition-colors">
                  <div class="flex items-center gap-4">
                     <div class="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <User class="h-5 w-5 text-muted-foreground/50" />
                     </div>
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">显示姓名</p>
                        <p class="text-sm font-bold mt-1">{{ userInfo.name }}</p>
                     </div>
                  </div>
               </div>

               <!-- Email -->
               <div class="p-6 flex items-center justify-between group hover:bg-muted/5 transition-colors">
                  <div class="flex items-center gap-4">
                     <div class="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <Mail class="h-5 w-5 text-muted-foreground/50" />
                     </div>
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">电子邮箱</p>
                        <p class="text-sm font-bold mt-1 text-primary">{{ userInfo.email }}</p>
                     </div>
                  </div>
                  <CheckCircle2 class="h-4 w-4 text-green-500 opacity-60" />
               </div>

               <!-- Department -->
               <div class="p-6 flex items-center justify-between group hover:bg-muted/5 transition-colors">
                  <div class="flex items-center gap-4">
                     <div class="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <Building2 class="h-5 w-5 text-muted-foreground/50" />
                     </div>
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">所属部门/团队</p>
                        <p class="text-sm font-bold mt-1">{{ userInfo.department || '未录入' }}</p>
                     </div>
                  </div>
               </div>

               <!-- Created At -->
               <div class="p-6 flex items-center justify-between group hover:bg-muted/5 transition-colors">
                  <div class="flex items-center gap-4">
                     <div class="h-10 w-10 rounded-lg bg-muted/40 flex items-center justify-center">
                        <Clock class="h-5 w-5 text-muted-foreground/50" />
                     </div>
                     <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">注册时间</p>
                        <p class="text-sm font-bold mt-1">{{ new Date(userInfo.created_at).toLocaleString() }}</p>
                     </div>
                  </div>
               </div>
            </div>
          </UiCardContent>
        </UiCard>

        <!-- Security Notice -->
        <div class="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-4">
           <div class="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
              <Shield class="h-4 w-4 text-yellow-500" />
           </div>
           <div>
              <p class="text-xs font-black text-yellow-700 dark:text-yellow-400 uppercase tracking-widest">安全警示</p>
              <p class="text-xs text-muted-foreground mt-1 leading-relaxed">您的账户在项目中的最高权限由系统管理员分配。如需变更姓名或邮箱等敏感真实信息，请提交工单至 OA 系统申诉，在此处仅支持更新头像预览。</p>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>
