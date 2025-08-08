<template>
  <div class="image-workspace">
    <!-- 进度条覆盖层 -->
    <div v-if="shoeStore.aiTaskStatus === 'running'" class="progress-overlay">
      <div class="progress-container">
        <div class="progress-text">{{ shoeStore.aiTaskProgress }}%</div>
        <div class="progress-bar">
          <div class="progress-bar-gold" :style="{ width: `${shoeStore.aiTaskProgress}%` }"></div>
        </div>
        <div class="progress-label">AI处理中...</div>
      </div>
    </div>

    <div class="workspace-container">
      <!-- 图片显示区域 -->
      <div class="image-container" ref="imageContainerRef">
        <!-- 常规图片编辑模式 -->
        <img
          v-if="editingImageUrl && !isCropping && !isBrushing && !isMasking && !isViewingResults && !isSmartSelecting"
          :src="editingImageUrl" :alt="'编辑图片'" class="edit-image" :style="{ transform: `scale(${scale})` }"
          crossorigin="anonymous" ref="imageRef" />

        <!-- 结果查看模式 - 独立弹层 -->
        <div v-if="isViewingResults" class="results-overlay">
          <div class="results-modal">
            <!-- 关闭按钮 -->
            <div class="close-button" @click="exitResultsView">
              <el-icon>
                <Close />
              </el-icon>
            </div>

            <!-- 二创按钮（圆形悬浮，图标居中，文字在下方） -->
            <div class="creative-circle-btn" @click="handleCreativeClick">
              <el-icon>
                <InfoFilled />
              </el-icon>
              <span class="circle-label">二创</span>
            </div>

            <!-- 二创弹窗 -->
            <TwoChuang v-model="showTwoChuang" :options="twoChuangOptions" @select="handleTwoChuangSelect" />


            <!-- 主图片显示 -->
            <div class="results-slides" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
              <div v-for="(url, index) in resultImages" :key="index" class="result-slide">
                <el-tooltip content="使用鼠标滚轮缩放图片" placement="top">
                  <img :src="url.startsWith('http') ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url"
                    :alt="`生成结果${index + 1}`" class="result-image" crossorigin="anonymous" :style="{
                      transform: `scale(${resultImageZoom[index] || 1}) translate(${resultImagePosition[index]?.x || 0}px, ${resultImagePosition[index]?.y || 0}px)`,
                      cursor: (resultImageZoom[index] || 1) > 1 ? 'zoom-out' : 'zoom-in'
                    }" @wheel.prevent="handleImageWheel($event, index)" @mousedown="startImageDrag($event, index)"
                    @error="handleImageError($event, index)" />
                </el-tooltip>
              </div>
            </div>

            <!-- 左右箭头 -->
            <div class="carousel-arrow left" @click="prevSlide" v-if="currentSlide > 0">
              <el-icon>
                <ArrowLeft />
              </el-icon>
            </div>
            <div class="carousel-arrow right" @click="nextSlide" v-if="currentSlide < resultImages.length - 1">
              <el-icon>
                <ArrowRight />
              </el-icon>
            </div>

            <!-- 底部缩略图和下载按钮 -->
            <div class="bottom-controls">
              <!-- 缩略图 -->
              <div class="thumbnails-wrapper">
                <div v-for="(url, index) in resultImages" :key="index" class="thumbnail-item"
                  :class="{ active: currentSlide === index }" @click="setSlide(index)">
                  <img :src="url.startsWith('http') ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}` : url"
                    :alt="`缩略图${index + 1}`" class="thumbnail-image" crossorigin="anonymous"
                    @error="handleThumbnailError($event, index)" />
                </div>
              </div>

              <!-- 下载按钮 -->
              <!-- <div class="download-section">
                <el-button type="primary" @click="downloadCurrentImage" class="download-btn">
                  <el-icon><Download /></el-icon>下载
                </el-button>
              </div> -->
            </div>
          </div>
        </div>
        <!-- 智能选区模式 -->
  

        <div v-else-if="!imageUrl && !isViewingResults" class="empty-placeholder">
          请先上传图片
        </div>

        <!-- 加载状态 -->
        <div v-if="isProcessing" class="processing-overlay">
          <div class="processing-spinner"></div>
          <div class="processing-text">处理中...</div>
        </div>
      </div>

      <!-- 缩放控制 -->
      <div class="zoom-controls" v-if="imageUrl && !isViewingResults && !isToolModalVisible && !isSmartSelecting">
        <el-tooltip content="缩小" placement="top">
          <div class="zoom-btn" @click="zoomOut">
            <el-icon>
              <Remove />
            </el-icon>
          </div>
        </el-tooltip>
        <span class="zoom-text">{{ Math.round(scale * 100) }}%</span>
        <el-tooltip content="放大" placement="top">
          <div class="zoom-btn" @click="zoomIn">
            <el-icon>
              <Plus />
            </el-icon>
          </div>
        </el-tooltip>
        <el-tooltip content="重置" placement="top">
          <div class="zoom-btn" @click="resetZoom">
            <el-icon>
              <Refresh />
            </el-icon>
          </div>
        </el-tooltip>
      </div>

      <!-- 工具栏 -->
      <div class="toolbar" v-if="imageUrl && !isViewingResults && !isToolModalVisible && !isSmartSelecting">
        <el-tooltip content="局部涂抹" placement="left">
          <div class="tool-item" :class="{ active: currentTool === 'brush' }" @click="openToolModal('brush')">
            <div class="icon-wrapper">
              <el-icon>
                <Brush />
              </el-icon>
            </div>
            <span class="tool-text">局部涂抹</span>
          </div>
        </el-tooltip>
        <el-tooltip content="裁切" placement="left">
          <div class="tool-item" :class="{ active: currentTool === 'crop' }" @click="openToolModal('crop')">
            <div class="icon-wrapper">
              <el-icon>
                <Crop />
              </el-icon>
            </div>
            <span class="tool-text">裁切</span>
          </div>
        </el-tooltip>
        <!-- <el-tooltip content="智能选区" placement="left">
          <div class="tool-item" :class="{ active: currentTool === 'smartSelect' }" @click="selectTool('smartSelect')">
            <div class="icon-wrapper">
            <el-icon><Select /></el-icon>
            </div>
            <span class="tool-text">智能选区</span>
          </div>
        </el-tooltip> -->

        <!-- 标记可选工具，根据hideMaskTool属性控制显示 -->
        <!-- <el-tooltip content="标记可选" placement="left" v-if="!props.hideMaskTool">
          <div class="tool-item" :class="{ active: currentTool === 'mask' }" @click="openToolModal('mask')">
            <div class="icon-wrapper">
              <el-icon><EditPen /></el-icon>
            </div>
            <span class="tool-text">标记可选</span>
          </div>
        </el-tooltip> -->

        <el-tooltip content="一键抠图" placement="left">
          <div class="tool-item" :class="{ active: currentTool === 'segmentation' }"
            @click="selectTool('segmentation')">
            <div class="icon-wrapper">
              <el-icon>
                <Scissor />
              </el-icon>
            </div>
            <span class="tool-text">一键抠图</span>
          </div>
        </el-tooltip>

        <el-tooltip content="智能抠图" placement="left">
          <div class="tool-item" :class="{ active: currentTool === 'smart-cutout' }"
            @click="openToolModal('smart-cutout')">
            <div class="icon-wrapper">
              <el-icon>
                <Star />
              </el-icon>
            </div>
            <span class="tool-text">智能抠图</span>
          </div>
        </el-tooltip>

        <!-- 完成编辑按钮，放在工具栏最底部 -->
        <el-tooltip content="完成编辑" placement="left">
          <div class="tool-item complete-edit-item" @click="confirmCompleteEditing">
            <div class="icon-wrapper">
              <el-icon>
                <Check />
              </el-icon>
            </div>
            <span class="tool-text">完成编辑</span>
          </div>
        </el-tooltip>
      </div>
    </div>

    <!-- SAM上传进度弹窗 -->
    <el-dialog v-model="showSamUploadProgress" title="" :show-close="false" :close-on-click-modal="false"
      :close-on-press-escape="false" width="500px" center class="sam-upload-dialog">
      <div class="sam-upload-content">
        <div class="sam-upload-flow">
          <img class="sam-upload-image" :src="editingImageUrl" alt="当前图片">
          <img class="sam-upload-arrow" src="/src/assets/arrow-icn.svg" alt="箭头">
          <img class="sam-upload-ai" src="/src/assets/icn-nn.svg" alt="AI图标">
          <img class="sam-upload-arrow" src="/src/assets/arrow-icn.svg" alt="箭头">
          <img class="sam-upload-sam" src="/src/assets/stack.svg" alt="SAM图标">
        </div>
        <p class="sam-upload-text">{{ samUploadProgressText }}</p>
        <div class="sam-progress-container">
          <div class="sam-progress-bar" :style="{ width: samUploadProgress + '%' }"></div>
        </div>
        <button @click="cancelSamUpload" class="sam-cancel-btn">取消</button>
      </div>
    </el-dialog>

    <!-- 工具弹窗 -->
    <el-dialog v-model="isToolModalVisible" :title="toolModalTitle" :show-close="true" :close-on-click-modal="false"
      :close-on-press-escape="true" :class="currentTool === 'smart-cutout' ? '' : 'tool-modal'" destroy-on-close
      width="65%" top="12vh" @close="closeToolModal" style="margin-left: 12%;">
      <div class="tool-modal-content">
        <!-- 工具弹窗内的图片区域 -->
        <div class="tool-modal-workspace">
          <!-- 裁剪模式 -->
          <div v-if="currentTool === 'crop'" class="crop-container" ref="cropContainerRef">
            <img :src="editingImageUrl" :alt="'裁剪图片'" class="crop-image" crossorigin="anonymous" ref="cropImageRef"
              @load="initCropArea" />
            <div class="crop-area" :style="cropAreaStyle" @mousedown.stop="handleCropAreaMouseDown">
              <!-- 裁剪框的边角控制点 -->
              <div v-for="point in cropControlPoints" :key="point" :class="['crop-control-point', point]"
                @mousedown.stop="handleControlPointMouseDown(point, $event)"></div>
              <!-- 裁剪框网格线 -->
              <div class="crop-grid">
                <div class="grid-line horizontal" v-for="i in 2" :key="'h' + i"></div>
                <div class="grid-line vertical" v-for="i in 2" :key="'v' + i"></div>
              </div>
            </div>
            <div class="crop-mask"></div>
          </div>

          <!-- 涂抹模式 -->
          <div v-if="currentTool === 'brush'" class="brush-container" ref="brushContainerRef">
            <img :src="editingImageUrl" :alt="'涂抹图片'" class="brush-image" crossorigin="anonymous" ref="brushImageRef"
              @load="initBrushCanvas" />
            <canvas class="brush-canvas" ref="brushCanvasRef" @mousedown="startBrushing" @mousemove="handleBrushing"
              @mouseup="stopBrushing" @mouseleave="stopBrushing"></canvas>
          </div>

          <!-- 蒙版模式 -->
          <div v-if="currentTool === 'mask'" class="mask-container" ref="maskContainerRef">
            <img :src="editingImageUrl" :alt="'蒙版图片'" class="mask-image" crossorigin="anonymous" ref="maskImageRef"
              @load="initMaskCanvas" />
            <canvas class="mask-canvas" ref="maskCanvasRef" @mousedown="startMasking" @mousemove="handleMasking"
              @mouseup="stopMasking" @mouseleave="stopMasking"></canvas>
            <div v-if="showMaskPreview" class="mask-preview-overlay">
              <div class="mask-preview-container">
                <img :src="maskPreviewUrl" alt="蒙版预览" class="mask-preview-image" />
              </div>
            </div>
          </div>

          <!-- 智能抠图模式 - 弹窗内布局 -->
          <div v-if="currentTool === 'smart-cutout'" class="smart-cutout-modal-layout">
            <!-- 移除内部关闭按钮，使用弹窗自带的关闭按钮 -->

            <!-- 顶部工具栏 -->
            <div class="smart-cutout-header">
              <div class="smart-cutout-toolbar smart-cutout-toolbar-right">
                <button @click="showCutoutHelp" class="cutout-btn cutout-btn-help">
                  如何选择区域
                </button>
                <button @click="undoSmartCutoutPoint" :disabled="smartCutoutPoints.length === 0"
                  class="cutout-btn cutout-btn-undo">
                  <el-icon>
                    <ArrowLeft />
                  </el-icon>
                  撤回
                </button>
                <button @click="clearSmartCutoutPoints" :disabled="smartCutoutPoints.length === 0"
                  class="cutout-btn cutout-btn-clear">
                  <el-icon>
                    <Delete />
                  </el-icon>
                  删除
                </button>
                <button @click="downloadSmartCutout" :disabled="!smartCutoutMask" class="cutout-btn cutout-btn-confirm">
                  确定
                </button>
              </div>
            </div>

            <!-- 中央图片区域 -->
            <div class="smart-cutout-main">
              <div class="smart-cutout-image-container" ref="smartCutoutContainerRef">
                <img :src="editingImageUrl" :alt="'智能抠图图片'" class="smart-cutout-image" crossorigin="anonymous"
                  ref="smartCutoutImageRef" @load="initSmartCutoutCanvas" @mousemove="handleSmartCutoutHover"
                  @mouseleave="clearHoverPreview" />
                <canvas class="smart-cutout-canvas" ref="smartCutoutCanvasRef" @click="handleSmartCutoutClick"
                  @contextmenu="handleSmartCutoutRightClick" @mousemove="handleSmartCutoutHover"
                  @mouseleave="clearHoverPreview"></canvas>

                <!-- 悬浮预览层 -->
                <canvas v-if="isHovering && hoverPreviewMask" class="hover-preview-canvas"
                  ref="hoverPreviewCanvasRef"></canvas>

                <!-- 点击点显示 - 简化为纯色球 -->
                <div class="points-overlay">
                  <div v-for="(point, index) in smartCutoutPoints" :key="index" class="point-marker" :class="point.type"
                    :style="{
                      left: point.x + 'px',
                      top: point.y + 'px'
                    }">
                    <!-- 移除数量显示，只显示纯色球 -->
                  </div>
                </div>

                <!-- 抠图结果预览 -->
                <canvas v-if="smartCutoutMask" class="cutout-result-canvas" ref="cutoutResultCanvasRef"></canvas>
              </div>
            </div>

            <!-- 底部操作按钮已移除 -->
          </div>
        </div>


      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, onMounted, onUnmounted, watch, defineExpose, nextTick } from 'vue'
import { Crop, Select, InfoFilled, Brush, Plus, Remove, Refresh, ArrowLeft, ArrowRight, EditPen, Scissor, Download, Check, Close, Star } from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { uploadImage, feedbackImage, isUserLoggedIn, kt, uploadMask } from '../../api/file'
import type { UploadImageResponse, KtRequest, UploadMaskParams } from '../../api/file'
import { useRouter } from 'vue-router'
import { emitter } from '../../utils/request'
import TwoChuang from '../common/TwoChuang.vue'
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

interface Props {
  imageUrl: string;
  isViewResults?: boolean;
  resultImages?: string[];
  hideMaskTool?: boolean; // 控制是否隐藏"标记可选"工具
  originalImageName?: string; // 原始图片名称
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:imageUrl', value: string): void
  (e: 'imageEdited', editedImageUrl: string, imageId?: number): void
  (e: 'resultSaved', savedImageUrl: string): void
  (e: 'exitResults'): void
  (e: 'brushComplete', editedData: { hasMask: boolean; canvas: HTMLCanvasElement }): void
  (e: 'maskComplete', maskData: { visualMask: string; aiMask: string }): void
  (e: 'editingCompleted'): void
}>()

const currentTool = ref('')
const imageContainerRef = ref<HTMLElement | null>(null)
const imageRef = ref<HTMLImageElement | null>(null)
const scale = ref(1)
const MIN_SCALE = 0.1
const MAX_SCALE = 3
const SCALE_STEP = 0.1
const isProcessing = ref(false)

// 裁剪相关状态
const isCropping = ref(false)
const cropStartX = ref(0)
const cropStartY = ref(0)
const cropWidth = ref(0)
const cropHeight = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const activeControlPoint = ref('')
const cropImageRef = ref<HTMLImageElement | null>(null)
const cropContainerRef = ref<HTMLElement | null>(null)
// 涂抹相关状态
const isBrushing = ref(false)
const brushCanvasRef = ref<HTMLCanvasElement | null>(null)
const brushImageRef = ref<HTMLImageElement | null>(null)
const brushContainerRef = ref<HTMLElement | null>(null)
const brushSize = ref(20)
const isPainting = ref(false)
const brushContext = ref<CanvasRenderingContext2D | null>(null)

const isViewingResults = ref(props.isViewResults || false)
const resultImages = ref<string[]>(props.resultImages || [])
const currentSlide = ref(0)
// 图片缩放状态
const resultImageZoom = ref<number[]>([])
const resultImagePosition = ref<{ x: number, y: number }[]>([])
const MIN_ZOOM = 0.5
const MAX_ZOOM = 5.0
const ZOOM_STEP = 0.1
// 结果图片拖拽状态
const resultDragging = ref(false)
const resultDragStartX = ref(0)
const resultDragStartY = ref(0)

// 裁剪区域样式
const cropAreaStyle = computed(() => ({
  left: `${cropStartX.value}px`,
  top: `${cropStartY.value}px`,
  width: `${cropWidth.value}px`,
  height: `${cropHeight.value}px`
}))

// 裁剪框控制点
const cropControlPoints = [
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
  'top', 'right', 'bottom', 'left'
]

// 蒙版相关状态
const isMasking = ref(false)
const maskCanvasRef = ref<HTMLCanvasElement | null>(null)
const maskImageRef = ref<HTMLImageElement | null>(null)
const maskContainerRef = ref<HTMLElement | null>(null)
const maskBrushSize = ref(20)
const isMaskPainting = ref(false)
const maskContext = ref<CanvasRenderingContext2D | null>(null)
const showMaskPreview = ref(false)
const maskPreviewUrl = ref('')

// 获取路由
const router = useRouter()

// 工具弹窗相关状态
const isToolModalVisible = ref(false)
const toolModalTitle = ref('')

// 用于编辑台内部显示和多步编辑的图片url
const editingImageUrl = ref(props.imageUrl)
// 跟踪是否有编辑操作
const hasEdits = ref(false)
// 保存编辑后的图片信息
const editedImageInfo = ref<{ url: string; id?: number } | null>(null)

// 智能选区相关状态
const isSmartSelecting = ref(false)

// 新增：保存一键抠图返回的ossId
const segmentationOssId = ref<number | undefined>(undefined)
const isSegmentationOnly = ref(false)

// 智能抠图相关状态
const isSmartCutoutMode = ref(false)
const isImageLoadedToSAM = ref(false)
const smartCutoutPoints = ref<Array<{ x: number, y: number, type: 'foreground' | 'background' }>>([])
const smartCutoutMask = ref('')
const smartCutoutResult = ref('')
const smartCutoutImageRef = ref<HTMLImageElement | null>(null)
const smartCutoutCanvasRef = ref<HTMLCanvasElement | null>(null)
const smartCutoutContainerRef = ref<HTMLElement | null>(null)
const cutoutResultCanvasRef = ref<HTMLCanvasElement | null>(null)
// 新增状态
const smartCutoutHistory = ref<Array<{ points: Array<{ x: number, y: number, type: 'foreground' | 'background' }>, mask: string }>>([])
const hoverPreviewMask = ref('')
const isHovering = ref(false)
const hoverTimeout = ref<NodeJS.Timeout | null>(null)
const hoverPreviewCanvasRef = ref<HTMLCanvasElement | null>(null)
// 新增：智能抠图模式状态（选取/排除）
const smartCutoutMode = ref<'foreground' | 'background'>('foreground')

// 智能抠图缩放相关状态
const smartCutoutZoom = ref(1.0) // 当前缩放比例
const smartCutoutMinZoom = 0.5 // 最小缩放比例
const smartCutoutMaxZoom = 3.0 // 最大缩放比例
const smartCutoutZoomStep = 0.2 // 缩放步长

// 计算智能抠图的智能缩放比例
// 计算智能抠图的智能缩放比例
const calculateSmartCutoutZoom = (naturalWidth: number, naturalHeight: number, targetSize = 900) => {
  console.log('🔍 计算智能抠图缩放:', { naturalWidth, naturalHeight, targetSize });

  // 如果图片已经足够大，不需要放大
  if (naturalWidth >= targetSize && naturalHeight >= targetSize) {
    console.log('🔍 图片尺寸已足够大，使用原始大小，缩放比例: 1.0');
    return 1.0;
  }

  // 计算需要放大的比例，以较小的边为准
  const scaleX = targetSize / naturalWidth;
  const scaleY = targetSize / naturalHeight;

  // 选择较小的缩放比例，确保图片不会超出目标尺寸
  const scale = Math.min(scaleX, scaleY);

  // 限制最大放大倍数为3倍
  const finalScale = Math.min(scale, smartCutoutMaxZoom);

  console.log('🔍 智能缩放计算结果:', {
    原始尺寸: { width: naturalWidth, height: naturalHeight },
    目标尺寸: targetSize,
    需要的缩放: { scaleX, scaleY },
    选择的缩放: scale,
    最大允许缩放: smartCutoutMaxZoom,
    最终缩放: finalScale,
    缩放后尺寸: {
      width: Math.round(naturalWidth * finalScale),
      height: Math.round(naturalHeight * finalScale)
    }
  });

  return finalScale;
};


// 智能抠图缩放控制函数
const smartCutoutZoomIn = () => {
  if (smartCutoutZoom.value < smartCutoutMaxZoom) {
    smartCutoutZoom.value = Math.min(smartCutoutZoom.value + smartCutoutZoomStep, smartCutoutMaxZoom);
    applySmartCutoutZoom();
  }
};

const smartCutoutZoomOut = () => {
  if (smartCutoutZoom.value > smartCutoutMinZoom) {
    smartCutoutZoom.value = Math.max(smartCutoutZoom.value - smartCutoutZoomStep, smartCutoutMinZoom);
    applySmartCutoutZoom();
  }
};

const resetSmartCutoutZoom = () => {
  const img = smartCutoutImageRef.value;
  if (!img) return;

  // 重置为智能缩放比例
  smartCutoutZoom.value = calculateSmartCutoutZoom(img.naturalWidth, img.naturalHeight);
  applySmartCutoutZoom();
};

// 应用智能抠图缩放
const applySmartCutoutZoom = () => {
  const img = smartCutoutImageRef.value;
  if (!img) return;

  console.log('🔍 应用智能抠图缩放:', smartCutoutZoom.value);

  // 更新图片的transform样式
  img.style.transform = `scale(${smartCutoutZoom.value})`;
  img.style.transformOrigin = 'center center';
  img.style.transition = 'transform 0.3s ease';

  // 重新调整Canvas位置和尺寸
  setTimeout(() => {
    adjustCanvasPosition();
  }, 100);
};

// 在智能抠图图片加载时设置初始缩放
const setSmartCutoutInitialZoom = () => {
  const img = smartCutoutImageRef.value;
  if (!img) return;

  // 计算智能缩放比例
  const smartZoom = calculateSmartCutoutZoom(img.naturalWidth, img.naturalHeight);
  smartCutoutZoom.value = smartZoom;

  console.log('🔍 设置智能抠图初始缩放:', {
    naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
    smartZoom: smartZoom,
    finalZoom: smartCutoutZoom.value
  });

  // 应用缩放
  applySmartCutoutZoom();
};

// SAM上传进度相关状态
const showSamUploadProgress = ref(false)
const samUploadProgress = ref(0)
const samUploadProgressText = ref('预处理图像中，请稍候...')
const samUploadController = ref<AbortController | null>(null)
const samTaskId = ref<string | null>(null)

// SAM API配置
const SAM_API_BASE = 'http://js1.blockelite.cn:34965/api'

// 智能抠图计算属性
const foregroundCount = computed(() =>
  smartCutoutPoints.value.filter(p => p.type === 'foreground').length
)

const backgroundCount = computed(() =>
  smartCutoutPoints.value.filter(p => p.type === 'background').length
)

// WebSocket 相关状态
const shoeStore = useShoeStore()

