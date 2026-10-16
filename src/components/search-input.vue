<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'

defineOptions({ inheritAttrs: false })
defineProps<{ label: string, placeholder?: string }>()
const model = defineModel<string>({ required: true })
const field = ref<InstanceType<typeof Input> | null>(null)
function clear() {
  model.value = ''
  field.value?.$el?.focus()
}
</script>

<template>
  <div class="relative">
    <Search aria-hidden="true" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <Input ref="field" v-model="model" type="search" :aria-label="label" :placeholder="placeholder" class="h-10 pl-9 pr-10 [&::-webkit-search-cancel-button]:appearance-none" v-bind="$attrs" />
    <button v-if="model" type="button" :aria-label="`清除${label}`" class="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" @click="clear">
      <X class="size-4" aria-hidden="true" />
    </button>
  </div>
</template>
