<template>
  <div class="search-filter-container">
    <div class="search-filter-content">
      <!-- 搜索输入框 -->
      <div class="search-section">
        <el-input
          v-model="localSearchQuery"
          placeholder="搜索材质名称..."
          :prefix-icon="Search"
          clearable
          size="large"
          class="search-input"
          @input="handleSearchInput"
          @clear="handleClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button 
              :icon="Search" 
              @click="handleSearch"
              :loading="searching"
            />
          </template>
        </el-input>
        
        <!-- 搜索建议 -->
        <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
          <div
            v-for="suggestion in searchSuggestions"
            :key="suggestion"
            class="suggestion-item"
            @click="handleSuggestionClick(suggestion)"
          >
            <el-icon><Search /></el-icon>
            <span>{{ suggestion }}</span>
          </div>
        </div>
      </div>

      <!-- 筛选选项 -->
      <div class="filter-section">
        <div class="filter-row">
          <!-- 材质类型筛选 -->
          <div class="filter-item">
            <label class="filter-label">类型</label>
            <el-select
              v-model="localFilterOptions.type"
              placeholder="全部类型"
              clearable
              size="default"
              @change="handleFilterChange"
            >
              <el-option label="全部类型" :value="undefined" />
              <el-option label="系统材质" :value="0" />
              <el-option label="用户材质" :value="1" />
            </el-select>
          </div>

          <!-- 文件格式筛选 -->
          <div class="filter-item">
            <label class="filter-label">格式</label>
            <el-select
              v-model="localFilterOptions.format"
              placeholder="全部格式"
              clearable
              size="default"
              @change="handleFilterChange"
            >
              <el-option label="全部格式" :value="undefined" />
              <el-option label="JPG" value="jpg" />
              <el-option label="PNG" value="png" />
              <el-option label="JPEG" value="jpeg" />
              <el-option label="WEBP" value="webp" />
              <el-option label="GIF" value="gif" />
            </el-select>
          </div>

          <!-- 材质分类筛选 -->
          <div class="filter-item">
            <label class="filter-label">分类</label>
            <el-select
              v-model="localFilterOptions.category"
              placeholder="全部分类"
              clearable
              size="default"
              @change="handleFilterChange"
            >
              <el-option label="全部分类" :value="undefined" />
              <el-option
                v-for="category in materialCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              />
            </el-select>
          </div>

          <!-- 排序选项 */
          <div class="filter-item">
            <label class="filter-label">排序</label>
            <el-select
              v-model="localFilterOptions.sortBy"
              placeholder="默认排序"
              size="default"
              @change="handleFilterChange"
            >
              <el-option label="默认排序" :value="undefined" />
              <el-option
                v-for="sort in sortOptions"
                :key="sort.value"
                :label="sort.label"
                :value="sort.value"
              />
            </el-select>
          </div>

          <!-- 排序方向 -->
          <div class="filter-item" v-if="localFilterOptions.sortBy">
            <label class="filter-label">方向</label>
            <el-select
              v-model="localFilterOptions.sortOrder"
              size="default"
              @change="handleFilterChange"
            >
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>
        </div>

        <!-- 标签筛选 -->
        <div class="filter-row" v-if="availableTags.length > 0">
          <div class="filter-item full-width">
            <label class="filter-label">标签</label>
            <div class="tags-container">
              <el-tag
                v-for="tag in availableTags"
                :key="tag"
                :type="isTagSelected(tag) ? 'primary' : 'info'"
                :effect="isTagSelected(tag) ? 'dark' : 'plain'"
                class="tag-item"
                @click="handleTagClick(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="filter-actions">
          <el-button
            type="primary"
            :icon="Search"
            @click="handleApplyFilters"
            :loading="searching"
          >
            应用筛选
          </el-button>
          <el-button
            :icon="RefreshLeft"
            @click="handleClearAll"
          >
            清除筛选
          </el-button>
          
          <!-- 高级筛选切换 -->
          <el-button
            text
            :icon="showAdvanced ? ArrowUp : ArrowDown"
            @click="toggleAdvanced"
          >
            {{ showAdvanced ? '收起' : '高级筛选' }}
          </el-button>
        </div>
      </div>

      <!-- 高级筛选面板 -->
      <el-collapse-transition>
        <div v-show="showAdvanced" class="advanced-filter-panel">
          <div class="advanced-filter-content">
            <!-- 上传时间范围 -->
            <div class="filter-item">
              <label class="filter-label">上传时间</label>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="default"
                @change="handleDateRangeChange"
              />
            </div>

            <!-- 下载次数范围 -->
            <div class="filter-item">
              <label class="filter-label">下载次数</label>
              <div class="range-inputs">
                <el-input-number
                  v-model="downloadCountRange.min"
                  :min="0"
                  placeholder="最小值"
                  size="small"
                  @change="handleDownloadRangeChange"
                />
                <span class="range-separator">-</span>
                <el-input-number
                  v-model="downloadCountRange.max"
                  :min="downloadCountRange.min || 0"
                  placeholder="最大值"
                  size="small"
                  @change="handleDownloadRangeChange"
                />
              </div>
            </div>

            <!-- 只显示收藏 -->
            <div class="filter-item">
              <el-checkbox
                v-model="showFavoritesOnly"
                @change="handleFavoritesOnlyChange"
              >
                只显示收藏的材质
              </el-checkbox>
            </div>
          </div>
        </div>
      </el-collapse-transition>

      <!-- 当前筛选条件显示 -->
      <div v-if="hasActiveFilters" class="active-filters">
        <span class="active-filters-label">当前筛选:</span>
        <el-tag
          v-if="localSearchQuery"
          closable
          @close="clearSearchQuery"
        >
          搜索: {{ localSearchQuery }}
        </el-tag>
        <el-tag
          v-if="localFilterOptions.type !== undefined"
          closable
          @close="clearFilter('type')"
        >
          类型: {{ localFilterOptions.type === 0 ? '系统材质' : '用户材质' }}
        </el-tag>
        <el-tag
          v-if="localFilterOptions.format"
          closable
          @close="clearFilter('format')"
        >
          格式: {{ localFilterOptions.format.toUpperCase() }}
        </el-tag>
        <el-tag
          v-if="localFilterOptions.category"
          closable
          @close="clearFilter('category')"
        >
          分类: {{ getCategoryLabel(localFilterOptions.category) }}
        </el-tag>
        <el-tag
          v-for="tag in (localFilterOptions.tags || [])"
          :key="tag"
          closable
          @close="removeTag(tag)"
        >
          标签: {{ tag }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  Search, 
  RefreshLeft, 
  ArrowUp, 
  ArrowDown 
} from '@element-plus/icons-vue'
// 自定义防抖函数
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
import type { MaterialFilterOptions } from '../../types/material'
import { MaterialCategories, MaterialSortOptions } from '../../types/material'

