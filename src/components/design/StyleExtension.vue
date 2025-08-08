<template>
  <div class="style-extension-page">
    <!-- 左侧菜单 -->
    <div class="side-menu">
      <router-link to="/dashboard" class="menu-link">首 页</router-link>
      <router-link to="/design" class="menu-link">设计区</router-link>
      <router-link to="/ai-tools" class="menu-link">AI小工具</router-link>
      <router-link to="/history" class="menu-link">历史记录</router-link>
    </div>
    <!-- 主内容区（原有内容整体右移） -->
    <div class="main-content">
      <div class="style-extension-container">
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
            <div class="step-section" :class="{ 'active-step': currentStep === 1 }">
              <div class="step-header" @click="setStep(1)">
                <span class="step-title">Step 1</span>
                <span class="step-desc">上传要改款的鞋款</span>
                <el-tooltip content="帮助信息" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
                <span v-if="mainImage" class="step-status">
                  <el-icon><Check /></el-icon>
                </span>
              </div>
              <div class="upload-section">
                <div class="image-preview" @click="handleMainUploadClick">
                  <div v-if="mainImage" class="preview-container" style="position:relative;">
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
              </div>
            </div>
          </div>

          <!-- 中间工作区域 -->
          <div class="work-area">
            <template v-if="!mainImage">
              <div class="instructions-container">
                <div class="instructions-content">
                  <h3>使用说明</h3>
                  <ol>
                    <li>请上传背景干净无杂物的产品图，单只鞋的白底图最佳</li>
                    <li>文本描述非必填，不描述时由AI自动进行改款</li>
                    <li>在参数调整中，想象力数值越大，则生成款式越与原图不同</li>
                  </ol>
                </div>
              </div>
            </template>
            <template v-if="isViewingResults">
              <div class="image-workspace-container">
                <ImageWorkspaceComp
                  :is-view-results="true"
                  :result-images="resultDialogImages"
                  :image-url="mainImage"
                  :original-image-name="mainImageName"
                  @exit-results="exitResultsView"
                  ref="resultsWorkspaceRef"
                />
              </div>
            </template>
          </div>

          <!-- 右侧面板 -->
          <div class="right-panel">
            <!-- Step 2 -->
            <div class="step-section" :class="{ 'active-step': currentStep === 2 }">
              <div class="step-header" @click="setStep(2)">
                <span class="step-title">Step 2</span>
                <span class="step-desc">参数调整</span>
              </div>
              <div class="params-section">
                <div class="param-item">
                  <span>想象力</span>
                  <el-slider v-model="denoiseValue" :min="1" :max="10" :step="1" />
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
                <el-button type="primary" @click="confirmMainPreview" :disabled="!previewImageMain">确定</el-button>
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
                      :image-url="mainImage"
                      @image-edited="handleMainImageEdited"
                      @editing-completed="closeEditDialogMain"
                      :hide-mask-tool="true"
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

          <!-- 结果查看弹窗 -->
          <el-dialog 
            v-model="showResultDialog" 
            title="结果查看" 
            width="800px" 
            :close-on-click-modal="false"
            @close="closeResultDialog"
          >
            <div class="result-dialog-content">
              <div class="image-preview" style="position:relative;">
                <img :src="resultDialogImages[resultDialogIndex]" alt="结果预览" class="preview-img" />
                <button class="zoom-icon-btn" @click.stop="showZoomDialog = true" v-if="resultDialogImages.length">
                  <el-icon><ZoomIn /></el-icon>
                </button>
              </div>
            </div>
            <template #footer>
              <div class="dialog-footer">
                <el-button @click="closeResultDialog">关闭</el-button>
              </div>
            </template>
          </el-dialog>

          <!-- 结果图放大预览弹窗 -->
          <el-dialog v-model="showZoomDialog" width="80vw" :close-on-click-modal="true" :modal-style="{ height: '78vh' }" style="height:78vh;" class="zoom-dialog">
            <div
              class="zoom-img-container"
              @wheel="handleZoomWheel"
              style="height:calc(78vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;"
            >
              <img
                :src="resultDialogImages[resultDialogIndex]"
                alt="放大预览"
                :style="`max-width:100%;max-height:78vh;transform:scale(${zoom});transition:transform 0.2s;display:block;margin:auto;`"
              />
            </div>
            <div style="margin-top:8px;color:#222;text-align:center;">缩放：{{ (zoom * 100).toFixed(0) }}%</div>
          </el-dialog>

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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { Plus, QuestionFilled, Check, Loading, ZoomIn } from '@element-plus/icons-vue'
import type { UploadInstance } from 'element-plus'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import ModelSelector from '../common/ModelSelector.vue'
import { uploadImage, feedbackImage, isUserLoggedIn, tstok } from '../../api/file'
import type { UploadImageResponse, TstokRequest } from '../../api/file'
import { useRouter, useRoute } from 'vue-router'
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

// 异步加载图片工作区组件
const ImageWorkspaceComp = defineAsyncComponent(() => 
  import('./ImageWorkspace.vue')
)

// 获取路由器
const router = useRouter()
const route = useRoute()

