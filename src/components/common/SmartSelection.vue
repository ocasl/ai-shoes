<template>
  <div>
    <el-dialog 
      :model-value="visible"
      @update:model-value="(val) => emit('update:visible', val)"
      :show-close="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      class="tool-modal"
      destroy-on-close
      width="65%"
      top="12vh"
      @close="handleClose"
      style="margin-left: 12%;"
    >
      <div class="smart-selection-container">
        <div class="smart-selection-header">
            <div class="header-left">
              <el-button class="how-to-button">
                如何选择区域
              </el-button>
            </div>
            <div class="header-controls">
              <!-- <el-button class="control-button back-button" @click="handleUndo">
                <el-icon><ArrowLeft /></el-icon> 撤回
              </el-button>
              <el-button class="control-button delete-button" @click="handleDelete">
              <el-icon><Delete /></el-icon> 删除
            </el-button> -->
              <el-button 
                class="control-button confirm-button" 
                @click="currentMask ? confirmSamSelection() : handleConfirm()"
                :disabled="processingMask"
              >
              {{ currentMask ? '确认选择' : '确定' }}
            </el-button>
          </div>
        </div>

        <div class="smart-selection-content">
          <div class="image-area" ref="imageAreaRef">
            <img 
              v-if="imageUrl" 
              :src="imageUrl" 
              alt="选区图片" 
              class="selection-image"
              ref="imageRef"
              @load="handleImageLoad" 
              crossorigin="anonymous"
            />
            <canvas ref="mergedCanvas" class="merged-canvas" width="1024" height="767"></canvas>
              <!-- 模式提示 -->
              <div class="mode-indicator" v-if="!isDefaultMode">
                <div class="mode-text">
                  {{ selectionMode === 'include' ? '选取模式' : '排除模式' }}
                </div>
            </div>
            
            <!-- 处理状态提示 -->
            <div class="processing-indicator" v-if="processingMask">
              <div class="processing-spinner"></div>
              <div class="processing-text">处理中...</div>
            </div>
          </div>
        </div>

          <div class="smart-selection-footer-wrapper">
            <!-- SAM分割状态显示 -->
            <div v-if="isInitialized" class="sam-status-container">
              <div class="status-title">智能分割已初始化</div>
              <div class="status-info">
                <div class="info-item">
                  <span class="label">任务ID:</span>
                <span class="value">{{ imageId }}</span>
                </div>
                <div class="info-item">
                  <span class="label">候选区域:</span>
                  <span class="value">{{ maskCount }}个</span>
                </div>
                <div class="info-item">
                  <span class="label">图片尺寸:</span>
                  <span class="value">{{ imageSize[0] }} × {{ imageSize[1] }}</span>
                </div>
              </div>
              <div class="instruction-text">
              移动鼠标查看分割区域，点击选择想要的区域
              </div>
            </div>
            
            <!-- 手动选择模式 -->
            <div v-else class="smart-selection-footer">
              <el-button 
                class="selection-button select-button" 
                :class="{ active: !isDefaultMode && selectionMode === 'include' }" 
                @click="setSelectionMode('include')"
              >
            选取
          </el-button>
              <el-button 
                class="selection-button exclude-button" 
                :class="{ active: !isDefaultMode && selectionMode === 'exclude' }" 
                @click="setSelectionMode('exclude')"
              >
            排除
          </el-button>
            </div>
          </div>
        </div>
      </el-dialog>

    <!-- 添加处理中弹窗 -->
    <el-dialog
      :model-value="showProcessingDialog"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :append-to-body="true"
      :modal="true"
      :lock-scroll="true"
      width="400px"
      center
      class="processing-dialog"
    >
      <div class="processing-content">
        <div class="processing-image">
          <img :src="imageUrl" class="thumbnail" alt="处理图片" v-if="imageUrl" />
          <div class="arrow">→</div>
          <div class="ai-icon">
            <el-icon class="processing-icon"><Loading /></el-icon>
          </div>
          <div class="arrow">→</div>
          <div class="result-placeholder"></div>
        </div>
        <div class="processing-text">{{ processingText }}</div>
        <el-progress 
          :percentage="processingProgress" 
          :indeterminate="processingProgress < 100" 
          :duration="2"
          :stroke-width="6"
          :show-text="false"
        ></el-progress>
        <!-- 移除取消按钮 -->
        </div>
      </el-dialog>

      <div style="margin-top: 24px;">
        <input type="file" @change="onFileChange" />
        <!-- <canvas ref="maskCanvas" style="max-width: 100%; border: 1px solid #ccc; margin-top: 16px;"></canvas> -->
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, defineEmits, nextTick, watch } from 'vue';
import { ArrowLeft, Delete, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { debounce } from 'lodash-es';

// 修改掩码信息类型，使用base64格式
interface MaskData {
  base64: string; // base64格式的掩码图像
  size: [number, number]; // [width, height]
  index: number; // 掩码索引
}

interface Props {
  imageUrl: string;
  visible: boolean;
  imageId?: number; 
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'selection-complete', data: { mask: string; selectionType: 'include' | 'exclude'; croppedImage: string }): void;
  (e: 'close'): void;
}>();

// Refs
const imageAreaRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const selectionCanvasRef = ref<HTMLCanvasElement | null>(null);
const selectionContext = ref<CanvasRenderingContext2D | null>(null);

// State
const points = ref<Array<{ x: number; y: number; type: 'include' | 'exclude' }>>([]);
const hasSelection = ref(false);
const selectionHistory = ref<Array<Array<{ x: number; y: number; type: 'include' | 'exclude' }>>>([]);
const isSelecting = ref(false);
const selectionType = ref<'include' | 'exclude'>('include');
const isDefaultMode = ref<boolean>(true);
const selectionMode = ref<'include' | 'exclude'>('include');

