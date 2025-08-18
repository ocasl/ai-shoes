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
      width="1200px"
      top="5vh"
      @close="handleClose"
    >
      <div class="smart-selection-container">
        <div class="smart-selection-header">
          <div class="header-left">
            <el-button class="how-to-button">
              智能抠图 - 点击选择区域
            </el-button>
          </div>
          <div class="header-controls">
            <el-button 
              class="control-button confirm-button" 
              @click="confirmSelection"
              :disabled="processingMask || selectedMasks.length === 0"
            >
              确认选择 ({{ selectedMasks.length }})
            </el-button>
          </div>
        </div>

        <div class="smart-selection-content">
          <div class="image-area">
            <canvas 
              ref="smartCutoutCanvas" 
              class="smart-cutout-canvas" 
              width="1024" 
              height="1024"
              @click="handleCanvasClick"
              @mousemove="handleCanvasMouseMove"
              @mouseleave="handleCanvasMouseLeave"
            ></canvas>
            
            <!-- 处理状态提示 -->
            <div class="processing-indicator" v-if="processingMask">
              <div class="processing-spinner"></div>
              <div class="processing-text">处理中...</div>
            </div>
          </div>
        </div>

        <div class="smart-selection-footer">
          <!-- SAM分割状态显示 -->
          <div v-if="isInitialized" class="sam-status-container">
            <div class="status-title">智能分割已完成</div>
            <div class="status-info">
              <div class="info-item">
                <span class="label">候选区域:</span>
                <span class="value">{{ maskCount }}个</span>
              </div>
              <div class="info-item">
                <span class="label">已选择:</span>
                <span class="value">{{ selectedMasks.length }}个</span>
              </div>
            </div>
            <div class="instruction-text">
              点击选择想要的区域，右键取消选择
            </div>
          </div>
          
          <!-- 初始化状态 -->
          <div v-else class="initialization-status">
            <div class="status-text">正在初始化智能分割...</div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 处理中弹窗 -->
    <el-dialog
      :model-value="showProcessingDialog"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="400px"
      center
      class="processing-dialog"
    >
      <div class="processing-content">
        <div class="processing-text">{{ processingText }}</div>
        <el-progress 
          :percentage="processingProgress" 
          :indeterminate="processingProgress < 100" 
          :duration="2"
          :stroke-width="6"
          :show-text="false"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineProps, defineEmits, nextTick, watch } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { imageToBase64, create1024Canvas } from '../../utils/imageUtils';
import request from '../../utils/request';

interface Props {
  imageUrl: string;
  visible: boolean;
  imageId?: number; 
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'selection-complete', data: { mask: string; croppedImage: string }): void;
  (e: 'close'): void;
}>();

// Refs
const smartCutoutCanvas = ref<HTMLCanvasElement | null>(null);

// 状态管理
const isInitialized = ref(false);
const processingMask = ref(false);
const maskCount = ref(0);
const selectedMasks = ref<number[]>([]);
const maskContours = ref<Array<{
  maskIndex: number;
  regions: Array<{
    points: Array<{x: number, y: number}>;
    center: {x: number, y: number};
    bounds: {minX: number, minY: number, maxX: number, maxY: number};
  }>;
}>>([]);

// 处理中弹窗状态
const showProcessingDialog = ref(false);
const processingText = ref('正在处理图片...');
const processingProgress = ref(0);

// 组件挂载时初始化
onMounted(() => {
  if (props.visible) {
    initializeSmartCutout();
  }
});

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initializeSmartCutout();
  }
});

// 初始化智能抠图
const initializeSmartCutout = async () => {
  await nextTick();
  await initCanvas();
  if (props.imageId) {
    await initializeSamTask();
  }
};

// 初始化1024x1024的canvas
const initCanvas = async () => {
  const canvas = smartCutoutCanvas.value;
  if (!canvas) return;
  
  // 统一使用1024x1024尺寸
  canvas.width = 1024;
  canvas.height = 1024;
  canvas.style.width = '1024px';
  canvas.style.height = '1024px';
  canvas.style.cursor = 'crosshair';
  
  // 加载并绘制1024x1024的图片
  if (props.imageUrl) {
    await loadAndDrawImage(props.imageUrl);
  }
};

