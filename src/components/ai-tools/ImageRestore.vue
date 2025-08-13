<template>
  <div class="image-restore-container">
    <div class="restore-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- Step 1 -->
        <div class="step-section">
          <div class="step-header">
            <span class="step-title">Step 1</span>
            <span class="step-desc">上传要修复的图片</span>
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
                <button class="zoom-icon-btn" type="button" @click.stop="showZoomDialogMain = true">
                  <el-icon><ZoomIn /></el-icon>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <span>点击上传图片</span>
              </div>
              <input ref="fileInputMain" type="file" accept="image/*" style="display:none" @change="handleMainFileSelect" />
            </div>

            <!-- 标记可改区域按钮 -->
            <div 
              v-if="mainImage" 
              class="mark-area" 
              @click="showSelectionOptions"
            >
              <el-icon><Brush /></el-icon>
              <span>标记修复区域</span>
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
                <li>请点击"标记修复区域"选取或涂抹需要修复的目标区域</li>
                <li>修复因抠图产生的缺失 在缺失部分涂抹</li>
                <!-- <li>修复功能可以帮助去除图片中的瑕疵、划痕或不需要的元素</li> -->
              </ol>
            </div>
          </div>
        </template>

        <!-- 显示主图工作区 -->
        <Suspense v-else-if="isEditingMainImage">
          <template #default>
            <div class="image-workspace-container">
              <ImageWorkspaceComp
                :image-url="mainImage"
                :original-image-name="String(mainImageName)"
                @image-edited="handleMainImageEdited"
                @editing-completed="completeMainImageEditing"
                ref="mainImageWorkspaceRef"
                :mask-id-plus-one="true"
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

        <!-- 结果查看区域 -->
        <Suspense v-else-if="isViewingResults">
          <template #default>
            <div class="image-workspace-container">
              <ImageWorkspaceComp
                :image-url="mainImage"
                :original-image-name="String(mainImageName)"
                :is-view-results="true"
                :result-images="resultImages"
                @image-edited="handleResultSelected"
                @exit-results="exitResultsView"
                ref="resultsWorkspaceRef"
                :mask-id-plus-one="true"
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

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 使用说明 -->
        <el-collapse v-model="activeCollapse">
          <el-collapse-item title="图片修复说明" name="instructions">
            <div class="usage-guide">
              <ol>
                <li>请点击"标记修复区域"选取或涂抹需要修复的目标区域</li>
                <li>修复因抠图产生的缺失 在缺失部分涂抹</li>
                <!-- <li>在AI运行中，左键点击目标区域为选取，右键点击目标区域为排除</li> -->
                <!-- <li>修复功能可以帮助去除图片中的瑕疵、划痕或不需要的元素</li> -->
              </ol>
            </div>
          </el-collapse-item>
        </el-collapse>
        
        <!-- 生成按钮 -->
        <el-button 
          type="primary" 
          class="generate-btn" 
          @click="handleGenerate"
          :disabled="!canGenerate"
        >
          {{ shoeStore.aiTaskStatus === 'running' ? '修复中...' : '立即修复' }}
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
        title="图片编辑" 
        width="50%" 
        :close-on-click-modal="false" 
        class="edit-dialog"
      >
        <div class="edit-modal-content">
          <Suspense>
            <template #default>
              <div class="image-workspace-container">
                <ImageWorkspaceComp
                  ref="editDialogWorkspaceRef"
                  :image-url="mainImage"
                  :original-image-name="String(mainImageName)"
                  @image-edited="handleMainImageEdited"
                  @editing-completed="closeEditDialogMain"
                  :mask-id-plus-one="true"
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

      <!-- 标记可选区域选项弹窗 -->
      <SelectionOptionsDialog
        v-model="showSelectionDialog"
        @select="handleSelectOption"
      />

      <!-- 主图放大预览弹窗 -->
      <el-dialog
        v-model="showZoomDialogMain"
        width="80vw"
        :close-on-click-modal="true"
        :modal-style="{ height: '78vh' }"
        style="height:78vh;"
        class="zoom-dialog"
      >
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

      <!-- 图片加载中弹窗 -->
      <div v-if="shoeStore.aiTaskStatus === 'loading_result'" class="loading-overlay">
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">AI处理完成，图片正在加载中...</div>
          <div class="loading-subtitle">请稍候，马上就好</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, Suspense, nextTick, onMounted, watch, onUnmounted } from 'vue'
