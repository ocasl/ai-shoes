import request from '../utils/request'
import { hasPermission, Permission, PermissionError, canOperateMaterial } from '../utils/auth'
import { validateFileType, validateFileSize, validateFileName, sanitizeFileName, validateInput, validateImageFile, scanFileForMalware } from '../utils/security'
import { logMaterialUpload, logMaterialDelete, logMaterialDownload, logPermissionDenied, logSecurityViolation } from '../utils/logger'

// API响应类型
interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ==================== 材质管理相关接口 ====================

// 材质实体类型
export interface Material {
  id: number
  name: string
  ossPath: string
  format: string
  type: number // 0-系统材质库，1-用户材质库
  userId: number
  uploadTime: string
  downloadCount: number
  createTime: string
  updateTime: string
  remark?: string
  deleted: number
}

// 材质查询参数
export interface MaterialQueryParams {
  name?: string // 材质名称（模糊查询）
  type?: number // 材质类型：0-系统材质库，1-用户材质库
  format?: string // 文件格式
  current?: number // 当前页码，默认1
  size?: number // 每页大小，默认10，最大100
}

// 材质列表响应
export interface MaterialListResponse {
  records: Material[]
  total: number
  size: number
  current: number
  pages: number
}

// 材质上传请求
export interface MaterialUploadRequest {
  name: string
  type: number
  file: File
}

// 材质下载响应
export interface MaterialDownloadResponse {
  downloadUrl: string
  fileName: string
  format: string
}

// 上传图片返回数据类型 - 更新为返回ID
export interface UploadImageResponse {
  id: number // 更新为ID
}

// 回显图片参数类型 - 更新为使用imageId
export interface FeedbackImageParams {
  imageId: number // 更新为使用imageId
}

// 上传蒙版参数类型 - 更新为使用originalId
export interface UploadMaskParams {
  originalId: string // 更新为使用originalId
}

// Lore文生图接口
export interface LorewstRequest {
  prompt: string;    // 关键词
  loreName: string;  // 模型名称
}

export interface LorewstResponse {
  promptId: string;
  viewUrls: string[];
}

// 局部重绘（蒙版）接口
export interface JbchRequest {
  majorId: number;    // 主图ID
  minorId: number;    // 附图ID
  prompt: string;     // 关键词
  isMask: number;     // 图片蒙版状态(0:不蒙版,1:主图蒙版,2:二图蒙版)
}

export interface JbchResponse {
  promptId: string;
  viewUrls: string[];
}

// 图像融合接口
export interface StrhzxsRequest {
  loreName: string;
  majorId: number;
  minorId: number;
  majorStrength: number;
  minorStrength: number;
  structuralStrength: number;
}

// 图加图无锁接口
export interface TjtwsRequest {
  loreName: string;  // 模型名称
  majorId: number;   // 主图ID
  minorId: number;   // 附图ID
  majorStrength: number;  // 主图强度
  minorStrength: number;  // 附图强度
}

export interface StrhzxsResponse {
  promptId: string;
  viewUrls: string[];
}

// 鞋底互换接口
export interface XdhhRequest {
  majorId: number;    // 鞋面图ID
  minorId: number;    // 鞋底图ID
  maskStates: number; // 图片蒙版状态(0:不蒙版,1:蒙版鞋面图,2:蒙版鞋底图,3:蒙版两图)
}

export interface XdhhResponse {
  promptId: string;
  viewUrls: string[];
}

// 配色换新接口 - 修改为双图配色
export interface PcxhRequest {
  majorId: number;    // 主图ID
  minorId: number;    // 副图ID
}
export interface PcxhResponse {
  promptId: string;
  viewUrls: string[];
}

// 图加图OK接口
export interface TstokRequest {
  imageId: number;   // 主图ID
  loreName: string;  // 模型名称
  denoise: number;   // 噪点强度(0-10)
}

export interface TstokResponse {
  promptId: string;
  viewUrls: string[];
}

