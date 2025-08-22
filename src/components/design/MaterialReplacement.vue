<template>
    <div class="material-replacement-page">
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

        <!-- 主内容区 -->
        <div class="main-content">
            <div class="replacement-container">
                <!-- 左侧上传区域 -->
                <div class="left-panel">
                    <div class="upload-section">
                        <div class="section-header">
                            <h3>上传鞋子图片</h3>
                            <p>请上传1024x1024尺寸的鞋子图片</p>
                        </div>

                        <div class="image-upload-area" @click="handleUploadClick">
                            <div v-if="mainImage" class="image-preview">
                                <img :src="mainImage" alt="鞋子图片" class="preview-img" />
                                <div class="image-overlay">
                                    <el-icon>
                                        <Plus />
                                    </el-icon>
                                    <span>更换图片</span>
                                </div>
                            </div>
                            <div v-else class="upload-placeholder">
                                <el-icon class="upload-icon">
                                    <Upload />
                                </el-icon>
                                <div class="upload-text">
                                    <p>点击上传鞋子图片</p>
                                    <p class="upload-hint">支持 JPG、PNG 格式，建议1024x1024</p>
                                </div>
                            </div>
                            <input ref="fileInput" type="file" accept="image/*" style="display: none"
                                @change="handleFileSelect" />
                        </div>

                        <!-- SAM抠图按钮 -->
                        <div v-if="mainImage" class="sam-section">
                            <el-button type="primary" :loading="isSamProcessing" @click="handleSamSegmentation"
                                class="sam-btn">
                                <el-icon>
                                    <Edit />
                                </el-icon>
                                {{ isSamProcessing ? 'SAM抠图中...' : '开始SAM抠图' }}
                            </el-button>
                            <p class="sam-hint">使用SAM技术精准分割选区</p>
                        </div>
                    </div>
                </div>

                <!-- 中间工作区域 -->
                <div class="work-area">
                    <div v-if="!mainImage" class="empty-workspace">
                        <div class="empty-message">
                            <el-icon class="empty-icon">
                                <Picture />
                            </el-icon>
                            <h3>选区换料工作台</h3>
                            <p>请先上传鞋子图片开始工作</p>
                        </div>
                    </div>

                    <div v-else class="workspace-content">
                        <!-- SAM智能抠图工作区 -->
                        <div class="sam-workspace">
                            <!-- SAM加载动画 -->
                            <div v-if="isSamProcessing" class="sam-loading-overlay">
                                <div class="sam-loading-content">
                                    <div class="sam-loading-dots">
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                    </div>
                                    <div class="sam-loading-progress">
                                        <div class="progress-bar">
                                            <div class="progress-fill"></div>
                                        </div>
                                    </div>
                                    <div class="sam-loading-text">正在上传SAM服务器...</div>
                                    <el-button @click="isSamProcessing = false" type="text"
                                        class="cancel-btn">取消</el-button>
                                </div>
                            </div>

                            <!-- 操作提示 -->
                            <div class="operation-tips">
                                <div class="tips-content">
                                    <span class="tip-item">
                                        <span class="tip-dot left-click"></span>
                                        左键正点（包含区域）
                                    </span>
                                    <span class="tip-item">
                                        <span class="tip-dot right-click"></span>
                                        右键负点（排除区域）
                                    </span>
                                    <el-button size="small" @click="clearPoints">清空点</el-button>
                                    <el-button size="small" type="primary" @click="saveCurrentLayer"
                                        :disabled="!currentMask">
                                        保存为图层
                                    </el-button>
                                    <el-button size="small" type="info" @click="toggleWhiteAreaDebug"
                                        :disabled="!currentMask">
                                        {{ showWhiteAreaDebug ? '隐藏' : '显示' }}白色区域
                                    </el-button>
                                    <el-dropdown @command="handleSaveCommand" trigger="click">
                                        <el-button size="small" type="success" :disabled="!mainImage">
                                            <el-icon>
                                                <Download />
                                            </el-icon>
                                            保存设计
                                            <el-icon class="el-icon--right">
                                                <ArrowDown />
                                            </el-icon>
                                        </el-button>
                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <el-dropdown-item command="save-design">保存完整设计</el-dropdown-item>
                                                <el-dropdown-item command="save-batch">批量保存（设计+原图）</el-dropdown-item>
                                                <el-dropdown-item command="save-high-res"
                                                    divided>保存高分辨率版本</el-dropdown-item>
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>
                                </div>
                            </div>

                            <!-- 抠图画布区域 -->
                            <div class="canvas-container">
                                <div class="canvas-wrapper">
                                    <canvas ref="imageCanvas" class="image-canvas" @click="handleCanvasClick"
                                        @contextmenu="handleCanvasRightClick" @mousemove="handleCanvasMouseMove"
                                        @mouseleave="hideMouseCursor"></canvas>

                                    <!-- 悬浮预览层 -->
                                    <canvas v-if="isHovering && hoverPreviewMask" class="hover-preview-canvas"
                                        ref="hoverPreviewCanvasRef"></canvas>

                                    <!-- 点击点标记 -->
                                    <div v-for="(point, index) in clickPoints" :key="index" class="point-marker"
                                        :class="point.type" :style="{
                                            left: point.x + 'px',
                                            top: point.y + 'px'
                                        }">
                                        <div class="point-inner"></div>
                                    </div>

                                    <!-- 自定义鼠标光标 -->
                                    <div v-if="mousePosition.show && isImageLoadedToSAM" class="custom-cursor" :style="{
                                        left: mousePosition.x + 'px',
                                        top: mousePosition.y + 'px'
                                    }">
                                        <div class="cursor-crosshair">
                                            <div class="cursor-line cursor-line-h"></div>
                                            <div class="cursor-line cursor-line-v"></div>
                                            <div class="cursor-center"></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 蒙版透明度控制 -->
                                <div class="mask-controls">
                                    <span>蒙版透明度：</span>
                                    <el-slider v-model="maskOpacity" :min="0" :max="100" :step="5"
                                        @change="updateMaskDisplay" style="width: 150px; margin-left: 10px;" />
                                    <span style="margin-left: 10px;">{{ maskOpacity }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧面板 -->
                <div class="right-panel">
                    <!-- 图层管理 -->
                    <div class="layers-section">
                        <div class="section-header">
                            <h3>图层管理</h3>
                            <el-button size="small" type="primary" @click="addNewLayer">
                                <el-icon>
                                    <Plus />
                                </el-icon>
                                新增选区
                            </el-button>
                        </div>

                        <div class="layers-list">
                            <div v-for="(layer, index) in layers" :key="layer.id" class="layer-item"
                                :class="{ active: selectedLayerId === layer.id }" @click="selectLayer(layer.id)">
                                <div class="layer-preview">
                                    <img v-if="layer.previewImage" :src="layer.previewImage" alt="图层预览" />
                                    <div v-else class="layer-placeholder">{{ index + 1 }}</div>
                                    <!-- 材质预览 -->
                                    <div v-if="layer.material" class="material-preview">
                                        <img :src="layer.material.realUrl || formatMaterialImageUrlSync(layer.material.ossPath)"
                                            :alt="layer.material.name" />
                                    </div>
                                </div>
                                <div class="layer-info">
                                    <span class="layer-name">图层 {{ index + 1 }}</span>
                                    <span v-if="layer.material" class="material-name">{{ layer.material.name }}</span>
                                    <div class="layer-actions">
                                        <el-button size="small" type="text"
                                            @click.stop="toggleLayerVisibility(layer.id)" class="visibility-btn">
                                            <el-icon>
                                                <component :is="layer.isVisible !== false ? 'View' : 'Hide'" />
                                            </el-icon>
                                        </el-button>
                                        <!-- 换颜色按钮 - 只有应用了材质的图层才显示 -->
                                        <el-button v-if="layer.material" size="small" type="text" 
                                            @click.stop="openColorChangeDialog(layer)" class="color-change-btn"
                                            title="更换颜色">
                                            <el-icon>
                                                <Brush />
                                            </el-icon>
                                        </el-button>
                                        <el-button size="small" type="text" @click.stop="deleteLayer(layer.id)"
                                            class="delete-btn">
                                            <el-icon>
                                                <Delete />
                                            </el-icon>
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 材质库 -->
                    <div class="materials-section">
                        <!-- 材质效果控制面板 -->
                        <div class="material-controls" v-if="selectedLayerId">
                            <h4>材质效果调整</h4>
                            <div class="control-group">
                                <label>混合模式:</label>
                                <el-select v-model="materialBlendMode" size="small" @change="updateMaterialEffect">
                                    <el-option label="正片叠底（推荐）" value="multiply"></el-option>
                                    <el-option label="正片叠底增强" value="multiply-enhanced"></el-option>
                                    <el-option label="叠加" value="overlay"></el-option>
                                    <el-option label="柔光" value="soft-light"></el-option>
                                    <el-option label="颜色加深" value="color-burn"></el-option>
                                    <el-option label="普通" value="normal"></el-option>
                                </el-select>
                            </div>
                            <div class="control-group">
                                <label>材质强度: {{ materialIntensity }}%</label>
                                <el-slider v-model="materialIntensity" :min="0" :max="100"
                                    @change="updateMaterialEffect" size="small"></el-slider>
                            </div>
                            <div class="control-group">
                                <label>材质透明度: {{ materialOpacity }}%</label>
                                <el-slider v-model="materialOpacity" :min="0" :max="100" @change="updateMaterialEffect"
                                    size="small"></el-slider>
                            </div>
                            <div class="control-group">
                                <label>边缘羽化: {{ featherRadius }}px</label>
                                <el-slider v-model="featherRadius" :min="0" :max="20" @change="updateMaterialEffect"
                                    size="small"></el-slider>
                            </div>
                            <div class="control-group">
                                <label>保持光影:</label>
                                <el-switch v-model="preserveShading" @change="updateMaterialEffect"
                                    size="small"></el-switch>
                            </div>
                        </div>

                        <div class="section-header">
                            <h3>材质选择</h3>
                            <el-tabs v-model="activeTab" class="material-tabs">
                                <el-tab-pane label="平台公用" name="system"></el-tab-pane>
                                <el-tab-pane label="我的" name="user"></el-tab-pane>
                            </el-tabs>
                        </div>

                        <!-- 平台公用材质 -->
                        <div v-if="activeTab === 'system'" class="materials-content">
                            <div class="system-actions">
                                <div class="search-box">
                                    <el-input v-model="systemSearchKeyword" placeholder="搜索材质名称"
                                        @input="searchSystemMaterials" clearable>
                                        <template #prefix>
                                            <el-icon>
                                                <Search />
                                            </el-icon>
                                        </template>
                                    </el-input>
                                </div>
                                <el-button type="primary" size="small" @click="handleUploadSystemMaterial">
                                    <el-icon>
                                        <Upload />
                                    </el-icon>
                                    上传系统材质
                                </el-button>
                            </div>

                            <div class="materials-grid">
                                <div v-for="material in systemMaterials" :key="material.id" class="material-card"
                                    @click="selectMaterial(material)">
                                    <img :src="getMaterialImageUrl(material)" :alt="material.name"
                                        class="material-image" @error="handleSimpleImageError" loading="lazy" />
                                    <div class="material-name">{{ material.name }}</div>
                                    <!-- 添加删除按钮（系统材质一般不能删除） -->
                                    <div class="material-actions">
                                        <el-button size="small" type="warning"
                                            @click.stop="editSystemMaterial(material.id)" title="编辑系统材质">
                                            <el-icon>
                                                <Edit />
                                            </el-icon>
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 我的材质 -->
                        <div v-if="activeTab === 'user'" class="materials-content">
                            <div class="user-actions">
                                <el-button type="primary" size="small" @click="handleUploadMaterial">
                                    <el-icon>
                                        <Upload />
                                    </el-icon>
                                    上传材质
                                </el-button>
                            </div>

                            <div class="materials-grid">
                                <div v-for="material in userMaterials" :key="material.id" class="material-card"
                                    @click="selectMaterial(material)">
                                    <img :src="getMaterialImageUrl(material)" :alt="material.name"
                                        class="material-image" @error="handleSimpleImageError" loading="lazy" />
                                    <div class="material-name">{{ material.name }}</div>
                                    <div class="material-actions">
                                        <el-button size="small" type="danger" @click.stop="deleteMaterial(material.id)">
                                            <el-icon>
                                                <Delete />
                                            </el-icon>
                                        </el-button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 上传材质弹窗 -->
        <el-dialog v-model="showUploadDialog" title="上传材质" width="500px">
            <div class="upload-dialog-content">
                <el-form :model="uploadForm" label-width="100px">
                    <el-form-item label="材质类型" required>
                        <el-radio-group v-model="uploadForm.type">
                            <el-radio :label="0">系统材质库</el-radio>
                            <el-radio :label="1">用户材质库</el-radio>
                        </el-radio-group>
                        <div class="form-tip">
                            <span v-if="uploadForm.type === 0" style="color: #f56c6c;">
                                系统材质库：所有用户可见，需要管理员权限
                            </span>
                            <span v-if="uploadForm.type === 1" style="color: #67c23a;">
                                用户材质库：仅自己可见和使用
                            </span>
                        </div>
                    </el-form-item>
                    <el-form-item label="材质名称" required>
                        <el-input v-model="uploadForm.name" placeholder="请输入材质名称" />
                    </el-form-item>
                    <el-form-item label="材质文件" required>
                        <el-upload ref="uploadRef" :auto-upload="false" :show-file-list="true" :limit="1"
                            accept="image/*" @change="handleMaterialFileChange">
                            <el-button type="primary">选择文件</el-button>
                        </el-upload>
                        <div class="form-tip">
                            支持 JPG、PNG、WEBP 等图片格式，建议尺寸 512x512 或以上
                        </div>
                    </el-form-item>
                </el-form>
            </div>
            <template #footer>
                <el-button @click="showUploadDialog = false">取消</el-button>
                <el-button type="primary" @click="confirmUploadMaterial" :loading="isUploading">
                    {{ uploadForm.type === 0 ? '上传到系统库' : '上传到个人库' }}
                </el-button>
            </template>
        </el-dialog>

        <!-- 颜色选择对话框 -->
        <el-dialog v-model="showColorChangeDialog" title="更换颜色" width="800px" :close-on-click-modal="false">
            <div class="color-change-content">
                <div class="color-picker-section">
                    <h4>选择新颜色</h4>
                    <div class="color-input-group">
                        <el-input v-model="selectedColor" placeholder="请输入色号 (如: #FF0000)" 
                            @input="onColorInputChange" style="width: 200px;">
                            <template #prepend>色号</template>
                        </el-input>
                        <div class="color-preview" :style="{ backgroundColor: selectedColor }"></div>
                    </div>
                    
                    <!-- 预设颜色板 -->
                    <div class="preset-colors">
                        <div class="color-row">
                            <div v-for="color in presetColors" :key="color" 
                                class="color-item" 
                                :class="{ active: selectedColor === color }"
                                :style="{ backgroundColor: color }"
                                @click="selectPresetColor(color)"
                                :title="color">
                            </div>
                        </div>
                    </div>
                    
                    <!-- 最近使用的颜色 -->
                    <div v-if="recentColors.length > 0" class="recent-colors">
                        <h5>最近使用</h5>
                        <div class="color-row">
                            <div v-for="color in recentColors" :key="color" 
                                class="color-item" 
                                :class="{ active: selectedColor === color }"
                                :style="{ backgroundColor: color }"
                                @click="selectPresetColor(color)"
                                :title="color">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 处理状态显示 -->
                <div v-if="colorChangeStatus" class="processing-status">
                    <el-progress :percentage="colorChangeProgress" :status="colorChangeStatus === 'error' ? 'exception' : undefined">
                        <template #default="{ percentage }">
                            <span class="progress-text">{{ colorChangeStatusText }} {{ percentage }}%</span>
                        </template>
                    </el-progress>
                </div>
            </div>
            
            <template #footer>
                <el-button @click="closeColorChangeDialog" :disabled="colorChangeStatus === 'processing'">取消</el-button>
                <el-button type="primary" @click="startColorChange" 
                    :loading="colorChangeStatus === 'processing'" 
                    :disabled="!selectedColor || !isValidColor(selectedColor)">
                    开始换颜色
                </el-button>
            </template>
        </el-dialog>

        <!-- 颜色结果选择对话框 -->
        <el-dialog v-model="showColorResultDialog" title="选择换颜色结果" width="900px" :close-on-click-modal="false">
            <div class="color-result-content">
                <p class="result-tip">请选择一个您满意的换颜色结果：</p>
                <div class="result-images">
                    <div v-for="(url, index) in colorChangeResults" :key="index" 
                        class="result-item" 
                        :class="{ selected: selectedResultIndex === index }"
                        @click="selectResult(index)">
                        <img :src="url" :alt="`结果 ${index + 1}`" />
                        <div class="result-overlay">
                            <span class="result-label">结果 {{ index + 1 }}</span>
                            <el-icon v-if="selectedResultIndex === index" class="selected-icon">
                                <Check />
                            </el-icon>
                        </div>
                    </div>
                </div>
            </div>
            
            <template #footer>
                <el-button @click="closeColorResultDialog">取消</el-button>
                <el-button type="primary" @click="confirmColorResult" 
                    :disabled="selectedResultIndex === -1">
                    确认选择
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Plus, Upload, Edit, Picture, Delete, Search, View, Hide, Download, ArrowDown, Brush, Check
} from '@element-plus/icons-vue'
import { useShoeStore } from '../../store'
import {
    getSystemMaterials,
    getUserMaterials,
    uploadMaterial,
    deleteMaterial as deleteMaterialApi,
    getMaterialDownloadUrl,
    getMaterialDetail,
    type Material,
    type ExtendedMaterial
} from '../../api/material'
import { uploadImage } from '../../api/file'
import request from '../../utils/request'

