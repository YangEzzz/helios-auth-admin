<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 定义组件名称解决linter错误
defineOptions({
  name: 'DashboardPage'
})

const greeting = ref('欢迎使用聚合工具')

const currentTime = ref(new Date().toLocaleTimeString())

let timer: number | null = null
let memory = ref(navigator.deviceMemory)
let battery = ref(0)

onMounted(() => {
  // 每秒更新一次时间
  // @ts-ignore
  timer = setInterval(() => {
    currentTime.value = new Date().toLocaleTimeString()
  }, 1000)
  navigator.getBattery().then((b) => {
    battery.value = b.level * 100
  })
})

onBeforeUnmount(() => {
  // 清理定时器
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="py-8 flex flex-col h-[calc(100vh-4rem-1px)]">
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold mb-2">{{ greeting }}</h1>
    </div>
    <!-- 数据统计卡片 -->
    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
      <div
        class="bg-card border rounded-md sm:rounded-lg p-2 sm:p-3 md:p-4 flex items-center shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="text-lg sm:text-2xl md:text-4xl mr-2 sm:mr-3 md:mr-4">📅</div>
        <div class="min-w-0 flex-1">
          <p class="text-xs sm:text-sm text-muted-foreground truncate">当前日期</p>
          <p class="text-sm sm:text-lg md:text-2xl font-bold truncate">{{ new Date().toLocaleDateString() }}</p>
        </div>
      </div>
      <div
        class="bg-card border rounded-md sm:rounded-lg p-2 sm:p-3 md:p-4 flex items-center shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="text-lg sm:text-2xl md:text-4xl mr-2 sm:mr-3 md:mr-4">🕰</div>
        <div class="min-w-0 flex-1">
          <p class="text-xs sm:text-sm text-muted-foreground truncate">当前时间</p>
          <p class="text-sm sm:text-lg md:text-2xl font-bold truncate">{{ currentTime }}</p>
        </div>
      </div>
      <div
        class="bg-card border rounded-md sm:rounded-lg p-2 sm:p-3 md:p-4 flex items-center shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="text-lg sm:text-2xl md:text-4xl mr-2 sm:mr-3 md:mr-4">💾</div>
        <div class="min-w-0 flex-1">
          <p class="text-xs sm:text-sm text-muted-foreground truncate">电脑内存</p>
          <p class="text-sm sm:text-lg md:text-2xl font-bold truncate">{{ memory || '--' }}G</p>
        </div>
      </div>
      <div
        class="bg-card border rounded-md sm:rounded-lg p-2 sm:p-3 md:p-4 flex items-center shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="text-lg sm:text-2xl md:text-4xl mr-2 sm:mr-3 md:mr-4">🔋</div>
        <div class="min-w-0 flex-1">
          <p class="text-xs sm:text-sm text-muted-foreground truncate">电脑电量</p>
          <p class="text-sm sm:text-lg md:text-2xl font-bold truncate">{{ battery || '--' }}%</p>
        </div>
      </div>
    </div>
    <!-- GitHub热门项目 -->
  </div>
</template>