// 高清放大接口
export interface GqfdRequest {
  imageId: number; // 主图ID
}

export interface GqfdResponse {
  promptId: string;
  viewUrls: string[];
}

// 元素消除接口
export interface XcRequest {
  imageId: number;   // 主图ID
  isMask: number;    // 是否是蒙版 (1表示是蒙版)
}

export interface XcResponse {
  promptId: string;
  viewUrls: string[];
}

// 抠图接口
export interface KtRequest {
  imageId: number;   // 图像ID
}
//去水印
export interface QsyRequest {
  imageId: number;   // 主图ID
}

export interface QsyResponse {
  promptId: string;
  viewUrls: string[];
}

export interface KtResponse {
  promptId: string;
  viewUrls: string[];
}

// 修复（蒙版）接口
export interface XfRequest {
  imageId: number;   // 主图ID
  isMask: number;    // 是否是蒙版 (1表示是蒙版)
}

export interface XfResponse {
  promptId: string;
  viewUrls: string[];
}

// 去水印接口
export interface QsyRequest {
  imageId: number;   // 主图ID
}

export interface QsyResponse {
  promptId: string;
  viewUrls: string[];
}

//线稿图
export interface XgtRequest {
  imageId: number;   // 主图ID
}

export interface XgtResponse {
  promptId: string;
  viewUrls: string[];
}

/**
 * 检查用户是否已登录
 * @returns boolean 是否已登录
 */
export function isUserLoggedIn(): boolean {
  const token = localStorage.getItem('token')
  return !!token
}

/**
 * 获取当前token
 * @returns string|null 当前token
 */
export function getCurrentToken(): string | null {
  return localStorage.getItem('token')
}

/**
 * 上传图片
 * @param file 要上传的文件
 * @returns Promise 返回上传结果
 */
export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('image', file)

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 更新为新的API路径
  return request.post('/oss/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }).then(response => {
    console.log("上传响应:", response)
    return response.data
  }).catch(error => {
    console.error("上传错误:", error)
    console.error("错误响应:", error.response?.data)
    throw error
  })
}

/**
 * 回显图片
 * @param imageId 图片ID或包含ID的对象
 * @returns Promise 返回图片URL
 */
// export function feedbackImage(imageId: number | { id: number }) {
//   // 确保imageId是一个数字
//   const id = typeof imageId === 'object' ? imageId.id : imageId;

//   // 使用axios直接请求图片，设置responseType为blob以正确处理二进制数据
//   const token = localStorage.getItem('token')
//   const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

//   return axios.get(`/api/oss/feedback?imageId=${id}`, {
//     headers: {
//       'Authorization': bearerToken,
//       'token': bearerToken
//     },
//     responseType: 'blob'
//   }).then(response => {
//     // 创建一个blob URL
//     const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/png' })
//     const url = URL.createObjectURL(blob)
//     return { code: 0, msg: "success", data: url }
//   }).catch(error => {
//     console.error("图片获取错误:", error)
//     return { code: 500, msg: error.message, data: "" }
//   })
// }
export function feedbackImage(imageId: number | { id: number }) {
  // 确保imageId是一个数字
  const id = typeof imageId === 'object' ? imageId.id : imageId;

  // 使用axios请求图片，现在返回的是JSON格式的URL
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.get(`/oss/feedback?imageId=${id}`)
  .then(response => {
    console.log('feedbackImage 响应:', response)

    // 现在返回的是JSON格式，直接返回
    if (response.data && response.data.code === 200) {
      return {
        code: 0,
        msg: "success",
        data: response.data.data // 直接返回OSS图片URL
      }
    } else {
      return {
        code: response.data?.code || 500,
        msg: response.data?.msg || "获取图片失败",
        data: ""
      }
    }
  }).catch(error => {
    console.error("图片获取错误:", error)
    return { code: 500, msg: error.message, data: "" }
  })
}



