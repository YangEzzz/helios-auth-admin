<script setup lang="ts">
defineProps<{ open: boolean, busy: boolean, projectKey: string, error?: string }>()
const emit = defineEmits<{ close: [], save: [] }>()
const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })
const url = defineModel<string>('url', { required: true })
</script>

<template>
  <UiDialog :open="open" @update:open="value => { if (!value && !busy) emit('close') }">
    <UiDialogContent class="sm:max-w-[520px]">
      <UiDialogHeader><UiDialogTitle>项目设置</UiDialogTitle><UiDialogDescription>修改项目名称、描述和网址。项目标识创建后不可修改。</UiDialogDescription></UiDialogHeader>
      <form class="grid gap-4" novalidate @submit.prevent="emit('save')">
        <div class="grid gap-2">
          <UiLabel for="settings-project-name">
            项目名称
          </UiLabel><UiInput id="settings-project-name" v-model="name" :disabled="busy" :aria-invalid="Boolean(error)" aria-describedby="settings-project-error" />
        </div>
        <div class="grid gap-2">
          <UiLabel for="settings-project-description">
            项目描述
          </UiLabel><UiTextarea id="settings-project-description" v-model="description" class="min-h-24 resize-none" :disabled="busy" />
        </div>
        <div class="grid gap-2">
          <UiLabel for="settings-project-url">
            项目网址
          </UiLabel><UiInput id="settings-project-url" v-model="url" :disabled="busy" />
        </div>
        <div class="grid gap-2">
          <UiLabel for="settings-project-id">
            项目标识
          </UiLabel><UiInput id="settings-project-id" :model-value="projectKey" disabled />
        </div>
        <p id="settings-project-error" class="min-h-5 text-sm text-destructive" role="alert">
          {{ error }}
        </p>
        <UiDialogFooter>
          <UiButton type="button" variant="outline" :disabled="busy" @click="emit('close')">
            取消
          </UiButton><UiButton type="submit" :disabled="busy">
            {{ busy ? '正在保存…' : '保存设置' }}
          </UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>