import { Plus, QuestionFilled, Close, Brush, Check, Loading, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import type { UploadInstance } from 'element-plus'
import { uploadImage, feedbackImage, isUserLoggedIn, xf } from '../../api/file'
import type { UploadImageResponse, XfRequest } from '../../api/file'
import { useRouter, useRoute } from 'vue-router'
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

// 异步引入图片工作区组件
const ImageWorkspaceComp = defineAsyncComponent(() => 
  import('../design/ImageWorkspace.vue')
)

// 引入选择对话框组件
const SelectionOptionsDialog = defineAsyncComponent(() => 
  import('../common/SelectionOptionsDialog.vue')
)

// 获取路由器
const router = useRouter()
const route = useRoute()

// 获取store
const shoeStore = useShoeStore()

// 状态管理
const mainImage = ref('')
const mainImageName = ref<string | number>('') // 保存上传后的主图ID
const originalImageId = ref<string | number>('') // 保存最初上传的图片ID，用于xf请求
const activeCollapse = ref(['instructions'])
const isGenerating = ref(false)
const isViewingResults = ref(false)
const resultImages = ref<string[]>([])
const uploadRef = ref<UploadInstance | null>(null)
const imageWorkspaceRef = ref<any | null>(null)
const showPreviewDialogMain = ref(false)
const showEditDialogMain = ref(false)
const previewImageMain = ref('')
const selectedFileMain = ref<File|null>(null)
const fileInputMain = ref<HTMLInputElement>()
const isEditingMainImage = ref(false)
const resultsWorkspaceRef = ref(null)
const editDialogWorkspaceRef = ref<any>(null)

// 标记可选区域选项弹窗相关状态
const showSelectionDialog = ref(false)
const mainImageId = ref('')

// 新增：跟踪是否正在处理图片修复任务
const isProcessingImageRestoreTask = ref(false)

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
  return !!mainImage.value && !!mainImageName.value && !isEditingMainImage.value
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
    uploadFile(file, 'input', (_, imageId) => {
      if (imageId) {
        mainImageName.value = imageId;
        originalImageId.value = imageId; // 保存最初上传的图片ID
        
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

const handleMainImageEdited = (editedImageUrl: string, imageId?: number) => {
  mainImage.value = editedImageUrl;
  if (imageId) {
    mainImageName.value = imageId;
    console.log('🔍 图片编辑完成，更新为最新图片ID:', imageId);
  } else {
    console.log('🔍 图片编辑完成，但未获取到新的图片ID');
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

// 将dataURL转换为Blob对象
const dataURLtoBlob = (dataURL: string) => {
  const parts = dataURL.split(";base64,");
  const contentType = parts[0].split(":")[1];
  const raw = window.atob(parts[1]);
  const uInt8Array = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

// 封装文件上传和回显流程
const uploadFile = (
  file: File,
  type: "input" | "output",
  callback?: (imageUrl: string, imageId?: number) => void
) => {
  // 检查用户是否已登录
  if (!isUserLoggedIn()) {
    ElMessageBox.confirm(
      "您需要登录才能上传图片。是否现在登录？",
      "未登录提示",
      {
        confirmButtonText: "去登录",
        cancelButtonText: "取消",
        type: "warning",
      }
    )
      .then(() => {
        // 保存当前页面路径，登录后可以返回
        localStorage.setItem(
          "redirectAfterLogin",
          router.currentRoute.value.fullPath
        );
        // 导航到登录页
        router.push("/login");
      })
      .catch(() => {
        ElMessage.info("您可以继续使用本地图片预览功能，但无法保存到服务器");
      });

    // 仍然显示本地预览
    const reader = new FileReader();
    reader.onload = (e) => {
      if (callback && e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    return;
  }

  // 显示加载提示
  const loading = ElLoading.service({
    lock: true,
    text: "图片上传中...",
    background: "rgba(0, 0, 0, 0.7)",
  });

  // 检查文件大小，如果超过10MB则压缩
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning("图片过大，正在压缩...");
    compressImage(file)
      .then((compressedFile) => {
        doUpload(compressedFile);
      })
      .catch((err) => {
        ElMessage.error("图片压缩失败：" + err.message);
        loading.close();
      });
  } else {
    doUpload(file);
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
        ElMessage.error({
          message: '图片上传失败: ' + (error.message || '未知错误'),
          duration: 5000,
        });
      })
      .then(() => {
        loading.close();
      });
  }
}

// 标记可选区域选项弹窗相关方法
const showSelectionOptions = () => {
  showSelectionDialog.value = true;
};

// 处理选项选择
const handleSelectOption = (option: string) => {
  showSelectionDialog.value = false;
  
  if (option === 'brush') {
    // 涂抹选区 - 打开编辑弹窗并切换到mask工具
    showEditDialogMain.value = true;
    
    // 弹窗打开后，自动切换到"标记可选"工具
    nextTick(() => {
        if (editDialogWorkspaceRef.value && typeof editDialogWorkspaceRef.value.openToolModal === 'function') {
          editDialogWorkspaceRef.value.openToolModal('mask');
        }
    });
  } else if (option === 'smart') {
    // 智能选区 - 直接使用isEditingMainImage和smartSelect工具
    isEditingMainImage.value = true;
    
    nextTick(() => {
        if (imageWorkspaceRef.value && typeof imageWorkspaceRef.value.selectTool === 'function') {
          imageWorkspaceRef.value.selectTool('smartSelect');
        }
    });
  }
};

// 添加完成编辑方法
const completeMainImageEditing = () => {
  isEditingMainImage.value = false;
}

// 处理结果图选择
const handleResultSelected = () => {
  console.log("用户选择了一张结果图片");
}

// 退出结果查看模式
const exitResultsView = () => {
  isViewingResults.value = false;
}

// 处理生成按钮点击
const handleGenerate = async () => {
  if (!mainImage.value || !mainImageName.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  // 验证用户登录
  if (!isUserLoggedIn()) {
    ElMessageBox.confirm(
      '您需要登录才能使用修复功能。是否现在登录？',
      '未登录提示',
      {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      localStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
      router.push('/login')
    })
    return
  }

  // 显示加载中提示
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在修复中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  
  isGenerating.value = true

  try {
    isProcessingImageRestoreTask.value = true; // 设置为图片修复任务进行中
    
    // 使用当前正在编辑的图片ID（最新的图片ID）
    const imageIdToUse = Number(mainImageName.value)
    console.log('🔍 图片修复调试信息:', {
      最初上传图片ID: Number(originalImageId.value),
      mainImageName当前值: mainImageName.value,
      最终使用ID: imageIdToUse,
      来源: '当前编辑图片ID'
    })
    
    // 准备请求参数
    const requestData: XfRequest = {
      imageId: imageIdToUse,
      isMask: 1 // 使用蒙版模式
    }
    
    // 发送请求
    const response = await xf(requestData)
    
    if (response.code === 0 || response.code === 200) {
      // 处理成功响应
      const result = response.data
      
      // 检查API响应格式 - 新的API格式：直接返回taskId
      if (result && typeof result === 'string') {
        const taskId = result;
        console.log('获得taskId:', taskId);
        
        // 启动WebSocket监听（内部会设置store状态）
        startAiTaskWs(taskId, 'image-restore');
        
        ElMessage.success('图片修复任务已提交，正在处理中...');
      } else if (result && result.viewUrls && Array.isArray(result.viewUrls)) {
        // 直接返回结果的情况
        resultImages.value = result.viewUrls
        
        // 显示结果
        if (resultImages.value.length > 0) {
          isViewingResults.value = true
          
          // 如果有resultsWorkspaceRef，调用其showResults方法
          if (resultsWorkspaceRef.value) {
            // @ts-ignore
            resultsWorkspaceRef.value.showResults(resultImages.value)
          }
          
          ElMessage.success('图片修复成功')
        } else {
          throw new Error('修复成功但未获得图片')
        }
      } else {
        throw new Error('未获取到有效的结果图片')
      }
    } else {
      // 处理特定的错误码
      if (response.code === 1013) {
        throw new Error('请先选择需要更改的区域！')
      } else {
        throw new Error(response.msg || '修复图片失败')
      }
    }
  } catch (error: any) {
    console.error('图像修复失败:', error)
    ElMessage.error('修复失败: ' + (error.message || '未知错误'))
    isProcessingImageRestoreTask.value = false // 重置任务状态
    isViewingResults.value = false
  } finally {
    loadingInstance.close()
    isGenerating.value = false
  }
}

// 处理保存结果
const handleResultSaved = () => {
  ElMessage.success('结果已保存')
}

// 监听任务图片和进度，自动渲染
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (Array.isArray(newImages) && newImages.length > 0) {
    // 只有在图片修复任务进行中时才显示结果
    if (isProcessingImageRestoreTask.value) {
      resultImages.value = newImages
      isViewingResults.value = true
      if (resultsWorkspaceRef.value) {
        // @ts-ignore
        resultsWorkspaceRef.value.showResults(newImages)
      }
      ElMessage.success('图片修复成功')
      isProcessingImageRestoreTask.value = false // 重置任务状态
    }
  }
})

onMounted(() => {
  if (route.query.creativeImg) {
    previewImageMain.value = route.query.creativeImg as string;
    showPreviewDialogMain.value = true;
  }
})

// 监听mainImageName的变化，用于调试
watch(() => mainImageName.value, (newVal, oldVal) => {
  console.log('🔍 mainImageName 发生变化:', {
    旧值: oldVal,
    新值: newVal,
    调用栈: new Error().stack
  })
})

// 页面卸载时断开WebSocket
onUnmounted(() => {
  stopAiTaskWs()
  isProcessingImageRestoreTask.value = false // 重置任务状态
})
</script>

<style scoped>
.image-restore-container {
  width: 100%;
  min-height: 100vh;
  background: transparent;
  color: #fff;
  padding: 20px;
  position: relative;
  margin-left: 80px;
}

.image-restore-container::before {
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

.restore-content {
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

/* 右侧按钮样式 */
.right-panel .generate-btn {
  width: 100%;
  margin-top: 300px;
  height: 46px;
  font-size: 16px;
  font-weight: bold;
}

.step-section {
  margin-bottom: 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
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

.close-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 4px;
}

/* 标记可改区域的样式 */
.mark-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(200, 173, 127, 0.1);
  border: 1px solid rgba(200, 173, 127, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 500;
  color: #c8ad7f;
}

.mark-area:hover {
  background: rgba(200, 173, 127, 0.2);
  border-color: rgba(200, 173, 127, 0.5);
  transform: translateY(-2px);
  color: #fff;
}

.mark-area .el-icon {
  font-size: 16px;
  color: #c8ad7f;
}

.usage-guide {
  color: #ffd700;
  padding: 10px;
}

.usage-guide ol {
  padding-left: 15px;
}

.usage-guide li {
  margin-bottom: 8px;
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
  margin-top: 20px;
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

.empty-placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-size: 18px;
}

:deep(.el-collapse) {
  border: none;
  background: transparent;
}

:deep(.el-collapse-item__header) {
  background: transparent;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.el-collapse-item__content) {
  background: transparent;
  color: #fff;
  padding: 0;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
  border: none;
}

:deep(.el-collapse-item__arrow) {
  color: #fff;
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

.image-workspace-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
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

/* 全屏进度条样式 */
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
  backdrop-filter: blur(5px);
}

.progress-modal {
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

.progress-content {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.progress-title {
  color: #c8ad7f;
  font-weight: bold;
  font-size: 16px;
}

.progress-percentage {
  color: #00FF00;
  font-weight: bold;
  font-size: 16px;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c8ad7f;
  font-size: 14px;
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