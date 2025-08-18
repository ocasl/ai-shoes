<template>
  <el-dialog
    v-model="dialogVisible"
    title="上传材质"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleClose"
  >
    <div class="upload-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <el-upload
          ref="uploadRef"
          class="material-uploader"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :accept="acceptedFormats"
          :before-upload="beforeUpload"
          :on-change="handleFileChange"
          :disabled="uploading"
        >
          <div v-if="!previewUrl" class="upload-placeholder">
            <el-icon class="upload-icon"><Plus /></el-icon>
            <div class="upload-text">
              <p>拖拽文件到此处或<em>点击上传</em></p>
              <p class="upload-hint">支持 JPG、PNG、JPEG、WEBP、GIF 格式，最大 10MB</p>
            </div>
          </div>
          
          <!-- 预览区域 -->
          <div v-else class="preview-container">
            <img :src="previewUrl" alt="预览" class="preview-image" />
            <div class="preview-overlay">
              <el-button
                circle
                type="primary"
                :icon="RefreshRight"
                @click.stop="handleReselect"
                title="重新选择"
              />
              <el-button
                circle
                type="danger"
                :icon="Delete"
                @click.stop="handleRemove"
                title="移除"
              />
            </div>
          </div>
        </el-upload>
      </div>

      <!-- 表单区域 -->
      <div class="form-section">
        <el-form
          ref="formRef"
          :model="uploadForm"
          :rules="formRules"
          label-width="80px"
          label-position="left"
        >
          <el-form-item label="材质名称" prop="name" required>
            <el-input
              v-model="uploadForm.name"
              placeholder="请输入材质名称"
              :maxlength="50"
              show-word-limit
              clearable
            />
          </el-form-item>

          <el-form-item label="材质类型" prop="type" required>
            <el-radio-group v-model="uploadForm.type">
              <el-radio :label="1">用户材质</el-radio>
              <el-radio :label="0" v-if="canUploadSystemMaterial">系统材质</el-radio>
            </el-radio-group>
            <div class="type-hint">
              <el-text size="small" type="info">
                {{ uploadForm.type === 0 ? '系统材质对所有用户可见' : '用户材质仅对自己可见' }}
              </el-text>
            </div>
          </el-form-item>

          <el-form-item label="材质分类" prop="category">
            <el-select
              v-model="uploadForm.category"
              placeholder="请选择材质分类"
              clearable
            >
              <el-option
                v-for="category in materialCategories"
                :key="category.value"
                :label="category.label"
                :value="category.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="材质标签" prop="tags">
            <div class="tags-input-container">
              <el-tag
                v-for="tag in uploadForm.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              
              <el-input
                v-if="showTagInput"
                ref="tagInputRef"
                v-model="newTag"
                size="small"
                class="tag-input"
                @keyup.enter="addTag"
                @blur="addTag"
                placeholder="输入标签"
              />
              
              <el-button
                v-else
                size="small"
                @click="showAddTag"
                class="add-tag-btn"
              >
                + 添加标签
              </el-button>
            </div>
            
            <!-- 推荐标签 -->
            <div class="recommended-tags" v-if="recommendedTags.length > 0">
              <el-text size="small" type="info">推荐标签：</el-text>
              <el-tag
                v-for="tag in recommendedTags"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
                class="recommended-tag"
                @click="addRecommendedTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-form-item>

          <el-form-item label="备注说明" prop="remark">
            <el-input
              v-model="uploadForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入材质的详细描述（可选）"
              :maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="upload-progress">
        <el-progress
          :percentage="uploadProgress"
          :stroke-width="8"
          :show-text="true"
          :color="progressColor"
        />
        <div class="progress-text">
          {{ uploadStatus }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="uploading">
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="!canUpload"
        >
          {{ uploading ? '上传中...' : '确认上传' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { 
  Plus, 
  RefreshRight, 
  Delete 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadInstance, UploadRawFile } from 'element-plus'
import { useMaterialStore } from '../../store/material'
import { MaterialCategories } from '../../types/material'
import type { Material } from '../../types/material'
import { isUserLoggedIn } from '../../api/file'
import { hasPermission, Permission, getCurrentUser, UserRole } from '../../utils/auth'
import { validateFileType, validateFileSize, validateFileName, FILE_SIZE_LIMITS, ValidationRules } from '../../utils/security'

// Props
interface Props {
  visible: boolean
  defaultType?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  defaultType: 1
})

// Emits
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  success: [material: Material]
  cancel: []
}>()

// Store
const materialStore = useMaterialStore()

// 响应式数据
const dialogVisible = ref(props.visible)
const uploadRef = ref<UploadInstance>()
const formRef = ref<FormInstance>()
const tagInputRef = ref()

const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const previewUrl = ref('')
const selectedFile = ref<File | null>(null)

// 表单数据
const uploadForm = ref({
  name: '',
  type: props.defaultType,
  category: '',
  tags: [] as string[],
  remark: ''
})

// 标签输入
const showTagInput = ref(false)
const newTag = ref('')

// 常量
const acceptedFormats = '.jpg,.jpeg,.png,.webp,.gif'
const maxFileSize = 10 * 1024 * 1024 // 10MB
const materialCategories = MaterialCategories

// 推荐标签
const recommendedTags = computed(() => {
  const allTags = ['皮革', '布料', '橡胶', '金属', '塑料', '光滑', '粗糙', '亮面', '哑光', '纹理', '素色']
  return allTags.filter(tag => !uploadForm.value.tags.includes(tag)).slice(0, 6)
})

// 计算属性
const canUploadSystemMaterial = computed(() => {
  const user = getCurrentUser()
  return user?.role === UserRole.ADMIN && hasPermission(Permission.SYSTEM_MATERIAL_MANAGE)
})

const canUpload = computed(() => {
  return selectedFile.value && 
         uploadForm.value.name.trim() && 
         !uploading.value
})

const progressColor = computed(() => {
  if (uploadProgress.value < 30) return '#f56c6c'
  if (uploadProgress.value < 70) return '#e6a23c'
  return '#67c23a'
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入材质名称', trigger: 'blur' },
    { min: 1, max: 50, message: '材质名称长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择材质类型', trigger: 'change' }
  ]
}

// 方法
const beforeUpload = (file: UploadRawFile) => {
  // 权限检查
  if (!hasPermission(Permission.MATERIAL_UPLOAD)) {
    ElMessage.error('权限不足：无法上传材质')
    return false
  }

  // 检查文件类型
  if (!validateFileType(file, 'material')) {
    ElMessage.error('不支持的文件类型，只支持 JPG、PNG、JPEG、WEBP、GIF 格式')
    return false
  }

  // 检查文件大小
  if (!validateFileSize(file, 'material')) {
    const maxSizeMB = FILE_SIZE_LIMITS.material / (1024 * 1024)
    ElMessage.error(`文件大小不能超过 ${maxSizeMB}MB`)
    return false
  }

  // 检查文件名
  if (!validateFileName(file.name)) {
    ElMessage.error('文件名包含非法字符')
    return false
  }

  return true
}

const handleFileChange = (file: any) => {
  if (!file.raw) return

  selectedFile.value = file.raw
  
  // 生成预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)

  // 自动填充文件名（去除扩展名）
  if (!uploadForm.value.name) {
    const fileName = file.name
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName
    uploadForm.value.name = nameWithoutExt
  }
}

const handleReselect = () => {
  uploadRef.value?.clearFiles()
  selectedFile.value = null
  previewUrl.value = ''
}

const handleRemove = () => {
  handleReselect()
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !uploadForm.value.tags.includes(tag)) {
    uploadForm.value.tags.push(tag)
  }
  newTag.value = ''
  showTagInput.value = false
}