// 使用从API导入的ExtendedMaterial类型

const router = useRouter()
const shoeStore = useShoeStore()

// 主图相关
const mainImage = ref('')
const fileInput = ref<HTMLInputElement>()

// SAM抠图相关
const isSamProcessing = ref(false)
const imageCanvas = ref<HTMLCanvasElement>()
const clickPoints = ref<Array<{ x: number, y: number, type: 'foreground' | 'background' }>>([])
const mousePosition = ref({ x: 0, y: 0, show: false })
const currentMask = ref('')
const maskOpacity = ref(50)
const samTaskId = ref('')
const isImageLoadedToSAM = ref(false)

// 悬浮预览状态
const hoverPreviewMask = ref('')
const isHovering = ref(false)
const hoverTimeout = ref<NodeJS.Timeout | null>(null)
const hoverPreviewCanvasRef = ref<HTMLCanvasElement | null>(null)

// SAM API配置
const SAM_API_BASE = 'http://js1.blockelite.cn:34965/api'

// 图层管理
interface Layer {
    id: string
    previewImage?: string
    maskData?: string
    points?: Array<{ x: number, y: number, type: 'foreground' | 'background' }>
    material?: ExtendedMaterial
    materialTransform?: {
        x: number
        y: number
        scale: number
        rotation: number
    }
    isVisible?: boolean
}

const layers = ref<Layer[]>([])
const selectedLayerId = ref<string>('')

// 材质库相关
const activeTab = ref('system')
const systemMaterials = ref<ExtendedMaterial[]>([])
const userMaterials = ref<ExtendedMaterial[]>([])
const systemSearchKeyword = ref('')

// 材质效果控制
const materialBlendMode = ref('multiply')
const materialIntensity = ref(80)
const materialOpacity = ref(100)  // 材质透明度
const featherRadius = ref(2)      // 羽化半径
const preserveShading = ref(true)

// 白色区域调试
const showWhiteAreaDebug = ref(false)

// 颜色更换相关
const showColorChangeDialog = ref(false)
const showColorResultDialog = ref(false)
const currentColorChangeLayer = ref<Layer | null>(null)
const selectedColor = ref('#FF0000')
const colorChangeStatus = ref<'idle' | 'processing' | 'success' | 'error'>('idle')
const colorChangeProgress = ref(0)
const colorChangeStatusText = ref('')
const colorChangeResults = ref<string[]>([])
const selectedResultIndex = ref(-1)

// 预设颜色
const presetColors = ref([
    '#FF0000', '#FF4500', '#FFA500', '#FFD700', '#FFFF00', '#ADFF2F', '#00FF00', '#00FF7F',
    '#00FFFF', '#0080FF', '#0000FF', '#4169E1', '#8A2BE2', '#FF00FF', '#FF1493', '#FF69B4',
    '#000000', '#404040', '#808080', '#C0C0C0', '#FFFFFF', '#8B4513', '#D2691E', '#CD853F',
    '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F', '#F0E68C', '#E6E6FA', '#FFE4E1', '#FFF8DC'
])

// 最近使用的颜色
const recentColors = ref<string[]>([])

// WebSocket连接
let colorChangeWs: WebSocket | null = null

// 上传材质弹窗
const showUploadDialog = ref(false)
const uploadForm = reactive({
    name: '',
    type: 1, // 默认为用户材质库
    file: null as File | null
})
const isUploading = ref(false)
const uploadRef = ref()

// 上传主图
const handleUploadClick = () => {
    fileInput.value?.click()
}

// 调整图片尺寸为1024x1024
const resizeImageTo1024 = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
        }

        const img = new Image()
        img.onload = () => {
            console.log('📏 图片尺寸调整调试:', {
                原始图片尺寸: { width: img.width, height: img.height },
                目标Canvas尺寸: { width: 1024, height: 1024 }
            })

            // 设置固定尺寸1024x1024
            canvas.width = 1024
            canvas.height = 1024

            // 计算缩放和居中参数
            const scale = Math.min(1024 / img.width, 1024 / img.height)
            const x = (1024 - img.width * scale) / 2
            const y = (1024 - img.height * scale) / 2

            console.log('📏 缩放计算详情:', {
                缩放比例: scale,
                绘制位置: { x, y },
                绘制尺寸: { width: img.width * scale, height: img.height * scale }
            })

            // 绘制白色背景
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, 1024, 1024)

            // 绘制缩放后的图片，居中显示
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

            console.log('✅ 图片已调整为1024x1024，Canvas实际尺寸:', {
                Canvas宽度: canvas.width,
                Canvas高度: canvas.height
            })

            // 转换为Blob
            canvas.toBlob((blob) => {
                if (blob) {
                    const resizedFile = new File([blob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    })
                    resolve(resizedFile)
                } else {
                    reject(new Error('Failed to convert canvas to blob'))
                }
            }, 'image/jpeg', 0.9)
        }

        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = URL.createObjectURL(file)
    })
}

const handleFileSelect = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
        ElMessage.info('正在处理图片...')

        // 强制调整为1024x1024
        const resizedFile = await resizeImageTo1024(file)

        // 显示调整后的预览
        const localUrl = URL.createObjectURL(resizedFile)
        mainImage.value = localUrl

        try {
            // 上传调整后的图片到服务器
            ElMessage.info('正在上传图片...')
            const response = await uploadImage(resizedFile)
            console.log('图片上传响应:', response)

            // 根据实际API响应结构设置图片URL
            if (response.code === 200 || response.code === 0) {
                // 如果返回的是完整URL，直接使用
                if (response.data && typeof response.data === 'string') {
                    if (response.data.startsWith('http')) {
                        mainImage.value = response.data
                    } else {
                        // 使用正确的端口34965
                        mainImage.value = formatImageUrl(response.data)
                    }
                } else if (response.data && response.data.url) {
                    mainImage.value = response.data.url
                } else if (response.data && response.data.ossPath) {
                    mainImage.value = formatImageUrl(response.data.ossPath)
                }

                ElMessage.success('图片已调整为1024x1024并上传成功')
                // 重置所有SAM相关状态
                resetSamState()
            } else {
                throw new Error(response.msg || '上传失败')
            }
        } catch (error: any) {
            console.error('图片上传失败:', error)
            ElMessage.error(`图片上传失败: ${error.message || '未知错误'}`)
            // 保持本地预览
        }
    } catch (error: any) {
        console.error('图片处理失败:', error)
        ElMessage.error(`图片处理失败: ${error.message || '未知错误'}`)
    }
}

// 重置SAM状态
const resetSamState = () => {
    clickPoints.value = []
    currentMask.value = ''
    samTaskId.value = ''
    isImageLoadedToSAM.value = false
    mousePosition.value.show = false
}