// SAM分割相关状态
const isLoading = ref(false);
const currentMask = ref<string | null>(''); // 当前选中的掩码base64
const isInitialized = ref(false);
const allMasks = ref<MaskData[]>([]); // 存储所有掩码数据
const showImageSegmentation = ref(false);
const maskImages = ref<string[]>([]); // 存储所有掩码的base64图像数据
const selectedMaskIndex = ref<number>(-1); // 当前选中的掩码索引
const imageSize = ref<[number, number]>([0, 0]);
const maskCount = ref<number>(0);
const mergedCanvas = ref<HTMLCanvasElement | null>(null);
const canvasScale = ref({ x: 1, y: 1 }); // 用于存储canvas的缩放比例
const lastMasksData = ref<any[]>([]); // 存储最后一次的掩码数据
const highlightedMasks = ref<number[]>([]); // 存储已高亮的掩码索引
const maskContours = ref<Array<{
  maskIndex: number;
  regions: Array<{
    points: Array<{x: number, y: number}>;
    center: {x: number, y: number};
    bounds: {minX: number, minY: number, maxX: number, maxY: number};
  }>;
}>>([]);

const maskCanvas = ref<HTMLCanvasElement | null>(null);
const localImageUrl = ref('');

// 处理中弹窗状态
const showProcessingDialog = ref(false);
const processingText = ref('正在处理图片...');
const processingProgress = ref(0);
const processingTimeout = ref<number | null>(null);

// 添加处理掩码状态
const processingMask = ref(false);

// 鼠标悬停相关状态
const hoverMaskIndex = ref<number>(-1);
const isHovering = ref<boolean>(false);
const lastMousePosition = ref<{x: number, y: number} | null>(null);

// 更新处理进度
const updateProcessingProgress = (text: string, progress: number) => {
  processingText.value = text;
  processingProgress.value = progress;
};

// 处理图像加载事件
const handleImageLoad = () => {
  // 初始化所有画布
  initializeCanvas();
  
  // 延迟一点执行，确保图片已完全加载并渲染
  nextTick(() => {
    adjustCanvas();
    
    // 如果有图像ID，初始化SAM任务
    if (props.imageId) {
      initializeSamTask();
    }
  });
};

// 添加调整canvas尺寸和位置的函数
const adjustCanvas = () => {
  const img = imageRef.value;
  const canvas = mergedCanvas.value;
  const container = imageAreaRef.value;
  
  if (!img || !canvas || !container) return;
  
  // 获取图像的原始尺寸
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  
  console.log('naturalWidth//////////', naturalWidth);
  console.log('naturalHeight-------------', naturalHeight);
  
  // 获取图像显示区域的实际尺寸和位置
  const imgRect = img.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  // 计算图片在容器中的相对位置
  const left = imgRect.left - containerRect.left;
  const top = imgRect.top - containerRect.top;
  
  // 设置canvas的DOM位置与图片完全重叠
  canvas.style.position = 'absolute';
  canvas.style.top = `${top}px`;
  canvas.style.left = `${left}px`;
  canvas.style.width = `${imgRect.width}px`;  // 使用显示图片的宽度
  canvas.style.height = `${imgRect.height}px`;  // 使用显示图片的高度
  canvas.style.pointerEvents = 'auto';
  canvas.style.zIndex = '20';
  canvas.style.cursor = 'pointer';
  
  // 关键修复：设置canvas的逻辑尺寸为图片的原始尺寸
  // 这样可以保持与原始图像相同的坐标系
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  
  // 计算缩放比例，用于后续绘制时的坐标转换
  const scaleX = imgRect.width / naturalWidth;
  const scaleY = imgRect.height / naturalHeight;
  
  // 保存缩放比例，供后续绘制使用
  canvasScale.value = { x: scaleX, y: scaleY };
  
  // 更新图像尺寸状态
  imageSize.value = [naturalWidth, naturalHeight];
  
  console.log('调整Canvas尺寸:', {
    naturalSize: `${naturalWidth}x${naturalHeight}`,
    displaySize: `${imgRect.width}x${imgRect.height}`,
    position: `(${left}, ${top})`,
    scale: `${scaleX}, ${scaleY}`
  });
  
  // 添加点击事件监听器
  canvas.removeEventListener('click', handleCanvasClick); // 先移除旧的监听器，避免重复
  canvas.addEventListener('click', handleCanvasClick);
  
  // 添加右键菜单事件监听器
  canvas.removeEventListener('contextmenu', handleCanvasContextMenu);
  canvas.addEventListener('contextmenu', handleCanvasContextMenu);
};

// 添加处理窗口大小变化的函数，重新调整canvas
const resizeHandler = debounce(() => {
  if (props.visible && imageRef.value) {
    adjustCanvas();
    
    // 如果已经初始化了掩码数据，重新绘制
    if (isInitialized.value && lastMasksData.value.length > 0) {
      nextTick(() => {
        processMasks(lastMasksData.value);
      });
    }
  }
}, 200);

