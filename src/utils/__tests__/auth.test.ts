/**
 * 权限验证工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  hasPermission,
  canOperateMaterial,
  getCurrentUser,
  isAuthenticated,
  UserRole,
  Permission,
  PermissionError
} from '../auth'

// Mock store
const mockUserStore = {
  currentUser: null as any,
  token: null as string | null
}

vi.mock('../../store/user', () => ({
  useUserStore: () => mockUserStore
}))

describe('权限验证工具', () => {
  beforeEach(() => {
    // 重置 mock 数据
    mockUserStore.currentUser = null
    mockUserStore.token = null
  })

  describe('hasPermission', () => {
    it('应该在用户未登录时返回 false', () => {
      const result = hasPermission(Permission.MATERIAL_VIEW)
      expect(result).toBe(false)
    })

    it('应该在管理员用户时返回 true', () => {
      mockUserStore.currentUser = {
        id: 1,
        name: 'admin',
        role: UserRole.ADMIN
      }

      const result = hasPermission(Permission.MATERIAL_DELETE)
      expect(result).toBe(true)
    })

    it('应该正确验证普通用户权限', () => {
      mockUserStore.currentUser = {
        id: 2,
        name: 'user',
        role: UserRole.USER
      }

      expect(hasPermission(Permission.MATERIAL_VIEW)).toBe(true)
      expect(hasPermission(Permission.MATERIAL_UPLOAD)).toBe(true)
      expect(hasPermission(Permission.SYSTEM_MATERIAL_MANAGE)).toBe(false)
    })

    it('应该正确验证访客权限', () => {
      mockUserStore.currentUser = {
        id: 3,
        name: 'guest',
        role: UserRole.GUEST
      }

      expect(hasPermission(Permission.MATERIAL_VIEW)).toBe(true)
      expect(hasPermission(Permission.MATERIAL_UPLOAD)).toBe(false)
      expect(hasPermission(Permission.MATERIAL_DELETE)).toBe(false)
    })
  })

  describe('canOperateMaterial', () => {
    it('应该在用户未登录时返回 false', () => {
      const result = canOperateMaterial('1', Permission.MATERIAL_DELETE)
      expect(result).toBe(false)
    })

    it('应该在管理员时允许所有操作', () => {
      mockUserStore.currentUser = {
        id: 1,
        name: 'admin',
        role: UserRole.ADMIN
      }

      const result = canOperateMaterial('1', Permission.MATERIAL_DELETE)
      expect(result).toBe(true)
    })

    it('应该检查基础权限', () => {
      mockUserStore.currentUser = {
        id: 2,
        name: 'user',
        role: UserRole.USER
      }

      expect(canOperateMaterial('1', Permission.MATERIAL_VIEW)).toBe(true)
      expect(canOperateMaterial('1', Permission.SYSTEM_MATERIAL_MANAGE)).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('应该返回当前用户', () => {
      const user = {
        id: 1,
        name: 'test',
        role: UserRole.USER
      }
      mockUserStore.currentUser = user

      const result = getCurrentUser()
      expect(result).toEqual(user)
    })

    it('应该在未登录时返回 null', () => {
      const result = getCurrentUser()
      expect(result).toBe(null)
    })
  })

  describe('isAuthenticated', () => {
    it('应该在有用户和token时返回 true', () => {
      mockUserStore.currentUser = { id: 1, name: 'test', role: UserRole.USER }
      mockUserStore.token = 'valid-token'

      const result = isAuthenticated()
      expect(result).toBe(true)
    })

    it('应该在缺少用户时返回 false', () => {
      mockUserStore.token = 'valid-token'

      const result = isAuthenticated()
      expect(result).toBe(false)
    })

    it('应该在缺少token时返回 false', () => {
      mockUserStore.currentUser = { id: 1, name: 'test', role: UserRole.USER }

      const result = isAuthenticated()
      expect(result).toBe(false)
    })
  })

  describe('PermissionError', () => {
    it('应该正确创建权限错误', () => {
      const error = new PermissionError('权限不足', Permission.MATERIAL_DELETE)
      
      expect(error.message).toBe('权限不足')
      expect(error.permission).toBe(Permission.MATERIAL_DELETE)
      expect(error.name).toBe('PermissionError')
    })
  })

  describe('权限装饰器', () => {
    it('应该在有权限时执行方法', () => {
      mockUserStore.currentUser = {
        id: 1,
        name: 'admin',
        role: UserRole.ADMIN
      }

      const mockMethod = vi.fn()
      const { requirePermission } = require('../auth')
      
      const decorator = requirePermission(Permission.MATERIAL_VIEW)
      const descriptor = { value: mockMethod }
      
      decorator({}, 'testMethod', descriptor)
      
      descriptor.value()
      expect(mockMethod).toHaveBeenCalled()
    })

    it('应该在无权限时抛出错误', () => {
      mockUserStore.currentUser = {
        id: 2,
        name: 'user',
        role: UserRole.GUEST
      }

      const mockMethod = vi.fn()
      const { requirePermission } = require('../auth')
      
      const decorator = requirePermission(Permission.MATERIAL_DELETE)
      const descriptor = { value: mockMethod }
      
      decorator({}, 'testMethod', descriptor)
      
      expect(() => descriptor.value()).toThrow('权限不足')
      expect(mockMethod).not.toHaveBeenCalled()
    })
  })
})