import { uploadMaskCanvas, uploadMaskFromDataUrl } from '../api/file'
import { ElMessage, ElLoading } from 'element-plus'
import { useShoeStore } from '../store'

/**
 * 通用蒙版上传工具类
 * 用于所有带蒙版功能的页面
 */
export class MaskUploadUtils {
  
  /**
   * 上传canvas蒙版到OSS
   * @param maskCanvas 包含蒙版的canvas对象
   * @param originalId 原始图片ID
   * @returns Promise<number> 返回上传后的图片ID
   */
  static async uploadMaskCanvas(maskCanvas: HTMLCanvasElement, originalId: number | string): Promise<number> {
    const loading = ElLoading.service({
      lock: true,
      text: '上传蒙版中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      const maskId = await uploadMaskCanvas(maskCanvas, originalId)
      ElMessage.success('蒙版上传成功')
      return maskId
    } catch (error: any) {
      ElMessage.error('蒙版上传失败: ' + (error.message || '未知错误'))
      throw error
    } finally {
      loading.close()
    }
  }
  
  /**
   * 从base64上传蒙版到OSS
   * @param maskDataUrl base64格式的蒙版图片
   * @param originalId 原始图片ID
   * @returns Promise<number> 返回上传后的图片ID
   */
  static async uploadMaskFromDataUrl(maskDataUrl: string, originalId: number | string): Promise<number> {
    const loading = ElLoading.service({
      lock: true,
      text: '上传蒙版中...',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    try {
      const maskId = await uploadMaskFromDataUrl(maskDataUrl, originalId)
      ElMessage.success('蒙版上传成功')
      return maskId
    } catch (error: any) {
      ElMessage.error('蒙版上传失败: ' + (error.message || '未知错误'))
      throw error
    } finally {
      loading.close()
    }
  }
  
  /**
   * 创建AI处理用的蒙版canvas
   * @param userMaskCanvas 用户绘制的蒙版canvas
   * @param originalImage 原始图片对象
   * @returns HTMLCanvasElement AI处理用的蒙版canvas
   */
  static createAIMaskCanvas(userMaskCanvas: HTMLCanvasElement, originalImage: HTMLImageElement): HTMLCanvasElement {
    const naturalWidth = originalImage.naturalWidth
    const naturalHeight = originalImage.naturalHeight
    const displayWidth = userMaskCanvas.width
    const displayHeight = userMaskCanvas.height
    
    // 计算缩放比例
    const scaleX = naturalWidth / displayWidth
    const scaleY = naturalHeight / displayHeight
    
    // 创建AI蒙版canvas
    const aiMaskCanvas = document.createElement('canvas')
    aiMaskCanvas.width = naturalWidth
    aiMaskCanvas.height = naturalHeight
    
    const aiMaskCtx = aiMaskCanvas.getContext('2d')
    if (!aiMaskCtx) {
      throw new Error('无法创建canvas上下文')
    }
    
    // 设置黑色背景
    aiMaskCtx.fillStyle = 'black'
    aiMaskCtx.fillRect(0, 0, naturalWidth, naturalHeight)
    
    // 获取用户绘制的蒙版数据
    const userMaskData = userMaskCanvas.getContext('2d')?.getImageData(0, 0, displayWidth, displayHeight)
    if (!userMaskData) {
      throw new Error('无法获取蒙版数据')
    }
    
    // 创建放大的蒙版
    const scaledMask = aiMaskCtx.createImageData(naturalWidth, naturalHeight)
    
    // 遍历用户绘制的每个像素，并映射到原始尺寸
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const sourceIdx = (y * displayWidth + x) * 4
        
        // 检查是否有绘制（非透明像素）
        if (userMaskData.data[sourceIdx + 3] > 0) {
          // 计算在原始尺寸中的位置
          const targetX = Math.round(x * scaleX)
          const targetY = Math.round(y * scaleY)
          
          // 确保在边界内
          if (targetX >= 0 && targetX < naturalWidth && targetY >= 0 && targetY < naturalHeight) {
            // 绘制点
            const targetIdx = (targetY * naturalWidth + targetX) * 4
            
            // 在放大的蒙版中将此位置设置为白色
            scaledMask.data[targetIdx] = 255     // R
            scaledMask.data[targetIdx + 1] = 255 // G
            scaledMask.data[targetIdx + 2] = 255 // B
            scaledMask.data[targetIdx + 3] = 255 // A
            
            // 给周围像素也上色，确保蒙版连续
            for (let ny = -2; ny <= 2; ny++) {
              for (let nx = -2; nx <= 2; nx++) {
                const nearX = targetX + nx
                const nearY = targetY + ny
                if (nearX >= 0 && nearX < naturalWidth && nearY >= 0 && nearY < naturalHeight) {
                  const nearIdx = (nearY * naturalWidth + nearX) * 4
                  scaledMask.data[nearIdx] = 255     // R
                  scaledMask.data[nearIdx + 1] = 255 // G
                  scaledMask.data[nearIdx + 2] = 255 // B
                  scaledMask.data[nearIdx + 3] = 255 // A
                }
              }
            }
          }
        }
      }
    }
    
    // 应用放大的蒙版到AI蒙版canvas
    aiMaskCtx.putImageData(scaledMask, 0, 0)
    
    return aiMaskCanvas
  }
  
  /**
   * 创建可视化蒙版canvas
   * @param userMaskCanvas 用户绘制的蒙版canvas
   * @param originalImage 原始图片对象
   * @returns HTMLCanvasElement 可视化蒙版canvas
   */
  static createVisualMaskCanvas(userMaskCanvas: HTMLCanvasElement, originalImage: HTMLImageElement): HTMLCanvasElement {
    const naturalWidth = originalImage.naturalWidth
    const naturalHeight = originalImage.naturalHeight
    const displayWidth = userMaskCanvas.width
    const displayHeight = userMaskCanvas.height
    
    // 计算缩放比例
    const scaleX = naturalWidth / displayWidth
    const scaleY = naturalHeight / displayHeight
    
    // 创建可视化蒙版canvas
    const visualMaskCanvas = document.createElement('canvas')
    visualMaskCanvas.width = naturalWidth
    visualMaskCanvas.height = naturalHeight
    
    const visualMaskCtx = visualMaskCanvas.getContext('2d')
    if (!visualMaskCtx) {
      throw new Error('无法创建canvas上下文')
    }
    
    // 绘制原图
    visualMaskCtx.drawImage(originalImage, 0, 0, naturalWidth, naturalHeight)
    
    // 添加灰色半透明遮罩
    visualMaskCtx.fillStyle = 'rgba(128, 128, 128, 0.7)'
    visualMaskCtx.fillRect(0, 0, naturalWidth, naturalHeight)
    
    // 获取用户绘制的蒙版数据并创建临时canvas
    const tempMaskCanvas = document.createElement('canvas')
    tempMaskCanvas.width = naturalWidth
    tempMaskCanvas.height = naturalHeight
    
    const tempMaskCtx = tempMaskCanvas.getContext('2d')
    if (!tempMaskCtx) {
      throw new Error('无法创建临时canvas上下文')
    }
    
    // 清空临时画布
    tempMaskCtx.fillStyle = 'black'
    tempMaskCtx.fillRect(0, 0, naturalWidth, naturalHeight)
    
    // 获取用户绘制的蒙版数据
    const userMaskData = userMaskCanvas.getContext('2d')?.getImageData(0, 0, displayWidth, displayHeight)
    if (!userMaskData) {
      throw new Error('无法获取蒙版数据')
    }
    
    // 创建空白的放大蒙版
    const scaledMask = tempMaskCtx.createImageData(naturalWidth, naturalHeight)
    
    // 遍历用户绘制的每个像素，并映射到原始尺寸
    for (let y = 0; y < displayHeight; y++) {
      for (let x = 0; x < displayWidth; x++) {
        const sourceIdx = (y * displayWidth + x) * 4
        
        // 检查是否有绘制（非透明像素）
        if (userMaskData.data[sourceIdx + 3] > 0) {
          // 计算在原始尺寸中的位置
          const targetX = Math.round(x * scaleX)
          const targetY = Math.round(y * scaleY)
          
          // 确保在边界内
          if (targetX >= 0 && targetX < naturalWidth && targetY >= 0 && targetY < naturalHeight) {
            // 绘制点
            const targetIdx = (targetY * naturalWidth + targetX) * 4
            
            // 在放大的蒙版中将此位置设置为白色
            scaledMask.data[targetIdx] = 255     // R
            scaledMask.data[targetIdx + 1] = 255 // G
            scaledMask.data[targetIdx + 2] = 255 // B
            scaledMask.data[targetIdx + 3] = 255 // A
          }
        }
      }
    }
    
    // 应用放大的蒙版到临时画布
    tempMaskCtx.putImageData(scaledMask, 0, 0)
    
    // 将标记区域设为透明
    visualMaskCtx.globalCompositeOperation = 'destination-out'
    visualMaskCtx.drawImage(tempMaskCanvas, 0, 0)
    
    return visualMaskCanvas
  }
  
  /**
   * 获取原始图片ID
   * @param originalImageName 原始图片名称
   * @param currentImageUrl 当前图片URL
   * @returns string | number 原始图片ID
   */
  static getOriginalImageId(originalImageName?: string, currentImageUrl?: string): string | number {
    // 优先使用全局的当前图片ID（抠图后的ossId）
    const shoeStore = useShoeStore()
    if (shoeStore.currentImageId) {
      console.log('🔍 MaskUtils使用全局图片ID:', shoeStore.currentImageId)
      return shoeStore.currentImageId
    }
    
    // 其次使用props传递的原始图片名称
    if (originalImageName) {
      const parsedId = parseInt(originalImageName, 10)
      if (!isNaN(parsedId)) {
        console.log('🔍 MaskUtils使用props图片ID:', parsedId)
        return parsedId
      } else {
        console.log('🔍 MaskUtils使用props图片名称:', originalImageName)
        return originalImageName
      }
    }
    
    // 如果没有props，尝试从当前图片URL提取
    if (currentImageUrl) {
      const urlParts = currentImageUrl.split('?')
      if (urlParts.length > 1) {
        const params = new URLSearchParams(urlParts[1])
        const imageName = params.get('name') || ''
        const parsedId = parseInt(imageName, 10)
        if (!isNaN(parsedId)) {
          console.log('🔍 MaskUtils使用URL提取图片ID:', parsedId)
          return parsedId
        } else {
          console.log('🔍 MaskUtils使用URL提取图片名称:', imageName)
          return imageName
        }
      }
    }
    
    console.log('🔍 MaskUtils无法获取图片ID')
    return ''
  }
} 