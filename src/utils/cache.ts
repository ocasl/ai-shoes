/**
 * 缓存管理工具
 */

export interface CacheItem<T = any> {
  data: T
  timestamp: number
  expiry: number
  key: string
}

export interface CacheOptions {
  maxSize?: number
  defaultTTL?: number
  storage?: 'memory' | 'localStorage' | 'sessionStorage'
  prefix?: string
}

class CacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>()
  private options: Required<CacheOptions>
  private accessOrder = new Map<string, number>()
  private accessCounter = 0

  constructor(options: CacheOptions = {}) {
    this.options = {
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000, // 5分钟
      storage: 'memory',
      prefix: 'cache_',
      ...options
    }

    // 从持久化存储中恢复缓存
    if (this.options.storage !== 'memory') {
      this.loadFromStorage()
    }

    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60 * 1000) // 每分钟清理一次
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.options.defaultTTL)
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry,
      key
    }

    // 如果缓存已满，删除最少使用的项
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, item)
    this.updateAccessOrder(key)

    // 持久化到存储
    if (this.options.storage !== 'memory') {
      this.saveToStorage(key, item)
    }
  }

  /**
   * 获取缓存
   */
  get(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.delete(key)
      return null
    }

    this.updateAccessOrder(key)
    return item.data
  }

  /**
   * 检查缓存是否存在且未过期
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) {
      return false
    }

    if (Date.now() > item.expiry) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.accessOrder.delete(key)

    if (this.options.storage !== 'memory') {
      this.removeFromStorage(key)
    }

    return deleted
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.accessCounter = 0

    if (this.options.storage !== 'memory') {
      this.clearStorage()
    }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size
  }

  /**
   * 获取所有缓存键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存统计信息
   */
  stats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter)
  }

  /**
   * 驱逐最少使用的项
   */
  private evictLRU(): void {
    let lruKey = ''
    let lruAccess = Infinity

    for (const [key, access] of this.accessOrder) {
      if (access < lruAccess) {
        lruAccess = access
        lruKey = key
      }
    }

    if (lruKey) {
      this.delete(lruKey)
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, item] of this.cache) {
      if (now > item.expiry) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.delete(key))
  }

  /**
   * 计算命中率
   */
  private calculateHitRate(): number {
    // 这里简化处理，实际应用中可以维护更详细的统计
    return 0
  }

  /**
   * 从存储中加载缓存
   */
  private loadFromStorage(): void {
    try {
      const storage = this.getStorage()
      if (!storage) return

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(this.options.prefix)) {
          const item = JSON.parse(storage.getItem(key) || '{}')
          const cacheKey = key.replace(this.options.prefix, '')

          // 检查是否过期
          if (Date.now() <= item.expiry) {
            this.cache.set(cacheKey, item)
          } else {
            storage.removeItem(key)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error)
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(key: string, item: CacheItem<T>): void {
    try {
      const storage = this.getStorage()
      if (storage) {
        storage.setItem(this.options.prefix + key, JSON.stringify(item))
      }
    } catch (error) {
      console.error('Failed to save cache to storage:', error)
    }
  }

  /**
   * 从存储中移除
   */
  private removeFromStorage(key: string): void {
    try {
      const storage = this.getStorage()
      if (storage) {
        storage.removeItem(this.options.prefix + key)
      }
    } catch (error) {
      console.error('Failed to remove cache from storage:', error)
    }
  }

  /**
   * 清空存储
   */
  private clearStorage(): void {
    try {
      const storage = this.getStorage()
      if (!storage) return

      const keysToRemove: string[] = []
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key?.startsWith(this.options.prefix)) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => storage.removeItem(key))
    } catch (error) {
      console.error('Failed to clear cache storage:', error)
    }
  }

  /**
   * 获取存储对象
   */
  private getStorage(): Storage | null {
    try {
      switch (this.options.storage) {
        case 'localStorage':
          return localStorage
        case 'sessionStorage':
          return sessionStorage
        default:
          return null
      }
    } catch {
      return null
    }
  }
}

// 创建不同类型的缓存实例
export const materialCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 10 * 60 * 1000, // 10分钟
  storage: 'localStorage',
  prefix: 'material_'
})

export const imageCache = new CacheManager({
  maxSize: 100,
  defaultTTL: 30 * 60 * 1000, // 30分钟
  storage: 'memory',
  prefix: 'image_'
})

export const apiCache = new CacheManager({
  maxSize: 50,
  defaultTTL: 5 * 60 * 1000, // 5分钟
  storage: 'sessionStorage',
  prefix: 'api_'
})

/**
 * 缓存装饰器
 */
export function cached(cacheManager: CacheManager, keyGenerator?: (...args: any[]) => string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator ? keyGenerator(...args) : `${propertyKey}_${JSON.stringify(args)}`

      // 尝试从缓存获取
      const cached = cacheManager.get(cacheKey)
      if (cached !== null) {
        return cached
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 缓存结果
      cacheManager.set(cacheKey, result, ttl)

      return result
    }

    return descriptor
  }
}

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}_${parts.join('_')}`
}

/**
 * 缓存工具函数
 */
export const CacheUtils = {
  /**
   * 批量设置缓存
   */
  batchSet<T>(cacheManager: CacheManager<T>, items: Array<{ key: string; data: T; ttl?: number }>) {
    items.forEach(({ key, data, ttl }) => {
      cacheManager.set(key, data, ttl)
    })
  },

  /**
   * 批量获取缓存
   */
  batchGet<T>(cacheManager: CacheManager<T>, keys: string[]): Array<T | null> {
    return keys.map(key => cacheManager.get(key))
  },

  /**
   * 批量删除缓存
   */
  batchDelete(cacheManager: CacheManager, keys: string[]): void {
    keys.forEach(key => cacheManager.delete(key))
  },

  /**
   * 按前缀删除缓存
   */
  deleteByPrefix(cacheManager: CacheManager, prefix: string): void {
    const keys = cacheManager.keys().filter(key => key.startsWith(prefix))
    this.batchDelete(cacheManager, keys)
  }
}