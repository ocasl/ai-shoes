<template>
  <div class="history-page">
    <!-- 全局Loading进度条 -->
    <div v-if="shoeStore.aiTaskStatus === 'running'" class="global-loading-overlay">
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
      <router-link  to="/dashboard" class="menu-link">首 页</router-link>
      <router-link to="/design" class="menu-link">设计区</router-link>
      <router-link  to="/ai-tools" class="menu-link">AI小工具</router-link>
      <router-link  to="/history" class="menu-link">历史记录</router-link>
    </div>

    <!-- 主内容区 -->
    <div class="history-content">
      <!-- <div class="content-header">
        <h2>我的创作历史</h2>
      </div> -->

      <!-- 搜索区域 -->
      <!-- <div class="search-section">
        <el-form :model="searchForm" label-position="top" class="search-form">
          <el-row :gutter="20" type="flex" justify="space-between" align="middle">
            <el-col :span="16">
              <div class="time-range-container">
                <span class="time-range-label">时间范围：</span>
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  class="date-picker"
                  :size="'default'"
                  :editable="false"
                  :clearable="true"
                  :shortcuts="dateShortcuts"
                />
              </div>
            </el-col>
            <el-col :span="8" class="search-buttons">
              <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
              <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div> -->

      <!-- 历史记录卡片视图 -->
      <div v-if="!loading" class="history-grid" :class="{ 'no-border': !logData.length }">
        <div v-for="item in logData" :key="item.id" class="history-card" @click="showDetail(item)">
          <div class="card-image">
            <img v-if="getImageUrl(item)" :src="getImageUrl(item)" :alt="item.summary" />
            <div v-else class="no-image">
              <el-icon><Picture /></el-icon>
              <span>无图片</span>
            </div>
          </div>
          <div class="card-content">
            <h3>{{ getDisplayName(item.summary) }}</h3>
            <div class="card-meta">
              <span class="card-date">{{ formatDate(item.excuteTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && logData.length === 0" class="empty-container">
        <el-empty description="暂无历史记录" :image-size="200">
          <template #description>
            <p>您还没有创建任何作品</p>
          </template>
          <el-button type="primary" @click="$router.push('/ai-tools')">去创作</el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <!-- <div v-if="!loading && logData.length > 0" class="pagination-container">
        <el-pagination
          :current-page="pagination.pageNum"
          :page-size="pagination.pageSize"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div> -->
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentLog ? getDisplayName(currentLog.summary) : '作品详情'"
      width="65%"
 
      destroy-on-close
      class="detail-dialog"
    >
      <TwoChuang
        v-model="showTwoChuang"
        :options="twoChuangOptions"
        @select="handleTwoChuangSelect"
      />
      <div v-if="currentLog" class="log-detail">
        <div class="detail-header">
          <div class="detail-info">
            <p class="detail-meta">
              <!-- <el-tag effect="dark" type="info" size="large" round>
                <el-icon class="time-icon"><Calendar /></el-icon>
                {{ formatDate(currentLog.excuteTime) }}
              </el-tag> -->
              <el-tag effect="plain" type="success" class="cost-time-tag" v-if="currentLog.costTime">
                <el-icon><Timer /></el-icon>
                耗时: {{ Math.round(currentLog.costTime * 100) / 100 }}ms
              </el-tag>
            </p>
          </div>
        </div>

        <!-- 图片展示区域 -->
        <el-row >
          <el-col :span="12" class="gallery-col">
            <div class="gallery-main">
              <el-button
                class="gallery-arrow"
                :disabled="currentIndex === 0"
                @click="prevImage"
                circle
                size="large"
              >
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <img :src="selectedImage || ''" class="gallery-main-img" />
              <el-button
                class="gallery-arrow"
                :disabled="currentIndex === resultImages.length - 1"
                @click="nextImage"
                circle
                size="large"
              >
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
            <div class="image-actions">
              <div class="action-btn" @click="handleRecreate">
                <el-icon><InfoFilled /></el-icon>
                <span>二创</span>
              </div>
              <div class="action-btn" @click="downloadImage(selectedImage || '', '下载图片.png')">
                <el-icon><Download /></el-icon>
                <span>下载</span>
              </div>
            </div>
            <div class="gallery-thumbs">
              <img
                v-for="(img, idx) in resultImages"
                :key="idx"
                :src="img"
                :class="{active: selectedImage === img}"
                @click="selectImage(img, idx)"
              />
            </div>
          </el-col>
          <el-col :span="12">
            <!-- 图片放大查看区域 -->
            <div class="image-zoom-container">
              <div v-if="selectedImage" class="zoom-image-wrapper">
                <div class="zoom-image-container" @wheel="handleWheel" @mousedown="startPan" @mousemove="pan" @mouseup="stopPan" @mouseleave="stopPan">
                  <img 
                    :src="selectedImage" 
                    :alt="`放大图片`"
                    class="zoom-image"
                    :style="{ transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)` }"
                    draggable="false"
                  />
                </div>
              </div>
              <div v-else class="no-selected-image">
                <el-icon><Picture /></el-icon>
                <p>点击左侧图片进行放大查看</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      <div v-else class="detail-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
    </el-dialog>
    
  
   
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, onUnmounted } from 'vue'
import { getComfyuiLogs } from '../api/log'
import type { ComfyuiLogQueryParams, ComfyuiLogItem } from '../api/log'
import { ElMessage } from 'element-plus'
import { Picture, View, Loading, Calendar, InfoFilled, Search, Refresh, Download, Timer, Plus, Minus, ArrowLeft, ArrowRight, Scissor } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import TwoChuang from '../components/common/TwoChuang.vue'
import { useShoeStore } from '../store'

// 获取store
const shoeStore = useShoeStore()

// 搜索表单
const searchForm = reactive<ComfyuiLogQueryParams>({
  pageNum: 1,
  pageSize: 100, // 更改为12，适合卡片布局
  username: '',
  methodName: '',
  state: '',
  orderBy: 0 // 默认设置为0，表示按默认字段排序
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 分页信息
const pagination = reactive({
  pageNum: 1,
  pageSize: 100, // 更改为12，适合卡片布局
  total: 0
})

// 日志数据
const logData = ref<ComfyuiLogItem[]>([])
const loading = ref(false)

// 详情对话框
const detailDialogVisible = ref(false)
const currentLog = ref<ComfyuiLogItem | null>(null)
const resultImages = ref<string[]>([])
const selectedImage = ref<string | null>(null)
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const lastPanX = ref(0)
const lastPanY = ref(0)
const currentIndex = ref(0)

// 二创弹窗
const showTwoChuang = ref(false)
const twoChuangOptions = [
  {
    label: '款式融合',
    value: 'fusion',
    desc: '多图融合生成新款式',
    icon: InfoFilled,
    path: '/design/style-fusion'
  },
  {
    label: '鞋底换面',
    value: 'sole',
    desc: '鞋底与鞋面互换',
    icon: Scissor,
    path: '/design/sole-fusion'
  },
  {
    label: '款式延申',
    value: 'extend',
    desc: '款式延申生成新款式',
    icon: InfoFilled,
    path: '/design/style-extend'
  },
  {
    label: '局部修改',
    value: 'modify',
    desc: '局部修改图片',
    icon: Scissor,
    path: '/design/partial-modify'
  },
  {
    label: '文字创款',
    value: 'text',
    desc: '文字创款生成新款式',
    icon: InfoFilled,
    path: '/design/text-create'
  },
  {
    label: '一键配色',
    value: 'color',
    desc: '一键配色生成新款式',
    icon: InfoFilled,
    path: '/design/color-create'
  },
  {
    label: '一键抠图',
    value: 'image-swap',
    desc: '一键抠图生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/image-swap'
  },
  {
    label: '智能抠图',
    value: 'smart-cutout',
    desc: '交互式智能抠图，左键正点右键负点',
    icon: Scissor,
    path: '/design/smart-cutout'
  },
  {
    label: '高清放大',
    value: 'hd-enhance',
    desc: '高清放大生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/hd-enhance'
  },
  {
    label: '元素消除',
    value: 'element-remove',
    desc: '元素消除生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/element-remove'
  },
  {
    label: '图片修复',
    value: 'image-restore',
    desc: '图片修复生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/image-restore'
  },
  {
    label: '一键去水印',
    value: 'watermark-remove',
    desc: '一键去水印生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/watermark-remove'
  },
  {
    label: '一键线稿图',
    value: 'line-art',
    desc: '一键线稿图生成新款式',
    icon: InfoFilled,
    path: '/ai-tools/line-art'
  }
]

// 解析参数
const parsedArgs = computed(() => {
  if (!currentLog.value || !currentLog.value.args) return null;
  try {
    // 尝试解析JSON字符串
    console.log('解析args:', currentLog.value.args);
    const argsArray = JSON.parse(currentLog.value.args);
    
    // 检查是否是数组，并返回第一个元素
    if (Array.isArray(argsArray) && argsArray.length > 0) {
      console.log('解析后的参数:', argsArray[0]);
      return argsArray[0];
    } else if (typeof argsArray === 'object') {
      // 如果直接是对象，返回整个对象
      console.log('解析后的参数(对象):', argsArray);
      return argsArray;
    }
    return null;
  } catch (e) {
    console.error('解析参数失败:', e, currentLog.value.args);
    return null;
  }
});

// 获取日志数据
const fetchLogData = async () => {
  loading.value = true;
  
  try {
    // 构建查询参数
    const params: ComfyuiLogQueryParams = {
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    };
    
    // 添加日期范围
    if (dateRange.value) {
      // 转换日期格式为 LocalDateTime 格式
      params.begin = dateRange.value[0] ? `${dateRange.value[0]}T00:00:00` : undefined;
      params.end = dateRange.value[1] ? `${dateRange.value[1]}T23:59:59` : undefined;
    }
    
    // 确保 orderBy 是数字类型
    if (params.orderBy !== 0 && params.orderBy !== 1) {
      params.orderBy = 0;
    }
    
         // 添加用户信息参数
     try {
       const userInfoStr = localStorage.getItem('userInfo');
       if (userInfoStr) {
         const userInfo = JSON.parse(userInfoStr);
         if (userInfo.id) params.userId = userInfo.id;
         if (userInfo.username) params.username = userInfo.username;
         if (userInfo.nickname) params.nickname = userInfo.nickname;
         if (userInfo.uid) (params as any).uid = userInfo.uid;
       }
     } catch (e) {
       console.error('获取用户信息失败:', e);
     }
    
    console.log('查询参数:', params);
    const response = await getComfyuiLogs(params);
    console.log('API响应:', response);
    
    if (response.code === 200) {
      // 检查返回数据格式
      if (response.data && response.data.records) {
        // 新的分页格式，使用records数组
        logData.value = response.data.records;
        pagination.total = response.data.total || 0;
        pagination.pageNum = response.data.current || 1;
        pagination.pageSize = response.data.size || 12;
      } else if (Array.isArray(response.data)) {
        // 如果返回的是数组，直接使用
        logData.value = response.data;
        pagination.total = response.data.length; // 总数就是当前数组长度
      } else if (response.data && response.data.list) {
        // 如果返回的是旧对象格式，按原来的方式处理
        logData.value = response.data.list || [];
        pagination.total = response.data.total || 0;
      } else {
        console.error('未知的API响应格式:', response.data);
        logData.value = [];
        pagination.total = 0;
      }
      // 处理日志数据中的状态字段
      logData.value.forEach(item => {
        // 将状态字段转换为 success 或 error
        if (item.state === "1") {
          item.state = "success";
        } else {
          item.state = "error";
        }
        // 处理 error 字段，如果是字符串 "null"，则设为空字符串
        if (item.error === "null") {
          item.error = "";
        }
      });
      // 按excuteTime降序排序（最新的在前）
      logData.value.sort((a, b) => new Date(b.excuteTime).getTime() - new Date(a.excuteTime).getTime());
    } else {
      ElMessage.error(response.msg || '获取日志数据失败');
    }
  } catch (error) {
    console.error('获取日志数据出错:', error);
    ElMessage.error('获取日志数据出错');
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1 // 重置到第一页
  fetchLogData()
}

// 重置搜索
const resetSearch = () => {
  // 重置搜索表单
  searchForm.orderBy = 0
  dateRange.value = null
  
  // 重置分页
  pagination.pageNum = 1
  
  // 重新获取数据
  fetchLogData()
}

// 分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchLogData()
}

// 页码变化
const handleCurrentChange = (page: number) => {
  pagination.pageNum = page
  fetchLogData()
}

// 显示详情
const showDetail = async (row: ComfyuiLogItem) => {
  // 创建一个副本，避免修改原数据
  const logItem = { ...row };
  // 处理状态字段
  if (logItem.state === "1") {
    logItem.state = "success";
  } else {
    logItem.state = "error";
  }
  // 处理错误字段
  if (logItem.error === "null") {
    logItem.error = "";
  }
  currentLog.value = logItem;
  // 提取结果图片URL
  await extractImageUrls(logItem.result);
  // 默认选中第一张图片
  setTimeout(() => {
    selectedImage.value = resultImages.value[0] || null;
  }, 0);
  detailDialogVisible.value = true;
};

// 提取结果中的图片URL
const extractImageUrls = (resultStr: string) => {
  resultImages.value = [];
  
  if (!resultStr) {
    console.warn('结果字符串为空');
    return;
  }
  
  try {
    console.log('提取图片URL，原始结果:', resultStr);
    
    // 尝试解析JSON字符串，处理可能的双重编码
    let resultObj;
    try {
      // 首先尝试直接解析
      resultObj = JSON.parse(resultStr);
      console.log('第一次解析结果:', resultObj);
      
      // 如果解析出来的仍然是字符串，可能是双重编码
    if (typeof resultObj === 'string') {
        resultObj = JSON.parse(resultObj);
        console.log('第二次解析结果:', resultObj);
      }
    } catch (e) {
      console.error('JSON解析失败:', e);
      return;
    }
    
        // 提取图片URLs
    if (resultObj.code === 0 || resultObj.code === 200) {
      // 优先检查 ossUrls（新的格式）
      if (resultObj.data && resultObj.data.ossUrls) {
        resultImages.value = resultObj.data.ossUrls;
        console.log('提取到的图片URLs (ossUrls):', resultImages.value);
      } else if (resultObj.data && resultObj.data.viewUrls) {
        resultImages.value = resultObj.data.viewUrls;
        console.log('提取到的图片URLs (viewUrls):', resultImages.value);
      } else if (resultObj.viewUrls) {
        resultImages.value = resultObj.viewUrls;
        console.log('提取到的图片URLs(直接):', resultImages.value);
      }
    }
  } catch (e) {
    console.error('提取图片URL失败:', e);
    resultImages.value = [];
  }
};

// 从结果中获取第一张图片URL作为卡片展示
const getImageUrl = (item: ComfyuiLogItem) => {
  if (!item.result) {
    return null;
  }
  
  try {
    // 尝试解析可能的双重编码JSON
    let resultObj;
    try {
      resultObj = JSON.parse(item.result);
      
      // 如果解析出来的仍然是字符串，可能是双重编码
    if (typeof resultObj === 'string') {
        resultObj = JSON.parse(resultObj);
      }
    } catch (e) {
      console.error('解析结果JSON失败:', e);
      return null;
      }
    
        // 提取第一张图片URL
    if (resultObj.code === 0 || resultObj.code === 200) {
      // 优先检查 ossUrls（新的格式）
      if (resultObj.data && resultObj.data.ossUrls && resultObj.data.ossUrls.length > 0) {
        return resultObj.data.ossUrls[0];
      } else if (resultObj.data && resultObj.data.viewUrls && resultObj.data.viewUrls.length > 0) {
        return resultObj.data.viewUrls[0];
      } else if (resultObj.viewUrls && resultObj.viewUrls.length > 0) {
        return resultObj.viewUrls[0];
      }
    }
  } catch (e) {
    console.error('获取图片URL失败:', e, item.result);
  }
  return null;
};

// 在新标签页中打开图片
const openImageInNewTab = (url: string) => {
  window.open(url, '_blank');
};

// 格式化日期
const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateStr;
  }
};

// 获取方法名的显示名称
const getDisplayName = (summary: string) => {
  return summary || '未知操作';
};

// 格式化 JSON
const formatJson = (jsonStr: string) => {
  try {
    if (!jsonStr) return ''
    const obj = JSON.parse(jsonStr)
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return jsonStr
  }
}

// 计算百分比，用于进度条显示
const getPercentage = (value: number) => {
  // 如果值小于等于10，就乘以10（0.1 → 1%，10 → 100%）
  // 如果值大于10，就以100为上限（15 → 100%）
  return Math.min(value <= 10 ? value * 10 : 100, 100);
}

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 下载图片函数
const downloadImage = (url: string, filename: string) => {
  ElMessage.info('开始下载图片...');
  // 创建一个XMLHttpRequest对象
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  
  xhr.onload = function() {
    if (this.status === 200) {
      // 获取blob数据
      const blob = this.response;
      
      // 创建一个URL对象
      const blobUrl = window.URL.createObjectURL(blob);
      
      // 创建一个隐藏的a标签
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // 添加到DOM中
      document.body.appendChild(link);
      
      // 触发点击
      link.click();
      
      // 移除元素
      setTimeout(() => {
        document.body.removeChild(link);
        // 释放URL对象
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      ElMessage.success('图片下载成功');
    } else {
      ElMessage.error('下载图片失败，请手动保存图片');
      // 如果请求失败，回退到在新窗口打开
      window.open(url, '_blank');
    }
  };
  
  xhr.onerror = function() {
    ElMessage.error('下载图片失败，请手动保存图片');
    // 如果请求失败，回退到在新窗口打开
    window.open(url, '_blank');
  };
  
  // 发送请求
  xhr.send();
};

// 图片放大功能
const zoomIn = () => {
  if (zoomLevel.value < 5) {
    zoomLevel.value = Math.min(zoomLevel.value + 0.2, 5);
  }
};

const zoomOut = () => {
  if (zoomLevel.value > 0.1) {
    zoomLevel.value = Math.max(zoomLevel.value - 0.2, 0.1);
  }
};

const resetZoom = () => {
  zoomLevel.value = 1;
  panX.value = 0;
  panY.value = 0;
};

// 图片滚动功能
const handleWheel = (event: WheelEvent) => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newZoom = Math.max(0.1, Math.min(5, zoomLevel.value + delta));
  zoomLevel.value = newZoom;
};

// 图片拖动功能
const startPan = (event: MouseEvent) => {
  event.preventDefault();
  isPanning.value = true;
  lastPanX.value = event.clientX;
  lastPanY.value = event.clientY;
};

const pan = (event: MouseEvent) => {
  if (!isPanning.value) return;
  event.preventDefault();
  const deltaX = event.clientX - lastPanX.value;
  const deltaY = event.clientY - lastPanY.value;
  panX.value += deltaX / zoomLevel.value;
  panY.value += deltaY / zoomLevel.value;
  lastPanX.value = event.clientX;
  lastPanY.value = event.clientY;
};

const stopPan = () => {
  isPanning.value = false;
};

// 选择图片
const selectImage = (img: string, idx: number) => {
  selectedImage.value = img
  currentIndex.value = idx
  // 只重置拖拽和缩放参数
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

const prevImage = () => {
  if (currentIndex.value > 0) {
    selectImage(resultImages.value[currentIndex.value - 1], currentIndex.value - 1)
  }
}

const nextImage = () => {
  if (currentIndex.value < resultImages.value.length - 1) {
    selectImage(resultImages.value[currentIndex.value + 1], currentIndex.value + 1)
  }
}

// 二创功能
const handleRecreate = () => {
  if (!selectedImage.value) {
    ElMessage.warning('请先选择图片');
    return;
  }
  showTwoChuang.value = true;
}

const router = useRouter()

function handleTwoChuangSelect(option: any) {
  // 跳转到对应页面，并传递当前结果图和ossId
  let img = selectedImage.value;
  // ossId 这里无法直接获取，历史记录一般没有id，传空字符串即可
  let ossId = '';
  router.push({ path: option.path, query: { creativeImg: img, ossId } });
}

// 禁止主页面滚动（弹窗打开时）
watch(detailDialogVisible, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
})
// 防止组件卸载时body被锁死
onUnmounted(() => {
  document.body.style.overflow = '';
})

// 初始化
onMounted(() => {
  fetchLogData()
})
</script>

<style scoped>
.history-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('../assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 左侧菜单样式 */
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

.menu-item {
  position: relative;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 8px 0;
  text-decoration: none;
}

.menu-item.active {
  color: #fff;
}

.item-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 0 5px 5px 0;
  z-index: -1;
}

.menu-item.active .item-bg {
  opacity: 1;
}

.menu-item span {
  z-index: 1;
}

/* 历史记录内容样式 */
.history-content {
  flex: 1;
  padding: 40px;
  padding-left: 140px; /* 为左侧菜单留出空间 */
  padding-top: 20px; /* 为顶部导航栏留出空间 */
  overflow-y: auto;
  z-index: 1;
}

.content-header {
  margin-bottom: 20px;
}

.content-header h2 {
  font-size: 24px;
  color: #00A3FF;
  margin: 0;
}

/* 搜索区域样式 */
.search-section {
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 5px;
  margin-bottom: 20px;
}

.search-form {
  width: 100%;
}

.time-range-container {
  display: flex;
  align-items: center;
}

.time-range-label {
  color: white;
  white-space: nowrap;
  margin-right: 10px;
  font-size: 16px;
}

.date-picker {
  width: 400px;
}

/* 日期选择器样式 */
.search-form :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: none;
}

.search-form :deep(.el-input__inner) {
  color: white;
}

.search-form :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

.search-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 历史记录卡片样式 */
.history-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  overflow-y: auto;
  max-height: 65vh;
  min-width: 0;
  width: 100%;
  max-width: 100vw;
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(200, 173, 127, 0.3), 0 1.5px 6px rgba(0,0,0,0.08);
  padding: 2vw;
  background-color: rgba(200, 173, 127, 0.05);
}



.history-grid::-webkit-scrollbar-track {
  background: rgba(200, 173, 127, 0.1);
  border-radius: 4px;
}

.history-grid::-webkit-scrollbar-thumb {
  background: #c8ad7f;
  border-radius: 4px;
}

.history-grid::-webkit-scrollbar-thumb:hover {
  background: #b89a6a;
}

.history-grid.no-border {
  border: none;
  box-shadow: none;
}

.history-card {
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(200, 173, 127, 0.3);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
  border-color: #c8ad7f;
}

.card-image {
  height: 120px;
  overflow: hidden;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #c8ad7f;
  height: 100%;
  width: 100%;
}

.no-image .el-icon {
  font-size: 30px;
  margin-bottom: 8px;
}

.card-content {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-content h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #c8ad7f;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.card-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* 加载和空状态 */
.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #c8ad7f;
}

.loading-icon {
  font-size: 40px;
  margin-bottom: 20px;
  animation: rotate 2s linear infinite;
  color: #c8ad7f;
}

:deep(.el-empty__description) {
  color: #c8ad7f;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.pagination-container :deep(.el-pagination) {
  background-color: transparent;
}

.pagination-container :deep(.el-pagination .el-pagination__total),
.pagination-container :deep(.el-pagination .el-pagination__jump),
.pagination-container :deep(.el-pagination .btn-prev),
.pagination-container :deep(.el-pagination .btn-next),
.pagination-container :deep(.el-pagination .el-pager li) {
  background-color: transparent;
  color: rgba(255, 255, 255, 0.8);
}

.pagination-container :deep(.el-pagination .el-pager li.is-active) {
  color: #00A3FF;
  font-weight: bold;
}

/* 详情对话框样式 */
:deep(.detail-dialog .el-dialog) {
  background-color: white !important;
  border: 2px solid #c8ad7f !important;
  border-radius: 16px !important;
  box-shadow: 0 8px 32px rgba(200, 173, 127, 0.18), 0 1.5px 6px rgba(0,0,0,0.08);
  position: fixed !important;
  top: 5vh !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  max-height: 90vh !important;
  height: auto !important;
  overflow: visible !important;
  display: flex;
  flex-direction: column;
}

:deep(.detail-dialog .el-dialog__header) {
  background: white;
  border-bottom: 1px solid #c8ad7f;
  border-radius: 16px 16px 0 0;
}

:deep(.detail-dialog .el-dialog__title) {
  color: #c8ad7f;
  font-size: 20px;
  font-weight: bold;
}

:deep(.detail-dialog .el-dialog__headerbtn) {
  top: 15px;
}

:deep(.detail-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: white;
  font-size: 20px;
}

:deep(.detail-dialog .el-dialog__body) {
  background: white;
  color: #333;
  border-radius: 0 0 16px 16px;
  flex: 1 1 auto;
  overflow: auto;
  max-height: 70vh;
}

.log-detail {
  color: white;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-info p {
  margin: 0;
  color: #c8ad7f;
}

.time-icon {
  margin-right: 5px;
  color: #c8ad7f;
}

/* 时间标签样式 */
:deep(.detail-dialog .el-tag--info) {
  background-color: rgba(200, 173, 127, 0.1);
  border-color: #c8ad7f;
  color: #c8ad7f;
}

:deep(.detail-dialog .el-tag--success) {
  background-color: rgba(200, 173, 127, 0.1);
  border-color: #c8ad7f;
  color: #c8ad7f;
}

/* 图片展示区域样式 */
.image-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  padding: 10px 0;
}

.image-list-vertical img {
  width: 220px;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border 0.2s;
  background: #f8f8f8;
}

.image-list-vertical img.active {
  border: 2px solid #c8ad7f;
  box-shadow: 0 0 8px #c8ad7f44;
}

/* 图片放大查看区域样式 */
.image-zoom-container {
  background-color: white;
  border-radius: 10px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-image-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 8px;
  border-radius: 6px;
}

.zoom-level {
  color: #c8ad7f;
  font-size: 14px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.zoom-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: white;
  overflow: hidden;
  cursor: grab;
}

.zoom-image-container:active {
  cursor: grabbing;
}

.zoom-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  border: 2px solid #c8ad7f;
  background: #f8f8f8;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.no-selected-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #c8ad7f;
  background-color: white;
  border-radius: 8px;
}