// SAM抠图处理
const handleSamSegmentation = async () => {
    if (!mainImage.value) {
        ElMessage.warning('请先上传图片')
        return
    }

    try {
        isSamProcessing.value = true
        isImageLoadedToSAM.value = false // 重置状态

        console.log('开始SAM抠图初始化...')
        console.log('主图片URL:', mainImage.value)

        // 将图片转换为dataURL格式，然后加载到SAM
        let imageDataUrl = mainImage.value

        // 如果是URL而不是dataURL，需要转换
        if (!imageDataUrl.startsWith('data:image/')) {
            console.log('转换URL为dataURL...')
            imageDataUrl = await imageUrlToDataUrl(mainImage.value)
            console.log('转换完成，dataURL长度:', imageDataUrl.length)
        }

        console.log('加载图像到SAM...')
        await loadImageToSAM(imageDataUrl)

        console.log('SAM图像加载状态:', isImageLoadedToSAM.value)

        // 初始化canvas
        console.log('初始化canvas...')
        await initializeCanvas()

        ElMessage.success('SAM抠图模式已启动，左键正点，右键负点')
    } catch (error: any) {
        console.error('SAM抠图初始化失败:', error)
        ElMessage.error(`SAM抠图初始化失败: ${error.message || '未知错误'}`)
        isImageLoadedToSAM.value = false // 确保状态正确
    } finally {
        isSamProcessing.value = false
    }
}

// 将图片URL转换为dataURL
const imageUrlToDataUrl = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // 设置画布尺寸为固定1024x1024
            canvas.width = 1024
            canvas.height = 1024

            // 绘制图片（强制拉伸到1024x1024）
            ctx?.drawImage(img, 0, 0, 1024, 1024)

            // 转换为dataURL
            const dataUrl = canvas.toDataURL('image/png')
            resolve(dataUrl)
        }
        img.onerror = reject
        img.src = url
    })
}

// 将图片URL转换为base64
const imageUrlToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // 设置画布尺寸为固定1024x1024
            canvas.width = 1024
            canvas.height = 1024

            // 绘制图片（强制拉伸到1024x1024）
            ctx?.drawImage(img, 0, 0, 1024, 1024)

            // 转换为base64
            const base64 = canvas.toDataURL('image/png').split(',')[1]
            resolve(base64)
        }
        img.onerror = reject
        img.src = url
    })
}

// 加载图片到SAM
const loadImageToSAM = async (imageDataUrl: string) => {
    try {
        // 验证输入参数
        if (!imageDataUrl || typeof imageDataUrl !== 'string') {
            throw new Error('无效的图片数据格式')
        }

        // 检查是否为有效的data URL格式
        if (!imageDataUrl.startsWith('data:image/')) {
            throw new Error('不是有效的图片数据URL')
        }

        // 提取base64数据
        const base64Data = imageDataUrl.split(',')[1]

        if (!base64Data) {
            throw new Error('无法提取base64数据')
        }

        console.log('Base64 data length:', base64Data.length)

        // 检查SAM服务器健康状态
        try {
            console.log('检查SAM服务器健康状态...')
            const healthResponse = await fetch(`${SAM_API_BASE}/health`, {
                method: 'GET'
            })

            if (healthResponse.ok) {
                const healthData = await healthResponse.json()
                console.log('SAM服务器健康检查通过', healthData)
            } else {
                console.warn('SAM服务器健康检查失败', {
                    状态码: healthResponse.status,
                    状态文本: healthResponse.statusText
                })
            }
        } catch (healthError) {
            console.error('SAM服务器健康检查异常', healthError)
            throw new Error('SAM服务器不可用，请检查服务器状态')
        }

        const requestData = {
            image: base64Data,
            max_size: 1024
        }

        console.log('发送加载图像请求到SAM API:', `${SAM_API_BASE}/load_image`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            console.error('SAM API请求超时')
            controller.abort()
        }, 60000)

        const response = await fetch(`${SAM_API_BASE}/load_image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        console.log('SAM API响应状态:', response.status, response.statusText)

        if (!response.ok) {
            let errorText = ''
            try {
                errorText = await response.text()
            } catch (e) {
                console.error('无法读取错误响应内容:', e)
            }
            throw new Error(`SAM服务器错误 (${response.status}): ${response.statusText}${errorText ? ' - ' + errorText : ''}`)
        }

        let result
        try {
            result = await response.json()
        } catch (jsonError: any) {
            throw new Error('SAM服务器返回了无效的JSON响应')
        }

        console.log('SAM API响应数据:', result)

        if (result.success) {
            // ImageWorkspace版本使用taskId
            samTaskId.value = result.taskId || ''
            isImageLoadedToSAM.value = true
            console.log('SAM图片加载成功，taskId:', samTaskId.value)
        } else {
            throw new Error(result.error || result.message || 'SAM图片加载失败')
        }
    } catch (error) {
        console.error('SAM图片加载错误:', error)
        throw error
    }
}

// 初始化canvas
const initializeCanvas = async () => {
    if (!imageCanvas.value) return

    const canvas = imageCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'

    return new Promise<void>((resolve) => {
        img.onload = () => {
            console.log('🖼️ 主Canvas绘制调试:', {
                图片自然尺寸: { width: img.naturalWidth, height: img.naturalHeight },
                图片当前尺寸: { width: img.width, height: img.height },
                Canvas目标尺寸: { width: 1024, height: 1024 }
            })

            // 设置canvas尺寸为固定1024x1024
            canvas.width = 1024
            canvas.height = 1024

            // 绘制图片（强制拉伸到1024x1024）
            ctx.drawImage(img, 0, 0, 1024, 1024)

            console.log('✅ 主Canvas绘制完成，实际尺寸:', {
                Canvas宽度: canvas.width,
                Canvas高度: canvas.height
            })

            // 绘制调试信息
            drawDebugInfo()

            resolve()
        }
        img.src = mainImage.value
    })
}

// canvas事件处理
const handleCanvasClick = async (event: MouseEvent) => {
    if (!mainImage.value) {
        ElMessage.warning('请先上传图片')
        return
    }

    const rect = imageCanvas.value?.getBoundingClientRect()
    if (!rect) return

    const canvas = imageCanvas.value
    if (!canvas) return

    // 🔥 固定1024x1024，无需缩放转换，直接1:1对应
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)

    console.log('🎯 点击坐标(1:1):', {
        显示坐标: { clientX: event.clientX, clientY: event.clientY },
        Canvas边界: rect,
        最终坐标: { x, y },
        '说明': 'Canvas固定1024x1024，无需缩放'
    })

    // 在Canvas上绘制点击坐标信息
    const ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.save()
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
        ctx.fillRect(410, 10, 200, 60)
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px monospace'
        ctx.fillText(`点击: (${x}, ${y})`, 415, 25)
        ctx.fillText(`事件: (${Math.round(event.clientX)}, ${Math.round(event.clientY)})`, 415, 40)
        ctx.fillText(`边界: ${Math.round(rect.width)}x${Math.round(rect.height)}`, 415, 55)
        ctx.restore()
    }

    console.log('Canvas点击坐标:', { x, y })
    console.log('主图片:', mainImage.value)

    // 如果SAM未加载，尝试自动加载
    if (!isImageLoadedToSAM.value) {
        console.log('SAM未加载，尝试自动加载...')
        try {
            await handleSamSegmentation()
            if (!isImageLoadedToSAM.value) {
                ElMessage.warning('SAM加载失败，请手动点击"开始SAM抠图"按钮')
                return
            }
        } catch (error: any) {
            ElMessage.warning('请先点击"开始SAM抠图"按钮启动抠图模式')
            return
        }
    }

    await addPoint(x, y, 'foreground')

    // 更新调试信息
    drawDebugInfo()
}

const handleCanvasRightClick = async (event: MouseEvent) => {
    event.preventDefault()

    if (!mainImage.value) {
        ElMessage.warning('请先上传图片')
        return
    }

    const rect = imageCanvas.value?.getBoundingClientRect()
    if (!rect) return

    const canvas = imageCanvas.value
    if (!canvas) return

    // 🔥 固定1024x1024，无需缩放转换，直接1:1对应
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)

    // 如果SAM未加载，尝试自动加载
    if (!isImageLoadedToSAM.value) {
        console.log('SAM未加载，尝试自动加载...')
        try {
            await handleSamSegmentation()
            if (!isImageLoadedToSAM.value) {
                ElMessage.warning('SAM加载失败，请手动点击"开始SAM抠图"按钮')
                return
            }
        } catch (error: any) {
            ElMessage.warning('请先点击"开始SAM抠图"按钮启动抠图模式')
            return
        }
    }

    await addPoint(x, y, 'background')

    // 更新调试信息
    drawDebugInfo()
}

const handleCanvasMouseMove = (event: MouseEvent) => {
    if (!imageCanvas.value) return

    const rect = imageCanvas.value.getBoundingClientRect()
    const canvas = imageCanvas.value

    // 计算相对于canvas容器的坐标
    const containerX = event.clientX - rect.left
    const containerY = event.clientY - rect.top

    // 确保光标在canvas边界内
    const clampedX = Math.max(0, Math.min(containerX, rect.width))
    const clampedY = Math.max(0, Math.min(containerY, rect.height))

    mousePosition.value = {
        x: Math.round(clampedX),
        y: Math.round(clampedY),
        show: true
    }

    // 如果没有点击点且SAM已加载，显示悬浮预览
    if (clickPoints.value.length === 0 && isImageLoadedToSAM.value) {
        handleHoverPreview(event)
    }
}

const hideMouseCursor = () => {
    mousePosition.value.show = false
    clearHoverPreview()
}

// 悬浮预览处理
const handleHoverPreview = async (event: MouseEvent) => {
    if (hoverTimeout.value) {
        clearTimeout(hoverTimeout.value)
    }

    hoverTimeout.value = setTimeout(async () => {
        try {
            const rect = imageCanvas.value?.getBoundingClientRect()
            if (!rect || !samTaskId.value) return

            const canvas = imageCanvas.value
            if (!canvas) return

            // 🔥 固定1024x1024，无需缩放转换，直接1:1对应
            const x = Math.round(event.clientX - rect.left)
            const y = Math.round(event.clientY - rect.top)

            console.log('🎯 悬浮预览坐标(1:1):', {
                显示坐标: { clientX: event.clientX, clientY: event.clientY },
                Canvas边界: rect,
                最终坐标: { x, y },
                '说明': 'Canvas固定1024x1024，无需缩放'
            })

            // 调用SAM分割API获取预览蒙版
            const response = await fetch(`${SAM_API_BASE}/segment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: x,
                    y: y,
                    point_type: 'foreground',
                    taskId: samTaskId.value
                })
            })

            const result = await response.json()
            if (result.success && result.mask) {
                hoverPreviewMask.value = 'data:image/png;base64,' + result.mask
                isHovering.value = true
                await drawHoverPreview()

                // 清除预览临时状态
                await fetch(`${SAM_API_BASE}/clear_points`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId: samTaskId.value })
                })
            }
        } catch (error) {
            console.error('悬浮预览失败:', error)
        }
    }, 150)
}

// 绘制悬浮预览
const drawHoverPreview = async () => {
    if (!hoverPreviewMask.value || !hoverPreviewCanvasRef.value || !imageCanvas.value) return

    const canvas = hoverPreviewCanvasRef.value
    const mainCanvas = imageCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置预览canvas尺寸固定为1024x1024
    canvas.width = 1024
    canvas.height = 1024
    // CSS已设置固定尺寸，无需动态调整
    canvas.style.width = '1024px'
    canvas.style.height = '1024px'

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
        // 加载蒙版图片
        const maskImg = new Image()
        await new Promise((resolve, reject) => {
            maskImg.onload = resolve
            maskImg.onerror = reject
            maskImg.src = hoverPreviewMask.value
        })

        // 绘制半透明蓝色预览效果
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) return

        tempCanvas.width = maskImg.width
        tempCanvas.height = maskImg.height
        tempCtx.drawImage(maskImg, 0, 0)
        const maskData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)

        // 使用与主要分割相同的增强边缘高亮效果
        const width = maskImg.width
        const height = maskImg.height

        // 先绘制内部半透明填充（预览用更透明）
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4
                if (maskData.data[idx] > 128) { // 白色区域
                    ctx.fillStyle = 'rgba(0, 150, 255, 0.2)' // 预览用更透明
                    ctx.fillRect(x, y, 1, 1)
                }
            }
        }

        // 绘制明亮的边缘轮廓
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4
                if (maskData.data[idx] > 128) { // 当前像素是白色区域
                    // 检查8个方向的邻居像素
                    const neighbors = [
                        maskData.data[((y - 1) * width + (x - 1)) * 4], // 左上
                        maskData.data[((y - 1) * width + x) * 4],       // 上
                        maskData.data[((y - 1) * width + (x + 1)) * 4], // 右上
                        maskData.data[(y * width + (x - 1)) * 4],       // 左
                        maskData.data[(y * width + (x + 1)) * 4],       // 右
                        maskData.data[((y + 1) * width + (x - 1)) * 4], // 左下
                        maskData.data[((y + 1) * width + x) * 4],       // 下
                        maskData.data[((y + 1) * width + (x + 1)) * 4]  // 右下
                    ]

                    const isEdge = neighbors.some(n => n < 128)

                    if (isEdge) {
                        // 预览模式的边缘稍微不那么亮
                        ctx.fillStyle = 'rgba(0, 180, 255, 0.7)'
                        ctx.fillRect(x, y, 1, 1)
                    }
                }
            }
        }
    } catch (error) {
        console.error('悬浮预览绘制失败:', error)
    }
}

