<template>
  <div class="smart-cutout-container">
    <!-- 头部标题 -->
    <div class="header">
      <h2>🎯 智能抠图</h2>
      <p class="description">左键点击要保留的区域，右键点击要去除的区域</p>
    </div>

    <!-- 操作区域 -->
    <div class="main-content">
      <!-- 左侧：图片上传和操作 -->
      <div class="left-panel">
        <!-- 图片上传区域 -->
        <div class="upload-section" v-if="!originalImage">
          <el-upload class="upload-area" drag :show-file-list="false" :before-upload="handleImageUpload"
            accept="image/*">
            <el-icon class="upload-icon">
              <Upload />
            </el-icon>
            <div class="upload-text">
              <p>点击或拖拽图片到此处上传</p>
              <p class="upload-hint">支持 JPG、PNG 格式</p>
            </div>
          </el-upload>
        </div>

        <!-- 图片编辑区域 -->
        <div class="image-editor" v-if="originalImage">
          <div class="image-container">
            <canvas ref="imageCanvas" class="image-canvas" @click="handleCanvasClick"
              @contextmenu="handleCanvasRightClick" @mousemove="handleCanvasMouseMove"></canvas>

            <!-- 点击点显示 -->
            <div class="points-overlay">
              <div v-for="(point, index) in clickPoints" :key="index" class="point-marker" :class="point.type" :style="{
                left: point.x + 'px',
                top: point.y + 'px'
              }">
                <span class="point-number">{{ index + 1 }}</span>
              </div>
            </div>

            <!-- 鼠标位置指示器 -->
            <div v-if="mousePosition.show" class="mouse-indicator" :style="{
              left: mousePosition.x + 'px',
              top: mousePosition.y + 'px'
            }">
              <span>{{ mousePosition.x }}, {{ mousePosition.y }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="controls">
            <el-button @click="clearPoints" :disabled="clickPoints.length === 0">
              <el-icon>
                <Delete />
              </el-icon>
              清除所有点
            </el-button>
            <el-button @click="resetImage" type="warning">
              <el-icon>
                <Refresh />
              </el-icon>
              重新上传
            </el-button>
            <el-button @click="saveCutout" type="primary" :disabled="!currentMask || isProcessing" :loading="isSaving">
              <el-icon>
                <Download />
              </el-icon>
              保存抠图
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧：预览和设置 -->
      <div class="right-panel">
        <!-- 操作说明 -->
        <div class="instructions">
          <h3>📖 操作说明</h3>
          <ul>
            <li><span class="positive-point">●</span> 左键点击：标记要保留的区域（正点）</li>
            <li><span class="negative-point">●</span> 右键点击：标记要去除的区域（负点）</li>
            <li>多次点击可以精细调整分割效果</li>
            <li>点击"清除所有点"可以重新开始</li>
          </ul>
        </div>

        <!-- 点击统计 -->
        <div class="stats" v-if="clickPoints.length > 0">
          <h3>📊 点击统计</h3>
          <div class="stat-item">
            <span class="positive-point">●</span>
            正点（保留）: {{ foregroundCount }}
          </div>
          <div class="stat-item">
            <span class="negative-point">●</span>
            负点（去除）: {{ backgroundCount }}
          </div>
          <div class="stat-item">
            总计: {{ clickPoints.length }}
          </div>
        </div>

        <!-- 预览区域 -->
        <div class="preview-section" v-if="currentMask">
          <h3>🔍 分割预览</h3>
          <div class="preview-container">
            <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          </div>
          <div class="preview-controls">
            <el-slider v-model="maskOpacity" :min="0" :max="100" @input="updatePreview" show-input>
              <template #prepend>透明度</template>
            </el-slider>
          </div>
        </div>

        <!-- 处理状态 -->
        <div class="processing-status" v-if="isProcessing">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>{{ processingMessage }}</span>
        </div>
      </div>
    </div>

    <!-- 结果展示对话框 -->
    <el-dialog v-model="showResultDialog" title="抠图结果" width="80%" center>
      <div class="result-content">
        <div class="result-images">
          <div class="result-item">
            <h4>原图</h4>
            <img :src="originalImage" alt="原图" />
          </div>
          <div class="result-item">
            <h4>抠图结果</h4>
            <img :src="cutoutResult" alt="抠图结果" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showResultDialog = false">关闭</el-button>
        <el-button type="primary" @click="downloadResult">下载结果</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Delete, Refresh, Download, Loading } from '@element-plus/icons-vue'