// 获取store
const shoeStore = useShoeStore()

// 状态管理
const mainImage = ref('')
const mainImageName = ref('') // 保存上传后的主图文件名
const mainImageId = ref('')
const denoiseValue = ref(5) // 默认为中间值
const selectedModel = ref(0)
const selectedModelName = ref('') // 保存选择的鞋子类型名称
const currentStep = ref(1)

// 编辑状态
const isEditingMainImage = ref(false)

// 结果查看相关
const isViewingResults = ref(false)
const generatedImages = ref<string[]>([])
const mainImageWorkspaceRef = ref(null)
const resultsWorkspaceRef = ref(null)

// 新增：跟踪是否正在处理款式延伸任务
const isProcessingStyleExtensionTask = ref(false)

// 引用上传组件
const mainImageUploadRef = ref<UploadInstance | null>(null)

// 主图本地预览弹窗相关状态
const showPreviewDialogMain = ref(false)
const previewImageMain = ref('')
const selectedFileMain = ref<File | null>(null)
const fileInputMain = ref<HTMLInputElement>()

// 主图编辑弹窗相关状态
const showEditDialogMain = ref(false)

// 新增 fileList 状态
const fileList = ref([])

// 结果查看弹窗相关状态
const showResultDialog = ref(false)
const resultDialogImages = ref<string[]>([])
const resultDialogIndex = ref(0)

// 结果图放大预览弹窗相关状态
const showZoomDialog = ref(false);
const zoom = ref(1);
function handleZoomWheel(e: WheelEvent) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoom.value = Math.min(zoom.value + 0.1, 5);
  } else {
    zoom.value = Math.max(zoom.value - 0.1, 0.2);
  }
}

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
  return !!mainImage.value && mainImageId.value !== null
})

