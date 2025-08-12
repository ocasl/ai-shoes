<template>
  <div class="sole-fusion-container">
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

    <div class="fusion-content">
      <div class="left-panel">
        <!-- Step 1 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 1 }">
          <div class="step-header" @click="setStep(1)">
            <span class="step-title">Step 1</span>
            <span class="step-desc">上传鞋底的鞋款</span>
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
              <div v-if="mainImage" class="preview-container">
                <img :src="mainImage" alt="鞋面图预览" class="preview-img" />
                <div class="change-overlay">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  <span>更换图片</span>
                </div>
                <button class="zoom-icon-btn" @click.stop="showZoomDialogMain = true">
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

            <!-- 添加标记可选区域按钮 -->
            <div v-if="mainImage" class="mark-area" @click="handleMarkArea">
              <el-icon>
                <EditPen />
              </el-icon>
              <span>标记可选区域</span>
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div class="step-section" :class="{ 'active-step': currentStep === 2 }" style="margin-top: 30px;">
          <div class="step-header" @click="setStep(2)">
            <span class="step-title">Step 2</span>
            <span class="step-desc">上传鞋面的鞋款</span>
            <el-tooltip content="帮助信息" placement="top">
              <el-icon>
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
            <span v-if="referenceImage" class="step-status">
              <el-icon>
                <Check />
              </el-icon>
            </span>
          </div>

          <div class="upload-section">
            <div class="image-preview" @click="handleReferenceUploadClick">
              <div v-if="referenceImage" class="preview-container">
                <img :src="referenceImage" alt="鞋底图预览" class="preview-img" />
                <div class="change-overlay">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  <span>更换图片</span>
                </div>
                <button class="zoom-icon-btn" @click.stop="showZoomDialogReference = true">
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
              <input ref="fileInputReference" type="file" accept="image/*" style="display:none"
                @change="handleReferenceFileSelect" />
            </div>

            <!-- 添加标记可选区域按钮 -->
            <div v-if="referenceImage" class="mark-area" @click="showSelectionOptions(2)">
              <el-icon>
                <EditPen />
              </el-icon>
              <span>标记可选区域</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间工作区域 -->
      <div class="work-area">
        <template v-if="isViewingResults">
          <div class="image-workspace-container">
            <ImageWorkspaceComp :is-view-results="true" :result-images="resultDialogImages" :image-url="mainImage"
              :original-image-name="mainImageName" @exit-results="exitResultsView" ref="resultsWorkspaceRef" />
          </div>
        </template>
        <template v-else>
          <template v-if="!mainImage && !referenceImage">
            <div class="instructions-container">
              <div class="instructions-content">
                <h3>使用说明</h3>
                <ol>
                  <li>请上传背景干净无杂物的产品图，单只鞋的正面图最佳</li>
                  <li>请尽量保持主产品与参考图两款鞋子角度一致性以达到最佳生成效果</li>
                  <li>在参数调整中，可以选择不同的蒙版状态来获得不同的效果</li>
                </ol>
              </div>
            </div>
          </template>
          <div v-if="!editModalVisible && !uploadModalVisible">
            <Suspense v-if="isEditingMainImage">
              <template #default>
                <div class="image-workspace-container">
                  <ImageWorkspaceComp :image-url="mainImage" :original-image-name="mainImageName"
                    @image-edited="handleMainImageEdited" @editing-completed="completeStep(1)"
                    ref="mainImageWorkspaceRef" />
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
            <Suspense v-else-if="isEditingReferenceImage">
              <template #default>
                <div class="image-workspace-container">
                  <ImageWorkspaceComp :image-url="referenceImage" :original-image-name="referenceImageName"
                    @image-edited="handleReferenceImageEdited" @editing-completed="completeStep(2)"
                    ref="referenceImageWorkspaceRef" />
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
        </template>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 生成按钮 -->
        <el-button type="primary" class="generate-btn" @click="handleGenerate" :disabled="!canGenerate">
          {{ shoeStore.aiTaskStatus === 'running' ? '生成中...' : '立即生成' }}
        </el-button>

        <div class="nav-buttons">
          <el-button v-if="currentStep > 1" @click="prevStep">
            上一步
          </el-button>
        </div>
      </div>
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

    <!-- 副图本地预览弹窗 -->
    <el-dialog v-model="showPreviewDialogReference" title="副图预览" width="800px" :close-on-click-modal="false"
      @close="cancelReferencePreview">
      <div class="upload-modal-content">
        <div class="upload-area">
          <div v-if="previewImageReference" class="file-preview">
            <img :src="previewImageReference" alt="副图预览" class="preview-img" />
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
          <el-button @click="cancelReferencePreview">取消</el-button>
          <el-button type="primary" @click="confirmReferencePreview" :disabled="!selectedFileReference">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 主图编辑弹窗 -->
    <el-dialog v-model="showEditDialogMain" title="主图编辑" width="50%" :close-on-click-modal="false" class="edit-dialog">
      <div class="edit-modal-content">
        <Suspense>
          <template #default>
            <div class="image-workspace-container">
              <ImageWorkspaceComp ref="editDialogWorkspaceRef" :key="`main-${mainImageName}`" :image-url="mainImage"
                :original-image-name="mainImageName" @image-edited="handleMainImageEdited"
                @editing-completed="closeEditDialogMain" />
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

    <!-- 副图编辑弹窗 -->
    <el-dialog v-model="showEditDialogReference" title="副图编辑" width="50%" :close-on-click-modal="false"
      class="edit-dialog">
      <div class="edit-modal-content">
        <Suspense>
          <template #default>
            <div class="image-workspace-container">
              <ImageWorkspaceComp ref="referenceImageWorkspaceRef" :key="`reference-${referenceImageName}`"
                :image-url="referenceImage" :original-image-name="referenceImageName"
                @image-edited="handleReferenceImageEdited" @editing-completed="closeEditDialogReference" />
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
          <el-button @click="closeEditDialogReference">取消</el-button>
          <!-- <el-button type="primary" @click="closeEditDialogReference">确认编辑</el-button> -->
        </div>
      </template>
    </el-dialog>

    <!-- 标记可选区域选项弹窗 -->
    <SelectionOptionsDialog v-model="showSelectionDialog" @select="handleSelectOption" />

    <!-- 生成结果弹窗 -->
    <!-- <el-dialog
      v-model="showResultDialog"
      title="生成结果"
      width="70%"
      :close-on-click-modal="false"
      @close="resultDialogIndex = 0"
    >
      <div class="result-dialog-content">
        <div class="result-image-box">
          <img
            :src="resultDialogImages[resultDialogIndex]"
            alt="生成结果"
            style="max-width: 100%; max-height: 60vh; display: block; margin: 0 auto;"
          />
          </div>
        <div class="result-dialog-controls" style="text-align: center; margin-top: 16px;">
          <el-button
            :disabled="resultDialogIndex === 0"
            @click="resultDialogIndex--"
            icon="el-icon-arrow-left"
          >上一张</el-button>
          <span style="margin: 0 16px;">{{ resultDialogIndex + 1 }} / {{ resultDialogImages.length }}</span>
          <el-button
            :disabled="resultDialogIndex === resultDialogImages.length - 1"
            @click="resultDialogIndex++"
            icon="el-icon-arrow-right"
          >下一张</el-button>
          </div>
        </div>
    </el-dialog> -->
  </div>
  <el-dialog v-model="showZoomDialogMain" width="80vw" :close-on-click-modal="true" :modal-style="{ height: '78vh' }"
    style="height:78vh;">
    <div class="zoom-img-container" @wheel="handleZoomWheelMain"
      style="height:calc(78vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img :src="mainImage" alt="放大预览"
        :style="`max-width:100%;max-height:78vh;transform:scale(${zoomMain});transition:transform 0.2s;display:block;margin:auto;`" />
    </div>
    <div style="margin-top:8px;color:#fff;text-align:center;">缩放：{{ (zoomMain * 100).toFixed(0) }}%</div>
  </el-dialog>
  <el-dialog v-model="showZoomDialogReference" width="80vw" :close-on-click-modal="true"
    :modal-style="{ height: '78vh' }" style="height:78vh;">
    <div class="zoom-img-container" @wheel="handleZoomWheelReference"
      style="height:calc(78vh - 60px);display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img :src="referenceImage" alt="放大预览"
        :style="`max-width:100%;max-height:78vh;transform:scale(${zoomReference});transition:transform 0.2s;display:block;margin:auto;`" />
    </div>
    <div style="margin-top:8px;color:#fff;text-align:center;">缩放：{{ (zoomReference * 100).toFixed(0) }}%</div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, computed, onMounted, nextTick, watch, onUnmounted } from "vue";
