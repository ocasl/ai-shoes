/**
 * axios请求配置
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080', // 后端API地址
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 不需要认证的接口列表
const publicEndpoints = [
  '/sendSms',
  '/smsLogin',
  '/login', 
  '/register',
  '/forgot-password',
  '/reset-password',
  '/check-username',
  // SAM相关的公开接口
  '/api/health',
  '/api/status'
]

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 检查是否是公开接口
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      config.url?.includes(endpoint)
    )
    
    // 只有非公开接口才添加认证头
    if (!isPublicEndpoint) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
      }
    }
    
    return config
  },
  (error) => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('响应拦截器错误:', error)
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      // 清除本地存储的用户信息
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      
      // 如果不是登录相关的接口，才显示错误信息并跳转
      const url = error.config?.url || ''
      if (!url.includes('/auth/login') && !url.includes('/auth/send-sms') && !url.includes('/auth/sms-login')) {
        ElMessage.error('登录已过期，请重新登录')
        // 跳转到登录页
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      ElMessage.error('没有权限访问该资源')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    } else if (error.message.includes('timeout')) {
      ElMessage.error('请求超时，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

// 创建事件发射器用于全局通信
import mitt from 'mitt'
export const emitter = mitt()

/**
 * 检查token有效性
 */
export const checkTokenValidity = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    // 简单的token格式检查，避免调用不存在的API
    // 如果后端有验证token的接口，请替换为正确的API地址
    if (token && token.length > 10) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('Token验证失败:', error)
    // 清除无效token
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    return false
  }
}

export default request