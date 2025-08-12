<template>
  <div class="style-fusion-container">
    <!-- 全屏Loading进度条 -->
    <div v-if="shoeStore.aiTaskStatus === 'running'" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <el-progress 
          :percentage="shoeStore.aiTaskProgress" 
          :stroke-width="8"
          :show-text="false"
          color="#c8ad7f"
          class="loading-progress"
        />
        <div class="loading-percentage">{{ shoeStore.aiTaskProgress }}%</div>
        <div class="loading-text">AI任务执行中</div>
      </div>
    </div>

    <div class="fusion-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- Step 1 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 1 }" >
          <div class="step-header" @click="setStep(1)">
            <span class="step-title">Step 1</span>
            <span class="step-desc">上传需要修改的鞋款</span>
            <el-tooltip content="帮助信息" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
            <span v-if="mainImage" class="step-status">
              <el-icon><Check /></el-icon>
            </span>
          </div>
          
          <div class="upload-section">
            <div class="image-preview" @click="handleMainUploadClick">
              <div v-if="mainImage" class="preview-container">
                <img :src="mainImage" alt="主图预览" class="preview-img" crossorigin="anonymous" />
                <div class="change-overlay">
                  <el-icon><Plus /></el-icon>
                  <span>更换图片</span>
                </div>
                <button class="zoom-icon-btn" @click.stop="showZoomDialogMain = true">
                  <el-icon><ZoomIn /></el-icon>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <span>点击上传图片</span>

                
              </div>
              <input ref="fileInputMain" type="file" accept="image/*" style="display:none" @change="handleMainFileSelect" />
            </div>
            
  
          
            
            <div class="control-switch">
              <span>主体加强</span>
              <el-switch v-model="keepMainBody" />
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 2 }" style="margin-top: 30px;">
          <div class="step-header" @click="setStep(2)">
            <span class="step-title">Step 2</span>
            <span class="step-desc">上传修改区域的参考图</span>
            <span v-if="referenceImage" class="step-status">
              <el-icon><Check /></el-icon>
            </span>
          </div>
          
          <div class="upload-section">
            <div class="image-preview reference-image" @click="handleReferenceUploadClick">
              <div v-if="referenceImage" class="preview-container">
                <img :src="referenceImage" alt="参考图预览" class="preview-img" crossorigin="anonymous" />
                <div class="change-overlay">
                  <el-icon><Plus /></el-icon>
                  <span>更换图片</span>
                </div>
                <button class="zoom-icon-btn" @click.stop="showZoomDialogReference = true">
                  <el-icon><ZoomIn /></el-icon>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon><Camera /></el-icon>
                <span>点击上传图片</span>
              </div>
              <input ref="fileInputReference" type="file" accept="image/*" style="display:none" @change="handleReferenceFileSelect" />
            </div>
          </div>
        </div>
      </div>

      <!-- 中间工作区域 -->
      <div class="work-area">
        <template v-if="!mainImage && !referenceImage">
          <div class="instructions-container">
            <div class="instructions-content">
              <h3>使用说明</h3>
              <ol>
                <li>请上传背景干净无杂物的产品图，单只鞋的正面图最佳</li>
                <li>请尽量保持主产品与参考图两款鞋子角度一致性以达到最佳生成效果</li>
                <li>在参数调整中，果图片强度越高，则款式越与该图片相似</li>
              </ol>
            </div>
          </div>
        </template>
        <template v-else-if="isViewingResults && mainImage && referenceImage">
          <!-- 结果查看区域 -->
          <Suspense>
            <template #default>
              <div class="image-workspace-container">
                <ImageWorkspaceComp
                  :image-url="mainImage"
                  :is-view-results="isViewingResults"
                  :result-images="generatedImages"
                  @image-edited="handleResultSelected"
                  @exit-results="exitResultsView"
                  :hideMaskTool="true"
                  ref="resultsWorkspaceRef"
                />
              </div>
            </template>
            <template #fallback>
              <div class="loading-state">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <p>加载中...</p>
              </div>
            </template>
          </Suspense>
        </template>
        <template v-else>
          <!-- 显示主图 -->
         
          <!-- 显示主图掩码高亮 -->
          <div class="mask-display-container" v-if="mainImage && smartSelectionMask">
            <canvas
              ref="mainMaskCanvas"
              class="mask-canvas"
            ></canvas>
          </div>
        </template>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- Step 3 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 3 }" >
          <div class="step-header" @click="setStep(3)">
            <span class="step-title">Step 3</span>
            <span class="step-desc">参数调整</span>
          </div>
          
          <div class="params-section">
            <div class="param-item">
              <span>主图强度</span>
              <el-slider v-model="mainImageStrength"  />
            </div>
            <div class="param-item">
              <span>结构强度</span>
              <el-slider v-model="structureStrength" :disabled="!keepMainBody" />
            </div>
            <div class="param-item">
              <span>副图强度</span>
              <el-slider v-model="fusionStrength" />
            </div>
          </div>

          <div class="model-selection">
            <ModelSelector 
              v-model="selectedModel"
              @select="handleModelSelect"
              @load-error="handleModelLoadError"
              :require-login="true"
            />
          </div>
        </div>

        <!-- 生成按钮 -->
        <el-button 
          type="primary" 
          class="generate-btn" 
          @click="handleGenerate"
          :disabled="!canGenerate"
        >
          {{ shoeStore.aiTaskStatus === 'running' ? '生成中...' : '立即生成' }}
        </el-button>
        
        <!-- <div v-if="isViewingResults" class="results-controls">
          <el-button type="primary" @click="exitResultsView" class="return-btn">
            返回编辑
        </el-button>
        </div> -->
      </div>

      <!-- 主图本地预览弹窗 -->
      <el-dialog 
        v-model="showPreviewDialogMain" 
        title="主图预览" 
        width="800px" 
        :close-on-click-modal="false"
        @close="cancelMainPreview"
      >
        <div class="upload-modal-content">
          <div class="upload-area">
            <div v-if="previewImageMain" class="file-preview">
              <img :src="previewImageMain" alt="主图预览" class="preview-img" />
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <span>请先选择图片</span>
              <p class="upload-tip">支持 JPG、PNG 格式，最大 10MB</p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="cancelMainPreview">取消</el-button>
            <el-button type="primary" @click="confirmMainPreview" :disabled="!selectedFileMain">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 参考图本地预览弹窗 -->
      <el-dialog 
        v-model="showPreviewDialogReference" 
        title="参考图预览" 
        width="800px" 
        :close-on-click-modal="false"
        @close="cancelReferencePreview"
      >
        <div class="upload-modal-content">
          <div class="upload-area">
            <div v-if="previewImageReference" class="file-preview">
              <img :src="previewImageReference" alt="参考图预览" class="preview-img" />
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Camera /></el-icon>
              <span>请先选择图片</span>
              <p class="upload-tip">支持 JPG、PNG 格式，最大 10MB</p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="cancelReferencePreview">取消</el-button>
            <el-button type="primary" @click="confirmReferencePreview" :disabled="!selectedFileReference">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 主图编辑弹窗 -->
      <el-dialog 
        v-model="showEditDialogMain" 
        title="主图编辑" 
        width="50%" 
        :close-on-click-modal="false" 
        class="edit-dialog"
      >
        <div class="edit-modal-content">
          <Suspense>
            <template #default>
              <div class="image-workspace-container">
                <ImageWorkspaceComp
                  :key="mainImage"
                  :image-url="mainImage"
                  :original-image-name="mainImageId?.toString()"
                  @image-edited="handleMainImageEdited"
                  @editing-completed="closeEditDialogMain"
                  :hideMaskTool="true"
                />
              </div>
            </template>
            <template #fallback>
              <div class="loading-state">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <p>加载中...</p>
              </div>
            </template>
          </Suspense>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="closeEditDialogMain">取消</el-button>
            <!-- <el-button type="primary" @click="closeEditDialogMain">确认编辑</el-button> -->
          </div>
        </template>
      </el-dialog>

      <!-- 参考图编辑弹窗 -->
      <el-dialog 
        v-model="showEditDialogReference" 
        title="参考图编辑" 
        width="50%" 
        :close-on-click-modal="false" 
        class="edit-dialog"
      >
        <div class="edit-modal-content">
          <Suspense>
            <template #default>
              <div class="image-workspace-container">
                <ImageWorkspaceComp
                  :key="referenceImage"
                  :image-url="referenceImage"
                  :original-image-name="referenceImageId?.toString()"
                  @image-edited="handleReferenceImageEdited"
                  @editing-completed="closeEditDialogReference"
                  :hideMaskTool="true"
                />
              </div>
            </template>
            <template #fallback>
              <div class="loading-state">
                <el-icon class="loading-icon"><Loading /></el-icon>
                <p>加载中...</p>
              </div>
            </template>
          </Suspense>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="closeEditDialogReference">取消</el-button>
            <!-- <el-button type="primary" @click="closeEditDialogReference">确认编辑</el-button> -->
          </div>
        </template>
      </el-dialog>

      <!-- 智能分割弹窗 -->
      <SmartSelection
        v-if="showSmartSelection"
        :visible="showSmartSelection"
        :image-id="smartSelectionImageId || undefined"
        :image-url="smartSelectionImageUrl"
        @update:visible="val => showSmartSelection.value = val"
        @selection-complete="onSmartSelectionComplete"
      />

      <!-- 主图放大预览弹窗 -->
      <el-dialog v-model="showZoomDialogMain" width="80vw" :close-on-click-modal="true" :modal-style="{ height: '78vh' }" style="height:78vh;" class="zoom-dialog">
        <div
          class="zoom-img-container"
          @wheel="handleZoomWheelMain"
          style="height:calc(78vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;"
        >
          <img
            :src="mainImage"
            alt="放大预览"
            :style="`max-width:100%;max-height:78vh;transform:scale(${zoomMain});transition:transform 0.2s;display:block;margin:auto;`"
          />
        </div>
        <div style="margin-top:8px;color:#222;text-align:center;">缩放：{{ (zoomMain * 100).toFixed(0) }}%</div>
      </el-dialog>
      <!-- 参考图放大预览弹窗 -->
      <el-dialog v-model="showZoomDialogReference" width="80vw" :close-on-click-modal="true" :modal-style="{ height: '78vh' }" style="height:78vh;" class="zoom-dialog">
        <div
          class="zoom-img-container"
          @wheel="handleZoomWheelReference"
          style="height:calc(78vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;"
        >
          <img
            :src="referenceImage"
            alt="放大预览"
            :style="`max-width:100%;max-height:78vh;transform:scale(${zoomReference});transition:transform 0.2s;display:block;margin:auto;`"
          />
        </div>
        <div style="margin-top:8px;color:#222;text-align:center;">缩放：{{ (zoomReference * 100).toFixed(0) }}%</div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, defineEmits, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Plus, Camera, QuestionFilled, Loading, Check, ZoomIn } from '@element-plus/icons-vue'
