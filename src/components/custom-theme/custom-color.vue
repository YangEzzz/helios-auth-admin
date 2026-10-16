<script lang="ts" setup>
import { storeToRefs } from 'pinia'

import { THEME_PRIMARY_COLORS } from '@/constants/themes'
import { useThemeStore } from '@/store'

const themeStore = useThemeStore()
const { setTheme } = themeStore
const { theme: t } = storeToRefs(themeStore)

const themeLabels = { helios: '黑白灰', zinc: '石墨', red: '红色', rose: '玫瑰', orange: '橙色', green: '绿色', blue: '蓝色', yellow: '黄色', violet: '紫色' }
</script>

<template>
  <div class="space-y-1.5 pt-6">
    <UiLabel class="text-xs">
      主题色
    </UiLabel>
    <div class="grid grid-cols-2 gap-2 py-1.5">
      <UiButton
        v-for="theme in THEME_PRIMARY_COLORS" :key="theme.theme"
        variant="outline"
        class="justify-center h-8 px-3"
        :class="t === theme.theme ? 'border-foreground border-2' : ''"
        :aria-pressed="t === theme.theme"
        @click="setTheme(theme.theme)"
      >
        <span
          :style="{
            '--theme-primary': theme.primaryColor,
          }"
          class="size-2 rounded-full bg-(--theme-primary)"
        />
        <span class="text-xs">{{ themeLabels[theme.theme] }}</span>
      </UiButton>
    </div>
  </div>
</template>
