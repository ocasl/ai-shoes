<template>
  <div class="ai-task-example">
    <h3>AI任务示例</h3>
    
    <!-- 进度条 -->
    <div v-if="isProcessing" class="progress-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progress + '%' }"
        ></div>
      </div>
      <p>{{ taskStatus }} - {{ progress }}%</p>
    </div>

    <!-- 操作按钮 -->
    <div class="button-group">
      <button @click="handleSoleFusion" :disabled="isProcessing">
        鞋底换面
      </button>
      <button @click="handleAutoColor" :disabled="isProcessing">
        自动配色
      </button>
      <button @click="handleLineArt" :disabled="isProcessing">
        线稿图
      </button>
      <button @click="handleElementRemove" :disabled="isProcessing">
        元素消除
      </button>
      <button @click="handleHDEnhance" :disabled="isProcessing">
        高清放大
      </button>
    </div>

    <!-- 结果显示 -->
    <div v-if="resultImages.length > 0" class="result-container">
      <h4>生成结果：</h4>
      <div class="image-grid">
        <img 
          v-for="(image, index) in resultImages" 
          :key="index"
          :src="image" 
          :alt="`结果图片 ${index + 1}`"
          class="result-image"
        />
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  executeSoleFusion,
  executeAutoColor,
  executeLineArt,
  executeElementRemove,
  executeHDEnhance
} from '@/utils/aiTaskHelper'

// 响应式数据
const isProcessing = ref(false)
const progress = ref(0)
const taskStatus = ref('')
const resultImages = ref<string[]>([])
const errorMessage = ref('')

// 通用的任务回调函数
const createTaskCallbacks = (taskName: string) => ({
  onProgress: (progressValue: number) => {
    progress.value = progressValue
    taskStatus.value = `${taskName}处理中`
    console.log(`${taskName}进度: ${progressValue}%`)
  },
  onComplete: (images: string[]) => {
    isProcessing.value = false
    progress.value = 100
    taskStatus.value = `${taskName}完成`
    resultImages.value = images
    errorMessage.value = ''
    console.log(`${taskName}完成，获得${images.length}张图片`)
  },
  onError: (error: any) => {
    isProcessing.value = false
    progress.value = 0
    taskStatus.value = ''
    errorMessage.value = `${taskName}失败: ${error.message}`
    console.error(`${taskName}失败:`, error)
  }
})

// 重置状态
const resetState = () => {
  isProcessing.value = true
  progress.value = 0
  taskStatus.value = ''
  resultImages.value = []
  errorMessage.value = ''
}

// 鞋底换面
const handleSoleFusion = () => {
  resetState()
  executeSoleFusion(
    {
      majorId: 850, // 鞋面图ID
      minorId: 852, // 鞋底图ID
      maskStates: 3 // 蒙版状态
    },
    createTaskCallbacks('鞋底换面')
  )
}

// 自动配色
const handleAutoColor = () => {
  resetState()
  executeAutoColor(
    {
      majorId: 850 // 图片ID
    },
    createTaskCallbacks('自动配色')
  )
}

// 线稿图
const handleLineArt = () => {
  resetState()
  executeLineArt(
    {
      imageId: 850 // 图片ID
    },
    createTaskCallbacks('线稿图')
  )
}

// 元素消除
const handleElementRemove = () => {
  resetState()
  executeElementRemove(
    {
      imageId: 850, // 图片ID
      isMask: 1 // 是否使用蒙版
    },
    createTaskCallbacks('元素消除')
  )
}

// 高清放大
const handleHDEnhance = () => {
  resetState()
  executeHDEnhance(
    {
      imageId: 850 // 图片ID
    },
    createTaskCallbacks('高清放大')
  )
}
</script>

<style scoped>
.ai-task-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.progress-container {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 20px 0;
}

.button-group button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button-group button:hover:not(:disabled) {
  background-color: #0056b3;
}

.button-group button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.result-container {
  margin-top: 20px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.result-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
}
</style>