import {
  Plus,
  Loading,
  QuestionFilled,
  Check,
  EditPen,
  ZoomIn,
} from "@element-plus/icons-vue";
// Import the component
const SelectionOptionsDialog = defineAsyncComponent(
  () => import("../common/SelectionOptionsDialog.vue")
);


import type { UploadInstance } from "element-plus";
import { ElMessage, ElLoading, ElMessageBox } from "element-plus";
import {
  uploadImage,
  feedbackImage,
  isUserLoggedIn,

  jbch,
} from "../../api/file";
import type {
  UploadImageResponse,

  JbchRequest,
  JbchResponse,
} from "../../api/file";
import { useRouter, useRoute } from "vue-router";
import { useShoeStore } from '../../store'
import { startAiTaskWs, stopAiTaskWs } from '../../utils/wsTask'

// 引入异步组件
const ImageWorkspaceComp = defineAsyncComponent(
  () => import("./ImageWorkspace.vue")
);

// 获取路由器
const router = useRouter();
const route = useRoute();

// 获取store
const shoeStore = useShoeStore()

// 步骤状态管理
const currentStep = ref(1);
const mainImageWorkspaceRef = ref<any>(null);
const referenceImageWorkspaceRef = ref<any>(null);

// 主图相关状态
const showPreviewDialogMain = ref(false);
const previewImageMain = ref('');
const selectedFileMain = ref<File | null>(null);
const showEditDialogMain = ref(false);
const mainImage = ref('');
const mainImageName = ref('');
const mainImageId = ref<number | null>(null);
const fileInputMain = ref<HTMLInputElement | null>(null);

