/**
 * 用户相关类型定义
 */

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

// 用户权限枚举
export enum UserPermission {
  MATERIAL_VIEW = 'material:view',
  MATERIAL_UPLOAD = 'material:upload',
  MATERIAL_DELETE = 'material:delete',
  MATERIAL_EDIT = 'material:edit',
  SYSTEM_MATERIAL_MANAGE = 'system_material:manage',
  USER_MATERIAL_MANAGE = 'user_material:manage'
}

// 用户基本信息
export interface User {
  id: number
  username: string
  name: string
  role: UserRole
  avatar?: string
  email?: string
  phone?: string
  createTime?: string
  updateTime?: string
}

// 用户登录请求
export interface LoginRequest {
  username: string
  password: string
  remember?: boolean
}

// 用户登录响应
export interface LoginResponse {
  token: string
  refreshToken?: string
  user: User
  expiresIn?: number
}

// 用户注册请求
export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
  name: string
  email?: string
  phone?: string
}

// 用户更新请求
export interface UpdateUserRequest {
  name?: string
  email?: string
  phone?: string
  avatar?: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// 用户统计信息
export interface UserStats {
  totalMaterials: number
  uploadedMaterials: number
  downloadedMaterials: number
  favoriteMaterials: number
  totalDownloads: number
  joinDate: string
}

// 用户设置
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  notifications: {
    email: boolean
    browser: boolean
    mobile: boolean
  }
  privacy: {
    showProfile: boolean
    showStats: boolean
    allowMessages: boolean
  }
}

// 用户会话信息
export interface UserSession {
  id: string
  userId: number
  deviceInfo: string
  ipAddress: string
  location?: string
  loginTime: string
  lastActiveTime: string
  isActive: boolean
}