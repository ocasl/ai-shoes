<template>
  <div class="model-selector">
    <div class="selection-header">
      <slot name="header">选择品类模型进行优化</slot>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon class="error-icon"><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
      <div class="error-actions">
        <el-button size="small" @click="fetchModels" v-if="!loginRequired">重试</el-button>
        <el-button size="small" type="primary" @click="goToLogin" v-if="loginRequired">去登录</el-button>
      </div>
    </div>
    
    <div v-else-if="models.length === 0" class="empty-container">
      <el-icon class="empty-icon"><InfoFilled /></el-icon>
      <span>暂无可用模型</span>
    </div>
    
    <div v-else class="model-list-container">
      <div class="model-list">
        <div 
          v-for="(model, index) in processedModels" 
          :key="index" 
          class="model-item"
          :class="{ 'selected-model': modelValue === model.id }"
          @click="selectModel(model.id)"
        >
          <div class="model-image">
            <img 
              :src="model.image" 
              :alt="model.name" 
              @error="handleImageError"
            />
          </div>
          <span class="model-name">{{ model.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, computed } from 'vue'
import { ElIcon, ElButton, ElMessage } from 'element-plus'
import { Loading, WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import { getAllModels, getAllModelsDirectly, isUserLoggedIn } from '../../api/model'
import { useRouter } from 'vue-router'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  // 是否自动加载模型数据
  autoLoad: {
    type: Boolean,
    default: true
  },
  // 是否需要登录才能使用
  requireLogin: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'select', 'load-success', 'load-error'])

const router = useRouter()
const models = ref<any[]>([])
const loading = ref(true)
const error = ref(false)
const errorMessage = ref('加载失败，请重试')
const defaultImage = ref('/logo2.png')  // 将图片放在 public 目录下
const loginRequired = ref(false)

// 处理API返回的数据格式，转换为组件需要的Model格式
const processedModels = computed(() => {
  if (!models.value || models.value.length === 0) {
    return []
  }
  
  // 处理API返回的特殊格式
  if (Array.isArray(models.value) && typeof models.value[0] === 'object' && !models.value[0].id) {
    return models.value.map((item, index) => {
      const key = Object.keys(item)[0]
      return {
        id: index + 1,
        name: key,
        image: item[key]
      }
    })
  }
  
  return models.value
})

// 选择模型
const selectModel = (modelId: number) => {
  emit('update:modelValue', modelId)
  const selectedModel = processedModels.value.find((m) => m.id === modelId)
  emit('select', modelId, selectedModel)
}

// 处理图片加载失败
const handleImageError = (e: Event) => {
  if (e.target) {
    (e.target as HTMLImageElement).src = defaultImage.value
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 获取模型数据
const fetchModels = async () => {
  loading.value = true
  error.value = false
  loginRequired.value = false
  
  // 检查登录状态
  if (props.requireLogin && !isUserLoggedIn()) {
    error.value = true
    errorMessage.value = '请先登录后再使用此功能'
    loginRequired.value = true
    loading.value = false
    return
  }
  
  try {
    // 首先尝试使用常规方法获取
    let res;
    try {
      res = await getAllModels()
    } catch (firstError) {
      console.warn('常规API调用失败，尝试备选方法', firstError)
      // 如果常规方法失败，尝试直接使用axios
      res = await getAllModelsDirectly()
    }
    
    if (res.code === 0 || res.code === 200) {
      models.value = res.data || []
      emit('load-success', models.value)
    } else if (res.code === 401) {
      // 处理401错误
      error.value = true
      errorMessage.value = '请先登录后再使用此功能'
      loginRequired.value = true
      emit('load-error', errorMessage.value)
    } else {
      throw new Error(res.msg || '获取模型失败')
    }
  } catch (err: any) {
    error.value = true
    
    // 处理401错误
    if (err.response && err.response.status === 401) {
      errorMessage.value = '请先登录后再使用此功能'
      loginRequired.value = true
    } else {
      errorMessage.value = err instanceof Error ? err.message : '获取模型失败，请重试'
    }
    
    emit('load-error', errorMessage.value)
  } finally {
    loading.value = false
  }
}

// 组件挂载时自动加载数据
onMounted(() => {
  if (props.autoLoad) {
    fetchModels()
  }
})

// 暴露方法给父组件
defineExpose({
  fetchModels,
  models
})
</script>

<script lang="ts">
// 添加默认导出以解决导入问题
export default {
  name: 'ModelSelector'
}
</script>

<style scoped>
.model-selector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selection-header {
  font-size: 16px;
  margin-bottom: 15px;
  color: #fff;
}

.model-list-container {
  flex: 1;
  overflow: hidden;
}

.model-list {
  height: 100%;
  overflow-y: auto;
  padding-right: 5px;
}

.model-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.model-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.selected-model {
  border: 2px solid #00A3FF;
  background: rgba(0, 163, 255, 0.2);
}

.model-image {
  width: 60px;
  height: 60px;
  overflow: hidden;
  margin-right: 15px;
  border-radius: 4px;
  flex-shrink: 0;
}

.model-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-name {
  font-size: 14px;
  color: #fff;
  flex: 1;
}

.loading-container, .error-container, .empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  font-size: 24px;
  margin-bottom: 10px;
  animation: rotate 1.5s linear infinite;
}

.error-icon, .empty-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.error-icon {
  color: #ff6b6b;
}

.empty-icon {
  color: #aaa;
}

.error-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 自定义滚动条样式 */
.model-list::-webkit-scrollbar {
  width: 6px;
}

.model-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.model-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.model-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style> 