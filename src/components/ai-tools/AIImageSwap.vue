<template>
  <div class="ai-image-swap-container">
    <div class="swap-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- Step 1 -->
        <div class="step-section" :class="{ 'active-step': true }">
          <div class="step-header">
            <span class="step-title">Step 1</span>
            <span class="step-desc">上传要抠图的鞋款</span>
            <el-tooltip content="帮助信息" placement="top">
              <el-icon>
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
            <span v-if="mainImage" class="step-status">
              <el-icon>
                <Check />
              </el-icon>
            </span>
          </div>

          <div class="upload-section">
            <div class="image-preview" @click="handleMainUploadClick">
              <div v-if="mainImage" class="preview-container" style="position:relative;">
                <img :src="mainImage" alt="主图预览" class="preview-img" crossorigin="anonymous" />
                <div class="change-overlay">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  <span>更换图片</span>
                </div>
                <button class="zoom-icon-btn" type="button" @click.stop="showZoomDialogMain = true">
                  <el-icon>
                    <ZoomIn />
                  </el-icon>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon>
                  <Plus />
                </el-icon>
                <span>点击上传图片</span>
              </div>
              <input ref="fileInputMain" type="file" accept="image/*" style="display:none"
                @change="handleMainFileSelect" />
            </div>
            <div class="step-actions" v-if="mainImage">
              <el-button type="primary" @click="handleClearImage">清除图片</el-button>
            </div>
          </div>
        </div>
      </div>


      <!-- 中间工作区域 -->
      <div class="work-area">
        <template v-if="isViewingResults && resultImages.length > 0">
          <!-- 只在有结果时展示 -->
          <div class="image-workspace-container">
            <ImageWorkspaceComp ref="imageWorkspaceRef" :image-url="mainImage" :is-view-results="isViewingResults"
              :result-images="resultImages" :hide-brush-tool="true" :hideMaskTool="true"
              @result-saved="handleResultSaved" @exit-results="exitResultsView" />
          </div>
        </template>
        <template v-else>
          <!-- 其它情况显示说明或空白 -->
          <div class="instructions-container">
            <div class="instructions-content">
              <h3>使用说明</h3>
              <ol>
                <li>请上传鞋款图片并在弹窗中编辑</li>
                <li>编辑完成后点击"立即抠图"</li>
                <li>抠图结果将在此区域展示</li>
              </ol>
            </div>
          </div>
        </template>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 生成按钮 -->
        <el-button type="primary" class="generate-btn" @click="handleGenerate" :disabled="!canGenerate"
          :loading="isGenerating">
          {{ shoeStore.aiTaskStatus === 'running' ? '抠图中...' : '立即抠图' }}
        </el-button>
      </div>

      <!-- 主图本地预览弹窗 -->
      <el-dialog v-model="showPreviewDialogMain" title="主图预览" width="800px" :close-on-click-modal="false"
        @close="cancelMainPreview">
        <div class="upload-modal-content">
          <div class="upload-area">
            <div v-if="previewImageMain" class="file-preview">
              <img :src="previewImageMain" alt="主图预览" class="preview-img" />
            </div>
            <div v-else class="upload-placeholder">
              <el-icon>
                <Plus />
              </el-icon>
              <span>请先选择图片</span>
              <p class="upload-tip">支持 JPG、PNG 格式，最大 10MB</p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="cancelMainPreview">取消</el-button>
            <el-button type="primary" @click="confirmMainPreview" :disabled="!previewImageMain">确定</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- 主图编辑弹窗 -->
      <el-dialog v-model="showEditDialogMain" title="主图编辑" width="50%" :close-on-click-modal="false"
        class="edit-dialog">
        <div class="edit-modal-content">
          <Suspense>
            <template #default>
              <div class="image-workspace-container">
                <ImageWorkspaceComp :image-url="mainImage" :original-image-name="mainImageName" :hide-brush-tool="true"
                  :hideMaskTool="true" @image-edited="handleImageEdited" @editing-completed="closeEditDialogMain" />
              </div>
            </template>
            <template #fallback>
              <div class="loading-state">
                <el-icon class="loading-icon">
                  <Loading />
                </el-icon>
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

      <!-- 结果弹窗 -->
      <el-dialog v-model="showResultDialog" title="抠图结果" width="800px" :close-on-click-modal="false"
        @close="closeResultDialog">
        <div class="result-dialog-content">
          <div class="result-image-container">
            <img :src="resultImages[resultDialogIndex]" alt="抠图结果" class="result-image" />
          </div>
          <div class="result-controls">
            <el-button @click="prevImage">上一张</el-button>
            <el-button @click="nextImage">下一张</el-button>
          </div>
        </div>
      </el-dialog>
    </div>

    <!-- 全屏Loading进度条 -->
    <div v-if="shoeStore.aiTaskStatus === 'running'" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <el-progress :percentage="shoeStore.aiTaskProgress" :stroke-width="8" :show-text="false" color="#c8ad7f"
          class="loading-progress" />
        <div class="loading-percentage">{{ shoeStore.aiTaskProgress }}%</div>
        <div class="loading-text">AI任务执行中</div>
      </div>
    </div>

    <!-- 图片加载中弹窗 -->
    <div v-if="shoeStore.aiTaskStatus === 'loading_result'" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">AI处理完成，图片正在加载中...</div>
        <div class="loading-subtitle">请稍候，马上就好</div>
      </div>
    </div>
  </div>

  <!-- 主图放大预览弹窗 -->
  <el-dialog v-model="showZoomDialogMain" width="80vw" :close-on-click-modal="true" :modal-style="{ height: '78vh' }"
    style="height:78vh;" class="zoom-dialog">
    <div class="zoom-img-container" @wheel="handleZoomWheelMain"
      style="height:calc(78vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img :src="mainImage" alt="放大预览"
        :style="`max-width:100%;max-height:78vh;transform:scale(${zoomMain});transition:transform 0.2s;display:block;margin:auto;`" />
    </div>
    <div style="margin-top:8px;color:#222;text-align:center;">缩放：{{ (zoomMain * 100).toFixed(0) }}%</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, onMounted, watch, onUnmounted } from 'vue'
