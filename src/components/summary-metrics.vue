<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ items: { label: string, value: string | number, note?: string, icon?: Component, tone?: string }[], loading?: boolean, unavailable?: boolean }>()
</script>

<template>
  <section class="metric-strip" aria-label="数据概览" :aria-busy="loading">
    <div v-for="item in items" :key="item.label" :data-tone="item.tone || 'info'">
      <p class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        {{ item.label }}<component :is="item.icon" v-if="item.icon" class="detail-text size-4" aria-hidden="true" />
      </p><p class="metric-value mt-3">
        {{ loading || unavailable ? '—' : item.value }}
      </p><p v-if="item.note" class="mt-2 text-xs leading-5 text-muted-foreground">
        {{ item.note }}
      </p>
    </div>
  </section>
</template>
