<template>
  <div class="material-grid-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-grid">
      <div v-for="n in 12" :key="n" class="material-card-skeleton">
        <el-skeleton animated>
          <template #template>
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <el-skeleton-item variant="text" style="width: 80%" />
              <el-skeleton-item variant="text" style="width: 60%" />
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <!-- 材质网格 -->
    <div v-else class="materials-grid">
      <div
        v-for="material in materials"
        :key="material.id"
        class="material-card"
        :class="{
          'selected': isSelected(material),
          'selectable': mode === 'select'
        }"
        @click="handleCardClick(material)"
        @contextmenu.prevent="handleRightClick(material, $event)"
      >
        <!-- 选择状态指示器 -->
        <div v-if="mode === 'select'" class="selection-indicator">
          <el-checkbox 
            :model-value="isSelected(material)"
            @change="handleSelectionChange(material)"
            @click.stop
          />
        </div>

        <!-- 材质图片 -->
        <div class="material-image-container">
          <img
            :src="getImageUrl(material)"
            :alt="material.name"
            class="material-image"
            @load="handleImageLoad"
            @error="handleImageError"
            loading="lazy"
          />
          
          <!-- 悬停操作按钮 -->
          <div class="hover-actions">
            <el-button
              circle
              size="small"
              type="primary"
              :icon="ZoomIn"
              @click.stop="handlePreview(material)"
              title="预览"
            />
            <el-button
              circle
              size="small"
              type="success"
              :icon="Download"
              @click.stop="handleDownload(material)"
              title="下载"
            />
            <el-button
              v-if="canDelete(material)"
              circle
              size="small"
              type="danger"
              :icon="Delete"
              @click.stop="handleDelete(material)"
              title="删除"
            />
          </div>

          <!-- 材质类型标签 -->
          <div class="material-type-tag">
            <el-tag 
              :type="material.type === 0 ? 'warning' : 'info'"
              size="small"
            >
              {{ material.type === 0 ? '系统' : '用户' }}
            </el-tag>
          </div>

          <!-- 收藏状态 -->
          <div 
            v-if="material.isFavorite"
            class="favorite-indicator"
          >
            <el-icon color="#f56c6c"><Star /></el-icon>
          </div>
        </div>

        <!-- 材质信息 -->
        <div class="material-info">
          <div class="material-name" :title="material.name">
            {{ material.name }}
          </div>
          <div class="material-meta">
            <span class="meta-item">
              <el-icon><PictureFilled /></el-icon>
              {{ material.format.toUpperCase() }}
            </span>
            <span class="meta-item">
              <el-icon><Download /></el-icon>
              {{ material.downloadCount }}
            </span>
          </div>
          <div class="material-time">
            {{ formatTime(material.uploadTime) }}
          </div>
        </div>

        <!-- 右键菜单 -->
        <el-dropdown
          ref="contextMenuRef"
          trigger="contextmenu"
          @command="handleContextMenuCommand"
        >
          <span></span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="preview" :icon="ZoomIn">
                预览
              </el-dropdown-item>
              <el-dropdown-item command="download" :icon="Download">
                下载
              </el-dropdown-item>
              <el-dropdown-item 
                command="favorite" 
                :icon="material.isFavorite ? StarFilled : Star"
              >
                {{ material.isFavorite ? '取消收藏' : '添加收藏' }}
              </el-dropdown-item>
              <el-dropdown-item 
                v-if="canDelete(material)"
                command="delete" 
                :icon="Delete"
                divided
              >
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="showPreviewDialog"
      title="材质预览"
      width="80%"
      :close-on-click-modal="true"
      class="preview-dialog"
    >
      <div class="preview-content" v-if="previewMaterial">
        <div class="preview-image-container">
          <img
            :src="processImageUrl(previewMaterial.ossPath)"
            :alt="previewMaterial.name"
            class="preview-image"
            @error="handlePreviewImageError"
          />
        </div>
        <div class="preview-info">
          <h3>{{ previewMaterial.name }}</h3>
          <div class="preview-meta">
            <div class="meta-row">
              <span class="label">格式:</span>
              <span class="value">{{ previewMaterial.format.toUpperCase() }}</span>
            </div>
            <div class="meta-row">
              <span class="label">类型:</span>
              <span class="value">{{ previewMaterial.type === 0 ? '系统材质' : '用户材质' }}</span>
            </div>
            <div class="meta-row">
              <span class="label">下载次数:</span>
              <span class="value">{{ previewMaterial.downloadCount }}</span>
            </div>
            <div class="meta-row">
              <span class="label">上传时间:</span>
              <span class="value">{{ formatTime(previewMaterial.uploadTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  ZoomIn, 
  Download, 
  Delete, 
  Star, 
  StarFilled, 
  PictureFilled 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Material } from '../../types/material'
import { isUserLoggedIn } from '../../api/file'
import VirtualScroll from '../common/VirtualScroll.vue'
import { vLazyLoad } from '../../utils/lazyLoad'
import { materialCache } from '../../utils/cache'
import { processImageUrl, getErrorImage } from '../../utils/imageUtils'

// Props
interface Props {
  materials: Material[]
  loading?: boolean
  mode?: 'browse' | 'select'
  multiple?: boolean
  selectedMaterials?: Material[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  mode: 'browse',
  multiple: false,
  selectedMaterials: () => []
})

// Emits
const emit = defineEmits<{
  materialClick: [material: Material]
  materialSelect: [material: Material]
  materialAction: [action: string, material: Material]
}>()

// 响应式数据
const showPreviewDialog = ref(false)
const previewMaterial = ref<Material | null>(null)
const contextMenuMaterial = ref<Material | null>(null)

// 计算属性
const isSelected = (material: Material) => {
  return props.selectedMaterials.some(m => m.id === material.id)
}

const canDelete = (material: Material) => {
  if (!isUserLoggedIn()) return false
  
  // 系统材质只有管理员可以删除
  if (material.type === 0) {
    // 这里需要根据实际的用户角色判断逻辑
    return false // 暂时禁用系统材质删除
  }
  
  // 用户材质只能删除自己的
  return true // 这里需要根据实际的用户ID判断
}

// 方法
const handleCardClick = (material: Material) => {
  emit('materialClick', material)
}

const handleSelectionChange = (material: Material) => {
  emit('materialSelect', material)
}

const handlePreview = (material: Material) => {
  previewMaterial.value = material
  showPreviewDialog.value = true
}

const handleDownload = async (material: Material) => {
  try {
    emit('materialAction', 'download', material)
  } catch (error) {
    ElMessage.error('下载失败')
  }
}

const handleDelete = async (material: Material) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除材质 "${material.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    emit('materialAction', 'delete', material)
  } catch (error) {
    // 用户取消删除
  }
}