import { Plus, QuestionFilled, Check, Loading, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import type { UploadInstance } from 'element-plus'
import { uploadImage, feedbackImage, kt } from '../../api/file'
import type { UploadImageResponse, KtRequest } from '../../api/file'
import { useRouter, useRoute } from 'vue-router'
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

// 异步引入图片工作区组件
const ImageWorkspaceComp = defineAsyncComponent(() =>
  import('../design/ImageWorkspace.vue')
)

// 获取路由器
const router = useRouter()
const route = useRoute()

// 获取store
const shoeStore = useShoeStore()

// 状态管理
const mainImage = ref('')
const mainImageName = ref<string>('') // 保存上传后的主图ID
const originalImageId = ref<string>('') // 保存原图ID，不因编辑而改变
const isGenerating = ref(false)
const isViewingResults = ref(false)
const resultImages = ref<string[]>([])
const uploadRef = ref<UploadInstance | null>(null)
const imageWorkspaceRef = ref<any | null>(null)

// 新增：跟踪是否正在处理AI图片交换任务
const isProcessingAIImageSwapTask = ref(false)

// 主图本地预览弹窗相关状态
const showPreviewDialogMain = ref(false)
const previewImageMain = ref('')
const selectedFileMain = ref<File | null>(null)
const fileInputMain = ref<HTMLInputElement>()

// 主图编辑弹窗相关状态
const showEditDialogMain = ref(false)

// 新增状态
const mainImageId = ref('')

// 结果弹窗相关状态
const showResultDialog = ref(false)
const resultDialogIndex = ref(0)

// 主图放大预览弹窗相关状态
const showZoomDialogMain = ref(false);
const zoomMain = ref(1);
function handleZoomWheelMain(e: WheelEvent) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomMain.value = Math.min(zoomMain.value + 0.1, 5);
  } else {
    zoomMain.value = Math.max(zoomMain.value - 0.1, 0.2);
  }
}

