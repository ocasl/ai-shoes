<template>
  <div class="main-layout">
    <TheHeader v-if="showHeader" />
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TheHeader from './TheHeader.vue'

const showHeader = ref(true)

// 提供给子组件调用的函数，用于控制头部显示/隐藏
const toggleHeader = (visible: boolean) => {
  showHeader.value = visible
}

// 将方法暴露给子组件
defineExpose({
  toggleHeader
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden !important;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
}
</style> 