<script setup lang="ts">
import { ArrowRight, Fingerprint, FolderOpen, ShieldCheck, UserRound } from 'lucide-vue-next'

defineProps<{ title: string, description: string, wide?: boolean }>()
</script>

<template>
  <div class="auth-shell min-h-svh lg:grid lg:grid-cols-[minmax(380px,0.9fr)_minmax(0,1.1fr)]">
    <aside class="auth-brand hidden flex-col justify-between px-10 py-10 lg:flex xl:px-16">
      <RouterLink to="/login" class="flex w-fit items-center gap-3">
        <img src="/helios-icon.svg" alt="" class="helios-brand-mark size-11"><span class="font-display text-3xl font-semibold tracking-tight">Helios</span><span class="rounded border border-[var(--brand-border)] px-2 py-1 text-[10px] tracking-wider">AUTH</span>
      </RouterLink>
      <div class="py-16">
        <p class="mb-5 text-xs tracking-widest text-[var(--brand-caption)]">
          团队身份与访问管理
        </p>
        <h2 class="text-4xl font-semibold leading-[1.45] xl:text-[44px]">
          一个身份，<br>连接每一个项目。
        </h2>
        <p class="mt-5 max-w-sm text-sm leading-7 text-[var(--brand-caption)]">
          把账户、角色与应用访问集中在一起。<br>让每一次授权都有清晰的归属。
        </p>
        <div class="access-map mt-10 max-w-md rounded-2xl border border-[var(--brand-border)] p-6">
          <div class="flex items-center gap-3">
            <div class="flex size-11 items-center justify-center rounded-xl bg-card">
              <Fingerprint class="size-6" />
            </div><div>
              <p class="text-sm font-medium">
                团队账户
              </p><p class="mt-1 text-xs text-[var(--brand-caption)]">
                统一身份入口
              </p>
            </div><UserRound class="ml-auto size-4 text-[var(--brand-caption)]" />
          </div>
          <div class="ml-5 flex h-12 items-center border-l border-[var(--brand-border)] pl-6">
            <span class="flex items-center gap-2 rounded-full border border-[var(--brand-border)] px-3 py-1 text-xs text-[var(--brand-caption)]"><ShieldCheck class="size-3.5" />角色与访问权限</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div v-for="label in ['业务项目', '团队应用']" :key="label" class="flex items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-card p-3 text-xs">
              <FolderOpen class="size-4 text-[var(--brand-caption)]" />{{ label }}<ArrowRight class="ml-auto size-3" />
            </div>
          </div>
        </div>
      </div>
      <p class="text-xs text-[var(--brand-caption)]">
        HELIOS / IDENTITY & ACCESS
      </p>
    </aside>
    <div class="flex min-h-svh min-w-0 flex-col">
      <header class="flex items-center gap-2 px-6 py-6 lg:hidden">
        <img src="/helios-icon.svg" alt="" class="helios-brand-mark size-8"><span class="font-display text-xl font-semibold">Helios</span><span class="ml-auto text-xs text-muted-foreground">身份与访问管理</span>
      </header>
      <main class="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div class="w-full" :class="wide ? 'max-w-lg' : 'max-w-sm'">
          <div class="mb-8">
            <p class="section-kicker mb-3">
              HELIOS ACCOUNT
            </p><h1 class="font-display text-3xl font-semibold tracking-tight">
              {{ title }}
            </h1><p class="mt-3 text-sm leading-6 text-muted-foreground">
              {{ description }}
            </p>
          </div>
          <slot />
        </div>
      </main>
      <footer class="px-6 py-6 text-center text-xs text-muted-foreground">
        Helios · 团队统一身份入口
      </footer>
    </div>
  </div>
</template>

<style scoped>
.auth-shell {
  background: var(--card);
}
.auth-brand {
  background: var(--brand-ink);
  color: var(--brand-text);
}
.access-map {
  background: color-mix(in srgb, var(--brand-soft) 25%, transparent);
}
</style>
