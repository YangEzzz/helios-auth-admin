<script setup lang="ts">
import { Copy, Eye, EyeOff, KeyRound } from 'lucide-vue-next'
import { useAdminAccess } from '@/composables/use-admin-access'
import { useSSOClients } from '@/composables/use-sso-clients'
import SSOIntegrationGuide from './SSOIntegrationGuide.vue'

const props = defineProps<{ projectId: string }>()
const { canManage } = useAdminAccess()
const { config, loading, busy, error, secret, showSecret, confirmRotation, form, load, save, rotate, copySecret, loaded } = useSSOClients(() => props.projectId, canManage)
</script>

<template>
  <UiCard class="gap-0 overflow-hidden py-0">
    <UiCardHeader class="border-b bg-muted/25 p-6">
      <UiCardTitle class="flex items-center gap-2">
        <KeyRound class="size-5" />统一登录配置
      </UiCardTitle>
      <UiCardDescription>设置当前项目接收 SSO 登录结果的后端接口，本地与线上共用一份配置。</UiCardDescription>
      <SSOIntegrationGuide :project-key="config?.client_id" :redirects="config?.redirect_uris" :credential-ready="config?.credential_ready" />
    </UiCardHeader>
    <UiCardContent class="grid gap-6 p-6">
      <div v-if="loading" class="flex min-h-16 items-center gap-2" role="status">
        <UiSpinner class="size-4" />正在加载登录配置
      </div>
      <template v-else-if="loaded && config">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-medium break-words">
              {{ config.name }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground break-all">
              项目标识：{{ config.client_id }}
            </p>
          </div>
          <UiBadge variant="secondary">
            {{ config.configured ? (config.mixed_enabled ? '待统一启用状态' : config.enabled ? '已启用' : '已停用') : '尚未配置' }}
          </UiBadge>
        </div>
        <p v-if="config.mixed_enabled" class="text-sm text-muted-foreground" role="status">
          历史登录配置的启用状态不一致。请确认下方开关后保存，统一本地与线上的登录设置。
        </p>
        <form class="grid gap-4" novalidate @submit.prevent="save">
          <div class="grid gap-2">
            <UiLabel for="sso-redirects">
              SSO 登录回调地址
            </UiLabel>
            <UiTextarea id="sso-redirects" v-model="form.redirects" class="min-h-32 resize-y" :disabled="busy || !canManage()" placeholder="https://your-project.example/api/v1/auth/sso/callback" aria-describedby="sso-redirects-help sso-config-error" />
            <p id="sso-redirects-help" class="text-xs leading-relaxed text-muted-foreground">
              填写你项目后端的完整接口地址。Helios 登录成功后，会跳转到这里并附上授权码，由项目后端完成登录。这不是项目首页或 Helios 地址。本地、线上各填一行，必须与项目发起登录时使用的地址一致。
            </p>
          </div>
          <label class="flex cursor-pointer items-center gap-2 text-sm"><input v-model="form.enabled" type="checkbox" class="size-4 accent-primary" :disabled="busy || !canManage()">启用当前项目的统一登录</label>
          <p id="sso-config-error" class="min-h-5 text-sm text-destructive" aria-live="polite">
            {{ error }}
          </p>
          <div class="flex flex-wrap gap-3">
            <UiButton type="submit" :disabled="busy || !canManage()" :aria-busy="busy">
              <UiSpinner v-if="busy" class="mr-2 size-4" />保存登录配置
            </UiButton>
            <UiButton v-if="config.credential_ready" type="button" variant="outline" :disabled="busy || !canManage()" @click="confirmRotation = true">
              更新项目密钥
            </UiButton>
            <UiButton type="button" variant="ghost" :disabled="busy" @click="load">
              刷新配置
            </UiButton>
          </div>
        </form>
      </template>
      <template v-else>
        <p class="text-sm text-destructive" role="alert">
          {{ error }}
        </p>
        <UiButton variant="outline" class="w-fit" @click="load">
          重新加载登录配置
        </UiButton>
      </template>
      <div v-if="secret" class="grid gap-3 rounded-lg border bg-muted/40 p-4">
        <p class="font-medium">
          项目密钥仅在本次显示
        </p>
        <p class="text-sm text-muted-foreground">
          请将项目标识和密钥保存到本地、线上后端的登录配置中。离开页面后无法再次查看密钥。
        </p>
        <div class="flex gap-2">
          <UiInput :model-value="secret" :type="showSecret ? 'text' : 'password'" readonly aria-label="项目密钥" autocomplete="off" />
          <UiButton variant="outline" :aria-label="showSecret ? '隐藏密钥' : '显示密钥'" @click="showSecret = !showSecret">
            <EyeOff v-if="showSecret" class="size-4" /><Eye v-else class="size-4" />
          </UiButton>
          <UiButton variant="outline" aria-label="复制密钥" @click="copySecret">
            <Copy class="size-4" />
          </UiButton>
        </div>
      </div>
    </UiCardContent>
  </UiCard>
  <UiAlertDialog v-model:open="confirmRotation">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>更新 {{ config?.name }} 的项目密钥？</UiAlertDialogTitle>
        <UiAlertDialogDescription>当前项目的所有旧密钥将立即失效，包括本地和线上使用的历史密钥。请将新密钥同步到两处后端，否则用户将无法完成登录。</UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel :disabled="busy">
          取消
        </UiAlertDialogCancel>
        <UiButton :disabled="busy || !canManage()" @click="rotate">
          更新项目密钥
        </UiButton>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