// 清除悬浮预览
const clearHoverPreview = () => {
    if (hoverTimeout.value) {
        clearTimeout(hoverTimeout.value)
        hoverTimeout.value = null
    }
    isHovering.value = false
    hoverPreviewMask.value = ''
    if (hoverPreviewCanvasRef.value) {
        const ctx = hoverPreviewCanvasRef.value.getContext('2d')
        if (ctx) {
            ctx.clearRect(0, 0, hoverPreviewCanvasRef.value.width, hoverPreviewCanvasRef.value.height)
        }
    }
}

// 添加点并执行分割
const addPoint = async (x: number, y: number, type: 'foreground' | 'background') => {
    try {
        console.log('开始添加点和分割:', { x, y, type })
        console.log('SAM加载状态:', isImageLoadedToSAM.value)
        console.log('当前taskId:', samTaskId.value)

        // 确保taskId存在
        if (!samTaskId.value && isImageLoadedToSAM.value) {
            console.warn('图像已加载但任务ID丢失，准备重新加载图像')
            isImageLoadedToSAM.value = false
        }

        // 如果图像未加载到SAM，先加载
        if (!isImageLoadedToSAM.value) {
            console.log('图像未加载到SAM，开始加载...')
            let imageDataUrl = mainImage.value
            if (!imageDataUrl.startsWith('data:image/')) {
                imageDataUrl = await imageUrlToDataUrl(mainImage.value)
            }
            await loadImageToSAM(imageDataUrl)
        }

        // 再次确认taskId
        if (!samTaskId.value) {
            throw new Error('任务ID未初始化，请先加载图像')
        }

        // 添加点到列表
        clickPoints.value.push({ x, y, type })

        // 调用SAM分割API（按照ImageWorkspace的方式，使用taskId）
        const requestData = {
            x: x,
            y: y,
            point_type: type,
            taskId: samTaskId.value
        }

        console.log('发送分割请求:', requestData)

        const response = await fetch(`${SAM_API_BASE}/segment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })

        console.log('分割API响应状态:', response.status, response.statusText)

        let result
        try {
            result = await response.json()
            console.log('分割API响应数据:', result)
        } catch (jsonError) {
            console.error('解析响应JSON失败:', jsonError)
            throw new Error('服务器返回了无效的响应')
        }

        if (result.success) {
            // 更新蒙版
            currentMask.value = 'data:image/png;base64,' + result.mask
            console.log('蒙版更新成功')

            // 重新绘制canvas
            await drawCanvasWithMask()

            // 计算本地点数而不是依赖API返回的计数
            const foregroundCount = clickPoints.value.filter(p => p.type === 'foreground').length
            const backgroundCount = clickPoints.value.filter(p => p.type === 'background').length
            ElMessage.success(`分割完成 - 正点: ${foregroundCount}, 负点: ${backgroundCount}`)
        } else {
            // 如果分割失败，移除刚添加的点
            clickPoints.value.pop()
            console.error('分割失败，服务器响应:', result)

            // 如果提示需要先加载图像，可能需要重新加载
            if (result.error && result.error.includes('请先加载图像')) {
                ElMessage.warning('图像会话已过期，请重新启动SAM抠图')
                isImageLoadedToSAM.value = false
            }

            throw new Error(result.error || result.message || '分割失败')
        }
    } catch (error: any) {
        console.error('SAM分割错误:', error)

        // 如果是网络错误，也移除添加的点
        if (clickPoints.value.length > 0) {
            clickPoints.value.pop()
        }

        ElMessage.error('分割失败: ' + (error.message || '未知错误'))
    }
}

// 绘制canvas和蒙版 - 简化版本，参考ImageWorkspace
const drawCanvasWithMask = async () => {
    if (!imageCanvas.value) return

    const canvas = imageCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制原图
    const img = new Image()
    img.crossOrigin = 'anonymous'

    return new Promise<void>((resolve) => {
        img.onload = () => {
            // 设置canvas尺寸为固定1024x1024
            canvas.width = 1024
            canvas.height = 1024

            // 绘制原图（图片已经是1024x1024）
            ctx.drawImage(img, 0, 0, 1024, 1024)

            // 如果有蒙版，绘制半透明蓝色覆盖
            if (currentMask.value) {
                const maskImg = new Image()
                maskImg.onload = () => {
                    // 创建临时canvas处理蒙版
                    const tempCanvas = document.createElement('canvas')
                    const tempCtx = tempCanvas.getContext('2d')
                    if (!tempCtx) return

                    tempCanvas.width = maskImg.width
                    tempCanvas.height = maskImg.height
                    tempCtx.drawImage(maskImg, 0, 0)

                    const maskData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height)

                    // 创建增强的边缘高亮效果 - 参考SAM官网
                    const width = maskImg.width
                    const height = maskImg.height

                    // 先绘制内部半透明填充
                    for (let y = 0; y < height; y++) {
                        for (let x = 0; x < width; x++) {
                            const idx = (y * width + x) * 4
                            if (maskData.data[idx] > 128) { // 白色区域
                                ctx.fillStyle = 'rgba(0, 150, 255, 0.25)'
                                ctx.fillRect(x, y, 1, 1)
                            }
                        }
                    }

                    // 再绘制明亮的边缘轮廓
                    for (let y = 1; y < height - 1; y++) {
                        for (let x = 1; x < width - 1; x++) {
                            const idx = (y * width + x) * 4
                            if (maskData.data[idx] > 128) { // 当前像素是白色区域
                                // 检查8个方向的邻居像素
                                const neighbors = [
                                    maskData.data[((y - 1) * width + (x - 1)) * 4], // 左上
                                    maskData.data[((y - 1) * width + x) * 4],       // 上
                                    maskData.data[((y - 1) * width + (x + 1)) * 4], // 右上
                                    maskData.data[(y * width + (x - 1)) * 4],       // 左
                                    maskData.data[(y * width + (x + 1)) * 4],       // 右
                                    maskData.data[((y + 1) * width + (x - 1)) * 4], // 左下
                                    maskData.data[((y + 1) * width + x) * 4],       // 下
                                    maskData.data[((y + 1) * width + (x + 1)) * 4]  // 右下
                                ]

                                // 如果有任何邻居是黑色（背景），则这是边缘像素
                                const isEdge = neighbors.some(n => n < 128)

                                if (isEdge) {
                                    // 绘制明亮的边缘轮廓 - 多层叠加增强效果
                                    ctx.fillStyle = 'rgba(0, 200, 255, 1.0)'  // 完全不透明的亮蓝色
                                    ctx.fillRect(x, y, 1, 1)

                                    // 添加发光效果 - 在边缘周围绘制稍暗的光晕
                                    ctx.fillStyle = 'rgba(100, 220, 255, 0.6)'
                                    for (let dy = -1; dy <= 1; dy++) {
                                        for (let dx = -1; dx <= 1; dx++) {
                                            if (dx === 0 && dy === 0) continue
                                            const nx = x + dx
                                            const ny = y + dy
                                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                                const nIdx = (ny * width + nx) * 4
                                                if (maskData.data[nIdx] > 128) {
                                                    ctx.fillRect(nx, ny, 1, 1)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 绘制调试信息
                    drawDebugInfo()

                    resolve()
                }
                maskImg.src = currentMask.value
            } else {
                resolve()
            }
        }
        img.src = mainImage.value
    })
}

// 清空点
const clearPoints = () => {
    console.log('清空点之前:', clickPoints.value.length)
    clickPoints.value.length = 0 // 强制清空数组
    currentMask.value = ''
    console.log('清空点之后:', clickPoints.value.length)

    // 更新调试信息
    drawDebugInfo()

    // 重新绘制canvas显示原图
    if (mainImage.value) {
        initializeCanvas()
    }

    ElMessage.success('已清空所有点')
}

// 更新蒙版显示
const updateMaskDisplay = () => {
    drawCanvasWithMask()
}

// 保存当前蒙版为图层
const saveCurrentLayer = () => {
    if (!currentMask.value) {
        ElMessage.warning('没有可保存的蒙版')
        return
    }

    const newLayer: Layer = {
        id: Date.now().toString(),
        previewImage: currentMask.value,
        maskData: currentMask.value,
        points: [...clickPoints.value],
        isVisible: true
    }

    layers.value.push(newLayer)
    selectedLayerId.value = newLayer.id

    // 清空当前蒙版操作，但保持SAM会话活跃以便继续分割
    clickPoints.value = []
    currentMask.value = ''

    // 重新绘制canvas，显示黑色覆盖效果，但不清空SAM任务
    redrawCanvasWithLayers()

    ElMessage.success('图层保存成功！可以继续分割其他部位')
}

// 更新图层预览 - 修复版本，正确显示蒙版区域的材质
const updateLayerPreview = (layer: Layer) => {
    if (!layer.maskData || !layer.material) return

    console.log('🔄 更新图层预览:', layer.id)

    // 创建一个新的canvas来合成预览
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 200
    canvas.height = 200

    // 加载蒙版
    const maskImg = new Image()
    maskImg.onload = () => {
        console.log('✅ 蒙版图片加载完成')

        // 创建材质图案
        const materialImg = new Image()
        materialImg.crossOrigin = 'anonymous'
        materialImg.onload = () => {
            console.log('✅ 材质图片加载完成')

            // 🎯 关键修复：先创建精确的白色区域蒙版
            const maskCanvas = document.createElement('canvas')
            const maskCtx = maskCanvas.getContext('2d')!
            maskCanvas.width = canvas.width
            maskCanvas.height = canvas.height
            maskCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)
            const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

            // 创建精确的白色区域蒙版
            const whiteMaskData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height)
            for (let i = 0; i < maskImageData.data.length; i += 4) {
                const r = maskImageData.data[i]
                const g = maskImageData.data[i + 1]
                const b = maskImageData.data[i + 2]

                // 精确检测白色区域（RGB值均大于200认为是白色）
                const isWhite = r > 200 && g > 200 && b > 200

                whiteMaskData.data[i] = isWhite ? 255 : 0      // R
                whiteMaskData.data[i + 1] = isWhite ? 255 : 0  // G
                whiteMaskData.data[i + 2] = isWhite ? 255 : 0  // B
                whiteMaskData.data[i + 3] = isWhite ? 255 : 0  // A
            }

            // 应用精确的白色蒙版
            const preciseMaskCanvas = document.createElement('canvas')
            const preciseMaskCtx = preciseMaskCanvas.getContext('2d')!
            preciseMaskCanvas.width = maskCanvas.width
            preciseMaskCanvas.height = maskCanvas.height
            preciseMaskCtx.putImageData(whiteMaskData, 0, 0)

            // 🎨 步骤1：绘制材质纹理（平铺）
            const pattern = ctx.createPattern(materialImg, 'repeat')
            if (pattern) {
                ctx.fillStyle = pattern
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            // 🎯 步骤2：关键 - 只保留精确白色区域的材质
            ctx.globalCompositeOperation = 'destination-in'
            ctx.drawImage(preciseMaskCanvas, 0, 0)

            console.log('✅ 图层预览已更新，材质仅限制在白色区域')

            // 更新图层预览
            layer.previewImage = canvas.toDataURL()
        }

        materialImg.onerror = () => {
            console.error('❌ 材质图片加载失败:', layer.material?.name)
        }

        materialImg.src = getMaterialImageUrl(layer.material)
    }

    maskImg.onerror = () => {
        console.error('❌ 蒙版图片加载失败')
    }

    maskImg.src = layer.maskData
}

// 重新绘制canvas，包含所有图层效果
const redrawCanvasWithLayers = async () => {
    if (!imageCanvas.value || !mainImage.value) return

    const canvas = imageCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制原图
    const img = new Image()
    img.crossOrigin = 'anonymous'

    return new Promise<void>((resolve) => {
        img.onload = async () => {
            // 设置canvas尺寸为固定1024x1024
            canvas.width = 1024
            canvas.height = 1024

            // 绘制原图（图片已经是1024x1024）
            ctx.drawImage(img, 0, 0, 1024, 1024)

            // 绘制所有可见图层的材质效果
            for (const layer of layers.value) {
                if (layer.isVisible !== false && layer.maskData) {
                    const maskImg = new Image()
                    await new Promise<void>((maskResolve) => {
                        maskImg.onload = async () => {
                            // 如果图层有材质，只在白色区域绘制材质
                            if (layer.material) {
                                try {
                                    const materialImg = new Image()
                                    materialImg.crossOrigin = 'anonymous'

                                    await new Promise<void>((materialResolve) => {
                                        materialImg.onload = () => {
                                            // 关键：只在蒙版的白色区域替换材质
                                            renderMaterialInMaskRegion(ctx, maskImg, materialImg, layer)
                                            materialResolve()
                                        }

                                        materialImg.onerror = () => {
                                            console.error('材质图片加载失败:', layer.material?.name)
                                            materialResolve()
                                        }

                                        // 获取材质图片URL
                                        const materialUrl = getMaterialImageUrl(layer.material)
                                        materialImg.src = materialUrl
                                    })

                                } catch (error) {
                                    console.error('绘制材质效果失败:', error)
                                }
                            } else {
                                // 没有材质时，绘制半透明黑色覆盖
                                renderMaskOverlay(ctx, maskImg)
                            }

                            maskResolve()
                        }
                        maskImg.src = layer.maskData || ''
                    })
                }
            }

            // 如果有当前正在编辑的蒙版，也显示它
            if (currentMask.value) {
                const currentMaskImg = new Image()
                currentMaskImg.onload = () => {
                    ctx.globalAlpha = maskOpacity.value / 100
                    ctx.globalCompositeOperation = 'multiply'
                    ctx.drawImage(currentMaskImg, 0, 0)
                    ctx.globalAlpha = 1
                    ctx.globalCompositeOperation = 'source-over'

                    // 绘制调试信息
                    drawDebugInfo()

                    // 如果有选中的图层，绘制高亮效果
                    if (selectedLayerId.value) {
                        drawSelectedLayerHighlight(ctx)
                    }

                    resolve()
                }
                currentMaskImg.src = currentMask.value
            } else {
                // 绘制调试信息
                drawDebugInfo()

                // 如果有选中的图层，绘制高亮效果
                if (selectedLayerId.value) {
                    drawSelectedLayerHighlight(ctx)
                }

                resolve()
            }
        }
        img.src = mainImage.value
    })
}

// 绘制选中图层的高亮效果（仅在没有材质时显示）
const drawSelectedLayerHighlight = (ctx: CanvasRenderingContext2D) => {
    const selectedLayer = layers.value.find(layer => layer.id === selectedLayerId.value)
    if (!selectedLayer || !selectedLayer.maskData) return

    console.log('🔍 图层高亮检查:', {
        图层ID: selectedLayer.id,
        有材质: !!selectedLayer.material,
        材质名称: selectedLayer.material?.name || '无',
        蒙版数据: !!selectedLayer.maskData
    })

    // 🎯 关键修改：如果图层已经有材质，完全不显示任何高亮效果
    if (selectedLayer.material) {
        console.log('✅ 图层有材质，不显示高亮')
        // 有材质时，不显示任何高亮，只显示材质本身的效果
        return
    }

    console.log('🔵 图层无材质，显示蓝色高亮')

    const highlightImg = new Image()
    highlightImg.onload = () => {
        // 创建高亮蒙版
        const highlightCanvas = document.createElement('canvas')
        const highlightCtx = highlightCanvas.getContext('2d')!
        highlightCanvas.width = 1024
        highlightCanvas.height = 1024

        // 绘制蒙版到临时画布
        highlightCtx.drawImage(highlightImg, 0, 0, 1024, 1024)
        const imageData = highlightCtx.getImageData(0, 0, 1024, 1024)
        const data = imageData.data

        // 创建高亮效果：白色区域变为明显的蓝色边框
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]

            // 检测白色区域
            if (r > 200 && g > 200 && b > 200) {
                // 检查是否是边缘像素
                const x = (i / 4) % 1024
                const y = Math.floor(i / 4 / 1024)

                if (isEdgePixel(data, x, y, 1024, 1024)) {
                    // 边缘设置为明亮的蓝色边框
                    data[i] = 0      // R - 蓝色
                    data[i + 1] = 150 // G - 蓝色  
                    data[i + 2] = 255 // B - 蓝色
                    data[i + 3] = 200 // A - 较高透明度
                } else {
                    // 内部区域设为淡蓝色半透明
                    data[i] = 150    // R
                    data[i + 1] = 200 // G
                    data[i + 2] = 255 // B
                    data[i + 3] = 30  // A - 很低的透明度
                }
            } else {
                // 非白色区域设为透明
                data[i + 3] = 0
            }
        }

        highlightCtx.putImageData(imageData, 0, 0)

        // 绘制高亮效果到主canvas
        ctx.globalCompositeOperation = 'source-over'
        ctx.drawImage(highlightCanvas, 0, 0)
    }

    highlightImg.src = selectedLayer.maskData
}



// 检测是否为边缘像素
const isEdgePixel = (data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean => {
    // 检查周围8个像素，如果有非白色像素则认为是边缘
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue

            const nx = x + dx
            const ny = y + dy

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const index = (ny * width + nx) * 4
                const r = data[index]
                const g = data[index + 1]
                const b = data[index + 2]

                // 如果邻近像素不是白色，当前像素就是边缘
                if (r < 200 || g < 200 || b < 200) {
                    return true
                }
            }
        }
    }
    return false
}

// 清空SAM任务
const clearSamTask = () => {
    // 重置所有SAM相关状态
    clickPoints.value = []
    currentMask.value = ''
    samTaskId.value = ''
    isImageLoadedToSAM.value = false
    mousePosition.value.show = false

    // 重新绘制canvas，显示已保存的图层
    redrawCanvasWithLayers()

    console.log('SAM任务已清空')
}

// 图层管理
const addNewLayer = () => {
    if (currentMask.value) {
        // 如果有当前蒙版，先保存
        saveCurrentLayer()
    } else {
        // 如果没有当前蒙版但有SAM会话，只需清空点继续
        if (isImageLoadedToSAM.value) {
            clickPoints.value = []
            ElMessage.info('可以继续点击分割新的区域')
        } else {
            // 没有SAM会话，需要重新初始化
            clearSamTask()
            ElMessage.info('请先点击"开始SAM抠图"或直接点击图片开始')
        }
    }
}

const selectLayer = (layerId: string) => {
    selectedLayerId.value = layerId

    const layer = layers.value.find(l => l.id === layerId)
    console.log('🎯 选择图层:', {
        图层ID: layerId,
        图层存在: !!layer,
        有材质: !!layer?.material,
        材质名称: layer?.material?.name || '无'
    })

    // 重新绘制canvas以显示选中图层的高亮效果
    redrawCanvasWithLayers()
}

const toggleLayerVisibility = (layerId: string) => {
    const layer = layers.value.find(l => l.id === layerId)
    if (layer) {
        layer.isVisible = layer.isVisible !== false ? false : true
        // 重新绘制canvas，显示/隐藏图层
        redrawCanvasWithLayers()
    }
}

const deleteLayer = (layerId: string) => {
    const index = layers.value.findIndex(layer => layer.id === layerId)
    if (index > -1) {
        layers.value.splice(index, 1)
        if (selectedLayerId.value === layerId) {
            selectedLayerId.value = layers.value[0]?.id || ''
        }
        // 重新绘制canvas
        redrawCanvasWithLayers()
        ElMessage.success('图层删除成功')
    }
}

// 图片URL格式化
const formatImageUrl = (ossPath: string) => {
    if (!ossPath) {
        return ''
    }

    // 如果已经是完整的URL，直接返回
    if (ossPath.startsWith('http://') || ossPath.startsWith('https://')) {
        return ossPath
    }

    // 使用与后端API相同的基础URL
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
    const finalUrl = `${API_BASE_URL}${ossPath.startsWith('/') ? '' : '/'}${ossPath}`

    console.log('🖼️ 材质图片URL构建:', {
        原始路径: ossPath,
        API基础URL: API_BASE_URL,
        最终URL: finalUrl
    })

    return finalUrl
}

// 材质图片URL格式化（通过Material Download API）
const formatMaterialImageUrl = async (material: ExtendedMaterial): Promise<string> => {
    if (!material || !material.id) {
        return ''
    }

    try {
        console.log('🔍 材质图片下载API调用:', {
            材质ID: material.id,
            材质名称: material.name
        })

        // 调用材质下载API获取OSS地址
        const response = await getMaterialDownloadUrl(material.id)

        if (response.code === 200 || response.code === 0) {
            const downloadUrl = response.data
            console.log('✅ 材质下载API成功:', {
                材质ID: material.id,
                真实地址: downloadUrl
            })
            return downloadUrl
        } else {
            console.error('❌ 材质下载API失败:', response.msg)
            // 回退到直接访问ossPath
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
            return `${API_BASE_URL}${material.ossPath?.startsWith('/') ? '' : '/'}${material.ossPath || ''}`
        }
    } catch (error) {
        console.error('❌ 材质图片URL获取失败:', error)
        // 回退到直接访问ossPath
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
        return `${API_BASE_URL}${material.ossPath?.startsWith('/') ? '' : '/'}${material.ossPath || ''}`
    }
}

// 同步版本的材质图片URL格式化（用于模板中的直接调用）
const formatMaterialImageUrlSync = (ossPath: string) => {
    if (!ossPath) {
        return ''
    }

    // 如果已经是完整的URL，直接返回
    if (ossPath.startsWith('http://') || ossPath.startsWith('https://')) {
        return ossPath
    }

    // 临时返回占位符，实际加载由异步函数处理
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+'
}

// Canvas调试信息绘制
const drawDebugInfo = () => {
    const canvas = imageCanvas.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 保存当前绘制状态
    ctx.save()

    // 获取Canvas的实际显示尺寸
    const rect = canvas.getBoundingClientRect()

    // 设置调试信息样式 - 更大的背景框
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'  // 更不透明的黑色背景
    ctx.fillRect(5, 5, 400, 240)  // 更大的调试信息背景框

    ctx.fillStyle = '#00ff00'  // 绿色文字
    ctx.font = '12px monospace'  // 稍小字体以容纳更多信息
    ctx.textAlign = 'left'

    // 绘制调试信息
    const debugLines = [
        `工具: material-replacement`,
        `SAM已加载: ${isImageLoadedToSAM.value}`,
        `TaskID: ${samTaskId.value?.substring(0, 8) || 'null'}...`,
        `Canvas存在: ${!!canvas}`,
        `图片存在: ${!!mainImage.value}`,
        `Canvas像素: ${canvas.width}x${canvas.height}`,
        `Canvas显示: ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        `CSS缩放: ${Math.round((rect.width / canvas.width) * 100)}%`,
        `点击点总数: ${clickPoints.value.length}`,
        `前景点: ${clickPoints.value.filter(p => p.type === 'foreground').length}`,
        `背景点: ${clickPoints.value.filter(p => p.type === 'background').length}`,
        `有当前蒙版: ${!!currentMask.value}`,
        `悬浮预览: ${isHovering.value}`,
        `图层数量: ${layers.value.length}`,
        `选中图层: ${selectedLayerId.value || 'none'}`,
        `蒙版透明度: ${maskOpacity.value}%`,
        `鼠标显示: ${mousePosition.value.show}`,
        `SAM处理中: ${isSamProcessing.value}`
    ]

    debugLines.forEach((line, index) => {
        ctx.fillText(line, 10, 20 + index * 13)  // 调整行高和位置
    })

    // 如果有最后一次点击的坐标，也显示
    if (clickPoints.value.length > 0) {
        const lastPoint = clickPoints.value[clickPoints.value.length - 1]
        ctx.fillText(`最后点击: (${lastPoint.x}, ${lastPoint.y})`, 10, 20 + debugLines.length * 13)
    }

    // 恢复绘制状态
    ctx.restore()
}

// 只在蒙版白色区域渲染材质（关键函数）- 优化版
const renderMaterialInMaskRegion = (ctx: CanvasRenderingContext2D, maskImg: HTMLImageElement, materialImg: HTMLImageElement, layer: Layer) => {
    const transform = layer.materialTransform || { x: 0, y: 0, scale: 1, rotation: 0 }

    // 创建临时canvas，只处理材质区域
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = ctx.canvas.width
    tempCanvas.height = ctx.canvas.height

    // 🎯 优化：精确检测蒙版白色区域
    const maskCanvas = document.createElement('canvas')
    const maskCtx = maskCanvas.getContext('2d')!
    maskCanvas.width = ctx.canvas.width
    maskCanvas.height = ctx.canvas.height
    maskCtx.drawImage(maskImg, 0, 0)
    const maskImageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

    // 🎯 创建精确的白色区域蒙版（阈值检测）
    const whiteMaskData = maskCtx.createImageData(maskCanvas.width, maskCanvas.height)
    for (let i = 0; i < maskImageData.data.length; i += 4) {
        const r = maskImageData.data[i]
        const g = maskImageData.data[i + 1]
        const b = maskImageData.data[i + 2]

        // 精确检测白色区域（RGB值均大于200认为是白色）
        const isWhite = r > 200 && g > 200 && b > 200

        whiteMaskData.data[i] = isWhite ? 255 : 0      // R
        whiteMaskData.data[i + 1] = isWhite ? 255 : 0  // G
        whiteMaskData.data[i + 2] = isWhite ? 255 : 0  // B
        whiteMaskData.data[i + 3] = isWhite ? 255 : 0  // A
    }

    // 应用精确的白色蒙版
    const preciseMaskCanvas = document.createElement('canvas')
    const preciseMaskCtx = preciseMaskCanvas.getContext('2d')!
    preciseMaskCanvas.width = maskCanvas.width
    preciseMaskCanvas.height = maskCanvas.height
    preciseMaskCtx.putImageData(whiteMaskData, 0, 0)

    // 🎨 步骤1：创建材质纹理
    tempCtx.save()
    tempCtx.translate(transform.x, transform.y)
    tempCtx.scale(transform.scale, transform.scale)
    tempCtx.rotate(transform.rotation * Math.PI / 180)

    const pattern = tempCtx.createPattern(materialImg, 'repeat')
    if (pattern) {
        tempCtx.fillStyle = pattern
        tempCtx.fillRect(-transform.x / transform.scale, -transform.y / transform.scale,
            tempCanvas.width / transform.scale, tempCanvas.height / transform.scale)
    }
    tempCtx.restore()

    // 🎯 步骤2：应用羽化效果到蒙版
    const featheredMaskCanvas = applyFeatherToMask(preciseMaskCanvas, featherRadius.value)

    // 步骤3：关键 - 使用羽化后的精确蒙版，只保留白色区域的材质
    tempCtx.globalCompositeOperation = 'destination-in'
    tempCtx.drawImage(featheredMaskCanvas, 0, 0)

    // 🎨 步骤4：根据混合模式优化渲染效果
    let finalAlpha = (materialIntensity.value / 100) * (materialOpacity.value / 100)  // 结合强度和透明度
    let finalBlendMode = materialBlendMode.value as GlobalCompositeOperation

    // 💡 正片叠底模式特殊优化
    if (materialBlendMode.value === 'multiply') {
        // 正片叠底模式下，适当提高材质强度以获得更好的视觉效果
        finalAlpha = Math.min(1.0, (materialIntensity.value / 100) * 1.2 * (materialOpacity.value / 100))

        // 如果启用了保持光影，需要特殊处理
        if (preserveShading.value) {
            // 保持光影时，使用更温和的混合
            finalAlpha *= 0.85
        }
    } else if (materialBlendMode.value === 'multiply-enhanced') {
        // 💡 增强正片叠底模式 - 专为材质替换优化
        finalBlendMode = 'multiply' // 使用原生multiply作为基础

        // 增强版参数调整，包含透明度
        const baseAlpha = (materialIntensity.value / 100) * (materialOpacity.value / 100)
        if (preserveShading.value) {
            // 保持光影时，使用多层混合技术
            finalAlpha = Math.min(1.0, baseAlpha * 1.5)
        } else {
            // 不保持光影时，更强烈的材质效果
            finalAlpha = Math.min(1.0, baseAlpha * 1.8)
        }

        console.log('🚀 使用增强正片叠底模式，强度提升:', {
            原始强度: materialIntensity.value,
            透明度: materialOpacity.value,
            最终强度: Math.round(finalAlpha * 100),
            保持光影: preserveShading.value
        })
    }

    // 🎨 步骤4：应用材质到主canvas
    if (materialBlendMode.value === 'multiply-enhanced') {
        // 💡 增强正片叠底：使用多层混合技术
        renderEnhancedMultiplyBlend(ctx, tempCanvas, finalAlpha, preserveShading.value)
    } else {
        // 标准混合模式
        ctx.save()
        ctx.globalCompositeOperation = finalBlendMode
        ctx.globalAlpha = finalAlpha
        ctx.drawImage(tempCanvas, 0, 0)
        ctx.restore()
    }

    console.log('✅ 优化版材质精确应用在白色区域:', {
        图层: layer.id,
        材质: layer.material?.name,
        混合模式: materialBlendMode.value,
        强度: `${materialIntensity.value}%`,
        透明度: `${materialOpacity.value}%`,
        羽化: `${featherRadius.value}px`,
        最终透明度: `${Math.round(finalAlpha * 100)}%`,
        白色像素检测: '完成',
        保持光影: preserveShading.value
    })
}

// 羽化蒙版函数 - 让材质边缘更自然
const applyFeatherToMask = (maskCanvas: HTMLCanvasElement, featherRadius: number): HTMLCanvasElement => {
    if (featherRadius <= 0) {
        return maskCanvas  // 无需羽化，直接返回原蒙版
    }

    const featheredCanvas = document.createElement('canvas')
    const featheredCtx = featheredCanvas.getContext('2d')!
    featheredCanvas.width = maskCanvas.width
    featheredCanvas.height = maskCanvas.height

    // 获取原始蒙版数据
    featheredCtx.drawImage(maskCanvas, 0, 0)
    const originalData = featheredCtx.getImageData(0, 0, featheredCanvas.width, featheredCanvas.height)
    const featheredData = featheredCtx.createImageData(featheredCanvas.width, featheredCanvas.height)

    const width = featheredCanvas.width
    const height = featheredCanvas.height

    // 🌟 高斯模糊羽化算法
    console.log('🪶 开始应用羽化效果，半径:', featherRadius)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let totalWeight = 0
            let weightedSum = 0

            // 在羽化半径内计算加权平均值
            for (let dy = -featherRadius; dy <= featherRadius; dy++) {
                for (let dx = -featherRadius; dx <= featherRadius; dx++) {
                    const nx = x + dx
                    const ny = y + dy

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance <= featherRadius) {
                            // 高斯权重计算
                            const weight = Math.exp(-(distance * distance) / (2 * featherRadius * featherRadius))
                            const idx = (ny * width + nx) * 4

                            weightedSum += originalData.data[idx] * weight  // 使用R通道
                            totalWeight += weight
                        }
                    }
                }
            }

            const featheredValue = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
            const idx = (y * width + x) * 4

            featheredData.data[idx] = featheredValue     // R
            featheredData.data[idx + 1] = featheredValue // G
            featheredData.data[idx + 2] = featheredValue // B
            featheredData.data[idx + 3] = featheredValue // A
        }
    }

    // 应用羽化后的数据
    featheredCtx.putImageData(featheredData, 0, 0)

    console.log('✨ 羽化效果应用完成，边缘已软化')
    return featheredCanvas
}

