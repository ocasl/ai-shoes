<template>
  <div class="category-manager">
    <!-- 分类管理头部 -->
    <div class="category-manager-header">
      <div class="header-left">
        <h3>分类管理</h3>
        <el-text size="small" type="info">
          管理材质分类，支持层级结构和拖拽排序
        </el-text>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Plus"
          @click="handleCreate()"
        >
          新建分类
        </el-button>
      </div>
    </div>

    <!-- 分类树 -->
    <div class="category-tree-container">
      <el-tree
        ref="treeRef"
        :data="categoryTree"
        :props="treeProps"
        :expand-on-click-node="false"
        :default-expand-all="true"
        draggable
        @node-drop="handleNodeDrop"
        @node-click="handleNodeClick"
        class="category-tree"
      >
        <template #default="{ node, data }">
          <div class="category-node">
            <div class="node-content">
              <div class="node-info">
                <el-icon v-if="data.icon" class="category-icon">
                  <component :is="data.icon" />
                </el-icon>
                <span class="category-name">{{ data.name }}</span>
                <el-tag
                  v-if="data.materialCount > 0"
                  size="small"
                  type="info"
                  class="material-count"
                >
                  {{ data.materialCount }}
                </el-tag>
              </div>
              
              <div class="node-actions">
                <el-button
                  size="small"
                  :icon="Plus"
                  @click.stop="handleCreate(data)"
                  title="添加子分类"
                />
                <el-button
                  size="small"
                  :icon="Edit"
                  @click.stop="handleEdit(data)"
                  title="编辑"
                />
                <el-button
                  size="small"
                  type="danger"
                  :icon="Delete"
                  @click.stop="handleDelete(data)"
                  title="删除"
                  :disabled="data.children && data.children.length > 0"
                />
              </div>
            </div>
            
            <div v-if="data.description" class="node-description">
              {{ data.description }}
            </div>
          </div>
        </template>
      </el-tree>

      <!-- 空状态 -->
      <div v-if="categoryTree.length === 0" class="empty-state">
        <el-icon><FolderOpened /></el-icon>
        <p>暂无分类</p>
        <el-button
          type="primary"
          @click="handleCreate()"
        >
          创建第一个分类
        </el-button>
      </div>
    </div>

    <!-- 创建/编辑分类弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="editingCategory ? '编辑分类' : '新建分类'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryFormRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name" required>
          <el-input
            v-model="categoryForm.name"
            placeholder="请输入分类名称"
            :maxlength="30"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="父级分类" prop="parentId">
          <el-tree-select
            v-model="categoryForm.parentId"
            :data="categoryTreeForSelect"
            :props="treeSelectProps"
            placeholder="选择父级分类（可选）"
            clearable
            check-strictly
            :render-after-expand="false"
          />
        </el-form-item>

        <el-form-item label="分类图标" prop="icon">
          <el-select
            v-model="categoryForm.icon"
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

        <el-form-item label="排序权重" prop="sort">
          <el-input-number
            v-model="categoryForm.sort"
            :min="0"
            :max="999"
            placeholder="数值越大排序越靠前"
          />
        </el-form-item>

        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述（可选）"
            :maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="是否启用" prop="enabled">
          <el-switch
            v-model="categoryForm.enabled"
            active-text="启用"
            inactive-text="禁用"
          />
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
            {{ editingCategory ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分类详情侧边栏 -->
    <el-drawer
      v-model="showDetailDrawer"
      title="分类详情"
      direction="rtl"
      size="400px"
    >
      <div v-if="selectedCategory" class="category-detail">
        <div class="detail-header">
          <div class="category-title">
            <el-icon v-if="selectedCategory.icon" class="title-icon">
              <component :is="selectedCategory.icon" />
            </el-icon>
            <h3>{{ selectedCategory.name }}</h3>
          </div>
          <div class="category-path">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item
                v-for="item in getCategoryPath(selectedCategory)"
                :key="item.id"
              >
                {{ item.name }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>

        <div class="detail-content">
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">材质数量:</span>
                <span class="value">{{ selectedCategory.materialCount }}</span>
              </div>
              <div class="info-item">
                <span class="label">子分类:</span>
                <span class="value">{{ selectedCategory.children?.length || 0 }}</span>
              </div>
              <div class="info-item">
                <span class="label">排序权重:</span>
                <span class="value">{{ selectedCategory.sort }}</span>
              </div>
              <div class="info-item">
                <span class="label">状态:</span>
                <el-tag :type="selectedCategory.enabled ? 'success' : 'danger'">
                  {{ selectedCategory.enabled ? '启用' : '禁用' }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="label">创建时间:</span>
                <span class="value">{{ formatTime(selectedCategory.createTime) }}</span>
              </div>
              <div class="info-item">
                <span class="label">更新时间:</span>
                <span class="value">{{ formatTime(selectedCategory.updateTime) }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedCategory.description" class="detail-section">
            <h4>分类描述</h4>
            <p class="description">{{ selectedCategory.description }}</p>
          </div>

          <div v-if="selectedCategory.children && selectedCategory.children.length > 0" class="detail-section">
            <h4>子分类</h4>
            <div class="subcategory-list">
              <div
                v-for="child in selectedCategory.children"
                :key="child.id"
                class="subcategory-item"
                @click="handleNodeClick(null, { data: child })"
              >
                <el-icon v-if="child.icon">
                  <component :is="child.icon" />
                </el-icon>
                <span>{{ child.name }}</span>
                <el-tag size="small" type="info">{{ child.materialCount }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <el-button
            type="primary"
            :icon="Edit"
            @click="handleEdit(selectedCategory)"
          >
            编辑分类
          </el-button>
          <el-button
            :icon="Plus"
            @click="handleCreate(selectedCategory)"
          >
            添加子分类
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  FolderOpened,
  Folder,
  Files,
  Picture,
  Box,
  Star,
  Crown
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 分类接口定义
interface Category {
  id: number
  name: string
  parentId?: number
  icon?: string
  description?: string
  sort: number
  enabled: boolean
  materialCount: number
  createTime: string
  updateTime: string
  children?: Category[]
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
  categoryCreated: [category: Category]
  categoryUpdated: [category: Category]
  categoryDeleted: [categoryId: number]
  close: []
}>()

// 响应式数据
const treeRef = ref()
const categoryFormRef = ref<FormInstance>()
const showDialog = ref(false)
const showDetailDrawer = ref(false)
const editingCategory = ref<Category | null>(null)
const selectedCategory = ref<Category | null>(null)
const submitting = ref(false)

// 分类表单
const categoryForm = ref({
  name: '',
  parentId: undefined as number | undefined,
  icon: '',
  description: '',
  sort: 0,
  enabled: true
})

// 模拟分类数据
const categories = ref<Category[]>([
  {
    id: 1,
    name: '材质类型',
    icon: 'folder',
    description: '按材质类型分类',
    sort: 100,
    enabled: true,
    materialCount: 28,
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-15T10:30:00Z',
    children: [
      {
        id: 2,
        name: '皮革',
        parentId: 1,
        icon: 'star',
        description: '各种皮革材质',
        sort: 90,
        enabled: true,
        materialCount: 15,
        createTime: '2024-01-15T11:00:00Z',
        updateTime: '2024-01-15T11:00:00Z'
      },
      {
        id: 3,
        name: '布料',
        parentId: 1,
        icon: 'files',
        description: '纺织布料材质',
        sort: 80,
        enabled: true,
        materialCount: 8,
        createTime: '2024-01-15T11:30:00Z',
        updateTime: '2024-01-15T11:30:00Z'
      },
      {
        id: 4,
        name: '金属',
        parentId: 1,
        icon: 'crown',
        description: '金属质感材质',
        sort: 70,
        enabled: true,
        materialCount: 5,
        createTime: '2024-01-15T12:00:00Z',
        updateTime: '2024-01-15T12:00:00Z'
      }
    ]
  },
  {
    id: 5,
    name: '风格分类',
    icon: 'picture',
    description: '按设计风格分类',
    sort: 90,
    enabled: true,
    materialCount: 12,
    createTime: '2024-01-16T10:30:00Z',
    updateTime: '2024-01-16T10:30:00Z',
    children: [
      {
        id: 6,
        name: '现代简约',
        parentId: 5,
        icon: 'box',
        description: '现代简约风格材质',
        sort: 90,
        enabled: true,
        materialCount: 7,
        createTime: '2024-01-16T11:00:00Z',
        updateTime: '2024-01-16T11:00:00Z'
      },
      {
        id: 7,
        name: '复古经典',
        parentId: 5,
        icon: 'star',
        description: '复古经典风格材质',
        sort: 80,
        enabled: true,
        materialCount: 5,
        createTime: '2024-01-16T11:30:00Z',
        updateTime: '2024-01-16T11:30:00Z'
      }
    ]
  }
])

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

const treeSelectProps = {
  children: 'children',
  label: 'name',
  value: 'id'
}

// 可用图标
const availableIcons = [
  { label: '文件夹', value: 'folder', component: Folder },
  { label: '文件', value: 'files', component: Files },
  { label: '图片', value: 'picture', component: Picture },
  { label: '盒子', value: 'box', component: Box },
  { label: '星星', value: 'star', component: Star },
  { label: '皇冠', value: 'crown', component: Crown }
]

// 表单验证规则
const categoryFormRules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 30, message: '分类名称长度在 1 到 30 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const categoryTree = computed(() => {
  return buildTree(categories.value)
})

const categoryTreeForSelect = computed(() => {
  // 编辑时排除自己和子节点
  if (editingCategory.value) {
    return buildTree(categories.value.filter(cat => 
      cat.id !== editingCategory.value!.id && 
      !isDescendant(cat, editingCategory.value!.id)
    ))
  }
  return categoryTree.value
})

// 方法
const buildTree = (items: Category[]): Category[] => {
  const tree: Category[] = []
  const map = new Map<number, Category>()

  // 创建映射
  items.forEach(item => {
    map.set(item.id, { ...item, children: [] })
  })

  // 构建树结构
  items.forEach(item => {
    const node = map.get(item.id)!
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!
      if (!parent.children) parent.children = []
      parent.children.push(node)
    } else {
      tree.push(node)
    }
  })

  // 按排序权重排序
  const sortTree = (nodes: Category[]) => {
    nodes.sort((a, b) => b.sort - a.sort)
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children)
      }
    })
  }

  sortTree(tree)
  return tree
}