// 添加处理点击canvas的函数来选择掩码
const handleCanvasClick = (event: MouseEvent) => {
  if (!isInitialized.value || !mergedCanvas.value || !imageRef.value) return;
  
  // 获取点击位置相对于canvas的坐标
  const canvas = mergedCanvas.value;
  const img = imageRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 获取图片和掩码的尺寸
  const imgNaturalWidth = img.naturalWidth;
  const imgNaturalHeight = img.naturalHeight;
  
  // 将显示坐标转换为原始图像坐标
  const scale = canvasScale.value;
  const imgX = x / scale.x;
  const imgY = y / scale.y;
  
  console.log('点击坐标:', {
    screen: `(${event.clientX}, ${event.clientY})`,
    relative: `(${x}, ${y})`,
    image: `(${imgX}, ${imgY})`,
    scale: `${scale.x}, ${scale.y}`,
    button: event.button // 0=左键, 2=右键
  });
  
  // 检查点击位置是否在图片范围内
  if (imgX >= 0 && imgX < imgNaturalWidth && imgY >= 0 && imgY < imgNaturalHeight) {
    processingMask.value = true;
    
    // 查找点击位置所在的区域
    let foundMaskIndex = -1;
    let foundRegion = null;
    let minDistance = Infinity;
    
    // 遍历所有存储的轮廓信息
    for (const maskContour of maskContours.value) {
      for (const region of maskContour.regions) {
        // 首先检查点击是否在区域的边界框内
        if (imgX >= region.bounds.minX && imgX <= region.bounds.maxX && 
            imgY >= region.bounds.minY && imgY <= region.bounds.maxY) {
          
          // 如果在边界框内，计算到中心点的距离
          const distance = Math.sqrt(
            Math.pow(imgX - region.center.x, 2) + 
            Math.pow(imgY - region.center.y, 2)
          );
          
          // 检查是否是点在多边形内
          if (isPointInPolygon(imgX, imgY, region.points) && distance < minDistance) {
            minDistance = distance;
            foundMaskIndex = maskContour.maskIndex;
            foundRegion = region;
          }
        }
      }
    }
    
    setTimeout(() => {
      if (foundMaskIndex !== -1 && lastMasksData.value.length > 0) {
        // 根据鼠标按键确定操作类型
        const isRightClick = event.button === 2; // 右键
        const operationType = isRightClick ? 'exclude' : 'include';
        
        if (isRightClick) {
          // 右键点击 - 排除模式
          // 从高亮掩码列表中移除该区域
          const index = highlightedMasks.value.indexOf(foundMaskIndex);
          if (index > -1) {
            highlightedMasks.value.splice(index, 1);
            ElMessage.success(`已排除区域 ${foundMaskIndex + 1}`);
          } else {
            ElMessage.info('该区域未被选中，无法排除');
          }
        } else {
          // 左键点击 - 包含模式
          // 添加到高亮掩码列表
          if (!highlightedMasks.value.includes(foundMaskIndex)) {
            highlightedMasks.value.push(foundMaskIndex);
            ElMessage.success(`已选择区域 ${foundMaskIndex + 1}`);
          } else {
            ElMessage.info('该区域已被选中');
          }
        }
        
        // 重新绘制掩码，高亮选中的区域
        redrawMasksWithHighlight();
        
        processingMask.value = false;
      } else {
        processingMask.value = false;
        ElMessage.info('未找到有效选区，请点击区域轮廓');
      }
    }, 300);
  } else {
    ElMessage.info('点击位置超出图片范围');
  }
};

// 添加右键菜单阻止默认行为
const handleCanvasContextMenu = (event: MouseEvent) => {
  event.preventDefault(); // 阻止默认右键菜单
  return false;
};

// 添加检查点是否在多边形内的辅助函数
const isPointInPolygon = (x: number, y: number, polygon: Array<{x: number, y: number}>): boolean => {
  // 射线法判断点是否在多边形内
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) && 
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
};