import type { UploadInstance } from 'element-plus'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import ModelSelector from '../common/ModelSelector.vue'
// @ts-ignore
import SmartSelection from '../common/SmartSelection.vue'
import { uploadImage, feedbackImage, isUserLoggedIn, strhzxs, tjtws } from '../../api/file'
import type { UploadImageResponse, StrhzxsResponse, StrhzxsRequest, TjtwsRequest } from '../../api/file'
import { useRouter, useRoute } from 'vue-router'
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

// 定义组件事件
const emit = defineEmits(['exitResults'])

// 直接引入异步组件
const ImageWorkspaceComp = defineAsyncComponent(() => 
  import('./ImageWorkspace.vue')
)

// 获取路由器
const router = useRouter()
const route = useRoute()

// 获取store
const shoeStore = useShoeStore()

// 步骤状态管理
const currentStep = ref(1)
const mainImageWorkspaceRef = ref(null)
const referenceImageWorkspaceRef = ref(null)
const selectedModel = ref(0)

// 状态管理
const fileList = ref([])
const mainImage = ref('')
const referenceImage = ref('')
const mainImageId = ref<number | string>('')
const referenceImageId = ref<number | null>(null) // 保存上传后的参考图ID
const keepMainBody = ref(true)
const mainImageStrength = ref(50)
const structureStrength = ref(50)
const fusionStrength = ref(50)