const isDescendant = (category: Category, ancestorId: number): boolean => {
  if (category.parentId === ancestorId) {
    return true
  }
  if (category.parentId) {
    const parent = categories.value.find(c => c.id === category.parentId)
    if (parent) {
      return isDescendant(parent, ancestorId)
    }
  }
  return false
}

const getCategoryPath = (category: Category): Category[] => {
  const path: Category[] = []
  let current = category

  while (current) {
    path.unshift(current)
    if (current.parentId) {
      const parent = findCategoryById(current.parentId)
      current = parent!
    } else {
      break
    }
  }

  return path
}

const findCategoryById = (id: number): Category | null => {
  const findInTree = (nodes: Category[]): Category | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node
      }
      if (node.children) {
        const found = findInTree(node.children)
        if (found) return found
      }
    }
    return null
  }

  return findInTree(categories.value)
}

const handleCreate = (parent?: Category) => {
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    parentId: parent?.id,
    icon: '',
    description: '',
    sort: 0,
    enabled: true
  }
  showDialog.value = true
}

const handleEdit = (category: Category) => {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    parentId: category.parentId,
    icon: category.icon || '',
    description: category.description || '',
    sort: category.sort,
    enabled: category.enabled
  }
  showDialog.value = true
  showDetailDrawer.value = false
}