// 添加处理和绘制所有掩码轮廓的函数
const processMasks = (masks: any[]) => {
  const canvas = mergedCanvas.value;
  const img = imageRef.value;
  if (!canvas || !img) return;
  
  // 确保canvas上下文
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
    
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 清除之前存储的轮廓信息
  maskContours.value = [];
  
  // 追踪已加载的掩码数量
  let loadedCount = 0;
  const totalMasks = masks.length;
  
  // 获取图片的原始尺寸
  const imgNaturalWidth = img.naturalWidth;
  const imgNaturalHeight = img.naturalHeight;
  
  console.log('处理掩码，图片原始尺寸:', imgNaturalWidth, imgNaturalHeight);
  
  // 处理每个掩码
  masks.forEach((maskData, index) => {
    // 获取base64数据
    const base64Data = typeof maskData === 'string' 
      ? maskData 
      : maskData.base64 || maskData.data || '';
    
    if (!base64Data) {
      loadedCount++;
      return;
    }
    
    // 创建一个对象存储当前掩码的轮廓信息
    const maskContour = {
      maskIndex: index,
      regions: [] as Array<{
        points: Array<{x: number, y: number}>;
        center: {x: number, y: number};
        bounds: {minX: number, minY: number, maxX: number, maxY: number};
      }>
    };
    
    // 创建图像对象
    const maskImg = new Image();
    maskImg.onload = () => {
      // 获取掩码图像的尺寸
      const maskWidth = maskImg.width;
      const maskHeight = maskImg.height;
      
      console.log(`掩码 ${index} 尺寸:`, maskWidth, maskHeight);
      
      // 创建临时canvas处理掩码
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskWidth;
      tempCanvas.height = maskHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        loadedCount++;
        return;
      }
      
      // 绘制掩码到临时画布
      tempCtx.drawImage(maskImg, 0, 0);
      
      // 获取像素数据
      const imageData = tempCtx.getImageData(0, 0, maskWidth, maskHeight);
      const data = imageData.data;
      
      // 计算掩码与原始图像之间的缩放比例
      const maskToImgScaleX = imgNaturalWidth / maskWidth;
      const maskToImgScaleY = imgNaturalHeight / maskHeight;
      
      console.log(`掩码到图片的缩放比例: X=${maskToImgScaleX}, Y=${maskToImgScaleY}`);
      
      // 创建二维数组标记已访问像素
      const visited = Array(maskHeight).fill(0).map(() => Array(maskWidth).fill(false));
      
      // 区域计数，用于区分不同的连通区域
      let regionCount = 0;
      
      // 查找所有白色区域
      for (let y = 0; y < maskHeight; y++) {
        for (let x = 0; x < maskWidth; x++) {
          if (visited[y][x]) continue;
          
          const i = (y * maskWidth + x) * 4;
          // 检查是否是白色像素
          if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) {
            // 找到一个白色区域，使用BFS搜索这个区域的所有点
            const regionPoints: Array<{x: number, y: number}> = [];
            const queue: Array<{x: number, y: number}> = [{x, y}];
            visited[y][x] = true;
            
            // 用于计算区域边界框
            let minX = x, minY = y, maxX = x, maxY = y;
            
            while (queue.length > 0) {
              const p = queue.shift()!;
              regionPoints.push(p);
              
              // 更新边界框
              minX = Math.min(minX, p.x);
              minY = Math.min(minY, p.y);
              maxX = Math.max(maxX, p.x);
              maxY = Math.max(maxY, p.y);
              
              // 检查四个方向
              const directions = [
                {dx: -1, dy: 0}, // 左
                {dx: 1, dy: 0},  // 右
                {dx: 0, dy: -1}, // 上
                {dx: 0, dy: 1}   // 下
              ];
              
              for (const dir of directions) {
                const nx = p.x + dir.dx;
                const ny = p.y + dir.dy;
                
                // 检查边界
                if (nx < 0 || ny < 0 || nx >= maskWidth || ny >= maskHeight) continue;
                if (visited[ny][nx]) continue;
                
                // 检查是否是白色像素
                const ni = (ny * maskWidth + nx) * 4;
                if (data[ni] > 200 && data[ni+1] > 200 && data[ni+2] > 200) {
                  queue.push({x: nx, y: ny});
                  visited[ny][nx] = true;
                }
              }
            }
            
            // 找到该区域的边界点
            const contourPoints: Array<{x: number, y: number}> = [];
            
            for (const point of regionPoints) {
              // 检查周围是否有黑色像素，如果有，则是边界点
              const px = point.x;
              const py = point.y;
              
              // 检查八个方向
              let isBoundary = false;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  
                  const nx = px + dx;
                  const ny = py + dy;
                  
                  if (nx < 0 || ny < 0 || nx >= maskWidth || ny >= maskHeight) {
                    isBoundary = true;
                    continue;
                  }
                  
                  const ni = (ny * maskWidth + nx) * 4;
                  if (data[ni] < 50) { // 黑色像素
                    isBoundary = true;
                    break;
                  }
                }
                if (isBoundary) break;
              }
              
              if (isBoundary) {
                contourPoints.push(point);
              }
            }
            
            // 如果轮廓点数量足够，处理轮廓
            if (contourPoints.length > 10) {
              // 计算轮廓的中心点
              let centerX = 0;
              let centerY = 0;
              contourPoints.forEach(point => {
                centerX += point.x;
                centerY += point.y;
              });
              centerX = Math.floor(centerX / contourPoints.length);
              centerY = Math.floor(centerY / contourPoints.length);
              
              // 使用更简化的方法绘制轮廓
              // 将点按照角度排序
              const sortedPoints = sortPointsByAngle(contourPoints, {x: centerX, y: centerY});
              
              // 注意：移除了绘制轮廓线和数字标记的代码
              // 只保存轮廓信息，不在画布上绘制可见的轮廓线
              
              // 存储区域轮廓信息
              // 转换轮廓点到原始图像坐标
              const imagePoints = sortedPoints.map(point => ({
                x: point.x * maskToImgScaleX,
                y: point.y * maskToImgScaleY
              }));
              
              // 存储轮廓信息
              maskContour.regions.push({
                points: imagePoints,
                center: {
                  x: centerX * maskToImgScaleX,
                  y: centerY * maskToImgScaleY
                },
                bounds: {
                  minX: minX * maskToImgScaleX,
                  minY: minY * maskToImgScaleY,
                  maxX: maxX * maskToImgScaleX,
                  maxY: maxY * maskToImgScaleY
                }
              });
              
              // 区域计数递增
              regionCount++;
            }
          }
        }
      }
      
      // 保存该掩码的轮廓信息
      if (maskContour.regions.length > 0) {
        maskContours.value.push(maskContour);
      }
      
      // 增加加载计数
      loadedCount++;
      
      // 当所有掩码都处理完毕，打印信息
      if (loadedCount === totalMasks) {
        console.log('所有掩码轮廓处理完成', maskContours.value);
      }
    };
    
    // 设置图像源
    maskImg.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
    
    // 添加错误处理
    maskImg.onerror = (err) => {
      console.error(`掩码 ${index} 加载失败:`, err);
      loadedCount++;
    };
  });
};

// 辅助函数：按角度排序点，用于轮廓绘制
const sortPointsByAngle = (points: Array<{x: number, y: number}>, center: {x: number, y: number}) => {
  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
};

