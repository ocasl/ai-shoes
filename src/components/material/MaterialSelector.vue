<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择材质"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="material-selector-dialog"
  >
    <div class="selector-container">
      <!-- 快速访问区域 -->
      <div class="quick-access-section" v-if="showQuickAccess">
        <div class="quick-access-tabs">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="全部材质" name="all" />
            <el-tab-pane label="最近使用" name="recent" v-if="materialStore.recentMaterials.length > 0" />
            <el-tab-pane label="我的收藏" name="favorites" v-if="materialStore.favoriteMaterials.length > 0" />
          </el-tabs>
        </div>
      </div>

      <!-- 搜索筛选区域 -->
      <div class="search-section">
        <MaterialSearchFilter
          v-model:search-query="searchQuery"
          v-model:filter-options="filterOptions"
          @search="handleSearch"
          @filter="handleFilter"
          @clear="handleClearFilters"
        />
      </div>

      <!-- 材质展示区域 -->
      <div class="materials-section">
        <MaterialGrid
          :materials="displayMaterials"
          :loading="materialStore.loading"
          mode="select"
          :multiple="multiple"
          :selected-materials="selectedMaterials"
          @material-click="handleMaterialClick"
          @material-select="handleMaterialSelect"
          @material-action="handleMaterialAction"
        />
      </div>

      <!-- 分页区域 -->
      <div class="pagination-section" v-if="showPagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[12, 24, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          small
        />
      </div>

      <!-- 空状态 -->
      <div v-if="!materialStore.loading && displayMaterials.length === 0" class="empty-state">
        <el-empty description="暂无材质数据">
          <el-button type="primary" @click="handleTabChange('all')">
            查看全部材质
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 选择信息栏 -->
    <div class="selection-info" v-if="selectedMaterials.length > 0">
      <div class="selection-count">
        已选择 {{ selectedMaterials.length }} 个材质
        <span v-if="!multiple" class="single-select-hint">（单选模式）</span>
      </div>
      <div class="selected-materials-preview">
        <div
          v-for="material in selectedMaterials.slice(0, 5)"
          :key="material.id"
          class="selected-material-item"
        >
          <img :src="material.thumbnailUrl || material.ossPath" :alt="material.name" />
          <span class="material-name">{{ material.name }}</span>
          <el-button
            circle
            size="small"
            type="danger"
            :icon="Close"
            @click="handleRemoveSelection(material)"
          />
        </div>
        <div v-if="selectedMaterials.length > 5" class="more-count">
          +{{ selectedMaterials.length - 5 }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button
            v-if="selectedMaterials.length > 0"
            @click="handleClearSelection"
            :icon="Delete"
          >
            清除选择
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            type="primary"
            @click="handleConfirm"
            :disabled="selectedMaterials.length === 0"
          >
            确定选择 ({{ selectedMaterials.length }})
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Close, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Material, MaterialFilterOptions } from '../../types/material'
import { useMaterialStore } from '../../store/material'
import MaterialSearchFilter from './MaterialSearchFilter.vue'
import MaterialGrid from './MaterialGrid.vue'

// Props
interface Props {
  visible: boolean
  multiple?: boolean
  selectedMaterials?: Material[]
  filterOptions?: MaterialFilterOptions
  showQuickAccess?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  multiple: false,
  selectedMaterials: () => [],
  filterOptions: () => ({}),
  showQuickAccess: true
})

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  select: [materials: Material[]]
  cancel: []
}>()

// Store
const materialStore = useMaterialStore()

// 响应式数据
const dialogVisible = ref(props.visible)
const activeTab = ref('all')
const searchQuery = ref('')
const filterOptions = ref<MaterialFilterOptions>({ ...props.filterOptions })
const selectedMaterials = ref<Material[]>([...props.selectedMaterials])
const currentPage = ref(1)
const pageSize = ref(12)

// 计算属性
const displayMaterials = computed(() => {
  switch (activeTab.value) {
    case 'recent':
      return materialStore.recentMaterials
    case 'favorites':
      return materialStore.favoriteMaterials
    default:
      return materialStore.materials
  }
})

const total = computed(() => {
  switch (activeTab.value) {
    case 'recent':
      return materialStore.recentMaterials.length
    case 'favorites':
      return materialStore.favoriteMaterials.length
    default:
      return materialStore.total
  }
})

const showPagination = computed(() => {
  return activeTab.value === 'all' && total.value > pageSize.value
})