const handleDelete = async (category: Category) => {
  if (category.children && category.children.length > 0) {
    ElMessage.warning('该分类下还有子分类，无法删除')
    return
  }

  if (category.materialCount > 0) {
    ElMessage.warning('该分类下还有材质，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 模拟删除操作
    const index = categories.value.findIndex(c => c.id === category.id)
    if (index > -1) {
      categories.value.splice(index, 1)
      ElMessage.success('分类删除成功')
      emit('categoryDeleted', category.id)
    }
  } catch (error) {
    // 用户取消删除
  }
}

const handleNodeClick = (data: any, node: any) => {
  selectedCategory.value = node.data
  showDetailDrawer.value = true
}

const handleNodeDrop = (draggingNode: any, dropNode: any, dropType: string) => {
  // 处理拖拽排序逻辑
  console.log('Node dropped:', draggingNode, dropNode, dropType)
  ElMessage.success('分类排序已更新')
}

const handleSubmit = async () => {
  if (!categoryFormRef.value) return

  try {
    await categoryFormRef.value.validate()
    submitting.value = true

    // 模拟提交操作
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (editingCategory.value) {
      // 更新分类
      const index = categories.value.findIndex(c => c.id === editingCategory.value!.id)
      if (index > -1) {
        categories.value[index] = {
          ...categories.value[index],
          ...categoryForm.value,
          updateTime: new Date().toISOString()
        }
        ElMessage.success('分类更新成功')
        emit('categoryUpdated', categories.value[index])
      }
    } else {
      // 创建新分类
      const newCategory: Category = {
        id: Date.now(),
        ...categoryForm.value,
        materialCount: 0,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
      categories.value.push(newCategory)
      ElMessage.success('分类创建成功')
      emit('categoryCreated', newCategory)
    }

    handleCancel()
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  showDialog.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    parentId: undefined,
    icon: '',
    description: '',
    sort: 0,
    enabled: true
  }
  categoryFormRef.value?.resetFields()
}

const formatTime = (timeString: string) => {
  const date = new Date(timeString)
  return date.toLocaleString()
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.category-manager {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.category-manager-header {
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

.category-tree-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 16px;
  min-height: 400px;
}

.category-tree {
  background: transparent;
}

:deep(.el-tree-node__content) {
  background: transparent;
  border-radius: 6px;
  margin-bottom: 4px;
  padding: 8px;
  transition: all 0.3s ease;
}

:deep(.el-tree-node__content:hover) {
  background: rgba(255, 255, 255, 0.1);
}

.category-node {
  width: 100%;
  color: white;
}

.node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.category-icon {
  color: #c8ad7f;
}

.category-name {
  font-weight: 500;
}

.material-count {
  margin-left: 8px;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-node:hover .node-actions {
  opacity: 1;
}

.node-description {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  padding-left: 24px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
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

.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-detail {
  padding: 20px;
  color: #333;
}

.detail-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.title-icon {
  font-size: 24px;
  color: #c8ad7f;
}

.category-title h3 {
  margin: 0;
  font-size: 20px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #666;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  color: #333;
}

.description {
  margin: 0;
  line-height: 1.6;
  color: #666;
}

.subcategory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subcategory-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.subcategory-item:hover {
  background: #e8e8e8;
}

.detail-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .category-manager {
    padding: 16px;
  }
  
  .category-manager-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .node-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .node-actions {
    opacity: 1;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-actions {
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

:deep(.el-tree) {
  background: transparent;
  color: white;
}

:deep(.el-tree-node__expand-icon) {
  color: rgba(255, 255, 255, 0.7);
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

:deep(.el-drawer__body) {
  padding: 0;
}
</style>