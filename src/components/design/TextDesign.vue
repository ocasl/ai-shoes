<template>
  <div class="text-design-container">
    <!-- 全屏Loading进度条 -->
    <div v-if="shoeStore.aiTaskStatus === 'running'" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <el-progress 
          :percentage="shoeStore.aiTaskProgress" 
          :stroke-width="8"
          :show-text="false"
          color="#c8ad7f"
          class="loading-progress"
        />
        <div class="loading-percentage">{{ shoeStore.aiTaskProgress }}%</div>
        <div class="loading-text">AI任务执行中</div>
      </div>
    </div>

    <!-- 图片加载中弹窗 -->
    <div v-if="shoeStore.aiTaskStatus === 'loading_result'" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">AI处理完成，图片正在加载中...</div>
        <div class="loading-subtitle">请稍候，马上就好</div>
      </div>
    </div>
    <div class="fusion-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- Step 1 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 1 }">
          <div class="step-header" @click="currentStep = 1">
            <span class="step-title">Step 1</span>
            <span class="step-desc">请描述您的创意</span>
            <el-tooltip content="帮助信息" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          
          <div class="text-input-section">
            <el-input
              v-model="textDescription"
              type="textarea"
              :rows="6"
              placeholder="请输入您想要的鞋款描述..."
              resize="none"
            />
            <div class="text-actions">
              <el-button class="action-btn" @click="textDescription = ''">
                <el-icon><Delete /></el-icon>
                <span>清空</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间工作区域 -->
      <div class="work-area">
        <!-- 使用ImageWorkspace组件展示结果 -->
        <Suspense v-if="isViewingResults && generatedImages.length > 0">
          <template #default>
            <div class="image-workspace-container">
              <ImageWorkspaceComp
                :image-url="generatedImages[0]"
                :is-view-results="true"
                :result-images="generatedImages"
                @exit-results="exitResultsView"
                ref="resultsWorkspaceRef"
              />
            </div>
          </template>
          <template #fallback>
            <div class="loading-state">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>加载中...</p>
            </div>
          </template>
        </Suspense>
        
        <!-- 使用说明 -->
        <div v-else-if="!isGenerating && generatedImages.length === 0" class="instructions-container">
          <div class="instructions-content">
            <h3>使用说明</h3>
            <ol>
              <li>请尽量使用自然语言进行文本描述</li>
              <li>准确选择特别以及想要生成的鞋款品类</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 参数调整 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 2 }">
          <div class="step-header" @click="currentStep = 2">
            <span class="step-title">Step 2</span>
            <span class="step-desc">参数调整</span>
          </div>

          <div class="model-selection">
            <ModelSelector 
              v-model="selectedModel"
              @select="handleModelSelect"
              @load-error="handleModelLoadError"
              :require-login="true"
            />
          </div>
        </div>

        <el-button 
          type="primary" 
          class="generate-btn" 
          @click="handleGenerate"
          :loading="isGenerating"
          :disabled="!canGenerate"
        >
          立即生成
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch, onUnmounted } from 'vue'
import { QuestionFilled, Delete, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import { isUserLoggedIn, lorewst } from '../../api/file'
import type { LorewstRequest } from '../../api/file'
import ModelSelector from '../common/ModelSelector.vue'
import { useRoute } from 'vue-router'
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

// 异步导入ImageWorkspace组件
const ImageWorkspaceComp = defineAsyncComponent(() => 
  import('./ImageWorkspace.vue')
)

// 状态管理
const textDescription = ref('')
const currentStep = ref(1)
const selectedModel = ref(0)
const selectedModelName = ref('')
const isGenerating = ref(false)
const generatedImages = ref<string[]>([])
const isViewingResults = ref(false)
const resultsWorkspaceRef = ref(null)

// 新增：跟踪是否正在处理文字创款任务
const isProcessingTextDesignTask = ref(false)
const route = useRoute()
const fileList = ref([])
const mainImage = ref('')
const mainImageId = ref('')
const previewImageMain = ref('')
const showEditDialogMain = ref(false)
const shoeStore = useShoeStore()

// 计算属性：判断是否可以生成
const canGenerate = computed(() => {
  return textDescription.value.trim().length > 0
})

// 选择模型
const handleModelSelect = (modelId: number, model: any) => {
  console.log('选择的模型:', model)
  selectedModel.value = modelId
  
  // 保存选择的鞋子类型名称
  if (model && model.name) {
    selectedModelName.value = model.name
    console.log('选择的鞋子类型:', selectedModelName.value)
  }
}

// 处理模型加载错误
const handleModelLoadError = (errorMsg: string) => {
  console.error('模型加载错误:', errorMsg)
  ElMessage.error('模型加载失败: ' + errorMsg)
}

// 重置结果相关状态的函数
const resetResultStates = () => {
  console.log('🔄 重置文字创款结果相关状态');
  
  // 重置结果显示状态
  isViewingResults.value = false;
  generatedImages.value = [];
  isProcessingTextDesignTask.value = false;
  
  // 重置store中的图片结果
  shoeStore.setAiTaskImages([]);
  
  console.log('✅ 文字创款结果状态已重置');
};

// 处理生成按钮点击
const handleGenerate = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请填写文本描述')
    return
  }
  
  // 验证用户登录
  if (!isUserLoggedIn()) {
    ElMessage.warning('请先登录后再使用生成功能')
    return
  }
  
  // 在开始生成前重置结果状态，确保不会显示之前的结果
  resetResultStates();
  
  // 停止之前的WebSocket连接
  stopAiTaskWs();
  
  // 显示加载状态 - 只使用ElLoading服务，不再设置isGenerating状态
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成图片，请稍候...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  try {
    isProcessingTextDesignTask.value = true; // 设置为文字创款任务进行中
    
    // 准备请求参数
    const requestData: LorewstRequest = {
      prompt: textDescription.value,
      loreName: selectedModel.value !== 0 ? selectedModelName.value : '元素' // 如果没选择模型则使用"元素"
    }
    
    console.log('生成请求参数:', requestData)
    
    // 调用封装的API函数
    const response = await lorewst(requestData)
    
    // 处理响应数据
    if (response.code === 0 || response.code === 200) {
      const result = response.data
      let viewUrls: string[] = [];
      if (result && result.viewUrls && Array.isArray(result.viewUrls)) {
        viewUrls = result.viewUrls;
      }
      // 新的API格式：直接返回taskId
      if (result && typeof result === 'string') {
        const taskId = result;
        console.log('获得taskId:', taskId);
        shoeStore.setAiTaskInfo({
          taskId: taskId,
          taskType: 'text-design'
        });
        startAiTaskWs(taskId, 'text-design');
        // 不要直接 return，让 watch 监听 WebSocket 结果
      } else if (viewUrls.length > 0) {
        generatedImages.value = viewUrls;
        isViewingResults.value = true;
        if (resultsWorkspaceRef.value) {
          // @ts-ignore - 忽略类型检查，因为我们知道组件有此方法
          resultsWorkspaceRef.value.showResults(generatedImages.value)
        }
        ElMessage.success('图片生成成功')
      } else {
        ElMessage.warning('生成成功但未获得图片URL')
      }
    } else {
      // 处理特定的错误码
      if (response.code === 1013) {
        throw new Error('请先选择需要更改的区域！')
      } else {
        throw new Error(response.msg || '生成图片失败')
      }
    }
  } catch (error: any) {
    console.error('文生图失败:', error)
    ElMessage.error('生成失败: ' + (error.message || '未知错误'))
    isProcessingTextDesignTask.value = false // 重置任务状态
  } finally {
    loadingInstance.close()
    isGenerating.value = false
  }
}