.no-selected-image .el-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.no-selected-image p {
  margin: 0;
  font-size: 16px;
}

.img-actions .el-button {
  border-color: #c8ad7f;
  color: #c8ad7f;
  background: white;
  transition: all 0.2s;
}
.img-actions .el-button:hover,
.img-actions .el-button:focus {
  background: #c8ad7f;
  color: #fff;
  border-color: #c8ad7f;
}

.gallery-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  margin-top: 1%;
}
.gallery-main {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 320px;
  margin-bottom: 16px;
}
.gallery-main-img {
  max-width: 320px;
  max-height: 320px;
  border-radius: 12px;
  border: 2px solid #c8ad7f;
  background: #f8f8f8;
  box-shadow: 0 2px 12px #0001;
  object-fit: contain;
  display: block;
}
.gallery-arrow {
  background: #eee;
  color: #c8ad7f;
  border: none;
  margin: 0 12px;
}
.gallery-arrow:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.gallery-thumbs {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
  flex-wrap: wrap;
}
.gallery-thumbs img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  background: #f8f8f8;
  transition: border 0.2s, box-shadow 0.2s;
}
.gallery-thumbs img.active {
  border: 2px solid #c8ad7f;
  box-shadow: 0 0 8px #c8ad7f44;
}

.image-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  margin: 18px 0 8px 0;
  width: 100%;
}
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  color: #444;
  font-size: 16px;
  transition: color 0.2s;
}
.action-btn .el-icon {
  font-size: 48px;
  margin-bottom: 4px;
  border: 2px solid #444;
  border-radius: 50%;
  padding: 8px;
}
.action-btn:hover {
  color: #c8ad7f;
}
.action-btn:hover .el-icon {
  border-color: #c8ad7f;
  color: #c8ad7f;
}

:deep(.el-overlay-dialog) {
  overflow: hidden !important;
}

/* 全局Loading样式 */
.global-loading-overlay {
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