const removeTag = (tag: string) => {
  const index = uploadForm.value.tags.indexOf(tag)
  if (index > -1) {
    uploadForm.value.tags.splice(index, 1)
  }
}

const showAddTag = () => {
  showTagInput.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addRecommendedTag = (tag: string) => {
  if (!uploadForm.value.tags.includes(tag)) {
    uploadForm.value.tags.push(tag)
  }
}

const handleUpload = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请选择要上传的文件')
    return
  }

  // 权限检查
  if (!hasPermission(Permission.MATERIAL_UPLOAD)) {
    ElMessage.error('权限不足：无法上传材质')
    return
  }

  // 验证表单
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.error('请完善表单信息')
    return
  }

  // 验证材质名称格式
  if (!ValidationRules.materialName.pattern.test(uploadForm.value.name)) {
    ElMessage.error('材质名称只能包含中文、英文、数字、空格、横线、下划线和点号')
    return
  }

  // 验证标签格式
  for (const tag of uploadForm.value.tags) {
    if (!ValidationRules.tag.pattern.test(tag)) {
      ElMessage.error(`标签"${tag}"格式不正确，只能包含中文、英文、数字、横线和下划线`)
      return
    }
  }

  // 检查登录状态
  if (!isUserLoggedIn()) {
    ElMessage.error('请先登录')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = '准备上传...'

  try {
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 10
        if (uploadProgress.value < 30) {
          uploadStatus.value = '正在上传文件...'
        } else if (uploadProgress.value < 60) {
          uploadStatus.value = '正在处理图片...'
        } else {
          uploadStatus.value = '即将完成...'
        }
      }
    }, 200)

    // 准备上传数据
    const uploadData = {
      name: uploadForm.value.name.trim(),
      type: uploadForm.value.type,
      file: selectedFile.value,
      category: uploadForm.value.category || undefined,
      tags: uploadForm.value.tags.length > 0 ? uploadForm.value.tags : undefined,
      remark: uploadForm.value.remark.trim() || undefined
    }

    // 调用store上传方法
    const result = await materialStore.uploadNewMaterial(uploadData)

    clearInterval(progressInterval)
    uploadProgress.value = 100
    uploadStatus.value = '上传成功！'

    // 延迟一下显示成功状态
    setTimeout(() => {
      ElMessage.success('材质上传成功')
      emit('success', result)
      handleClose()
    }, 500)

  } catch (error: any) {
    uploadProgress.value = 0
    uploadStatus.value = '上传失败'
    ElMessage.error(error.message || '上传失败，请重试')
  } finally {
    setTimeout(() => {
      uploading.value = false
      uploadProgress.value = 0
      uploadStatus.value = ''
    }, 1000)
  }
}

