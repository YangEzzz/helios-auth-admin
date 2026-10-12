<script lang='ts' setup>
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  isLoading?: boolean
  disabled?: boolean
  cancelButtonText?: string
  confirmButtonText?: string
  destructive?: boolean
  error?: string
}

const {
  isLoading = false,
  disabled = false,
  destructive = false,
  error = '',
  cancelButtonText = '取消',
  confirmButtonText = '确认',
} = defineProps<ConfirmDialogProps>()

const emits = defineEmits<{
  (e: 'confirm'): void
}>()

const openModel = defineModel<boolean>('open', {
  default: false,
})

function handleConfirm() {
  if (!isLoading && !disabled)
    emits('confirm')
}
</script>

<template>
  <AlertDialog :open="openModel" @update:open="value => { if (!isLoading) openModel = value }">
    <AlertDialogContent>
      <AlertDialogHeader class="text-start">
        <AlertDialogTitle>
          <slot name="title" />
        </AlertDialogTitle>
        <AlertDialogDescription as-child>
          <slot name="description" />
        </AlertDialogDescription>
      </AlertDialogHeader>

      <slot />
      <p v-if="error" class="text-sm text-destructive" role="alert">
        {{ error }}
      </p>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isLoading" @click="openModel = false">
          {{ cancelButtonText }}
        </AlertDialogCancel>

        <UiButton
          :variant="destructive ? 'destructive' : 'default'"
          :disabled="disabled || isLoading"
          @click="handleConfirm"
        >
          {{ confirmButtonText }}
        </UiButton>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