// Props
interface Props {
  searchQuery?: string
  filterOptions?: MaterialFilterOptions
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  filterOptions: () => ({})
})

// Emits
const emit = defineEmits<{
  'update:searchQuery': [query: string]
  'update:filterOptions': [options: MaterialFilterOptions]
  search: [query: string]
  filter: [options: MaterialFilterOptions]
  clear: []
}>()

// 响应式数据
const localSearchQuery = ref(props.searchQuery)
const localFilterOptions = ref<MaterialFilterOptions>({ ...props.filterOptions })
const searching = ref(false)
const showSuggestions = ref(false)
const showAdvanced = ref(false)
const dateRange = ref<[Date, Date] | null>(null)
const downloadCountRange = ref({ min: undefined as number | undefined, max: undefined as number | undefined })
const showFavoritesOnly = ref(false)

// 搜索建议
const searchSuggestions = ref<string[]>([])
const searchHistory = ref<string[]>([])

// 可用标签和分类
const availableTags = ref<string[]>(['皮革', '布料', '橡胶', '金属', '塑料', '光滑', '粗糙', '亮面', '哑光'])
const materialCategories = MaterialCategories
const sortOptions = MaterialSortOptions

// 计算属性
const hasActiveFilters = computed(() => {
  return localSearchQuery.value ||
         localFilterOptions.value.type !== undefined ||
         localFilterOptions.value.format ||
         localFilterOptions.value.category ||
         (localFilterOptions.value.tags && localFilterOptions.value.tags.length > 0) ||
         dateRange.value ||
         downloadCountRange.value.min !== undefined ||
         downloadCountRange.value.max !== undefined ||
         showFavoritesOnly.value
})