// 增强正片叠底渲染函数 - 多层混合技术
const renderEnhancedMultiplyBlend = (ctx: CanvasRenderingContext2D, materialCanvas: HTMLCanvasElement, alpha: number, preserveShading: boolean) => {
    if (preserveShading) {
        // 🎨 保持光影模式：使用渐进式多层混合
        console.log('🎨 使用保持光影的增强正片叠底')

        // 第一层：基础材质层 (50% 强度)
        ctx.save()
        ctx.globalCompositeOperation = 'multiply'
        ctx.globalAlpha = alpha * 0.5
        ctx.drawImage(materialCanvas, 0, 0)
        ctx.restore()

        // 第二层：增强层 (30% 强度)
        ctx.save()
        ctx.globalCompositeOperation = 'color-burn'
        ctx.globalAlpha = alpha * 0.3
        ctx.drawImage(materialCanvas, 0, 0)
        ctx.restore()

        // 第三层：细节层 (20% 强度)
        ctx.save()
        ctx.globalCompositeOperation = 'darken'
        ctx.globalAlpha = alpha * 0.2
        ctx.drawImage(materialCanvas, 0, 0)
        ctx.restore()

    } else {
        // 🔥 强烈材质模式：更强烈的混合效果
        console.log('🔥 使用强烈材质的增强正片叠底')

        // 第一层：主要材质层 (80% 强度)
        ctx.save()
        ctx.globalCompositeOperation = 'multiply'
        ctx.globalAlpha = alpha * 0.8
        ctx.drawImage(materialCanvas, 0, 0)
        ctx.restore()

        // 第二层：颜色加深层 (60% 强度)
        ctx.save()
        ctx.globalCompositeOperation = 'color-burn'
        ctx.globalAlpha = alpha * 0.6
        ctx.drawImage(materialCanvas, 0, 0)
        ctx.restore()

        // 第三层：强化层 (40% 强度)
        ctx.save()
        ctx.globalCompositeOperation = 'overlay'
        ctx.globalAlpha = alpha * 0.4
        ctx.drawImage(materialCanvas, 0, 0)
        ctx.restore()
    }

    console.log('✨ 增强正片叠底渲染完成:', {
        总强度: Math.round(alpha * 100),
        保持光影: preserveShading,
        混合层数: 3
    })
}