// 初始化SAM分割任务
const initializeSamTask = async () => {
  if (!props.imageId) {
    ElMessage.warning('缺少图片ID，无法进行智能分割');
    return;
  }
  
  try {
    isLoading.value = true;
    
    // 重置状态
    maskImages.value = [];
    selectedMaskIndex.value = -1;
    hoverMaskIndex.value = -1;
    currentMask.value = null;
    
    // 显示处理中弹窗
    showProcessingDialog.value = true;
    updateProcessingProgress('正在提取图像特征...', 10);
    
    console.log('调用分割API，图片ID:', props.imageId);
    
    // 延迟一点，模拟进度
    await new Promise(resolve => {
      processingTimeout.value = setTimeout(() => {
        updateProcessingProgress('正在进行智能分割...', 30);
        resolve(true);
      }, 800) as unknown as number;
    });
    
    // 调用segment接口获取分割结果
    const segmentResponse = await fetch('/api/sam/segment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `imageId=${props.imageId}`
    });
    
    updateProcessingProgress('正在处理分割结果...', 60);
    
    console.log('API响应状态:', segmentResponse);
    const result = await segmentResponse.json();
    console.log('API返回数据:', result);
    
    // 检查API返回结果
    if (result.code !== 200) {
      throw new Error(result.msg || '获取分割结果失败');
    }
    
    updateProcessingProgress('正在提取掩码轮廓...', 80);
    
    // 处理掩码数据
    const masksData = result.data.masks || [];
    
    // 获取图像尺寸
    if (result.data.size) {
      imageSize.value = result.data.size;
    } else if (imageRef.value) {
      // 从图像元素获取
      imageSize.value = [imageRef.value.naturalWidth, imageRef.value.naturalHeight];
    }
    
    // 记录掩码数量
    maskCount.value = masksData.length;
    console.log(`共获取到 ${maskCount.value} 个掩码`);
    console.log('图像尺寸:', imageSize.value);
    
    // 确保canvas已经正确调整尺寸和位置
    adjustCanvas();
    
    // 保存掩码数据，以便窗口大小变化时重新绘制
    lastMasksData.value = masksData;
    
    // 处理掩码数据，但不绘制到画布上，只是解析和存储轮廓信息
    nextTick(() => {
      prepareMaskData(masksData);
    });
    
    updateProcessingProgress('正在提取掩码轮廓...', 90);
    
    // 延迟关闭弹窗，让用户看到完成状态
    await new Promise(resolve => {
      processingTimeout.value = setTimeout(() => {
        showProcessingDialog.value = false;
        resolve(true);
      }, 500) as unknown as number;
    });
    
    // 初始化完成，可以开始响应用户操作
    isInitialized.value = true;
    ElMessage.success(`智能分割完成，共${maskCount.value}个区域，点击图片选择区域...`);
    
  } catch (error) {
    console.error('SAM初始化失败:', error);
    ElMessage.error('智能分割失败，请重试');
    showProcessingDialog.value = false;
  } finally {
    isLoading.value = false;
  }
};