// 计算属性
const canGenerate = computed(() => {
  const result = !!mainImage.value && !!mainImageName.value;
  console.log('🔍 canGenerate 计算:', {
    mainImage: !!mainImage.value,
    mainImageName: !!mainImageName.value,
    mainImageValue: mainImage.value,
    mainImageNameValue: mainImageName.value,
    canGenerate: result
  });
  return result;
})

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

// 重置结果相关状态的函数
const resetResultStates = () => {
  console.log('🔄 重置一键抠图结果相关状态');
  
  // 重置结果显示状态
  isViewingResults.value = false;
  resultImages.value = [];
  isProcessingAIImageSwapTask.value = false;
  
  // 清空当前任务ID
  currentTaskId = null;
  console.log('🆔 清空当前任务ID');
  
  // 重置store中的图片结果
  shoeStore.setAiTaskImages([]);
  
  console.log('✅ 一键抠图结果状态已重置');
};

const confirmMainPreview = () => {
  // 图片上传时重置结果状态
  resetResultStates();
  
  let fileToUpload: File | null = null;
  const doUpload = (file: File) => {
    uploadFile(file, (_, imageId) => {
      if (imageId) {
        mainImageName.value = String(imageId);

        // 设置全局状态
        shoeStore.setOriginalImageId(Number(imageId));
        console.log('🌐 已设置全局原始图片ID:', imageId);
      }
      mainImage.value = previewImageMain.value;
      showEditDialogMain.value = true;
      showPreviewDialogMain.value = false;
      if (fileInputMain.value) fileInputMain.value.value = '';
      selectedFileMain.value = null;
      previewImageMain.value = '';
    });
  };
  if (selectedFileMain.value) {
    fileToUpload = selectedFileMain.value;
    doUpload(fileToUpload);
  } else if (previewImageMain.value) {
    if (previewImageMain.value.startsWith('data:image/')) {
      // base64
      fileToUpload = dataURLtoFile(previewImageMain.value, 'creativeImg.jpg');
      doUpload(fileToUpload);
    } else if (previewImageMain.value.startsWith('http') || previewImageMain.value.startsWith('blob:')) {
      // url 或 blob
      fetch(previewImageMain.value)
        .then(res => res.blob())
        .then(blob => {
          fileToUpload = new File([blob], 'creativeImg.jpg', { type: blob.type });
          doUpload(fileToUpload);
        });
    }
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

// 编辑弹窗相关方法
const closeEditDialogMain = () => {
  showEditDialogMain.value = false;
};

const handleImageEdited = (editedImageUrl: string, imageId?: number) => {
  mainImage.value = editedImageUrl;
  if (imageId) {
    mainImageName.value = String(imageId);

    // 设置全局状态，让其他功能使用编辑后的图片ID
    shoeStore.setOriginalImageId(imageId);
    console.log('🌐 已设置全局编辑后图片ID:', imageId);

    showEditDialogMain.value = false;
  } else if (editedImageUrl && !mainImageName.value) {
    // creativeImg 跳转且未上传，自动上传
    const file = dataURLtoFile(editedImageUrl, 'creativeImg.jpg');
    uploadFile(file, (_, newImageId) => {
      if (newImageId) {
        mainImageName.value = String(newImageId);

        // 设置全局状态
        shoeStore.setOriginalImageId(Number(newImageId));
        console.log('🌐 已设置全局编辑后图片ID:', newImageId);
      }
      showEditDialogMain.value = false;
    });
  } else {
    showEditDialogMain.value = false;
  }
};

// 工具函数：base64转File
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL format');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// 清除图片
const handleClearImage = () => {
  mainImage.value = ''
  mainImageName.value = ''
  originalImageId.value = '' // 清除原图ID
  if (isViewingResults.value) {
    isViewingResults.value = false
    resultImages.value = []
  }
}

// 文件上传函数
const uploadFile = (file: File, callback?: (imageUrl: string, imageName?: string) => void) => {
  const loading = ElLoading.service({
    lock: true,
    text: '上传图片中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  // 检查文件大小，如果超过10MB则压缩
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

  async function doUpload(fileToUpload: File) {
    try {
      const response: any = await uploadImage(fileToUpload);
      if (response.code === 0 || response.code === 200) {
        const imageData = response.data as UploadImageResponse;
        const imageId = imageData.id;
        // 使用feedbackImage获取图片URL
        const imageUrlResponse = await feedbackImage(imageId);
        const imageUrl = imageUrlResponse.data || '';
        if (callback) callback(imageUrl, String(imageId));
        ElMessage.success('图片上传成功');
      } else {
        throw new Error(response.msg || '上传失败');
      }
    } catch (error: any) {
      console.error("图片上传失败:", error);
      ElMessage.error('上传失败: ' + (error.message || '未知错误'));
    } finally {
      loading.close();
    }
  }
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
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('压缩失败'))
            }
          },
          'image/jpeg',
          0.8
        )
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

// 当前正在处理的任务ID - 确保taskId一致性
let currentTaskId: string | null = null;

// 直接查询任务结果的函数
const queryTaskResult = async (taskId: string, retryCount = 0) => {
  const maxRetries =100; // 最多重试10次
  const retryDelay = 500; // 每次重试间隔500ms

  // 🔥 严格验证taskId，确保只处理当前任务
  if (taskId !== currentTaskId) {
    console.warn('⚠️ 查询的taskId与当前任务ID不匹配，忽略此查询', {
      查询的taskId: taskId,
      当前任务ID: currentTaskId
    });
    return;
  }

  try {
    console.log(`🔍 查询任务结果 (第${retryCount + 1}次):`, taskId);

    const requestUrl = `/api/image/request?taskId=${taskId}`;
    const token = localStorage.getItem('token');
    const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;

    const response = await fetch(requestUrl, {
      headers: {
        'Authorization': bearerToken,
      }
    });

    console.log('📡 查询响应状态:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📸 查询结果:', data);

    if (data.code === 200 && data.data) {
      // 检查返回的图片数据
      const imageUrls = data.data.images || data.data.viewUrls || data.data.ossUrls || [];
      const ossIds = data.data.ossIds || [];

      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        console.log('✅ 查询成功，获取到图片链接:', imageUrls);

        // 设置结果图片
        resultImages.value = imageUrls;
        isViewingResults.value = true;

        // 更新全局图片ID状态
        if (ossIds && Array.isArray(ossIds) && ossIds.length > 0) {
          const newImageId = ossIds[0];
          console.log('🌐 更新全局图片ID:', newImageId);
          shoeStore.setSegmentedImageId(newImageId);
        }

        // 显示结果
        if (imageWorkspaceRef.value) {
          imageWorkspaceRef.value.showResults(imageUrls);
        }

        // 🔥 只显示一次成功提示，避免重复
        if (isProcessingAIImageSwapTask.value) {
          isProcessingAIImageSwapTask.value = false;
        }

        // 重置任务状态，关闭进度条
        shoeStore.setAiTaskStatus('success');
        shoeStore.setAiTaskProgress(100);

        // 延迟一下再重置状态，让用户看到100%的进度
        setTimeout(() => {
          shoeStore.resetAiTask();
        }, 1000);

        return;
      }
    }

    // 如果没有结果且还有重试机会，则重试
    if (retryCount < maxRetries) {
      console.log(`⏳ 暂无结果，${retryDelay}ms后进行第${retryCount + 2}次重试...`);
      setTimeout(() => {
        queryTaskResult(taskId, retryCount + 1);
      }, retryDelay);
    } else {
      console.error('❌ 查询已达最大重试次数，停止重试');
      ElMessage.error('抠图完成但获取结果失败，请重试');
      isProcessingAIImageSwapTask.value = false;
    }

  } catch (error) {
    console.error(`❌ 查询失败 (第${retryCount + 1}次):`, error);

    // 如果还有重试机会，等待后重试
    if (retryCount < maxRetries) {
      console.log(`🔄 ${retryDelay}ms后进行第${retryCount + 2}次重试...`);
      setTimeout(() => {
        queryTaskResult(taskId, retryCount + 1);
      }, retryDelay);
    } else {
      console.error('❌ 查询已达最大重试次数，停止重试');
      ElMessage.error('查询结果失败，请重试');
      isProcessingAIImageSwapTask.value = false;
    }
  }
};

