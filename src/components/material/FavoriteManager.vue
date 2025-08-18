<template>
  <div class="favorite-manager">
    <!-- 收藏夹管理头部 -->
    <div class="favorite-manager-header">
      <div class="header-left">
        <h3>收藏夹管理</h3>
        <el-text size="small" type="info">
          管理个人收藏夹，整理收藏的材质
        </el-text>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Plus"
          @click="showCreateDialog = true"
        >
          新建收藏夹
        </el-button>
      </div>
    </div>

    <!-- 收藏夹列表 -->
    <div class="favorite-list">
      <div
        v-for="favorite in favorites"
        :key="favorite.id"
        class="favorite-item"
        :class="{ 'selected': selectedFavorite?.id === favorite.id }"
        @click="handleSelectFavorite(favorite)"
      >
        <div class="favorite-cover">
          <div v-if="favorite.materials.length > 0" class="cover-grid">
            <img
              v-for="(material, index) in favorite.materials.slice(0, 4)"
              :key="material.id"
              :src="material.thumbnailUrl || material.ossPath"
              :alt="material.name"
              class="cover-image"
              :class="`cover-${index + 1}`"
            />
          </div>
          <div v-else class="empty-cover">
            <el-icon><Star /></el-icon>
          </div>
          
          <!-- 收藏夹操作 -->
          <div class="favorite-actions">
            <el-button
              circle
              size="small"
              :icon="Edit"
              @click.stop="handleEdit(favorite)"
              title="编辑"
            />
            <el-button
              circle
              size="small"
              type="danger"
              :icon="Delete"
              @click.stop="handleDelete(favorite)"
              title="删除"
            />
          </div>
        </div>

        <div class="favorite-info">
          <div class="favorite-name" :title="favorite.name">
            {{ favorite.name }}
          </div>
          <div class="favorite-meta">
            <span class="material-count">
              <el-icon><PictureFilled /></el-icon>
              {{ favorite.materials.length }} 个材质
            </span>
            <span class="create-time">
              {{ formatTime(favorite.createTime) }}
            </span>
          </div>
          <div v-if="favorite.description" class="favorite-description">
            {{ favorite.description }}
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="favorites.length === 0" class="empty-state">
        <el-icon><Star /></el-icon>
        <p>暂无收藏夹</p>
        <el-button
          type="primary"
          @click="showCreateDialog = true"
        >
          创建第一个收藏夹
        </el-button>
      </div>
    </div>

    <!-- 收藏夹详情 -->
    <div v-if="selectedFavorite" class="favorite-detail">
      <div class="detail-header">
        <div class="header-info">
          <h3>{{ selectedFavorite.name }}</h3>
          <div class="header-meta">
            <el-tag type="info">{{ selectedFavorite.materials.length }} 个材质</el-tag>
            <span class="create-time">创建于 {{ formatTime(selectedFavorite.createTime) }}</span>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            :icon="Edit"
            @click="handleEdit(selectedFavorite)"
          >
            编辑收藏夹
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            @click="handleDelete(selectedFavorite)"
          >
            删除收藏夹
          </el-button>
        </div>
      </div>

      <div v-if="selectedFavorite.description" class="detail-description">
        {{ selectedFavorite.description }}
      </div>

      <!-- 材质网格 -->
      <div class="materials-grid">
        <div
          v-for="material in selectedFavorite.materials"
          :key="material.id"
          class="material-card"
        >
          <div class="material-image-container">
            <img
              :src="material.thumbnailUrl || material.ossPath"
              :alt="material.name"
              class="material-image"
            />
            <div class="material-overlay">
              <el-button
                circle
                size="small"
                type="primary"
                :icon="ZoomIn"
                @click="handlePreview(material)"
                title="预览"
              />
              <el-button
                circle
                size="small"
                type="danger"
                :icon="Close"
                @click="handleRemoveFromFavorite(material)"
                title="移除收藏"
              />
            </div>
          </div>
          <div class="material-info">
            <div class="material-name">{{ material.name }}</div>
            <div class="material-format">{{ material.format.toUpperCase() }}</div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="selectedFavorite.materials.length === 0" class="empty-materials">
          <el-icon><PictureFilled /></el-icon>
          <p>收藏夹为空</p>
          <el-button type="primary">浏览材质库</el-button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑收藏夹弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingFavorite ? '编辑收藏夹' : '新建收藏夹'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="favoriteFormRef"
        :model="favoriteForm"
        :rules="favoriteFormRules"
        label-width="80px"
      >
        <el-form-item label="收藏夹名称" prop="name" required>
          <el-input
            v-model="favoriteForm.name"
            placeholder="请输入收藏夹名称"
            :maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="收藏夹描述" prop="description">
          <el-input
            v-model="favoriteForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入收藏夹描述（可选）"
            :maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="是否公开" prop="isPublic">
          <el-switch
            v-model="favoriteForm.isPublic"
            active-text="公开"
            inactive-text="私有"
          />
          <div class="form-hint">
            <el-text size="small" type="info">
              公开的收藏夹可以被其他用户查看
            </el-text>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
          >
            {{ editingFavorite ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 材质预览弹窗 -->
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
            :src="previewMaterial.ossPath"
            :alt="previewMaterial.name"
            class="preview-image"
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
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  Star,
  PictureFilled,
  ZoomIn,
  Close
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Material } from '../../types/material'

// 收藏夹接口定义
interface Favorite {
  id: number
  name: string
  description?: string
  isPublic: boolean
  materials: Material[]
  createTime: string
  updateTime: string
}

// Props
interface Props {
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

// Emits
const emit = defineEmits<{
  favoriteCreated: [favorite: Favorite]
  favoriteUpdated: [favorite: Favorite]
  favoriteDeleted: [favoriteId: number]
  materialRemoved: [favoriteId: number, materialId: number]
  close: []
}>()

// 响应式数据
const showCreateDialog = ref(false)
const showPreviewDialog = ref(false)
const editingFavorite = ref<Favorite | null>(null)
const selectedFavorite = ref<Favorite | null>(null)
const previewMaterial = ref<Material | null>(null)
const submitting = ref(false)
const favoriteFormRef = ref<FormInstance>()

// 收藏夹表单
const favoriteForm = ref({
  name: '',
  description: '',
  isPublic: false
})

// 模拟收藏夹数据
const favorites = ref<Favorite[]>([
  {
    id: 1,
    name: '我的最爱',
    description: '收藏的精选材质',
    isPublic: false,
    materials: [
      {
        id: 1,
        name: '高级皮革纹理',
        ossPath: '/images/leather-texture.jpg',
        thumbnailUrl: '/images/leather-texture-thumb.jpg',
        format: 'jpg',
        type: 0,
        userId: 1,
        uploadTime: '2024-01-15T10:30:00Z',
        downloadCount: 25,
        createTime: '2024-01-15T10:30:00Z',
        updateTime: '2024-01-15T10:30:00Z',
        deleted: 0
      },
      {
        id: 2,
        name: '现代布料材质',
        ossPath: '/images/fabric-texture.jpg',
        thumbnailUrl: '/images/fabric-texture-thumb.jpg',
        format: 'jpg',
        type: 1,
        userId: 1,
        uploadTime: '2024-01-16T14:20:00Z',
        downloadCount: 18,
        createTime: '2024-01-16T14:20:00Z',
        updateTime: '2024-01-16T14:20:00Z',
        deleted: 0
      }
    ],
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: '金属质感',
    description: '各种金属材质收藏',
    isPublic: true,
    materials: [
      {
        id: 3,
        name: '不锈钢纹理',
        ossPath: '/images/steel-texture.jpg',
        thumbnailUrl: '/images/steel-texture-thumb.jpg',
        format: 'jpg',
        type: 0,
        userId: 1,
        uploadTime: '2024-01-17T09:15:00Z',
        downloadCount: 12,
        createTime: '2024-01-17T09:15:00Z',
        updateTime: '2024-01-17T09:15:00Z',
        deleted: 0
      }
    ],
    createTime: '2024-01-16T11:00:00Z',
    updateTime: '2024-01-16T11:00:00Z'
  }
])

// 表单验证规则
const favoriteFormRules: FormRules = {
  name: [
    { required: true, message: '请输入收藏夹名称', trigger: 'blur' },
    { min: 1, max: 30, message: '收藏夹名称长度在 1 到 30 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const exists = favorites.value.some(fav => 
          fav.name === value && (!editingFavorite.value || fav.id !== editingFavorite.value.id)
        )
        if (exists) {
          callback(new Error('收藏夹名称已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 方法
const handleSelectFavorite = (favorite: Favorite) => {
  selectedFavorite.value = favorite
}

const handleEdit = (favorite: Favorite) => {
  editingFavorite.value = favorite
  favoriteForm.value = {
    name: favorite.name,
    description: favorite.description || '',
    isPublic: favorite.isPublic
  }
  showCreateDialog.value = true
}

const handleDelete = async (favorite: Favorite) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除收藏夹 "${favorite.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 模拟删除操作
    const index = favorites.value.findIndex(f => f.id === favorite.id)
    if (index > -1) {
      favorites.value.splice(index, 1)
      if (selectedFavorite.value?.id === favorite.id) {
        selectedFavorite.value = null
      }
      ElMessage.success('收藏夹删除成功')
      emit('favoriteDeleted', favorite.id)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handlePreview = (material: Material) => {
  previewMaterial.value = material
  showPreviewDialog.value = true
}

const handleRemoveFromFavorite = async (material: Material) => {
  if (!selectedFavorite.value) return

  try {
    await ElMessageBox.confirm(
      `确定要从收藏夹中移除 "${material.name}" 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 从收藏夹中移除材质
    const materialIndex = selectedFavorite.value.materials.findIndex(m => m.id === material.id)
    if (materialIndex > -1) {
      selectedFavorite.value.materials.splice(materialIndex, 1)
      ElMessage.success('材质已从收藏夹中移除')
      emit('materialRemoved', selectedFavorite.value.id, material.id)
    }
  } catch (error) {
    // 用户取消移除
  }
}

const handleSubmit = async () => {
  if (!favoriteFormRef.value) return

  try {
    await favoriteFormRef.value.validate()
    submitting.value = true

    // 模拟提交操作
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingFavorite.value) {
      // 更新收藏夹
      const index = favorites.value.findIndex(f => f.id === editingFavorite.value!.id)
      if (index > -1) {
        favorites.value[index] = {
          ...favorites.value[index],
          ...favoriteForm.value,
          updateTime: new Date().toISOString()
        }
        ElMessage.success('收藏夹更新成功')
        emit('favoriteUpdated', favorites.value[index])
      }
    } else {
      // 创建新收藏夹
      const newFavorite: Favorite = {
        id: Date.now(),
        ...favoriteForm.value,
        materials: [],
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      favorites.value.unshift(newFavorite)
      ElMessage.success('收藏夹创建成功')
      emit('favoriteCreated', newFavorite)
    }

    handleCancel()
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  showCreateDialog.value = false
  editingFavorite.value = null
  favoriteForm.value = {
    name: '',
    description: '',
    isPublic: false
  }
  favoriteFormRef.value?.resetFields()
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days < 1) {
    return '今天'
  } else if (days < 30) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString()
  }
}

// 生命周期
onMounted(() => {
  // 默认选择第一个收藏夹
  if (favorites.value.length > 0) {
    selectedFavorite.value = favorites.value[0]
  }
})
</script>

<style scoped>
.favorite-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.favorite-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 20px;
}

.favorite-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
}

.favorite-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.favorite-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.favorite-item.selected {
  border-color: #c8ad7f;
  background: rgba(200, 173, 127, 0.2);
}

.favorite-cover {
  position: relative;
  width: 100%;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.cover-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  width: 100%;
  height: 100%;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-1 {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.empty-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.empty-cover .el-icon {
  font-size: 32px;
}

.favorite-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.favorite-item:hover .favorite-actions {
  opacity: 1;
}

.favorite-info {
  color: white;
}

.favorite-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.favorite-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.material-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.favorite-description {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.favorite-detail {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-info h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 20px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-description {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.material-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.3s ease;
}

.material-card:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.15);
}

.material-image-container {
  position: relative;
  width: 100%;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.material-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.material-card:hover .material-overlay {
  opacity: 1;
}

.material-info {
  color: white;
  text-align: center;
}

.material-name {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.material-format {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state,
.empty-materials {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);
  grid-column: 1 / -1;
}

.empty-state .el-icon,
.empty-materials .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state p,
.empty-materials p {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.form-hint {
  margin-top: 4px;
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
  .favorite-manager-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .favorite-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
    padding: 16px;
  }
  
  .detail-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .materials-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .preview-content {
    flex-direction: column;
  }
  
  .preview-info {
    width: 100%;
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

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

:deep(.el-input__inner) {
  color: white;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #c8ad7f;
}
</style>