// 生成唯一的组件ID，用于区分不同的ImageWorkspace实例
const componentId = ref(`image-workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

// 监听 WebSocket 返回的图片结果
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    // 检查当前组件是否正在处理任务
    const isCurrentComponentProcessing = currentTool.value !== ''

    console.log(`🔍 [${componentId.value}] 收到WebSocket图片结果:`, {
      当前工具: currentTool.value,
      是否正在处理: isCurrentComponentProcessing,
      图片数量: newImages.length,
      第一张图片: newImages[0]
    })

    // 检查是否是抠图任务的结果
    const isSegmentationResult = shoeStore.aiTask.taskType === 'cutout' || currentTool.value === 'segmentation'

    // 如果是抠图结果或者当前组件正在处理任务，则更新图片
    if (isCurrentComponentProcessing || isSegmentationResult) {
      console.log(`🔍 [${componentId.value}] 更新editingImageUrl为WebSocket返回的图片:`, newImages[0], {
        当前工具: currentTool.value,
        任务类型: shoeStore.aiTask.taskType,
        是否抠图结果: isSegmentationResult
      })
      editingImageUrl.value = newImages[0]
      hasEdits.value = true

      // 如果是抠图操作，设置抠图相关状态
      if (currentTool.value === 'segmentation' || shoeStore.aiTask.taskType === 'cutout') {
        isSegmentationOnly.value = true

        // 优先从WebSocket返回的数据中获取ossIds
        let extractedId: number | undefined

        // 方法1：从WebSocket返回的ossIds中获取（最准确）
        if (shoeStore.aiTask.ossIds && shoeStore.aiTask.ossIds.length > 0) {
          extractedId = shoeStore.aiTask.ossIds[0]
          console.log('🔍 从WebSocket返回的ossIds中获取到ID:', extractedId)
        }

        // 方法2：从图片URL中提取ID（备用方法）
        if (!extractedId) {
          const urlParts = newImages[0].split('/')
          const lastPart = urlParts[urlParts.length - 1]
          if (lastPart && !isNaN(parseInt(lastPart))) {
            extractedId = parseInt(lastPart)
            console.log('🔍 从URL路径中提取到ID:', extractedId)
          }
        }

        // 方法3：从URL查询参数中提取ID
        if (!extractedId) {
          try {
            const url = new URL(newImages[0])
            const imageIdParam = url.searchParams.get('imageId') || url.searchParams.get('id')
            if (imageIdParam && !isNaN(parseInt(imageIdParam))) {
              extractedId = parseInt(imageIdParam)
              console.log('🔍 从URL查询参数中提取到ID:', extractedId)
            }
          } catch (error) {
            console.warn('解析URL失败:', error)
          }
        }

        // 方法4：从文件名中提取ID（如果URL包含文件名）
        if (!extractedId) {
          const fileNameMatch = newImages[0].match(/(\d+)\.(jpg|jpeg|png|gif|webp)/i)
          if (fileNameMatch) {
            extractedId = parseInt(fileNameMatch[1])
            console.log('🔍 从文件名中提取到ID:', extractedId)
          }
        }

        if (extractedId) {
          segmentationOssId.value = extractedId
          console.log('🔍 最终设置抠图后图片ID:', extractedId)
        } else {
          console.warn('🔍 无法从任何来源提取到图片ID:', newImages[0])
        }

        // 设置编辑信息，包含图片ID
        // 优先使用WebSocket返回的ossIds，这是最准确的
        let finalId = extractedId
        if (shoeStore.aiTask.ossIds && shoeStore.aiTask.ossIds.length > 0) {
          finalId = shoeStore.aiTask.ossIds[0]
          console.log('🔍 使用WebSocket返回的ossId作为编辑后ID:', finalId)
        }

        editedImageInfo.value = {
          url: newImages[0],
          id: finalId // 保存最终的ID
        }
      } else {
        // 非抠图操作，只设置URL
        editedImageInfo.value = { url: newImages[0] }
      }

      // 根据任务类型显示不同的成功消息
      const taskType = shoeStore.aiTask.taskType
      if (taskType === 'color') {
        ElMessage.success('配色完成')
      } else if (taskType === 'cutout') {
        ElMessage.success('抠图完成')
      } else if (taskType === 'line-art') {
        ElMessage.success('线稿生成完成')
      } else if (taskType === 'style-fusion') {
        ElMessage.success('款式融合完成')
      } else if (taskType === 'sole-fusion') {
        ElMessage.success('鞋底换面完成')
      } else if (taskType === 'style-extension') {
        ElMessage.success('款式延伸完成')
      } else if (taskType === 'partial-modify') {
        ElMessage.success('局部修改完成')
      } else if (taskType === 'text-design') {
        ElMessage.success('文字创款完成')
      } else if (taskType === 'element-remove') {
        ElMessage.success('元素消除完成')
      } else if (taskType === 'hd-enhance') {
        ElMessage.success('高清放大完成')
      } else if (taskType === 'image-restore') {
        ElMessage.success('图片恢复完成')
      } else if (taskType === 'watermark-remove') {
        ElMessage.success('去水印完成')
      } else {
        ElMessage.success('处理完成')
      }
    }
  }
}, { deep: true })

// 监听props.imageUrl变化（如父组件切换图片时）
watch(() => props.imageUrl, (val, oldVal) => {
  console.log(`🔍 [${componentId.value}] props.imageUrl 变化:`, { oldVal, newVal: val })

  // 只有在图片真正改变时才重置编辑状态
  if (val !== oldVal) {
    // 强制重置editingImageUrl为新图片，确保显示正确的图片
    editingImageUrl.value = val
    console.log(`🔍 [${componentId.value}] 强制重置editingImageUrl为:`, val)

    // 检查是否是抠图后的图片URL（包含oss-pai域名）
    const isOssImage = val && typeof val === 'string' && val.includes('oss-pai')

    if (!isOssImage) {
      // 对于新上传的图片，重置所有编辑状态
      console.log('检测到新上传图片，重置所有编辑状态')
      // 重置所有编辑相关状态，彻底清空残余
      isCropping.value = false
      isBrushing.value = false
      isMasking.value = false
      currentTool.value = ''
      cropStartX.value = 0
      cropStartY.value = 0
      cropWidth.value = 0
      cropHeight.value = 0
      isDragging.value = false
      dragStartX.value = 0
      dragStartY.value = 0
      activeControlPoint.value = ''
      brushSize.value = 20
      isPainting.value = false
      brushContext.value = null
      maskBrushSize.value = 20
      isMaskPainting.value = false
      maskContext.value = null
      showMaskPreview.value = false
      maskPreviewUrl.value = ''
      scale.value = 1
      hasEdits.value = false
      editedImageInfo.value = null
      // 重置抠图相关状态
      segmentationOssId.value = undefined
      isSegmentationOnly.value = false
    } else {
      console.log('检测到OSS图片，重置编辑状态但保持图片显示')
      // 对于OSS图片，也重置编辑状态，但保持图片显示
      isCropping.value = false
      isBrushing.value = false
      isMasking.value = false
      currentTool.value = ''
      hasEdits.value = false
      editedImageInfo.value = null
    }
  }
})

// 打开工具弹窗
const openToolModal = (tool: string) => {
  currentTool.value = tool

  // 设置弹窗标题
  switch (tool) {
    case 'crop':
      toolModalTitle.value = '裁切图片'
      break
    case 'brush':
      toolModalTitle.value = '局部涂抹'
      break
    case 'mask':
      toolModalTitle.value = '标记可选区域'
      break
    case 'smart-cutout':
      toolModalTitle.value = '智能抠图'
      break
  }

  // 对于智能抠图，先不显示弹窗，等SAM上传完成后再显示
  if (tool === 'smart-cutout') {
    // 发送事件隐藏header
    emitter.emit('toggle-header', false)
    // 直接初始化智能抠图工具，不显示弹窗
    initializeTool(tool)
    return
  }

  // 其他工具正常显示弹窗
  isToolModalVisible.value = true

  // 发送事件隐藏header - 使用emitter全局事件总线
  emitter.emit('toggle-header', false)

  // 在弹窗显示后初始化工具
  setTimeout(() => {
    initializeTool(tool)
  }, 200)
}

// 关闭工具弹窗
const closeToolModal = () => {
  // 重置工具状态
  isCropping.value = false
  isBrushing.value = false
  isMasking.value = false
  currentTool.value = ''

  // 关闭弹窗
  isToolModalVisible.value = false

  // 发送事件显示header - 使用emitter全局事件总线
  emitter.emit('toggle-header', true)
}

// 选择工具
const selectTool = (tool: string) => {
  // 对于智能选区和一键抠图等不需要弹窗的工具，直接处理
  currentTool.value = tool
  initializeTool(tool)
}

// 初始化工具
const initializeTool = (tool: string) => {
  switch (tool) {
    case 'crop':
      setupCropTool()
      break
    case 'smartSelect':
      setupSmartSelectTool()
      break
    case 'brush':
      setupBrushTool()
      break
    case 'mask':
      setupMaskTool()
      break
    case 'segmentation':
      setupSegmentationTool()
      break
    case 'smart-cutout':
      setupSmartCutoutTool()
      break
  }
}

// 初始化裁剪区域
const initCropArea = () => {
  const container = cropContainerRef.value
  const image = cropImageRef.value
  if (!container || !image) return

  // 定义图片加载函数来确保裁剪区域正确初始化
  const handleImageLoad = () => {
    // 获取图片在容器中的实际显示位置和尺寸
    const imgRect = image.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // 计算图片相对于容器的位置
    const imgOffsetX = imgRect.left - containerRect.left
    const imgOffsetY = imgRect.top - containerRect.top

    // 计算裁剪框尺寸（图片的80%）
    cropWidth.value = imgRect.width * 0.8
    cropHeight.value = imgRect.height * 0.8

    // 居中放置裁剪框（相对于图片）
    cropStartX.value = imgOffsetX + (imgRect.width - cropWidth.value) / 2
    cropStartY.value = imgOffsetY + (imgRect.height - cropHeight.value) / 2

    console.log('裁剪区域初始化：', {
      容器尺寸: containerRect,
      图片尺寸: imgRect,
      图片偏移: { x: imgOffsetX, y: imgOffsetY },
      裁剪框: {
        x: cropStartX.value,
        y: cropStartY.value,
        width: cropWidth.value,
        height: cropHeight.value
      }
    })
  }

  // 设置图片加载事件
  if (image.complete) {
    handleImageLoad() // 如果已经加载，直接调用
  } else {
    image.onload = handleImageLoad // 否则等待加载完成
  }
}

// 初始化裁剪工具
const setupCropTool = () => {
  isCropping.value = true
  isBrushing.value = false
  // 在下一个tick初始化裁剪区域
  setTimeout(initCropArea, 0)
}

// 调试Canvas和图片位置关系
const debugCanvasPosition = () => {
  const image = smartCutoutImageRef.value
  const canvas = smartCutoutCanvasRef.value
  const container = smartCutoutContainerRef.value

  if (!image || !canvas || !container) return

  console.log('🚨🚨🚨 [调试] ===== Canvas位置调试开始 =====')

  // 获取所有元素的详细信息
  const imageRect = image.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  console.log('🚨 [调试] 元素详细信息:')
  console.log('  图片元素:', {
    位置: { left: imageRect.left, top: imageRect.top },
    尺寸: { width: imageRect.width, height: imageRect.height },
    偏移尺寸: { offsetWidth: image.offsetWidth, offsetHeight: image.offsetHeight },
    原始尺寸: { naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight },
    样式: {
      position: window.getComputedStyle(image).position,
      transform: window.getComputedStyle(image).transform,
      margin: window.getComputedStyle(image).margin,
      padding: window.getComputedStyle(image).padding
    }
  })

  console.log('  Canvas元素:', {
    位置: { left: canvasRect.left, top: canvasRect.top },
    尺寸: { width: canvasRect.width, height: canvasRect.height },
    逻辑尺寸: { width: canvas.width, height: canvas.height },
    样式: {
      position: canvas.style.position,
      top: canvas.style.top,
      left: canvas.style.left,
      transform: window.getComputedStyle(canvas).transform,
      zIndex: canvas.style.zIndex
    }
  })

  console.log('  容器元素:', {
    位置: { left: containerRect.left, top: containerRect.top },
    尺寸: { width: containerRect.width, height: containerRect.height },
    样式: {
      position: window.getComputedStyle(container).position,
      overflow: window.getComputedStyle(container).overflow,
      transform: window.getComputedStyle(container).transform
    }
  })

  // 计算偏移差异
  const offsetDiff = {
    x: canvasRect.left - imageRect.left,
    y: canvasRect.top - imageRect.top
  }

  console.log('🚨 [调试] Canvas与图片的位置差异:', offsetDiff)

  // 在Canvas上绘制调试信息
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // 清除之前的绘制
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制红色边框
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 4
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // 绘制中心十字
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // 绘制文字信息
    ctx.fillStyle = 'red'
    ctx.font = '16px Arial'
    ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 30)
    ctx.fillText(`偏移: ${offsetDiff.x.toFixed(1)}, ${offsetDiff.y.toFixed(1)}`, 10, 50)
  }

  console.log('🚨🚨🚨 [调试] ===== Canvas位置调试结束 =====')
}

// 等待图片完全渲染
const waitForImageRender = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const checkImageRender = () => {
      const img = smartCutoutImageRef.value
      if (img && img.complete && img.offsetWidth > 0 && img.offsetHeight > 0) {
        console.log('🔧 图片渲染完成:', {
          complete: img.complete,
          offsetWidth: img.offsetWidth,
          offsetHeight: img.offsetHeight,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        })
        // 额外等待一帧，确保布局完成
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(true)
          })
        })
      } else {
        console.log('🔧 等待图片渲染...', {
          img: !!img,
          complete: img?.complete,
          offsetWidth: img?.offsetWidth,
          offsetHeight: img?.offsetHeight
        })
        setTimeout(checkImageRender, 50)
      }
    }
    checkImageRender()
  })
}

// 取消SAM上传
const cancelSamUpload = () => {
  console.log('🎯 用户取消SAM上传')

  if (samUploadController.value) {
    samUploadController.value.abort()
    samUploadController.value = null
  }

  showSamUploadProgress.value = false
  samUploadProgress.value = 0
  samUploadProgressText.value = '预处理图像中，请稍候...'

  // 重置状态
  currentTool.value = ''
  isSmartCutoutMode.value = false
  isImageLoadedToSAM.value = false

  // 关闭工具弹窗
  closeToolModal()

  ElMessage.info('已取消智能抠图')
}

// 智能抠图工具设置
const setupSmartCutoutTool = async () => {
  console.log('🎯 设置智能抠图工具')

  try {
    // 检查图片是否存在
    const currentImageUrl = editingImageUrl.value || props.imageUrl
    if (!currentImageUrl) {
      ElMessage.error('请先上传图片')
      return
    }

    // 先显示上传进度弹窗
    showSamUploadProgress.value = true
    samUploadProgress.value = 0
    samUploadProgressText.value = '预处理图像中，请稍候...'

    // 创建取消控制器
    samUploadController.value = new AbortController()

    // 启用智能抠图模式
    isSmartCutoutMode.value = true

    // 重置状态
    isImageLoadedToSAM.value = false
    smartCutoutPoints.value = []
    smartCutoutMask.value = ''
    smartCutoutResult.value = ''
    smartCutoutHistory.value = []
    hoverPreviewMask.value = ''
    isHovering.value = false

    // 第1阶段：开始处理 (1秒)
    await new Promise(resolve => setTimeout(resolve, 1000))
    samUploadProgress.value = 20
    samUploadProgressText.value = '正在处理图片格式...'

    // 第2阶段：转换图片格式 (1秒)
    await new Promise(resolve => setTimeout(resolve, 1000))
    samUploadProgress.value = 40
    samUploadProgressText.value = '正在转换图片格式...'

    let base64Data: string
    try {
      base64Data = await imageToBase64(currentImageUrl)
    } catch (error) {
      console.error('图片转换失败:', error)
      throw new Error('图片格式转换失败，请检查图片是否有效')
    }

    // 检查是否被取消
    if (samUploadController.value?.signal.aborted) {
      throw new Error('操作已取消')
    }

    // 第3阶段：上传到SAM服务器 (1.5秒)
    await new Promise(resolve => setTimeout(resolve, 1000))
    samUploadProgress.value = 60
    samUploadProgressText.value = '正在上传到SAM服务器...'

    try {
      // 真实连接SAM服务器
      await loadImageToSAM(base64Data)
      console.log('🎯 SAM上传成功')
    } catch (error) {
      console.error('SAM上传失败:', error)
      throw new Error('SAM服务器连接失败，请检查网络连接或稍后重试')
    }

    // 检查是否被取消
    if (samUploadController.value?.signal.aborted) {
      throw new Error('操作已取消')
    }

    // 第4阶段：初始化智能抠图 (1秒)
    await new Promise(resolve => setTimeout(resolve, 1000))
    samUploadProgress.value = 90
    samUploadProgressText.value = '正在初始化智能抠图...'
    isImageLoadedToSAM.value = true

    // 第5阶段：完成准备 (0.5秒)
    await new Promise(resolve => setTimeout(resolve, 500))
    samUploadProgress.value = 100
    samUploadProgressText.value = '准备完成！'

    // 让用户看到完成状态 (0.5秒)
    await new Promise(resolve => setTimeout(resolve, 500))

    // 关闭进度弹窗
    showSamUploadProgress.value = false

    // 显示智能抠图弹窗
    isToolModalVisible.value = true

    // 显示使用提示

    // 等待DOM更新后初始化，确保弹窗完全渲染
    nextTick(async () => {
      // 检查弹窗是否有transform变形
      const dialog = document.querySelector('.tool-modal .el-dialog')
      if (dialog) {
        const style = window.getComputedStyle(dialog)
        console.log('🔧 弹窗transform:', style.transform)
        console.log('🔧 弹窗scale:', style.scale)

        // 如果有变形，重置
        if (style.transform !== 'none') {
          dialog.style.transform = 'none'
        }
      }

      // 等待图片完全渲染
      await waitForImageRender()

      // 初始化Canvas
      await initSmartCutoutCanvas()

      // 再次确保Canvas位置正确对齐
      setTimeout(() => {
        adjustCanvasPosition()
      }, 200)
    })

  } catch (error: any) {
    console.error('🎯 智能抠图初始化失败:', error)
    showSamUploadProgress.value = false

    if (error.name === 'AbortError' || error.message === '操作已取消') {
      // 用户主动取消，不显示错误消息
      console.log('用户取消了智能抠图初始化')
      return
    }


    // 重置状态
    currentTool.value = ''
    isSmartCutoutMode.value = false
    closeToolModal()
  } finally {
    // 清理控制器
    samUploadController.value = null
  }
}

// 处理鼠标悬浮预览 - 只在第一个点时预览
// 处理鼠标悬浮预览 - 只在第一个点时预览
const handleSmartCutoutHover = async (event: MouseEvent) => {
  // 只在没有点击点时才显示悬浮预览（第一个点预览）
  if (smartCutoutPoints.value.length > 0) {
    console.log('🎯 [智能抠图] 已有点击点，跳过悬浮预览')
    return
  }

  // 如果图像未加载到SAM，先加载图像
  if (!isImageLoadedToSAM.value) {
    console.log('🎯 [智能抠图] 图像未加载到SAM，开始自动加载')
    try {
      const image = smartCutoutImageRef.value
      if (!image) {
        console.log('🎯 [智能抠图] 图像元素未找到，跳过预览')
        return
      }

      // 将图像转换为base64并加载到SAM
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) {
        console.log('🎯 [智能抠图] 无法创建Canvas，跳过预览')
        return
      }

      tempCanvas.width = image.naturalWidth
      tempCanvas.height = image.naturalHeight
      tempCtx.drawImage(image, 0, 0)

      const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.85)
      const base64Data = imageDataUrl.split(',')[1]

      console.log('🎯 [智能抠图] 开始加载图像到SAM')
      await loadImageToSAM(base64Data)
      isImageLoadedToSAM.value = true
      console.log('🎯 [智能抠图] 图像已成功加载到SAM，可以开始预览')
    } catch (error) {
      console.error('🎯 [智能抠图] 自动加载图像到SAM失败:', error)
      return
    }
  }

  const canvas = smartCutoutCanvasRef.value || smartCutoutImageRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = Math.round(event.clientX - rect.left)
  const y = Math.round(event.clientY - rect.top)

  // 防抖处理，避免频繁调用
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
  }

  hoverTimeout.value = setTimeout(async () => {
    try {
      // 再次检查是否已有点击点（防抖期间可能有点击）
      if (smartCutoutPoints.value.length > 0) {
        console.log('🎯 [智能抠图] 防抖期间已有点击，取消预览')
        return
      }

      isHovering.value = true

      console.log('🎯 [智能抠图] 开始悬浮预览（无点击状态）', { x, y })

      // 获取图片元素进行坐标映射
      const image = smartCutoutImageRef.value
      if (!image) return

      // 🔍 关键修改：使用智能缩放后的尺寸进行坐标映射
      const smartZoom = smartCutoutZoom.value
      console.log('🎯 [智能抠图] 当前智能缩放比例:', smartZoom)

      // 计算智能缩放后的实际尺寸
      const scaledWidth = Math.round(image.naturalWidth * smartZoom)
      const scaledHeight = Math.round(image.naturalHeight * smartZoom)

      // 计算从显示尺寸到缩放后尺寸的比例
      const scaleX = scaledWidth / image.offsetWidth
      const scaleY = scaledHeight / image.offsetHeight

      const originalX = Math.round(x * scaleX)
      const originalY = Math.round(y * scaleY)

      console.log('🎯 [智能抠图] 悬浮预览坐标映射', {
        原始图片尺寸: { width: image.naturalWidth, height: image.naturalHeight },
        智能缩放比例: smartZoom,
        缩放后尺寸: { width: scaledWidth, height: scaledHeight },
        显示尺寸: { width: image.offsetWidth, height: image.offsetHeight },
        坐标转换比例: { scaleX, scaleY },
        显示坐标: { x, y },
        映射坐标: { x: originalX, y: originalY }
      })

      // 直接使用分割API获取预览蒙版（因为当前没有点击点，所以不需要恢复状态）
      const response = await fetch(`${SAM_API_BASE}/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x: originalX,  // 使用映射后的坐标
          y: originalY,  // 使用映射后的坐标
          point_type: 'foreground'
        })
      })

      let result
      if (!response.ok) {
        // 尝试解析错误响应
        try {
          const errorText = await response.text()
          console.error('🎯 [智能抠图] 悬浮预览HTTP错误', {
            状态码: response.status,
            错误内容: errorText
          })

          // 检查是否是"图像未设置"错误（支持JSON格式和Unicode转义）
          if (errorText.includes('An image must be set') ||
            errorText.includes('set_image') ||
            errorText.includes('\\u5206\\u5272\\u5931\\u8d25') || // "分割失败"的Unicode
            errorText.includes('分割失败')) {
            console.log('🎯 [智能抠图] 悬浮预览检测到图像未设置错误，尝试重新加载图像并重试...')

            // 重新加载图像到SAM
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
              tempCanvas.width = image.naturalWidth
              tempCanvas.height = image.naturalHeight
              tempCtx.drawImage(image, 0, 0)

              const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.85)
              const base64Data = imageDataUrl.split(',')[1]

              await loadImageToSAM(base64Data)
              console.log('🎯 [智能抠图] 悬浮预览图像重新加载成功，开始重试预览...')

              // 重试预览请求
              const retryResponse = await fetch(`${SAM_API_BASE}/segment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  x: originalX,
                  y: originalY,
                  point_type: 'foreground'
                })
              })

              if (retryResponse.ok) {
                const retryResult = await retryResponse.json()
                if (retryResult.success) {
                  console.log('🎯 [智能抠图] 悬浮预览重试成功！')

                  // 设置预览蒙版
                  hoverPreviewMask.value = 'data:image/png;base64,' + retryResult.mask

                  // 绘制预览效果
                  await drawHoverPreview()

                  // 清除临时状态
                  await fetch(`${SAM_API_BASE}/clear_points`, {
                    method: 'POST'
                  })

                  // 重新加载图像保持状态干净
                  await loadImageToSAM(base64Data)
                  return // 成功，直接返回
                }
              }
            }
          }
        } catch (parseError) {
          console.error('🎯 [智能抠图] 无法解析错误响应:', parseError)
        }

        throw new Error(`预览请求失败: ${response.status}`)
      }

      result = await response.json()

      if (result.success) {
        console.log('🎯 [智能抠图] 预览蒙版获取成功')

        // 设置预览蒙版
        hoverPreviewMask.value = 'data:image/png;base64,' + result.mask

        // 绘制预览效果
        await drawHoverPreview()

        // 重要：清除SAM中的临时预览点（因为这只是预览，不是正式点击）
        console.log('🎯 [智能抠图] 清除预览临时点，保持SAM状态干净')
        await fetch(`${SAM_API_BASE}/clear_points`, {
          method: 'POST'
        })

        // 重新加载图像到SAM，确保下次操作时状态干净
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (tempCtx) {
          tempCanvas.width = image.naturalWidth
          tempCanvas.height = image.naturalHeight
          tempCtx.drawImage(image, 0, 0)

          const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.85)
          const base64Data = imageDataUrl.split(',')[1]

          await loadImageToSAM(base64Data)
          console.log('🎯 [智能抠图] SAM状态已重置，准备接受正式点击')
        }
      } else {
        // 检查是否是"图像未设置"错误，如果是则自动重新加载图像并重试
        const errorMessage = result.error || result.message || ''
        if (errorMessage.includes('An image must be set') || errorMessage.includes('set_image')) {
          console.log('🎯 [智能抠图] 悬浮预览检测到图像未设置错误，尝试重新加载图像并重试...')

          try {
            // 重新加载图像到SAM
            const tempCanvas = document.createElement('canvas')
            const tempCtx = tempCanvas.getContext('2d')
            if (tempCtx) {
              tempCanvas.width = image.naturalWidth
              tempCanvas.height = image.naturalHeight
              tempCtx.drawImage(image, 0, 0)

              const imageDataUrl = tempCanvas.toDataURL('image/jpeg', 0.85)
              const base64Data = imageDataUrl.split(',')[1]

              await loadImageToSAM(base64Data)
              console.log('🎯 [智能抠图] 悬浮预览图像重新加载成功，开始重试预览...')

              // 重试预览请求
              const retryResponse = await fetch(`${SAM_API_BASE}/segment`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  x: originalX,
                  y: originalY,
                  point_type: 'foreground'
                })
              })

              if (retryResponse.ok) {
                const retryResult = await retryResponse.json()
                if (retryResult.success) {
                  console.log('🎯 [智能抠图] 悬浮预览重试成功！')

                  // 设置预览蒙版
                  hoverPreviewMask.value = 'data:image/png;base64,' + retryResult.mask

                  // 绘制预览效果
                  await drawHoverPreview()

                  // 清除临时状态
                  await fetch(`${SAM_API_BASE}/clear_points`, {
                    method: 'POST'
                  })

                  // 重新加载图像保持状态干净
                  await loadImageToSAM(base64Data)
                  return // 成功，直接返回
                }
              }
            }

            console.error('🎯 [智能抠图] 悬浮预览重试仍然失败')
          } catch (retryError) {
            console.error('🎯 [智能抠图] 悬浮预览重试过程中发生错误:', retryError)
          }
        }

        console.error('🎯 [智能抠图] 悬浮预览失败:', result.error || result.message)
      }
    } catch (error) {
      console.error('🎯 [智能抠图] 悬浮预览失败:', error)
      // 静默失败，不显示错误消息
    }
  }, 150) // 增加防抖延迟，减少频繁调用
}


// 恢复原始SAM状态（用于分割API方案）
const restoreOriginalSAMState = async (originalPoints: Array<{ x: number, y: number, type: 'foreground' | 'background' }>, originalMask: string) => {
  try {
    console.log('🎯 [智能抠图] 开始恢复SAM状态', {
      原始点数: originalPoints.length,
      有原始蒙版: !!originalMask
    })

    // 清除所有点
    await fetch(`${SAM_API_BASE}/clear_points`, {
      method: 'POST'
    })

    // 如果原来没有点，直接返回
    if (originalPoints.length === 0) {
      console.log('🎯 [智能抠图] 原来没有点，SAM状态已恢复')
      return
    }

    // 重新加载图像到SAM
    const image = smartCutoutImageRef.value
    if (!image) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    ctx.drawImage(image, 0, 0)

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85)
    const base64Data = imageDataUrl.split(',')[1]

    await loadImageToSAM(base64Data)

    // 重新添加原始点
    for (const point of originalPoints) {
      await fetch(`${SAM_API_BASE}/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x: point.x,
          y: point.y,
          point_type: point.type
        })
      })
    }

    // 恢复原始蒙版
    if (originalMask) {
      smartCutoutMask.value = originalMask
    }

    console.log('🎯 [智能抠图] SAM状态已完全恢复')
  } catch (error) {
    console.error('🎯 [智能抠图] 恢复SAM状态失败:', error)
  }
}