// 渲染蒙版覆盖层（没有材质时）
const renderMaskOverlay = (ctx: CanvasRenderingContext2D, maskImg: HTMLImageElement) => {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = ctx.canvas.width
    tempCanvas.height = ctx.canvas.height

    // 创建半透明黑色覆盖
    tempCtx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

    // 只保留蒙版区域
    tempCtx.globalCompositeOperation = 'destination-in'
    tempCtx.drawImage(maskImg, 0, 0)

    // 合成到主canvas
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(tempCanvas, 0, 0)
}

// 提取蒙版区域的亮度信息
const extractLuminanceFromMask = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, maskImg: HTMLImageElement): ImageData => {
    // 创建临时canvas获取原始图像数据
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')!
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height

    // 只绘制蒙版区域，不绘制原图
    // 这样可以确保只有蒙版区域有数据
    tempCtx.drawImage(maskImg, 0, 0)

    return tempCtx.getImageData(0, 0, canvas.width, canvas.height)
}

// 创建材质纹理
const createMaterialTexture = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, materialImg: HTMLImageElement, transform: any): HTMLCanvasElement => {
    const textureCanvas = document.createElement('canvas')
    const textureCtx = textureCanvas.getContext('2d')!
    textureCanvas.width = canvas.width
    textureCanvas.height = canvas.height

    textureCtx.save()
    textureCtx.translate(transform.x, transform.y)
    textureCtx.scale(transform.scale, transform.scale)
    textureCtx.rotate(transform.rotation * Math.PI / 180)

    // 创建重复图案
    const pattern = textureCtx.createPattern(materialImg, 'repeat')
    if (pattern) {
        textureCtx.fillStyle = pattern
        textureCtx.fillRect(-transform.x / transform.scale, -transform.y / transform.scale,
            textureCanvas.width / transform.scale, textureCanvas.height / transform.scale)
    }

    textureCtx.restore()
    return textureCanvas
}

// 光影保持混合
const blendWithLuminance = (ctx: CanvasRenderingContext2D, materialTexture: HTMLCanvasElement, originalLuminance: ImageData, maskImg: HTMLImageElement) => {
    // 先清空临时canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // 步骤1：绘制材质纹理
    ctx.globalCompositeOperation = 'source-over'
    ctx.drawImage(materialTexture, 0, 0)

    // 步骤2：关键 - 只保留蒙版区域的材质
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(maskImg, 0, 0, ctx.canvas.width, ctx.canvas.height)

    console.log('✅ 材质已限制在蒙版区域内')
}

// 简单材质渲染
const renderSimpleMaterial = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, maskImg: HTMLImageElement, materialImg: HTMLImageElement, transform: any) => {
    // 先清空临时canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)
    ctx.rotate(transform.rotation * Math.PI / 180)

    const pattern = ctx.createPattern(materialImg, 'repeat')
    if (pattern) {
        ctx.fillStyle = pattern
        ctx.fillRect(-transform.x / transform.scale, -transform.y / transform.scale,
            canvas.width / transform.scale, canvas.height / transform.scale)
    }

    ctx.restore()

    // 关键 - 只保留蒙版区域的材质
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height)

    console.log('✅ 简单材质已限制在蒙版区域内')
}

// 实时更新材质效果
const updateMaterialEffect = () => {
    if (selectedLayerId.value) {
        redrawCanvasWithLayers()
    }
}