// 监听store中的图片结果
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    // 只有在文字创款任务进行中时才显示结果
    if (isProcessingTextDesignTask.value) {
      generatedImages.value = newImages;
      isViewingResults.value = true;
      if (resultsWorkspaceRef.value) {
        // @ts-ignore - 忽略类型检查，因为我们知道组件有此方法
        resultsWorkspaceRef.value.showResults(generatedImages.value)
      }
      ElMessage.success('文字创款生成成功');
      isProcessingTextDesignTask.value = false // 重置任务状态
    }
  }
}, { deep: true })

// 退出结果查看模式
const exitResultsView = () => {
  isViewingResults.value = false
}

onMounted(() => {
  if (route.query.creativeImg) {
    mainImage.value = route.query.creativeImg as string
    showEditDialogMain.value = true
  }
})

// 组件卸载时停止WebSocket
onUnmounted(() => {
  stopAiTaskWs()
  isProcessingTextDesignTask.value = false // 重置任务状态
})
</script>

<style scoped>
.text-design-container {
  width: 100%;
  height: 100vh;
  background: transparent;
  color: #fff;
  padding: 0;
  position: relative;
  z-index: 1;
  margin-left: 0;
  margin-right: 0;
  overflow: hidden;
}

/* 添加背景容器 */
.text-design-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('@/assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.fusion-content {
  display: flex;
  gap: 0;
  height: 100vh;
  padding-left: 110px;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: 0;
  width: 100vw;
  position: relative;
  z-index: 2;
  overflow: hidden;
  margin: 0;
  box-sizing: border-box;
}