// 绘制悬浮预览
// 绘制悬浮预览
const drawHoverPreview = async () => {
  if (!hoverPreviewMask.value) return

  const canvas = hoverPreviewCanvasRef.value
  const image = smartCutoutImageRef.value

  if (!canvas || !image) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  console.log('🎯 [智能抠图] 开始绘制悬浮预览')

  // 🔍 关键修改：使用智能缩放比例计算Canvas尺寸
  const smartZoom = smartCutoutZoom.value
  const scaledWidth = Math.round(image.naturalWidth * smartZoom)
  const scaledHeight = Math.round(image.naturalHeight * smartZoom)

  // 设置Canvas逻辑尺寸为智能缩放后的尺寸（与蒙版尺寸一致）
  canvas.width = scaledWidth
  canvas.height = scaledHeight

  // 设置Canvas显示尺寸为图片显示尺寸
  canvas.style.width = image.offsetWidth + 'px'
  canvas.style.height = image.offsetHeight + 'px'
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '15'

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  try {
    // 加载蒙版图片
    const maskImg = new Image()
    await new Promise((resolve, reject) => {
      maskImg.onload = resolve
      maskImg.onerror = reject
      maskImg.src = hoverPreviewMask.value
    })

    console.log('🎯 [智能抠图] 蒙版图片加载完成', {
      蒙版尺寸: { width: maskImg.width, height: maskImg.height },
      Canvas尺寸: { width: canvas.width, height: canvas.height }
    })

    // 绘制半透明蓝色预览效果（类似Meta SAM）
    await drawHoverPreviewEffect(ctx, maskImg, canvas.width, canvas.height)

    console.log('🎯 [智能抠图] 悬浮预览绘制完成')
  } catch (error) {
    console.error('🎯 [智能抠图] 绘制悬浮预览失败:', error)
  }
}

// 绘制悬浮预览效果（半透明蓝色蒙版，类似Meta SAM）
const drawHoverPreviewEffect = async (ctx: CanvasRenderingContext2D, maskImg: HTMLImageElement, width: number, height: number) => {
  // 创建临时Canvas处理蒙版
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = maskImg.width
  tempCanvas.height = maskImg.height

  // 绘制蒙版
  tempCtx.drawImage(maskImg, 0, 0)
  const maskData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)

  // 计算缩放比例
  const scaleX = width / maskImg.width
  const scaleY = height / maskImg.height

  console.log('🎯 [智能抠图] 预览效果缩放比例', { scaleX, scaleY })

  // 绘制半透明蓝色预览蒙版（类似Meta SAM的效果）
  ctx.fillStyle = 'rgba(0, 150, 255, 0.4)' // 半透明蓝色，比正式高亮更淡

  for (let y = 0; y < maskImg.height; y++) {
    for (let x = 0; x < maskImg.width; x++) {
      const idx = (y * maskImg.width + x) * 4
      const maskValue = maskData.data[idx] // 红色通道

      if (maskValue > 128) { // 白色区域（选中区域）
        // 映射到目标Canvas坐标
        const canvasX = Math.floor(x * scaleX)
        const canvasY = Math.floor(y * scaleY)
        const pixelWidth = Math.max(1, Math.ceil(scaleX))
        const pixelHeight = Math.max(1, Math.ceil(scaleY))

        // 绘制半透明蓝色像素
        ctx.fillRect(canvasX, canvasY, pixelWidth, pixelHeight)
      }
    }
  }

  console.log('🎯 [智能抠图] 悬浮预览效果绘制完成')
}

// 清除悬浮预览
const clearHoverPreview = () => {
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
    hoverTimeout.value = null
  }
  isHovering.value = false
  hoverPreviewMask.value = ''

  const canvas = hoverPreviewCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  console.log('🎯 [智能抠图] 悬浮预览已清除')
}

// 重复的drawHoverPreview函数已删除

// 显示智能抠图帮助提示
const showCutoutHelp = () => {
  ElMessage({
    message: '左键添加正点(保留)，右键添加负点(去除)',
    type: 'info',
    duration: 3000,
    showClose: true
  })
}

// 撤销智能抠图点
const undoSmartCutoutPoint = async () => {
  if (smartCutoutPoints.value.length === 0) return

  try {
    // 保存当前状态到历史记录
    if (smartCutoutPoints.value.length > 0) {
      smartCutoutHistory.value.push({
        points: [...smartCutoutPoints.value],
        mask: smartCutoutMask.value
      })
    }

    // 移除最后一个点
    smartCutoutPoints.value.pop()

    if (smartCutoutPoints.value.length === 0) {
      // 如果没有点了，清除蒙版
      smartCutoutMask.value = ''
      clearCutoutResult()

      // 调用SAM清除API
      await fetch(`${SAM_API_BASE}/clear_points`, {
        method: 'POST'
      })
    } else {
      // 重新计算蒙版
      await recalculateSmartCutoutMask()
    }

    ElMessage.success('已撤销上一步操作')
  } catch (error) {
    console.error('撤销操作失败:', error)
    ElMessage.error('撤销失败')
  }
}

// 重新计算智能抠图蒙版
const recalculateSmartCutoutMask = async () => {
  if (smartCutoutPoints.value.length === 0) return

  try {
    // 重新加载图像到SAM
    const base64Data = await imageToBase64(editingImageUrl.value)
    await loadImageToSAM(base64Data)

    // 重新添加所有点
    for (const point of smartCutoutPoints.value) {
      const response = await fetch(`${SAM_API_BASE}/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x: point.x,
          y: point.y,
          point_type: point.type
        })
      })

      const result = await response.json()
      if (result.success) {
        smartCutoutMask.value = 'data:image/png;base64,' + result.mask
      }
    }

    // 重新绘制结果
    if (smartCutoutMask.value) {
      await drawSmartCutoutResultWithHighlight()
    }
  } catch (error) {
    console.error('重新计算蒙版失败:', error)
  }
}

// 清除抠图结果
const clearCutoutResult = () => {
  const canvas = cutoutResultCanvasRef.value
  if (canvas) {
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

// 修改后的 adjustCanvasPosition 函数
// 调整Canvas位置，确保与图片完美对齐
const adjustCanvasPosition = () => {
  const image = smartCutoutImageRef.value
  const canvas = smartCutoutCanvasRef.value
  const container = smartCutoutContainerRef.value

  if (!image || !canvas || !container) return

  console.log('🔧 开始新的Canvas定位方法')

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const imageRect = image.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const exactLeft = imageRect.left - containerRect.left
      const exactTop = imageRect.top - containerRect.top

      // 🔍 关键修改：Canvas逻辑尺寸使用智能缩放后的尺寸
      const smartZoom = smartCutoutZoom.value
      const scaledWidth = Math.round(image.naturalWidth * smartZoom)
      const scaledHeight = Math.round(image.naturalHeight * smartZoom)

      console.log('🔧 Canvas尺寸设置:', {
        原始尺寸: { width: image.naturalWidth, height: image.naturalHeight },
        智能缩放比例: smartZoom,
        缩放后尺寸: { width: scaledWidth, height: scaledHeight },
        显示尺寸: { width: imageRect.width, height: imageRect.height }
      })

      // 设置Canvas逻辑尺寸为智能缩放后的尺寸
      canvas.width = scaledWidth
      canvas.height = scaledHeight

      // 设置Canvas显示尺寸为图片显示尺寸
      canvas.style.position = 'absolute'
      canvas.style.top = `${exactTop}px`
      canvas.style.left = `${exactLeft}px`
      canvas.style.width = `${imageRect.width}px`
      canvas.style.height = `${imageRect.height}px`
      canvas.style.pointerEvents = 'auto'
      canvas.style.zIndex = '10'
      canvas.style.border = 'none'
    })
  })
}




// 初始化智能抠图Canvas
// 初始化智能抠图Canvas
const initSmartCutoutCanvas = async () => {
  const image = smartCutoutImageRef.value
  const canvas = smartCutoutCanvasRef.value

  console.log('🔧 [智能抠图] 开始初始化Canvas检查:', {
    image: !!image,
    canvas: !!canvas,
    imageComplete: image?.complete,
    imageOffsetWidth: image?.offsetWidth,
    imageOffsetHeight: image?.offsetHeight,
    imageNaturalWidth: image?.naturalWidth,
    imageNaturalHeight: image?.naturalHeight
  })

  if (!image || !canvas) {
    console.warn('🔧 [智能抠图] 元素未找到，延迟重试...')
    setTimeout(() => {
      initSmartCutoutCanvas()
    }, 1000)
    return
  }

  // 关键：确保图片完全加载并渲染
  if (!image.complete) {
    console.log('🔧 等待图片加载完成...')
    await new Promise((resolve) => {
      image.onload = resolve
      // 防止永远等待
      setTimeout(resolve, 5000)
    })
  }

  // 再次确认图片尺寸
  if (image.offsetWidth === 0 || image.offsetHeight === 0) {
    console.log('🔧 图片尺寸为0，延迟重试...')
    setTimeout(initSmartCutoutCanvas, 500)
    return
  }

  console.log('🔧 开始初始化Canvas，图片尺寸确认:', {
    offset: { width: image.offsetWidth, height: image.offsetHeight },
    natural: { width: image.naturalWidth, height: image.naturalHeight }
  })

  // 🔍 关键：先设置智能缩放
  console.log('🔍 开始设置智能抠图缩放...')
  setSmartCutoutInitialZoom()

  // 等待缩放动画完成
  await new Promise(resolve => setTimeout(resolve, 500))

  // 然后调整Canvas位置
  adjustCanvasPosition()

  // 再等待一下确保位置稳定
  await new Promise(resolve => setTimeout(resolve, 200))

  // 最后进行调试
  setTimeout(() => {
    debugCanvasPosition()
  }, 100)

  console.log('🔧 [智能抠图] Canvas初始化完成')

  // 将图片转换为base64并加载到SAM
  try {
    const base64Data = await imageToBase64(editingImageUrl.value)
    // 真实连接SAM服务器
    await loadImageToSAM(base64Data)
    isImageLoadedToSAM.value = true
    console.log('🔧 SAM加载成功')
  } catch (error) {
    console.error('初始化SAM失败:', error)
    ElMessage.error('初始化智能抠图失败')
  }
}

// 将图片转换为base64，并自动应用智能缩放
const imageToBase64 = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'))
        return
      }

      // 🔍 关键修改：计算智能缩放比例
      const originalWidth = img.width
      const originalHeight = img.height
      const smartZoom = calculateSmartCutoutZoom(originalWidth, originalHeight)

      // 计算缩放后的尺寸
      const scaledWidth = Math.round(originalWidth * smartZoom)
      const scaledHeight = Math.round(originalHeight * smartZoom)

      console.log('🔍 智能抠图图片转换:', {
        原始尺寸: `${originalWidth}x${originalHeight}`,
        缩放比例: smartZoom,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`
      })

      // 设置Canvas为缩放后的尺寸
      canvas.width = scaledWidth
      canvas.height = scaledHeight

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

      // 同时更新显示图片的缩放
      smartCutoutZoom.value = smartZoom
      setTimeout(() => {
        applySmartCutoutZoom()
      }, 100)

      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      resolve(base64)
    }
    img.onerror = reject
    img.src = imageUrl
  })
}












// 生成真正的抠图结果
const generateCutoutResult = async (): Promise<string> => {
  const image = smartCutoutImageRef.value
  if (!image || !smartCutoutMask.value) return ''

  // 创建离屏Canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // 设置Canvas尺寸为图片原始尺寸
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  // 加载蒙版图片
  const maskImg = new Image()
  await new Promise((resolve) => {
    maskImg.onload = resolve
    maskImg.src = smartCutoutMask.value
  })

  // 绘制原图
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // 创建临时Canvas处理蒙版
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = maskImg.width
  maskCanvas.height = maskImg.height
  const maskCtx = maskCanvas.getContext('2d')
  if (!maskCtx) return ''

  maskCtx.drawImage(maskImg, 0, 0)
  const maskData = maskCtx.getImageData(0, 0, maskImg.width, maskImg.height)

  // 应用蒙版处理
  const scaleX = canvas.width / maskImg.width
  const scaleY = canvas.height / maskImg.height

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const imgIdx = (y * canvas.width + x) * 4

      // 映射到蒙版坐标
      const maskX = Math.floor(x / scaleX)
      const maskY = Math.floor(y / scaleY)
      const maskIdx = (maskY * maskImg.width + maskX) * 4

      // 如果蒙版对应位置是黑色（背景），设置为透明
      if (maskData.data[maskIdx] < 128) {
        imageData.data[imgIdx + 3] = 0 // 设置透明度为0
      }
    }
  }

  // 应用处理后的数据
  ctx.putImageData(imageData, 0, 0)

  // 返回base64格式的抠图结果
  return canvas.toDataURL('image/png')
}

// 下载智能抠图结果
const downloadSmartCutout = async () => {
  if (!smartCutoutMask.value || smartCutoutPoints.value.length === 0) {
    ElMessage.warning('请先完成抠图操作')
    return
  }

  try {
    ElMessage.info('正在生成抠图结果...')

    // 创建处理后的抠图结果
    const processedImage = await generateCutoutResult()

    if (processedImage) {
      // 下载处理后的图片
      const link = document.createElement('a')
      link.download = `smart_cutout_${Date.now()}.png`
      link.href = processedImage
      link.click()

      ElMessage.success('抠图结果已下载')
    } else {
      throw new Error('生成抠图结果失败')
    }
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败: ' + (error.message || '未知错误'))
  }
}

// 处理裁剪框拖动
const handleCropAreaMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  isDragging.value = true
  dragStartX.value = e.clientX - cropStartX.value
  dragStartY.value = e.clientY - cropStartY.value
}

// 处理控制点拖动
const handleControlPointMouseDown = (point: string, e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  activeControlPoint.value = point
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !isCropping.value) return

  const container = cropContainerRef.value
  const image = cropImageRef.value
  if (!container || !image) return

  const containerRect = container.getBoundingClientRect()
  const imgRect = image.getBoundingClientRect()
  const minSize = 100 // 最小裁剪尺寸

  // 计算图片相对于容器的边界
  const imgOffsetX = imgRect.left - containerRect.left
  const imgOffsetY = imgRect.top - containerRect.top
  const imgMaxX = imgOffsetX + imgRect.width
  const imgMaxY = imgOffsetY + imgRect.height

  if (activeControlPoint.value) {
    // 处理控制点拖动
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value

    switch (activeControlPoint.value) {
      case 'top-left':
        const newWidthTL = cropWidth.value - deltaX
        const newHeightTL = cropHeight.value - deltaY
        if (newWidthTL >= minSize && newHeightTL >= minSize) {
          cropWidth.value = Math.min(newWidthTL, cropStartX.value + cropWidth.value - imgOffsetX)
          cropHeight.value = Math.min(newHeightTL, cropStartY.value + cropHeight.value - imgOffsetY)
          cropStartX.value = Math.max(imgOffsetX, cropStartX.value + deltaX)
          cropStartY.value = Math.max(imgOffsetY, cropStartY.value + deltaY)
        }
        break
      case 'top-right':
        const newWidthTR = cropWidth.value + deltaX
        const newHeightTR = cropHeight.value - deltaY
        if (newWidthTR >= minSize && newHeightTR >= minSize) {
          cropWidth.value = Math.min(newWidthTR, imgMaxX - cropStartX.value)
          cropHeight.value = Math.min(newHeightTR, cropStartY.value + cropHeight.value - imgOffsetY)
          cropStartY.value = Math.max(imgOffsetY, cropStartY.value + deltaY)
        }
        break
      case 'bottom-left':
        const newWidthBL = cropWidth.value - deltaX
        const newHeightBL = cropHeight.value + deltaY
        if (newWidthBL >= minSize && newHeightBL >= minSize) {
          cropWidth.value = Math.min(newWidthBL, cropStartX.value + cropWidth.value - imgOffsetX)
          cropHeight.value = Math.min(newHeightBL, imgMaxY - cropStartY.value)
          cropStartX.value = Math.max(imgOffsetX, cropStartX.value + deltaX)
        }
        break
      case 'bottom-right':
        const newWidthBR = cropWidth.value + deltaX
        const newHeightBR = cropHeight.value + deltaY
        if (newWidthBR >= minSize && newHeightBR >= minSize) {
          cropWidth.value = Math.min(newWidthBR, imgMaxX - cropStartX.value)
          cropHeight.value = Math.min(newHeightBR, imgMaxY - cropStartY.value)
        }
        break
      case 'top':
        const newHeightT = cropHeight.value - deltaY
        if (newHeightT >= minSize) {
          cropHeight.value = Math.min(newHeightT, cropStartY.value + cropHeight.value - imgOffsetY)
          cropStartY.value = Math.max(imgOffsetY, cropStartY.value + deltaY)
        }
        break
      case 'right':
        const newWidthR = cropWidth.value + deltaX
        if (newWidthR >= minSize) {
          cropWidth.value = Math.min(newWidthR, imgMaxX - cropStartX.value)
        }
        break
      case 'bottom':
        const newHeightB = cropHeight.value + deltaY
        if (newHeightB >= minSize) {
          cropHeight.value = Math.min(newHeightB, imgMaxY - cropStartY.value)
        }
        break
      case 'left':
        const newWidthL = cropWidth.value - deltaX
        if (newWidthL >= minSize) {
          cropWidth.value = Math.min(newWidthL, cropStartX.value + cropWidth.value - imgOffsetX)
          cropStartX.value = Math.max(imgOffsetX, cropStartX.value + deltaX)
        }
        break
    }

    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
  } else {
    // 处理整个裁剪框拖动
    const newX = e.clientX - dragStartX.value
    const newY = e.clientY - dragStartY.value

    cropStartX.value = Math.max(imgOffsetX, Math.min(newX, imgMaxX - cropWidth.value))
    cropStartY.value = Math.max(imgOffsetY, Math.min(newY, imgMaxY - cropHeight.value))
  }
}

// 处理鼠标释放
const handleMouseUp = () => {
  isDragging.value = false
  activeControlPoint.value = ''
}

// 上传编辑后的图片到服务器
const uploadEditedImage = (base64Image: string): Promise<{ url: string; id?: number }> => {
  return new Promise((resolve, reject) => {
    // 检查用户是否已登录
    if (!isUserLoggedIn()) {
      ElMessageBox.confirm(
        '您需要登录才能保存图片。是否现在登录？',
        '未登录提示',
        {
          confirmButtonText: '去登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 保存当前页面路径，登录后可以返回
        localStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
        // 导航到登录页
        router.push('/login')
      }).catch(() => {
        ElMessage.info('您可以继续使用本地编辑功能，但无法保存到服务器')
      })

      // 仍然返回本地图片以保持编辑效果
      resolve({ url: base64Image })
      return
    }

    // 将base64转换为文件对象
    const byteString = atob(base64Image.split(',')[1])
    const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([ab], { type: mimeString })
    const file = new File([blob], `edited_image_${Date.now()}.png`, { type: 'image/png' })

    const loading = ElLoading.service({
      lock: true,
      text: '保存图片中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    // 检查文件大小，如果超过5MB则压缩
    if (file.size > 5 * 1024 * 1024) {
      compressImage(file).then(compressedFile => {
        doUpload(compressedFile)
      }).catch(err => {
        ElMessage.error('图片压缩失败：' + err.message)
        loading.close()
        reject(err)
      })
    } else {
      doUpload(file)
    }

    function doUpload(fileToUpload: File) {
      // 上传文件
      uploadImage(fileToUpload)
        .then((response: any) => {
          if (response.code === 0 || response.code === 200) {
            const imageData = response.data as UploadImageResponse

            // 保存图片ID
            const imageId = imageData.id

            // 获取图片URL
            return feedbackImage(imageId).then(feedbackResponse => {
              // 返回包含图片ID的对象和直接从反馈接口获取的URL
              return {
                feedbackResponse,
                imageId,
                directUrl: feedbackResponse.data // 直接保存从服务器返回的Blob URL
              }
            })
          } else {
            // 如果是数据库编码错误，我们仍然使用本地图片
            if (response.code === 423) {
              console.warn('上传成功但服务器日志记录失败，使用本地图片预览')
              const localUrl = URL.createObjectURL(fileToUpload)
              resolve({ url: localUrl })
              ElMessage.warning('图片已保存但可能无法从服务器获取，使用本地预览')
              return Promise.reject(new Error('server_log_error'))
            } else if (response.code === 401) {
              // 登录已过期或无效
              ElMessageBox.confirm(
                '您的登录已过期，需要重新登录。是否现在登录？',
                '登录过期',
                {
                  confirmButtonText: '去登录',
                  cancelButtonText: '取消',
                  type: 'warning'
                }
              ).then(() => {
                // 清除无效的token
                localStorage.removeItem('token')
                // 保存当前页面路径，登录后可以返回
                localStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
                // 导航到登录页
                router.push('/login')
              }).catch(() => {
                ElMessage.info('您可以继续使用本地编辑功能，但无法保存到服务器')
              })

              // 仍然返回本地图片
              resolve({ url: base64Image })
              return Promise.reject(new Error('login_required'))
            }
            throw new Error(response.msg || '上传失败')
          }
        })
        .then((result: any) => {
          if (result.feedbackResponse.code === 0 || result.feedbackResponse.code === 200) {
            // 使用从服务器返回的URL对象
            const imageUrl = result.directUrl
            // 如果URL是blob对象，直接使用
            resolve({ url: imageUrl, id: result.imageId })
            ElMessage.success('图片保存成功')
          } else {
            throw new Error(result.feedbackResponse.msg || '获取图片地址失败')
          }
        })
        .catch((error: any) => {
          if (error.message === 'server_log_error' || error.message === 'login_required') {
            // 已经处理过了，不需要额外显示错误
            return
          }

          console.error('图片保存失败:', error)
          // 如果是网络错误，提供更详细的错误信息
          if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            ElMessage.error({
              message: '网络连接失败，请检查网络设置',
              duration: 5000
            })
          } else {
            ElMessage.error({
              message: '图片保存失败: ' + (error.message || '未知错误'),
              duration: 5000
            })
          }
          reject(error)
        })

      // 使用setTimeout确保loading最终会关闭
      setTimeout(() => {
        loading.close()
      }, 1000)
    }
  })
}

// 压缩图片函数
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 限制最大尺寸为1600px
        const maxSize = 1600
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        // 压缩为80%质量的JPEG
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('压缩失败'))
          }
        }, 'image/jpeg', 0.8)
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
  })
}