// 切换白色区域调试显示
const toggleWhiteAreaDebug = () => {
    showWhiteAreaDebug.value = !showWhiteAreaDebug.value

    if (showWhiteAreaDebug.value && currentMask.value) {
        // 显示白色区域调试信息
        drawWhiteAreaDebugInfo()
        ElMessage.info('白色区域调试模式已开启')
    } else {
        // 恢复正常显示
        drawCanvasWithMask()
        ElMessage.info('白色区域调试模式已关闭')
    }
}

// 绘制白色区域调试信息
const drawWhiteAreaDebugInfo = async () => {
    if (!currentMask.value || !imageCanvas.value) return

    const canvas = imageCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    console.log('🔍 开始白色区域调试分析...')

    // 先重绘基础图像
    await drawCanvasWithMask()

    // 加载当前蒙版
    const maskImg = new Image()
    maskImg.onload = () => {
        // 创建临时canvas分析蒙版
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')!
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        tempCtx.drawImage(maskImg, 0, 0)

        const maskData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        let whitePixelCount = 0
        let totalPixels = 0

        // 分析白色像素
        for (let i = 0; i < maskData.data.length; i += 4) {
            const r = maskData.data[i]
            const g = maskData.data[i + 1]
            const b = maskData.data[i + 2]

            totalPixels++

            // 检测白色区域（RGB值均大于200）
            if (r > 200 && g > 200 && b > 200) {
                whitePixelCount++

                // 在白色区域绘制红色边框以便调试
                const x = (i / 4) % tempCanvas.width
                const y = Math.floor((i / 4) / tempCanvas.width)

                // 每10个像素绘制一个调试点
                if (x % 10 === 0 && y % 10 === 0) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
                    ctx.fillRect(x - 1, y - 1, 3, 3)
                }
            }
        }

        // 绘制统计信息
        const coverage = ((whitePixelCount / totalPixels) * 100).toFixed(2)
        ctx.save()
        ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'
        ctx.fillRect(10, canvas.height - 80, 300, 70)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px monospace'
        ctx.fillText(`🔍 白色区域调试信息`, 15, canvas.height - 60)
        ctx.fillText(`总像素: ${totalPixels.toLocaleString()}`, 15, canvas.height - 45)
        ctx.fillText(`白色像素: ${whitePixelCount.toLocaleString()}`, 15, canvas.height - 30)
        ctx.fillText(`覆盖率: ${coverage}%`, 15, canvas.height - 15)
        ctx.restore()

        console.log('✅ 白色区域分析完成:', {
            总像素: totalPixels,
            白色像素: whitePixelCount,
            覆盖率: coverage + '%'
        })
    }

    maskImg.src = currentMask.value
}

// 保存设计图片功能
const saveDesignImage = () => {
    if (!imageCanvas.value || !mainImage.value) {
        ElMessage.warning('没有可保存的设计内容')
        return
    }

    try {
        // 创建一个新的canvas来生成最终图片
        const finalCanvas = document.createElement('canvas')
        const finalCtx = finalCanvas.getContext('2d')!

        // 设置最终canvas尺寸为1024x1024
        finalCanvas.width = 1024
        finalCanvas.height = 1024

        console.log('🖼️ 开始生成最终设计图片...')

        // 绘制当前canvas的内容（包含所有材质效果）
        finalCtx.drawImage(imageCanvas.value, 0, 0)

        // 转换为blob并下载
        finalCanvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url

                // 生成文件名（包含时间戳）
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
                link.download = `ai-shoes-design-${timestamp}.png`

                // 触发下载
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // 清理临时URL
                URL.revokeObjectURL(url)

                ElMessage.success('设计图片保存成功！')

                console.log('✅ 设计图片已保存:', {
                    文件名: link.download,
                    尺寸: `${finalCanvas.width}x${finalCanvas.height}`,
                    格式: 'PNG',
                    包含图层数: layers.value.length
                })
            } else {
                throw new Error('无法生成图片文件')
            }
        }, 'image/png', 1.0)  // 最高质量PNG

    } catch (error: any) {
        console.error('保存图片失败:', error)
        ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
    }
}

// 批量保存功能（可选 - 分别保存原图和各图层）
const saveBatchImages = () => {
    if (!imageCanvas.value || !mainImage.value) {
        ElMessage.warning('没有可保存的内容')
        return
    }

    try {
        console.log('📦 开始批量保存...')

        // 1. 保存完整设计
        saveDesignImage()

        // 2. 保存原图
        const originalCanvas = document.createElement('canvas')
        const originalCtx = originalCanvas.getContext('2d')!
        originalCanvas.width = 1024
        originalCanvas.height = 1024

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            originalCtx.drawImage(img, 0, 0, 1024, 1024)

            originalCanvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
                    link.download = `ai-shoes-original-${timestamp}.png`
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                }
            }, 'image/png', 1.0)
        }
        img.src = mainImage.value

        ElMessage.success('批量保存完成！')

    } catch (error: any) {
        console.error('批量保存失败:', error)
        ElMessage.error(`批量保存失败: ${error.message || '未知错误'}`)
    }
}

// 保存命令处理
const handleSaveCommand = (command: string) => {
    switch (command) {
        case 'save-design':
            saveDesignImage()
            break
        case 'save-batch':
            saveBatchImages()
            break
        case 'save-high-res':
            saveHighResolutionImage()
            break
        default:
            console.warn('未知的保存命令:', command)
    }
}

// 保存高分辨率版本（2048x2048）
const saveHighResolutionImage = () => {
    if (!imageCanvas.value || !mainImage.value) {
        ElMessage.warning('没有可保存的设计内容')
        return
    }

    try {
        console.log('🖼️ 开始生成高分辨率设计图片...')

        // 创建高分辨率canvas (2048x2048)
        const highResCanvas = document.createElement('canvas')
        const highResCtx = highResCanvas.getContext('2d')!
        highResCanvas.width = 2048
        highResCanvas.height = 2048

        // 禁用图像平滑以保持清晰度
        highResCtx.imageSmoothingEnabled = false

        // 将当前canvas内容放大到高分辨率
        highResCtx.drawImage(imageCanvas.value, 0, 0, 1024, 1024, 0, 0, 2048, 2048)

        // 转换为blob并下载
        highResCanvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url

                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
                link.download = `ai-shoes-design-highres-${timestamp}.png`

                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                URL.revokeObjectURL(url)

                ElMessage.success('高分辨率设计图片保存成功！')

                console.log('✅ 高分辨率设计图片已保存:', {
                    文件名: link.download,
                    尺寸: `${highResCanvas.width}x${highResCanvas.height}`,
                    格式: 'PNG',
                    分辨率: '高分辨率(2x)'
                })
            } else {
                throw new Error('无法生成高分辨率图片文件')
            }
        }, 'image/png', 1.0)

    } catch (error: any) {
        console.error('保存高分辨率图片失败:', error)
        ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
    }
}

// 获取材质图片的正确URL
const getMaterialImageUrl = (material: any): string => {
    // 如果realUrl是对象（API返回的对象格式）
    if (material.realUrl && typeof material.realUrl === 'object') {
        if (material.realUrl.downloadUrl) {
            return material.realUrl.downloadUrl
        }
    }

    // 如果realUrl是字符串
    if (material.realUrl && typeof material.realUrl === 'string') {
        return material.realUrl
    }

    // 回退到ossPath
    if (material.ossPath) {
        return formatMaterialImageUrlSync(material.ossPath)
    }

    return ''
}

// 简单的图片加载错误处理 - 避免无限循环
const handleSimpleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement

    // 防止重复触发错误处理
    if (img.dataset.errorHandled === 'true') {
        return
    }
    img.dataset.errorHandled = 'true'

    console.warn('⚠️ 材质图片加载失败:', img.src)

    // 设置简单的灰色占位图
    img.style.background = '#f5f5f5'
    img.style.border = '1px dashed #ccc'
    img.alt = '图片加载失败'

    // 移除src避免继续重试
    img.removeAttribute('src')
}

// 材质相关
const loadSystemMaterials = async (keyword?: string) => {
    try {
        const response = await getSystemMaterials(1, 20, keyword)
        console.log('系统材质响应:', response)

        if (response.code === 200 || response.code === 0) {
            systemMaterials.value = response.data.records || []
            console.log('✅ 系统材质加载成功，数量:', systemMaterials.value.length)

            // 详细记录系统材质数据结构
            if (systemMaterials.value.length > 0) {
                console.log('📝 系统材质数据示例:', systemMaterials.value[0])
                console.log('🔍 所有系统材质数据:', systemMaterials.value)
            }

            // 如果没有材质，显示提示
            if (systemMaterials.value.length === 0) {
                console.log('⚠️ 系统材质库为空')
                ElMessage.info('系统材质库暂无材质')
                return
            }

            // 异步加载每个材质的真实URL
            for (const material of systemMaterials.value) {
                console.log(`🔧 处理系统材质 ${material.name}:`, {
                    id: material.id,
                    ossPath: material.ossPath,
                    realUrl: material.realUrl,
                    原始数据: material
                })

                try {
                    // 如果没有realUrl，尝试获取
                    if (!material.realUrl && material.ossPath) {
                        console.log(`🌐 获取URL for ${material.name}...`)
                        const realUrl = await formatMaterialImageUrl(material)
                        material.realUrl = realUrl
                        console.log(`✅ URL获取成功 ${material.name}:`, realUrl)
                    } else if (!material.ossPath) {
                        console.warn(`⚠️ 材质 ${material.name} 没有ossPath`)
                    }
                } catch (error) {
                    console.warn('材质URL获取失败:', material.name, error)
                    // 即使URL获取失败，也设置一个备用URL
                    if (material.ossPath) {
                        material.realUrl = formatMaterialImageUrlSync(material.ossPath)
                        console.log(`🔄 使用备用URL ${material.name}:`, material.realUrl)
                    }
                }
            }
        } else {
            console.warn('❌ 系统材质API返回错误:', response.msg)
            ElMessage.error(`系统材质加载失败: ${response.msg || '未知错误'}`)
        }
    } catch (error) {
        console.error('加载系统材质失败:', error)
        ElMessage.error('加载系统材质失败')
    }
}

const loadUserMaterials = async () => {
    try {
        const response = await getUserMaterials(1, 20)
        console.log('用户材质响应:', response)

        if (response.code === 200 || response.code === 0) {
            userMaterials.value = response.data.records || []
            console.log('✅ 用户材质加载成功，数量:', userMaterials.value.length)

            // 对比用户材质的数据结构
            if (userMaterials.value.length > 0) {
                console.log('📝 用户材质数据示例:', userMaterials.value[0])
            }

            // 异步加载用户材质的真实URL
            for (const material of userMaterials.value) {
                try {
                    if (!material.realUrl && material.ossPath) {
                        const realUrl = await formatMaterialImageUrl(material)
                        material.realUrl = realUrl
                    }
                } catch (error) {
                    console.warn('用户材质URL获取失败:', material.name, error)
                    if (material.ossPath) {
                        material.realUrl = formatMaterialImageUrlSync(material.ossPath)
                    }
                }
            }
        } else {
            console.warn('用户材质加载失败:', response.msg)
        }
    } catch (error) {
        console.error('加载用户材质失败:', error)
        ElMessage.error('加载用户材质失败')
    }
}

const searchSystemMaterials = () => {
    loadSystemMaterials(systemSearchKeyword.value)
}

const selectMaterial = (material: Material) => {
    if (!selectedLayerId.value) {
        ElMessage.warning('请先选择一个图层')
        return
    }

    // 找到选中的图层
    const layer = layers.value.find(l => l.id === selectedLayerId.value)
    if (!layer) {
        ElMessage.warning('未找到选中的图层')
        return
    }

    // 应用材质到图层
    layer.material = material
    layer.materialTransform = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0
    }

    // 更新图层预览
    if (layer.material) {
        updateLayerPreview(layer)
    }

    // 立即重新绘制canvas显示材质应用效果
    redrawCanvasWithLayers()

    ElMessage.success(`材质 "${material.name}" 已应用到图层 (${materialBlendMode.value}模式, ${materialIntensity.value}%强度)`)
}

// 上传用户材质
const handleUploadMaterial = () => {
    showUploadDialog.value = true
    uploadForm.name = ''
    uploadForm.type = 1 // 用户材质库
    uploadForm.file = null

    // 清空上传组件的文件列表
    nextTick(() => {
        if (uploadRef.value) {
            uploadRef.value.clearFiles()
        }
    })
}