// 添加编辑状态变量
const isEditingMainImage = ref(false)
const isEditingReferenceImage = ref(false)

const selectedModelName = ref('') // 保存选择的鞋子类型名称

// 引用上传组件
const mainImageUploadRef = ref<UploadInstance | null>(null)
const referenceImageUploadRef = ref<UploadInstance | null>(null)

// 结果查看相关
const isViewingResults = ref(false)
const generatedImages = ref<string[]>([])
const resultsWorkspaceRef = ref(null)

// 新增：跟踪是否正在处理款式融合任务
const isProcessingStyleFusionTask = ref(false)

// 主图本地预览弹窗相关状态
const showPreviewDialogMain = ref(false)
const previewImageMain = ref('')
const selectedFileMain = ref<File | null>(null)
const fileInputMain = ref<HTMLInputElement>()

// 参考图本地预览弹窗相关状态
const showPreviewDialogReference = ref(false)
const previewImageReference = ref('')
const selectedFileReference = ref<File | null>(null)
const fileInputReference = ref<HTMLInputElement>()

// 主图编辑弹窗相关状态
const showEditDialogMain = ref(false)

// 参考图编辑弹窗相关状态
const showEditDialogReference = ref(false)

// 智能分割相关状态
const showSmartSelection = ref(false)
const smartSelectionImageId = ref<number | null>(null)
const smartSelectionImageUrl = ref('')
const mainMaskCanvas = ref<HTMLCanvasElement | null>(null)
const smartSelectionMask = ref('')

// creativeImg 相关状态
const isCreativeImgMode = ref(false)
const creativeImgFile = ref<File | null>(null)

// 放大预览相关状态
const showZoomDialogMain = ref(false);
const zoomMain = ref(1);
function handleZoomWheelMain(e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomMain.value = Math.min(zoomMain.value + 0.1, 5);
  } else {
    zoomMain.value = Math.max(zoomMain.value - 0.1, 0.2);
  }
}
const showZoomDialogReference = ref(false);
const zoomReference = ref(1);
function handleZoomWheelReference(e) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomReference.value = Math.min(zoomReference.value + 0.1, 5);
  } else {
    zoomReference.value = Math.max(zoomReference.value - 0.1, 0.2);
  }
}