// 添加一个新函数，只解析掩码数据但不绘制
const prepareMaskData = (masks: any[]) => {
  const img = imageRef.value;
  if (!img) return;
  
  // 清除之前存储的轮廓信息
  maskContours.value = [];
  
  // 追踪已加载的掩码数量
  let loadedCount = 0;
  const totalMasks = masks.length;
  
  // 获取图片的原始尺寸
  const imgNaturalWidth = img.naturalWidth;
  const imgNaturalHeight = img.naturalHeight;
  
  console.log('解析掩码，图片原始尺寸:', imgNaturalWidth, imgNaturalHeight);
  
  // 处理每个掩码
  masks.forEach((maskData, index) => {
    // 获取base64数据
    const base64Data = typeof maskData === 'string' 
      ? maskData 
      : maskData.base64 || maskData.data || '';
    
    if (!base64Data) {
      loadedCount++;
      return;
    }
    
    // 创建一个对象存储当前掩码的轮廓信息
    const maskContour = {
      maskIndex: index,
      regions: [] as Array<{
        points: Array<{x: number, y: number}>;
        center: {x: number, y: number};
        bounds: {minX: number, minY: number, maxX: number, maxY: number};
      }>
    };
    
    // 创建图像对象
    const maskImg = new Image();
    maskImg.onload = () => {
      // 获取掩码图像的尺寸
      const maskWidth = maskImg.width;
      const maskHeight = maskImg.height;
      
      console.log(`掩码 ${index} 尺寸:`, maskWidth, maskHeight);
      
      // 创建临时canvas处理掩码
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskWidth;
      tempCanvas.height = maskHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        loadedCount++;
        return;
      }
      
      // 绘制掩码到临时画布
      tempCtx.drawImage(maskImg, 0, 0);
      
      // 获取像素数据
      const imageData = tempCtx.getImageData(0, 0, maskWidth, maskHeight);
      const data = imageData.data;
      
      // 计算掩码与原始图像之间的缩放比例
      const maskToImgScaleX = imgNaturalWidth / maskWidth;
      const maskToImgScaleY = imgNaturalHeight / maskHeight;
      
      console.log(`掩码到图片的缩放比例: X=${maskToImgScaleX}, Y=${maskToImgScaleY}`);
      
      // 区域计数，用于区分不同的连通区域
      let regionCount = 0;
      
      // 创建二维数组标记已访问像素
      const visited = Array(maskHeight).fill(0).map(() => Array(maskWidth).fill(false));
      
      // 查找所有白色区域
      for (let y = 0; y < maskHeight; y++) {
        for (let x = 0; x < maskWidth; x++) {
          if (visited[y][x]) continue;
          
          const i = (y * maskWidth + x) * 4;
          // 检查是否是白色像素
          if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) {
            // 找到一个白色区域，使用BFS搜索这个区域的所有点
            const regionPoints: Array<{x: number, y: number}> = [];
            const queue: Array<{x: number, y: number}> = [{x, y}];
            visited[y][x] = true;
            
            // 用于计算区域边界框
            let minX = x, minY = y, maxX = x, maxY = y;
            
            while (queue.length > 0) {
              const p = queue.shift()!;
              regionPoints.push(p);
              
              // 更新边界框
              minX = Math.min(minX, p.x);
              minY = Math.min(minY, p.y);
              maxX = Math.max(maxX, p.x);
              maxY = Math.max(maxY, p.y);
              
              // 检查四个方向
              const directions = [
                {dx: -1, dy: 0}, // 左
                {dx: 1, dy: 0},  // 右
                {dx: 0, dy: -1}, // 上
                {dx: 0, dy: 1}   // 下
              ];
              
              for (const dir of directions) {
                const nx = p.x + dir.dx;
                const ny = p.y + dir.dy;
                
                // 检查边界
                if (nx < 0 || ny < 0 || nx >= maskWidth || ny >= maskHeight) continue;
                if (visited[ny][nx]) continue;
                
                // 检查是否是白色像素
                const ni = (ny * maskWidth + nx) * 4;
                if (data[ni] > 200 && data[ni+1] > 200 && data[ni+2] > 200) {
                  queue.push({x: nx, y: ny});
                  visited[ny][nx] = true;
                }
              }
            }
            
            // 找到该区域的边界点
            const contourPoints: Array<{x: number, y: number}> = [];
            
            for (const point of regionPoints) {
              // 检查周围是否有黑色像素，如果有，则是边界点
              const px = point.x;
              const py = point.y;
              
              // 检查八个方向
              let isBoundary = false;
              for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                  if (dx === 0 && dy === 0) continue;
                  
                  const nx = px + dx;
                  const ny = py + dy;
                  
                  if (nx < 0 || ny < 0 || nx >= maskWidth || ny >= maskHeight) {
                    isBoundary = true;
                    continue;
                  }
                  
                  const ni = (ny * maskWidth + nx) * 4;
                  if (data[ni] < 50) { // 黑色像素
                    isBoundary = true;
                    break;
                  }
                }
                if (isBoundary) break;
              }
              
              if (isBoundary) {
                contourPoints.push(point);
              }
            }
            
            // 如果轮廓点数量足够，处理轮廓
            if (contourPoints.length > 10) {
              // 计算轮廓的中心点
              let centerX = 0;
              let centerY = 0;
              contourPoints.forEach(point => {
                centerX += point.x;
                centerY += point.y;
              });
              centerX = Math.floor(centerX / contourPoints.length);
              centerY = Math.floor(centerY / contourPoints.length);
              
              // 使用更简化的方法绘制轮廓
              // 将点按照角度排序
              const sortedPoints = sortPointsByAngle(contourPoints, {x: centerX, y: centerY});
              
              // 注意：移除了绘制轮廓线和数字标记的代码
              // 只保存轮廓信息，不在画布上绘制可见的轮廓线
              
              // 存储区域轮廓信息
              // 转换轮廓点到原始图像坐标
              const imagePoints = sortedPoints.map(point => ({
                x: point.x * maskToImgScaleX,
                y: point.y * maskToImgScaleY
              }));
              
              // 存储轮廓信息
              maskContour.regions.push({
                points: imagePoints,
                center: {
                  x: centerX * maskToImgScaleX,
                  y: centerY * maskToImgScaleY
                },
                bounds: {
                  minX: minX * maskToImgScaleX,
                  minY: minY * maskToImgScaleY,
                  maxX: maxX * maskToImgScaleX,
                  maxY: maxY * maskToImgScaleY
                }
              });
              
              // 区域计数递增
              regionCount++;
            }
          }
        }
      }
      
      // 保存该掩码的轮廓信息
      if (maskContour.regions.length > 0) {
        maskContours.value.push(maskContour);
      }
      
      // 增加加载计数
      loadedCount++;
      
      // 当所有掩码都处理完毕，打印信息并绘制轮廓
      if (loadedCount === totalMasks) {
        console.log('所有掩码轮廓解析完成', maskContours.value);
        // 解析完成后，绘制轮廓
        processMasks(lastMasksData.value);
      }
    };
    
    // 设置图像源，确保正确处理base64字符串
    try {
      if (base64Data) {
        maskImg.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
          }
        } catch (err) {
      console.error(`掩码 ${index} 设置源失败:`, err);
      loadedCount++;
    }
    
    // 添加错误处理
    maskImg.onerror = (err) => {
      console.error(`掩码 ${index} 加载失败:`, err);
      loadedCount++;
    };
  });
};

onMounted(() => {
  console.log('组件已挂载, imageId:', props.imageId);
  
  // 添加窗口大小变化事件监听
  window.addEventListener('resize', resizeHandler);
});

// 在组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler);
  
  // 清理掩码处理相关资源
  if (mergedCanvas.value) {
    mergedCanvas.value.removeEventListener('click', handleCanvasClick);
    mergedCanvas.value.removeEventListener('contextmenu', handleCanvasContextMenu);
  }
  
  // 清理定时器
  if (processingTimeout.value) {
    clearTimeout(processingTimeout.value);
  }
});

// 添加文件上传测试功能
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  const reader = new FileReader();
  
  reader.onload = (e) => {
    if (!e.target || typeof e.target.result !== 'string') return;
    
    // 测试解码掩码
  const img = new Image();
  img.onload = () => {
      if (!maskCanvas.value) return;
      
      const ctx = maskCanvas.value.getContext('2d');
      if (!ctx) return;
      
      // 设置canvas尺寸
      maskCanvas.value.width = img.width;
      maskCanvas.value.height = img.height;
      
      // 绘制图像
    ctx.drawImage(img, 0, 0);
    };
    
    img.src = localImageUrl.value;
  };
  
  reader.readAsDataURL(file);
};