// 启动备用查询机制，确保不会丢失结果
const startBackupQuery = (taskId: string) => {
  console.log('🔄 启动备用查询机制，taskId:', taskId);

  // 🔥 严格验证taskId，确保只为当前任务启动备用查询
  if (taskId !== currentTaskId) {
    console.warn('⚠️ 备用查询的taskId与当前任务ID不匹配，忽略备用查询', {
      备用查询taskId: taskId,
      当前任务ID: currentTaskId
    });
    return;
  }

  // 10秒后开始备用查询，给WebSocket足够的时间
  setTimeout(() => {
    // 🔥 再次验证taskId，确保任务没有被替换
    if (taskId === currentTaskId && isProcessingAIImageSwapTask.value && !isViewingResults.value) {
      console.log('🔄 WebSocket未获取到结果，启动备用查询');
      queryTaskResult(taskId);
    }
  }, 10000);

  // 30秒后强制查询，确保不会永远等待
  setTimeout(() => {
    // 🔥 再次验证taskId，确保任务没有被替换
    if (taskId === currentTaskId && isProcessingAIImageSwapTask.value && !isViewingResults.value) {
      console.log('🔄 强制启动备用查询');
      queryTaskResult(taskId);
    }
  }, 30000);
};

// 处理编辑完成
const completeEditing = () => {
  // User has explicitly completed editing
  console.log('编辑完成')
  // Additional logic can be added here if needed
}