/**
 * 直接构建完整的图片URL
 * @param imageId 图片ID或包含ID的对象
 * @returns 图片的Blob URL
 */
export function buildImageUrl(imageId: number | { id: number }): Promise<string> {
  // 确保imageId是一个数字
  const id = typeof imageId === 'object' ? imageId.id : imageId;

  // 获取token
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 返回Promise以异步获取图片URL
  return new Promise((resolve, reject) => {
    // 首先尝试获取JSON格式的响应（新的格式）
    request.get(`/oss/view?imageId=${id}`)
    .then(response => {
      console.log('buildImageUrl 响应:', response)

      // 检查是否是JSON格式的响应
      if (response.data && typeof response.data === 'object' && response.data.code === 200) {
        // 新的JSON格式，直接返回OSS URL
        resolve(response.data.data)
      } else {
        // 旧的二进制格式，创建blob URL
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'image/png' })
        const url = URL.createObjectURL(blob)
        resolve(url)
      }
    }).catch(error => {
      console.error("构建图片URL失败:", error)
      reject(error)
    })
  })
}

// 处理URL辅助函数 - 提取出来重用
const processResponseUrls = async (responseData: any) => {
  // 优先处理错误码1013
  if (responseData.code === 1013) {
    // 替换错误消息
    responseData.msg = "请先选择需要更改的区域！";
    return responseData;
  }

  if (responseData.code === 0 || responseData.code === 200) {
    // 确定viewUrls的位置
    let viewUrls = responseData.data?.viewUrls || responseData.viewUrls;

    if (viewUrls && Array.isArray(viewUrls)) {
      // 创建一个新数组来存储处理后的URL
      const processedUrls = [];

      // 处理每个URL
      for (let i = 0; i < viewUrls.length; i++) {
        const url = viewUrls[i];
        try {
          // 如果URL已经是完整的HTTP URL，直接使用
          if (url.startsWith('http')) {
            processedUrls.push(url);
          } else {
            // 否则，使用buildImageUrl获取Blob URL
            const imageId = url.split('?imageId=')[1] || url;
            try {
              const blobUrl = await buildImageUrl(parseInt(imageId, 10));
              processedUrls.push(blobUrl);
            } catch (error) {
              console.error('转换为blob URL失败:', error);
              processedUrls.push(url); // 回退到原始URL
            }
          }
        } catch (error) {
          console.error('URL处理失败:', error);
          processedUrls.push(url); // 回退到原始URL
        }
      }

      // 更新响应中的viewUrls
      if (responseData.data?.viewUrls) {
        responseData.data.viewUrls = processedUrls;
      } else if (responseData.viewUrls) {
        responseData.viewUrls = processedUrls;
      }
    }
  }

  return responseData;
};