// 确保图像在canvas中居中显示
const initializeCanvas = () => {
  const canvas = selectionCanvasRef.value;
  const image = imageRef.value;
  const container = imageAreaRef.value;
  const mergedCanvasElem = mergedCanvas.value;
  
  if (!image || !container) return;
  
  // 等待图像完全渲染
  nextTick(() => {
    // 获取图像的实际显示尺寸和位置
    const imgRect = image.getBoundingClientRect();
    
    // 初始化选择画布（如果存在）
    if (canvas) {
      // 设置选择画布尺寸以匹配图像显示尺寸
    canvas.width = imgRect.width;
    canvas.height = imgRect.height;
    
      // 定位选择画布与图像完美重叠
    canvas.style.position = 'absolute';
    canvas.style.top = `${imgRect.top - container.getBoundingClientRect().top}px`;
    canvas.style.left = `${imgRect.left - container.getBoundingClientRect().left}px`;
    canvas.style.pointerEvents = 'auto';
    canvas.style.zIndex = '10';
    
      // 获取画布上下文
    const ctx = canvas.getContext('2d');
    if (ctx) {
      selectionContext.value = ctx;
        // 清除画布
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    }
    
    // 如果存在合并画布元素，也进行初始化
    if (mergedCanvasElem) {
      // 调整合并画布的位置和尺寸
      adjustCanvas();
    }
  });
};

// 添加重新绘制掩码的函数，高亮选中的区域
const redrawMasksWithHighlight = () => {
  const canvas = mergedCanvas.value;
  const img = imageRef.value;
  if (!canvas || !img) return;
  
  // 确保canvas上下文
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  
  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 如果没有高亮的掩码，直接返回，不绘制任何内容
  if (highlightedMasks.value.length === 0) {
        return;
  }
  
  // 获取图片的原始尺寸
  const imgNaturalWidth = img.naturalWidth;
  const imgNaturalHeight = img.naturalHeight;
  
  // 首先绘制半透明蒙层覆盖整个图片
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, imgNaturalWidth, imgNaturalHeight);
  
  // 处理每个高亮的掩码
  highlightedMasks.value.forEach(maskIndex => {
    if (maskIndex < 0 || maskIndex >= lastMasksData.value.length) return;
    
    const maskData = lastMasksData.value[maskIndex];
    const base64Data = typeof maskData === 'string' 
      ? maskData 
      : maskData.base64 || maskData.data || '';
    
    if (!base64Data) return;
    
    // 创建图像对象
  const maskImg = new Image();
  maskImg.onload = () => {
      // 获取掩码图像的尺寸
      const maskWidth = maskImg.width;
      const maskHeight = maskImg.height;
    
      // 创建临时canvas处理掩码
    const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskWidth;
      tempCanvas.height = maskHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    
    // 绘制掩码到临时画布
      tempCtx.drawImage(maskImg, 0, 0);
      
      // 获取像素数据
      const imageData = tempCtx.getImageData(0, 0, maskWidth, maskHeight);
      const data = imageData.data;
      
      // 计算掩码与原始图像之间的缩放比例
      const maskToImgScaleX = imgNaturalWidth / maskWidth;
      const maskToImgScaleY = imgNaturalHeight / maskHeight;
      
      // 创建一个新的canvas用于绘制高亮区域
      const highlightCanvas = document.createElement('canvas');
      highlightCanvas.width = imgNaturalWidth;
      highlightCanvas.height = imgNaturalHeight;
      const highlightCtx = highlightCanvas.getContext('2d');
      if (!highlightCtx) return;
      
      // 绘制高亮区域
      highlightCtx.fillStyle = 'rgba(255, 255, 255, 1)'; // 白色，用于清除蒙层
      
      // 查找对应的掩码轮廓信息
      const maskContour = maskContours.value.find(mc => mc.maskIndex === maskIndex);
      if (maskContour && maskContour.regions.length > 0) {
        // 使用轮廓信息直接绘制整个区域，而不是遍历像素
        for (const region of maskContour.regions) {
          if (region.points.length < 3) continue; // 至少需要3个点形成一个多边形
          
          highlightCtx.beginPath();
          highlightCtx.moveTo(region.points[0].x, region.points[0].y);
          for (let i = 1; i < region.points.length; i++) {
            highlightCtx.lineTo(region.points[i].x, region.points[i].y);
          }
          highlightCtx.closePath();
          highlightCtx.fill();
      }
    } else {
        // 如果没有找到轮廓信息，回退到像素遍历的方式
        for (let y = 0; y < maskHeight; y++) {
          for (let x = 0; x < maskWidth; x++) {
            const i = (y * maskWidth + x) * 4;
            // 检查是否是白色像素
            if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) {
              // 将掩码坐标转换为原始图像坐标
              const imgX = Math.floor(x * maskToImgScaleX);
              const imgY = Math.floor(y * maskToImgScaleY);
              
              // 在高亮canvas上绘制像素
              highlightCtx.fillRect(imgX, imgY, 1, 1);
            }
          }
        }
      }
      
      // 使用destination-out合成模式，将高亮区域从蒙层中清除
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(highlightCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    };
    
    // 设置图像源
    maskImg.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
  });
};

// 此函数已被移除，不再绘制轮廓线

// 添加清除高亮选区的函数
const clearHighlightedMasks = () => {
  highlightedMasks.value = [];
  if (lastMasksData.value.length > 0) {
    processMasks(lastMasksData.value);
  }
};