// 方法
const handleTabChange = async (tabName: string) => {
  activeTab.value = tabName
  
  if (tabName === 'all') {
    // 重新加载材质列表
    await loadMaterials()
  }
}

const handleSearch = async (query: string) => {
  if (activeTab.value === 'all') {
    await materialStore.searchMaterials(query)
  }
}

const handleFilter = async (filters: MaterialFilterOptions) => {
  if (activeTab.value === 'all') {
    await materialStore.filterMaterials(filters)
  }
}

const handleClearFilters = async () => {
  searchQuery.value = ''
  filterOptions.value = {}
  if (activeTab.value === 'all') {
    await materialStore.clearFilters()
  }
}

const handleMaterialClick = (material: Material) => {
  handleMaterialSelect(material)
}

const handleMaterialSelect = (material: Material) => {
  if (props.multiple) {
    const index = selectedMaterials.value.findIndex(m => m.id === material.id)
    if (index > -1) {
      selectedMaterials.value.splice(index, 1)
    } else {
      selectedMaterials.value.push(material)
    }
  } else {
    selectedMaterials.value = [material]
  }
}

const handleMaterialAction = async (action: string, material: Material) => {
  try {
    switch (action) {
      case 'download':
        await materialStore.downloadMaterialFile(material.id)
        ElMessage.success('材质下载成功')
        break
      case 'favorite':
        materialStore.toggleFavorite(material)
        ElMessage.success(material.isFavorite ? '已取消收藏' : '已添加到收藏')
        break
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleRemoveSelection = (material: Material) => {
  const index = selectedMaterials.value.findIndex(m => m.id === material.id)
  if (index > -1) {
    selectedMaterials.value.splice(index, 1)
  }
}

const handleClearSelection = () => {
  selectedMaterials.value = []
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadMaterials()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadMaterials()
}

const handleConfirm = () => {
  if (selectedMaterials.value.length > 0) {
    emit('select', [...selectedMaterials.value])
    handleClose()
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('cancel')
}

const loadMaterials = async () => {
  try {
    await materialStore.fetchMaterials({
      current: currentPage.value,
      size: pageSize.value,
      name: searchQuery.value || undefined,
      ...filterOptions.value
    })
  } catch (error) {
    ElMessage.error('加载材质列表失败')
  }
}

// 生命周期
onMounted(async () => {
  // 初始化Store
  materialStore.initializeStore()
  
  // 加载材质列表
  if (props.visible) {
    await loadMaterials()
  }
})

// 监听props变化
watch(() => props.visible, async (newValue) => {
  dialogVisible.value = newValue
  if (newValue) {
    // 重置状态
    activeTab.value = 'all'
    searchQuery.value = ''
    filterOptions.value = { ...props.filterOptions }
    selectedMaterials.value = [...props.selectedMaterials]
    currentPage.value = 1
    
    // 加载材质列表
    await loadMaterials()
  }
})

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})

watch(() => props.selectedMaterials, (newValue) => {
  selectedMaterials.value = [...newValue]
}, { deep: true })
</script>

<style scoped>
.material-selector-dialog {
  --el-dialog-bg-color: #fff;
}

.selector-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 70vh;
}

.quick-access-section {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.search-section {
  flex-shrink: 0;
}

.materials-section {
  flex: 1;
  overflow-y: auto;
  min-height: 300px;
  max-height: 400px;
}

.pagination-section {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.selection-info {
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-top: 1px solid #e0e0e0;
}

.selection-count {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.single-select-hint {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}

.selected-materials-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.selected-material-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
}

.selected-material-item img {
  width: 24px;
  height: 24px;
  object-fit: cover;
  border-radius: 4px;
}

.material-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-count {
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-selector-dialog {
    --el-dialog-width: 95% !important;
  }
  
  .selector-container {
    max-height: 60vh;
  }
  
  .materials-section {
    max-height: 300px;
  }
  
  .selected-materials-preview {
    flex-direction: column;
    align-items: stretch;
  }
  
  .selected-material-item {
    justify-content: space-between;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .footer-right {
    justify-content: center;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-tabs__item) {
  font-size: 14px;
}

:deep(.el-tabs__active-bar) {
  background-color: #c8ad7f;
}

:deep(.el-tabs__item.is-active) {
  color: #c8ad7f;
}

:deep(.el-pagination) {
  --el-pagination-font-size: 12px;
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%);
}
</style>