// 副图相关状态
const showPreviewDialogReference = ref(false);
const previewImageReference = ref('');
const selectedFileReference = ref<File | null>(null);
const showEditDialogReference = ref(false);
const referenceImage = ref('');
const referenceImageName = ref('');
const referenceImageId = ref<number | null>(null);
const fileInputReference = ref<HTMLInputElement | null>(null);

// 状态管理
const maskStates = ref(3);

// 添加编辑状态变量
const isEditingMainImage = ref(false);
const isEditingReferenceImage = ref(false);
const editModalVisible = ref(false);
const uploadModalVisible = ref(false);

// 结果弹窗状态
const showResultDialog = ref(false);
const resultDialogImages = ref<string[]>([]);
const resultDialogIndex = ref(0);

// 新增：结果查看状态
const isViewingResults = ref(false);

// 新增：跟踪是否正在处理局部修改任务
const isProcessingPartialModifyTask = ref(false)

// 标记可选区相关变量
const showSelectionDialog = ref(false);
const currentMarkStep = ref(1);
const editDialogWorkspaceRef = ref<any>(null);

// creativeImg 相关状态
const isCreativeImgMode = ref(false)
const creativeImgFile = ref<File | null>(null)

// 放大预览相关状态
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
const showZoomDialogReference = ref(false);
const zoomReference = ref(1);
function handleZoomWheelReference(e: WheelEvent) {
  e.preventDefault();
  if (e.deltaY < 0) {
    zoomReference.value = Math.min(zoomReference.value + 0.1, 5);
  } else {
    zoomReference.value = Math.max(zoomReference.value - 0.1, 0.2);
  }
}

// 计算属性
const canGenerate = computed(() => {
  return (
    !!mainImage.value &&
    !!referenceImage.value &&
    mainImageId.value != null &&
    referenceImageId.value != null
  );
});

// 步骤控制方法
const setStep = (step: number) => {
  if (step === 1 || (step === 2 && mainImage.value)) {
    currentStep.value = step;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1;
  }
};

// 主图上传
const handleMainUploadClick = () => {
  fileInputMain.value?.click();
};

const handleMainFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    selectedFileMain.value = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImageMain.value = e.target?.result as string;
      showPreviewDialogMain.value = true;
      uploadModalVisible.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const confirmMainPreview = () => {
  if (!selectedFileMain.value) return;
  uploadFile(selectedFileMain.value, 'input', (imageUrl, imageId) => {
    if (imageId) {
      mainImageName.value = String(imageId);
      mainImageId.value = Number(imageId);

      // 重置结果状态，确保新图片不会显示之前的结果
      isViewingResults.value = false;
      resultDialogImages.value = [];
    }
    // 使用服务器返回的图片URL，而不是本地预览图片
    mainImage.value = imageUrl;
    console.log('🔍 主图上传完成，设置mainImage为:', imageUrl, '图片ID:', imageId);
    showEditDialogMain.value = true;
  });
  showPreviewDialogMain.value = false;
  if (fileInputMain.value) fileInputMain.value.value = '';
  selectedFileMain.value = null;
  previewImageMain.value = '';
  isCreativeImgMode.value = false;
  creativeImgFile.value = null;
};

// 副图上传
const handleReferenceUploadClick = () => {
  fileInputReference.value?.click();
};

const handleReferenceFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    selectedFileReference.value = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImageReference.value = e.target?.result as string;
      showPreviewDialogReference.value = true;
      uploadModalVisible.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const confirmReferencePreview = () => {
  if (!selectedFileReference.value) return;
  uploadFile(selectedFileReference.value, 'input', (imageUrl, imageId) => {
    console.log('🔍 副图上传完成，设置referenceImage为:', imageUrl, '图片ID:', imageId);
    if (imageId != null && imageId !== '') referenceImageId.value = Number(imageId);
    referenceImageName.value = imageId?.toString() || '';

    // 重置结果状态，确保新图片不会显示之前的结果
    isViewingResults.value = false;
    resultDialogImages.value = [];

    // 使用服务器返回的图片URL，而不是本地预览图片
    referenceImage.value = imageUrl;
    showEditDialogReference.value = true;
    editModalVisible.value = true;
  });
  showPreviewDialogReference.value = false;
  uploadModalVisible.value = false;
  // 清空文件输入框
  if (fileInputReference.value) {
    fileInputReference.value.value = '';
  }
  selectedFileReference.value = null;
  previewImageReference.value = '';

  // 如果两张图片都上传完成，自动进入第2步
  if (mainImage.value && referenceImage.value && mainImageId.value != null && referenceImageId.value != null) {
    currentStep.value = 2;
  }
};

