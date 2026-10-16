import type { ContentLayout, Radius, Theme } from '@/constants/themes'

import { defineStore } from 'pinia'

export const useThemeStore = defineStore('system-config', () => {
  const appearanceVersion = ref(1)
  const radius = ref(0.5)
  const setRadius = (newRadius: Radius) => {
    radius.value = newRadius
  }
  const theme = ref<Theme>('helios')
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
  }

  const contentLayout = ref<ContentLayout>('centered')
  const setContentLayout = (newContentLayout: ContentLayout) => {
    contentLayout.value = newContentLayout
  }
  function upgradeAppearance() {
    if (appearanceVersion.value < 2) {
      if (theme.value === 'zinc')
        theme.value = 'helios'
      appearanceVersion.value = 2
    }
  }
  return {
    appearanceVersion,
    upgradeAppearance,
    radius,
    setRadius,

    theme,
    setTheme,

    contentLayout,
    setContentLayout,
  }
}, {
  persist: true,
})
