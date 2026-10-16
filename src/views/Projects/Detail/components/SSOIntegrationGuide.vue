<script setup lang="ts">
import { BookOpen, Copy } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { createSSOIntegrationGuide } from '@/lib/sso-integration-guide'
import { apiBaseURL } from '@/utils/session'

const props = defineProps<{ projectKey?: string, redirects?: string[], credentialReady?: boolean }>()
const copyFeedback = ref('')
const heliosApiBaseUrl = new URL(apiBaseURL || '/', window.location.origin).href.replace(/\/$/, '')
const guide = computed(() => createSSOIntegrationGuide(
  heliosApiBaseUrl,
  props.projectKey || '<当前项目的项目标识>',
  props.redirects?.[0] || 'https://api.your-project.example/api/v1/auth/sso/callback',
))
async function copyGuide() {
  try {
    await navigator.clipboard.writeText(guide.value.copyText)
    copyFeedback.value = '说明和带注释的代码已复制，不含真实密钥。'
  }
  catch {
    copyFeedback.value = '浏览器未允许复制，请手动选择指南内容复制。'
  }
}
</script>

<template>
  <UiDialog>
    <UiDialogTrigger as-child>
      <UiButton type="button" variant="outline" class="w-fit">
        <BookOpen class="size-4" />开发接入指南
      </UiButton>
    </UiDialogTrigger>
    <UiDialogContent class="flex max-h-[85dvh] flex-col overflow-hidden p-0 sm:max-w-3xl">
      <UiDialogHeader class="shrink-0 border-b p-6 pr-12">
        <UiDialogTitle>让你的项目使用 Helios 登录</UiDialogTitle>
        <UiDialogDescription>Helios 负责确认用户是谁；你的项目负责接收结果，让用户在项目里保持登录。</UiDialogDescription>
      </UiDialogHeader>
      <div class="min-h-0 min-w-0 space-y-6 overflow-x-hidden overflow-y-auto p-6 text-sm leading-relaxed break-words" tabindex="0" aria-label="SSO 接入说明">
        <section class="space-y-2 rounded-lg border bg-muted/40 p-4">
          <h3 class="font-semibold">
            你需要写两个后端接口
          </h3>
          <p>① 开始登录：登录按钮访问这个接口，它把浏览器带到 Helios。</p>
          <p>② 接收登录结果：Helios 登录完成后，浏览器回到这个接口。这就是本页要填写的「SSO 登录回调地址」。</p>
          <p class="text-muted-foreground">
            例如接入 Nexus，这两个接口都写在 Nexus 后端。Helios 已有登录页面，你无需再实现一个 Helios 登录页面。
          </p>
        </section>
        <section class="space-y-3">
          <h3 class="font-semibold">
            先弄清这四个值：谁提供、做什么用
          </h3>
          <p v-if="!credentialReady" class="text-muted-foreground">
            当前项目尚未生成统一凭据。请先保存本页配置，再取得项目密钥。
          </p>
          <dl class="divide-y rounded-lg border px-4">
            <div v-for="item in guide.settings" :key="item.variable" class="space-y-2 py-4">
              <dt class="font-medium">
                {{ item.label }}<code class="mt-1 block text-xs text-muted-foreground">{{ item.variable }}</code>
              </dt>
              <dd class="text-muted-foreground">
                {{ item.source }}
              </dd>
              <dd class="rounded bg-muted/40 p-2 font-mono text-xs break-all">
                {{ item.value }}
              </dd>
            </div>
          </dl>
          <p class="text-xs text-muted-foreground">
            以上是固定配置。下面的随机编号和校验值则每次登录重新生成，不需要你在 Helios 表单里填写。
          </p>
        </section>
        <section v-for="step in guide.steps" :key="step.title" class="space-y-3">
          <h3 class="font-semibold">
            {{ step.title }}
          </h3>
          <p class="text-muted-foreground">
            {{ step.text }}
          </p>
          <details v-if="step.code" class="rounded-lg border">
            <summary class="cursor-pointer rounded-lg px-4 py-3 font-medium focus-visible:outline-2 focus-visible:outline-ring">
              查看带中文注释的后端代码
            </summary>
            <pre class="overflow-x-auto border-t bg-muted/40 p-4 text-xs"><code>{{ step.code }}</code></pre>
          </details>
        </section>
        <section class="space-y-3">
          <h3 class="font-semibold">
            代码中的临时变量分别代表什么？
          </h3>
          <dl class="space-y-4">
            <div v-for="item in guide.temporaryValues" :key="item.variable">
              <dt class="font-mono text-xs font-semibold break-all">
                {{ item.variable }}
              </dt>
              <dd class="mt-1 text-muted-foreground">
                {{ item.meaning }}
              </dd>
              <dd class="mt-1 text-xs text-muted-foreground">
                对应接口字段：{{ item.field }}
              </dd>
            </div>
          </dl>
          <details class="rounded-lg border">
            <summary class="cursor-pointer rounded-lg px-4 py-3 font-medium focus-visible:outline-2 focus-visible:outline-ring">
              为什么请求中还叫 client_id、state？
            </summary>
            <div class="space-y-3 border-t p-4">
              <p class="text-muted-foreground">
                这些是 Helios 接口约定的字段名，发送请求时必须照写。你自己代码里的变量使用有明确含义的名字，按下面的关系传进去即可。
              </p>
              <pre class="overflow-x-auto text-xs"><code>{{ guide.fieldMapping }}</code></pre>
            </div>
          </details>
        </section>
        <section class="space-y-2 rounded-lg border p-4">
          <h3 class="font-semibold">
            本地和线上如何填写？
          </h3>
          <p class="text-muted-foreground">
            {{ guide.environmentNote }}
          </p>
        </section>
      </div>
      <p class="min-h-5 shrink-0 px-4 text-xs text-muted-foreground" role="status">
        {{ copyFeedback }}
      </p>
      <UiDialogFooter class="shrink-0 border-t p-4">
        <UiButton type="button" variant="outline" @click="copyGuide">
          <Copy class="size-4" />复制说明和代码
        </UiButton>
        <UiDialogClose as-child>
          <UiButton type="button">
            关闭指南
          </UiButton>
        </UiDialogClose>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