// 处理结果保存
const handleResultSaved = () => {
  ElMessage.success('结果已保存')
}

// 退出结果查看模式
const exitResultsView = () => {
  isViewingResults.value = false
}

// 处理生成按钮点击
const handleGenerate = async () => {
  console.log('🚀 handleGenerate 函数开始执行');
  console.log('🔍 mainImage.value:', mainImage.value);
  console.log('🔍 mainImageName.value:', mainImageName.value);

  if (!mainImage.value || !mainImageName.value) {
    console.log('❌ 图片或图片名称为空，返回');
    ElMessage.warning('请先上传图片')
    return
  }

  console.log('✅ 图片检查通过，开始处理');

  // 🔥 在开始生成前重置结果状态，确保不会显示之前的结果
  resetResultStates();
  
  // 🔥 停止之前的WebSocket连接，确保不会混乱
  stopAiTaskWs();

  // 显示加载中提示
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在抠图中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  isGenerating.value = true

  try {
    isProcessingAIImageSwapTask.value = true; // 设置为AI图片交换任务进行中

    // 使用当前上传的图片ID，避免使用全局状态中的旧ID
    const imageIdToUse = Number(mainImageName.value)
    console.log('🔍 AI图片交换调试信息:', {
      当前上传图片ID: Number(mainImageName.value),
      最终使用ID: imageIdToUse,
      来源: '当前上传的图片',
      全局状态详情: {
        originalId: shoeStore.currentImage.originalId,
        currentId: shoeStore.currentImage.currentId,
        isSegmented: shoeStore.currentImage.isSegmented
      }
    })
    console.log('🔍 全局store的完整状态:', shoeStore.currentImage)

    const requestData: KtRequest = {
      imageId: imageIdToUse
    }

    const response = await kt(requestData)

    console.log('🔍 抠图API完整响应:', response)

    if (response.code === 0 || response.code === 200) {
      // 处理成功响应
      const result = response.data
      console.log('🔍 抠图API返回的data:', result)
      console.log('🔍 data类型:', typeof result)
      console.log('🔍 result是否为字符串:', typeof result === 'string')
      console.log('🔍 result是否存在:', !!result)

      // 检查API响应格式 - 新的API格式：直接返回taskId
      if (result && typeof result === 'string') {
        const taskId = result;
        console.log('✅ 获得taskId:', taskId);
        
        // 🔥 设置当前任务ID，确保taskId一致性
        currentTaskId = taskId;
        console.log('🆔 设置当前任务ID:', currentTaskId);
        
        // 🔥 停止之前的WebSocket连接，确保不会混乱
        stopAiTaskWs();
        
        console.log('🚀 开始设置任务状态...');

        // 立即设置任务状态为运行中，显示进度条
        shoeStore.setAiTaskStatus('running');
        shoeStore.setAiTaskProgress(0);
        console.log('✅ 任务状态已设置为running，进度设置为0');

        // 启动WebSocket监听
        console.log('🔗 启动WebSocket连接...');
        startAiTaskWs(taskId, 'cutout');

        // 同时启动备用查询机制，确保不会丢失结果
        console.log('🔄 启动备用查询机制...');
        startBackupQuery(taskId);

        ElMessage.success('抠图任务已提交，正在处理中...');
        console.log('✅ 抠图任务处理完成，已返回');
        return;
      } else {
        console.log('❌ taskId检查失败，result:', result, 'typeof:', typeof result);
      }

      // 兼容老格式：检查是否有直接返回的图片URL
      if (result && (result.ossUrls || result.viewUrls)) {
        const imageUrls = result.ossUrls || result.viewUrls
        console.log('🔍 检查到直接返回的图片URL:', imageUrls)

        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
          // 如果有直接返回的图片URL，直接使用
          resultImages.value = imageUrls

          // 保存一键抠图返回的ossId
          console.log('🔍 抠图API返回的完整结果:', result)
          console.log('🔍 result.ossIds:', result.ossIds)
          const ossId = result.ossIds && result.ossIds.length > 0 ? result.ossIds[0] : undefined

          // 设置全局状态，让其他功能使用抠图后的ossId
          if (ossId) {
            console.log('🌐 准备设置全局抠图图片ID:', ossId)
            shoeStore.setSegmentedImageId(ossId)
            console.log('🌐 已设置全局抠图图片ID:', ossId)
          } else {
            console.log('⚠️ ossId为空，无法设置全局状态')
          }

          // 显示结果
          isViewingResults.value = true

          // 如果有imageWorkspaceRef，调用其showResults方法
          if (imageWorkspaceRef.value) {
            imageWorkspaceRef.value.showResults(resultImages.value)
          }

          // 🔥 只显示一次成功提示，避免重复
          if (isProcessingAIImageSwapTask.value) {
            isProcessingAIImageSwapTask.value = false
          }
          return;
        }
      }

      // 如果既不是taskId也没有直接的图片URL
      console.error('❌ 未知的API响应格式:', result)
      ElMessage.warning('抠图成功但返回格式异常')
    } else {
      throw new Error(response.msg || '抠图失败')
    }
  } catch (error: any) {
    console.error('抠图失败:', error)
    ElMessage.error('抠图失败: ' + (error.message || '未知错误'))
    isProcessingAIImageSwapTask.value = false // 重置任务状态
  } finally {
    loadingInstance.close()
    isGenerating.value = false
  }
}