// 加载图片并绘制到1024x1024的canvas上
const loadAndDrawImage = (imageUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = smartCutoutCanvas.value;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        reject(new Error('Canvas未初始化'));
        return;
      }
      
      // 清除画布
      ctx.clearRect(0, 0, 1024, 1024);
      
      // 将图片绘制到1024x1024的canvas上
      ctx.drawImage(img, 0, 0, 1024, 1024);
      
      console.log('图片已加载并绘制到1024x1024 canvas');
      resolve();
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// 初始化SAM分割任务
const initializeSamTask = async () => {
  if (!props.imageId) {
    ElMessage.warning('缺少图片ID，无法进行智能分割');
    return;
  }
  
  try {
    showProcessingDialog.value = true;
    processingText.value = '正在进行智能分割...';
    processingProgress.value = 30;
    
    // 调用SAM分割API
    const response = await request.post('/sam/segment', `imageId=${props.imageId}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    processingProgress.value = 60;
    const result = response.data;
    
    if (result.code !== 200) {
      throw new Error(result.msg || '智能分割失败');
    }
    
    processingText.value = '正在处理分割结果...';
    processingProgress.value = 80;
    
    // 处理掩码数据
    const masksData = result.data?.masks || [];
    maskCount.value = masksData.length;
    
    // 解析掩码轮廓
    await parseMaskContours(masksData);
    
    processingProgress.value = 100;
    
    setTimeout(() => {
      showProcessingDialog.value = false;
      isInitialized.value = true;
      ElMessage.success(`智能分割完成，共${maskCount.value}个区域`);
    }, 500);
    
  } catch (error) {
    console.error('SAM初始化失败:', error);
    ElMessage.error('智能分割失败，请重试');
    showProcessingDialog.value = false;
  }
};

// 解析掩码轮廓（简化版本，只保存轮廓信息）
const parseMaskContours = async (masks: any[]): Promise<void> => {
  maskContours.value = [];
  
  for (let index = 0; index < masks.length; index++) {
    const maskData = masks[index];
    const base64Data = typeof maskData === 'string' ? maskData : maskData.base64 || maskData.data || '';
    
    if (!base64Data) continue;
    
    try {
      const contour = await processSingleMask(base64Data, index);
      if (contour.regions.length > 0) {
        maskContours.value.push(contour);
      }
    } catch (error) {
      console.error(`处理掩码 ${index} 失败:`, error);
    }
  }
};

// 处理单个掩码（简化版本）
const processSingleMask = (base64Data: string, index: number): Promise<{
  maskIndex: number;
  regions: Array<{
    points: Array<{x: number, y: number}>;
    center: {x: number, y: number};
    bounds: {minX: number, minY: number, maxX: number, maxY: number};
  }>;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = create1024Canvas();
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ maskIndex: index, regions: [] });
        return;
      }
      
      // 将掩码绘制到1024x1024的canvas上
      ctx.drawImage(img, 0, 0, 1024, 1024);
      
      // 获取像素数据
      const imageData = ctx.getImageData(0, 0, 1024, 1024);
      const data = imageData.data;
      
      // 简化的轮廓提取：找到白色区域的边界框和中心点
      let minX = 1024, minY = 1024, maxX = 0, maxY = 0;
      let centerX = 0, centerY = 0, whitePixelCount = 0;
      
      for (let y = 0; y < 1024; y++) {
        for (let x = 0; x < 1024; x++) {
          const i = (y * 1024 + x) * 4;
          if (data[i] > 200 && data[i+1] > 200 && data[i+2] > 200) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            centerX += x;
            centerY += y;
            whitePixelCount++;
          }
        }
      }
      
      if (whitePixelCount > 100) { // 只有足够大的区域才保留
        centerX = Math.floor(centerX / whitePixelCount);
        centerY = Math.floor(centerY / whitePixelCount);
        
        // 创建简化的矩形轮廓
        const points = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY }
        ];
        
        resolve({
          maskIndex: index,
          regions: [{
            points,
            center: { x: centerX, y: centerY },
            bounds: { minX, minY, maxX, maxY }
          }]
        });
      } else {
        resolve({ maskIndex: index, regions: [] });
      }
    };
    
    img.onerror = () => resolve({ maskIndex: index, regions: [] });
    img.src = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
  });
};

// 处理canvas点击事件
const handleCanvasClick = (event: MouseEvent) => {
  if (!isInitialized.value) return;
  
  const canvas = smartCutoutCanvas.value;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 由于canvas是1024x1024显示，直接使用点击坐标
  const canvasX = (x / rect.width) * 1024;
  const canvasY = (y / rect.height) * 1024;
  
  // 查找点击位置对应的掩码
  const foundMaskIndex = findMaskAtPosition(canvasX, canvasY);
  
  if (foundMaskIndex !== -1) {
    if (event.button === 2) { // 右键 - 取消选择
      const index = selectedMasks.value.indexOf(foundMaskIndex);
      if (index > -1) {
        selectedMasks.value.splice(index, 1);
        ElMessage.success(`已取消选择区域 ${foundMaskIndex + 1}`);
      }
    } else { // 左键 - 选择
      if (!selectedMasks.value.includes(foundMaskIndex)) {
        selectedMasks.value.push(foundMaskIndex);
        ElMessage.success(`已选择区域 ${foundMaskIndex + 1}`);
      }
    }
    
    // 重新绘制高亮
    redrawWithHighlight();
  }
};

// 查找指定位置的掩码
const findMaskAtPosition = (x: number, y: number): number => {
  for (const contour of maskContours.value) {
    for (const region of contour.regions) {
      if (x >= region.bounds.minX && x <= region.bounds.maxX &&
          y >= region.bounds.minY && y <= region.bounds.maxY) {
        return contour.maskIndex;
      }
    }
  }
  return -1;
};

// 重新绘制并高亮选中的区域
const redrawWithHighlight = () => {
  const canvas = smartCutoutCanvas.value;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;
  
  // 重新绘制原图
  loadAndDrawImage(props.imageUrl).then(() => {
    // 绘制高亮选中的区域
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    selectedMasks.value.forEach(maskIndex => {
      const contour = maskContours.value.find(c => c.maskIndex === maskIndex);
      if (contour) {
        contour.regions.forEach(region => {
          ctx.strokeRect(
            region.bounds.minX,
            region.bounds.minY,
            region.bounds.maxX - region.bounds.minX,
            region.bounds.maxY - region.bounds.minY
          );
        });
      }
    });
  });
};

// 处理鼠标移动（可选，用于预览）
const handleCanvasMouseMove = (event: MouseEvent) => {
  // 简化版本，暂时不实现悬停预览
};

// 处理鼠标离开
const handleCanvasMouseLeave = () => {
  // 简化版本，暂时不实现
};

// 确认选择
const confirmSelection = async () => {
  if (selectedMasks.value.length === 0) {
    ElMessage.warning('请先选择要抠图的区域');
    return;
  }
  
  try {
    processingMask.value = true;
    
    // 创建合并的掩码
    const mergedMask = await createMergedMask();
    
    // 创建抠图结果
    const croppedImage = await createCroppedImage(mergedMask);
    
    // 发送结果
    emit('selection-complete', {
      mask: mergedMask,
      croppedImage: croppedImage
    });
    
    ElMessage.success('抠图完成');
    handleClose();
    
  } catch (error) {
    console.error('抠图处理失败:', error);
    ElMessage.error('抠图处理失败，请重试');
  } finally {
    processingMask.value = false;
  }
};

// 创建合并的掩码
const createMergedMask = (): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = create1024Canvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }
    
    // 创建白色背景的掩码
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 1024, 1024);
    
    // 绘制选中区域为白色
    ctx.fillStyle = 'white';
    selectedMasks.value.forEach(maskIndex => {
      const contour = maskContours.value.find(c => c.maskIndex === maskIndex);
      if (contour) {
        contour.regions.forEach(region => {
          ctx.fillRect(
            region.bounds.minX,
            region.bounds.minY,
            region.bounds.maxX - region.bounds.minX,
            region.bounds.maxY - region.bounds.minY
          );
        });
      }
    });
    
    const base64 = canvas.toDataURL('image/png').split(',')[1];
    resolve(base64);
  });
};

// 创建抠图结果
const createCroppedImage = (maskBase64: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = create1024Canvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve('');
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      // 绘制原图
      ctx.drawImage(img, 0, 0, 1024, 1024);
      
      // 应用掩码
      const maskImg = new Image();
      maskImg.onload = () => {
        // 创建临时canvas处理掩码
        const tempCanvas = create1024Canvas();
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          resolve('');
          return;
        }
        
        tempCtx.drawImage(maskImg, 0, 0, 1024, 1024);
        const maskData = tempCtx.getImageData(0, 0, 1024, 1024);
        const imageData = ctx.getImageData(0, 0, 1024, 1024);
        
        // 应用掩码：黑色区域变透明
        for (let i = 0; i < maskData.data.length; i += 4) {
          if (maskData.data[i] < 128) { // 黑色区域
            imageData.data[i + 3] = 0; // 设为透明
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        const result = canvas.toDataURL('image/png').split(',')[1];
        resolve(result);
      };
      maskImg.src = `data:image/png;base64,${maskBase64}`;
    };
    img.src = props.imageUrl;
  });
};

// 关闭弹窗
const handleClose = () => {
  // 重置状态
  isInitialized.value = false;
  selectedMasks.value = [];
  maskContours.value = [];
  maskCount.value = 0;
  
  emit('update:visible', false);
  emit('close');
};

// 阻止右键菜单
onMounted(() => {
  const canvas = smartCutoutCanvas.value;
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
});
</script>

<style scoped>
.smart-selection-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.smart-selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}

.how-to-button {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #0ea5e9;
}

.confirm-button {
  background: #10b981;
  color: white;
  border: none;
}

.confirm-button:hover {
  background: #059669;
}

.confirm-button:disabled {
  background: #d1d5db;
  color: #9ca3af;
}

.smart-selection-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.image-area {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.smart-cutout-canvas {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.processing-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.processing-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff33;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.smart-selection-footer {
  padding: 16px 0;
  border-top: 1px solid #eee;
}

.sam-status-container {
  text-align: center;
}

.status-title {
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
  margin-bottom: 8px;
}

.status-info {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.label {
  color: #6b7280;
  font-size: 14px;
}

.value {
  color: #1f2937;
  font-weight: 600;
  font-size: 14px;
}

.instruction-text {
  color: #6b7280;
  font-size: 14px;
}

.initialization-status {
  text-align: center;
  color: #6b7280;
}

.processing-dialog .processing-content {
  text-align: center;
  padding: 20px;
}

.processing-text {
  margin-bottom: 16px;
  font-size: 16px;
  color: #374151;
}
</style>