const isTagSelected = (tag: string) => {
  return localFilterOptions.value.tags?.includes(tag) || false
}

// 防抖搜索
const debouncedSearch = debounce((query: string) => {
  handleSearch()
}, 500)

// 方法
const handleSearchInput = (value: string) => {
  localSearchQuery.value = value
  emit('update:searchQuery', value)
  
  if (value.length > 0) {
    generateSearchSuggestions(value)
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
  
  debouncedSearch(value)
}

const handleSearch = () => {
  searching.value = true
  showSuggestions.value = false
  
  // 添加到搜索历史
  if (localSearchQuery.value && !searchHistory.value.includes(localSearchQuery.value)) {
    searchHistory.value.unshift(localSearchQuery.value)
    if (searchHistory.value.length > 10) {
      searchHistory.value.pop()
    }
    localStorage.setItem('materialSearchHistory', JSON.stringify(searchHistory.value))
  }
  
  emit('search', localSearchQuery.value)
  
  setTimeout(() => {
    searching.value = false
  }, 1000)
}

const handleFilterChange = () => {
  emit('update:filterOptions', localFilterOptions.value)
  debouncedSearch(localSearchQuery.value)
}

const handleApplyFilters = () => {
  emit('filter', localFilterOptions.value)
}

const handleClear = () => {
  localSearchQuery.value = ''
  emit('update:searchQuery', '')
  showSuggestions.value = false
  handleSearch()
}

const handleClearAll = () => {
  localSearchQuery.value = ''
  localFilterOptions.value = {}
  dateRange.value = null
  downloadCountRange.value = { min: undefined, max: undefined }
  showFavoritesOnly.value = false
  
  emit('update:searchQuery', '')
  emit('update:filterOptions', {})
  emit('clear')
}

const handleSuggestionClick = (suggestion: string) => {
  localSearchQuery.value = suggestion
  emit('update:searchQuery', suggestion)
  showSuggestions.value = false
  handleSearch()
}

const handleTagClick = (tag: string) => {
  if (!localFilterOptions.value.tags) {
    localFilterOptions.value.tags = []
  }
  
  const index = localFilterOptions.value.tags.indexOf(tag)
  if (index > -1) {
    localFilterOptions.value.tags.splice(index, 1)
  } else {
    localFilterOptions.value.tags.push(tag)
  }
  
  handleFilterChange()
}

const handleDateRangeChange = (dates: [Date, Date] | null) => {
  if (dates) {
    localFilterOptions.value.uploadTimeStart = dates[0].toISOString()
    localFilterOptions.value.uploadTimeEnd = dates[1].toISOString()
  } else {
    delete localFilterOptions.value.uploadTimeStart
    delete localFilterOptions.value.uploadTimeEnd
  }
  handleFilterChange()
}

const handleDownloadRangeChange = () => {
  if (downloadCountRange.value.min !== undefined) {
    localFilterOptions.value.downloadCountMin = downloadCountRange.value.min
  } else {
    delete localFilterOptions.value.downloadCountMin
  }
  
  if (downloadCountRange.value.max !== undefined) {
    localFilterOptions.value.downloadCountMax = downloadCountRange.value.max
  } else {
    delete localFilterOptions.value.downloadCountMax
  }
  
  handleFilterChange()
}

const handleFavoritesOnlyChange = (value: boolean) => {
  localFilterOptions.value.favoritesOnly = value
  handleFilterChange()
}

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}

