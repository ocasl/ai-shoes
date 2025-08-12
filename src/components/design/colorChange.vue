<template>
  <div class="color-change-page">
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

    <!-- 左侧菜单 -->
    <div class="side-menu">
      <router-link to="/dashboard" class="menu-link">首 页</router-link>
      <router-link to="/design" class="menu-link">设计区</router-link>
      <router-link to="/ai-tools" class="menu-link">AI小工具</router-link>
      <router-link to="/history" class="menu-link">历史记录</router-link>
    </div>
    <!-- 主内容区（原有内容整体右移） -->
    <div class="main-content">
      <div class="ai-image-swap-container">
        <div class="swap-content">
          <!-- 左侧面板 -->
          <div class="left-panel">
            <!-- Step 1 - 主图 -->
            <div class="step-section" :class="{ 'active-step': currentStep === 1 }">
              <div class="step-header" @click="setStep(1)">
                <span class="step-title">Step 1</span>
                <span class="step-desc">上传主图</span>
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
                <div class="step-actions" v-if="mainImage">
                  <el-button type="primary" @click="handleClearMainImage">清除图片</el-button>
                </div>
              </div>
            </div>

            <!-- Step 2 - 副图 -->
            <div class="step-section" :class="{ 'active-step': currentStep === 2 }" style="margin-top: 30px;">
              <div class="step-header" @click="setStep(2)">
                <span class="step-title">Step 2</span>
                <span class="step-desc">上传参考配色图</span>
                <el-tooltip content="帮助信息" placement="top">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
                <span v-if="referenceImage" class="step-status">
                  <el-icon><Check /></el-icon>
                </span>
              </div>
              
              <div class="upload-section">
                <div class="image-preview" @click="handleReferenceUploadClick">
                  <div v-if="referenceImage" class="preview-container" style="position:relative;">
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
                    <el-icon><Plus /></el-icon>
                    <span>点击上传参考图</span>
                  </div>
                  <input ref="fileInputReference" type="file" accept="image/*" style="display:none" @change="handleReferenceFileSelect" />
                </div>
                <div class="step-actions" v-if="referenceImage">
                  <el-button type="primary" @click="handleClearReferenceImage">清除图片</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 中间工作区域 -->
          <div class="work-area">
            <template v-if="isViewingResults && resultImages.length > 0">
              <!-- 只在有结果时展示 -->
              <div class="image-workspace-container">
                <ImageWorkspaceComp 
                  ref="imageWorkspaceRef"
                  :image-url="mainImage"
                  :is-view-results="isViewingResults"
                  :result-images="resultImages"
                  :hide-brush-tool="true"
                  :hideMaskTool="true"
                  @result-saved="handleResultSaved"
                  @exit-results="exitResultsView"
                />
              </div>
            </template>
            <template v-else>
              <!-- 其它情况显示说明或空白 -->
              <div class="instructions-container">
                <div class="instructions-content">
                  <h3>使用说明</h3>
                  <ol>
                    <li>请上传鞋面图</li>
                    <li>点击"生成配色"按钮</li>
                    <li>配色结果将在此区域展示</li>
                  </ol>
                </div>
              </div>
            </template>
          </div>

          <!-- 右侧面板 -->
          <div class="right-panel">
            <!-- 生成按钮 -->
            <el-button 
              type="primary" 
              class="generate-btn" 
              @click="handleGenerate"
              :disabled="!canGenerate"
              :loading="isGenerating"
            >
              {{ shoeStore.aiTaskStatus === 'running' ? '生成中...' : '生成配色' }}
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
                  <img :src="previewImageMain" alt="主图预览" class="preview-img" @error="onImageError" />
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
                      :original-image-name="mainImageName"
                      :hide-brush-tool="true"
                      :hideMaskTool="true"
                      @image-edited="handleImageEdited"
                      @editing-completed="closeEditDialogMain"
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

          <!-- 副图本地预览弹窗 -->
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
                  <img :src="previewImageReference" alt="参考图预览" class="preview-img" @error="onImageError" />
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
                <el-button @click="cancelReferencePreview">取消</el-button>
                <el-button type="primary" @click="confirmReferencePreview" :disabled="!previewImageReference">确定</el-button>
              </div>
            </template>
          </el-dialog>

          <!-- 副图编辑弹窗 -->
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
                      :image-url="referenceImage"
                      :original-image-name="referenceImageName"
                      :hide-brush-tool="true"
                      :hideMaskTool="true"
                      @image-edited="handleReferenceImageEdited"
                      @editing-completed="closeEditDialogReference"
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
              </div>
            </template>
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

          <!-- 副图放大预览弹窗 -->
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, onMounted, watch, onUnmounted } from 'vue'
import { Plus, QuestionFilled, Check, Loading, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import type { UploadInstance } from 'element-plus'
import { uploadImage, feedbackImage, pcxh, } from '../../api/file'
import type { UploadImageResponse, PcxhRequest } from '../../api/file'
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

// 主图本地预览弹窗相关状态
const showPreviewDialogMain = ref(false)
const previewImageMain = ref('')
const selectedFileMain = ref<File | null>(null)
const fileInputMain = ref<HTMLInputElement>()

// 主图编辑弹窗相关状态
const showEditDialogMain = ref(false)

// 新增状态
const mainImageId = ref('')

// 副图相关状态
const referenceImage = ref('')
const referenceImageName = ref<string>('')
const referenceImageId = ref('')
const currentStep = ref(1)

// 副图本地预览弹窗相关状态
const showPreviewDialogReference = ref(false)
const previewImageReference = ref('')
const selectedFileReference = ref<File | null>(null)
const fileInputReference = ref<HTMLInputElement>()

// 副图编辑弹窗相关状态
const showEditDialogReference = ref(false)

// 副图放大预览弹窗相关状态
const showZoomDialogReference = ref(false)
const zoomReference = ref(1)

// 新增：跟踪是否正在处理颜色修改任务
const isProcessingColorChangeTask = ref(false)

// 计算属性 - 需要主图和副图都上传才能生成
const canGenerate = computed(() => {
  return !!mainImage.value && !!mainImageName.value && !!referenceImage.value && !!referenceImageName.value
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

const confirmMainPreview = () => {
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

const handleImageEdited = (editedImageUrl: string, imageId?: number) => {
  mainImage.value = editedImageUrl;
  if (imageId) {
    mainImageName.value = String(imageId);
    
    // 设置全局状态，让其他功能使用编辑后的图片ID
    shoeStore.setOriginalImageId(imageId);
    console.log('🌐 已设置全局编辑后图片ID:', imageId);
  }
  showEditDialogMain.value = false;
};

// 步骤控制方法
const setStep = (step: number) => {
  if (step === 1 || (step === 2 && mainImage.value)) {
    currentStep.value = step
  }
}

// 清除主图
const handleClearMainImage = () => {
  mainImage.value = ''
  mainImageName.value = ''
  mainImageId.value = ''
  if (isViewingResults.value) {
    isViewingResults.value = false
    resultImages.value = []
  }
}

// 清除副图
const handleClearReferenceImage = () => {
  referenceImage.value = ''
  referenceImageName.value = ''
  referenceImageId.value = ''
}

// 副图上传相关方法
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
  let fileToUpload: File | null = null;
  const doUpload = (file: File) => {
    uploadFile(file, (_, imageId) => {
      if (imageId) {
        referenceImageName.value = String(imageId);
        referenceImageId.value = String(imageId);
      }
      referenceImage.value = previewImageReference.value;
      showEditDialogReference.value = true;
      showPreviewDialogReference.value = false;
      if (fileInputReference.value) fileInputReference.value.value = '';
      selectedFileReference.value = null;
      previewImageReference.value = '';
    });
  };
  if (selectedFileReference.value) {
    fileToUpload = selectedFileReference.value;
    doUpload(fileToUpload);
  } else if (previewImageReference.value) {
    if (previewImageReference.value.startsWith('data:image/')) {
      // base64
      fileToUpload = dataURLtoFile(previewImageReference.value, 'referenceImg.jpg');
      doUpload(fileToUpload);
    } else if (previewImageReference.value.startsWith('http') || previewImageReference.value.startsWith('blob:')) {
      // url 或 blob
      fetch(previewImageReference.value)
        .then(res => res.blob())
        .then(blob => {
          fileToUpload = new File([blob], 'referenceImg.jpg', { type: blob.type });
          doUpload(fileToUpload);
        });
    }
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

// 副图编辑弹窗相关方法
const closeEditDialogReference = () => {
  showEditDialogReference.value = false;
};

const handleReferenceImageEdited = (editedImageUrl: string, imageId?: number) => {
  referenceImage.value = editedImageUrl;
  if (imageId) {
    referenceImageName.value = String(imageId);
    referenceImageId.value = String(imageId);
  }
  showEditDialogReference.value = false;
};

// 副图放大预览相关方法
function handleZoomWheelReference(e: WheelEvent) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomReference.value = Math.min(zoomReference.value + 0.1, 5);
  } else {
    zoomReference.value = Math.max(zoomReference.value - 0.1, 0.2);
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

// 监听store中的图片结果
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    // 只有在颜色修改任务进行中时才显示结果
    if (isProcessingColorChangeTask.value) {
      resultImages.value = newImages
      isViewingResults.value = true
      
      // 如果有imageWorkspaceRef，调用其showResults方法
      if (imageWorkspaceRef.value) {
        imageWorkspaceRef.value.showResults(newImages)
      }
      
      ElMessage.success('配色生成成功')
      isProcessingColorChangeTask.value = false // 重置任务状态
    }
  }
}, { deep: true })

// 处理生成按钮点击
const handleGenerate = async () => {
  if (!mainImage.value || !mainImageName.value || !referenceImage.value || !referenceImageName.value) {
    ElMessage.warning('请先上传主图和参考配色图')
    return
  }

  isGenerating.value = true

  try {
    isProcessingColorChangeTask.value = true; // 设置为颜色修改任务进行中
    
    // 使用双图配色API
    const majorIdToUse = Number(mainImageName.value)
    const minorIdToUse = Number(referenceImageName.value)
    console.log('🔍 双图配色调试信息:', {
      主图ID: majorIdToUse,
      副图ID: minorIdToUse,
      主图来源: '当前上传的主图',
      副图来源: '当前上传的参考图'
    })
    
    const requestData: PcxhRequest = {
      majorId: majorIdToUse,
      minorId: minorIdToUse
    }
    
    const response = await pcxh(requestData)

    if (response.code === 0 || response.code === 200) {
      // 处理成功响应
      const result = response.data

      // 检查API响应格式 - 新的API格式：直接返回taskId
      if (result && typeof result === 'string') {
        const taskId = result;
        console.log('获得taskId:', taskId);
        
        // 启动WebSocket监听（内部会设置store状态）
        startAiTaskWs(taskId, 'color');
        
        ElMessage.success('配色任务已提交，正在处理中...');
      } else {
        // 直接处理结果（兼容旧版本）
        if (result && result.viewUrls && Array.isArray(result.viewUrls)) {
          resultImages.value = result.viewUrls

          // 显示结果
          if (resultImages.value.length > 0) {
            isViewingResults.value = true

            // 如果有imageWorkspaceRef，调用其showResults方法
            if (imageWorkspaceRef.value) {
              imageWorkspaceRef.value.showResults(resultImages.value)
            }

            ElMessage.success('配色成功')
          } else {
            ElMessage.warning('配色成功但未获得图片')
          }
        } else {
          ElMessage.warning('返回格式异常')
        }
      }
    } else {
      throw new Error(response.msg || '配色失败')
    }
  } catch (error: any) {
    console.error('配色失败:', error)
    ElMessage.error('配色失败: ' + (error.message || '未知错误'))
    isProcessingColorChangeTask.value = false // 重置任务状态
  } finally {
    isGenerating.value = false
  }
}

const fileList = ref([])

const onImageError = (e: Event) => {
  ElMessage.error('图片加载失败，请检查图片链接或跨域设置');
  // 可选：关闭弹窗或显示占位图
  // showPreviewDialogMain.value = false;
};

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

onMounted(() => {
  console.log('creativeImg:', route.query.creativeImg);
  if (route.query.creativeImg) {
    previewImageMain.value = route.query.creativeImg as string;
    showPreviewDialogMain.value = true;
    console.log('previewImageMain:', previewImageMain.value);
    console.log('showPreviewDialogMain:', showPreviewDialogMain.value);
  }
})

// 组件卸载时停止WebSocket
onUnmounted(() => {
  stopAiTaskWs()
  isProcessingColorChangeTask.value = false // 重置任务状态
})
</script>

<style scoped>
.color-change-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('../../assets/bg.png');
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
  height:  85%;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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