// 计算属性
const canGenerate = computed(() => {
  return !!mainImage.value && !!referenceImage.value && mainImageId.value !== null && referenceImageId.value !== null
})

// 步骤控制方法
const setStep = (step: number) => {
  if (step === 1 || (step === 2 && mainImage.value) || (step === 3 && mainImage.value && referenceImage.value)) {
    currentStep.value = step
  }
}

// 选择模型
const handleModelSelect = (modelId: number, model: any) => {
  console.log('选择的模型:', model)
  selectedModel.value = modelId
  
  // 保存选择的鞋子类型名称
  if (model && model.name) {
    selectedModelName.value = model.name
    console.log('选择的鞋子类型:', selectedModelName.value)
  }
}

// 主图上传相关方法
const handleMainUploadClick = () => {
  fileInputMain.value?.click();
};

const handleMainFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB')
      return
    }
    selectedFileMain.value = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImageMain.value = e.target?.result as string;
      showPreviewDialogMain.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const confirmMainPreview = () => {
  if (!selectedFileMain.value) return;
  // creativeImg 模式下，上传 creativeImgFile
  uploadFile(selectedFileMain.value, 'input', (imageUrl, imageId) => {
    if (imageId) mainImageId.value = typeof imageId === 'number' ? imageId : parseInt(imageId, 10);
    showEditDialogMain.value = true;
  });
  mainImage.value = previewImageMain.value;
  showPreviewDialogMain.value = false;
  // 清空文件输入框
  if (fileInputMain.value) {
    fileInputMain.value.value = '';
  }
  selectedFileMain.value = null;
  previewImageMain.value = '';
  isCreativeImgMode.value = false;
  creativeImgFile.value = null;
  // 如果两张图片都上传完成，自动进入第3步
  if (mainImage.value && referenceImage.value && referenceImageId.value !== null) {
    currentStep.value = 3;
  }
};

const cancelMainPreview = () => {
  showPreviewDialogMain.value = false;
  // 清空文件输入框
  if (fileInputMain.value) {
    fileInputMain.value.value = '';
  }
  selectedFileMain.value = null;
  previewImageMain.value = '';
};

// 参考图上传相关方法
const handleReferenceUploadClick = () => {
  fileInputReference.value?.click();
};

const handleReferenceFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过10MB')
      return
    }
    selectedFileReference.value = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImageReference.value = e.target?.result as string;
      showPreviewDialogReference.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const confirmReferencePreview = () => {
  if (!selectedFileReference.value) return;
  // 上传前log
  console.log('[StyleFusion] 新图片赋值 referenceImage.value =', previewImageReference.value)
  uploadFile(selectedFileReference.value, 'input', (imageUrl, imageId) => {
    if (imageId) referenceImageId.value = typeof imageId === 'number' ? imageId : parseInt(imageId, 10);
    showEditDialogReference.value = true;
  });
  referenceImage.value = previewImageReference.value;
  showPreviewDialogReference.value = false;
  // 清空文件输入框
  if (fileInputReference.value) {
    fileInputReference.value.value = '';
  }
  selectedFileReference.value = null;
  previewImageReference.value = '';
  // 如果两张图片都上传完成，自动进入第3步
  if (mainImage.value && referenceImage.value && referenceImageId.value !== null) {
    currentStep.value = 3;
  }
};

const cancelReferencePreview = () => {
  showPreviewDialogReference.value = false;
  // 清空文件输入框
  if (fileInputReference.value) {
    fileInputReference.value.value = '';
  }
  selectedFileReference.value = null;
  previewImageReference.value = '';
};

// 编辑弹窗相关方法
const closeEditDialogMain = () => {
  showEditDialogMain.value = false;
};

const closeEditDialogReference = () => {
  showEditDialogReference.value = false;
};

const handleMainImageEdited = (editedImageUrl: string, imageId?: number | string) => {
  mainImage.value = editedImageUrl;
  if (imageId !== undefined && imageId !== null && imageId !== '') {
    mainImageId.value = typeof imageId === 'number' ? imageId : parseInt(imageId as string, 10);
  }
  showEditDialogMain.value = false;
};

const handleReferenceImageEdited = (editedImageUrl: string, imageId?: number | string) => {
  referenceImage.value = editedImageUrl;
  if (imageId !== undefined) {
    referenceImageId.value = typeof imageId === 'number' ? imageId : parseInt(imageId as string, 10);
  }
  showEditDialogReference.value = false;
};