// 确认裁剪
const confirmCrop = () => {
  isSegmentationOnly.value = false
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const image = cropImageRef.value
  if (!ctx || !image) return

  try {
    // 获取裁剪区域的尺寸和位置
    const cropArea = {
      x: cropStartX.value,
      y: cropStartY.value,
      width: cropWidth.value,
      height: cropHeight.value
    }

    // 获取图片实际显示尺寸和容器信息
    const imageRect = image.getBoundingClientRect()
    const containerRect = cropContainerRef.value?.getBoundingClientRect()

    if (!containerRect) {
      throw new Error('无法获取容器信息')
    }

    // 计算图片相对于容器的偏移
    const imgOffsetX = imageRect.left - containerRect.left
    const imgOffsetY = imageRect.top - containerRect.top

    // 计算裁剪区域相对于图片的坐标（而不是相对于容器）
    const cropAreaRelativeToImage = {
      x: cropArea.x - imgOffsetX,
      y: cropArea.y - imgOffsetY,
      width: cropArea.width,
      height: cropArea.height
    }

    // 计算从显示尺寸到原始图片尺寸的缩放比例
    const scaleX = image.naturalWidth / imageRect.width
    const scaleY = image.naturalHeight / imageRect.height

    // 记录原始尺寸对应的裁剪区域
    const originalCropArea = {
      x: Math.round(cropAreaRelativeToImage.x * scaleX),
      y: Math.round(cropAreaRelativeToImage.y * scaleY),
      width: Math.round(cropAreaRelativeToImage.width * scaleX),
      height: Math.round(cropAreaRelativeToImage.height * scaleY)
    }

    console.log('裁剪参数：', {
      容器尺寸: containerRect,
      图片显示尺寸: {
        width: imageRect.width,
        height: imageRect.height
      },
      图片原始尺寸: {
        width: image.naturalWidth,
        height: image.naturalHeight
      },
      图片偏移: {
        x: imgOffsetX,
        y: imgOffsetY
      },
      缩放比例: {
        x: scaleX,
        y: scaleY
      },
      裁剪区域_容器坐标: cropArea,
      裁剪区域_图片坐标: cropAreaRelativeToImage,
      裁剪区域_原始坐标: originalCropArea
    })

    // 设置canvas大小为裁剪区域的原始尺寸
    canvas.width = originalCropArea.width
    canvas.height = originalCropArea.height

    try {
      // 尝试绘制裁剪后的图片到canvas
      ctx.drawImage(
        image,
        originalCropArea.x,  // 源图像的X坐标
        originalCropArea.y,  // 源图像的Y坐标
        originalCropArea.width,  // 源图像的宽度
        originalCropArea.height, // 源图像的高度
        0, 0,  // canvas的起始点
        originalCropArea.width,  // canvas的宽度
        originalCropArea.height  // canvas的高度
      )

      // 尝试转换为base64
      const croppedImage = canvas.toDataURL('image/png')

      // 上传到服务器
      uploadEditedImage(croppedImage)
        .then((result) => {
          editingImageUrl.value = result.url // 只在弹窗内更新显示
          // 保存编辑信息，等待用户点击"完成编辑"
          hasEdits.value = true
          editedImageInfo.value = { url: result.url, id: result.id }
          // ElMessage.success('裁剪成功')
        })
        .catch((error) => {
          editingImageUrl.value = croppedImage
          // 即使上传失败，也标记为有编辑
          hasEdits.value = true
          editedImageInfo.value = { url: croppedImage }
        })
        .then(() => {
          // 重置裁剪状态
          isCropping.value = false
          currentTool.value = ''

          // 关闭弹窗
          closeToolModal()
        })
    } catch (canvasError) {
      console.error('Canvas操作失败 (CORS错误):', canvasError)
      // 如果是CORS错误，我们直接请求服务器进行裁剪处理

      // 优先使用当前编辑后的图片，如果没有编辑则使用原始图片
      const currentImageUrl = editingImageUrl.value || props.imageUrl

      // 从URL中提取图片名称
      let imageName = ''
      if (currentImageUrl) {
        const urlParts = currentImageUrl.split('?')
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1])
          imageName = params.get('name') || ''
        }
      }

      if (imageName) {
        // 构造裁剪请求数据（假设后端有裁剪API）
        // 注意：这里假设您有一个裁剪API可用，需要根据实际情况调整
        const loading = ElLoading.service({
          lock: true,
          text: '正在裁剪...',
          background: 'rgba(0, 0, 0, 0.7)'
        })

        ElMessage.info('正在使用服务器端裁剪...')

        // 假设已有裁剪API，如果没有，需要添加实现
        // cropImage(imageName, originalCropArea)
        //   .then(response => { ... })

        // 由于可能没有API，我们简单返回当前图片
        const imageId = parseInt(imageName, 10) || 0
        emit('imageEdited', currentImageUrl, imageId)
        ElMessage.warning('由于跨域限制，无法在浏览器进行裁剪，请联系管理员配置CORS')

        loading.close()
        isCropping.value = false
        currentTool.value = ''
        closeToolModal()
      } else {
        throw new Error('无法获取图片名称进行服务器裁剪')
      }
    }
  } catch (error) {
    console.error('裁剪处理失败:', error)
    ElMessage.error('裁剪处理失败，请重试')

    // 重置裁剪状态
    isCropping.value = false
    currentTool.value = ''

    // 关闭弹窗
    closeToolModal()
  }
}



// 初始化涂抹Canvas
const initBrushCanvas = () => {
  const canvas = brushCanvasRef.value
  const image = brushImageRef.value
  const container = brushContainerRef.value
  if (!canvas || !image || !container) return

  // 定义图片加载函数
  const handleImageLoad = () => {
    // 等待图片完全渲染
    setTimeout(() => {
      // 获取图片的实际显示尺寸和位置
      const imgRect = image.getBoundingClientRect()
      const imgWidth = Math.round(imgRect.width)
      const imgHeight = Math.round(imgRect.height)

      console.log('涂抹工具初始化 - 图片尺寸:', {
        width: imgWidth,
        height: imgHeight,
        rect: imgRect
      })

      // 设置Canvas尺寸与图片显示尺寸完全一致
      canvas.width = imgWidth
      canvas.height = imgHeight

      // 确保Canvas与图片完全重叠，使用精确的像素定位
      canvas.style.position = 'absolute'
      canvas.style.top = `${imgRect.top - container.getBoundingClientRect().top}px`
      canvas.style.left = `${imgRect.left - container.getBoundingClientRect().left}px`
      canvas.style.width = `${imgWidth}px`
      canvas.style.height = `${imgHeight}px`
      canvas.style.pointerEvents = 'auto'
      canvas.style.zIndex = '10'

      // 获取Canvas上下文
      const ctx = canvas.getContext('2d', { alpha: true })
      if (ctx) {
        brushContext.value = ctx

        // 清除画布，设置完全透明背景
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 设置初始绘图状态
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'rgba(128, 128, 128, 1)'
        ctx.fillStyle = 'rgba(128, 128, 128, 1)'
        ctx.globalAlpha = 1.0 // 确保完全不透明
        ctx.lineWidth = brushSize.value

        console.log('涂抹画布已初始化，位置和尺寸:', {
          canvas: {
            width: canvas.width,
            height: canvas.height,
            style: {
              top: canvas.style.top,
              left: canvas.style.left,
              width: canvas.style.width,
              height: canvas.style.height
            }
          },
          image: {
            rect: {
              top: imgRect.top,
              left: imgRect.left,
              width: imgRect.width,
              height: imgRect.height
            }
          },
          container: {
            rect: container.getBoundingClientRect()
          }
        })
      }
    }, 200) // 增加延迟确保图片完全渲染
  }

  // 设置图片加载事件
  if (image.complete) {
    handleImageLoad() // 如果已经加载，直接调用
  } else {
    image.onload = handleImageLoad // 否则等待加载完成
  }
}

// 初始化涂抹工具
const setupBrushTool = () => {
  isBrushing.value = true
  isCropping.value = false
  // 在下一个tick初始化涂抹区域
  setTimeout(initBrushCanvas, 0)
}

// 开始涂抹
const startBrushing = (e: MouseEvent) => {
  isPainting.value = true
  const ctx = brushContext.value
  if (!ctx) return

  const canvas = brushCanvasRef.value
  if (!canvas) return

  // 获取准确的鼠标位置相对于画布的坐标
  const rect = canvas.getBoundingClientRect()
  const x = Math.round(e.clientX - rect.left)
  const y = Math.round(e.clientY - rect.top)

  // 位置调试日志
  console.log('开始涂抹', {
    clientX: e.clientX,
    clientY: e.clientY,
    canvasRect: rect,
    relativeX: x,
    relativeY: y
  })

  // 开始新的绘制路径
  ctx.beginPath()
  ctx.arc(x, y, brushSize.value / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x, y)
}

// 处理涂抹中
const handleBrushing = (e: MouseEvent) => {
  if (!isPainting.value) return

  const ctx = brushContext.value
  if (!ctx) return

  const canvas = brushCanvasRef.value
  if (!canvas) return

  // 获取准确的鼠标位置相对于画布的坐标
  const rect = canvas.getBoundingClientRect()
  // 精确计算鼠标位置，考虑到可能的小数点
  const x = Math.round(e.clientX - rect.left)
  const y = Math.round(e.clientY - rect.top)

  // 设置线宽
  ctx.lineWidth = brushSize.value

  // 绘制线条
  ctx.lineTo(x, y)
  ctx.stroke()

  // 绘制圆形笔触效果，确保路径连续平滑
  ctx.beginPath()
  ctx.arc(x, y, brushSize.value / 2, 0, Math.PI * 2)
  ctx.fill()

  // 继续新的绘制路径
  ctx.beginPath()
  ctx.moveTo(x, y)
}

// 停止涂抹
const stopBrushing = () => {
  isPainting.value = false
}

// 确认涂抹
const confirmBrush = () => {
  isSegmentationOnly.value = false
  try {
    const image = brushImageRef.value
    const brushCanvas = brushCanvasRef.value
    if (!image || !brushCanvas || !brushContext.value) return

    // 获取图片的原始尺寸和Canvas的显示尺寸
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight
    const canvasWidth = brushCanvas.width
    const canvasHeight = brushCanvas.height

    console.log('确认涂抹 - 尺寸信息:', {
      natural: { width: naturalWidth, height: naturalHeight },
      canvas: { width: canvasWidth, height: canvasHeight }
    })

    // 创建一个临时canvas来处理最终图像
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // 设置canvas大小为图片的原始尺寸
    tempCanvas.width = naturalWidth
    tempCanvas.height = naturalHeight

    try {
      // 1. 绘制原图到原始尺寸
      tempCtx.drawImage(image, 0, 0, naturalWidth, naturalHeight)

      // 2. 获取涂抹区域的数据（Canvas尺寸）
      const brushData = brushContext.value.getImageData(0, 0, canvasWidth, canvasHeight)

      // 调试：检查涂抹数据
      let brushPixelCount = 0
      for (let i = 0; i < brushData.data.length; i += 4) {
        if (brushData.data[i] > 0 &&
          brushData.data[i] === brushData.data[i + 1] &&
          brushData.data[i] === brushData.data[i + 2]) {
          brushPixelCount++
        }
      }
      console.log('涂抹像素数量:', brushPixelCount, '总像素:', brushData.data.length / 4)

      // 3. 创建一个新的canvas用于最终输出
      const outputCanvas = document.createElement('canvas')
      const outputCtx = outputCanvas.getContext('2d')
      if (!outputCtx) return

      outputCanvas.width = naturalWidth
      outputCanvas.height = naturalHeight

      // 4. 设置透明背景
      outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height)

      // 5. 使用涂抹区域作为蒙版提取原图内容
      const imageData = tempCtx.getImageData(0, 0, naturalWidth, naturalHeight)
      const finalImageData = outputCtx.createImageData(naturalWidth, naturalHeight)

      // 计算缩放比例
      const scaleX = naturalWidth / canvasWidth
      const scaleY = naturalHeight / canvasHeight

      console.log('涂抹处理 - 缩放比例:', { scaleX, scaleY })

      let extractedPixelCount = 0

      // 遍历原始图片的每个像素
      for (let y = 0; y < naturalHeight; y++) {
        for (let x = 0; x < naturalWidth; x++) {
          // 计算在Canvas尺寸中的对应位置
          const canvasX = Math.round(x / scaleX)
          const canvasY = Math.round(y / scaleY)

          // 确保在Canvas范围内
          if (canvasX >= 0 && canvasX < canvasWidth && canvasY >= 0 && canvasY < canvasHeight) {
            // 获取涂抹数据中对应位置的像素
            const brushIdx = (canvasY * canvasWidth + canvasX) * 4

            // 如果是涂抹区域（灰色，RGB值相等且不为0）
            if (brushData.data[brushIdx] > 0 &&
              brushData.data[brushIdx] === brushData.data[brushIdx + 1] &&
              brushData.data[brushIdx] === brushData.data[brushIdx + 2]) {
              // 复制原图像素
              const imgIdx = (y * naturalWidth + x) * 4
              finalImageData.data[imgIdx] = imageData.data[imgIdx]         // R
              finalImageData.data[imgIdx + 1] = imageData.data[imgIdx + 1] // G
              finalImageData.data[imgIdx + 2] = imageData.data[imgIdx + 2] // B
              finalImageData.data[imgIdx + 3] = 255                       // A
              extractedPixelCount++
            } else {
              // 非涂抹区域设为白色
              const imgIdx = (y * naturalWidth + x) * 4
              finalImageData.data[imgIdx] = 255     // R
              finalImageData.data[imgIdx + 1] = 255 // G
              finalImageData.data[imgIdx + 2] = 255 // B
              finalImageData.data[imgIdx + 3] = 255 // A (不透明)
            }
          } else {
            // 超出Canvas范围的部分也设为白色
            const imgIdx = (y * naturalWidth + x) * 4
            finalImageData.data[imgIdx] = 255     // R
            finalImageData.data[imgIdx + 1] = 255 // G
            finalImageData.data[imgIdx + 2] = 255 // B
            finalImageData.data[imgIdx + 3] = 255 // A (不透明)
          }
        }
      }

      console.log('提取的像素数量:', extractedPixelCount, '总像素:', naturalWidth * naturalHeight)

      // 6. 将处理后的图像数据绘制到输出canvas
      outputCtx.putImageData(finalImageData, 0, 0)

      // 7. 转换为base64
      const processedImage = outputCanvas.toDataURL('image/png')

      // 8. 上传到服务器并更新显示
      uploadEditedImage(processedImage)
        .then((result) => {
          editingImageUrl.value = result.url // 只在弹窗内更新显示
          // 保存编辑信息，等待用户点击"完成编辑"
          hasEdits.value = true
          editedImageInfo.value = { url: result.url, id: result.id }
        })
        .catch((error) => {
          editingImageUrl.value = processedImage
          // 即使上传失败，也标记为有编辑
          hasEdits.value = true
          editedImageInfo.value = { url: processedImage }
        })
        .then(() => {
          // 9. 重置涂抹状态
          isBrushing.value = false
          currentTool.value = ''

          // 10. 提示用户
          ElMessage.success('涂抹处理完成')

          // 关闭弹窗
          closeToolModal()
        })
    } catch (canvasError) {
      console.error('Canvas操作失败 (CORS错误):', canvasError)

      // 优先使用当前编辑后的图片，如果没有编辑则使用原始图片
      const currentImageUrl = editingImageUrl.value || props.imageUrl

      // 从URL中提取图片名称
      let imageName = ''
      if (currentImageUrl) {
        const urlParts = currentImageUrl.split('?')
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1])
          imageName = params.get('name') || ''
        }
      }

      if (imageName) {
        ElMessage.warning('由于跨域限制，无法在浏览器处理图片，返回当前图片')
        const imageId = parseInt(imageName, 10) || 0
        emit('imageEdited', currentImageUrl, imageId)

        // 重置状态并关闭
        isBrushing.value = false
        currentTool.value = ''
        closeToolModal()
      } else {
        throw new Error('无法获取图片名称')
      }
    }
  } catch (error) {
    console.error('处理涂抹结果时出错:', error)
    ElMessage.error('处理涂抹结果失败，请重试')
    isBrushing.value = false
    currentTool.value = ''
    closeToolModal()
  }
}



// 一键抠图工具相关
const setupSegmentationTool = () => {
  // 不立即处理，直接开始抠图
  currentTool.value = 'segmentation'
  handleSegmentation()
}

// 处理一键抠图
const handleSegmentation = async () => {
  // 重置AI任务状态
  shoeStore.resetAiTask()

  const currentImageUrl = editingImageUrl.value || props.imageUrl
  if (!currentImageUrl) {
    ElMessage.warning('请先上传图片')
    return
  }

  try {
    // 从当前图片URL中提取图片名称
    let imageName = ''
    let imageId: number | null = null
    // 优先检查是否有编辑后的图片信息
    if (hasEdits.value && editedImageInfo.value && editedImageInfo.value.id) {
      // 如果有编辑后的图片ID，直接使用
      imageId = editedImageInfo.value.id
      console.log('使用编辑后的图片ID:', imageId)
    } else {
      // 尝试从当前图片URL中获取图片名称
      const urlParts = currentImageUrl.split('?')
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1])
        imageName = params.get('name') || params.get('filename') || ''

        // 尝试将name转换为数字ID
        const parsedId = parseInt(imageName, 10)
        if (!isNaN(parsedId)) {
          imageId = parsedId
        }
      }

      // 如果仍然没有名称，尝试从URL路径中提取文件名
      if (!imageName && currentImageUrl.includes('/')) {
        const pathParts = currentImageUrl.split('/')
        let potentialName = pathParts[pathParts.length - 1]

        // 去除可能的查询参数
        if (potentialName.includes('?')) {
          potentialName = potentialName.split('?')[0]
        }

        // 如果看起来像文件名（有扩展名），则使用它
        if (potentialName.includes('.')) {
          imageName = potentialName
        }
      }

      // 最后才尝试从props.originalImageName获取（作为后备）
      if (imageId === null && props.originalImageName) {
        imageName = props.originalImageName
        // 尝试将originalImageName转换为数字ID
        const parsedId = parseInt(imageName, 10)
        if (!isNaN(parsedId)) {
          imageId = parsedId
        }
      }
    }
    // 如果以上方法都无法获得图片ID，则需要先上传图片
    if (imageId === null) {
      console.log('无法从URL获取图片ID，尝试上传图片:', currentImageUrl.substring(0, 50) + '...')
      // 将URL转换为Blob/File对象
      let file: File

      if (currentImageUrl.startsWith('data:image')) {
        // 对于base64格式
        const blob = dataURLtoBlob(currentImageUrl)
        file = new File([blob], 'segmentation-image.png', { type: 'image/png' })
      } else {
        // 对于HTTP URL，先下载再上传
        try {
          const response = await fetch(currentImageUrl, {
            mode: 'cors',
            credentials: 'include'
          })
          const blob = await response.blob()
          file = new File([blob], 'segmentation-image.png', { type: blob.type || 'image/png' })
        } catch (fetchError) {
          console.error('获取图片失败:', fetchError)

          // 创建一个新的Image元素来下载图片
          const downloadPromise = new Promise<File>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              if (!ctx) {
                reject(new Error('无法创建canvas上下文'))
                return
              }

              ctx.drawImage(img, 0, 0)
              canvas.toBlob((blob) => {
                if (blob) {
                  const file = new File([blob], 'segmentation-image.png', { type: 'image/png' })
                  resolve(file)
                } else {
                  reject(new Error('无法创建图片blob'))
                }
              }, 'image/png')
            }
            img.onerror = () => {
              reject(new Error('图片加载失败'))
            }
            img.src = currentImageUrl
          })

          file = await downloadPromise
        }
      }

      // 上传图片
      const uploadResponse = await uploadImage(file)
      if (uploadResponse.code === 0 || uploadResponse.code === 200) {
        const imageData = uploadResponse.data as UploadImageResponse
        imageId = imageData.id
        console.log('成功上传图片并获取ID:', imageId)

        // 设置全局原始图片ID
        if (imageId) {
          shoeStore.setOriginalImageId(imageId)
          console.log('🌐 已设置全局原始图片ID:', imageId)
        }
      } else {
        throw new Error('上传图片失败: ' + (uploadResponse.msg || '未知错误'))
      }
    } else {
      // 如果已经有图片ID，也设置到全局状态
      if (imageId) {
        shoeStore.setOriginalImageId(imageId)
        console.log('🌐 已设置全局原始图片ID:', imageId)
      }
    }

    // 调用抠图API
    console.log('抠图处理图片ID:', imageId)
    const requestData: KtRequest = {
      imageId: imageId
    }

    const response = await kt(requestData)

    if (response.code === 0 || response.code === 200) {
      const result = response.data
      // 优先检查 ossUrls，兼容 viewUrls
      if (result && (result.ossUrls || result.viewUrls)) {
        const imageUrls = result.ossUrls || result.viewUrls

        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
          // 如果有直接返回的图片URL，直接使用
          const segmentedImageUrl = imageUrls[0]

          // 更新编辑台图片
          editingImageUrl.value = segmentedImageUrl

          // 标记为有编辑
          hasEdits.value = true

          // 保存一键抠图返回的ossId
          const ossId = result.ossIds && result.ossIds.length > 0 ? result.ossIds[0] : undefined
          segmentationOssId.value = ossId
          isSegmentationOnly.value = true

          // 设置编辑信息，包含图片ID
          editedImageInfo.value = {
            url: segmentedImageUrl,
            id: ossId // 保存ossId作为图片ID
          }

          // 设置当前工具为抠图
          currentTool.value = 'segmentation'

          // 设置全局状态，让其他功能使用抠图后的ossId
          if (ossId) {
            shoeStore.setSegmentedImageId(ossId)
            console.log('🌐 已设置全局抠图图片ID:', ossId)
          }

          ElMessage.success('抠图完成')
          console.log('🎯 抠图API返回 - 详细信息:', {
            imageUrl: segmentedImageUrl,
            ossId: ossId,
            'result.ossIds': result.ossIds,
            'segmentationOssId.value': segmentationOssId.value,
            'isSegmentationOnly.value': isSegmentationOnly.value,
            'editedImageInfo.value': editedImageInfo.value,
            '全局当前图片ID': shoeStore.currentImageId
          })
          return
        }
      }

      // 如果有 promptId，启动 WebSocket
      if (result && result.promptId) {
        console.log('启动WebSocket监听:', result.promptId)
        startAiTaskWs(result.clientId, result.server, result.promptId, 'cutout')
        return
      }

      ElMessage.warning('抠图成功但未获得图片')
    } else {
      throw new Error(response.msg || '抠图失败')
    }
  } catch (error: any) {
    console.error('抠图失败:', error)
    ElMessage.error('抠图失败: ' + (error.message || '未知错误'))
  } finally {
    currentTool.value = ''
  }
}

