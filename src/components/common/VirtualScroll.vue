<template>
  <div 
    ref="containerRef" 
    class="virtual-scroll-container"
    :style="{ height: containerHeight + 'px' }"
    @scroll="handleScroll"
  >
    <!-- 占位空间 - 上方 -->
    <div :style="{ height: offsetY + 'px' }"></div>
    
    <!-- 可见项目 -->
    <div class="virtual-scroll-content">
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, startIndex + index)"
        :style="{ height: itemHeight + 'px' }"
        class="virtual-scroll-item"
      >
        <slot 
          :item="item" 
          :index="startIndex + index"
          :isVisible="true"
        />
      </div>
    </div>
    
    <!-- 占位空间 - 下方 -->
    <div :style="{ height: (totalHeight - offsetY - visibleHeight) + 'px' }"></div>
    
    <!-- 加载更多指示器 -->
    <div v-if="loading" class="virtual-scroll-loading">
      <slot name="loading">
        <div class="loading-spinner">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
      </slot>
    </div>
    
    <!-- 无更多数据指示器 -->
    <div v-if="!hasMore && items.length > 0" class="virtual-scroll-end">
      <slot name="end">
        <div class="end-text">没有更多数据了</div>
      </slot>
    </div>
    
    <!-- 空状态 -->
    <div v-if="items.length === 0 && !loading" class="virtual-scroll-empty">
      <slot name="empty">
        <div class="empty-state">
          <el-icon><Box /></el-icon>
          <p>暂无数据</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Loading, Box } from '@element-plus/icons-vue'

// Props
interface Props {
  items: any[]
  itemHeight: number
  containerHeight?: number
  buffer?: number
  threshold?: number
  loading?: boolean
  hasMore?: boolean
  keyField?: string
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 400,
  buffer: 5,
  threshold: 100,
  loading: false,
  hasMore: true,
  keyField: 'id'
})

// Emits
const emit = defineEmits<{
  loadMore: []
  scroll: [scrollTop: number]
  itemVisible: [item: any, index: number]
}>()

// 响应式数据
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const isScrolling = ref(false)
let scrollTimer: number | null = null

// 计算属性
const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleCount = computed(() => 
  Math.ceil(props.containerHeight / props.itemHeight) + props.buffer * 2
)

const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / props.itemHeight) - props.buffer
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const index = startIndex.value + visibleCount.value
  return Math.min(props.items.length, index)
})

const visibleItems = computed(() => 
  props.items.slice(startIndex.value, endIndex.value)
)

const offsetY = computed(() => startIndex.value * props.itemHeight)

const visibleHeight = computed(() => 
  Math.min(visibleCount.value * props.itemHeight, totalHeight.value - offsetY.value)
)

// 方法
const getItemKey = (item: any, index: number): string | number => {
  if (props.keyField && item[props.keyField] !== undefined) {
    return item[props.keyField]
  }
  return index
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop
  
  isScrolling.value = true
  
  // 清除之前的定时器
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
  
  // 设置滚动结束标志
  scrollTimer = window.setTimeout(() => {
    isScrolling.value = false
  }, 150)
  
  emit('scroll', scrollTop.value)
  
  // 检查是否需要加载更多
  const scrollBottom = target.scrollTop + target.clientHeight
  const shouldLoadMore = scrollBottom >= target.scrollHeight - props.threshold
  
  if (shouldLoadMore && props.hasMore && !props.loading) {
    emit('loadMore')
  }
  
  // 触发可见项目事件
  visibleItems.value.forEach((item, index) => {
    emit('itemVisible', item, startIndex.value + index)
  })
}

const scrollTo = (index: number) => {
  if (!containerRef.value) return
  
  const targetScrollTop = index * props.itemHeight
  containerRef.value.scrollTop = targetScrollTop
}

const scrollToTop = () => {
  scrollTo(0)
}

const scrollToBottom = () => {
  if (!containerRef.value) return
  containerRef.value.scrollTop = containerRef.value.scrollHeight
}

// 监听器
watch(() => props.items.length, async () => {
  await nextTick()
  // 如果项目数量变化，重新计算可见区域
})

// 生命周期
onMounted(() => {
  // 初始化滚动位置
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
})

onUnmounted(() => {
  if (scrollTimer) {
    clearTimeout(scrollTimer)
  }
})

// 暴露方法给父组件
defineExpose({
  scrollTo,
  scrollToTop,
  scrollToBottom,
  getVisibleRange: () => ({ start: startIndex.value, end: endIndex.value }),
  isScrolling: () => isScrolling.value
})
</script>

<style scoped>
.virtual-scroll-container {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-scroll-content {
  position: relative;
}

.virtual-scroll-item {
  overflow: hidden;
}

.virtual-scroll-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #666;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.virtual-scroll-end {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.end-text {
  margin: 0;
}

.virtual-scroll-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
}

.empty-state {
  text-align: center;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ddd;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 滚动条样式 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 平滑滚动 */
.virtual-scroll-container {
  scroll-behavior: smooth;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .virtual-scroll-loading,
  .virtual-scroll-end {
    padding: 16px;
  }
  
  .loading-spinner {
    font-size: 14px;
  }
  
  .empty-state .el-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }
}
</style>