// 处理结果图选择
const handleResultSelected = () => {
  // 用户选择了一张结果图片，可以在这里添加额外逻辑
  console.log('用户选择了一张结果图片')
}

// 退出结果查看模式
const exitResultsView = () => {
  isViewingResults.value = false
  emit('exitResults')
}

// 监听store中的图片结果
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    // 只有在款式融合任务进行中时才显示结果
    if (isProcessingStyleFusionTask.value) {
      generatedImages.value = newImages;
      isViewingResults.value = true;
      ElMessage.success("款式融合生成成功");
      isProcessingStyleFusionTask.value = false // 重置任务状态
    }
  }
}, { deep: true })

// 处理生成按钮点击
const handleGenerate = async () => {
  if (!canGenerate.value) return;

  // 验证用户登录
  if (!isUserLoggedIn()) {
    ElMessageBox.confirm(
      "您需要登录才能使用生成功能。是否现在登录？",
      "未登录提示",
      {
        confirmButtonText: "去登录",
        cancelButtonText: "取消",
        type: "warning",
      }
    ).then(() => {
      localStorage.setItem(
        "redirectAfterLogin",
        router.currentRoute.value.fullPath
      );
      router.push("/login");
    });
    return;
  }

  // 验证图片ID是否存在
  if (mainImageId.value == null || referenceImageId.value == null) {
    ElMessage.warning("请先将图片上传至服务器");
    return;
  }

  try {
    isProcessingStyleFusionTask.value = true; // 设置为款式融合任务进行中
    
    // 使用当前上传的图片ID，避免使用全局状态中的旧ID
    const majorIdToUse = typeof mainImageId.value === 'number' ? mainImageId.value : parseInt(mainImageId.value as string, 10)
    console.log("🔍 款式融合调试信息:", {
      当前上传主图ID: mainImageId.value,
      最终使用主图ID: majorIdToUse,
      参考图ID: referenceImageId.value,
      来源: '当前上传的图片'
    });

    // 准备请求参数
    const requestData: StrhzxsRequest = { 
      loreName: selectedModel.value !== 0 ? selectedModelName.value : '元素',
      majorId: majorIdToUse,
      minorId: referenceImageId.value,
      majorStrength: Math.max(0.1, mainImageStrength.value / 10),
      minorStrength: Math.max(0.1, fusionStrength.value / 10),
      structuralStrength: Math.max(0.1, structureStrength.value / 10)
    };
    
    // 发送请求
    console.log("发送款式融合请求:", requestData);
    const response = await strhzxs(requestData);
    console.log("收到款式融合响应:", response);

    const result = response.data;
    let viewUrls: string[] = [];
    if (result && result.viewUrls && Array.isArray(result.viewUrls)) {
      viewUrls = result.viewUrls;
    }

    // 新的API格式：直接返回taskId
    if (result && typeof result === 'string') {
      const taskId = result;
      console.log('获得taskId:', taskId);
      shoeStore.setAiTaskInfo({
        taskId: taskId,
        taskType: 'style-fusion'
      });
      startAiTaskWs(taskId, 'style-fusion');
      // 不要直接 return，让 watch 监听 WebSocket 结果
    } else if (viewUrls.length > 0) {
      // 没有 WebSocket 字段才直接处理结果
      generatedImages.value = viewUrls;
      isViewingResults.value = true;
      ElMessage.success("款式融合生成成功");
    } else {
      ElMessage.warning("生成成功但未获得图片");
    }
  } catch (error: any) {
    console.error("款式融合失败:", error);
    ElMessage.error("生成失败: " + (error.message || "未知错误"));
    isProcessingStyleFusionTask.value = false // 重置任务状态
  }
};

// 处理API响应
const handleApiResponse = async (response: any) => {
  console.log('API响应数据:', response)
  
  // 检查响应结构
  if (!response || typeof response !== 'object') {
    throw new Error('无效的API响应')
  }
  
  // 处理直接返回整个响应对象的情况
  const data = response.data ? response : response.data

  // 接受 code 0 和 code 200 都表示成功
  if (data.code === 0 || data.code === 200) {
    // 兼容不同的返回格式
    let viewUrls: string[] = [];
    
    if (data.data && data.data.viewUrls) {
      // 标准格式：{code: 0/200, msg: "", data: {promptId: "", viewUrls: [...]}}
      viewUrls = data.data.viewUrls;
    } else if (data.viewUrls) {
      // 直接包含viewUrls的格式：{code: 0/200, msg: "", viewUrls: [...]}
      viewUrls = data.viewUrls;
    } else {
      throw new Error('找不到生成的图片链接');
    }
    
    console.log('提取的图片链接:', viewUrls);
      
    // 保存生成的图片URL
    if (Array.isArray(viewUrls) && viewUrls.length > 0) {
      generatedImages.value = viewUrls;
      
      // 显示结果
      isViewingResults.value = true;
        
      // 如果有resultsWorkspaceRef，调用其showResults方法
      if (resultsWorkspaceRef.value) {
        try {
          console.log('准备调用showResults方法，参数:', generatedImages.value)
          // @ts-ignore 访问组件方法
          await resultsWorkspaceRef.value.showResults(generatedImages.value)
          console.log('showResults方法调用成功')
        } catch (error) {
          console.error('调用showResults方法失败:', error)
          // 手动更新组件状态
          // @ts-ignore 直接设置组件的reactive属性
          resultsWorkspaceRef.value.isViewingResults = true
          // @ts-ignore
          resultsWorkspaceRef.value.resultImages = generatedImages.value
        }
      }
        
      ElMessage.success('图片生成成功')
    } else {
      ElMessage.warning('生成成功但未获得图片')
    }
  } else {
    // 处理特定的错误码
    if (data.code === 1013) {
      throw new Error('请先选择需要更改的区域！');
    } else {
      throw new Error(data.msg || '生成图片失败')
    }
  }
}

