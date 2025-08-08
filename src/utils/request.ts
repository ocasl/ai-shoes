import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import mitt from 'mitt'

// 创建事件总线
export const emitter = mitt()

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'http://www.ai-shoes.cn:8080',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJwYXNzd29yZCI6W3siYXV0aG9yaXR5IjoiUk9MRV9BRE1JTiJ9XSwidXNlcm5hbWUiOiJ0ZXN0MDEiLCJleHAiOjc4MDEyNzE5MDZ9.4L8XvJzrS-u-sBuc64fHVpJ7aiVrOq4fPLqT0iYqJtI'
  },
  withCredentials: false // 不使用跨域凭证
})

// 设置全局axios默认值，确保所有axios实例都使用相同的配置
axios.defaults.withCredentials = false;

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 确保headers存在
    config.headers = config.headers || {}

    // 定义不需要认证的接口
    const publicEndpoints = ['/smsRegister', '/smsLogin']
    const isPublicEndpoint = publicEndpoints.some(endpoint => config.url?.includes(endpoint))

    // 定义需要Basic认证的接口（只保留登录相关的接口）
    const basicAuthEndpoints = ['/user/register', '/login']
    const needsBasicAuth = basicAuthEndpoints.some(endpoint => config.url?.includes(endpoint))

    // 设置认证头
    if (isPublicEndpoint) {
      // 公开接口：不需要认证头，移除默认的Authorization
      delete config.headers['Authorization']
      console.log('🔓 公开接口，无需认证:', config.url)
    } else if (needsBasicAuth) {
      // 需要Basic认证的接口
      config.headers['Authorization'] = 'Basic c2hvZWRlc2lnbjpzaG9lZGVzaWdu'
      console.log('🔐 使用Basic认证:', config.url)
    } else {
      // 其他接口：优先使用localStorage中的token，如果没有则使用默认token
      const token = localStorage.getItem('token')
      if (token) {
        const bearerToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`
        config.headers['token'] = bearerToken
        config.headers['Authorization'] = bearerToken
        console.log('🎫 使用localStorage中的Bearer token:', config.url)
      } else {
        // 如果localStorage中没有token，使用默认的Authorization头（已在axios实例中设置）
        console.log('🎫 使用默认Bearer token:', config.url)
      }
    }

    // 特殊处理接口的Content-Type
    if (config.url?.includes('smsRegister')) {
      config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    // smsLogin接口使用application/json
    if (config.url?.includes('smsLogin')) {
      config.headers['Content-Type'] = 'application/json'
    }

    // 注册和更新接口使用application/json
    if (config.url?.includes('register') || config.url?.includes('update')) {
      config.headers['Content-Type'] = 'application/json'
    }

    // 文件上传接口设置正确的Content-Type
    if (config.url?.includes('upload')) {
      config.headers['Content-Type'] = 'multipart/form-data'
    }

    // 调试输出
    console.log('📋 请求头:', JSON.stringify(config.headers))
    console.log('🎯 请求URL:', config.url)

    return config
  },
  (error) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 处理token
    const token = response.headers['token'] || response.headers['Token']
    if (token) {
      localStorage.setItem('token', token)
      // 触发token更新事件
      emitter.emit('token-updated', { isValid: true })
    }

    if (res.code === 200 || res.code === 0) {
      return res
    } else if (res.code === 1013) {
      ElMessage.error('请先选择需要更改的区域！')
      return Promise.reject(new Error('请先选择需要更改的区域！'))
    } else {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
  },
  (error) => {
    console.error('响应错误：', error)
    if (error.response) {
      const res = error.response.data
      switch (error.response.status) {
        case 401:
          ElMessage.error(res.msg || '未授权，请重新登录')
          // 401错误，可能是token过期，清除本地token
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          // 触发token更新事件
          emitter.emit('token-updated', { isValid: false })
          // 如果不在登录页，则重定向到登录页
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login'
          }
          break
        case 403:
          ElMessage.error(res.msg || '拒绝访问')
          break
        case 404:
          ElMessage.error('请求错误，未找到该资源')
          break
        case 500:
          ElMessage.error(res.msg || '服务器错误')
          break
        default:
          ElMessage.error(res.msg || '未知错误')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 封装GET请求
export function get<T>(url: string, params?: any): Promise<T> {
  return service.get(url, { params })
}

// 封装POST请求
export function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.post(url, data, config)
}

// 封装PUT请求
export function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.put(url, data, config)
}

// 封装DELETE请求
export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return service.delete(url, config)
}

/**
 * 检查token是否有效
 * @returns Promise<boolean> token是否有效
 */
export async function checkTokenValidity(): Promise<boolean> {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      emitter.emit('token-updated', { isValid: false })
      return false
    }

    // 使用model.ts中的接口验证token
    // 调用模型列表接口，如果能正常返回数据，则token有效
    await get('/lore/list')
    emitter.emit('token-updated', { isValid: true })
    return true
  } catch (error) {
    console.error('Token验证失败:', error)
    // 如果请求失败，清除token
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    emitter.emit('token-updated', { isValid: false })
    return false
  }
}

export default service 