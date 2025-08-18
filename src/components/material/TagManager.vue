<template>
  <div class="tag-manager">
    <!-- 标签管理头部 -->
    <div class="tag-manager-header">
      <div class="header-left">
        <h3>标签管理</h3>
        <el-text size="small" type="info">
          管理材质标签，支持创建、编辑和删除标签
        </el-text>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Plus"
          @click="showCreateDialog = true"
        >
          新建标签
        </el-button>
      </div>
    </div>

    <!-- 标签搜索 -->
    <div class="tag-search">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索标签..."
        :prefix-icon="Search"
        clearable
        @input="handleSearch"
      />
    </div>

    <!-- 标签列表 -->
    <div class="tag-list">
      <div
        v-for="tag in filteredTags"
        :key="tag.id"
        class="tag-item"
        :class="{ 'selected': selectedTags.includes(tag.id) }"
      >
        <div class="tag-content">
          <div class="tag-info">
            <el-tag
              :color="tag.color"
              :style="{ color: getTextColor(tag.color) }"
              class="tag-display"
            >
              {{ tag.name }}
            </el-tag>
            <div class="tag-meta">
              <span class="material-count">{{ tag.materialCount }} 个材质</span>
              <span class="create-time">{{ formatTime(tag.createTime) }}</span>
            </div>
          </div>
          
          <div class="tag-actions">
            <el-button
              size="small"
              :icon="Edit"
              @click="handleEdit(tag)"
              title="编辑"
            />
            <el-button
              size="small"
              type="danger"
              :icon="Delete"
              @click="handleDelete(tag)"
              title="删除"
              :disabled="tag.materialCount > 0"
            />
          </div>
        </div>

        <!-- 标签描述 -->
        <div v-if="tag.description" class="tag-description">
          {{ tag.description }}
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredTags.length === 0" class="empty-state">
        <el-icon><PriceTag /></el-icon>
        <p>{{ searchKeyword ? '未找到匹配的标签' : '暂无标签' }}</p>
        <el-button
          v-if="!searchKeyword"
          type="primary"
          @click="showCreateDialog = true"
        >
          创建第一个标签
        </el-button>
      </div>
    </div>

    <!-- 创建/编辑标签弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTag ? '编辑标签' : '新建标签'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagFormRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name" required>
          <el-input
            v-model="tagForm.name"
            placeholder="请输入标签名称"
            :maxlength="20"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标签颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker
              v-model="tagForm.color"
              :predefine="predefineColors"
              show-alpha
            />
            <el-input
              v-model="tagForm.color"
              placeholder="#FFFFFF"
              class="color-input"
            />
          </div>
        </el-form-item>

        <el-form-item label="标签描述" prop="description">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述（可选）"
            :maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标签图标" prop="icon">
          <el-select
            v-model="tagForm.icon"
            placeholder="选择图标（可选）"
            clearable
          >
            <el-option
              v-for="icon in availableIcons"
              :key="icon.value"
              :label="icon.label"
              :value="icon.value"
            >
              <div class="icon-option">
                <el-icon><component :is="icon.component" /></el-icon>
                <span>{{ icon.label }}</span>
              </div>
            </el-option>
          </el-select>
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
            {{ editingTag ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedTags.length > 0" class="batch-toolbar">
      <div class="selected-info">
        已选择 {{ selectedTags.length }} 个标签
      </div>
      <div class="batch-actions">
        <el-button
          size="small"
          type="danger"
          :icon="Delete"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button
          size="small"
          @click="selectedTags = []"
        >
          取消选择
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  Search,
  Edit,
  Delete,
  PriceTag,
  Star,
  Heart,
  Lightning,
  Fire,
  Crown,
  Diamond
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 标签接口定义
interface Tag {
  id: number
  name: string
  color: string
  description?: string
  icon?: string
  materialCount: number
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
  tagCreated: [tag: Tag]
  tagUpdated: [tag: Tag]
  tagDeleted: [tagId: number]
  close: []
}>()

// 响应式数据
const searchKeyword = ref('')
const showCreateDialog = ref(false)
const editingTag = ref<Tag | null>(null)
const submitting = ref(false)
const selectedTags = ref<number[]>([])
const tagFormRef = ref<FormInstance>()

// 标签表单
const tagForm = ref({
  name: '',
  color: '#409EFF',
  description: '',
  icon: ''
})

// 模拟标签数据
const tags = ref<Tag[]>([
  {
    id: 1,
    name: '皮革',
    color: '#8B4513',
    description: '各种皮革材质',
    icon: 'star',
    materialCount: 15,
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: '布料',
    color: '#4CAF50',
    description: '纺织布料材质',
    icon: 'heart',
    materialCount: 8,
    createTime: '2024-01-16T14:20:00Z',
    updateTime: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    name: '金属',
    color: '#9E9E9E',
    description: '金属质感材质',
    icon: 'diamond',
    materialCount: 5,
    createTime: '2024-01-17T09:15:00Z',
    updateTime: '2024-01-17T09:15:00Z'
  }
])

// 预定义颜色
const predefineColors = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  '#8b4513',
  '#9e9e9e',
  '#000000'
]

// 可用图标
const availableIcons = [
  { label: '星星', value: 'star', component: Star },
  { label: '心形', value: 'heart', component: Heart },
  { label: '闪电', value: 'lightning', component: Lightning },
  { label: '火焰', value: 'fire', component: Fire },
  { label: '皇冠', value: 'crown', component: Crown },
  { label: '钻石', value: 'diamond', component: Diamond }
]

// 表单验证规则
const tagFormRules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 1, max: 20, message: '标签名称长度在 1 到 20 个字符', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        const exists = tags.value.some(tag => 
          tag.name === value && (!editingTag.value || tag.id !== editingTag.value.id)
        )
        if (exists) {
          callback(new Error('标签名称已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  color: [
    { required: true, message: '请选择标签颜色', trigger: 'change' }
  ]
}

// 计算属性
const filteredTags = computed(() => {
  if (!searchKeyword.value) {
    return tags.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return tags.value.filter(tag =>
    tag.name.toLowerCase().includes(keyword) ||
    tag.description?.toLowerCase().includes(keyword)
  )
})

// 方法
const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const handleEdit = (tag: Tag) => {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    color: tag.color,
    description: tag.description || '',
    icon: tag.icon || ''
  }
  showCreateDialog.value = true
}

const handleDelete = async (tag: Tag) => {
  if (tag.materialCount > 0) {
    ElMessage.warning('该标签下还有材质，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 模拟删除操作
    const index = tags.value.findIndex(t => t.id === tag.id)
    if (index > -1) {
      tags.value.splice(index, 1)
      ElMessage.success('标签删除成功')
      emit('tagDeleted', tag.id)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleBatchDelete = async () => {
  const selectedTagsData = tags.value.filter(tag => selectedTags.value.includes(tag.id))
  const cannotDelete = selectedTagsData.filter(tag => tag.materialCount > 0)
  
  if (cannotDelete.length > 0) {
    ElMessage.warning(`有 ${cannotDelete.length} 个标签下还有材质，无法删除`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTags.value.length} 个标签吗？此操作不可恢复。`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 模拟批量删除操作
    tags.value = tags.value.filter(tag => !selectedTags.value.includes(tag.id))
    selectedTags.value = []
    ElMessage.success('批量删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const handleSubmit = async () => {
  if (!tagFormRef.value) return

  try {
    await tagFormRef.value.validate()
    submitting.value = true

    // 模拟提交操作
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingTag.value) {
      // 更新标签
      const index = tags.value.findIndex(t => t.id === editingTag.value!.id)
      if (index > -1) {
        tags.value[index] = {
          ...tags.value[index],
          ...tagForm.value,
          updateTime: new Date().toISOString()
        }
        ElMessage.success('标签更新成功')
        emit('tagUpdated', tags.value[index])
      }
    } else {
      // 创建新标签
      const newTag: Tag = {
        id: Date.now(),
        ...tagForm.value,
        materialCount: 0,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      tags.value.unshift(newTag)
      ElMessage.success('标签创建成功')
      emit('tagCreated', newTag)
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
  editingTag.value = null
  tagForm.value = {
    name: '',
    color: '#409EFF',
    description: '',
    icon: ''
  }
  tagFormRef.value?.resetFields()
}

const getTextColor = (backgroundColor: string): string => {
  // 简单的颜色对比度计算
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#FFFFFF'
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleDateString()
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.tag-manager {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.tag-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-left h3 {
  margin: 0 0 8px 0;
  color: white;
  font-size: 20px;
}

.tag-search {
  margin-bottom: 20px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.tag-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.tag-item:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
}

.tag-item.selected {
  border-color: #c8ad7f;
  background: rgba(200, 173, 127, 0.2);
}

.tag-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-display {
  font-weight: 600;
  border: none;
}

.tag-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.tag-actions {
  display: flex;
  gap: 8px;
}

.tag-description {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state p {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 120px;
}

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.selected-info {
  font-size: 14px;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-manager {
    padding: 16px;
  }
  
  .tag-manager-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .tag-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .tag-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .batch-toolbar {
    left: 10px;
    right: 10px;
    transform: none;
    flex-direction: column;
    gap: 12px;
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

:deep(.el-color-picker__trigger) {
  border: 2px solid rgba(255, 255, 255, 0.3);
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
</style>