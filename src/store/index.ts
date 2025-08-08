import { defineStore } from 'pinia'

// 定义鞋子设计类型
interface ShoeDesign {
  id: number;
  name: string;
  color: string;
  size: number;
}

// AI任务相关状态类型
interface AiTaskState {
  promptId: string;
  clientId: string;
  server: string;
  taskStatus: string;
  progress: number;
  viewUrls: string[];
  taskType: string; // 添加任务类型字段
  ossIds?: number[]; // 添加ossIds字段，用于存储抠图后的图片ID
}

// 当前图片状态类型
interface CurrentImageState {
  originalId: number | null;  // 原始图片ID
  currentId: number | null;   // 当前应该使用的图片ID（抠图后使用ossId）
  isSegmented: boolean;       // 是否已经抠图
}

// 定义一个存储用于管理鞋子设计相关状态
export const useShoeStore = defineStore('shoe', {
  // 状态
  state: () => ({
    designs: [] as ShoeDesign[],
    currentDesignId: null as number | null,
    aiTask: {
      promptId: '',
      clientId: '',
      server: '',
      taskStatus: '',
      progress: 0,
      viewUrls: [],
      taskType: '', // 初始化任务类型
    } as AiTaskState,
    currentImage: {
      originalId: null,
      currentId: null,
      isSegmented: false,
    } as CurrentImageState,
  }),
  
  // getter
  getters: {
    currentDesign: (state) => {
      if (state.currentDesignId === null) return null
      return state.designs.find((d: ShoeDesign) => d.id === state.currentDesignId) || null
    },
    designCount: (state) => state.designs.length,
    aiTaskStatus: (state) => state.aiTask.taskStatus,
    aiTaskProgress: (state) => state.aiTask.progress,
    aiTaskImages: (state) => state.aiTask.viewUrls,
    // 获取当前应该使用的图片ID
    currentImageId: (state) => {
      return state.currentImage.currentId || state.currentImage.originalId
    },
  },
  
  // action
  actions: {
    addDesign(design: { name: string; color: string; size: number }) {
      const id = Date.now()
      this.designs.push({ ...design, id })
      return id
    },
    
    removeDesign(id: number) {
      const index = this.designs.findIndex((d: ShoeDesign) => d.id === id)
      if (index > -1) {
        this.designs.splice(index, 1)
        if (this.currentDesignId === id) {
          this.currentDesignId = null
        }
      }
    },
    
    setCurrentDesign(id: number) {
      this.currentDesignId = id
    },
    setAiTaskInfo({ promptId, clientId, server, taskType }: { promptId: string; clientId: string; server: string; taskType?: string }) {
      this.aiTask.promptId = promptId
      this.aiTask.clientId = clientId
      this.aiTask.server = server
      this.aiTask.taskType = taskType || ''
      this.aiTask.taskStatus = 'running'
      this.aiTask.progress = 0
      this.aiTask.viewUrls = []
    },
    setAiTaskProgress(progress: number) {
      this.aiTask.progress = progress
    },
    setAiTaskStatus(status: string) {
      this.aiTask.taskStatus = status
    },
    setAiTaskType(taskType: string) {
      this.aiTask.taskType = taskType
    },
    setAiTaskImages(urls: string[]) {
      this.aiTask.viewUrls = urls
    },
    setAiTaskOssIds(ossIds: number[]) {
      this.aiTask.ossIds = ossIds
    },
    resetAiTask() {
      this.aiTask = {
        promptId: '',
        clientId: '',
        server: '',
        taskStatus: '',
        progress: 0,
        viewUrls: [],
        taskType: '', // 重置任务类型
        ossIds: undefined, // 重置ossIds
      }
    },
    // 设置原始图片ID
    setOriginalImageId(id: number) {
      console.log('🌐 setOriginalImageId 被调用:', {
        新ID: id,
        当前是否已抠图: this.currentImage.isSegmented,
        当前currentId: this.currentImage.currentId,
        当前originalId: this.currentImage.originalId
      })
      
      this.currentImage.originalId = id
      // 总是更新currentId为最新的图片ID，因为用户可能进行了新的编辑操作
      this.currentImage.currentId = id
      console.log('🌐 设置currentId为:', id)
      // 不重置isSegmented状态，保持抠图状态
    },
    // 设置抠图后的图片ID
    setSegmentedImageId(ossId: number) {
      console.log('🌐 setSegmentedImageId 被调用:', {
        新ossId: ossId,
        当前currentId: this.currentImage.currentId,
        当前originalId: this.currentImage.originalId
      })
      
      this.currentImage.currentId = ossId
      this.currentImage.isSegmented = true
      
      console.log('🌐 抠图后状态:', {
        currentId: this.currentImage.currentId,
        originalId: this.currentImage.originalId,
        isSegmented: this.currentImage.isSegmented
      })
    },
        // 重置图片状态
    resetImageState() {
      this.currentImage = {
        originalId: null,
        currentId: null,
        isSegmented: false,
      }
    },
  },
})