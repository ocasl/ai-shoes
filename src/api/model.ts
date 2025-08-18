import request from '../utils/request'

// API响应类型
interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 模型类型定义
export interface Model {
  id: number
  name: string
  description?: string
  image?: string
  type?: string
  [key: string]: any
}

/**
 * 查询所有模型
 * @returns Promise 返回模型列表
 */
export function getAllModels() {
  console.log('🔍 开始调用 getAllModels API: /lore/list')
  return request.get<ApiResponse<Model[]>>('/lore/list')
    .then(response => {
      console.log('✅ getAllModels API 响应成功:', response)
      return response
    })
    .catch(error => {
      console.error('❌ getAllModels API 调用失败:', error)
      console.error('错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    })
}

/**
 * 使用request实例查询所有模型
 * @returns Promise 返回模型列表
 */
export function getAllModelsDirectly() {
  console.log('🔍 开始调用 getAllModelsDirectly API: /lore/list')
  return request.get('/lore/list')
    .then(response => {
      console.log('✅ getAllModelsDirectly API 响应成功:', response)
      return response.data
    })
    .catch(error => {
      console.error('❌ getAllModelsDirectly API 调用失败:', error)
      console.error('错误详情:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      })
      throw error
    })
}

/**
 * 检查用户是否已登录
 * @returns boolean 是否已登录
 */
export function isUserLoggedIn() {
  const token = localStorage.getItem('token')
  return !!token
} 