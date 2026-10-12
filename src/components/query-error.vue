<script setup lang="ts">
defineProps<{ message: string }>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <UiAlert variant="destructive" role="alert">
    <UiAlertTitle>加载失败</UiAlertTitle>
    <UiAlertDescription class="flex flex-wrap items-center justify-between gap-3">
      <span>{{ message }}</span><UiButton variant="outline" size="sm" @click="emit('retry')">
        重试
      </UiButton>
    </UiAlertDescription>
  </UiAlert>
</template>