.left-panel {
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  padding: 15px;
  backdrop-filter: blur(10px);
  overflow-y: auto;
  max-height: 100%;
  margin-left: 0;
}

.work-area {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.right-panel {
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  padding: 15px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
}

.step-section {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.active-step {
  box-shadow: 0 0 15px rgba(0, 163, 255, 0.3);
  background: rgba(0, 163, 255, 0.05);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.step-title {
  color: #c8ad7f;
  font-weight: bold;
}

.text-input-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
}

.model-selection {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 20px;
  height: 400px;
  overflow-y: auto;
}

.generating-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  font-size: 36px;
  animation: rotate 1.5s linear infinite;
  margin-bottom: 16px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.results-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.results-header h3 {
  margin: 0;
  color: #00A3FF;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.result-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
}

.result-img {
  width: 100%;
  height: 250px;
  object-fit: contain;
  margin-bottom: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.image-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.generate-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
  border-radius: 20px;
  font-size: 16px;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 2px 8px #c8ad7f33;
  transition: background 0.2s, color 0.2s;
}

.generate-btn:disabled {
  background: linear-gradient(90deg, #e0cfa0 0%, #f5e6c3 100%);
  opacity: 0.7;
  color: #fff;
}

.generate-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%);
  color: #c8ad7f;
}

.text-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.action-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.action-btn .el-icon {
  font-size: 16px;
}

.instructions-container {
  max-width: 600px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions-content {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 15px 20px;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions-content h3 {
  color: #c8ad7f;
  font-size: 18px;
  margin-bottom: 12px;
  text-align: center;
}

.instructions-content ol {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: instruction-counter;
}

.instructions-content li {
  color: #c8ad7f;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 10px;
  padding-left: 28px;
  position: relative;
  counter-increment: instruction-counter;
}

.instructions-content li::before {
  content: counter(instruction-counter);
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 20px;
  background: #c8ad7f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

:deep(.el-textarea__inner) {
  background-color: transparent;
  border: none;
  color: #fff;
  resize: none;
}

:deep(.el-textarea__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.el-button.action-btn) {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
}

:deep(.el-button.action-btn:hover) {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
}

:deep(.el-button.action-btn:focus) {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
}

:deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-slider__bar) {
  background-color: #00A3FF;
}

:deep(.el-slider__button) {
  border-color: #00A3FF;
}

/* 添加新样式 */
.model-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.model-title {
  font-size: 14px;
  color: #fff;
}

.optional-label {
  font-size: 12px;
  color: #00A3FF;
  padding: 2px 6px;
  background: rgba(0, 163, 255, 0.1);
  border-radius: 4px;
}

.image-workspace-container {
  width: 100%;
  height: 600px;
  position: relative;
}

.loading-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  gap: 10px;
}

.loading-icon {
  font-size: 30px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 进度条样式 */
.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.progress-modal {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-content h3 {
  color: #fff;
  margin-bottom: 10px;
  font-size: 20px;
}

.progress-bar {
  margin-bottom: 10px;
  width: 250px;
}

.progress-text {
  color: #fff;
  font-size: 14px;
}

/* 进度条样式同步 */
.progress-modal.gold-card {
  background: rgba(30, 30, 30, 0.98);
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  padding: 30px;
  text-align: center;
  color: #fff;
  max-width: 500px;
  width: 90%;
}
.progress-bar-gold {
  margin-bottom: 8px;
}
.progress-percent {
  color: #00FF00;
  font-weight: bold;
  font-size: 32px;
  margin-bottom: 8px;
}
.percent-sign {
  font-size: 18px;
  margin-left: 2px;
}
.progress-title {
  color: #c8ad7f;
  font-weight: bold;
  font-size: 22px;
  margin-bottom: 10px;
}
.progress-desc {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #c8ad7f;
  font-size: 16px;
  margin-bottom: 8px;
}
.progress-spinner {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 3px solid #c8ad7f;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.progress-tip {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 15px;
}
.progress-tip p {
  margin-bottom: 5px;
}

/* 全屏Loading样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  backdrop-filter: blur(5px);
  pointer-events: auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: #fff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(200, 173, 127, 0.3);
  border-top: 3px solid #c8ad7f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-progress {
  width: 200px;
}

.loading-percentage {
  color: #00d4ff;
  font-size: 18px;
  font-weight: bold;
}

.loading-text {
  color: #c8ad7f;
  font-size: 16px;
  font-weight: 500;
}

</style> 