// 添加一个测试函数，直接生成高亮区域的base64图片
const generateMaskImage = () => {
  if (highlightedMasks.value.length === 0) {
    ElMessage.warning('请先选择至少一个区域');
    return null;
  }
  
  try {
    // 创建离屏canvas来生成抠图
    const canvas = document.createElement('canvas');
    const img = imageRef.value;
    if (!img) {
      throw new Error('图片未加载');
    }
    
    // 设置canvas尺寸为图片原始尺寸
    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;
    canvas.width = imgNaturalWidth;
    canvas.height = imgNaturalHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }
    
    // 绘制原始图片
    ctx.drawImage(img, 0, 0, imgNaturalWidth, imgNaturalHeight);
    
    // 创建用于抠图的临时canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = imgNaturalWidth;
    maskCanvas.height = imgNaturalHeight;
    
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) {
      throw new Error('无法创建掩码画布上下文');
    }
    
    // 创建黑色背景
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, imgNaturalWidth, imgNaturalHeight);
    
    // 对每个高亮的区域，在掩码上绘制白色
    for (const maskIndex of highlightedMasks.value) {
      const maskContour = maskContours.value.find(mc => mc.maskIndex === maskIndex);
      if (!maskContour) continue;
      
      // 对该掩码的每个区域绘制白色
      for (const region of maskContour.regions) {
        if (region.points.length < 3) continue;
        
        maskCtx.fillStyle = 'white';
        maskCtx.beginPath();
        maskCtx.moveTo(region.points[0].x, region.points[0].y);
        
        for (let i = 1; i < region.points.length; i++) {
          maskCtx.lineTo(region.points[i].x, region.points[i].y);
        }
        
        maskCtx.closePath();
        maskCtx.fill();
      }
    }
    
    // 获取掩码图像数据
    const maskData = maskCtx.getImageData(0, 0, imgNaturalWidth, imgNaturalHeight);
    const maskPixels = maskData.data;
    
    // 获取原始图像数据
    const imgData = ctx.getImageData(0, 0, imgNaturalWidth, imgNaturalHeight);
    const imgPixels = imgData.data;
    
    // 应用掩码：保留白色区域，其他区域设为透明
    for (let i = 0; i < maskPixels.length; i += 4) {
      // 检查掩码像素是否为黑色（非选区）
      if (maskPixels[i] < 128) {
        // 设置为透明
        imgPixels[i + 3] = 0;
      }
    }
    
    // 将处理后的图像数据放回canvas
    ctx.putImageData(imgData, 0, 0);
    
    // 转换为base64图像
    const croppedImageBase64 = canvas.toDataURL('image/png');
    
    // 打印base64图像数据
    console.log('抠图结果 (base64):', croppedImageBase64);
    
    return croppedImageBase64;
  } catch (error) {
    console.error('抠图过程中出错:', error);
    return null;
  }
};

// 修改确认SAM选择的函数，使用新的测试函数
const confirmSamSelection = () => {
  processingMask.value = true;
  
  // 生成抠图结果
  const croppedImageBase64 = generateMaskImage();
  
  if (croppedImageBase64) {
    // 发送选择完成事件，包含抠图结果
    emit('selection-complete', {
      mask: currentMask.value || '',
      selectionType: selectionMode.value,
      croppedImage: croppedImageBase64
    });
    
    // 关闭对话框
    emit('update:visible', false);
    ElMessage.success('已完成区域选择和抠图');
  } else {
    ElMessage.error('抠图失败，请重试');
  }
  
  processingMask.value = false;
};
// 添加设置选择模式的函数
const setSelectionMode = (mode: 'include' | 'exclude') => {
  selectionMode.value = mode;
  isDefaultMode.value = false;
};

// 添加处理确认的函数
const handleConfirm = () => {
  if (highlightedMasks.value.length === 0) {
    ElMessage.warning('请先选择至少一个区域');
    return;
  }
  
  // 调用确认选择
  confirmSamSelection();
};

const handleClose = () => {
  emit('close');
};

// 在 <script setup> 末尾添加：
defineExpose({
  // 这里可以暴露需要给父组件调用的属性或方法
});
</script>

<style scoped>
.smart-selection-container {
  display: flex;
  flex-direction: column;
  height: 80vh;
  overflow: hidden;
}

.smart-selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  margin-bottom: 10px;
}

.header-left {
  display: flex;
  align-items: center;
}

.how-to-button {
  background-color: #f0f9ff;
  border-color: #d0e8ff;
  color: #409eff;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.control-button {
  min-width: 80px;
}

.back-button {
  background-color: #f4f4f5;
  border-color: #e4e7ed;
  color: #606266;
}

.delete-button {
  background-color: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}

.confirm-button {
  background-color: #409eff;
  border-color: #409eff;
  color: #ffffff;
}

.smart-selection-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.image-area {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.selection-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.selection-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  z-index: 10;
}

.merged-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 20;
  cursor: pointer;
}

.segmentation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 15;
}

.smart-selection-footer-wrapper {
  padding: 15px 0;
}

.smart-selection-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.selection-button {
  min-width: 100px;
  font-weight: bold;
}

.select-button {
  background-color: #ecf5ff;
  border-color: #d9ecff;
  color: #409eff;
}

.exclude-button {
  background-color: #fef0f0;
  border-color: #fde2e2;
  color: #f56c6c;
}

.selection-button.active {
  font-weight: bold;
  transform: scale(1.05);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.mode-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 20;
}

.processing-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 30;
}

.processing-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #ffffff;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.processing-text {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 处理中弹窗样式 */
.processing-dialog {
  text-align: center;
}

.processing-content {
  padding: 20px;
}

.processing-image {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.arrow {
  margin: 0 10px;
  font-size: 20px;
  color: #909399;
}

.ai-icon {
  width: 60px;
  height: 60px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.processing-icon {
  font-size: 30px;
  color: white;
  animation: spin 2s linear infinite;
}

.result-placeholder {
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

/* SAM分割状态显示样式 */
.sam-status-container {
  background-color: #f0f9ff;
  border-radius: 4px;
  padding: 10px 15px;
  margin-top: 10px;
}

.status-title {
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.status-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
}

.label {
  color: #606266;
  margin-right: 5px;
}

.value {
  font-weight: bold;
  color: #303133;
}

.instruction-text {
  font-size: 14px;
  color: #606266;
  font-style: italic;
}

.debug-button {
  margin-left: auto;
}
</style>