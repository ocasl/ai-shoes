<template>
  <div class="material-library-container">
    <!-- 头部工具栏 -->
    <div class="library-header">
      <div class="header-left">
        <h2 class="library-title">材质库管理</h2>
        <div class="library-stats">
          <span class="stat-item">
            <el-icon><Collection /></el-icon>
            总计 {{ materialStore.total }} 个材质
          </span>
          <span class="stat-item" v-if="materialStore.selectedMaterials.length > 0">
            <el-icon><Select /></el-icon>
            已选择 {{ materialStore.selectedMaterials.length }} 个
          </span>
        </div>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          :icon="Plus" 
          @click="showUploadDialog = true"
          :loading="materialStore.uploading"
        >
          上传材质
        </el-button>
        <el-button 
          v-if="mode === 'select' && materialStore.selectedMaterials.length > 0"
          type="success"
          :icon="Check"
          @click="handleConfirmSelection"
        >
          确认选择
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-filter-section">
      <MaterialSearchFilter 
        v-model:search-query="searchQuery"
        v-model:filter-options="filterOptions"
        @search="handleSearch"
        @filter="handleFilter"
        @clear="handleClearFilters"
      />
    </div>

    <!-- 材质网格展示区域 -->
    <div class="materials-content">
      <MaterialGrid
        :materials="materialStore.materials"
        :loading="materialStore.loading"
        :mode="mode"
        :multiple="multiple"
        :selected-materials="materialStore.selectedMaterials"
        @material-click="handleMaterialClick"
        @material-select="handleMaterialSelect"
        @material-action="handleMaterialAction"
      />
    </div>

    <!-- 分页区域 -->
    <div class="pagination-section" v-if="materialStore.total > 0">
      <el-pagination
        v-model:current-page="materialStore.currentPage"
        v-model:page-size="materialStore.pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="materialStore.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!materialStore.loading && materialStore.materials.length === 0" class="empty-state">
      <el-empty description="暂无材质数据">
        <el-button type="primary" @click="showUploadDialog = true">
          上传第一个材质
        </el-button>
      </el-empty>
    </div>

    <!-- 材质上传弹窗 -->
    <MaterialUpload
      v-model:visible="showUploadDialog"
      @success="handleUploadSuccess"
      @cancel="showUploadDialog = false"
    />

    <!-- 材质详情弹窗 -->
    <MaterialDetail
      v-model:visible="showDetailDialog"
      :material="selectedMaterial"
      @close="handleDetailClose"
      @action="handleMaterialAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { Plus, Check, Collection, Select } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useMaterialStore } from '../../store/material'
import type { Material, MaterialFilterOptions } from '../../types/material'

// 引入子组件
import MaterialSearchFilter from './MaterialSearchFilter.vue'
import MaterialGrid from './MaterialGrid.vue'
import MaterialUpload from './MaterialUpload.vue'
import MaterialDetail from './MaterialDetail.vue'

// Props
interface Props {
  mode?: 'browse' | 'select' // 浏览模式或选择模式
  multiple?: boolean // 是否支持多选
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'browse',
  multiple: false
})

// Emits
const emit = defineEmits<{
  materialSelect: [material: Material | Material[]]
}>()

// Store
const materialStore = useMaterialStore()

// 响应式数据
const searchQuery = ref('')
const filterOptions = ref<MaterialFilterOptions>({})
const showUploadDialog = ref(false)
const showDetailDialog = ref(false)
const selectedMaterial = ref<Material | null>(null)

// 计算属性
const isSelectMode = computed(() => props.mode === 'select')

// 方法
const handleSearch = async (query: string) => {
  try {
    await materialStore.searchMaterials(query)
  } catch (error) {
    ElMessage.error('搜索失败，请重试')
  }
}

const handleFilter = async (filters: MaterialFilterOptions) => {
  try {
    await materialStore.filterMaterials(filters)
  } catch (error) {
    ElMessage.error('筛选失败，请重试')
  }
}

const handleClearFilters = async () => {
  searchQuery.value = ''
  filterOptions.value = {}
  try {
    await materialStore.clearFilters()
  } catch (error) {
    ElMessage.error('清除筛选失败，请重试')
  }
}

const handleMaterialClick = (material: Material) => {
  if (isSelectMode.value) {
    handleMaterialSelect(material)
  } else {
    // 浏览模式下点击查看详情
    selectedMaterial.value = material
    showDetailDialog.value = true
  }
}

const handleMaterialSelect = (material: Material) => {
  if (isSelectMode.value) {
    if (props.multiple) {
      materialStore.toggleMaterialSelection(material)
    } else {
      materialStore.clearSelection()
      materialStore.selectMaterial(material)
      // 单选模式下立即触发选择事件
      emit('materialSelect', material)
    }
  }
}

const handleConfirmSelection = () => {
  if (materialStore.selectedMaterials.length > 0) {
    const result = props.multiple 
      ? materialStore.selectedMaterials 
      : materialStore.selectedMaterials[0]
    emit('materialSelect', result)
  }
}

const handleMaterialAction = async (action: string, material: Material) => {
  try {
    switch (action) {
      case 'download':
        await materialStore.downloadMaterialFile(material.id)
        ElMessage.success('材质下载成功')
        break
      case 'delete':
        await materialStore.removeMaterial(material.id)
        ElMessage.success('材质删除成功')
        break
      case 'favorite':
        materialStore.toggleFavorite(material)
        ElMessage.success(material.isFavorite ? '已取消收藏' : '已添加到收藏')
        break
      case 'detail':
        selectedMaterial.value = material
        showDetailDialog.value = true
        break
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleUploadSuccess = (material: Material) => {
  showUploadDialog.value = false
  ElMessage.success('材质上传成功')
  // 刷新材质列表
  materialStore.fetchMaterials()
}

const handleDetailClose = () => {
  showDetailDialog.value = false
  selectedMaterial.value = null
}

const handleSizeChange = (size: number) => {
  materialStore.pageSize = size
  materialStore.fetchMaterials()
}

const handleCurrentChange = (page: number) => {
  materialStore.changePage(page)
}

// 生命周期
onMounted(async () => {
  // 初始化Store
  materialStore.initializeStore()
  
  // 加载材质列表
  try {
    await materialStore.fetchMaterials()
  } catch (error) {
    ElMessage.error('加载材质列表失败')
  }
})

// 监听搜索查询变化
watch(searchQuery, (newQuery) => {
  materialStore.searchQuery = newQuery
})

// 监听筛选选项变化
watch(filterOptions, (newFilters) => {
  materialStore.filterOptions = newFilters
}, { deep: true })
</script>

<style scoped>
.material-library-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-title {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.library-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.search-filter-section {
  margin-bottom: 20px;
}

.materials-content {
  min-height: 400px;
  margin-bottom: 20px;
}

.pagination-section {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .material-library-container {
    padding: 10px;
  }
  
  .library-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-right {
    justify-content: center;
  }
  
  .library-stats {
    justify-content: center;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-pagination) {
  --el-pagination-text-color: rgba(255, 255, 255, 0.8);
  --el-pagination-button-color: rgba(255, 255, 255, 0.8);
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.1);
  --el-pagination-button-disabled-color: rgba(255, 255, 255, 0.4);
  --el-pagination-hover-color: #c8ad7f;
}

:deep(.el-empty) {
  --el-empty-description-color: rgba(255, 255, 255, 0.8);
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
  color: white;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%);
}

:deep(.el-button--success) {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
  border: none;
}
</style>