const fileList = ref([])

// 监听任务图片和进度，自动渲染
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (Array.isArray(newImages) && newImages.length > 0) {
    // 只有在AI图片交换任务进行中时才显示结果
    if (isProcessingAIImageSwapTask.value) {
      resultImages.value = newImages
      isViewingResults.value = true
      if (imageWorkspaceRef.value) {
        imageWorkspaceRef.value.showResults(newImages)
      }
      // 🔥 只显示一次成功提示，避免重复
      if (isProcessingAIImageSwapTask.value) {
        isProcessingAIImageSwapTask.value = false // 重置任务状态
      }
    }
  }
})

onMounted(() => {
  if (route.query.creativeImg) {
    previewImageMain.value = route.query.creativeImg as string;
    showPreviewDialogMain.value = true;
  }
})

// 页面卸载时断开WebSocket
onUnmounted(() => {
  stopAiTaskWs()
  isProcessingAIImageSwapTask.value = false // 重置任务状态
})

// 结果弹窗相关方法
const closeResultDialog = () => {
  showResultDialog.value = false;
};

const prevImage = () => {
  if (resultDialogIndex.value > 0) {
    resultDialogIndex.value--;
  }
};

const nextImage = () => {
  if (resultDialogIndex.value < resultImages.value.length - 1) {
    resultDialogIndex.value++;
  }
};
</script>