// 处理模型加载错误
const handleModelLoadError = (errorMsg: string) => {
  console.error('模型加载错误:', errorMsg)
  // 可以在这里添加错误提示，如使用Element Plus的消息提示
  // ElMessage.error(errorMsg)
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

// 压缩图片
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

// 封装文件上传和回显流程 - 更新为返回ID
const uploadFile = (file: File, type: 'input' | 'output', callback?: (imageUrl: string, imageId?: number | string) => void) => {
  if (!isUserLoggedIn()) {
    ElMessageBox.confirm(
      '您需要登录才能上传图片。是否现在登录？',
      '未登录提示',
      {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      localStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
      router.push('/login')
    }).catch(() => {
      ElMessage.info('您可以继续使用本地图片预览功能，但无法保存到服务器')
    })
    const reader = new FileReader()
    reader.onload = (e) => {
      if (callback && e.target?.result) {
        callback(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    return
  }
  const loading = ElLoading.service({
    lock: true,
    text: '图片上传中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片过大，正在压缩...')
    compressImage(file).then(compressedFile => {
      doUpload(compressedFile)
    }).catch(err => {
      ElMessage.error('图片压缩失败：' + err.message)
      loading.close()
    })
  } else {
    doUpload(file)
  }
  function doUpload(fileToUpload: File) {
    uploadImage(fileToUpload)
      .then((response: any) => {
        if (response.code === 0 || response.code === 200) {
          const imageData = response.data as UploadImageResponse
          const imageId = imageData.id
          return feedbackImage(imageId).then(feedbackResponse => {
            return { response: feedbackResponse, imageId }
          })
        } else {
          if (response.code === 401) {
            ElMessageBox.confirm('您的登录已过期，请重新登录。', '登录提示', {
              confirmButtonText: '去登录',
              cancelButtonText: '取消',
              type: 'warning',
            }).then(() => {
              localStorage.removeItem('token')
              localStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
              router.push('/login')
            })
            return Promise.reject(new Error('login_required'))
          }
          throw new Error(response.msg || '上传失败')
        }
      })
      .then((result: any) => {
        if (!result) return
        const { response, imageId } = result
        if (response.code === 0 || response.code === 200) {
          const imageUrl = response.data
          if (callback) callback(imageUrl, imageId)
          ElMessage.success('图片上传成功')
        } else {
          throw new Error(response.msg || '获取图片地址失败')
        }
      })
      .catch((error: any) => {
        if (error.message === 'login_required') {
          return
        }
        ElMessage.error({
          message: '图片上传失败: ' + (error.message || '未知错误'),
          duration: 5000,
        })
      })
      .then(() => {
        loading.close()
      })
  }
}

// 智能分割相关方法
const openSmartSelection = () => {
  if (!mainImageId.value) {
    ElMessage.warning('请先上传主图')
    return
  }
  smartSelectionImageId.value = typeof mainImageId.value === 'number' ? mainImageId.value : parseInt(mainImageId.value as string, 10)
  smartSelectionImageUrl.value = mainImage.value
  showSmartSelection.value = true
}

const onSmartSelectionComplete = ({ mask, selectionType }: { mask: string; selectionType: 'include' | 'exclude' }) => {
  smartSelectionMask.value = mask
  showSmartSelection.value = false
  ElMessage.success('智能分割完成，掩码已获取')
  
  // 监听掩码变化，高亮显示
  nextTick(() => {
    if (mainMaskCanvas.value && mainImage.value && mask) {
      drawMaskHighlight(mainImage.value, mask, mainMaskCanvas.value)
    }
  })
}

// 掩码高亮显示方法
const drawMaskHighlight = (imageUrl: string, maskBase64: string, canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const img = new Image()
  const maskImg = new Image()
  img.crossOrigin = 'anonymous'
  maskImg.crossOrigin = 'anonymous'
  
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    maskImg.onload = () => {
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = img.width
      tempCanvas.height = img.height
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      
      tempCtx.drawImage(maskImg, 0, 0, img.width, img.height)
      const maskData = tempCtx.getImageData(0, 0, img.width, img.height)
      const imageData = ctx.getImageData(0, 0, img.width, img.height)
      
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i+3] > 128) {
          imageData.data[i] = 0      // R
          imageData.data[i+1] = 180  // G
          imageData.data[i+2] = 255  // B
          imageData.data[i+3] = 180  // A (0-255, 180约等于0.7透明度)
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }
    maskImg.src = maskBase64
  }
  img.src = imageUrl
}

// 工具函数：url/base64 转 File
function urlToFile(url: string, filename: string): Promise<File> {
  return fetch(url)
    .then(res => res.blob())
    .then(blob => new File([blob], filename, { type: blob.type }))
}
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1].split('base64,')[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, {type:mime});
}