// 初始化智能抠图模式
const initSmartCutoutMode = async () => {
  const currentImageUrl = editingImageUrl.value || props.imageUrl
  if (!currentImageUrl) {
    ElMessage.warning('请先上传图片')
    return
  }

  try {
    // 将图片转换为base64并加载到SAM
    const base64Data = await imageUrlToBase64(currentImageUrl)
    await loadImageToSAM(base64Data)

    // 设置Canvas事件监听
    setupSmartCutoutCanvas()

    ElMessage.success('智能抠图模式已启动，左键添加正点，右键添加负点')
  } catch (error) {
    console.error('初始化智能抠图失败:', error)
    ElMessage.error('初始化智能抠图失败')
    exitSmartCutoutMode()
  }
}

// 将图片URL转换为base64，并自动应用智能缩放
const imageUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'))
        return
      }

      // 🔍 关键修改：计算智能缩放比例
      const originalWidth = img.width
      const originalHeight = img.height
      const smartZoom = calculateSmartCutoutZoom(originalWidth, originalHeight)

      // 计算缩放后的尺寸
      const scaledWidth = Math.round(originalWidth * smartZoom)
      const scaledHeight = Math.round(originalHeight * smartZoom)

      console.log('🔍 SAM上传图片智能缩放:', {
        原始尺寸: `${originalWidth}x${originalHeight}`,
        缩放比例: smartZoom,
        缩放后尺寸: `${scaledWidth}x${scaledHeight}`
      })

      // 设置Canvas为缩放后的尺寸
      canvas.width = scaledWidth
      canvas.height = scaledHeight

      // 绘制缩放后的图片
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)

      // 同时更新显示图片的缩放
      smartCutoutZoom.value = smartZoom
      setTimeout(() => {
        applySmartCutoutZoom()
      }, 100)

      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      resolve(base64)
    }
    img.onerror = reject
    img.src = url
  })
}

// 加载图片到SAM
const loadImageToSAM = async (base64Data: string) => {
  const apiUrl = `${SAM_API_BASE}/load_image`

  console.log('🎯 [SAM API] 开始加载图像到SAM', {
    URL: apiUrl,
    base64数据长度: base64Data.length,
    请求时间: new Date().toISOString()
  })

  // 检查SAM服务器健康状态
  try {
    console.log('🎯 [SAM API] 检查服务器健康状态...')
    const healthResponse = await fetch(`${SAM_API_BASE}/health`, {
      method: 'GET'
    })

    if (healthResponse.ok) {
      const healthData = await healthResponse.json()
      console.log('🎯 [SAM API] 服务器健康检查通过', healthData)
    } else {
      console.warn('🎯 [SAM API] 服务器健康检查失败', {
        状态码: healthResponse.status,
        状态文本: healthResponse.statusText
      })
    }
  } catch (healthError) {
    console.error('🎯 [SAM API] 服务器健康检查异常', healthError)
    throw new Error('SAM服务器不可用，请检查服务器状态')
  }

  const requestData = {
    image: base64Data,
    max_size: 1024
  }

  console.log('🎯 [SAM API] 准备发送加载图像请求', {
    请求数据大小: JSON.stringify(requestData).length,
    max_size: requestData.max_size
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.error('🎯 [SAM API] 加载图像请求超时')
    controller.abort()
  }, 60000) // 60秒超时，因为图像处理可能需要更长时间

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('🎯 [SAM API] 加载图像响应收到', {
      状态码: response.status,
      状态文本: response.statusText,
      响应头: Object.fromEntries(response.headers.entries())
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('🎯 [SAM API] 加载图像失败', {
        状态码: response.status,
        错误内容: errorText
      })
      throw new Error(`加载图像到SAM失败 (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    console.log('🎯 [SAM API] 图像加载成功', {
      success: result.success,
      message: result.message,
      image_size: result.image_size,
      taskId: result.taskId
    })

    if (!result.success) {
      throw new Error(result.error || result.message || '加载图像到SAM失败')
    }

    // 保存taskId到全局状态，用于后续的分割请求
    if (result.taskId) {
      console.log('🎯 [SAM API] 保存taskId:', result.taskId)
      // 将taskId保存到组件状态中
      samTaskId.value = result.taskId
    }

    return result
  } catch (error: any) {
    clearTimeout(timeoutId)
    console.error('🎯 [SAM API] 加载图像异常', {
      错误类型: error.name,
      错误消息: error.message,
      是否超时: error.name === 'AbortError'
    })

    if (error.name === 'AbortError') {
      throw new Error('加载图像超时：图像处理时间过长，请尝试使用较小的图片')
    }
    throw error
  }
}

// 设置智能抠图Canvas事件
const setupSmartCutoutCanvas = () => {
  const canvas = document.querySelector('.image-display img') as HTMLImageElement
  if (!canvas) return

  // 添加点击事件监听
  canvas.addEventListener('click', handleSmartCutoutClick)
  canvas.addEventListener('contextmenu', handleSmartCutoutRightClick)
  canvas.style.cursor = 'crosshair'
}

// 处理智能抠图点击
// 处理智能抠图点击
const handleSmartCutoutClick = async (event: MouseEvent) => {
  console.log('🔥🔥🔥 [点击事件] ===== 智能抠图点击开始 =====')
  console.log('🔥 [点击事件] 基本状态检查:', {
    isSmartCutoutMode: isSmartCutoutMode.value,
    currentTool: currentTool.value,
    事件类型: event.type,
    按钮: event.button
  })

  if (!isSmartCutoutMode.value) {
    console.warn('🔥 [点击事件] 不在智能抠图模式，忽略点击')
    return
  }

  const canvas = smartCutoutCanvasRef.value
  const image = smartCutoutImageRef.value
  const container = smartCutoutContainerRef.value

  if (!canvas || !image || !container) {
    console.error('🔥 [点击事件] 关键元素缺失:', { canvas: !!canvas, image: !!image, container: !!container })
    return
  }

  // 获取所有位置信息
  const canvasRect = canvas.getBoundingClientRect()
  const imageRect = image.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()

  console.log('🔥 [点击事件] 元素位置信息:')
  console.log('  Canvas位置:', {
    left: canvasRect.left,
    top: canvasRect.top,
    width: canvasRect.width,
    height: canvasRect.height
  })
  console.log('  图片位置:', {
    left: imageRect.left,
    top: imageRect.top,
    width: imageRect.width,
    height: imageRect.height
  })

  // 计算点击坐标
  const canvasX = event.clientX - canvasRect.left
  const canvasY = event.clientY - canvasRect.top

  // 🔍 关键修改：使用智能缩放后的尺寸进行坐标映射
  const smartZoom = smartCutoutZoom.value
  console.log('🔥 [点击事件] 当前智能缩放比例:', smartZoom)

  // 计算智能缩放后的实际尺寸
  const scaledWidth = Math.round(image.naturalWidth * smartZoom)
  const scaledHeight = Math.round(image.naturalHeight * smartZoom)

  // 计算从显示尺寸到缩放后尺寸的比例
  const scaleX = scaledWidth / canvas.offsetWidth
  const scaleY = scaledHeight / canvas.offsetHeight

  const mappedX = Math.round(canvasX * scaleX)
  const mappedY = Math.round(canvasY * scaleY)

  console.log('🔥 [点击事件] 坐标映射详情:', {
    原始图片尺寸: { width: image.naturalWidth, height: image.naturalHeight },
    智能缩放比例: smartZoom,
    缩放后尺寸: { width: scaledWidth, height: scaledHeight },
    显示尺寸: { width: canvas.offsetWidth, height: canvas.offsetHeight },
    坐标转换比例: { scaleX, scaleY },
    点击坐标: { canvasX, canvasY },
    最终SAM坐标: { mappedX, mappedY }
  })

  console.log('🔥🔥🔥 [点击事件] ===== 调用SAM API =====')

  // 使用正确的坐标调用SAM API
  await addSmartCutoutPoint(mappedX, mappedY, 'foreground')
}


// 处理智能抠图右键点击
// 处理智能抠图右键点击
const handleSmartCutoutRightClick = async (event: MouseEvent) => {
  event.preventDefault()
  if (!isSmartCutoutMode.value) return

  const canvas = smartCutoutCanvasRef.value
  const image = smartCutoutImageRef.value
  if (!canvas || !image) return

  // 获取Canvas的位置信息
  const canvasRect = canvas.getBoundingClientRect()
  const x = event.clientX - canvasRect.left
  const y = event.clientY - canvasRect.top

  // 关键修改：使用智能缩放后的尺寸进行坐标映射
  const smartZoom = smartCutoutZoom.value
  const scaledWidth = Math.round(image.naturalWidth * smartZoom)
  const scaledHeight = Math.round(image.naturalHeight * smartZoom)

  const scaleX = scaledWidth / canvas.offsetWidth
  const scaleY = scaledHeight / canvas.offsetHeight

  const mappedX = Math.round(x * scaleX)
  const mappedY = Math.round(y * scaleY)

  console.log('🎯 [智能抠图] 右键点击坐标映射', {
    智能缩放比例: smartZoom,
    缩放后尺寸: { scaledWidth, scaledHeight },
    Canvas相对坐标: { x, y },
    映射后坐标: { mappedX, mappedY }
  })

  // 使用正确的坐标调用SAM API（背景点）
  await addSmartCutoutPoint(mappedX, mappedY, 'background')
}


// 添加智能抠图点
// 添加智能抠图点
const addSmartCutoutPoint = async (x: number, y: number, type: 'foreground' | 'background') => {
  console.log('🎯 [智能抠图] addSmartCutoutPoint 开始执行', {
    坐标: { x, y },
    类型: type,
    当前状态: {
      isImageLoadedToSAM: isImageLoadedToSAM.value,
      smartCutoutPoints长度: smartCutoutPoints.value.length,
      editingImageUrl: editingImageUrl.value?.substring(0, 50) + '...',
      SAM_API_BASE: SAM_API_BASE
    }
  })

  try {
    // 如果图像还没有加载到SAM，先加载图像
    if (!isImageLoadedToSAM.value) {
      console.log('🎯 [智能抠图] 首次点击，需要先加载图像到SAM')

      const image = smartCutoutImageRef.value
      if (!image) {
        throw new Error('图像元素未找到')
      }

      // 🔍 关键修改：使用当前设置的智能缩放比例
      const currentSmartZoom = smartCutoutZoom.value
      console.log('🎯 [智能抠图] 使用当前智能缩放比例:', currentSmartZoom)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('无法创建Canvas上下文')
      }

      // 使用智能缩放后的尺寸
      const scaledWidth = Math.round(image.naturalWidth * currentSmartZoom)
      const scaledHeight = Math.round(image.naturalHeight * currentSmartZoom)

      canvas.width = scaledWidth
      canvas.height = scaledHeight
      ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight)

      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const base64Data = imageDataUrl.split(',')[1]

      await loadImageToSAM(base64Data)
      isImageLoadedToSAM.value = true
    }

    // 添加点到列表
    smartCutoutPoints.value.push({ x, y, type })

    // 重要：清除悬浮预览，因为现在要显示正式的高亮边缘
    clearHoverPreview()

    // 调用SAM分割API
    const apiUrl = `${SAM_API_BASE}/segment`
    const requestData = {
      x: x,
      y: y,
      point_type: type
    }

    console.log('🎯 [智能抠图] 准备调用SAM分割API', {
      URL: apiUrl,
      请求数据: requestData,
      网络状态: navigator.onLine ? '在线' : '离线'
    })

    // 检查网络连接
    if (!navigator.onLine) {
      throw new Error('网络连接失败：设备离线')
    }

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 30000) // 30秒超时

    let response
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        throw new Error('请求超时：SAM服务响应时间过长，请检查网络连接或稍后重试')
      } else if (fetchError.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败：无法连接到SAM服务器，请检查服务器状态和网络连接')
      } else {
        throw new Error(`网络请求失败: ${fetchError.message}`)
      }
    }

    // 检查响应状态
    if (!response.ok) {
      let errorText = ''
      try {
        errorText = await response.text()
      } catch (e) {
        console.error('🎯 [智能抠图] 无法读取错误响应内容:', e)
      }

      throw new Error(`SAM服务器错误 (${response.status}): ${response.statusText}${errorText ? ' - ' + errorText : ''}`)
    }

    // 解析响应
    let result
    try {
      result = await response.json()
    } catch (jsonError: any) {
      throw new Error('SAM服务器返回了无效的JSON响应')
    }

    if (result.success) {
      console.log('🎯 [智能抠图] SAM分割成功，开始处理结果')

      // 更新蒙版
      smartCutoutMask.value = 'data:image/png;base64,' + result.mask

      // 等待DOM更新，确保Canvas被渲染
      await nextTick()

      // 绘制带高亮边缘的抠图结果
      await drawSmartCutoutResultWithHighlight()

      const pointType = type === 'foreground' ? '正点' : '负点'
      ElMessage.success(`已添加${pointType}，分割完成`)
    } else {
      // 检查是否是"图像未设置"错误，如果是则自动重新加载图像并重试
      const errorMessage = result.error || result.message || ''
      if (errorMessage.includes('An image must be set') || errorMessage.includes('set_image')) {
        console.log('🎯 [智能抠图] 检测到图像未设置错误，尝试重新加载图像并重试...')

        try {
          // 重新加载图像到SAM
          const base64Data = await imageToBase64(editingImageUrl.value)
          await loadImageToSAM(base64Data)

          // 重新添加所有之前的点
          for (let i = 0; i < smartCutoutPoints.value.length - 1; i++) {
            const prevPoint = smartCutoutPoints.value[i]
            await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                x: prevPoint.x,
                y: prevPoint.y,
                point_type: prevPoint.type
              })
            })
          }

          // 重试当前点的分割请求
          const retryResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
          })

          if (retryResponse.ok) {
            const retryResult = await retryResponse.json()
            if (retryResult.success) {
              // 更新蒙版
              smartCutoutMask.value = 'data:image/png;base64,' + retryResult.mask

              // 绘制带高亮边缘的抠图结果
              await drawSmartCutoutResultWithHighlight()

              const pointType = type === 'foreground' ? '正点' : '负点'
              ElMessage.success(`已添加${pointType}，分割完成`)
              return // 成功，直接返回
            }
          }
        } catch (retryError) {
          console.error('🎯 [智能抠图] 重试过程中发生错误:', retryError)
        }
      }

      // 如果分割失败，移除刚添加的点
      smartCutoutPoints.value.pop()

      throw new Error(result.error || result.message || 'SAM分割失败')
    }
  } catch (error: any) {
    console.error('🎯 [智能抠图] addSmartCutoutPoint 执行失败', {
      错误类型: error.constructor.name,
      错误消息: error.message,
      当前状态: {
        点数: smartCutoutPoints.value.length,
        是否已加载到SAM: isImageLoadedToSAM.value
      }
    })
    ElMessage.error('智能抠图分割失败: ' + error.message)
  }
}


// 绘制带高亮边缘的智能抠图结果
const drawSmartCutoutResultWithHighlight = async () => {
  console.log('🎯 [调试] 开始绘制高亮边缘结果')

  if (!smartCutoutMask.value) {
    console.log('❌ [调试] 没有蒙版数据')
    return
  }

  const image = smartCutoutImageRef.value

  console.log('🎯 [调试] 元素检查', {
    image: !!image,
    smartCutoutMask: !!smartCutoutMask.value,
    imageSize: image ? { width: image.offsetWidth, height: image.offsetHeight } : null
  })

  if (!image) {
    console.log('❌ [调试] 缺少图像元素')
    return
  }

  // 等待DOM更新，确保Canvas被渲染
  await nextTick()

  const resultCanvas = cutoutResultCanvasRef.value
  console.log('🎯 [调试] DOM更新后Canvas检查', {
    resultCanvas: !!resultCanvas
  })

  if (!resultCanvas) {
    console.log('❌ [调试] Canvas元素未找到，可能是v-if条件问题')
    return
  }

  const ctx = resultCanvas.getContext('2d')
  if (!ctx) {
    console.log('❌ [调试] 无法获取Canvas上下文')
    return
  }

  // 关键修复：Canvas逻辑尺寸设置为图片原始尺寸，与蒙版尺寸一致
  resultCanvas.width = image.naturalWidth   // 1080 (与蒙版尺寸一致)
  resultCanvas.height = image.naturalHeight // 1080 (与蒙版尺寸一致)
  // Canvas显示尺寸设置为图片显示尺寸
  resultCanvas.style.width = image.offsetWidth + 'px'   // 1040 (显示尺寸)
  resultCanvas.style.height = image.offsetHeight + 'px' // 1040 (显示尺寸)

  console.log('🎯 [调试] Canvas尺寸设置', {
    width: resultCanvas.width,
    height: resultCanvas.height,
    styleWidth: resultCanvas.style.width,
    styleHeight: resultCanvas.style.height
  })

  // 清除画布
  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height)




  // 加载蒙版图片
  const maskImg = new Image()
  await new Promise((resolve) => {
    maskImg.onload = resolve
    maskImg.src = smartCutoutMask.value
  })

  console.log('🎯 [调试] 蒙版图片加载完成', {
    maskWidth: maskImg.width,
    maskHeight: maskImg.height
  })

  // 绘制蓝色高亮边缘和半透明遮罩
  await drawBlueHighlightEdge(ctx, maskImg, resultCanvas.width, resultCanvas.height, 1.0)

  console.log('✅ 智能抠图高亮边缘绘制完成')
}

// 绘制蓝色高亮边缘
const drawBlueHighlightEdge = async (ctx: CanvasRenderingContext2D, maskImg: HTMLImageElement, width: number, height: number, opacity: number = 1.0) => {
  // 创建临时Canvas处理蒙版
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = maskImg.width
  tempCanvas.height = maskImg.height

  // 绘制蒙版
  tempCtx.drawImage(maskImg, 0, 0)
  const maskData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)

  // 创建边缘检测结果
  const edgeData = detectEdges(maskData)

  // 绘制结果到目标Canvas
  const scaleX = width / maskImg.width
  const scaleY = height / maskImg.height

  // 1. 绘制半透明遮罩（非选中区域）
  ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * opacity})`
  ctx.fillRect(0, 0, width, height)

  // 2. 清除选中区域的遮罩
  ctx.globalCompositeOperation = 'destination-out'
  for (let y = 0; y < maskImg.height; y++) {
    for (let x = 0; x < maskImg.width; x++) {
      const idx = (y * maskImg.width + x) * 4
      const maskValue = maskData.data[idx] // 红色通道

      if (maskValue > 128) { // 白色区域（选中区域）
        const canvasX = Math.floor(x * scaleX)
        const canvasY = Math.floor(y * scaleY)
        ctx.fillRect(canvasX, canvasY, Math.ceil(scaleX), Math.ceil(scaleY))
      }
    }
  }

  // 3. 绘制蓝色边缘高亮
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = `rgba(0, 150, 255, ${opacity})`

  for (let y = 0; y < maskImg.height; y++) {
    for (let x = 0; x < maskImg.width; x++) {
      const idx = y * maskImg.width + x

      if (edgeData[idx] > 0) { // 边缘像素
        const canvasX = Math.floor(x * scaleX)
        const canvasY = Math.floor(y * scaleY)

        // 绘制较粗的边缘线
        ctx.fillRect(canvasX - 1, canvasY - 1, Math.ceil(scaleX) + 2, Math.ceil(scaleY) + 2)
      }
    }
  }

  ctx.globalCompositeOperation = 'source-over'
}

// 边缘检测算法
const detectEdges = (imageData: ImageData): Uint8ClampedArray => {
  const data = imageData.data
  const width = imageData.width
  const height = imageData.height
  const edges = new Uint8ClampedArray(width * height)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4
      const current = data[idx] // 红色通道作为蒙版值

      // 检查周围8个像素
      const neighbors = [
        data[((y - 1) * width + (x - 1)) * 4],
        data[((y - 1) * width + x) * 4],
        data[((y - 1) * width + (x + 1)) * 4],
        data[(y * width + (x - 1)) * 4],
        data[(y * width + (x + 1)) * 4],
        data[((y + 1) * width + (x - 1)) * 4],
        data[((y + 1) * width + x) * 4],
        data[((y + 1) * width + (x + 1)) * 4]
      ]

      // 如果当前像素是前景，且周围有背景像素，则为边缘
      const isEdge = current > 128 && neighbors.some(n => n <= 128)
      edges[y * width + x] = isEdge ? 255 : 0
    }
  }

  return edges
}

// 绘制智能抠图结果到Canvas
const drawSmartCutoutResult = (resultCanvas: HTMLCanvasElement) => {
  const canvas = smartCutoutCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 设置Canvas尺寸
  canvas.width = resultCanvas.width
  canvas.height = resultCanvas.height

  // 绘制棋盘背景以显示透明效果
  drawCheckerboardBackground(ctx, canvas.width, canvas.height)

  // 绘制抠图结果
  ctx.drawImage(resultCanvas, 0, 0)
}

// 绘制棋盘背景
const drawCheckerboardBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const squareSize = 20
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#e0e0e0'
  for (let x = 0; x < width; x += squareSize) {
    for (let y = 0; y < height; y += squareSize) {
      if ((Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 1) {
        ctx.fillRect(x, y, squareSize, squareSize)
      }
    }
  }
}

// 更新智能抠图预览
const updateSmartCutoutPreview = (resultUrl: string) => {
  // 这里可以添加预览更新逻辑
  console.log('智能抠图结果:', resultUrl)
}

// 完成智能抠图
const completeSmartCutout = async () => {
  if (!hasEdits.value || !editingImageUrl.value) {
    ElMessage.warning('请先完成抠图操作')
    return
  }

  try {
    // 将结果保存为文件
    const link = document.createElement('a')
    link.download = `smart_cutout_${Date.now()}.png`
    link.href = editingImageUrl.value
    link.click()

    ElMessage.success('智能抠图完成，已下载结果')
    exitSmartCutoutMode()
  } catch (error) {
    console.error('保存智能抠图结果失败:', error)
    ElMessage.error('保存失败')
  }
}

// 清除智能抠图点
const clearSmartCutoutPoints = async () => {
  try {
    // 调用SAM清除API
    const response = await fetch(`${SAM_API_BASE}/clear_points`, {
      method: 'POST'
    })

    const result = await response.json()

    if (result.success) {
      smartCutoutPoints.value = []
      smartCutoutMask.value = ''
      smartCutoutHistory.value = []

      // 清除Canvas
      clearCutoutResult()

      ElMessage.success('已清除所有标记点')
    } else {
      throw new Error(result.error || '清除失败')
    }
  } catch (error) {
    console.error('清除智能抠图点失败:', error)
    ElMessage.error('清除失败')
  }
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 只在智能抠图模式下处理键盘事件
  if (currentTool.value !== 'smart-cutout') return

  // Ctrl+Z 撤销
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault()
    undoSmartCutoutPoint()
  }
}

// 退出智能抠图模式
const exitSmartCutoutMode = () => {
  isSmartCutoutMode.value = false
  currentTool.value = ''
  smartCutoutPoints.value = []
  smartCutoutMask.value = ''

  // 移除事件监听
  const canvas = document.querySelector('.image-display img') as HTMLImageElement
  if (canvas) {
    canvas.removeEventListener('click', handleSmartCutoutClick)
    canvas.removeEventListener('contextmenu', handleSmartCutoutRightClick)
    canvas.style.cursor = 'default'
  }
}

// 显示抠图结果和操作按钮
const showSegmentationResult = (imageUrl: string) => {
  editingImageUrl.value = imageUrl
  currentTool.value = ''
  ElMessage.success('抠图完成')
}

// 创建图片
const createFromImage = () => {
  if (resultImages.value.length === 0) return

  // 获取当前显示的图片URL
  const imageUrl = resultImages.value[currentSlide.value]
  // 这里可以添加跳转到二创页面的逻辑，或者发出事件让父组件处理
  ElMessage.success('即将进入二创页面')
  console.log('准备使用图片进行二创:', imageUrl)
  // 例如: router.push({ path: '/creation', query: { imageUrl } })
}