<style scoped>
.ai-image-swap-container {
  width: 100%;
  height: 100vh;
  background: transparent;
  color: #fff;
  padding: 0;
  position: relative;
  z-index: 1;
  margin-left: 0;
  overflow: hidden;
}

/* 添加背景容器 */
.ai-image-swap-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('@/assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -1;
}

.swap-content {
  display: flex;
  gap: 10px;
  height: 100vh;
  padding-left: 110px;
  padding-right: 0;
  padding-top: 0;
  padding-bottom: 0;
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
  display: flex;
  flex-direction: column;
}

.work-area {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  min-width: 0;
}

.right-panel {
  width: 280px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  padding: 15px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
}

.step-section {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.active-step {
  box-shadow: 0 0 15px rgba(0, 163, 255, 0.3);
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
  align-items: center;
  justify-content: center;
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

.hidden-upload {
  display: none;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.generate-btn {
  width: 100%;
  height: 40px;
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
  border-radius: 20px;
  font-size: 16px;
  margin-top: 500px;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 2px 8px #c8ad7f33;
  transition: background 0.2s, color 0.2s;
}

.generate-btn:disabled {
  background: linear-gradient(90deg, #e0cfa0 0%, #f5e6c3 100%);
  opacity: 0.7;
  color: #fff;
}

.generate-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%);
  color: #c8ad7f;
}

.instructions-container {
  max-width: 600px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instructions-content {
  text-align: left;
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

.image-workspace-container {
  width: 100%;
  height: 85%;
  position: relative;
}

.loading-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #fff;
  gap: 10px;
}

.loading-icon {
  font-size: 30px;
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

/* 弹窗样式 */
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

.file-preview .preview-img {
  max-width: 95%;
  max-height: 90%;
  object-fit: contain;
  border: none;
  border-radius: 4px;
  margin-bottom: 10px;
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

.edit-dialog .el-dialog {
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
  height: 100%;
  width: 100%;
}

/* 弹窗样式同步 */
:deep(.el-dialog) {
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  background: rgba(30, 30, 30, 0.98);
  color: #fff;
}

.edit-dialog :deep(.el-dialog) {
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  background: rgba(30, 30, 30, 0.98);
  color: #fff;
  max-width: 95vw;
  max-height: 95vh;
}

/* 结果弹窗样式 */
.result-dialog-content {
  padding: 20px;
}

.result-image-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.result-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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

<style>
.zoom-icon-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  padding: 6px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-icon-btn:hover {
  background: #c8ad7f;
  color: #222;
}

.zoom-icon-btn .el-icon {
  font-size: 20px;
}
</style>