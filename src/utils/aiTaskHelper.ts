import { startAiTaskWs } from './wsTask'
import * as api from '../api/file'

/**
 * AI任务处理助手
 * 统一处理所有图生图API的调用和WebSocket监听
 */

export interface TaskCallbacks {
  onProgress?: (progress: number) => void
  onComplete?: (images: string[]) => void
  onError?: (error: any) => void
}

/**
 * 执行AI任务的通用函数
 * @param apiCall API调用函数
 * @param taskType 任务类型
 * @param callbacks 回调函数
 */
async function executeAiTask(
  apiCall: () => Promise<any>,
  taskType: string,
  callbacks: TaskCallbacks = {}
) {
  const {
    onProgress = (progress) => console.log(`进度: ${progress}%`),
    onComplete = (images) => console.log('完成:', images),
    onError = (error) => console.error('错误:', error)
  } = callbacks

  try {
    // 1. 调用API获取taskId
    const response = await apiCall()
    
    if (response.code === 200) {
      const taskId = response.data
      console.log('🚀 获得taskId:', taskId)
      
      // 2. 启动WebSocket监听进度和结果
      startAiTaskWs(taskId, taskType)
    } else {
      onError(new Error(response.msg || 'API调用失败'))
    }
  } catch (error) {
    console.error('❌ API调用失败:', error)
    onError(error)
  }
}

// 自动配色
export function executeAutoColor(data: api.PcxhRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.pcxh(data), 'color', callbacks)
}

// 线稿图
export function executeLineArt(data: api.XgtRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.xgt(data), 'line-art', callbacks)
}

// 去水印
export function executeWatermarkRemove(data: api.QsyRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.qsy(data), 'watermark-remove', callbacks)
}

// 图片修复
export function executeImageRestore(data: api.XfRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.xf(data), 'image-restore', callbacks)
}

// 鞋底换面
export function executeSoleFusion(data: api.XdhhRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.xdhh(data), 'sole-fusion', callbacks)
}

// 元素消除
export function executeElementRemove(data: api.XcRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.xc(data), 'element-remove', callbacks)
}

// 款式延伸
export function executeStyleExtension(data: api.TstokRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.tstok(data), 'style-extension', callbacks)
}

// 款式融合
export function executeStyleFusion(data: api.TjtwsRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.tjtws(data), 'style-fusion', callbacks)
}

// 款式融合(主体加强)
export function executeStyleFusionEnhanced(data: api.StrhzxsRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.strhzxs(data), 'style-fusion', callbacks)
}

// 文字创款
export function executeTextDesign(data: api.LorewstRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.lorewst(data), 'text-design', callbacks)
}

// 一键抠图
export function executeCutout(data: api.KtRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.kt(data), 'cutout', callbacks)
}

// 局部修改
export function executePartialModify(data: api.JbchRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.jbch(data), 'partial-modify', callbacks)
}

// 高清放大
export function executeHDEnhance(data: api.GqfdRequest, callbacks?: TaskCallbacks) {
  return executeAiTask(() => api.gqfd(data), 'hd-enhance', callbacks)
}