// 步骤控制方法
const setStep = (step: number) => {
  if (step === 1 || (step === 2 && mainImage.value)) {
    currentStep.value = step
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
  let fileToUpload: File | null = null;
  const doUpload = (file: File) => {
    uploadFile(file, 'input', (_, imageId) => {
      if (imageId) {
        mainImageName.value = String(imageId);
        mainImageId.value = String(imageId);
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

function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

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

const handleMainImageEdited = (editedImageUrl: string, imageId?: number | string) => {
  mainImage.value = editedImageUrl;
  if (imageId !== undefined) {
    mainImageId.value = imageId.toString();
    mainImageName.value = imageId.toString();
    showEditDialogMain.value = false;
    return;
  }
  showEditDialogMain.value = false;
};

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

// 封装文件上传和回显流程
const uploadFile = (file: File, type: 'input' | 'output', callback?: (imageUrl: string, imageName?: string) => void) => {
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
          const imageData = response.data as UploadImageResponse;
          const imageId = imageData.id;
          // 直接用后端返回的图片URL字符串
          const imageUrl = imageData.url || imageData.imageUrl || imageData.path || '';
          if (callback) callback(imageUrl, imageId);
          ElMessage.success('图片上传成功');
        } else {
          throw new Error(response.msg || '上传失败');
        }
      })
      .catch((error: any) => {
        ElMessage.error('图片上传失败: ' + (error.message || '未知错误'));
      })
      .then(() => {
        loading.close();
      });
  }
}

// 处理结果图选择
const handleResultSelected = () => {
  // 用户选择了一张结果图片，可以在这里添加额外逻辑
  console.log('用户选择了一张结果图片')
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

// 处理模型加载错误
const handleModelLoadError = (errorMsg: string) => {
  console.error('模型加载错误:', errorMsg)
  ElMessage.error(errorMsg)
}

// 退出结果查看模式
const exitResultsView = () => {
  console.log("退出结果查看模式");
  isViewingResults.value = false;
  generatedImages.value = [];
  resultDialogImages.value = []; // 同时重置 resultDialogImages
  
  // 如果resultsWorkspaceRef存在，也重置它的状态
  if (resultsWorkspaceRef.value) {
    try {
      // @ts-ignore
      resultsWorkspaceRef.value.isViewingResults = false;
      // @ts-ignore
      resultsWorkspaceRef.value.resultImages = [];
    } catch (e) {
      console.error("重置resultsWorkspaceRef状态失败:", e);
    }
  }
}

// 监听store中的图片结果
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    // 只有在款式延伸任务进行中时才显示结果
    if (isProcessingStyleExtensionTask.value) {
      generatedImages.value = newImages
      resultDialogImages.value = newImages // 同时设置 resultDialogImages
      isViewingResults.value = true
      
      // 如果有resultsWorkspaceRef，调用其showResults方法
      if (resultsWorkspaceRef.value) {
        resultsWorkspaceRef.value.showResults(newImages)
      }
      
      ElMessage.success("款式延伸生成成功");
      isProcessingStyleExtensionTask.value = false // 重置任务状态
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
  if (mainImageId.value == null) {
    ElMessage.warning("请先将图片上传至服务器");
    return;
  }

  try {
    isProcessingStyleExtensionTask.value = true; // 设置为款式延伸任务进行中
    
    // 使用当前上传的图片ID，避免使用全局状态中的旧ID
    const imageIdToUse = parseInt(mainImageName.value)
    console.log("🔍 款式延伸调试信息:", {
      当前上传图片ID: parseInt(mainImageName.value),
      最终使用ID: imageIdToUse,
      来源: '当前上传的图片'
    });

    // 准备请求参数
    const requestData: TstokRequest = { 
      imageId: imageIdToUse,
      loreName: selectedModelName.value || '通用款式生成',
      denoise: denoiseValue.value 
    };
    
    // 发送请求
    console.log("发送款式延伸请求:", requestData);
    const response = await tstok(requestData);
    console.log("收到款式延伸响应:", response);

    const result = response.data;
    let imageUrls: string[] = [];
    // 优先检查 ossUrls，兼容 viewUrls
    if (result && (result.ossUrls || result.viewUrls)) {
      imageUrls = result.ossUrls || result.viewUrls;
    }

    // 优先处理直接结果，如果有的话
    if (imageUrls.length > 0) {
      console.log('直接处理结果图片:', imageUrls);
      generatedImages.value = imageUrls;
      resultDialogImages.value = imageUrls; // 同时设置 resultDialogImages
      isViewingResults.value = true;
      
      // 如果有resultsWorkspaceRef，调用其showResults方法
      if (resultsWorkspaceRef.value) {
        resultsWorkspaceRef.value.showResults(imageUrls)
      }
      
      ElMessage.success("款式延伸生成成功");
      isProcessingStyleExtensionTask.value = false; // 重置任务状态
      return; // 直接返回，不启动WebSocket
    }
    
    // 如果没有直接结果，但有WebSocket参数，则启动WebSocket监听
    if (result && result.promptId && result.clientId && result.server) {
      console.log('WebSocket参数:', result.promptId, result.clientId, result.server);
      shoeStore.setAiTaskInfo({
        promptId: result.promptId,
        clientId: result.clientId,
        server: result.server
      });
              startAiTaskWs(result.clientId, result.server, result.promptId, 'style-extension');
      // 让 watch 监听 WebSocket 结果
    } else {
      ElMessage.warning("生成成功但未获得图片");
      isProcessingStyleExtensionTask.value = false; // 重置任务状态
    }
  } catch (error: any) {
    console.error("款式延伸失败:", error);
    ElMessage.error("生成失败: " + (error.message || "未知错误"));
    isProcessingStyleExtensionTask.value = false // 重置任务状态
  }
};

// 结果查看弹窗相关方法
const closeResultDialog = () => {
  showResultDialog.value = false;
  resultDialogImages.value = [];
  resultDialogIndex.value = 0;
};

// 跳转二创页面时，creativeImg 传递 resultDialogImages.value 的最后一项
// function handleTwoChuangSelect(option) {
//   let img = resultDialogImages.value[resultDialogImages.value.length - 1];
//   let ossId = '';
//   router.push({ path: option.path, query: { creativeImg: img, ossId } });
// }

onMounted(() => {
  if (route.query.creativeImg) {
    previewImageMain.value = route.query.creativeImg as string;
    showPreviewDialogMain.value = true;
  }
});

// 组件卸载时停止WebSocket
onUnmounted(() => {
  stopAiTaskWs()
  isProcessingStyleExtensionTask.value = false // 重置任务状态
})
</script>

<style scoped>
.style-extension-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('@/assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: row;
}
.side-menu {
  position: fixed;
  left: 0;
  top: 40%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  z-index: 10;
  width: 100px;
  background: none;
  padding: 0;
}
.menu-link {
  color: #fff;
  font-size: 16px;
  text-decoration: none;
  margin: 30px 0;
  text-align: center;
  transition: color 0.2s;
}
.menu-link.router-link-active {
  color: #c8ad7f;
  font-weight: bold;
  text-decoration: underline;
}
.menu-link:hover {
  color: #c8ad7f;
}
.main-content {
  flex: 1;
 
  min-height: 100vh;
}
.style-extension-container {
  width: 100%;
  min-height: 100vh;
  background: transparent;
  color: #fff;
  padding: 20px;
  position: relative;
  margin-left: 80px;
}

.style-extension-container::before {
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
  min-height: calc(100vh - 40px);
  height: auto;
  padding: 20px;
  max-width: calc(100vw - 100px);
  position: relative;
  z-index: 2;
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
  border: 1px dashed transparent;
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
  border-color: transparent;
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
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
  border-radius: 20px;
  font-size: 16px;
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

/* 金色slider样式 */
:deep(.el-slider__bar) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%) !important;
}
:deep(.el-slider__button) {
  border-color: #c8ad7f !important;
  background: #fffbe6 !important;
  box-shadow: 0 0 0 2px #c8ad7f33;
}
:deep(.el-slider__runway) {
  background: #f5e6c3 !important;
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
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-workspace-containers{
  height: 600px;
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

.file-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.file-info p {
  margin: 2px 0;
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
.edit-dialog :deep(.el-dialog) {
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

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 结果查看弹窗样式 */
.result-dialog-content {
  padding: 20px;
}

.result-dialog-content .image-preview {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.result-dialog-content .preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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