// 图像融合API
export function strhzxs(data: StrhzxsRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/gene/strhzxs', data).then(response => {
    console.log('图像融合响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('图像融合错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

/**
 * 图加图无锁 API
 * 
 * 接口地址: /api/image/gene/tjtws
 * 
 * @param data TjtwsRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function tjtws(data: TjtwsRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/gene/tjtws', data).then(response => {
    console.log('图加图无锁响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('图加图无锁错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

/**
 * 鞋底互换（蒙版）API
 * 
 * 接口地址: /api/image/gene/xdhh
 * 
 * @param data XdhhRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function xdhh(data: XdhhRequest) {
  // 获取token
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 添加认证头
  return request.post('/image/gene/xdhh', data).then(response => {
    console.log('鞋底互换响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('鞋底互换错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  });
}
/**
 * 配色换新API
 * 
 * 接口地址: /api/image/zdps
 * 
 * @param data PcxhRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function pcxh(data: PcxhRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/zdps', data).then(response => {
    console.log('配色换新响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('配色换新错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

// 高清放大API
export function gqfd(data: GqfdRequest) {
  // 获取token
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 添加认证头
  return request.post('/image/gene/gqfd', data).then(response => {
    console.log('高清放大响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('高清放大错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  });
}

// 元素消除API
export function xc(data: XcRequest) {
  // 获取token
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 添加认证头
  return request.post('/image/gene/xc', data).then(response => {
    console.log('元素消除响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('元素消除错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  });
}

// 抠图API
export function kt(data: KtRequest) {
  // 获取token
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 添加认证头
  return request.post('/image/gene/kt', data).then(response => {
    console.log('抠图响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('抠图错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  });
}
//去除水印
export function qsy(data: QsyRequest) {
  return request.post('/image/qsy', data).then(response => {
    console.log('去水印响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('去水印错误:', error)
    throw error
  })
}
//线稿图
export function xgt(data: XgtRequest) {
  return request.post('/image/xgt', data).then(response => {
    console.log('线稿图响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('线稿图错误:', error)
    throw error
  })
}
/**
 * 上传蒙版
 * @param file 蒙版文件
 * @param originalId 原始图片ID
 * @returns Promise 返回上传结果
 */
export function uploadMask(file: File, originalId: string) {
  const formData = new FormData()
  formData.append('image', file)

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 根据你提供的API格式，originalId作为查询参数
  return request.post(`/oss/mask?originalId=${originalId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }).then(response => {
    console.log("上传蒙版响应:", response)
    return response.data
  }).catch(error => {
    console.error("上传蒙版错误:", error)
    console.error("错误响应:", error.response?.data)
    throw error
  })
}

/**
 * 图加图OK API
 * 
 * 接口地址: /api/image/gene/tstok
 * 
 * @param data TstokRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function tstok(data: TstokRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/gene/tstok', data).then(response => {
    console.log('图加图OK响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('图加图OK错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

/**
 * 局部重绘（蒙版）API
 * 
 * 接口地址: /api/image/gene/jbch
 * 
 * @param data JbchRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function jbch(data: JbchRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/gene/jbch', data).then(response => {
    console.log('局部重绘响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('局部重绘错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

/**
 * Lore文生图API
 * 
 * 接口地址: /api/image/gene/lorewst
 * 
 * @param data LorewstRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function lorewst(data: LorewstRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/gene/lorewst', data).then(response => {
    console.log('Lore文生图响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('Lore文生图错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

/**
 * 修复（蒙版）API
 * 
 * 接口地址: /api/image/gene/xf
 * 
 * @param data XfRequest 请求参数
 * @returns Promise 返回生成结果
 */
export function xf(data: XfRequest) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.post('/image/gene/xf', data).then(response => {
    console.log('图片修复响应:', response.data)
    return response.data // 直接返回包含taskld的响应
  }).catch(error => {
    console.error('图片修复错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  })
}

/**
 * 通用蒙版上传函数
 * 将canvas蒙版图上传到OSS，返回新的图片ID
 * @param maskCanvas 包含蒙版的canvas对象
 * @param originalId 原始图片ID
 * @returns Promise<number> 返回上传后的图片ID
 */
export function uploadMaskCanvas(maskCanvas: HTMLCanvasElement, originalId: number | string): Promise<number> {
  return new Promise((resolve, reject) => {
    // 将canvas转换为blob
    maskCanvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('蒙版导出失败'));
        return;
      }

      try {
        // 创建文件对象
        const file = new File([blob], `mask_${Date.now()}.png`, { type: 'image/png' });

        // 调用现有的uploadMask函数
        const response = await uploadMask(file, String(originalId));

        if (response.code === 0 || response.code === 200) {
          // 返回新生成的图片ID
          resolve(response.data.id);
        } else {
          reject(new Error(response.msg || '蒙版上传失败'));
        }
      } catch (error) {
        reject(error);
      }
    }, 'image/png');
  });
}

/**
 * 从base64创建蒙版canvas并上传
 * @param maskDataUrl base64格式的蒙版图片
 * @param originalId 原始图片ID
 * @returns Promise<number> 返回上传后的图片ID
 */
export function uploadMaskFromDataUrl(maskDataUrl: string, originalId: number | string): Promise<number> {
  return new Promise((resolve, reject) => {
    // 创建临时canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('无法创建canvas上下文'));
      return;
    }

    // 创建图片对象
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 设置canvas尺寸
      canvas.width = img.width;
      canvas.height = img.height;

      // 绘制图片到canvas
      ctx.drawImage(img, 0, 0);

      // 上传canvas
      uploadMaskCanvas(canvas, originalId)
        .then(resolve)
        .catch(reject);
    };

    img.onerror = () => {
      reject(new Error('蒙版图片加载失败'));
    };

    // 设置图片源
    img.src = maskDataUrl;
  });
}

/** * 查询任务结果
 * @param taskld 任务ID
 * @returns Promise 返回任务结果
 */
export function getTaskResult(taskld: string) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.get(`/task/result/${taskld}`).then(response => {
    console.log('查询任务结果响应:', response.data)
    return response.data
  }).catch(error => {
    console.error('查询任务结果错误:', error)
    throw error
  })
}

/**
 * 查询任务状态
 * @param taskld 任务ID
 * @returns Promise 返回任务状态
 */
export function getTaskStatus(taskld: string) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  return request.get(`/task/status/${taskld}`).then(response => {
    console.log('查询任务状态响应:', response.data)
    return response.data
  }).catch(error => {
    console.error('查询任务状态错误:', error)
    throw error
  })
}


/**
 * 查询图片结果（专门用于WebSocket任务结果查询）
 * @param taskld 任务ID
 * @returns Promise 返回图片结果
 */
export function getImageResult(taskld: string) {
  return request.get(`/image/request?taskld=${taskld}`).then(response => {
    console.log('查询图片结果响应:', response.data)
    return response.data
  }).catch(error => {
    console.error('查询图片结果错误:', error)
    throw error
  })
}

/**
 * 请求等待结果（修正后的API路径）
 * @param taskld 任务ID
 * @returns Promise 返回等待结果
 */
export function requestWaitResult(taskld: string) {
  return request.get(`/image/request?taskld=${taskld}`).then(response => {
    console.log('请求等待结果响应:', response.data)
    return response.data
  }).catch(error => {
    console.error('请求等待结果错误:', error)
    throw error
  })
}

// ==================== 材质管理API函数 ====================

/**
 * 上传材质
 * @param data 材质上传请求数据
 * @returns Promise 返回上传结果
 */
export async function uploadMaterial(data: MaterialUploadRequest) {
  // 权限检查
  if (!hasPermission(Permission.MATERIAL_UPLOAD)) {
    logPermissionDenied('material_upload', 'material')
    throw new PermissionError('权限不足：无法上传材质', Permission.MATERIAL_UPLOAD)
  }

  // 文件安全验证
  if (!validateFileType(data.file, 'material')) {
    throw new Error('不支持的文件类型')
  }

  if (!validateFileSize(data.file, 'material')) {
    throw new Error('文件大小超出限制')
  }

  if (!validateFileName(data.file.name)) {
    throw new Error('文件名包含非法字符')
  }

  // 验证材质名称
  if (!validateInput(data.name, 'materialName')) {
    throw new Error('材质名称格式不正确')
  }

  // 检查文件内容安全性
  const isImageSafe = await validateImageFile(data.file)
  if (!isImageSafe) {
    throw new Error('文件内容验证失败')
  }

  const isSafe = await scanFileForMalware(data.file)
  if (!isSafe) {
    logSecurityViolation('malicious_file_upload', { fileName: data.file.name })
    throw new Error('检测到恶意文件内容')
  }

  const formData = new FormData()
  formData.append('name', sanitizeFileName(data.name))
  formData.append('type', data.type.toString())
  formData.append('file', data.file)

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  try {
    const response = await request.post('/material/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })

    console.log('材质上传响应:', response.data)
    
    // 记录上传日志
    if (response.data.code === 200 || response.data.code === 0) {
      logMaterialUpload(response.data.data?.id || 'unknown', data.file.name)
    }

    return response.data
  } catch (error) {
    console.error('材质上传错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  }
}

/**
 * 查询材质列表
 * @param params 查询参数
 * @returns Promise 返回材质列表
 */
export async function getMaterialList(params: MaterialQueryParams) {
  // 对于材质列表查看，我们采用更宽松的权限策略
  // 未登录用户可以查看公开材质，登录用户可以查看更多内容
  // 只有在明确禁止的情况下才阻止访问
  
  // 注意：这里我们移除了严格的权限检查，允许所有用户浏览材质
  // 服务器端会根据用户身份返回相应的材质列表

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  try {
    const response = await request.post('/material/list', params)

    console.log('材质列表响应:', response.data)
    return response.data
  } catch (error) {
    console.error('材质列表查询错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  }
}

/**
 * 获取材质详情
 * @param id 材质ID
 * @returns Promise 返回材质详情
 */
export async function getMaterialDetail(id: number) {
  // 权限检查
  if (!hasPermission(Permission.MATERIAL_VIEW)) {
    logPermissionDenied('material_detail', 'material')
    throw new PermissionError('权限不足：无法查看材质详情', Permission.MATERIAL_VIEW)
  }

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  try {
    const response = await request.get(`/material/${id}`)

    console.log('材质详情响应:', response.data)
    return response.data
  } catch (error) {
    console.error('材质详情查询错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  }
}

/**
 * 下载材质
 * @param id 材质ID
 * @returns Promise 返回下载链接
 */
export async function downloadMaterial(id: number) {
  // 对于材质下载，我们采用宽松的权限策略
  // 允许所有用户下载公开材质，服务器端会根据材质类型和用户身份进行控制
  // 只记录下载行为，不阻止访问

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  try {
    const response = await request.post(`/material/download/${id}`, {})

    console.log('材质下载响应:', response.data)
    
    // 记录下载日志
    if (response.data.code === 200 || response.data.code === 0) {
      logMaterialDownload(id.toString(), response.data.data?.fileName || 'unknown')
    }

    return response.data
  } catch (error) {
    console.error('材质下载错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  }
}

/**
 * 删除材质
 * @param id 材质ID
 * @returns Promise 返回删除结果
 */
export async function deleteMaterial(id: number) {
  // 权限检查
  if (!hasPermission(Permission.MATERIAL_DELETE)) {
    logPermissionDenied('material_delete', 'material')
    throw new PermissionError('权限不足：无法删除材质', Permission.MATERIAL_DELETE)
  }

  // 检查材质操作权限
  if (!canOperateMaterial(id.toString(), Permission.MATERIAL_DELETE)) {
    logPermissionDenied('material_delete', `material_${id}`)
    throw new PermissionError('权限不足：无法删除此材质', Permission.MATERIAL_DELETE)
  }

  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  try {
    const response = await request.delete(`/material/${id}`)

    console.log('材质删除响应:', response.data)
    
    // 记录删除日志
    if (response.data.code === 200 || response.data.code === 0) {
      logMaterialDelete(id.toString(), 'material')
    }

    return response.data
  } catch (error) {
    console.error('材质删除错误:', error)
    console.error('错误响应:', error.response?.data)
    throw error
  }
}

/**
 * 批量删除材质
 * @param ids 材质ID数组
 * @returns Promise 返回删除结果
 */
export function batchDeleteMaterials(ids: number[]) {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  const deletePromises = ids.map(id => deleteMaterial(id))
  
  return Promise.all(deletePromises).then(results => {
    console.log('批量删除材质响应:', results)
    return {
      code: 200,
      message: '批量删除成功',
      data: `成功删除 ${results.length} 个材质`
    }
  }).catch(error => {
    console.error('批量删除材质错误:', error)
    throw error
  })
}


