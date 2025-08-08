import { get } from '../utils/request'
import axios from 'axios'

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
  // 获取token，检查登录状态
  const token = localStorage.getItem('token')
  
  // 返回请求
  return get<ApiResponse<Model[]>>('/lore/list')
}

/**
 * 使用原生axios查询所有模型
 * @returns Promise 返回模型列表
 */
export function getAllModelsDirectly() {
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`
  
  return axios.get('/api/lore/list', {
    headers: {
      'Authorization': bearerToken,
      'token': bearerToken,
      'Content-Type': 'application/json'
    }
  }).then(response => response.data)
}

/**
 * 检查用户是否已登录
 * @returns boolean 是否已登录
 */
export function isUserLoggedIn() {
  const token = localStorage.getItem('token')
  return !!token
} 