const clearSearchQuery = () => {
  localSearchQuery.value = ''
  emit('update:searchQuery', '')
  handleSearch()
}

const clearFilter = (key: keyof MaterialFilterOptions) => {
  delete localFilterOptions.value[key]
  emit('update:filterOptions', localFilterOptions.value)
  handleFilterChange()
}

const removeTag = (tag: string) => {
  if (localFilterOptions.value.tags) {
    const index = localFilterOptions.value.tags.indexOf(tag)
    if (index > -1) {
      localFilterOptions.value.tags.splice(index, 1)
      handleFilterChange()
    }
  }
}

const getCategoryLabel = (value: string) => {
  const category = materialCategories.find(c => c.value === value)
  return category ? category.label : value
}

const generateSearchSuggestions = (query: string) => {
  const suggestions = []
  
  // 从搜索历史中匹配
  const historyMatches = searchHistory.value.filter(item => 
    item.toLowerCase().includes(query.toLowerCase())
  )
  suggestions.push(...historyMatches)
  
  // 从标签中匹配
  const tagMatches = availableTags.value.filter(tag => 
    tag.toLowerCase().includes(query.toLowerCase())
  )
  suggestions.push(...tagMatches)
  
  // 从分类中匹配
  const categoryMatches = materialCategories
    .filter(category => category.label.toLowerCase().includes(query.toLowerCase()))
    .map(category => category.label)
  suggestions.push(...categoryMatches)
  
  // 去重并限制数量
  searchSuggestions.value = [...new Set(suggestions)].slice(0, 8)
}

// 生命周期
onMounted(() => {
  // 恢复搜索历史
  const savedHistory = localStorage.getItem('materialSearchHistory')
  if (savedHistory) {
    try {
      searchHistory.value = JSON.parse(savedHistory)
    } catch (error) {
      console.error('恢复搜索历史失败:', error)
    }
  }
})

// 监听props变化
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue
})

watch(() => props.filterOptions, (newValue) => {
  localFilterOptions.value = { ...newValue }
}, { deep: true })

// 点击外部关闭建议
const handleClickOutside = () => {
  showSuggestions.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-filter-container {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  margin-bottom: 20px;
}

.search-section {
  position: relative;
  margin-bottom: 20px;
}

.search-input {
  --el-input-bg-color: rgba(255, 255, 255, 0.9);
  --el-input-border-color: rgba(255, 255, 255, 0.3);
  --el-input-hover-border-color: #c8ad7f;
  --el-input-focus-border-color: #c8ad7f;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 120px;
}

.filter-item.full-width {
  flex: 1;
  min-width: 100%;
}

.filter-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s;
}

.tag-item:hover {
  transform: translateY(-1px);
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

.advanced-filter-panel {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.advanced-filter-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: end;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-separator {
  color: rgba(255, 255, 255, 0.7);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.active-filters-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-item {
    min-width: 100%;
  }
  
  .filter-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .advanced-filter-content {
    flex-direction: column;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-select) {
  --el-select-input-bg-color: rgba(255, 255, 255, 0.9);
  --el-select-border-color: rgba(255, 255, 255, 0.3);
  --el-select-hover-border-color: #c8ad7f;
}

:deep(.el-date-editor) {
  --el-date-editor-bg-color: rgba(255, 255, 255, 0.9);
  --el-border-color: rgba(255, 255, 255, 0.3);
  --el-border-color-hover: #c8ad7f;
}

:deep(.el-input-number) {
  --el-input-bg-color: rgba(255, 255, 255, 0.9);
  --el-input-border-color: rgba(255, 255, 255, 0.3);
}

:deep(.el-checkbox) {
  --el-checkbox-text-color: rgba(255, 255, 255, 0.9);
  --el-checkbox-checked-bg-color: #c8ad7f;
  --el-checkbox-checked-border-color: #c8ad7f;
}

:deep(.el-tag--primary) {
  --el-tag-bg-color: #c8ad7f;
  --el-tag-border-color: #c8ad7f;
}
</style>