// 下载图片函数
const downloadImage = (url: string, filename: string) => {
  // 创建一个XMLHttpRequest对象
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.responseType = 'blob'

  xhr.onload = function () {
    if (this.status === 200) {
      // 获取blob数据
      const blob = this.response

      // 创建一个URL对象
      const blobUrl = window.URL.createObjectURL(blob)

      // 创建一个隐藏的a标签
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      link.style.display = 'none'

      // 添加到DOM中
      document.body.appendChild(link)

      // 触发点击
      link.click()

      // 移除元素
      setTimeout(() => {
        document.body.removeChild(link)
        // 释放URL对象
        window.URL.revokeObjectURL(blobUrl)
      }, 100)
    } else {
      ElMessage.error('下载图片失败，请手动保存图片')
      // 如果请求失败，回退到在新窗口打开
      window.open(url, '_blank')
    }
  }

  xhr.onerror = function () {
    ElMessage.error('下载图片失败，请手动保存图片')
    // 如果请求失败，回退到在新窗口打开
    window.open(url, '_blank')
  }

  // 发送请求
  xhr.send()
}

// 将dataURL转换为Blob对象
const dataURLtoBlob = (dataURL: string) => {
  const parts = dataURL.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const uInt8Array = new Uint8Array(raw.length)

  for (let i = 0; i < raw.length; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return new Blob([uInt8Array], { type: contentType })
}



// 缩放相关方法
const zoomIn = () => {
  if (scale.value < MAX_SCALE) {
    scale.value = Math.min(MAX_SCALE, scale.value + SCALE_STEP)
  }
}

const zoomOut = () => {
  if (scale.value > MIN_SCALE) {
    scale.value = Math.max(MIN_SCALE, scale.value - SCALE_STEP)
  }
}

const resetZoom = () => {
  scale.value = 1
}

// 显示上一张结果图片
const prevSlide = () => {
  if (currentSlide.value > 0) {
    currentSlide.value--
  }
}

// 显示下一张结果图片
const nextSlide = () => {
  if (currentSlide.value < resultImages.value.length - 1) {
    currentSlide.value++
  }
}

// 设置当前显示的结果图片
const setSlide = (index: number) => {
  // 如果切换到不同的图片，重置之前图片的缩放和位置
  if (currentSlide.value !== index && resultImageZoom.value[currentSlide.value]) {
    resultImageZoom.value[currentSlide.value] = 1
    if (resultImagePosition.value[currentSlide.value]) {
      resultImagePosition.value[currentSlide.value] = { x: 0, y: 0 }
    }
  }
  currentSlide.value = index
}

// 退出结果查看模式
const exitResultsView = () => {
  if (resultImages.value.length > 0) {
    // 使用当前选中的图片
    const selectedImage = resultImages.value[currentSlide.value]
    // 应用到主工作区
    emit('imageEdited', selectedImage)
  }

  // 重置状态
  isViewingResults.value = false
  emit('exitResults')

  // 重置所有图片的缩放级别和位置
  resultImageZoom.value = resultImageZoom.value.map(() => 1)
  resultImagePosition.value = resultImagePosition.value.map(() => ({ x: 0, y: 0 }))

  // 显示提示
  ElMessage.success('已应用所选图片')
}

// 下载当前图片
const downloadCurrentImage = () => {
  if (resultImages.value.length > 0) {
    const imageUrl = resultImages.value[currentSlide.value]
    const filename = `shoe_design_${Date.now()}.png`

    // 使用现有的下载图片函数
    downloadImage(imageUrl, filename)
    ElMessage.success('图片开始下载')
  } else {
    ElMessage.warning('没有可下载的图片')
  }
}

// 监听props变化
watch(() => props.isViewResults, (newValue) => {
  isViewingResults.value = newValue
})

watch(() => props.resultImages, (newValue) => {
  if (newValue && newValue.length > 0) {
    resultImages.value = newValue
    currentSlide.value = 0
    // 初始化每张图片的缩放级别为1和位置为中心
    resultImageZoom.value = newValue.map(() => 1)
    resultImagePosition.value = newValue.map(() => ({ x: 0, y: 0 }))
  }
})

// 初始化蒙版Canvas - 完全重构以解决坐标映射问题
const initMaskCanvas = () => {
  const canvas = maskCanvasRef.value
  const image = maskImageRef.value
  const container = maskContainerRef.value
  if (!canvas || !image || !container) return

  // 定义图片加载函数
  const handleImageLoad = () => {
    // 首先清除容器内的所有样式，保证完全重置
    container.style.position = 'relative'
    container.style.overflow = 'hidden'

    // 等待图片完全加载并渲染
    setTimeout(() => {
      // 获取图片的实际显示尺寸
      const imgRect = image.getBoundingClientRect()
      const imgWidth = imgRect.width
      const imgHeight = imgRect.height

      // 记录原始尺寸供后续使用
      const naturalWidth = image.naturalWidth
      const naturalHeight = image.naturalHeight

      console.log('图片尺寸信息:', {
        display: { width: imgWidth, height: imgHeight },
        natural: { width: naturalWidth, height: naturalHeight },
        ratio: { x: naturalWidth / imgWidth, y: naturalHeight / imgHeight }
      })

      // 设置画布与图片完全相同的尺寸和位置
      canvas.width = imgWidth
      canvas.height = imgHeight

      // 重要：canvas必须完全覆盖在图片上方
      canvas.style.position = 'absolute'
      canvas.style.top = `${imgRect.top - container.getBoundingClientRect().top}px`
      canvas.style.left = `${imgRect.left - container.getBoundingClientRect().left}px`
      canvas.style.width = `${imgWidth}px`
      canvas.style.height = `${imgHeight}px`
      canvas.style.pointerEvents = 'auto'
      canvas.style.zIndex = '10'

      // 获取Canvas上下文
      const ctx = canvas.getContext('2d', { alpha: true })
      if (ctx) {
        maskContext.value = ctx

        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // 设置画笔样式
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'rgba(0, 0, 0, 1)'
        ctx.fillStyle = 'rgba(0, 0, 0, 1)'
        ctx.lineWidth = maskBrushSize.value

        console.log('蒙版画布已初始化，位置和尺寸:', {
          canvas: {
            width: canvas.width,
            height: canvas.height,
            style: {
              top: canvas.style.top,
              left: canvas.style.left,
              width: canvas.style.width,
              height: canvas.style.height
            }
          },
          image: {
            rect: {
              top: imgRect.top,
              left: imgRect.left,
              width: imgRect.width,
              height: imgRect.height
            }
          },
          container: {
            rect: container.getBoundingClientRect()
          }
        })
      }

      // 初始化蒙版预览
      updateMaskPreview()
    }, 200) // 增加延迟以确保图片渲染完成
  }

  // 设置图片加载事件
  if (image.complete) {
    handleImageLoad() // 如果已经加载，直接调用
  } else {
    image.onload = handleImageLoad // 否则等待加载完成
  }
}

// 开始绘制蒙版
const startMasking = (e: MouseEvent) => {
  isMaskPainting.value = true
  const ctx = maskContext.value
  const canvas = maskCanvasRef.value
  if (!ctx || !canvas) return

  // 获取准确的鼠标位置相对于画布的坐标
  const rect = canvas.getBoundingClientRect()
  const x = Math.round(e.clientX - rect.left)
  const y = Math.round(e.clientY - rect.top)

  // 位置调试日志
  console.log('开始绘制蒙版', {
    clientX: e.clientX,
    clientY: e.clientY,
    canvasRect: rect,
    relativeX: x,
    relativeY: y
  })

  // 绘制起始点
  ctx.beginPath()
  ctx.arc(x, y, maskBrushSize.value / 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x, y)

  // 更新预览
  updateMaskPreview()
}

// 处理蒙版绘制中
const handleMasking = (e: MouseEvent) => {
  if (!isMaskPainting.value) return

  const ctx = maskContext.value
  if (!ctx) return

  const canvas = maskCanvasRef.value
  if (!canvas) return

  // 获取准确的鼠标位置相对于画布的坐标
  const rect = canvas.getBoundingClientRect()
  // 精确计算鼠标位置，考虑到可能的小数点
  const x = Math.round(e.clientX - rect.left)
  const y = Math.round(e.clientY - rect.top)

  // 设置线宽
  ctx.lineWidth = maskBrushSize.value

  // 绘制线条
  ctx.lineTo(x, y)
  ctx.stroke()

  // 绘制圆形笔触效果，确保路径连续平滑
  ctx.beginPath()
  ctx.arc(x, y, maskBrushSize.value / 2, 0, Math.PI * 2)
  ctx.fill()

  // 继续新的绘制路径
  ctx.beginPath()
  ctx.moveTo(x, y)

  // 更新预览
  updateMaskPreview()
}

// 停止蒙版绘制
const stopMasking = () => {
  isMaskPainting.value = false
  updateMaskPreview()
}

// 确认蒙版
const confirmMask = () => {
  isSegmentationOnly.value = false
  try {
    const canvas = maskCanvasRef.value
    const image = maskImageRef.value
    if (!canvas || !maskContext.value || !image) return

    // 获取原始图片的自然尺寸
    const naturalWidth = image.naturalWidth
    const naturalHeight = image.naturalHeight

    // 获取画布显示尺寸
    const displayWidth = canvas.width
    const displayHeight = canvas.height

    // 计算缩放比例
    const scaleX = naturalWidth / displayWidth
    const scaleY = naturalHeight / displayHeight

    console.log('确认蒙版 - 比例信息', {
      canvas: { width: displayWidth, height: displayHeight },
      natural: { width: naturalWidth, height: naturalHeight },
      scale: { x: scaleX, y: scaleY }
    })

    try {
      // 创建一个临时canvas用于生成AI处理用的蒙版
      const tempMaskCanvas = document.createElement('canvas')
      tempMaskCanvas.width = naturalWidth
      tempMaskCanvas.height = naturalHeight

      const tempMaskCtx = tempMaskCanvas.getContext('2d')
      if (!tempMaskCtx) return

      // 清空临时画布
      tempMaskCtx.fillStyle = 'black'
      tempMaskCtx.fillRect(0, 0, naturalWidth, naturalHeight)

      // 获取用户绘制的蒙版数据
      const userMaskData = maskContext.value.getImageData(0, 0, displayWidth, displayHeight)

      // 创建空白的放大蒙版
      const scaledMask = tempMaskCtx.createImageData(naturalWidth, naturalHeight)

      // 遍历用户绘制的每个像素，并映射到原始尺寸
      for (let y = 0; y < displayHeight; y++) {
        for (let x = 0; x < displayWidth; x++) {
          const sourceIdx = (y * displayWidth + x) * 4

          // 检查是否有绘制（非透明像素）
          if (userMaskData.data[sourceIdx + 3] > 0) {
            // 计算在原始尺寸中的位置
            const targetX = Math.round(x * scaleX)
            const targetY = Math.round(y * scaleY)

            // 确保在边界内
            if (targetX >= 0 && targetX < naturalWidth && targetY >= 0 && targetY < naturalHeight) {
              // 绘制点
              const targetIdx = (targetY * naturalWidth + targetX) * 4

              // 在放大的蒙版中将此位置设置为白色
              scaledMask.data[targetIdx] = 255     // R
              scaledMask.data[targetIdx + 1] = 255 // G
              scaledMask.data[targetIdx + 2] = 255 // B
              scaledMask.data[targetIdx + 3] = 255 // A

              // 给周围像素也上色，确保蒙版连续
              for (let ny = -2; ny <= 2; ny++) {
                for (let nx = -2; nx <= 2; nx++) {
                  const nearX = targetX + nx
                  const nearY = targetY + ny
                  if (nearX >= 0 && nearX < naturalWidth && nearY >= 0 && nearY < naturalHeight) {
                    const nearIdx = (nearY * naturalWidth + nearX) * 4
                    scaledMask.data[nearIdx] = 255     // R
                    scaledMask.data[nearIdx + 1] = 255 // G
                    scaledMask.data[nearIdx + 2] = 255 // B
                    scaledMask.data[nearIdx + 3] = 255 // A
                  }
                }
              }
            }
          }
        }
      }

      // 应用放大的蒙版到临时画布
      tempMaskCtx.putImageData(scaledMask, 0, 0)

      // 创建AI蒙版画布 - 黑底白色标记
      const aiMaskCanvas = document.createElement('canvas')
      aiMaskCanvas.width = naturalWidth
      aiMaskCanvas.height = naturalHeight

      const aiMaskCtx = aiMaskCanvas.getContext('2d')
      if (!aiMaskCtx) return

      // 设置黑色背景
      aiMaskCtx.fillStyle = 'black'
      aiMaskCtx.fillRect(0, 0, naturalWidth, naturalHeight)

      // 绘制白色标记区
      aiMaskCtx.drawImage(tempMaskCanvas, 0, 0)

      // 创建可视化蒙版 - 灰色遮罩
      const visualMaskCanvas = document.createElement('canvas')
      visualMaskCanvas.width = naturalWidth
      visualMaskCanvas.height = naturalHeight

      const visualMaskCtx = visualMaskCanvas.getContext('2d')
      if (!visualMaskCtx) return

      // 绘制原图
      visualMaskCtx.drawImage(image, 0, 0, naturalWidth, naturalHeight)

      // 添加灰色半透明遮罩
      visualMaskCtx.fillStyle = 'rgba(128, 128, 128, 0.7)'
      visualMaskCtx.fillRect(0, 0, naturalWidth, naturalHeight)

      // 将标记区域设为透明
      visualMaskCtx.globalCompositeOperation = 'destination-out'
      visualMaskCtx.drawImage(tempMaskCanvas, 0, 0)

      // 导出为base64
      const aiMaskBase64 = aiMaskCanvas.toDataURL('image/png')
      const visualMaskBase64 = visualMaskCanvas.toDataURL('image/png')

      // 将可视化蒙版转为文件
      const visualMaskBlob = dataURLtoBlob(visualMaskBase64)
      const visualMaskFile = new File([visualMaskBlob], `mask_${Date.now()}.png`, { type: 'image/png' })

      // 显示加载提示
      const loading = ElLoading.service({
        lock: true,
        text: '保存蒙版中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      // 优先使用当前编辑后的图片，如果没有编辑则使用原始图片
      const currentImageUrl = editingImageUrl.value || props.imageUrl

      // 优先使用props传递的原始图片名称
      let originalImageName = props.originalImageName || ''

      // 从当前图片URL提取图片名称
      if (!originalImageName && currentImageUrl) {
        const urlParts = currentImageUrl.split('?')
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1])
          originalImageName = params.get('name') || ''
        }
      }

      if (!originalImageName) {
        // 先上传图片获取图片名称
        uploadImage(visualMaskFile)
          .then((response: any) => {
            if (response.code === 0 || response.code === 200) {
              const imageData = response.data as UploadImageResponse
              console.log('蒙版图片上传成功，获取到的图片ID:', imageData.id)

              // 获取图片URL
              return feedbackImage(imageData.id).then(feedbackResponse => {
                // 返回包含图片ID的对象以及服务器直接返回的URL
                return {
                  url: feedbackResponse.data,
                  id: imageData.id,
                  directUrl: feedbackResponse.data // 直接使用服务器返回的URL
                }
              })
            } else {
              throw new Error(response.msg || '上传失败')
            }
          })
          .then((result: any) => {
            if (!result) return

            console.log('蒙版处理后的图片已上传至服务器:', result.url, '图片ID:', result.id)
            // 使用服务器返回的URL，避免跨域问题
            const serverImageUrl = result.directUrl

            // 保存编辑信息，等待用户点击"完成编辑"
            hasEdits.value = true
            editedImageInfo.value = { url: serverImageUrl, id: result.id }
            editingImageUrl.value = serverImageUrl

            // 发送蒙版完成事件，同时传递可视化蒙版和AI处理用蒙版
            emit('maskComplete', {
              visualMask: serverImageUrl,
              aiMask: aiMaskBase64
            })

            ElMessage.success('蒙版已生成并上传')
          })
          .catch((error: any) => {
            console.error('蒙版图片上传失败:', error)
            ElMessage.error('蒙版上传失败: ' + (error.message || '未知错误'))

            // 如果上传失败，使用本地图片
            hasEdits.value = true
            editedImageInfo.value = { url: visualMaskBase64 }
            editingImageUrl.value = visualMaskBase64
            emit('maskComplete', {
              visualMask: visualMaskBase64,
              aiMask: aiMaskBase64
            })
          })
          .then(() => {
            // 关闭加载提示
            loading.close()

            // 重置和关闭
            isMasking.value = false
            currentTool.value = ''
            closeToolModal()
          })
      } else {
        // 上传蒙版，传递原始图片ID
        // 优先使用编辑后的图片ID，其次使用传入的originalImageName，最后才使用全局store
        const shoeStore = useShoeStore()
        let maskImageId = editedImageInfo.value?.id || originalImageName || shoeStore.currentImageId
        console.log('🔍 蒙版上传使用图片ID:', maskImageId, '来源:', editedImageInfo.value?.id ? '编辑后ID' : (originalImageName ? '传入的originalImageName' : '全局store'))
        uploadMask(visualMaskFile, String(maskImageId))
          .then((response: any) => {
            if (response.code === 0 || response.code === 200) {
              const imageData = response.data as UploadImageResponse
              console.log('蒙版上传成功，获取到的图片ID:', imageData.id)

              // 获取图片URL
              return feedbackImage(imageData.id).then(feedbackResponse => {
                // 返回包含图片ID的对象以及服务器直接返回的URL
                return {
                  url: feedbackResponse.data,
                  id: imageData.id,
                  directUrl: feedbackResponse.data // 直接使用服务器返回的URL
                }
              })
            } else {
              throw new Error(response.msg || '上传失败')
            }
          })
          .then((result: any) => {
            if (!result) return

            console.log('蒙版处理后的图片已上传至服务器:', result.url, '图片ID:', result.id)
            // 使用服务器返回的URL，避免跨域问题
            const serverImageUrl = result.directUrl

            // 保存编辑信息，等待用户点击"完成编辑"
            hasEdits.value = true
            editedImageInfo.value = { url: serverImageUrl, id: result.id }
            editingImageUrl.value = serverImageUrl

            // 发送蒙版完成事件，同时传递可视化蒙版和AI处理用蒙版
            emit('maskComplete', {
              visualMask: serverImageUrl,
              aiMask: aiMaskBase64
            })

            ElMessage.success('蒙版已生成并上传')
          })
          .catch((error: any) => {
            console.error('蒙版图片上传失败:', error)
            ElMessage.error('蒙版上传失败: ' + (error.message || '未知错误'))

            // 如果上传失败，使用本地图片
            hasEdits.value = true
            editedImageInfo.value = { url: visualMaskBase64 }
            editingImageUrl.value = visualMaskBase64
            emit('maskComplete', {
              visualMask: visualMaskBase64,
              aiMask: aiMaskBase64
            })
          })
          .then(() => {
            // 关闭加载提示
            loading.close()

            // 重置和关闭
            isMasking.value = false
            currentTool.value = ''
            closeToolModal()
          })
      }
    } catch (canvasError) {
      console.error('Canvas操作失败 (CORS错误):', canvasError)

      // 优先使用当前编辑后的图片，如果没有编辑则使用原始图片
      const currentImageUrl = editingImageUrl.value || props.imageUrl

      // 从URL中提取图片名称
      let imageName = ''
      if (currentImageUrl) {
        const urlParts = currentImageUrl.split('?')
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1])
          imageName = params.get('name') || ''
        }
      }

      if (imageName) {
        ElMessage.warning('由于跨域限制，无法在浏览器处理图片，返回当前图片')

        // 使用当前图片 - 转换为数字ID
        const imageId = parseInt(imageName, 10) || 0
        emit('imageEdited', currentImageUrl, imageId)

        // 简化的蒙版响应（使用当前图片）
        emit('maskComplete', {
          visualMask: currentImageUrl,
          aiMask: currentImageUrl
        })

        // 重置状态
        isMasking.value = false
        currentTool.value = ''
        closeToolModal()
      } else {
        throw new Error('无法获取图片名称')
      }
    }
  } catch (error) {
    console.error('处理蒙版结果时出错:', error)
    ElMessage.error('处理蒙版结果失败，请重试')
    isMasking.value = false
    currentTool.value = ''
    closeToolModal()
  }
}

// 更新蒙版预览
const updateMaskPreview = () => {
  if (!showMaskPreview.value || !maskCanvasRef.value || !maskImageRef.value) return

  const canvas = maskCanvasRef.value
  const image = maskImageRef.value

  // 创建临时画布
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height

  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  // 先绘制原图
  tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height)

  // 添加灰色遮罩
  tempCtx.fillStyle = 'rgba(128, 128, 128, 0.7)'
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

  // 获取蒙版数据
  const maskData = maskContext.value?.getImageData(0, 0, canvas.width, canvas.height)
  if (!maskData) return

  // 获取合成图像数据
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)

  // 处理像素 - 把蒙版区域变透明
  for (let i = 0; i < maskData.data.length; i += 4) {
    // 如果蒙版像素不是透明的
    if (maskData.data[i + 3] > 0) {
      // 对应位置设为透明
      imageData.data[i + 3] = 0
    }
  }

  // 应用处理后的图像数据
  tempCtx.putImageData(imageData, 0, 0)

  // 更新预览URL
  maskPreviewUrl.value = tempCanvas.toDataURL('image/png')
}

// 监听蒙版画笔大小变化
watch(maskBrushSize, () => {
  if (maskContext.value) {
    maskContext.value.lineWidth = maskBrushSize.value
  }
})

// 监听蒙版预览状态变化
watch(showMaskPreview, () => {
  updateMaskPreview()
})
// 我这边有很多人，你先看看到底是哪里改变了isViewingResults的值 好的你先忙把 
// 添加和移除全局事件监听
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('keydown', handleKeyDown)

  // 确保在组件卸载时清理图片拖拽的事件监听
  window.addEventListener('mouseup', stopImageDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('mousemove', handleImageDrag)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mouseup', stopImageDrag)

  // 清理定时器
  if (hoverTimeout.value) {
    clearTimeout(hoverTimeout.value)
  }

  // 停止 WebSocket 连接
  stopAiTaskWs()
})

// 强制更新图片URL的方法
const forceUpdateImage = (newImageUrl: string) => {
  console.log(`🔍 [${componentId.value}] 强制更新图片URL:`, newImageUrl);
  editingImageUrl.value = newImageUrl;
  // 重置编辑状态，确保使用新图片
  hasEdits.value = false;
  editedImageInfo.value = null;
  isSegmentationOnly.value = false;
  segmentationOssId.value = undefined;
}

// 暴露给父组件的方法
defineExpose({
  selectTool,
  openToolModal,  // 暴露openToolModal方法，允许父组件直接调用打开指定工具的弹窗
  currentTool,
  isViewingResults,
  resultImages,
  editingImageUrl,  // 暴露当前编辑的图片URL
  editedImageInfo,  // 暴露编辑后的图片信息
  showResults: (images: string[]) => {
    console.log('ImageWorkspace.showResults被调用，图片数量:', images.length, '图片URL示例:', images.length > 0 ? images[0] : 'none')

    if (!Array.isArray(images) || images.length === 0) {
      console.warn('showResults接收到空图片数组')
      ElMessage.warning('未能获取到生成的图片')
      return Promise.resolve(false)
    }

    // 预加载图片以检查它们是否可以正确加载
    const preloadPromises = images.map(url => {
      return new Promise<boolean>((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous' // 添加跨域支持

        img.onload = () => {
          console.log(`图片预加载成功: ${url.substring(0, 50)}...`)
          resolve(true)
        }

        img.onerror = (err) => {
          console.error(`图片预加载失败: ${url.substring(0, 50)}...`, err)
          resolve(false)
        }

        // 如果URL是http/https开头，添加缓存破坏参数
        if (url.startsWith('http')) {
          img.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
        } else {
          img.src = url
        }
      })
    })

    // 等待所有图片预加载完成
    return Promise.all(preloadPromises).then(results => {
      // 过滤掉加载失败的图片URL
      const validImages = images.filter((_, i) => results[i])

      if (validImages.length === 0) {
        console.error('所有图片预加载失败')
        ElMessage.error('图片加载失败，请重试')
        return false
      }

      if (validImages.length < images.length) {
        console.warn(`部分图片加载失败: 成功 ${validImages.length}/${images.length}`)
        ElMessage.warning(`部分图片加载失败，仅显示 ${validImages.length} 张图片`)
      }

      // 更新组件状态
      resultImages.value = validImages
      isViewingResults.value = true
      currentSlide.value = 0

      // 在弹窗显示后强制调整位置
      nextTick(() => {
        setTimeout(() => {
          const dialog = document.querySelector('.tool-modal .el-dialog') as HTMLElement
          if (dialog) {
            dialog.style.marginTop = '40vh'
            console.log('强制调整弹窗位置')
          }
        }, 100)
      })

      return true
    }).catch(err => {
      console.error('图片预加载过程中发生错误:', err)
      return false
    })
  },
  showSegmentationResult,
  exitResultsView,
  isSmartSelecting, // 新增暴露状态
  forceUpdateImage // 新增强制更新图片方法
})