const handleClose = () => {
  if (uploading.value) {
    ElMessageBox.confirm(
      '正在上传中，确定要取消吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '继续上传',
        type: 'warning',
      }
    ).then(() => {
      resetForm()
      emit('update:visible', false)
      emit('cancel')
    }).catch(() => {
      // 用户选择继续上传
    })
  } else {
    resetForm()
    emit('update:visible', false)
    emit('cancel')
  }
}

const resetForm = () => {
  uploadForm.value = {
    name: '',
    type: props.defaultType,
    category: '',
    tags: [],
    remark: ''
  }
  selectedFile.value = null
  previewUrl.value = ''
  showTagInput.value = false
  newTag.value = ''
  uploading.value = false
  uploadProgress.value = 0
  uploadStatus.value = ''
  
  // 清空上传组件
  uploadRef.value?.clearFiles()
  
  // 重置表单验证
  formRef.value?.resetFields()
}

// 监听props变化
watch(() => props.visible, (newValue) => {
  dialogVisible.value = newValue
  if (newValue) {
    // 重置表单
    resetForm()
  }
})

watch(dialogVisible, (newValue) => {
  emit('update:visible', newValue)
})
</script>

<style scoped>
.upload-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-section {
  width: 100%;
}

.material-uploader {
  width: 100%;
}

:deep(.el-upload) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #c8ad7f;
  background: #f9f9f9;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.upload-icon {
  font-size: 48px;
  color: #c8ad7f;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-text p {
  margin: 8px 0;
}

.upload-text em {
  color: #c8ad7f;
  font-style: normal;
}

.upload-hint {
  font-size: 12px;
  color: #999;
}

.preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.form-section {
  width: 100%;
}

.type-hint {
  margin-top: 4px;
}

.tags-input-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 32px;
}

.tag-item {
  margin: 0;
}

.tag-input {
  width: 100px;
}

.add-tag-btn {
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
}

.recommended-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.recommended-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.recommended-tag:hover {
  background-color: #c8ad7f;
  color: white;
}

.upload-progress {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  color: #666;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 90% !important;
    margin: 5vh auto;
  }
  
  .upload-container {
    gap: 16px;
  }
  
  :deep(.el-upload-dragger) {
    height: 150px;
  }
  
  .upload-icon {
    font-size: 36px;
  }
}

/* Element Plus 组件样式覆盖 */
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-radio) {
  margin-right: 20px;
}

:deep(.el-progress-bar__outer) {
  background-color: #e4e7ed;
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%);
}
</style>