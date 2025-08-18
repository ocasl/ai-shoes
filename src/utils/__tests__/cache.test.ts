/**
 * 缓存管理工具测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CacheManager, materialCache, generateCacheKey, CacheUtils } from '../cache'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

describe('缓存管理工具', () => {
  let cache: CacheManager<any>

  beforeEach(() => {
    vi.clearAllMocks()
    cache = new CacheManager({
      maxSize: 5,
      defaultTTL: 1000,
      storage: 'memory'
    })
  })

  afterEach(() => {
    cache.clear()
  })

  describe('CacheManager', () => {
    describe('基本操作', () => {
      it('应该设置和获取缓存', () => {
        const key = 'test-key'
        const data = { value: 'test' }

        cache.set(key, data)
        const result = cache.get(key)

        expect(result).toEqual(data)
      })

      it('应该在缓存不存在时返回null', () => {
        const result = cache.get('non-existent-key')
        expect(result).toBe(null)
      })

      it('应该检查缓存是否存在', () => {
        const key = 'test-key'
        const data = { value: 'test' }

        expect(cache.has(key)).toBe(false)
        
        cache.set(key, data)
        expect(cache.has(key)).toBe(true)
      })

      it('应该删除缓存', () => {
        const key = 'test-key'
        const data = { value: 'test' }

        cache.set(key, data)
        expect(cache.has(key)).toBe(true)

        const deleted = cache.delete(key)
        expect(deleted).toBe(true)
        expect(cache.has(key)).toBe(false)
      })

      it('应该清空所有缓存', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        
        expect(cache.size()).toBe(2)
        
        cache.clear()
        expect(cache.size()).toBe(0)
      })

      it('应该返回正确的缓存大小', () => {
        expect(cache.size()).toBe(0)
        
        cache.set('key1', 'value1')
        expect(cache.size()).toBe(1)
        
        cache.set('key2', 'value2')
        expect(cache.size()).toBe(2)
      })

      it('应该返回所有缓存键', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        
        const keys = cache.keys()
        expect(keys).toContain('key1')
        expect(keys).toContain('key2')
        expect(keys.length).toBe(2)
      })
    })

    describe('TTL 过期处理', () => {
      it('应该在TTL过期后返回null', async () => {
        const key = 'test-key'
        const data = { value: 'test' }
        const shortTTL = 10 // 10ms

        cache.set(key, data, shortTTL)
        expect(cache.get(key)).toEqual(data)

        // 等待过期
        await new Promise(resolve => setTimeout(resolve, 20))
        
        expect(cache.get(key)).toBe(null)
        expect(cache.has(key)).toBe(false)
      })

      it('应该使用默认TTL', () => {
        const key = 'test-key'
        const data = { value: 'test' }

        cache.set(key, data)
        
        // 应该在默认TTL内可用
        expect(cache.get(key)).toEqual(data)
      })
    })

    describe('LRU 驱逐策略', () => {
      it('应该在达到最大容量时驱逐最少使用的项', () => {
        // 填满缓存
        for (let i = 0; i < 5; i++) {
          cache.set(`key${i}`, `value${i}`)
        }
        
        expect(cache.size()).toBe(5)
        
        // 访问某些项以更新访问顺序
        cache.get('key1')
        cache.get('key3')
        
        // 添加新项，应该驱逐最少使用的项
        cache.set('key5', 'value5')
        
        expect(cache.size()).toBe(5)
        expect(cache.has('key1')).toBe(true) // 最近访问过
        expect(cache.has('key3')).toBe(true) // 最近访问过
      })
    })

    describe('统计信息', () => {
      it('应该返回正确的统计信息', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        
        const stats = cache.stats()
        
        expect(stats.total).toBe(2)
        expect(stats.maxSize).toBe(5)
        expect(stats.valid).toBe(2)
        expect(stats.expired).toBe(0)
      })

      it('应该正确统计过期项', async () => {
        cache.set('key1', 'value1', 10) // 10ms TTL
        cache.set('key2', 'value2', 1000) // 1s TTL
        
        // 等待第一个过期
        await new Promise(resolve => setTimeout(resolve, 20))
        
        const stats = cache.stats()
        expect(stats.expired).toBe(1)
        expect(stats.valid).toBe(1)
      })
    })

    describe('持久化存储', () => {
      it('应该保存到localStorage', () => {
        const persistentCache = new CacheManager({
          storage: 'localStorage',
          prefix: 'test_'
        })

        persistentCache.set('key1', 'value1')
        
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'test_key1',
          expect.stringContaining('"data":"value1"')
        )
      })

      it('应该从localStorage加载', () => {
        const cacheItem = {
          data: 'value1',
          timestamp: Date.now(),
          expiry: Date.now() + 10000,
          key: 'key1'
        }

        localStorageMock.getItem.mockReturnValue(JSON.stringify(cacheItem))
        localStorageMock.key.mockReturnValue('test_key1')
        localStorageMock.length = 1

        const persistentCache = new CacheManager({
          storage: 'localStorage',
          prefix: 'test_'
        })

        // 应该从localStorage加载数据
        expect(persistentCache.get('key1')).toBe('value1')
      })

      it('应该清理过期的持久化数据', () => {
        const expiredItem = {
          data: 'value1',
          timestamp: Date.now() - 20000,
          expiry: Date.now() - 10000, // 已过期
          key: 'key1'
        }

        localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredItem))
        localStorageMock.key.mockReturnValue('test_key1')
        localStorageMock.length = 1

        new CacheManager({
          storage: 'localStorage',
          prefix: 'test_'
        })

        // 应该删除过期项
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_key1')
      })
    })
  })

  describe('预定义缓存实例', () => {
    it('materialCache 应该正确配置', () => {
      expect(materialCache).toBeInstanceOf(CacheManager)
      
      materialCache.set('test-material', { id: 1, name: 'test' })
      expect(materialCache.get('test-material')).toEqual({ id: 1, name: 'test' })
    })
  })

  describe('工具函数', () => {
    describe('generateCacheKey', () => {
      it('应该生成正确的缓存键', () => {
        const key = generateCacheKey('material', 'list', 1, 'jpg')
        expect(key).toBe('material_list_1_jpg')
      })

      it('应该处理空参数', () => {
        const key = generateCacheKey('material')
        expect(key).toBe('material_')
      })
    })

    describe('CacheUtils', () => {
      it('应该批量设置缓存', () => {
        const items = [
          { key: 'key1', data: 'value1' },
          { key: 'key2', data: 'value2', ttl: 500 }
        ]

        CacheUtils.batchSet(cache, items)

        expect(cache.get('key1')).toBe('value1')
        expect(cache.get('key2')).toBe('value2')
      })

      it('应该批量获取缓存', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.set('key3', 'value3')

        const results = CacheUtils.batchGet(cache, ['key1', 'key2', 'nonexistent'])

        expect(results).toEqual(['value1', 'value2', null])
      })

      it('应该批量删除缓存', () => {
        cache.set('key1', 'value1')
        cache.set('key2', 'value2')
        cache.set('key3', 'value3')

        CacheUtils.batchDelete(cache, ['key1', 'key3'])

        expect(cache.has('key1')).toBe(false)
        expect(cache.has('key2')).toBe(true)
        expect(cache.has('key3')).toBe(false)
      })

      it('应该按前缀删除缓存', () => {
        cache.set('user_1', 'user1')
        cache.set('user_2', 'user2')
        cache.set('material_1', 'material1')
        cache.set('material_2', 'material2')

        CacheUtils.deleteByPrefix(cache, 'user_')

        expect(cache.has('user_1')).toBe(false)
        expect(cache.has('user_2')).toBe(false)
        expect(cache.has('material_1')).toBe(true)
        expect(cache.has('material_2')).toBe(true)
      })
    })
  })

  describe('缓存装饰器', () => {
    it('应该缓存方法结果', async () => {
      const { cached } = await import('../cache')
      
      let callCount = 0
      class TestClass {
        @cached(cache, (id: number) => `test_${id}`)
        async getData(id: number) {
          callCount++
          return { id, data: `data_${id}` }
        }
      }

      const instance = new TestClass()
      
      // 第一次调用
      const result1 = await instance.getData(1)
      expect(result1).toEqual({ id: 1, data: 'data_1' })
      expect(callCount).toBe(1)

      // 第二次调用应该从缓存返回
      const result2 = await instance.getData(1)
      expect(result2).toEqual({ id: 1, data: 'data_1' })
      expect(callCount).toBe(1) // 没有增加

      // 不同参数应该重新调用
      const result3 = await instance.getData(2)
      expect(result3).toEqual({ id: 2, data: 'data_2' })
      expect(callCount).toBe(2)
    })
  })

  describe('错误处理', () => {
    it('应该处理存储错误', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const persistentCache = new CacheManager({
        storage: 'localStorage'
      })

      // 应该不抛出错误
      expect(() => {
        persistentCache.set('key1', 'value1')
      }).not.toThrow()
    })

    it('应该处理JSON解析错误', () => {
      localStorageMock.getItem.mockReturnValue('invalid json')
      localStorageMock.key.mockReturnValue('test_key1')
      localStorageMock.length = 1

      // 应该不抛出错误
      expect(() => {
        new CacheManager({
          storage: 'localStorage',
          prefix: 'test_'
        })
      }).not.toThrow()
    })
  })
})