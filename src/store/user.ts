/**
 * 用户状态管理
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

// 用户接口定义
export interface User {
  id: number
  username: string
  name: string
  role: 'admin' | 'user' | 'guest'
  avatar?: string
  email?: string
  phone?: string
  createTime?: string
  updateTime?: string
}

// 登录请求接口
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应接口
export interface LoginResponse {
  token: string
  user: User
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 初始化时从localStorage恢复状态
  const initializeFromStorage = () => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('userInfo') // 修复：使用正确的key
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        // 转换后端用户数据格式为前端格式
        currentUser.value = {
          id: userData.id || 0,
          username: userData.username || '',
          name: userData.nickname || userData.username || '',
          role: userData.role?.toLowerCase() || 'user', // 转换为小写
          avatar: userData.avatar,
          email: userData.email,
          phone: userData.phone,
          createTime: userData.createTime,
          updateTime: userData.updateTime
        }
        console.log('🔍 从localStorage恢复用户信息:', currentUser.value)
      } catch (e) {
        console.error('Failed to parse stored user data:', e)
        localStorage.removeItem('userInfo')
      }
    }
  }

  // 登录
  const login = async (credentials: LoginRequest): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      // 这里应该调用实际的登录API
      // const response = await loginApi(credentials)
      
      // 模拟登录响应
      const mockResponse: LoginResponse = {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          username: credentials.username,
          name: credentials.username === 'admin' ? '管理员' : '用户',
          role: credentials.username === 'admin' ? 'admin' : 'user',
          avatar: 'https://via.placeholder.com/64x64',
          email: `${credentials.username}@example.com`,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }
      }
      
      // 保存用户信息和token
      currentUser.value = mockResponse.user
      token.value = mockResponse.token
      
      // 持久化到localStorage
      localStorage.setItem('token', mockResponse.token)
      localStorage.setItem('userInfo', JSON.stringify(mockResponse.user)) // 修复：使用正确的key
      
    } catch (err: any) {
      error.value = err.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    currentUser.value = null
    token.value = null
    error.value = null
    
    // 清除localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo') // 修复：使用正确的key
  }

  // 更新用户信息
  const updateUser = (userData: Partial<User>) => {
    if (currentUser.value) {
      currentUser.value = { ...currentUser.value, ...userData }
      localStorage.setItem('userInfo', JSON.stringify(currentUser.value)) // 修复：使用正确的key
    }
  }

  // 检查是否已登录
  const isLoggedIn = (): boolean => {
    return !!(currentUser.value && token.value)
  }

  // 检查用户角色
  const hasRole = (role: string): boolean => {
    return currentUser.value?.role === role
  }

  // 获取用户权限
  const getUserPermissions = (): string[] => {
    if (!currentUser.value) return []
    
    switch (currentUser.value.role) {
      case 'admin':
        return [
          'material:view',
          'material:upload',
          'material:delete',
          'material:edit',
          'system_material:manage',
          'user_material:manage'
        ]
      case 'user':
        return [
          'material:view',
          'material:upload',
          'user_material:manage'
        ]
      case 'guest':
        return ['material:view']
      default:
        return []
    }
  }

  // 初始化
  initializeFromStorage()

  return {
    // 状态
    currentUser,
    token,
    loading,
    error,
    
    // 方法
    login,
    logout,
    updateUser,
    isLoggedIn,
    hasRole,
    getUserPermissions,
    initializeFromStorage
  }
})