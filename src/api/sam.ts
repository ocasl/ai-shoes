import { post, get, del } from '../utils/request'

// API响应类型
interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// RLE编码信息
export interface RleInfo {
  counts: string
  size: [number, number] // [height, width]
}

// 掩码信息
export interface MaskInfo {
  rle: RleInfo
  size: [number, number] // [height, width]
}

// SAM分割响应数据
export interface SamSegmentData {
  masks: MaskInfo[]
  maskCount: number
}

// SAM分割响应
export interface SamSegmentResponse extends ApiResponse<SamSegmentData> {}

// SAM健康检查响应
export interface SamHealthResponse {
  status: string
  message: string
}

// SAM预处理响应
export interface SamPretreatResponse {
  taskId: string
  maskCount: number
  imageSize: [number, number]
  message: string
}

// SAM分割请求
export interface SamCutRequest {
  taskId: string
  points: Array<{
    x: number
    y: number
    type: 'include' | 'exclude'
  }>
}

// SAM分割响应
export interface SamCutResponse {
  mask: string // base64编码的掩码
  maskCount: number
  message: string
}

// SAM任务信息响应
export interface SamTaskInfoResponse {
  taskId: string
  maskCount: number
  imageSize: [number, number]
  createTime: string
  status: string
}

// SAM任务操作响应
export interface SamTaskOperationResponse {
  success: boolean
  message: string
}

/**
 * SAM服务健康检查
 * @returns Promise<SamHealthResponse> 返回服务状态
 */
export function samHealthCheck(): Promise<SamHealthResponse> {
  return get('/sam/health')
}

/**
 * 图片上传与预处理
 * 根据OSS图片ID进行分割预处理，生成掩码
 * @param imageId 图片ID
 * @returns Promise<SamPretreatResponse> 返回预处理结果
 */
export function samPretreat(imageId: number): Promise<SamPretreatResponse> {
  const formData = new FormData()
  formData.append('id', imageId.toString())
  
  return post('/sam/pret', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * 分割操作
 * 根据点击点进行掩码合成
 * @param request 分割请求参数
 * @returns Promise<SamCutResponse> 返回分割结果
 */
export function samCut(request: SamCutRequest): Promise<SamCutResponse> {
  return post('/sam/cut', request, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 获取任务信息
 * @param taskId 任务ID
 * @returns Promise<SamTaskInfoResponse> 返回任务信息
 */
export function samGetTaskInfo(taskId: string): Promise<SamTaskInfoResponse> {
  return get(`/sam/task/${taskId}`)
}

/**
 * 删除任务
 * @param taskId 任务ID
 * @returns Promise<SamTaskOperationResponse> 返回操作结果
 */
export function samDeleteTask(taskId: string): Promise<SamTaskOperationResponse> {
  return del(`/sam/task/${taskId}`)
}

/**
 * 结束任务
 * @param taskId 任务ID
 * @returns Promise<SamTaskOperationResponse> 返回操作结果
 */
export function samEndTask(taskId: string): Promise<SamTaskOperationResponse> {
  const formData = new FormData()
  formData.append('taskId', taskId)
  
  return post('/sam/clear', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

/**
 * RLE解码工具函数
 * 将COCO RLE编码转换为二值掩码数组
 * @param counts RLE编码字符串
 * @param size 图像尺寸 [height, width]
 * @returns boolean[][] 二值掩码数组
 */
export function decodeRLE(counts: string, size: [number, number]): boolean[][] {
  const [height, width] = size
  const mask: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false))
  
  let index = 0
  let value = false
  
  // 解析RLE编码字符串
  const numbers = counts.match(/\d+/g)
  if (!numbers) return mask
  
  for (let i = 0; i < numbers.length; i++) {
    const count = parseInt(numbers[i])
    
    for (let j = 0; j < count; j++) {
      const row = Math.floor(index / width)
      const col = index % width
      
      if (row < height && col < width) {
        mask[row][col] = value
      }
      
      index++
    }
    
    value = !value
  }
  
  return mask
}

/**
 * 将二值掩码数组转换为Canvas图像数据
 * @param mask 二值掩码数组
 * @param color 掩码颜色 (默认: rgba(0, 204, 255, 0.5))
 * @returns ImageData Canvas图像数据
 */
export function maskToImageData(mask: boolean[][], color: string = 'rgba(0, 204, 255, 0.5)'): ImageData {
  const height = mask.length
  const width = mask[0].length
  
  // 创建临时canvas来解析颜色
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.fillStyle = color
  tempCtx.fillRect(0, 0, 1, 1)
  const colorData = tempCtx.getImageData(0, 0, 1, 1).data
  
  const imageData = new ImageData(width, height)
  const data = imageData.data
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      
      if (mask[y][x]) {
        // 设置掩码颜色
        data[index] = colorData[0]     // R
        data[index + 1] = colorData[1] // G
        data[index + 2] = colorData[2] // B
        data[index + 3] = colorData[3] // A
      } else {
        // 透明
        data[index] = 0     // R
        data[index + 1] = 0 // G
        data[index + 2] = 0 // B
        data[index + 3] = 0 // A
      }
    }
  }
  
  return imageData
}

/**
 * 在Canvas上绘制掩码
 * @param canvas Canvas元素
 * @param mask 二值掩码数组
 * @param color 掩码颜色
 */
export function drawMaskOnCanvas(canvas: HTMLCanvasElement, mask: boolean[][], color: string = 'rgba(0, 204, 255, 0.5)'): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  const imageData = maskToImageData(mask, color)
  ctx.putImageData(imageData, 0, 0)
}

/**
 * 将多个掩码合并到一个Canvas上
 * @param canvas Canvas元素
 * @param masks 掩码数组列表
 * @param colors 颜色数组 (可选，默认使用不同颜色)
 */
export function drawMultipleMasksOnCanvas(
  canvas: HTMLCanvasElement, 
  masks: boolean[][][], 
  colors?: string[]
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 默认颜色数组
  const defaultColors = [
    'rgba(0, 204, 255, 0.5)',   // 蓝色
    'rgba(255, 105, 180, 0.5)', // 粉色
    'rgba(255, 255, 0, 0.5)',   // 黄色
    'rgba(0, 255, 0, 0.5)',     // 绿色
    'rgba(255, 0, 0, 0.5)',     // 红色
    'rgba(128, 0, 128, 0.5)',   // 紫色
    'rgba(255, 165, 0, 0.5)',   // 橙色
    'rgba(0, 255, 255, 0.5)'    // 青色
  ]
  
  const maskColors = colors || defaultColors
  
  // 清空canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制每个掩码
  masks.forEach((mask, index) => {
    const color = maskColors[index % maskColors.length]
    const imageData = maskToImageData(mask, color)
    ctx.putImageData(imageData, 0, 0)
  })
}

/**
 * 交互式分割操作
 * 根据点击点进行掩码分割
 * @param imageId 图片ID
 * @param points 点击点数组
 * @returns Promise<SamCutResponse> 返回分割结果
 */
export function samInteractiveSegment(imageId: number, points: Array<{
  x: number
  y: number
  type: 'include' | 'exclude'
}>): Promise<SamCutResponse> {
  return post('/sam/interactive-segment', {
    imageId,
    points
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
} 