onMounted(async () => {
  if (route.query.creativeImg) {
    const img = route.query.creativeImg as string
    isCreativeImgMode.value = true
    // 判断 base64 还是 url
    let file: File | null = null
    if (img.startsWith('data:image/')) {
      file = dataURLtoFile(img, 'creativeImg.png')
    } else {
      // 远程 url
      file = await urlToFile(img, 'creativeImg.png')
    }
    creativeImgFile.value = file
    selectedFileMain.value = file
    previewImageMain.value = img
    showPreviewDialogMain.value = true
  }
})

// 组件卸载时停止WebSocket
onUnmounted(() => {
  stopAiTaskWs()
  isProcessingStyleFusionTask.value = false // 重置任务状态
})
</script>

<style scoped>
.style-fusion-container {
  width: 100%;
  height: 100vh;
  background: transparent;
  color: #fff;
  padding: 0;
  position: relative;
  z-index: 1;
  margin-left: 0;
  margin-right: 0;
  overflow: hidden;
}

.style-fusion-container::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("@/assets/bg.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.fusion-content {
  display: flex;
  gap: 20px;
  height: 100vh;
  padding-left: 110px;
  padding-right: 20px;
  padding-top: 20px;
  padding-bottom: 20px;
  width: 100vw;
  position: relative;
  z-index: 2;
  overflow: hidden;
  margin: 0;
  box-sizing: border-box;
}

.left-panel {
  width: 270px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  backdrop-filter: blur(10px);
  overflow-y: auto;
  max-height: 100%;
}

.work-area {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.right-panel {
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 10px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 100%;
  overflow-y: auto;
}

.step-section {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.active-step {
  box-shadow: 0 0 10px rgba(0, 163, 255, 0.3);
  background: rgba(0, 163, 255, 0.05);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.step-title {
  color: #c8ad7f;
  font-weight: bold;
}

.step-desc {
  font-size: 16px;
  color: #fff;
}

.step-status {
  margin-left: auto;
  color: #00FF00;
}

.upload-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
}

.image-preview {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 6px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

.image-preview:hover {
  border-color: #00A3FF;
  background: rgba(0, 163, 255, 0.1);
}

.preview-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.change-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.change-overlay .el-icon {
  font-size: 24px;
  color: white;
  margin-bottom: 8px;
}

.change-overlay span {
  color: white;
  font-size: 14px;
}

.preview-container:hover .change-overlay {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
}

.upload-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.upload-placeholder span {
  font-size: 14px;
}

.control-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.smart-selection-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  border: none;
  border-radius: 20px;
  font-size: 16px;
  margin-top: 10px;
  color: #fff;
}

.smart-selection-btn:hover {
  background: linear-gradient(90deg, #0099E6, #00E6E6);
}

.mask-display-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mask-canvas {
  max-width: 100%;
  max-height: 100%;
  border: 2px solid #c8ad7f;
  border-radius: 8px;
}

.params-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
}

.param-item {
  margin-bottom: 10px;
}

.model-selection {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
  height: 320px;
}

.generate-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #c8ad7f, #c8ad7f);
  border: none;
  border-radius: 20px;
  font-size: 16px;
}

.generate-btn:disabled {
  background: linear-gradient(90deg, #666, #999);
  opacity: 0.7;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.7);
}

.loading-icon {
  font-size: 36px;
  animation: rotate 1.5s linear infinite;
  margin-bottom: 16px;
}

.image-workspace-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}


