<script lang="ts" setup>
import type { LayoutHeaderProps } from './types'

import { cn } from '@/lib/utils'

defineProps<LayoutHeaderProps>()
</script>

<template>
  <header
    :class="cn(
      'flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between',
      sticky ? 'sticky top-16 z-30 bg-background pt-4' : '',
    )"
  >
    <div class="min-w-0 space-y-2">
      <h1 class="font-display text-2xl font-semibold tracking-tight sm:text-[28px]">
        {{ title }}
      </h1>
      <p v-if="description" class="text-sm leading-6 text-muted-foreground">
        {{ description }}
      </p>
    </div>

    <aside class="flex items-center gap-2 flex-wrap">
      <slot name="actions" />
    </aside>
  </header>
</template>