// 初始化蒙版工具
const setupMaskTool = () => {
  isMasking.value = true
  isCropping.value = false
  isBrushing.value = false
  // 在下一个tick初始化蒙版区域
  setTimeout(initMaskCanvas, 0)
}

// 添加完成编辑确认的方法
const confirmCompleteEditing = () => {
  ElMessageBox.confirm(
    '确定要完成编辑吗？',
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    let imageIdToEmit
    let editType = 'none'

    if (isSegmentationOnly.value && segmentationOssId.value) {
      imageIdToEmit = segmentationOssId.value
      editType = 'segmentation'
    } else if (hasEdits.value && editedImageInfo.value) {
      imageIdToEmit = editedImageInfo.value.id
      editType = 'other'
    } else {
      // 没有编辑，传递原图和原图ID
      let originalImageId: number | undefined
      if (props.originalImageName) {
        const parsedId = parseInt(props.originalImageName, 10)
        if (!isNaN(parsedId)) {
          originalImageId = parsedId
        }
      }
      imageIdToEmit = originalImageId
      editType = 'original'
    }

    console.log('🔍 完成编辑 - 详细调试信息:', {
      editType,
      imageUrl: editingImageUrl.value,
      imageId: imageIdToEmit,
      isSegmentationOnly: isSegmentationOnly.value,
      segmentationOssId: segmentationOssId.value,
      hasEdits: hasEdits.value,
      editedImageInfo: editedImageInfo.value,
      originalImageName: props.originalImageName,
      currentTool: currentTool.value,
      // 添加更多调试信息
      'isSegmentationOnly类型': typeof isSegmentationOnly.value,
      'segmentationOssId类型': typeof segmentationOssId.value,
      '条件判断1': isSegmentationOnly.value && segmentationOssId.value,
      '条件判断2': hasEdits.value && editedImageInfo.value
    })

    console.log('🚀 发送 imageEdited 事件:', {
      imageUrl: editingImageUrl.value,
      imageId: imageIdToEmit
    })

    emit('imageEdited', editingImageUrl.value, imageIdToEmit)
    emit('editingCompleted')
    ElMessage.success('编辑已完成')
  }).catch(() => { })
}

// 处理图片错误
const handleImageError = (event: Event, index: number) => {
  console.error(`图片加载失败: ${resultImages.value[index]}`, event)
  ElMessage.error(`图片加载失败: ${resultImages.value[index]}`)
}

// 处理缩略图错误
const handleThumbnailError = (event: Event, index: number) => {
  console.error(`缩略图加载失败: ${resultImages.value[index]}`, event)
  ElMessage.error(`缩略图加载失败: ${resultImages.value[index]}`)
}

// 处理图片缩放滚轮事件
const handleImageWheel = (e: WheelEvent, index: number) => {
  // 初始化缩放级别（如果尚未初始化）
  if (!resultImageZoom.value[index]) {
    resultImageZoom.value[index] = 1
  }

  // 根据滚轮方向计算缩放
  const direction = e.deltaY > 0 ? -1 : 1
  const newZoom = resultImageZoom.value[index] + (direction * ZOOM_STEP)

  // 限制缩放范围
  resultImageZoom.value[index] = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))

  // 如果数组没有响应性更新，可以使用以下方式强制更新
  resultImageZoom.value = [...resultImageZoom.value]
}

// 开始拖拽图片
const startImageDrag = (e: MouseEvent, index: number) => {
  // 只有在图片被放大的情况下才允许拖拽
  if ((resultImageZoom.value[index] || 1) <= 1) {
    return
  }

  e.preventDefault()
  resultDragging.value = true
  resultDragStartX.value = e.clientX - (resultImagePosition.value[index]?.x || 0)
  resultDragStartY.value = e.clientY - (resultImagePosition.value[index]?.y || 0)

  // 添加全局鼠标事件监听
  document.addEventListener('mousemove', handleImageDrag)
  document.addEventListener('mouseup', stopImageDrag)
}

// 处理图片拖拽
const handleImageDrag = (e: MouseEvent) => {
  if (!resultDragging.value) return

  const index = currentSlide.value
  const newX = e.clientX - resultDragStartX.value
  const newY = e.clientY - resultDragStartY.value

  // 更新位置
  if (!resultImagePosition.value[index]) {
    resultImagePosition.value[index] = { x: 0, y: 0 }
  }

  resultImagePosition.value[index] = { x: newX, y: newY }

  // 强制更新数组以触发响应式更新
  resultImagePosition.value = [...resultImagePosition.value]
}

// 停止拖拽图片
const stopImageDrag = () => {
  resultDragging.value = false

  // 移除全局事件监听
  document.removeEventListener('mousemove', handleImageDrag)
  document.removeEventListener('mouseup', stopImageDrag)
}

// 初始化智能选区工具
const setupSmartSelectTool = () => {
  // 切换到智能选区模式
  isSmartSelecting.value = true

  // 确保其他编辑模式关闭
  isCropping.value = false
  isBrushing.value = false
  isMasking.value = false

  // 发送事件隐藏header - 使用emitter全局事件总线
  emitter.emit('toggle-header', false)
}



// 上传智能选区蒙版
const uploadSelectionMask = async (maskDataUrl: string, selectionType: 'include' | 'exclude') => {
  try {
    // Convert data URL to file
    const blob = dataURLtoBlob(maskDataUrl)
    const maskFile = new File([blob], `smart_selection_mask_${Date.now()}.png`, { type: 'image/png' })

    // 获取当前图片ID
    const imageId = getCurrentImageId()
    console.log('🔍 uploadSelectionMask 获取到的图片ID:', imageId)
    console.log('🔍 当前状态检查:', {
      hasEdits: hasEdits.value,
      editedImageInfo: editedImageInfo.value,
      isSegmentationOnly: isSegmentationOnly.value,
      segmentationOssId: segmentationOssId.value,
      storeOssIds: useShoeStore().aiTask.ossIds,
      storeCurrentImageId: useShoeStore().currentImageId
    })

    if (!imageId) {
      throw new Error('无法获取图片ID')
    }

    console.log('🔍 uploadSelectionMask 准备上传蒙版，使用图片ID:', imageId)
    // 上传蒙版
    const response = await uploadMask(maskFile, String(imageId))

    if (response.code === 0 || response.code === 200) {
      // 处理成功响应
      return response.data
    } else {
      throw new Error(response.msg || '上传蒙版失败')
    }
  } catch (error) {
    console.error('上传智能选区蒙版失败:', error)
    throw error
  }
}

// 获取当前图片ID
const getCurrentImageId = (): number | undefined => {
  const shoeStore = useShoeStore()

  console.log('🔍 getCurrentImageId 开始检查，当前store状态:', {
    ossIds: shoeStore.aiTask.ossIds,
    currentImageId: shoeStore.currentImageId,
    hasEdits: hasEdits.value,
    editedImageInfo: editedImageInfo.value,
    isSegmentationOnly: isSegmentationOnly.value,
    segmentationOssId: segmentationOssId.value,
    originalImageName: props.originalImageName
  })

  // 最高优先级：使用WebSocket返回的最新ossIds（抠图后的新ID）
  if (shoeStore.aiTask.ossIds && shoeStore.aiTask.ossIds.length > 0) {
    const latestOssId = shoeStore.aiTask.ossIds[0]
    console.log('🔍 ImageWorkspace使用WebSocket返回的最新ossId:', latestOssId)
    return latestOssId
  } else {
    console.log('🔍 WebSocket ossIds不存在或为空')
  }

  // 第二优先级：使用编辑后的图片ID（包括抠图后的新ID）
  if (hasEdits.value && editedImageInfo.value?.id) {
    console.log('🔍 ImageWorkspace使用编辑后图片ID:', editedImageInfo.value.id)
    return editedImageInfo.value.id
  }

  // 第三优先级：使用抠图后的新ID（segmentationOssId）
  if (isSegmentationOnly.value && segmentationOssId.value) {
    console.log('🔍 ImageWorkspace使用抠图后图片ID:', segmentationOssId.value)
    return segmentationOssId.value
  }

  // 第四优先级：使用全局store中的最新图片ID
  if (shoeStore.currentImageId) {
    console.log('🔍 ImageWorkspace使用全局图片ID:', shoeStore.currentImageId)
    return shoeStore.currentImageId
  }

  // 使用传入的originalImageName
  if (props.originalImageName) {
    console.log('🔍 ImageWorkspace检查props.originalImageName:', props.originalImageName)
    const parsedId = parseInt(props.originalImageName, 10)
    if (!isNaN(parsedId)) {
      // 验证ID是否合理（避免使用时间戳作为ID）
      // 图片ID通常是较小的数字（如3045, 3046等），而不是时间戳
      if (parsedId > 1000000) {
        console.warn('🔍 ImageWorkspace props.originalImageName可能是时间戳而不是图片ID:', parsedId)
        console.warn('🔍 跳过时间戳，继续检查下一个优先级')
        // 如果是时间戳，跳过这个值，使用下一个优先级
      } else {
        console.log('🔍 ImageWorkspace使用props图片ID:', parsedId)
        return parsedId
      }
    } else {
      console.warn('🔍 ImageWorkspace props.originalImageName不是有效数字:', props.originalImageName)
    }
  } else {
    console.log('🔍 props.originalImageName不存在')
  }

  // 尝试从当前图片URL中提取
  const currentImageUrl = editingImageUrl.value || props.imageUrl
  if (currentImageUrl) {
    const urlParts = currentImageUrl.split('?')
    if (urlParts.length > 1) {
      const params = new URLSearchParams(urlParts[1])
      const imageName = params.get('name') || ''
      const parsedId = parseInt(imageName, 10)
      if (!isNaN(parsedId)) {
        console.log('🔍 ImageWorkspace使用URL提取图片ID:', parsedId)
        return parsedId
      }
    }
  }

  console.log('🔍 ImageWorkspace无法获取图片ID')

  // 最后的备用方案：如果所有方法都失败了，尝试从当前显示的图片URL中提取ID
  const fallbackImageUrl = editingImageUrl.value || props.imageUrl
  if (fallbackImageUrl) {
    console.log('🔍 尝试从当前图片URL中提取ID:', fallbackImageUrl)
    // 尝试从OSS URL中提取ID
    const ossMatch = fallbackImageUrl.match(/\/users\/[^\/]+\/(\d+)\.(jpg|jpeg|png|gif|webp)/i)
    if (ossMatch) {
      const extractedId = parseInt(ossMatch[1])
      if (!isNaN(extractedId) && extractedId < 1000000) {
        console.log('🔍 从OSS URL中提取到有效ID:', extractedId)
        return extractedId
      }
    }
  }

  return undefined
}

// 关闭智能选区


const showTwoChuang = ref(false)
const twoChuangOptions = [
  {
    label: '款式融合',
    value: 'fusion',
    desc: '多图融合生成新款式',
    icon: InfoFilled,
    path: '/design/style-fusion'
  },
  {
    label: '鞋底换面',
    value: 'sole',
    desc: '鞋底与鞋面互换',
    icon: Scissor,
    path: '/design/sole-fusion'
  },
  {
    label: '款式延申',
    value: 'extend',
    desc: '款式延申生成新款式',
    icon: InfoFilled,
    path: '/design/style-extend'
  },
  {
    label: '局部修改',
    value: 'modify',
    desc: '局部修改图片',
    icon: Scissor,
    path: '/design/partial-modify'
  },
  {
    label: '文字创款',
    value: 'text',
    desc: '文字创款生成新款式',
    icon: InfoFilled,
    path: '/design/text-create'
  },
  {
    label: '一键配色',
    value: 'color',
    desc: '一键配色生成新款式',
    icon: InfoFilled,
    path: '/design/color-create'
  },
  {
    label: '一键抠图',
    value: 'image-swap',
    desc: '一键抠图生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/image-swap'
  },
  {
    label: '智能抠图',
    value: 'smart-cutout',
    desc: '交互式智能抠图，左键正点右键负点',
    icon: Scissor,
    path: '/design/smart-cutout'
  },
  {
    label: '高清放大',
    value: 'hd-enhance',
    desc: '高清放大生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/hd-enhance'
  },
  {
    label: '元素消除',
    value: 'element-remove',
    desc: '元素消除生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/element-remove'
  },
  {
    label: '图片修复',
    value: 'image-restore',
    desc: '图片修复生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/image-restore'
  },
  {
    label: '一键去水印',
    value: 'watermark-remove',
    desc: '一键去水印生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/watermark-remove'
  },
  {
    label: '一键线稿图',
    value: 'line-art',
    desc: '一键线稿图生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/line-art'
  }

]

function handleCreativeClick() {
  showTwoChuang.value = true
}

function handleTwoChuangSelect(option: any) {
  // 跳转到对应页面，并传递当前结果图和ossId
  let img = resultImages.value[resultImages.value.length - 1];
  let ossId = (editedImageInfo.value && editedImageInfo.value.id) ? editedImageInfo.value.id : '';
  router.push({ path: option.path, query: { creativeImg: img, ossId } });
}
</script>
<style scoped >

.image-workspace {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 0 0px rgba(0, 0, 0, 0.5);
}

.workspace-container {
  width: calc(100% - 70px);
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-right: 70px;
}

.image-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: transparent;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.edit-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  box-shadow: none;
  transition: transform 0.2s ease;
}

.empty-placeholder {
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
}

.toolbar {
  position: absolute;
  top: 50%;
  right: -80px;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: rgba(0, 0, 0, 0.6);
  padding: 12px;
  border-radius: 8px;
  z-index: 100;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.tool-item .icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  transition: all 0.3s;
}

.tool-item:hover .icon-wrapper {
  background: rgba(255, 255, 255, 0.2);
}

.tool-item.active .icon-wrapper {
  background: #c8ad7f;
  color: white;
}

.tool-item .tool-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  white-space: nowrap;
}

.tool-item.active .tool-text {
  color: #c8ad7f;
}

.tool-options {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  padding: 12px;
  border-radius: 8px;
  min-width: 250px;
  z-index: 100;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.option-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
}

.option-label {
  min-width: 60px;
  color: #fff;
  font-size: 14px;
}

.brush-slider {
  flex: 1;
  margin: 0 10px;
}

.option-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.zoom-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 8px;
  border-radius: 8px;
  z-index: 100;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.zoom-text {
  min-width: 60px;
  text-align: center;
  color: #fff;
  font-size: 14px;
}

.crop-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.crop-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.crop-area {
  position: absolute;
  border: 2px solid #c8ad7f;
  cursor: move;
  z-index: 2;
}

.crop-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  pointer-events: none;
  z-index: 1;
}

.crop-control-point {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #c8ad7f;
  border: 2px solid #fff;
  border-radius: 50%;
  z-index: 3;
}

.crop-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
}

.grid-line.horizontal {
  width: 100%;
  height: 1px;
}

.grid-line.vertical {
  width: 1px;
  height: 100%;
}

.grid-line.horizontal:nth-child(1) {
  top: 33.33%;
}

.grid-line.horizontal:nth-child(2) {
  top: 66.66%;
}

.grid-line.vertical:nth-child(3) {
  left: 33.33%;
}

.grid-line.vertical:nth-child(4) {
  left: 66.66%;
}

.top-left {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.top-right {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

.top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.right {
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.left {
  top: 50%;
  left: -6px;
  transform: translateY(-50%);
  cursor: w-resize;
}

/* 涂抹相关样式 */
.brush-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.brush-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brush-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: crosshair;
  pointer-events: auto;
}

/* 加载状态样式 */
.processing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.processing-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.processing-text {
  margin-top: 10px;
  color: #fff;
  font-size: 14px;
}

.option-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
  text-align: center;
}

.threshold-slider {
  margin: 10px 0;
}

.preview-container {
  width: 100%;
  height: 150px;
  margin-bottom: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 结果查看样式 */
.results-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* 垂直居中 */
  align-items: center;
  /* 水平居中 */
}

/* 全屏结果显示样式 */
.results-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.results-modal {
  position: relative;
  width: 90%;
  height: 90%;
  max-width: 1200px;
  max-height: 800px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: visible;
  margin-top: 75px;
}

.close-button {
  position: absolute;
  top: 43px;
  right: 15px;
  width: 45px;
  height: 45px;
  background: rgba(0, 0, 0, 0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10001;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.close-button .el-icon {
  color: white;
  font-size: 22px;
  font-weight: bold;
}

.bottom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.1);
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  z-index: 10000;
}

.download-section {
  display: flex;
  justify-content: center;
}

.download-btn {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: white !important;
  font-weight: bold !important;
  padding: 12px 30px !important;
  border-radius: 25px !important;
  font-size: 16px !important;
  box-shadow: 0 4px 15px rgba(0, 163, 255, 0.3) !important;
  transition: all 0.3s ease !important;
}

.download-btn:hover {
  background: linear-gradient(90deg, #0099E6, #00E6E6) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 0 rgba(0, 163, 255, 0.4) !important;
}

/* 上方主图盒子 */
.main-image-box {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-image-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 下方缩略图和按钮盒子 */
.thumbnails-box {
  width: 100%;
  height: 160px;
  /* 恢复高度，包含缩略图和按钮 */
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0 0 8px 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.thumbnails-container {
  width: 100%;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.thumbnails-wrapper {
  display: flex;
  gap: 10px;
  max-width: 100%;
  overflow-x: auto;
  padding: 0 10px;
}

.thumbnail-item {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.thumbnail-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-item.active {
  border: 2px solid #c8ad7f;
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 163, 255, 0.5);
}

.result-actions {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s;
}

.carousel-arrow:hover {
  background: rgba(0, 0, 0, 0.8);
}

.carousel-arrow.left {
  left: 20px;
}

.carousel-arrow.right {
  right: 20px;
}

.results-slides {
  width: 100%;
  height: 100%;
  display: flex;
  transition: transform 0.3s ease;
  flex: 1;
}

.result-slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 20px;
}

.result-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  background: transparent;
  border: none;
  box-shadow: none;
  border-radius: 8px;
}

/* 蒙版相关样式 */
.mask-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mask-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mask-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: crosshair;
}

.mask-preview-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 160px;
  height: 160px;
  background: rgba(40, 40, 40, 0.9);
  border-radius: 8px;
  padding: 8px;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.mask-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 4px;
}

.mask-preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.mask-preview-toggle {
  margin: 10px 0;
  display: flex;
  justify-content: center;
}

/* 工具弹窗样式 - 强制防止溢出 */
.tool-modal {
  position: relative;
  overflow: hidden !important;
}

/* 最强制的溢出修复 - 确保对话框绝对不会溢出 */
.tool-modal :deep(.el-dialog) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 12px !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
}

.tool-modal :deep(.el-dialog__body) {
  overflow: hidden !important;

  contain: layout style paint !important;
  border-radius: 0 0 12px 12px !important;
  max-height: calc(90vh - 60px) !important;
}

.tool-modal .tool-modal-content {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  max-height: 100% !important;
}

.tool-modal .tool-modal-workspace

/* 最强制的溢出修复 - 确保对话框绝对不会溢出 */
.tool-modal :deep(.el-dialog) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 12px !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
}

.tool-modal :deep(.el-dialog__body) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 0 0 12px 12px !important;
  max-height: calc(90vh - 60px) !important;
}

.tool-modal .tool-modal-content {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint
}

.tool-modal :deep(.el-dialog__body) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 0 0 12px 12px !important;
}

.tool-modal .tool-modal-content {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
}

.tool-modal .tool-modal-workspace {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
}

/* 最强制的溢出修复 - 针对智能抠图 */
.tool-modal:has(.smart-cutout-modal-layout) {
  overflow: hidden !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 12px !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog__body) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 0 0 12px 12px !important;
  max-height: calc(90vh - 60px) !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-content {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  max-height: 100% !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-workspace {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  max-width: 100% !important;
  max-height: 100% !important;
}

/* 智能抠图布局强制限制 */
.smart-cutout-modal-layout {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  max-width: 100% !important;
  max-height: 100% !important;
  box-sizing: border-box !important;
}

.smart-cutout-modal-layout .smart-cutout-image-area {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  max-width: 100% !important;
  max-height: 100% !important;
  box-sizing: border-box !important;
}

.smart-cutout-modal-layout .smart-cutout-image-wrapper {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  max-width: 100% !important;
  max-height: 100% !important;
  box-sizing: border-box !important;
}

/* 确保图片绝对不会超出容器 */
.smart-cutout-modal-layout .smart-cutout-image {
  max-width: calc(100% - 40px) !important;
  max-height: calc(100% - 160px) !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  display: block !important;
  margin: 0 auto !important;
  box-sizing: border-box !important;
}

/* 最强制的溢出修复 - 使用clip-path强制裁剪 */
.tool-modal :deep(.el-dialog) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 12px !important;
}

.tool-modal :deep(.el-dialog__body) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 0 0 12px 12px !important;
}