.instructions-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.instructions-content {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 15px 20px;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions-content h3 {
  color: #c8ad7f;
  font-size: 18px;
  margin-bottom: 12px;
  text-align: center;
}

.instructions-content ol {
  list-style: none;
  padding: 0;
  margin: 0;
  counter-reset: instruction-counter;
}

.instructions-content li {
  color: #c8ad7f;
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 10px;
  padding-left: 28px;
  position: relative;
  counter-increment: instruction-counter;
}

.instructions-content li::before {
  content: counter(instruction-counter);
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 20px;
  background: #c8ad7f;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

/* 弹窗样式 */
:deep(.el-dialog) {
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  background: rgba(30, 30, 30, 0.98);
  color: #fff;
}

.upload-modal-content {
  padding: 20px 0;
}

.upload-area {
  width: 80%;
  height: 400px;
  border: 2px dashed transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  margin: 0 auto;
}

.upload-area:hover {
  border-color: transparent;
  background: rgba(200, 173, 127, 0.08);
}

.file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}


.upload-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 编辑弹框样式 */
:deep(.edit-dialog .el-dialog) {
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  background: rgba(30, 30, 30, 0.98);
  color: #fff;
  max-width: 95vw;
  max-height: 95vh;
}

.edit-modal-content {
  height: 60vh;
  overflow: hidden;
}

.edit-modal-content .image-workspace-container {

  width: 100%;
}

:deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.1);
}

:deep(.el-slider__bar) {
  background-color: #c8ad7f;
}

:deep(.el-slider__button) {
  border-color: #c8ad7f;
}

:deep(.el-switch__core) {
  border-color: #c8ad7f;
}

:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #c8ad7f;
  border-color: #c8ad7f;
}

:deep(.el-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: transparent;
  color: #c8ad7f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-collapse-item__content) {
  background: transparent;
  color: #fff;
  padding: 0;
}


.results-controls {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.return-btn {
  width: 100%;
  height: 40px;
  background: #c8ad7f;
  border: none;
  border-radius: 20px;
  font-size: 16px;
}

.return-btn:disabled {
  background: linear-gradient(90deg, #666, #999);
  opacity: 0.7;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:deep(.el-dialog__footer .el-button--primary) {
  background:linear-gradient(90deg, #00A3FF, #0AFFFF);
  border: none;
  color: #fff;
}
:deep(.el-dialog__footer .el-button--primary:hover) {
  filter: brightness(1.08);
  box-shadow: 0 4px 12px rgba(200, 173, 127, 0.25);
}
.zoom-icon-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(0,0,0,0.5);
  border: none;
  border-radius: 50%;
  padding: 6px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
}
.zoom-icon-btn:hover {
  background: #c8ad7f;
  color: #222;
}
.zoom-icon-btn .el-icon {
  font-size: 20px;
}
.zoom-img-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}
:deep(.el-dialog.zoom-dialog) {
  background: #fff !important;
  border: none !important;
  color: #222 !important;
  box-shadow: 0 8px 30px rgba(0,0,0,0.10) !important;
}
:deep(.el-dialog.zoom-dialog .el-dialog__body) {
  background: #fff !important;
  color: #222 !important;
}
:deep(.el-dialog.zoom-dialog .el-dialog__header) {
  background: #fff !important;
  color: #222 !important;
  border-bottom: 1px solid #eee !important;
}

/* 进度覆盖层样式 */
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

.progress-modal {
  background: rgba(30, 30, 30, 0.95);
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  min-width: 400px;
  backdrop-filter: blur(10px);
}

.progress-content h3 {
  color: #c8ad7f;
  margin-bottom: 20px;
  font-size: 18px;
}

.progress-bar {
  margin-bottom: 15px;
}

.progress-text {
  color: #fff;
  font-size: 14px;
  margin: 0;
}

/* 进度条样式同步 */
.progress-modal.gold-card {
  background: rgba(30, 30, 30, 0.98);
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  padding: 30px;
  text-align: center;
  color: #fff;
  max-width: 500px;
  width: 90%;
}
.progress-bar-gold {
  margin-bottom: 8px;
}
.progress-percent {
  color: #00FF00;
  font-weight: bold;
  font-size: 32px;
  margin-bottom: 8px;
}
.percent-sign {
  font-size: 18px;
  margin-left: 2px;
}
.progress-title {
  color: #c8ad7f;
  font-weight: bold;
  font-size: 22px;
  margin-bottom: 10px;
}
.progress-desc {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #c8ad7f;
  font-size: 16px;
  margin-bottom: 8px;
}
.progress-spinner {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 3px solid #c8ad7f;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.progress-tip {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-top: 15px;
}
.progress-tip p {
  margin-bottom: 5px;
}

/* 全屏Loading样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  backdrop-filter: blur(5px);
  pointer-events: auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: #fff;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(200, 173, 127, 0.3);
  border-top: 3px solid #c8ad7f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-progress {
  width: 200px;
}

.loading-percentage {
  color: #00d4ff;
  font-size: 18px;
  font-weight: bold;
}

.loading-text {
  color: #c8ad7f;
  font-size: 16px;
  font-weight: 500;
}

</style> 