// 上传文件到服务器
function uploadFile(file: File, type: "input" | "output", callback?: (imageUrl: string, imageId?: number | string) => void) {
  if (!isUserLoggedIn()) {
    ElMessageBox.confirm(
      "您需要登录才能上传图片。是否现在登录？",
      "未登录提示",
      {
        confirmButtonText: "去登录",
        cancelButtonText: "取消",
        type: "warning",
      }
    ).then(() => {
      localStorage.setItem("redirectAfterLogin", router.currentRoute.value.fullPath);
      router.push("/login");
    }).catch(() => {
      ElMessage.info("您可以继续使用本地图片预览功能，但无法保存到服务器");
    });
    const reader = new FileReader();
    reader.onload = (e) => {
      if (callback && e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return;
  }
  const loading = ElLoading.service({
    lock: true,
    text: "图片上传中...",
    background: "rgba(0, 0, 0, 0.7)",
  });
  uploadImage(file)
    .then((response: any) => {
      if (response.code === 0 || response.code === 200) {
        const imageData = response.data as UploadImageResponse;
        const imageId = imageData.id;
        return feedbackImage(imageId).then((feedbackResponse: any) => {
          return { response: feedbackResponse, imageId };
        });
      } else {
        if (response.code === 401) {
          ElMessageBox.confirm("您的登录已过期，请重新登录。", "登录提示", {
            confirmButtonText: "去登录",
            cancelButtonText: "取消",
            type: "warning",
          }).then(() => {
            localStorage.removeItem("token");
            localStorage.setItem("redirectAfterLogin", router.currentRoute.value.fullPath);
            router.push("/login");
          });
          return Promise.reject(new Error("login_required"));
        }
        throw new Error(response.msg || "上传失败");
      }
    })
    .then((result: any) => {
      if (!result) return;
      const { response, imageId } = result;
      if (response.code === 0 || response.code === 200) {
        const imageUrl = response.data;
        if (callback) callback(imageUrl, imageId);
        ElMessage.success("图片上传成功");
        if (response.code === 0 || response.code === 200) {
          let viewUrls = [];
          if (response.data && response.data.viewUrls) {
            viewUrls = response.data.viewUrls;
          } else if (response.viewUrls) {
            viewUrls = response.viewUrls;
          }
          if (viewUrls.length > 0) {
            router.push({ path: '/design/partial-modify', query: { creativeImg: viewUrls[0] } });
            return;
          }
        }
      } else {
        throw new Error(response.msg || "获取图片地址失败");
      }
    })
    .catch((error: any) => {
      if (error.message === "login_required") {
        return;
      }
      ElMessage.error({
        message: "图片上传失败: " + (error.message || "未知错误"),
        duration: 5000,
      });
    })
    .then(() => {
      loading.close();
    });
}

// 编辑弹窗关闭
const closeEditDialogMain = () => {
  showEditDialogMain.value = false;
  editModalVisible.value = false;
};

const closeEditDialogReference = () => {
  showEditDialogReference.value = false;
  editModalVisible.value = false;
};

// 预览弹窗取消处理
const cancelMainPreview = () => {
  showPreviewDialogMain.value = false;
  uploadModalVisible.value = false;
  // 清空文件输入框
  if (fileInputMain.value) {
    fileInputMain.value.value = '';
  }
  selectedFileMain.value = null;
  previewImageMain.value = '';
};

const cancelReferencePreview = () => {
  showPreviewDialogReference.value = false;
  uploadModalVisible.value = false;
  // 清空文件输入框
  if (fileInputReference.value) {
    fileInputReference.value.value = '';
  }
  selectedFileReference.value = null;
  previewImageReference.value = '';
};

// 编辑完成后关闭弹窗
const handleMainImageEdited = (editedImageUrl: string, imageId?: number | string) => {
  console.log('🔍 handleMainImageEdited 被调用:', {
    编辑后图片URL: editedImageUrl,
    图片ID: imageId,
    当前mainImage: mainImage.value,
    当前mainImageName: mainImageName.value
  });
  mainImage.value = editedImageUrl;
  if (imageId !== undefined && imageId !== null && imageId !== '') {
    mainImageId.value = Number(imageId);
    mainImageName.value = imageId.toString();

    // 更新全局store状态，让其他功能使用编辑后的图片ID
    shoeStore.setOriginalImageId(Number(imageId));
    console.log('🌐 已设置全局主图编辑后图片ID:', imageId);
  }
  showEditDialogMain.value = false;
};

const handleReferenceImageEdited = (editedImageUrl: string, imageId?: number | string) => {
  console.log('🔍 handleReferenceImageEdited 被调用:', {
    编辑后图片URL: editedImageUrl,
    图片ID: imageId,
    当前referenceImage: referenceImage.value,
    当前referenceImageName: referenceImageName.value
  });
  referenceImage.value = editedImageUrl;
  if (imageId !== undefined && imageId !== null && imageId !== '') {
    referenceImageId.value = Number(imageId);
    referenceImageName.value = imageId.toString();

    // 注意：这里不更新全局store状态，因为全局store主要用于主图（第一张图片）
    // 第二张图片的ID通过referenceImageId.value单独管理
    console.log('🌐 已设置副图编辑后图片ID:', imageId);
  }
  showEditDialogReference.value = false;
};

// 处理结果图选择
const handleResultSelected = () => {
  console.log("用户选择了一张结果图片");
};

// 监听store中的图片结果
watch(() => shoeStore.aiTaskImages, (newImages) => {
  if (newImages && newImages.length > 0) {
    // 只有在局部修改任务进行中时才显示结果
    if (isProcessingPartialModifyTask.value) {
      resultDialogImages.value = newImages
      isViewingResults.value = true
      resultDialogIndex.value = 0

      // 重置其他状态
      isEditingMainImage.value = false;
      isEditingReferenceImage.value = false;
      editModalVisible.value = false;
      uploadModalVisible.value = false;

      ElMessage.success("局部修改生成成功");
      isProcessingPartialModifyTask.value = false // 重置任务状态
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
    isProcessingPartialModifyTask.value = true; // 设置为局部修改任务进行中

    // 使用当前上传的图片ID，避免使用全局状态中的旧ID
    const majorIdToUse = mainImageId.value || parseInt(mainImageName.value)
    const minorIdToUse = referenceImageId.value || parseInt(referenceImageName.value)

    console.log("使用的图片ID:", {
      鞋面图ID: majorIdToUse,
      鞋面图来源: mainImageId.value ? '本地编辑后ID' : '当前上传的图片',
      鞋底图ID: minorIdToUse,
      鞋底图来源: referenceImageId.value ? '编辑后ID' : '本地图片ID',
      蒙版状态: maskStates.value,
      调试信息: {
        本地主图ID: mainImageId.value,
        当前上传主图名称: mainImageName.value,
        本地副图ID: referenceImageId.value,
        本地副图名称: referenceImageName.value
      }
    });

    // 准备请求参数
    const requestData: JbchRequest = {
      majorId: majorIdToUse,
      minorId: minorIdToUse,
      prompt: "自动改款",
      isMask: 2, // 默认使用二图蒙版
    };
    // 发送请求
    console.log("发送局部修改请求:", requestData);
    const response = await jbch(requestData);
    console.log("收到局部修改响应:", response);

    const result = response.data;
    let viewUrls: string[] = [];
    if (result && result.viewUrls && Array.isArray(result.viewUrls)) {
      viewUrls = result.viewUrls;
    }

    // 检查API响应格式 - 新的API格式：直接返回taskId
    if (result && typeof result === 'string') {
      const taskId = result;
      console.log('✅ 获得taskId:', taskId);
      
      // 立即设置任务状态为运行中，显示进度条
      shoeStore.setAiTaskStatus('running');
      shoeStore.setAiTaskProgress(0);
      
      // 启动WebSocket监听
      startAiTaskWs(taskId, 'partial-modify');
      
      ElMessage.success('局部修改任务已提交，正在处理中...');
      return;
    } else if (viewUrls.length > 0) {
      // 没有 WebSocket 字段才直接处理结果
      resultDialogImages.value = viewUrls;
      resultDialogIndex.value = 0;
      isViewingResults.value = true;
      // 重置其他状态
      isEditingMainImage.value = false;
      isEditingReferenceImage.value = false;
      editModalVisible.value = false;
      uploadModalVisible.value = false;
      ElMessage.success("局部修改生成成功");
    } else {
      ElMessage.warning("生成成功但未获得图片");
    }
  } catch (error: any) {
    console.error("局部修改失败:", error);
    // 显示错误信息，如果是code 1013的特定处理
    ElMessage.error("生成失败: " + (error.message || "未知错误"));
    isProcessingPartialModifyTask.value = false // 重置任务状态
  }
};

// 新增：退出结果查看
const exitResultsView = () => {
  isViewingResults.value = false;
};

// 显示标记可选区域选项
const showSelectionOptions = (step: number) => {
  console.log('🔍 显示标记可选区域选项，步骤:', step);
  currentMarkStep.value = step;
  if (currentStep.value !== step) {
    setStep(step);
  }
  showSelectionDialog.value = true;
};

// 处理选项选择
const handleSelectOption = (option: string) => {
  console.log('🔍 处理选项选择:', option, '当前步骤:', currentMarkStep.value);
  showSelectionDialog.value = false;
  if (currentMarkStep.value === 1) {
    // 主图编辑
    console.log('🔍 打开主图编辑弹窗，主图URL:', mainImage.value, '主图名称:', mainImageName.value);
    showEditDialogMain.value = true;
    nextTick(() => {
      if (editDialogWorkspaceRef.value && typeof editDialogWorkspaceRef.value.openToolModal === 'function') {
        console.log('🔍 调用主图编辑弹窗的 openToolModal');
        // 强制重置ImageWorkspace的图片URL
        editDialogWorkspaceRef.value.forceUpdateImage && editDialogWorkspaceRef.value.forceUpdateImage(mainImage.value);
        editDialogWorkspaceRef.value.openToolModal(option === 'smart' ? 'smartSelect' : 'mask');
      }
    });
  } else if (currentMarkStep.value === 2) {
    // 副图编辑
    console.log('🔍 打开副图编辑弹窗，副图URL:', referenceImage.value, '副图名称:', referenceImageName.value);
    showEditDialogReference.value = true;
    nextTick(() => {
      if (referenceImageWorkspaceRef.value && typeof referenceImageWorkspaceRef.value.openToolModal === 'function') {
        console.log('🔍 调用副图编辑弹窗的 openToolModal');
        // 强制重置ImageWorkspace的图片URL
        referenceImageWorkspaceRef.value.forceUpdateImage && referenceImageWorkspaceRef.value.forceUpdateImage(referenceImage.value);
        referenceImageWorkspaceRef.value.openToolModal(option === 'smart' ? 'smartSelect' : 'mask');
      }
    });
  }
};

// 标记可选区按钮点击，弹出选择方式弹窗
const handleMarkArea = () => {
  console.log('🔍 主图标记可选区域被点击');
  currentMarkStep.value = 1; // 主图
  showSelectionDialog.value = true;
};

// 添加完成编辑的函数
const completeStep = (step: number) => {
  if (step === 1 && mainImage.value) {
    // 如果当前在编辑主图，则完成编辑并进入下一步
    isEditingMainImage.value = false;
    currentStep.value = 2;
  } else if (step === 2 && referenceImage.value) {
    // 如果当前在编辑参考图，则完成编辑
    isEditingReferenceImage.value = false;
  }
};

const fileList = ref([])

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
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
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
  isProcessingPartialModifyTask.value = false // 重置任务状态
})

// 跳转二创页面时，creativeImg 传递 resultDialogImages.value 的最后一项
function handleTwoChuangSelect(option: any) {
  let img = resultDialogImages.value[resultDialogImages.value.length - 1];
  let ossId = '';
  router.push({ path: option.path, query: { creativeImg: img, ossId } });
}
</script>

<style scoped>
.sole-fusion-container {
  width: 100%;
  min-height: 100vh;
  background: transparent;
  color: #fff;
  padding: 20px;
  position: relative;
  margin-left: 80px;
}

.sole-fusion-container::before {
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

.completed-step .step-title {
  color: rgba(255, 255, 255, 0.7);
}

.disabled-step {
  opacity: 0.6;
  pointer-events: none;
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

.usage-guide {
  color: #c8ad7f;
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
  position: relative;

}

.empty-workspace {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-message .el-icon {
  font-size: 48px;
}

.empty-message p {
  font-size: 16px;
  margin: 0;
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

:deep(.el-radio) {
  margin-right: 20px;
  margin-bottom: 10px;
}

:deep(.el-radio__label) {
  color: white;
}

:deep(.el-upload-dragger) {
  background-color: transparent;
  border: none;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}

:deep(.el-upload-dragger:hover) {
  background-color: transparent;
  border-color: transparent;
}

:deep(.el-upload-dragger:hover .el-icon) {
  color: #00a3ff;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 添加标记区域的样式 */
.mark-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(0, 163, 255, 0.1);
  border: 1px solid rgba(0, 163, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 15px;
  font-size: 14px;
  font-weight: 500;
  color: #c8ad7f;
  ;
}

.mark-area:hover {
  background: rgba(0, 163, 255, 0.2);
  border-color: rgba(0, 163, 255, 0.5);
  transform: translateY(-2px);
}

.mark-area .el-icon {
  font-size: 16px;
  color: #c8ad7f;
  ;
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

.hidden-upload {
  display: none;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
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
  border: 2px solid #c8ad7f !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15) !important;
  background: rgba(30, 30, 30, 0.98) !important;
  color: #fff !important;
}

:deep(.el-dialog__body) {
  background: transparent !important;
  color: #fff !important;
}

:deep(.el-dialog__header) {
  background: transparent !important;
  color: #fff !important;
  border-bottom: 1px solid #c8ad7f !important;
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

/* 生成结果弹窗样式 */
.result-dialog-content {
  padding: 20px;
}

.result-image-box {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.result-dialog-controls {
  margin-top: 16px;
  text-align: center;
}

.result-dialog-controls .el-button {
  margin: 0 8px;
}

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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
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