const handleRightClick = (material: Material, event: MouseEvent) => {
  contextMenuMaterial.value = material
  // 这里可以添加右键菜单的显示逻辑
}

const handleContextMenuCommand = (command: string) => {
  if (!contextMenuMaterial.value) return
  
  const material = contextMenuMaterial.value
  
  switch (command) {
    case 'preview':
      handlePreview(material)
      break
    case 'download':
      handleDownload(material)
      break
    case 'favorite':
      emit('materialAction', 'favorite', material)
      break
    case 'delete':
      handleDelete(material)
      break
  }
  
  contextMenuMaterial.value = null
}

// 懒加载相关
const imageObserver = ref<IntersectionObserver | null>(null)
const loadedImages = ref(new Set<string>())

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.classList.add('loaded')
  loadedImages.value.add(img.src)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getErrorImage() // 使用错误占位图
}

const handlePreviewImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getErrorImage() // 使用错误占位图
}

const handleLazyLoaded = (event: CustomEvent) => {
  console.log('Image lazy loaded:', event.detail.src)
}

const handleLazyError = (event: CustomEvent) => {
  console.error('Image lazy load error:', event.detail.src, event.detail.error)
}

// 初始化懒加载观察器
const initLazyLoading = () => {
  if ('IntersectionObserver' in window) {
    imageObserver.value = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const dataSrc = img.getAttribute('data-src')
          if (dataSrc && !loadedImages.value.has(dataSrc)) {
            img.src = dataSrc
            img.removeAttribute('data-src')
            imageObserver.value?.unobserve(img)
          }
        }
      })
    }, {
      rootMargin: '50px 0px', // 提前50px开始加载
      threshold: 0.1
    })
  }
}

// 观察图片元素
const observeImage = (img: HTMLImageElement) => {
  if (imageObserver.value && img.hasAttribute('data-src')) {
    imageObserver.value.observe(img)
  }
}

// 获取图片URL
const getImageUrl = (material: Material) => {
  // 优先使用缩略图，如果没有则使用原图
  const imageUrl = material.thumbnailUrl || material.ossPath
  return processImageUrl(imageUrl)
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}
</script>

<style scoped>
.material-grid-container {
  width: 100%;
}

.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.material-card-skeleton {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.skeleton-image {
  width: 100%;
  height: 150px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 12px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 20px;
}

.material-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.material-card.selected {
  border-color: #c8ad7f;
  background: rgba(200, 173, 127, 0.2);
}

.material-card.selectable:hover {
  border-color: #c8ad7f;
}

.selection-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
}

.material-image-container {
  position: relative;
  width: 100%;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.material-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  opacity: 0;
}

.material-image.loaded {
  opacity: 1;
}

.material-card:hover .material-image {
  transform: scale(1.05);
}

.hover-actions {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.material-card:hover .hover-actions {
  opacity: 1;
}

.material-type-tag {
  position: absolute;
  top: 8px;
  right: 8px;
}

.favorite-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  color: #f56c6c;
}

.material-info {
  color: white;
}

.material-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.material-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.preview-dialog {
  --el-dialog-bg-color: rgba(255, 255, 255, 0.95);
}

.preview-content {
  display: flex;
  gap: 20px;
  max-height: 70vh;
}

.preview-image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
}

.preview-info {
  width: 300px;
  padding: 20px;
}

.preview-info h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
}

.label {
  font-weight: 600;
  color: #666;
}

.value {
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .materials-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
    padding: 15px;
  }
  
  .material-card {
    padding: 12px;
  }
  
  .material-image-container {
    height: 120px;
  }
  
  .preview-content {
    flex-direction: column;
  }
  
  .preview-info {
    width: 100%;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-checkbox) {
  --el-checkbox-checked-bg-color: #c8ad7f;
  --el-checkbox-checked-border-color: #c8ad7f;
}

:deep(.el-tag--warning) {
  --el-tag-bg-color: rgba(230, 162, 60, 0.8);
  --el-tag-border-color: rgba(230, 162, 60, 0.8);
}

:deep(.el-tag--info) {
  --el-tag-bg-color: rgba(144, 147, 153, 0.8);
  --el-tag-border-color: rgba(144, 147, 153, 0.8);
}
</style>