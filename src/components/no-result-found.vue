<script lang='ts' setup>
import { FolderOpenIcon } from 'lucide-vue-next'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
</script>

<template>
  <Empty>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FolderOpenIcon />
      </EmptyMedia>
      <EmptyTitle>没有匹配的结果</EmptyTitle>
      <EmptyDescription>
        请调整搜索条件后重试。
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
