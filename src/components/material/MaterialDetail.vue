<template>
  <el-dialog
    v-model="dialogVisible"
    :title="material?.name || '材质详情'"
    width="800px"
    :close-on-click-modal="true"
    @close="handleClose"
    class="material-detail-dialog"
  >
    <div v-if="material" class="detail-container">
      <!-- 左侧图片区域 -->
      <div class="image-section">
        <div class="main-image-container">
          <img
            :src="material.ossPath"
            :alt="material.name"
            class="main-image"
            @load="handleImageLoad"
            @error="handleImageError"
          />
          
          <!-- 图片操作按钮 -->
          <div class="image-actions">
            <el-button
              circle
              type="primary"
              :icon="ZoomIn"
              @click="showFullscreen = true"
              title="全屏查看"
            />
            <el-button
              circle
              type="success"
              :icon="Download"
              @click="handleDownload"
              :loading="downloading"
              title="下载材质"
            />
          </div>
          
          <!-- 收藏状态 -->
          <div class="favorite-button">
            <el-button
              circle
              :type="material.isFavorite ? 'danger' : 'info'"
              :icon="material.isFavorite ? StarFilled : Star"
              @click="handleToggleFavorite"
              :title="material.isFavorite ? '取消收藏' : '添加收藏'"
            />
          </div>
        </div>
        
        <!-- 缩略图（如果有多个视图） -->
        <div class="thumbnail-list" v-if="thumbnails.length > 1">
          <div
            v-for="(thumb, index) in thumbnails"
            :key="index"
            class="thumbnail-item"
            :class="{ active: currentImageIndex === index }"
            @click="currentImageIndex = index"
          >
            <img :src="thumb" :alt="`视图 ${index + 1}`" />
          </div>
        </div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="info-section">
        <!-- 基本信息 -->
        <div class="info-group">
          <h3 class="group-title">基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">材质名称:</span>
              <span class="value">{{ material.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">文件格式:</span>
              <span class="value">{{ material.format.toUpperCase() }}</span>
            </div>
            <div class="info-item">
              <span class="label">材质类型:</span>
              <el-tag :type="material.type === 0 ? 'warning' : 'info'">
                {{ material.type === 0 ? '系统材质' : '用户材质' }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">下载次数:</span>
              <span class="value">{{ material.downloadCount }}</span>
            </div>
          </div>
        </div>

        <!-- 分类和标签 -->
        <div class="info-group" v-if="material.category || (material.tags && material.tags.length > 0)">
          <h3 class="group-title">分类标签</h3>
          <div class="tags-container">
            <el-tag v-if="material.category" type="primary" size="large">
              {{ getCategoryLabel(material.category) }}
            </el-tag>
            <el-tag
              v-for="tag in material.tags"
              :key="tag"
              type="info"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="info-group">
          <h3 class="group-title">时间信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">上传时间:</span>
              <span class="value">{{ formatDateTime(material.uploadTime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDateTime(material.createTime) }}</span>
            </div>
            <div class="info-item" v-if="material.updateTime !== material.createTime">
              <span class="label">更新时间:</span>
              <span class="value">{{ formatDateTime(material.updateTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 备注说明 -->
        <div class="info-group" v-if="material.remark">
          <h3 class="group-title">备注说明</h3>
          <div class="remark-content">
            {{ material.remark }}
          </div>
        </div>

        <!-- 文件信息 -->
        <div class="info-group">
          <h3 class="group-title">文件信息</h3>
          <div class="file-info">
            <div class="file-path">
              <span class="label">存储路径:</span>
              <el-input
                :model-value="material.ossPath"
                readonly
                size="small"
              >
                <template #append>
                  <el-button
                    :icon="CopyDocument"
                    @click="copyToClipboard(material.ossPath)"
                    title="复制路径"
                  />
                </template>
              </el-input>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button
            type="primary"
            :icon="Download"
            @click="handleDownload"
            :loading="downloading"
          >
            下载材质
          </el-button>
          
          <el-button
            :type="material.isFavorite ? 'danger' : 'warning'"
            :icon="material.isFavorite ? StarFilled : Star"
            @click="handleToggleFavorite"
          >
            {{ material.isFavorite ? '取消收藏' : '添加收藏' }}
          </el-button>
          
          <el-button
            v-if="canDelete"
            type="danger"
            :icon="Delete"
            @click="handleDelete"
            plain
          >
            删除材质
          </el-button>
        </div>
      </div>
    </div>

    <!-- 全屏图片查看 -->
    <el-dialog
      v-model="showFullscreen"
      title="材质预览"
      width="90%"
      :close-on-click-modal="true"
      class="fullscreen-dialog"
      append-to-body
    >
      <div class="fullscreen-container">
        <img
          :src="material?.ossPath"
          :alt="material?.name"
          class="fullscreen-image"
          @wheel="handleZoom"
          :style="{ transform: `scale(${zoomLevel})` }"
        />
        
        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <el-button-group>
            <el-button :icon="ZoomOut" @click="zoomOut" :disabled="zoomLevel <= 0.5" />
            <el-button @click="resetZoom">{{ Math.round(zoomLevel * 100) }}%</el-button>
            <el-button :icon="ZoomIn" @click="zoomIn" :disabled="zoomLevel >= 3" />
          </el-button-group>
        </div>
      </div>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Delete, 
  Star, 
  StarFilled,
  CopyDocument
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Material } from '../../types/material'
import { MaterialCategories } from '../../types/material'
import { useMaterialStore } from '../../store/material'
import { isUserLoggedIn } from '../../api/file'

// Props
interface Props {
  visible: boolean
  material: Material | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  material: null
})

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  close: []
  action: [action: string, material: Material]
}>()

// Store
const materialStore = useMaterialStore()

// 响应式数据
const dialogVisible = ref(props.visible)
const showFullscreen = ref(false)
const downloading = ref(false)
const currentImageIndex = ref(0)
const zoomLevel = ref(1)

// 缩略图列表（暂时只有一张图）
const thumbnails = computed(() => {
  return props.material ? [props.material.ossPath] : []
})

// 权限检查
const canDelete = computed(() => {
  if (!props.material || !isUserLoggedIn()) return false
  
  // 系统材质只有管理员可以删除
  if (props.material.type === 0) {
    return false // 暂时禁用系统材质删除
  }
  
  // 用户材质只能删除自己的
  return true // 这里需要根据实际的用户ID判断
})

// 方法
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.classList.add('loaded')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/src/assets/placeholder-material.svg'
}

const handleDownload = async () => {
  if (!props.material) return
  
  downloading.value = true
  try {
    await materialStore.downloadMaterialFile(props.material.id)
    ElMessage.success('材质下载成功')
    emit('action', 'download', props.material)
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败')
  } finally {
    downloading.value = false
  }
}

const handleToggleFavorite = () => {
  if (!props.material) return
  
  materialStore.toggleFavorite(props.material)
  const message = props.material.isFavorite ? '已取消收藏' : '已添加到收藏'
  ElMessage.success(message)
  emit('action', 'favorite', props.material)
}

const handleDelete = async () => {
  if (!props.material) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除材质 "${props.material.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await materialStore.removeMaterial(props.material.id)
    ElMessage.success('材质删除成功')
    emit('action', 'delete', props.material)
    handleClose()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const handleZoom = (event: WheelEvent) => {
  event.preventDefault()
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.5, Math.min(3, zoomLevel.value + delta))
  zoomLevel.value = newZoom
}

const zoomIn = () => {
  zoomLevel.value = Math.min(3, zoomLevel.value + 0.2)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.2)
}

const resetZoom = () => {
  zoomLevel.value = 1
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('路径已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const getCategoryLabel = (value: string) => {
  const category = MaterialCategories.find(c => c.value === value)
  return category ? category.label : value
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 监听props变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
  if (newValue) {
    // 重置状态
    currentImageIndex.value = 0
    zoomLevel.value = 1
    showFullscreen.value = false
  }
})

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

watch(showFullscreen, (newValue) => {
  if (newValue) {
    zoomLevel.value = 1
  }
})
</script>

<style scoped>
.material-detail-dialog {
  --el-dialog-bg-color: #fff;
}

.detail-container {
  display: flex;
  gap: 24px;
  min-height: 500px;
}

.image-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-image-container {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: opacity 0.3s;
  opacity: 0;
}

.main-image.loaded {
  opacity: 1;
}

.image-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.main-image-container:hover .image-actions {
  opacity: 1;
}

.favorite-button {
  position: absolute;
  top: 12px;
  left: 12px;
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.thumbnail-item {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.thumbnail-item.active {
  border-color: #c8ad7f;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-group {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.info-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.group-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #666;
  min-width: 80px;
}

.value {
  color: #333;
  text-align: right;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.remark-content {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  color: #666;
  line-height: 1.5;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-path {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.fullscreen-dialog {
  --el-dialog-bg-color: rgba(0, 0, 0, 0.9);
}

.fullscreen-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.fullscreen-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  cursor: grab;
  transition: transform 0.2s;
}

.fullscreen-image:active {
  cursor: grabbing;
}

.zoom-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 6px;
  padding: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .main-image-container {
    height: 250px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .value {
    text-align: left;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%);
}

:deep(.el-tag--warning) {
  --el-tag-bg-color: rgba(230, 162, 60, 0.1);
  --el-tag-text-color: #e6a23c;
  --el-tag-border-color: rgba(230, 162, 60, 0.2);
}

:deep(.el-tag--info) {
  --el-tag-bg-color: rgba(144, 147, 153, 0.1);
  --el-tag-text-color: #909399;
  --el-tag-border-color: rgba(144, 147, 153, 0.2);
}

:deep(.el-input--small .el-input__wrapper) {
  font-size: 12px;
}
</style>