/* 强制限制智能抠图弹窗内所有内容 */
.tool-modal:has(.smart-cutout-modal-layout) {
  overflow: hidden !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 12px !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog__body) {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 0 0 12px 12px !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-content {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-workspace {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
}

/* 智能抠图布局强制限制 */
.smart-cutout-modal-layout {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
  border-radius: 8px !important;
}

.smart-cutout-modal-layout .smart-cutout-image-area {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
}

.smart-cutout-modal-layout .smart-cutout-image-wrapper {
  overflow: hidden !important;
  clip-path: inset(0) !important;
  contain: layout style paint !important;
}

/* 最强制的溢出修复 - 确保对话框内容绝对不会溢出 */
.tool-modal :deep(.el-dialog) {
  overflow: hidden !important;
  contain: layout style paint !important;
}

.tool-modal :deep(.el-dialog__body) {
  overflow: hidden !important;
  contain: layout style paint !important;
}

/* 智能抠图专用强制限制 */
.tool-modal:has(.smart-cutout-modal-layout) {
  overflow: hidden !important;
  contain: layout style paint !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog) {
  overflow: hidden !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
  contain: layout style paint !important;
  clip-path: inset(0) !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog__body) {
  overflow: hidden !important;
  padding: 0 !important;
  max-height: calc(90vh - 60px) !important;
  contain: layout style paint !important;
  clip-path: inset(0) !important;
}

/* 智能抠图专用样式 - 确保完全包含在对话框内 */
.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-content {
  overflow: hidden !important;
  max-height: 100% !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-workspace {
  overflow: hidden !important;
  max-width: 100% !important;
  max-height: 100% !important;
}

/* 强制限制智能抠图布局不溢出 */
.smart-cutout-modal-layout {
  max-width: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.smart-cutout-modal-layout .smart-cutout-image-area {
  max-width: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.smart-cutout-modal-layout .smart-cutout-image-wrapper {
  max-width: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.smart-cutout-modal-layout .smart-cutout-image {
  max-width: 100% !important;
  max-height: 100% !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
}

/* 最强制的溢出修复 - 确保对话框内容不会溢出 */
.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog) {
  overflow: hidden !important;
  max-width: 90vw !important;
  max-height: 90vh !important;
  box-sizing: border-box !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog__body) {
  overflow: hidden !important;
  padding: 0 !important;
  max-height: calc(90vh - 60px) !important;
  box-sizing: border-box !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-content {
  overflow: hidden !important;
  max-height: 100% !important;
  box-sizing: border-box !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-workspace {
  overflow: hidden !important;
  max-width: 100% !important;
  max-height: 100% !important;
  box-sizing: border-box !important;
}

/* 强制限制智能抠图所有子元素 */
.smart-cutout-modal-layout,
.smart-cutout-modal-layout * {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.smart-cutout-modal-layout .smart-cutout-image-area,
.smart-cutout-modal-layout .smart-cutout-image-wrapper {
  overflow: hidden !important;
  max-width: 100% !important;
  max-height: 100% !important;
  box-sizing: border-box !important;
}

/* 确保图片绝对不会超出容器 */
.smart-cutout-modal-layout .smart-cutout-image {
  max-width: calc(100% - 40px) !important;
  max-height: calc(100% - 160px) !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  display: block !important;
  margin: 0 auto !important;
}

/* 最终解决方案 - 强制限制所有智能抠图相关元素 */
.tool-modal:has(.smart-cutout-modal-layout) {
  overflow: hidden !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog) {
  overflow: hidden !important;
  contain: layout style paint !important;
}

.tool-modal:has(.smart-cutout-modal-layout) :deep(.el-dialog__body) {
  overflow: hidden !important;
  contain: layout style paint !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-content {
  overflow: hidden !important;
  contain: layout style paint !important;
}

.tool-modal:has(.smart-cutout-modal-layout) .tool-modal-workspace {
  overflow: hidden !important;
  contain: layout style paint !important;
}

.smart-cutout-modal-layout {
  overflow: hidden !important;
  contain: layout style paint !important;
  clip-path: inset(0) !important;
}

.smart-cutout-modal-layout .smart-cutout-image-area {
  overflow: hidden !important;
  contain: layout style paint !important;
  clip-path: inset(0) !important;
}

.smart-cutout-modal-layout .smart-cutout-image-wrapper {
  overflow: hidden !important;
  contain: layout style paint !important;
  clip-path: inset(0) !important;
}

.tool-modal :deep(.el-dialog) {
  background: rgba(0, 0, 0, 0.95) !important;
  border-radius: 12px !important;
  margin-right: 5% !important;
  margin-left: 0 !important;
  margin-top: 50vh !important;
  top: 45vh !important;
  transform: translateY(30vh) !important;
  display: flex !important;
  flex-direction: column !important;
  height: 70vh !important;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8) !important;
  border: none !important;
  position: relative !important;

}

/* 强制覆盖Element Plus的默认定位 */
.tool-modal :deep(.el-overlay) {
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  padding-bottom: 10vh !important;
}

.tool-modal :deep(.el-dialog__header) {
  background: rgba(0, 0, 0, 0.7);
  padding: 15px 20px;
  margin: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px 12px 0 0;
}

.tool-modal :deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.tool-modal :deep(.el-dialog__headerbtn) {
  top: 15px;
}

.tool-modal :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: rgba(255, 255, 255, 0.7);
}

.tool-modal :deep(.el-dialog__headerbtn:hover .el-dialog__close) {
  color: white;
}

.tool-modal :deep(.el-dialog__body) {
  padding: 0;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tool-modal-content {
  display: flex;
  height: 100%;
}

.tool-modal-workspace {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: auto;
  /* Allow scrolling if needed */
}

.tool-modal-options {
  width: 260px;
  height: 100%;
  background: rgba(30, 30, 30, 0.9);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.modal-options-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.modal-options-title {
  font-size: 20px;
  color: white;
  font-weight: bold;
  margin-bottom: 5px;
}

.modal-options-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.modal-options-slider {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.modal-options-controls {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.modal-options-controls .el-button {
  flex: 1;
}

.tool-modal-workspace :deep(.crop-container),
.tool-modal-workspace :deep(.brush-container),
.tool-modal-workspace :deep(.mask-container) {
  width: 100%;
  height: 100%;
  min-height: calc(80vh - 150px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  /* Changed from hidden to allow scrolling if needed */
  position: relative;
}

.tool-modal-workspace :deep(.crop-image),
.tool-modal-workspace :deep(.brush-image),
.tool-modal-workspace :deep(.mask-image) {
  /* Remove max-width/max-height to allow exact sizing */
  object-fit: contain;
  /* Size will be set programmatically to match main workspace */
  display: block;
}

.tool-modal-workspace :deep(.brush-canvas),
.tool-modal-workspace :deep(.mask-canvas) {
  position: absolute;
  top: 0;
  left: 0;
  /* Width and height will match the image */
}

/* Additional responsive adjustments */
@media (max-height: 768px) {
  .tool-modal :deep(.el-dialog) {
    height: 80vh;
    width: 85%;

  }

  .tool-modal-options {
    width: 240px;
  }
}

.tool-modal-workspace :deep(.brush-container),
.tool-modal-workspace :deep(.mask-container) {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tool-modal-workspace :deep(.mask-container) {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible !important;
  box-sizing: border-box;
}

.tool-modal-workspace :deep(.mask-image) {
  display: block;
  max-width: none;
  max-height: none;
  object-fit: contain;
  box-sizing: border-box;
  pointer-events: none;
}

.tool-modal-workspace :deep(.mask-canvas) {
  position: absolute;
  top: 0;
  left: 0;

  pointer-events: auto;
  z-index: 10;
  box-sizing: border-box;
  transform: none !important;
}

/* 更新蒙版预览样式 */
.mask-preview-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 160px;
  height: 160px;
  background: rgba(40, 40, 40, 0.9);
  border-radius: 8px;
  padding: 8px;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.mask-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 4px;
}

.tool-modal-workspace :deep(.brush-container) {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible !important;
}

.tool-modal-workspace :deep(.brush-image) {
  display: block;
  max-width: none;
  max-height: none;
  object-fit: contain;
}

.tool-modal-workspace :deep(.brush-canvas) {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  z-index: 5;
}

.tool-modal .tool-modal-content {
  display: flex;
  height: 100%;
}

.tool-modal-workspace {
  flex: 1;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.tool-footer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.mask-preview {
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 10px;
}

.mask-preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.complete-edit-item .icon-wrapper {
  background: #c8ad7f;
  color: white;
}

.complete-edit-item .tool-text {
  color: #c8ad7f;
}

.complete-edit-item .icon-wrapper {
  background: #c8ad7f;
}

.complete-edit-item .tool-text {
  color: #c8ad7f;
}

.complete-edit-item {
  margin-top: 10px;
  position: relative;
}

.complete-edit-item::before {
  content: "";
  position: absolute;
  top: -12px;
  left: 5px;
  right: 5px;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
}

/* Add styles for smart selection container */
.smart-selecting-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 强力覆盖 el-dialog 外部的金色边框和阴影 */
.tool-modal :deep(.el-dialog),
.tool-modal :deep(.el-dialog__wrapper),
.tool-modal :deep(.el-overlay),
.tool-modal :deep(.el-dialog::before),
.tool-modal :deep(.el-dialog::after) {
  border: none !important;

  box-shadow: none !important;
  outline: none !important;
  background-clip: border-box !important;
}

.tool-modal :deep(.el-dialog)::before,
.tool-modal :deep(.el-dialog)::after {
  display: none !important;
  border: none !important;
  box-shadow: none !important;
  background: none !important;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 20px;
  background: #f7f7f7;
  color: #c8ad7f;
  font-weight: bold;
  font-size: 15px;
  cursor: pointer;
  border: 1.5px solid #c8ad7f;
  transition: background 0.2s, color 0.2s;
  position: absolute;
  top: 43px;
  left: 24px;
  z-index: 10001;
}

.action-btn:hover {
  background: #c8ad7f;
  color: #fff;
}

.creative-circle-btn {
  position: absolute;
  top: 43px;
  left: 24px;
  width: 56px;
  height: 56px;
  background: rgba(80, 80, 80, 0.85);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: background 0.2s, color 0.2s;
  border: none;
}

.creative-circle-btn:hover {
  background: #c8ad7f;
}

.creative-circle-btn .el-icon {
  font-size: 26px;
  color: #fff;
  margin-bottom: 2px;
}

.circle-label {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
  letter-spacing: 1px;
  margin-top: 2px;
  text-align: center;
}

/* 进度条样式 */
.progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.progress-container {
  text-align: center;
  color: white;
}

.progress-text {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #c8ad7f;
}

.progress-bar {
  width: 300px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-bar-gold {
  height: 100%;
  background: linear-gradient(90deg, #c8ad7f, #e6c88a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-label {
  font-size: 16px;
  color: #fff;
  opacity: 0.8;
}

/* 智能抠图相关样式 */
.smart-cutout-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.smart-cutout-image {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.smart-cutout-canvas {

  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  z-index: 10;
}

.points-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 20;
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
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.point-marker.foreground {
  background-color: #10B981;
}

.point-marker.background {
  background-color: #EF4444;
}

.point-number {
  font-size: 10px;
  line-height: 1;
}

.cutout-result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 5;
}

.cutout-result-canvas {
  max-width: 100%;
  max-height: 100%;
}

.cutout-stats {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.stat-item:last-child {
  margin-bottom: 0;
  font-weight: bold;
  border-top: 1px solid #e4e7ed;
  padding-top: 8px;
  margin-top: 8px;
}

.positive-point {
  color: #10B981;
  font-size: 16px;
  margin-right: 8px;
}

.negative-point {
  color: #EF4444;
  font-size: 16px;
  margin-right: 8px;
}

/* 悬浮预览Canvas样式 */
.hover-preview-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 15;
  opacity: 0.8;
}

/* 智能抠图结果Canvas样式 */
.cutout-result-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
}

/* 智能抠图容器样式优化 */
.smart-cutout-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}



.smart-cutout-canvas {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* 点击点标记样式优化 */
.points-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 20;
}

.point-marker {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  transform: translate(-50%, -50%);
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  animation: pointPulse 0.3s ease-out;
}

@keyframes pointPulse {
  0% {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }

  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.point-marker.foreground {
  background: linear-gradient(135deg, #10B981, #059669);
  border-color: #34D399;
}

.point-marker.background {
  background: linear-gradient(135deg, #EF4444, #DC2626);
  border-color: #F87171;
}

.point-number {
  font-size: 11px;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 统计信息样式优化 */
.cutout-stats {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 16px;
  border-radius: 12px;
  margin: 16px 0;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #495057;
}

.stat-item:last-child {
  margin-bottom: 0;
  font-weight: bold;
  border-top: 2px solid #c8ad7f;
  padding-top: 10px;
  margin-top: 12px;
  color: #212529;
}

.positive-point {
  color: #10B981;
  font-size: 18px;
  margin-right: 8px;
  text-shadow: 0 1px 2px rgba(16, 185, 129, 0.3);
}

.negative-point {
  color: #EF4444;
  font-size: 18px;
  margin-right: 8px;
  text-shadow: 0 1px 2px rgba(239, 68, 68, 0.3);
}

/* 智能抠图按钮样式优化 */
.modal-options-controls .el-button {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.modal-options-controls .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.modal-options-controls .el-button[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 智能抠图按钮布局优化 */
.smart-cutout-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.smart-cutout-controls .button-row {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.smart-cutout-controls .button-row .el-button {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  padding: 6px 8px;
}

.smart-cutout-controls .button-row:last-child .el-button {
  background: linear-gradient(90deg, #c8ad7f, #e6c88a);
  border-color: #c8ad7f;
  color: white;
  font-weight: bold;
}

.smart-cutout-controls .button-row:last-child .el-button:hover {
  background: linear-gradient(90deg, #b8a070, #d6b87a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(200, 173, 127, 0.3);
}

/* 智能抠图新布局样式 */
.smart-cutout-new-layout {
  position: absolute;
  top: -70px;
  left: 0;
  right: 0;
  z-index: 1001;
}

/* 智能抠图弹窗内布局样式 */
.smart-cutout-modal-layout {
  position: relative;
  width: 100%;
  height: 80vh;
  /* 使用视口高度的80%，确保图片完整显示 */
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

/* 重写智能抠图在弹窗内的样式 - 确保工具栏不覆盖图片 */
.smart-cutout-modal-layout .smart-cutout-header {
  position: relative !important;
  top: auto !important;
  left: auto !important;
  right: auto !important;
  padding: 15px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  /* 防止被压缩 */
}

/* 覆盖全屏模式的工具栏样式，确保在弹窗内正常显示 */
.smart-cutout-modal-layout .smart-cutout-toolbar {
  position: relative !important;
  top: auto !important;
  left: auto !important;
  transform: none !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  z-index: auto !important;
}

.smart-cutout-modal-layout .smart-cutout-main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  /* 减少padding，给图片更多空间 */
  overflow: hidden;
}

.smart-cutout-image-container {
  position: relative !important;
  padding: 0 !important;
  margin: 0 !important;
}

.smart-cutout-modal-layout .smart-cutout-footer {
  position: relative;
  bottom: auto;
  left: auto;
  right: auto;
  padding: 15px;
  background: rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-direction: row;
  flex-shrink: 0;
  /* 防止被压缩 */
  margin-top: auto;
  /* 推到底部 */
}

/* 弹窗内智能抠图按钮样式 */
.smart-cutout-modal-layout .cutout-btn {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 8px 16px !important;
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  border-radius: 6px !important;
  color: #333 !important;
  font-size: 14px !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
}

.smart-cutout-modal-layout .cutout-btn:hover:not(:disabled) {
  background: #c8ad7f !important;
  color: white !important;
  border-color: #c8ad7f !important;
}

.smart-cutout-modal-layout .cutout-btn:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.smart-cutout-modal-layout .cutout-action-btn {
  padding: 12px 30px !important;
  border-radius: 20px !important;
  font-size: 16px !important;
  font-weight: bold !important;
  border: 2px solid transparent !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
}

.smart-cutout-modal-layout .cutout-select-btn {
  background: linear-gradient(135deg, #10B981, #059669) !important;
  color: white !important;
}

.smart-cutout-modal-layout .cutout-select-btn.active {
  border-color: #34D399 !important;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5) !important;
}

.smart-cutout-modal-layout .cutout-exclude-btn {
  background: linear-gradient(135deg, #EF4444, #DC2626) !important;
  color: white !important;
}

.smart-cutout-modal-layout .cutout-exclude-btn.active {
  border-color: #F87171 !important;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.5) !important;
}

.smart-cutout-image {
  display: block !important;
  /* 确保图片没有额外的margin */
  margin: 0 !important;
  padding: 0 !important;
}

.smart-cutout-modal-layout .smart-cutout-image {
  display: block;
  max-width: none;
  /* 移除最大宽度限制，让图片保持原始比例 */
  max-height: none;
  /* 移除最大高度限制，让图片保持原始比例 */
  width: auto;
  height: auto;
  object-fit: contain;
}

.smart-cutout-modal-layout .smart-cutout-canvas,
.smart-cutout-modal-layout .hover-preview-canvas,
.smart-cutout-modal-layout .cutout-result-canvas {
  position: absolute;
  top: 0;
  left: 0;
  /* Canvas尺寸由JavaScript动态设置，与图片完全一致 */
}

.smart-cutout-modal-layout .smart-cutout-canvas {
  pointer-events: auto;
  z-index: 2;
}

.smart-cutout-modal-layout .hover-preview-canvas,
.smart-cutout-modal-layout .cutout-result-canvas {
  pointer-events: none;
  z-index: 3;
}

/* 移除智能抠图内部的关闭按钮样式，使用弹窗自带的关闭按钮 */

/* 确保工具栏按钮样式正确 */
.smart-cutout-modal-layout .smart-cutout-toolbar {
  display: flex !important;
  gap: 10px !important;
  align-items: center !important;
}

/* 点击点标记样式 */
.smart-cutout-modal-layout .points-overlay {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
  z-index: 10 !important;
}

.smart-cutout-modal-layout .point-marker {
  position: absolute !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 50% !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  font-weight: bold !important;
  font-size: 12px !important;
  color: white !important;
  border: 2px solid !important;
  transform: translate(-50%, -50%) !important;
  z-index: 15 !important;
}

.smart-cutout-modal-layout .point-marker.foreground {
  background: linear-gradient(135deg, #10B981, #059669) !important;
  border-color: #34D399 !important;
}

.smart-cutout-modal-layout .point-marker.background {
  background: linear-gradient(135deg, #EF4444, #DC2626) !important;
  border-color: #F87171 !important;
}

/* 智能抠图弹窗内顶部工具栏 */
.smart-cutout-modal-layout .smart-cutout-top-toolbar {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.9);
  padding: 10px 16px;
  border-radius: 6px;
  border: 2px solid #c8ad7f;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.smart-cutout-modal-layout .toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #c8ad7f;
  border-radius: 4px;
  color: #c8ad7f;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 70px;
  justify-content: center;
  white-space: nowrap;
}

.smart-cutout-modal-layout .toolbar-btn:hover:not(:disabled) {
  background: #c8ad7f;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(200, 173, 127, 0.3);
}

.smart-cutout-modal-layout .toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 智能抠图弹窗内图片区域 */
.smart-cutout-modal-layout .smart-cutout-image-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 80px 20px 80px;
  overflow: hidden;
  min-height: 400px;
  /* 确保有足够的高度 */
}

.smart-cutout-modal-layout .smart-cutout-image {
  margin: 0 !important;
  padding: 0 !important;
}

/* 智能抠图弹窗内底部操作按钮 */
.smart-cutout-modal-layout .smart-cutout-bottom-actions {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  z-index: 1000;
}

.smart-cutout-modal-layout .action-btn {
  padding: 10px 32px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  min-width: 100px;
  text-align: center;
}

.smart-cutout-modal-layout .select-btn {
  background: linear-gradient(135deg, #f4e4bc, #e6d7a3);
  color: #8b7355;
  border-color: #c8ad7f;
}

.smart-cutout-modal-layout .select-btn:hover,
.smart-cutout-modal-layout .select-btn.active {
  background: linear-gradient(135deg, #c8ad7f, #b8a070);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(200, 173, 127, 0.4);
}

.smart-cutout-modal-layout .exclude-btn {
  background: linear-gradient(135deg, #2c2c2c, #1a1a1a);
  color: #ffffff;
  border-color: #444444;
}

.smart-cutout-modal-layout .exclude-btn:hover,
.smart-cutout-modal-layout .exclude-btn.active {
  background: linear-gradient(135deg, #444444, #2c2c2c);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(68, 68, 68, 0.4);
}

/* 确保智能抠图弹窗内的Canvas和覆盖层正确定位 */
.smart-cutout-modal-layout .smart-cutout-canvas,
.smart-cutout-modal-layout .hover-preview-canvas,
.smart-cutout-modal-layout .cutout-result-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  z-index: 5;
}

.smart-cutout-modal-layout .points-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 20;
}

.smart-cutout-header-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 8px;
  border: 2px solid #c8ad7f;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
  width: fit-content;
}

/* 智能抠图时隐藏右侧选项面板，让图片撑满宽度 */
.tool-modal-content:has(.smart-cutout-new-layout) {
  display: block !important;
}

.tool-modal-content:has(.smart-cutout-new-layout) .tool-modal-workspace {
  width: 100% !important;
  flex: none !important;
}

.tool-modal-content:has(.smart-cutout-new-layout) .tool-modal-options {
  display: none !important;
}

/* 智能抠图图片撑满宽度 */
.smart-cutout-container {
  width: 100% !important;
  height: 100% !important;
}

.smart-cutout-image {
  margin: 0 !important;
  padding: 0 !important;
}

.smart-cutout-header-controls .el-button {
  min-width: 100px;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 18px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 智能抠图图片容器样式调整 - 让图片撑满宽度 */
.smart-cutout-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}



/* 工具弹窗内容区域调整 - 智能抠图时隐藏右侧面板 */
.tool-modal-content:has(.smart-cutout-new-layout) {
  display: block;
  height: 70vh;
  position: relative;
}

.tool-modal-content:has(.smart-cutout-new-layout) .tool-modal-workspace {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.tool-modal-content:has(.smart-cutout-new-layout) .tool-modal-options {
  display: none;
  /* 隐藏右侧选项面板 */
}

/* 智能抠图对话框特殊样式 */
.tool-modal:has(.smart-cutout-new-layout) .el-dialog__body {
  padding-top: 60px;
  /* 为顶部按钮留出空间 */

}

/* 确保智能抠图的Canvas和其他元素正确定位 */
.smart-cutout-canvas,
.hover-preview-canvas,
.cutout-result-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.points-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.cutout-help-btn {
  background: linear-gradient(135deg, #17a2b8, #20c997) !important;
  border-color: #17a2b8 !important;
  color: white !important;
}

.cutout-help-btn:hover {
  background: linear-gradient(135deg, #138496, #1e7e34) !important;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(23, 162, 184, 0.3);
}

.cutout-undo-btn {
  background: linear-gradient(135deg, #6c757d, #868e96) !important;
  border-color: #6c757d !important;
  color: white !important;
}

.cutout-undo-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6268, #6c757d) !important;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(108, 117, 125, 0.3);
}

.cutout-clear-btn {
  background: linear-gradient(135deg, #dc3545, #e74c3c) !important;
  border-color: #dc3545 !important;
  color: white !important;
}

.cutout-clear-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c82333, #dc3545) !important;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(220, 53, 69, 0.3);
}

.cutout-confirm-btn {
  background: linear-gradient(135deg, #c8ad7f, #e6c88a) !important;
  border-color: #c8ad7f !important;
  color: white !important;
}

.cutout-confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #b8a070, #d6b87a) !important;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(200, 173, 127, 0.3);
}

.smart-cutout-controls-new .el-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* 智能抠图工具栏样式 */
.smart-cutout-toolbar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex !important;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #c8ad7f;
  border-radius: 8px;
  z-index: 9999;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid #c8ad7f;
  border-radius: 4px;
  color: #c8ad7f;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 32px;
}

.toolbar-btn:hover:not(:disabled) {
  background: rgba(200, 173, 127, 0.1);
  border-color: #e6c88a;
  color: #e6c88a;
  transform: translateY(-1px);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none !important;
}

.toolbar-btn-text {
  font-weight: 600;
}

.toolbar-btn-icon {
  font-weight: 500;
}

.toolbar-btn-icon .el-icon {
  font-size: 14px;
}

/* 智能抠图容器调整，为工具栏留出空间 */
.smart-cutout-container {
  position: relative;
  width: 100%;
  height: 100%;
  padding-top: 80px;
  /* 为工具栏留出更多空间 */
  overflow: visible;
  /* 确保工具栏可见 */
}

/* 智能抠图对话框特殊样式 */
.tool-modal:has(.smart-cutout-container) .el-dialog__body {
  padding-top: 20px;
  /* 为顶部工具栏留出空间 */
  overflow: visible !important;
  overflow: hidden;
  /* 确保工具栏可见 */
}

/* 确保智能抠图工具栏在所有情况下都可见 */
.smart-cutout-container .smart-cutout-toolbar {
  position: absolute !important;
  top: 20px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  z-index: 99999 !important;
  background: rgba(0, 0, 0, 0.9) !important;
  border: 2px solid #c8ad7f !important;
  border-radius: 8px !important;
  padding: 12px 20px !important;
  gap: 8px !important;
  backdrop-filter: blur(10px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  min-height: 50px !important;
  width: auto !important;
}

/* 确保按钮正常显示 */
.smart-cutout-container .toolbar-btn {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  padding: 8px 16px !important;
  background: rgba(0, 0, 0, 0.9) !important;
  border: 1px solid #c8ad7f !important;
  border-radius: 4px !important;
  color: #c8ad7f !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  white-space: nowrap !important;
  min-height: 32px !important;
  min-width: 80px !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.smart-cutout-container .toolbar-btn:hover:not(:disabled) {
  background: rgba(200, 173, 127, 0.1) !important;
  border-color: #e6c88a !important;
  color: #e6c88a !important;
  transform: translateY(-1px) !important;
}

.smart-cutout-container .toolbar-btn:disabled {
  opacity: 0.4 !important;
  cursor: not-allowed !important;
  transform: none !important;
}

.smart-cutout-container .toolbar-btn-text {
  font-weight: 600 !important;
}

.smart-cutout-container .toolbar-btn-icon {
  font-weight: 500 !important;
}

.smart-cutout-container .toolbar-btn-icon .el-icon {
  font-size: 14px !important;
}

.edit-dialog ::v-deep .el-dialog {
  overflow: hidden;
}

/* SAM上传进度弹窗样式 */
.sam-upload-dialog {
  z-index: 9999;
}

.sam-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 280px;
}

.sam-upload-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  gap: 15px;
}

.sam-upload-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.sam-upload-arrow {
  width: 20px;
  height: 20px;
  opacity: 0.6;
  margin: 0 8px;
}

.sam-upload-ai {
  width: 32px;
  height: 32px;
}

.sam-upload-sam {
  width: 32px;
  height: 32px;
}

/* 智能抠图工具栏右对齐 */
.smart-cutout-toolbar-right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

/* 智能抠图专用样式，解决Canvas定位问题 */
.smart-cutout-container {
  position: relative !important;
  overflow: visible !important;
  clip-path: none !important;
  contain: none !important;
}

.smart-cutout-container .smart-cutout-image-container {
  position: relative !important;
  overflow: visible !important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.smart-cutout-container .smart-cutout-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.smart-cutout-container .smart-cutout-canvas {
  position: absolute !important;
  pointer-events: auto !important;
  z-index: 10 !important;
}

/* 确保智能抠图弹窗不受其他样式影响 */
.el-dialog .smart-cutout-modal-layout {
  position: relative !important;
  overflow: visible !important;
  clip-path: none !important;
  contain: none !important;
}

/* 修复Element Plus对话框可能的变形问题 */
.tool-modal .el-dialog {
  transform: none !important;
  scale: none !important;
}

.sam-upload-text {
  font-size: 16px;
  color: #333;
  margin: 20px 0;
  text-align: center;
  font-weight: 500;
}

.sam-progress-container {
  width: 300px;
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin: 20px 0;
}

.sam-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
}

.sam-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}

.sam-cancel-btn {
  margin-top: 30px;
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sam-cancel-btn:hover {
  background: #f5f5f5;
  border-color: #999;
  color: #333;
}


</style>