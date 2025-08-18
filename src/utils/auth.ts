/**
 * 权限验证工具函数
 */

import { useUserStore } from '../store/user'

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export enum Permission {
  MATERIAL_VIEW = 'material:view',
  MATERIAL_UPLOAD = 'material:upload',
  MATERIAL_DELETE = 'material:delete',
  MATERIAL_EDIT = 'material:edit',
  SYSTEM_MATERIAL_MANAGE = 'system_material:manage',
  USER_MATERIAL_MANAGE = 'user_material:manage'
}

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(permission: Permission): boolean {
  const userStore = useUserStore()
  const user = userStore.currentUser
  
  console.log('🔍 权限检查:', {
    permission,
    user: user ? {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    } : null
  })
  
  // 对于材质查看权限，允许未登录用户访问（作为访客）
  if (permission === Permission.MATERIAL_VIEW && !user) {
    console.log('✅ 允许未登录用户查看材质')
    return true
  }
  
  if (!user) {
    console.log('❌ 用户未登录，权限检查失败')
    return false
  }
  
  // 管理员拥有所有权限
  if (user.role === 'admin') {
    console.log('✅ 管理员拥有所有权限')
    return true
  }
  
  // 根据用户角色和权限进行检查
  const rolePermissions = getRolePermissions(user.role)
  const hasPermissionResult = rolePermissions.includes(permission)
  
  console.log('🔍 角色权限检查:', {
    userRole: user.role,
    rolePermissions,
    requestedPermission: permission,
    hasPermission: hasPermissionResult
  })
  
  return hasPermissionResult
}

/**
 * 获取角色对应的权限列表
 */
function getRolePermissions(role: string): Permission[] {
  switch (role) {
    case 'admin':
      return Object.values(Permission)
    
    case 'user':
      return [
        Permission.MATERIAL_VIEW,
        Permission.MATERIAL_UPLOAD,
        Permission.USER_MATERIAL_MANAGE
      ]
    
    case 'guest':
      return [Permission.MATERIAL_VIEW]
    
    default:
      return []
  }
}

/**
 * 检查用户是否可以操作指定材质
 */
export function canOperateMaterial(materialId: string, operation: Permission): boolean {
  const userStore = useUserStore()
  const user = userStore.currentUser
  
  if (!user) {
    return false
  }
  
  // 管理员可以操作所有材质
  if (user.role === 'admin') {
    return true
  }
  
  // 检查基础权限
  if (!hasPermission(operation)) {
    return false
  }
  
  // 对于删除和编辑操作，需要检查材质所有权
  if (operation === Permission.MATERIAL_DELETE || operation === Permission.MATERIAL_EDIT) {
    // 这里需要根据实际的材质数据结构来判断所有权
    // 暂时返回true，实际使用时需要传入材质对象进行判断
    return true
  }
  
  return true
}

/**
 * 权限装饰器，用于组件方法的权限检查
 */
export function requirePermission(permission: Permission) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      if (!hasPermission(permission)) {
        throw new Error(`权限不足: 需要 ${permission} 权限`)
      }
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser() {
  const userStore = useUserStore()
  return userStore.currentUser
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  const userStore = useUserStore()
  return !!userStore.currentUser && !!userStore.token
}

/**
 * 权限错误类
 */
export class PermissionError extends Error {
  constructor(message: string, public permission: Permission) {
    super(message)
    this.name = 'PermissionError'
  }
}