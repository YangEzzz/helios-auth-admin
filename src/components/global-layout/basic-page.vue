<script lang="ts" setup>
import type { LayoutHeaderProps } from './types'

import BasicHeader from './basic-header.vue'

defineProps<LayoutHeaderProps>()
</script>

<template>
  <main>
    <BasicHeader
      :title="title"
      :description="description"
      :sticky="sticky"
    >
      <template #actions>
        <slot name="actions" />
      </template>
    </BasicHeader>

    <main class="pt-0 pb-4">
      <slot />
    </main>
  </main>
</template>
