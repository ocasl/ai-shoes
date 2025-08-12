<template>
  <div class="hd-enhance-container">
    <div class="enhance-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- Step 1 -->
        <div class="step-section" :class="{ 'active-step': true }">
          <div class="step-header">
            <span class="step-title">Step 1</span>
            <span class="step-desc">上传需要放大的图片</span>
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
            <div class="step-actions" v-if="mainImage">
              <el-button type="primary" @click="mainImage = ''; mainImageName = ''">清除图片</el-button>
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
                <li>上传需要放大的图片（图片越清晰效果越好）</li>
                <li>点击"立即放大"按钮开始处理</li>
                <li>系统将自动提升图像分辨率和清晰度</li>
                <li>在结果页面可以对比原图与高清图的差异</li>
              </ol>
            </div>
          </div>
        </template>
        
        <template v-else>
          <!-- 加载状态 -->
          <div v-if="isGenerating" class="loading-state">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <p>图片放大中，请稍候...</p>
          </div>
          
          <!-- 结果显示区域 -->
          <Suspense v-else-if="isViewingResults && resultImages.length > 0">
            <template #default>
              <div class="image-workspace-container">
                <ImageWorkspaceComp
                  :image-url="mainImage"
                  :is-view-results="true"
                  :result-images="resultImages"
                  :hideMaskTool="true"
                  
                  @exit-results="exitResultsView"
                  @result-saved="handleResultSaved"
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
          
          <!-- 空状态 -->
          <!-- <div v-else class="image-workspace-container">
            <ImageWorkspaceComp
              :image-url="mainImage"
              :hideMaskTool="true"
              @image-edited="handleImageEdited"
              ref="imageWorkspaceRef"
            />
          </div> -->
        </template>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 放大结果说明 -->
        <div class="result-info" v-if="isViewingResults">
          <h3>放大结果</h3>
          <div class="info-item">
            <span class="info-label">原始分辨率:</span>
            <span class="info-value">{{ originalResolution }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">放大后分辨率:</span>
            <span class="info-value">{{ enhancedResolution }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">增强倍数:</span>
            <span class="info-value">{{ enhancementFactor }}倍</span>
          </div>
        </div>
        
        <div class="tips-section">
          <h3>提示</h3>
          <ul>
            <li>低分辨率图片会得到更明显的提升效果</li>
            <li>模糊、噪点较多的图片可能会保留一些瑕疵</li>
            <li>处理结果会在您的账号中保存7天</li>
          </ul>
        </div>
        
        <!-- 生成按钮 -->
        <el-button 
          type="primary" 
          class="generate-btn" 
          @click="handleGenerate"
          :loading="isGenerating"
          :disabled="!canGenerate"
        >
          {{ shoeStore.aiTaskStatus === 'running' ? '放大中...' : '立即放大' }}
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
                  :original-image-name="mainImageName"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, onMounted, watch, onUnmounted } from 'vue'
import { Plus, QuestionFilled, Check, Loading, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import type { UploadInstance } from 'element-plus'
import { uploadImage, feedbackImage, isUserLoggedIn, gqfd } from '../../api/file'
import type { UploadImageResponse, GqfdResponse, GqfdRequest } from '../../api/file'
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
const mainImageName = ref<string | number>('') // 保存上传后的主图ID
const isGenerating = ref(false)
const isViewingResults = ref(false)
const resultImages = ref<string[]>([])
const originalResolution = ref('未知')
const enhancedResolution = ref('未知')
const enhancementFactor = ref('未知')
const uploadRef = ref<UploadInstance | null>(null)
const resultsWorkspaceRef = ref(null)
const imageWorkspaceRef = ref(null)

// 新增：跟踪是否正在处理高清放大任务
const isProcessingHDEnhanceTask = ref(false)

// 主图本地预览弹窗相关状态
const showPreviewDialogMain = ref(false)
const previewImageMain = ref('')
const selectedFileMain = ref<File | null>(null)
const fileInputMain = ref<HTMLInputElement>()

// 主图编辑弹窗相关状态
const showEditDialogMain = ref(false)

// 新增状态
const mainImageId = ref('')

// 计算属性
const canGenerate = computed(() => {
  return !!mainImage.value && !!mainImageName.value
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
        mainImageName.value = imageId;
        
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
    mainImageName.value = imageId;
    
    // 设置全局状态，让其他功能使用编辑后的图片ID
    shoeStore.setOriginalImageId(imageId);
    console.log('🌐 已设置全局编辑后图片ID:', imageId);
    
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
        // 记录原始分辨率
        originalResolution.value = `${img.width} × ${img.height}`
        
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

// 封装文件上传和回显流程
const uploadFile = (file: File, callback?: (imageUrl: string, imageId?: number) => void) => {
  // 检查用户是否已登录
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
      // 保存当前页面路径，登录后可以返回
      localStorage.setItem('redirectAfterLogin', router.currentRoute.value.fullPath)
      // 导航到登录页
      router.push('/login')
    }).catch(() => {
      ElMessage.info('您可以继续使用本地图片预览功能，但无法保存到服务器')
    })
    
    // 仍然显示本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      if (callback && e.target?.result) {
        callback(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    
    return
  }
  
  // 显示加载提示
  const loading = ElLoading.service({
    lock: true,
    text: '图片上传中...',
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

// 处理生成按钮点击
const handleGenerate = async () => {
  if (!canGenerate.value) {
    ElMessage.warning('请先上传图片')
    return
  }
  
  // 验证用户登录
  if (!isUserLoggedIn()) {
    ElMessageBox.confirm(
      '您需要登录才能使用高清放大功能。是否现在登录？',
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

  // 显示加载提示
  isGenerating.value = true
  
  try {
    isProcessingHDEnhanceTask.value = true; // 设置为高清放大任务进行中
    
    // 优先使用全局的当前图片ID（抠图后的ossId），如果没有则使用本地图片ID
    const imageIdToUse = Number(mainImageName.value)
    console.log('🔍 高清放大调试信息:', {
      当前上传图片ID: Number(mainImageName.value),
      最终使用ID: imageIdToUse,
      来源: '当前上传的图片'
    })
    
    // 准备请求参数
    const requestData: GqfdRequest = {
      imageId: imageIdToUse
    }
    
    // 发送请求
    const response = await gqfd(requestData)
    
    if (response.code === 0 || response.code === 200) {
      // 处理成功响应
      const result = response.data
      
      // 检查API响应格式 - 新的API格式：直接返回taskId
      if (result && typeof result === 'string') {
        const taskId = result;
        console.log('获得taskId:', taskId);
        
        // 启动WebSocket监听（内部会设置store状态）
        startAiTaskWs(taskId, 'hd-enhance');
        
        ElMessage.success('高清放大任务已提交，正在处理中...');
      } else if (result && result.viewUrls && Array.isArray(result.viewUrls)) {
        // 直接返回结果的情况
        resultImages.value = result.viewUrls
        
        // 获取放大后图片尺寸
        if (resultImages.value.length > 0) {
          const img = new Image()
          img.onload = function() {
            enhancedResolution.value = `${img.width} × ${img.height}`
            
            // 计算放大倍数
            const originalDimensions = originalResolution.value.split('×').map((s: string) => parseInt(s.trim(), 10))
            const enhancedDimensions = enhancedResolution.value.split('×').map((s: string) => parseInt(s.trim(), 10))
            
            if (originalDimensions.length === 2 && enhancedDimensions.length === 2 && 
                !isNaN(originalDimensions[0]) && !isNaN(originalDimensions[1]) &&
                !isNaN(enhancedDimensions[0]) && !isNaN(enhancedDimensions[1])) {
              // 计算面积比作为放大倍数
              const originalArea = originalDimensions[0] * originalDimensions[1]
              const enhancedArea = enhancedDimensions[0] * enhancedDimensions[1]
              const factor = Math.round((enhancedArea / originalArea) * 10) / 10
              enhancementFactor.value = factor.toString()
            }
          }
          img.src = resultImages.value[0]
          
          // 显示结果
          isViewingResults.value = true
          
          // 如果有resultsWorkspaceRef，调用其showResults方法
          if (resultsWorkspaceRef.value) {
            // @ts-ignore
            resultsWorkspaceRef.value.showResults(resultImages.value)
          }
          
          ElMessage.success('图片放大成功')
        } else {
          throw new Error('放大成功但未获得图片')
        }
      } else {
        throw new Error('未获取到有效的结果图片')
      }
    } else {
      // 处理特定的错误码
      if (response.code === 1013) {
        throw new Error('请先选择需要更改的区域！')
      } else {
        throw new Error(response.msg || '放大图片失败')
      }
    }
  } catch (error: any) {
    console.error('高清放大失败:', error)
    ElMessage.error('放大失败: ' + (error.message || '未知错误'))
    isProcessingHDEnhanceTask.value = false // 重置任务状态
    isViewingResults.value = false
  } finally {
    isGenerating.value = false
  }
}

// 退出结果查看模式
const exitResultsView = () => {
  isViewingResults.value = false
  resultImages.value = []
}

// 处理结果保存
const handleResultSaved = (savedImageUrl: string) => {
  console.log('用户保存了高清图片:', savedImageUrl)
  // 可以在这里添加其他处理逻辑，比如记录用户操作等
}

const fileList = ref([])

// 监听任务图片和进度，自动渲染
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (Array.isArray(newImages) && newImages.length > 0) {
    // 只有在高清放大任务进行中时才显示结果
    if (isProcessingHDEnhanceTask.value) {
      resultImages.value = newImages
      isViewingResults.value = true
      if (resultsWorkspaceRef.value) {
        // @ts-ignore
        resultsWorkspaceRef.value.showResults(newImages)
      }
      ElMessage.success('高清放大成功')
      isProcessingHDEnhanceTask.value = false // 重置任务状态
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
  isProcessingHDEnhanceTask.value = false // 重置任务状态
  // 重置store中的任务状态，避免影响其他页面
  shoeStore.resetAiTask()
})

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
</script>

<style scoped>
.hd-enhance-container {
  width: 100%;
  height: 100vh;
  background: transparent;
  color: #fff;
  padding: 0;
  position: relative;
  z-index: 1;
  margin-left: 110px; /* 增加左侧距离，避免与导航栏重叠 */
  overflow: hidden;
  box-sizing: border-box;
}

/* 添加背景容器 */
.hd-enhance-container::before {
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

.enhance-content {
  display: flex;
  gap: 10px;
  height: 100vh;
  padding: 10px;
  width: calc(100vw - 110px); /* 减去左侧导航栏宽度 */
  position: relative;
  z-index: 2;
  overflow: hidden;
  box-sizing: border-box;
}

.left-panel {
  width: 270px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  padding: 10px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 100%;
  flex-shrink: 0; /* 防止左侧面板被压缩 */
}

.work-area {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 0; /* 允许工作区域缩小以适应容器 */
}

.right-panel {
  width: 260px; /* 减小右侧面板宽度 */
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0;
  padding: 15px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 100%;
  overflow-y: auto;
  flex-shrink: 0; /* 防止右侧面板被压缩 */
}

.step-section {
  margin-bottom: 15px;
  border-radius: 0;
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
  border-radius: 0;
  padding: 10px;
}

.image-preview {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 0;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.7);
  gap: 16px;
}

.loading-icon {
  font-size: 36px;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.image-workspace-container {
  width: 100%;
  height: 80%;
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
  border-radius: 0;
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

.result-info {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0;
  padding: 15px;
}

.result-info h3 {
  margin-top: 0;
  color: #00A3FF;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
}

.info-value {
  font-weight: bold;
  color: #fff;
}

.tips-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0;
  padding: 15px;
}

.tips-section h3 {
  margin-top: 0;
  color: #00A3FF;
  margin-bottom: 15px;
}

.tips-section ul {
  color: #ffd700;
  padding-left: 15px;
}

.tips-section li {
  margin-bottom: 8px;
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
  border-radius: 4px;
  margin-bottom: 10px;
  border: none;
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