import { uploadImage } from '../../api/file'

// 响应式数据
const originalImage = ref('')
const currentMask = ref('')
const cutoutResult = ref('')
const clickPoints = ref([])
const mousePosition = ref({ x: 0, y: 0, show: false })
const maskOpacity = ref(50)
const isProcessing = ref(false)
const isSaving = ref(false)
const processingMessage = ref('')
const showResultDialog = ref(false)

// Canvas引用
const imageCanvas = ref(null)
const previewCanvas = ref(null)

// 图片信息
const imageInfo = ref({
  width: 0,
  height: 0,
  imageId: null
})

// SAM API配置
const SAM_API_BASE = 'http://js1.blockelite.cn:34965/api'

// 计算属性
const foregroundCount = computed(() =>
  clickPoints.value.filter(p => p.type === 'foreground').length
)

const backgroundCount = computed(() =>
  clickPoints.value.filter(p => p.type === 'background').length
)

// 图片上传处理
const handleImageUpload = async (file) => {
  try {
    isProcessing.value = true
    processingMessage.value = '正在上传图片...'

    // 上传到OSS
    const uploadResult = await uploadImage(file)
    if (uploadResult.code === 200) {
      imageInfo.value.imageId = uploadResult.data.id

      // 读取图片并显示
      const reader = new FileReader()
      reader.onload = async (e) => {
        const result = e.target?.result
        console.log('FileReader result type:', typeof result)
        console.log('FileReader result preview:', result ? result.toString().substring(0, 100) + '...' : 'null')
        
        if (result && typeof result === 'string') {
          originalImage.value = result
          await loadImageToSAM(result)
          drawImageOnCanvas()
        } else {
          throw new Error('图片读取失败：无效的数据格式')
        }
      }
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e)
        throw new Error('文件读取失败')
      }
      
      reader.readAsDataURL(file)

      ElMessage.success('图片上传成功')
    } else {
      throw new Error(uploadResult.msg || '上传失败')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error('图片上传失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }

  return false // 阻止默认上传行为
}

// 加载图片到SAM
const loadImageToSAM = async (imageDataUrl) => {
  try {
    processingMessage.value = '正在加载图片到AI模型...'

    // 验证输入参数
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      throw new Error('无效的图片数据格式')
    }

    // 检查是否为有效的data URL格式
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error('不是有效的图片数据URL')
    }

    // 提取base64数据
    const base64Data = imageDataUrl.split(',')[1]
    
    if (!base64Data) {
      throw new Error('无法提取base64数据')
    }

    console.log('Base64 data length:', base64Data.length)
    console.log('Base64 data preview:', base64Data.substring(0, 50) + '...')
    
    // 验证base64格式
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(base64Data)) {
      throw new Error('无效的base64数据格式')
    }

    // 检查SAM服务器健康状态
    try {
      console.log('检查SAM服务器健康状态...')
      const healthResponse = await fetch(`${SAM_API_BASE}/health`, {
        method: 'GET'
      })

      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        console.log('SAM服务器健康检查通过', healthData)
      } else {
        console.warn('SAM服务器健康检查失败', {
          状态码: healthResponse.status,
          状态文本: healthResponse.statusText
        })
      }
    } catch (healthError) {
      console.error('SAM服务器健康检查异常', healthError)
      throw new Error('SAM服务器不可用，请检查服务器状态')
    }

    const requestData = {
      image: base64Data,
      max_size: 1024
    }

    console.log('发送加载图像请求到SAM API:', `${SAM_API_BASE}/load_image`)
    console.log('请求数据大小:', JSON.stringify(requestData).length)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('SAM API请求超时')
      controller.abort()
    }, 60000)

    try {
      const response = await fetch(`${SAM_API_BASE}/load_image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('SAM API响应状态:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('SAM API加载图像失败:', {
          状态码: response.status,
          错误内容: errorText
        })
        throw new Error(`加载图像到SAM失败 (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log('SAM API响应结果:', result)

      if (result.success) {
        imageInfo.value.width = result.image_size.width
        imageInfo.value.height = result.image_size.height
        ElMessage.success('图片已加载到AI模型')
      } else {
        throw new Error(result.error || result.message || '加载失败')
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error('加载图片到SAM失败:', error)
    ElMessage.error('加载图片失败: ' + error.message)
    throw error
  }
}

// 在Canvas上绘制图片
const drawImageOnCanvas = () => {
  if (!imageCanvas.value || !originalImage.value) return

  const canvas = imageCanvas.value
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    // 设置Canvas尺寸
    canvas.width = img.width
    canvas.height = img.height

    // 绘制图片
    ctx.drawImage(img, 0, 0)

    // 如果有蒙版，叠加显示
    if (currentMask.value) {
      drawMaskOverlay()
    }
  }

  img.src = originalImage.value
}

// 绘制蒙版叠加
const drawMaskOverlay = () => {
  if (!currentMask.value || !imageCanvas.value) return

  const canvas = imageCanvas.value
  const ctx = canvas.getContext('2d')
  const maskImg = new Image()

  maskImg.onload = () => {
    // 设置叠加模式
    ctx.globalAlpha = maskOpacity.value / 100
    ctx.globalCompositeOperation = 'multiply'

    // 绘制蒙版
    ctx.drawImage(maskImg, 0, 0)

    // 恢复默认设置
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  maskImg.src = currentMask.value
}

// 处理Canvas点击
const handleCanvasClick = async (event) => {
  if (!originalImage.value) return

  const rect = imageCanvas.value.getBoundingClientRect()
  const x = Math.round(event.clientX - rect.left)
  const y = Math.round(event.clientY - rect.top)

  await addPoint(x, y, 'foreground')
}

// 处理Canvas右键点击
const handleCanvasRightClick = async (event) => {
  event.preventDefault()
  if (!originalImage.value) return

  const rect = imageCanvas.value.getBoundingClientRect()
  const x = Math.round(event.clientX - rect.left)
  const y = Math.round(event.clientY - rect.top)

  await addPoint(x, y, 'background')
}

// 处理鼠标移动
const handleCanvasMouseMove = (event) => {
  if (!originalImage.value) return

  const rect = imageCanvas.value.getBoundingClientRect()
  mousePosition.value = {
    x: Math.round(event.clientX - rect.left),
    y: Math.round(event.clientY - rect.top),
    show: true
  }
}

// 添加点并执行分割
const addPoint = async (x, y, type) => {
  try {
    isProcessing.value = true
    processingMessage.value = '正在执行AI分割...'

    // 添加点到列表
    clickPoints.value.push({ x, y, type })

    // 调用SAM分割API
    const response = await fetch(`${SAM_API_BASE}/segment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        x: x,
        y: y,
        point_type: type
      })
    })

    const result = await response.json()

    if (result.success) {
      // 更新蒙版
      currentMask.value = 'data:image/png;base64,' + result.mask

      // 重新绘制Canvas
      drawImageOnCanvas()

      // 更新预览
      updatePreview()

      ElMessage.success(`分割完成 - 正点: ${result.points.foreground_count}, 负点: ${result.points.background_count}`)
    } else {
      // 如果分割失败，移除刚添加的点
      clickPoints.value.pop()
      throw new Error(result.error || '分割失败')
    }
  } catch (error) {
    console.error('分割失败:', error)
    ElMessage.error('分割失败: ' + error.message)
  } finally {
    isProcessing.value = false
  }
}

// 更新预览
const updatePreview = () => {
  if (!previewCanvas.value || !originalImage.value || !currentMask.value) return

  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')

  // 加载原图
  const img = new Image()
  img.onload = () => {
    // 设置预览Canvas尺寸
    const maxSize = 300
    const scale = Math.min(maxSize / img.width, maxSize / img.height)
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    // 绘制缩放后的原图
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 加载并绘制蒙版
    const maskImg = new Image()
    maskImg.onload = () => {
      ctx.globalAlpha = maskOpacity.value / 100
      ctx.globalCompositeOperation = 'multiply'
      ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    maskImg.src = currentMask.value
  }
  img.src = originalImage.value
}

// 清除所有点
const clearPoints = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有标记点吗？', '确认清除', {
      type: 'warning'
    })

    isProcessing.value = true
    processingMessage.value = '正在清除标记点...'

    // 调用SAM清除API
    const response = await fetch(`${SAM_API_BASE}/clear_points`, {
      method: 'POST'
    })

    const result = await response.json()

    if (result.success) {
      clickPoints.value = []
      currentMask.value = ''
      drawImageOnCanvas() // 重新绘制，不包含蒙版
      ElMessage.success('已清除所有标记点')
    } else {
      throw new Error(result.error || '清除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清除点失败:', error)
      ElMessage.error('清除失败: ' + error.message)
    }
  } finally {
    isProcessing.value = false
  }
}

// 重置图片
const resetImage = async () => {
  try {
    await ElMessageBox.confirm('确定要重新上传图片吗？当前的所有操作将丢失。', '确认重置', {
      type: 'warning'
    })

    originalImage.value = ''
    currentMask.value = ''
    cutoutResult.value = ''
    clickPoints.value = []
    imageInfo.value = { width: 0, height: 0, imageId: null }

    ElMessage.success('已重置，请重新上传图片')
  } catch (error) {
    // 用户取消
  }
}

// 保存抠图结果
const saveCutout = async () => {
  if (!currentMask.value || !originalImage.value) {
    ElMessage.warning('请先完成抠图操作')
    return
  }

  try {
    isSaving.value = true

    // 创建结果图片（原图 + 蒙版）
    const resultCanvas = document.createElement('canvas')
    const ctx = resultCanvas.getContext('2d')

    // 加载原图
    const img = new Image()
    img.onload = () => {
      resultCanvas.width = img.width
      resultCanvas.height = img.height

      // 绘制原图
      ctx.drawImage(img, 0, 0)

      // 加载蒙版
      const maskImg = new Image()
      maskImg.onload = () => {
        // 使用蒙版作为alpha通道
        ctx.globalCompositeOperation = 'destination-in'
        ctx.drawImage(maskImg, 0, 0)

        // 生成结果图片
        cutoutResult.value = resultCanvas.toDataURL('image/png')
        showResultDialog.value = true

        ElMessage.success('抠图完成！')
      }
      maskImg.src = currentMask.value
    }
    img.src = originalImage.value

  } catch (error) {
    console.error('保存抠图失败:', error)
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 下载结果
const downloadResult = () => {
  if (!cutoutResult.value) return

  const link = document.createElement('a')
  link.download = `cutout_result_${Date.now()}.png`
  link.href = cutoutResult.value
  link.click()
}

// 组件挂载
onMounted(() => {
  // 禁用右键菜单
  document.addEventListener('contextmenu', (e) => {
    if (e.target === imageCanvas.value) {
      e.preventDefault()
    }
  })
})

// 组件卸载
onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('contextmenu', () => { })
})
</script>

<style scoped>
.smart-cutout-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.description {
  color: #7f8c8d;
  font-size: 16px;
}

.main-content {
  display: flex;
  gap: 30px;
  min-height: 600px;
}

.left-panel {
  flex: 2;
}

.right-panel {
  flex: 1;
  min-width: 300px;
}

/* 上传区域 */
.upload-section {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area {
  width: 100%;
  height: 400px;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 20px;
}

.upload-text p {
  margin: 5px 0;
}

.upload-hint {
  color: #909399;
  font-size: 14px;
}

/* 图片编辑区域 */
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.image-container {
  position: relative;
  flex: 1;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-canvas {
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
  display: block;
}

.points-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.point-marker {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.point-marker.foreground {
  background-color: #e74c3c;
  border: 2px solid #c0392b;
}

.point-marker.background {
  background-color: #3498db;
  border: 2px solid #2980b9;
}

.point-number {
  font-size: 10px;
}

.mouse-indicator {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
 
  z-index: 20;
}

.controls {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 右侧面板 */
.instructions {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.instructions h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.instructions ul {
  list-style: none;
  padding: 0;
}

.instructions li {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.positive-point {
  color: #e74c3c;
  font-size: 16px;
}

.negative-point {
  color: #3498db;
  font-size: 16px;
}

.stats {
  background: #fff;
  border: 1px solid #e4e7ed;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stats h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-section h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.preview-canvas {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  max-width: 100%;
}

.preview-controls {
  margin-top: 15px;
}

.processing-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #e8f4fd;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  color: #409eff;
}

/* 结果对话框 */
.result-content {
  text-align: center;
}

.result-images {
  display: flex;
  gap: 30px;
  justify-content: center;
  align-items: flex-start;
}

.result-item {
  flex: 1;
  max-width: 300px;
}

.result-item h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.result-item img {
  width: 100%;
  height: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .right-panel {
    min-width: auto;
  }

  .result-images {
    flex-direction: column;
    align-items: center;
  }
}
</style>