// 上传系统材质
const handleUploadSystemMaterial = () => {
    showUploadDialog.value = true
    uploadForm.name = ''
    uploadForm.type = 0 // 系统材质库
    uploadForm.file = null

    // 清空上传组件的文件列表
    nextTick(() => {
        if (uploadRef.value) {
            uploadRef.value.clearFiles()
        }
    })
}

const handleMaterialFileChange = (file: any) => {
    console.log('🔧 文件选择事件:', {
        file: file,
        raw: file?.raw,
        name: file?.name,
        type: file?.type
    })

    if (file && file.raw) {
        uploadForm.file = file.raw
        console.log('✅ 文件已设置:', uploadForm.file)
    } else {
        console.warn('⚠️ 文件对象无效:', file)
    }
}

const confirmUploadMaterial = async () => {
    console.log('🚀 确认上传材质:', {
        name: uploadForm.name,
        type: uploadForm.type,
        file: uploadForm.file,
        hasName: !!uploadForm.name,
        hasFile: !!uploadForm.file
    })

    if (!uploadForm.name || !uploadForm.file) {
        console.warn('❌ 验证失败:', {
            name: uploadForm.name || '未填写',
            file: uploadForm.file || '未选择'
        })
        ElMessage.warning('请填写完整信息')
        return
    }

    isUploading.value = true
    try {
        ElMessage.info('正在上传材质...')
        const response = await uploadMaterial(uploadForm.name, uploadForm.type, uploadForm.file)
        console.log('材质上传响应:', response)

        if (response.code === 200 || response.code === 0) {
            const materialTypeText = uploadForm.type === 0 ? '系统材质库' : '用户材质库'
            ElMessage.success(`材质已成功上传到${materialTypeText}`)
            showUploadDialog.value = false

            // 重置表单
            uploadForm.name = ''
            const currentType = uploadForm.type
            uploadForm.type = 1
            uploadForm.file = null

            // 根据上传类型刷新对应的材质列表
            if (currentType === 0) {
                await loadSystemMaterials()
            } else {
                await loadUserMaterials()
            }
        } else {
            throw new Error(response.msg || '上传失败')
        }
    } catch (error: any) {
        console.error('材质上传失败:', error)
        ElMessage.error(`材质上传失败: ${error.message || '未知错误'}`)
    } finally {
        isUploading.value = false
    }
}

// 编辑系统材质（仅展示功能）
const editSystemMaterial = (materialId: number) => {
    ElMessage.info('系统材质编辑功能需要管理员权限')
    console.log('尝试编辑系统材质ID:', materialId)
}

const deleteMaterial = async (materialId: number) => {
    try {
        await ElMessageBox.confirm('确认删除这个材质吗？', '确认删除', {
            type: 'warning'
        })

        const response = await deleteMaterialApi(materialId)
        if (response.code === 200 || response.code === 0) {
            ElMessage.success('删除成功')
            loadUserMaterials() // 刷新用户材质列表
        }
    } catch (error) {
        if (error !== 'cancel') {
            ElMessage.error('删除失败')
        }
    }
}

// 监听tab切换
watch(activeTab, (newTab) => {
    if (newTab === 'system') {
        loadSystemMaterials()
    } else if (newTab === 'user') {
        loadUserMaterials()
    }
})

onMounted(() => {
    loadSystemMaterials()
})
</script>

<style scoped>
.material-replacement-page {
    width: 100%;
    min-height: 100vh;
    background-image: url('../../assets/bg.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    color: white;
    position: relative;
    font-family: 'Microsoft YaHei', Arial, sans-serif;
}



.main-content {
    margin-left: 80px;
    /* 向右移动120px，避免遮挡导航按钮 */

    width: calc(100% - 120px);
    /* 调整宽度适应左边距 */
}

.replacement-container {
    display: flex;
    gap: 20px;
    min-height: calc(100vh - 120px);
    max-height: calc(100vh - 120px);
    overflow: hidden;
}

.left-panel {
    width: 280px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 20px;
    backdrop-filter: blur(10px);
}

.work-area {
    flex: 1;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    max-height: 100%;
    overflow: auto;
}

.right-panel {
    width: 300px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 20px;
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    overflow-x: hidden;
}

/* 美化滚动条样式 */
.right-panel::-webkit-scrollbar {
    width: 8px;
}

.right-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.right-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    transition: background 0.3s ease;
}

.right-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

.section-header {
    margin-bottom: 15px;
}

.section-header h3 {
    color: #c8ad7f;
    font-size: 18px;
    margin-bottom: 5px;
}

.section-header p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin: 0;
}

.image-upload-area {
    width: 100%;
    height: 200px;
    border: 2px dashed rgba(200, 173, 127, 0.5);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.image-upload-area:hover {
    border-color: #c8ad7f;
    background: rgba(200, 173, 127, 0.1);
}

.image-preview {
    width: 100%;
    height: 100%;
    position: relative;
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
}

.image-overlay {
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
    color: white;
}

.image-preview:hover .image-overlay {
    opacity: 1;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.7);
}

.upload-icon {
    font-size: 48px;
    margin-bottom: 15px;
    color: #c8ad7f;
}

.upload-text p {
    margin: 0;
    text-align: center;
}

.upload-hint {
    font-size: 12px;
    opacity: 0.8;
}

.sam-section {
    margin-top: 20px;
    text-align: center;
}

.sam-btn {
    width: 100%;
    height: 45px;
    background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
    border: none;
    border-radius: 22px;
    font-size: 16px;
    font-weight: bold;
}

.sam-hint {
    margin-top: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
}

.empty-workspace {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.empty-message {
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
}

.empty-icon {
    font-size: 64px;
    margin-bottom: 20px;
    color: #c8ad7f;
}

.workspace-content {
    width: 100%;
    height: 100%;
}

.sam-workspace {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.operation-tips {
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-bottom: 15px;
}

.tips-content {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}

.tip-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
}

.tip-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.tip-dot.left-click {
    background: #00ff00;
}

.tip-dot.right-click {
    background: #ff0000;
}

.canvas-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.canvas-wrapper {
    flex: 1;
    position: relative;
    border: 1px solid rgba(200, 173, 127, 0.3);
    border-radius: 8px;
    overflow: hidden;
    /* 固定尺寸以匹配Canvas */
    width: 1024px;
    height: 1024px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #111;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.image-canvas {
    width: 1024px !important;
    height: 1024px !important;
    cursor: none;
    /* 禁用默认光标 */
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    display: block;
    /* 强制固定尺寸，不允许缩放 */
    min-width: 1024px;
    min-height: 1024px;
    max-width: 1024px;
    max-height: 1024px;
}

.point-marker {
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 10;
}

.point-marker.foreground .point-inner {
    width: 100%;
    height: 100%;
    background: #00ff00;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.point-marker.background .point-inner {
    width: 100%;
    height: 100%;
    background: #ff0000;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

/* 自定义光标样式 */
.custom-cursor {
    position: absolute;
    pointer-events: none;
    z-index: 15;
    left: 0;
    top: 0;
}

.cursor-crosshair {
    position: relative;
    width: 0;
    height: 0;
}

.cursor-line {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}

.cursor-line-h {
    width: 24px;
    height: 1px;
    top: 0;
    left: -12px;
}

.cursor-line-v {
    width: 1px;
    height: 24px;
    left: 0;
    top: -12px;
}

.cursor-center {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #00ff88;
    border: 1px solid white;
    border-radius: 50%;
    top: -1.5px;
    left: -1.5px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
}

/* 悬浮预览Canvas样式 */
.hover-preview-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 1024px !important;
    height: 1024px !important;
    pointer-events: none;
    z-index: 10;
    /* 确保与主Canvas完全重叠 */
}

.mask-controls {
    display: flex;
    align-items: center;
    padding: 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    margin-top: 10px;
}

.layers-section {
    flex: 1;
}

.layers-list {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 5px;
}

/* 图层列表滚动条样式 */
.layers-list::-webkit-scrollbar {
    width: 6px;
}

.layers-list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.layers-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.layers-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
}

.layer-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.layer-item:hover {
    background: rgba(200, 173, 127, 0.2);
}

.layer-item.active {
    background: rgba(0, 150, 255, 0.3);
    border: 2px solid rgba(0, 150, 255, 0.8);
    box-shadow: 0 0 10px rgba(0, 150, 255, 0.5);
    transform: scale(1.02);
}

.layer-preview {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.layer-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.layer-placeholder {
    color: #c8ad7f;
    font-weight: bold;
}

.material-preview {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border: 1px solid rgba(200, 173, 127, 0.5);
    border-radius: 3px;
    overflow: hidden;
}

.material-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.layer-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
}

.layer-name {
    color: white;
    font-size: 14px;
}

.material-name {
    color: #c8ad7f;
    font-size: 12px;
    opacity: 0.8;
    margin-top: 2px;
}

.materials-section {
    flex: 1;
}

.material-tabs {
    margin-bottom: 15px;
}

.search-box {
    margin-bottom: 15px;
}

.user-actions {
    margin-bottom: 15px;
}

.system-actions {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 15px;
}

.system-actions .search-box {
    flex: 1;
}

.form-tip {
    font-size: 12px;
    margin-top: 5px;
    line-height: 1.4;
}

/* 材质控制面板样式 */
.material-controls {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    border: 1px solid rgba(200, 173, 127, 0.2);
}

.material-controls h4 {
    color: #c8ad7f;
    font-size: 14px;
    margin: 0 0 15px 0;
    font-weight: 600;
}

.control-group {
    margin-bottom: 15px;
}

.control-group:last-child {
    margin-bottom: 0;
}

.control-group label {
    display: block;
    color: #c8ad7f;
    font-size: 12px;
    margin-bottom: 8px;
    font-weight: 500;
}

.control-group .el-select {
    width: 100%;
}

.control-group .el-slider {
    margin-top: 5px;
}

/* 材质效果实时预览提示 */
.material-preview-tip {
    font-size: 11px;
    color: #888;
    text-align: center;
    margin-top: 10px;
    font-style: italic;
}

.materials-content {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 5px;
}

/* 材质区域滚动条样式 */
.materials-content::-webkit-scrollbar {
    width: 6px;
}

.materials-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
}

.materials-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

.materials-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
}

.materials-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.material-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.material-card:hover {
    background: rgba(200, 173, 127, 0.2);
    transform: translateY(-2px);
}

.material-image {
    width: 100%;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
    margin-bottom: 8px;
    transition: opacity 0.3s ease;
}

.material-name {
    color: #333;
    font-size: 12px;
    text-align: center;
    margin-bottom: 5px;
    font-weight: 500;
}

.material-actions {
    display: flex;
    justify-content: center;
}

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
    z-index: 9999;
    backdrop-filter: blur(5px);
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

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* SAM加载动画样式 */
.sam-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(5px);
    border-radius: 8px;
}

.sam-loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    color: white;
    text-align: center;
}

.sam-loading-dots {
    display: flex;
    gap: 8px;
}

.sam-loading-dots .dot {
    width: 12px;
    height: 12px;
    background: #c8ad7f;
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite both;
}

.sam-loading-dots .dot:nth-child(1) {
    animation-delay: -0.32s;
}

.sam-loading-dots .dot:nth-child(2) {
    animation-delay: -0.16s;
}

.sam-loading-dots .dot:nth-child(3) {
    animation-delay: 0s;
}

@keyframes bounce {

    0%,
    80%,
    100% {
        transform: scale(0);
    }

    40% {
        transform: scale(1);
    }
}

.sam-loading-progress {
    width: 200px;
}

.progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%);
    border-radius: 2px;
    animation: loading-progress 2s ease-in-out infinite;
}

@keyframes loading-progress {
    0% {
        width: 0%;
    }

    50% {
        width: 70%;
    }

    100% {
        width: 100%;
    }
}

.sam-loading-text {
    color: #c8ad7f;
    font-size: 16px;
    font-weight: 500;
}

.cancel-btn {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
}

.cancel-btn:hover {
    color: white;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-tabs__header) {
    background: transparent;
}

:deep(.el-tabs__nav-wrap::after) {
    background: rgba(200, 173, 127, 0.3);
}

:deep(.el-tabs__active-bar) {
    background: #c8ad7f;
}

:deep(.el-tabs__item) {
    color: rgba(255, 255, 255, 0.7);
}

:deep(.el-tabs__item.is-active) {
    color: #c8ad7f;
}

:deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(200, 173, 127, 0.3);
}

:deep(.el-input__inner) {
    color: rgb(0, 0, 0);
}

:deep(.el-input__inner::placeholder) {
    color: rgba(255, 255, 255, 0.5);
}
</style>