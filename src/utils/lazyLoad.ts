/**
 * 图片懒加载工具
 */

export interface LazyLoadOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number | number[]
  placeholder?: string
  errorImage?: string
  fadeIn?: boolean
  preload?: number
}

export interface LazyImageElement extends HTMLImageElement {
  _lazyLoaded?: boolean
  _lazyError?: boolean
  _originalSrc?: string
}

class LazyLoader {
  private observer: IntersectionObserver | null = null
  private options: LazyLoadOptions
  private loadingImages = new Set<LazyImageElement>()
  private preloadQueue: string[] = []

  constructor(options: LazyLoadOptions = {}) {
    this.options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
      errorImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVycm9yPC90ZXh0Pjwvc3ZnPg==',
      fadeIn: true,
      preload: 3,
      ...options
    }

    this.initObserver()
  }

  private initObserver() {
    if (!('IntersectionObserver' in window)) {
      // 降级处理：直接加载所有图片
      console.warn('IntersectionObserver not supported, falling back to immediate loading')
      return
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as LazyImageElement
            this.loadImage(img)
            this.observer?.unobserve(img)
          }
        })
      },
      {
        root: this.options.root,
        rootMargin: this.options.rootMargin,
        threshold: this.options.threshold
      }
    )
  }

  /**
   * 观察图片元素
   */
  observe(img: LazyImageElement) {
    if (img._lazyLoaded || this.loadingImages.has(img)) {
      return
    }

    // 设置占位符
    if (!img.src && this.options.placeholder) {
      img.src = this.options.placeholder
    }

    // 保存原始src
    const dataSrc = img.dataset.src
    if (dataSrc) {
      img._originalSrc = dataSrc
    }

    if (this.observer) {
      this.observer.observe(img)
    } else {
      // 降级处理
      this.loadImage(img)
    }
  }

  /**
   * 停止观察图片元素
   */
  unobserve(img: LazyImageElement) {
    if (this.observer) {
      this.observer.unobserve(img)
    }
    this.loadingImages.delete(img)
  }

  /**
   * 加载图片
   */
  private async loadImage(img: LazyImageElement) {
    if (img._lazyLoaded || this.loadingImages.has(img)) {
      return
    }

    const src = img._originalSrc || img.dataset.src
    if (!src) {
      return
    }

    this.loadingImages.add(img)

    try {
      // 预加载图片
      await this.preloadImage(src)
      
      // 设置图片源
      img.src = src
      img._lazyLoaded = true
      
      // 添加淡入效果
      if (this.options.fadeIn) {
        img.style.opacity = '0'
        img.style.transition = 'opacity 0.3s ease-in-out'
        
        img.onload = () => {
          img.style.opacity = '1'
        }
      }

      // 移除data-src属性
      delete img.dataset.src
      
      // 触发自定义事件
      img.dispatchEvent(new CustomEvent('lazyloaded', { detail: { src } }))

    } catch (error) {
      console.error('Failed to load image:', src, error)
      img._lazyError = true
      
      // 设置错误图片
      if (this.options.errorImage) {
        img.src = this.options.errorImage
      }
      
      // 触发错误事件
      img.dispatchEvent(new CustomEvent('lazyerror', { detail: { src, error } }))
    } finally {
      this.loadingImages.delete(img)
    }
  }

  /**
   * 预加载图片
   */
  private preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }

  /**
   * 预加载图片列表
   */
  preloadImages(urls: string[]) {
    this.preloadQueue.push(...urls)
    this.processPreloadQueue()
  }

  /**
   * 处理预加载队列
   */
  private async processPreloadQueue() {
    const concurrent = this.options.preload || 3
    const promises: Promise<void>[] = []

    while (this.preloadQueue.length > 0 && promises.length < concurrent) {
      const url = this.preloadQueue.shift()
      if (url) {
        promises.push(this.preloadImage(url).catch(() => {})) // 忽略预加载错误
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises)
      // 继续处理剩余队列
      if (this.preloadQueue.length > 0) {
        this.processPreloadQueue()
      }
    }
  }

  /**
   * 销毁懒加载器
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.loadingImages.clear()
    this.preloadQueue.length = 0
  }
}

// 创建全局懒加载实例
export const lazyLoader = new LazyLoader()

/**
 * Vue 3 懒加载指令
 */
export const vLazyLoad = {
  mounted(el: LazyImageElement, binding: any) {
    const src = binding.value || el.dataset.src
    if (src) {
      el.dataset.src = src
      lazyLoader.observe(el)
    }
  },
  
  updated(el: LazyImageElement, binding: any) {
    const newSrc = binding.value
    const oldSrc = el._originalSrc
    
    if (newSrc && newSrc !== oldSrc) {
      el._lazyLoaded = false
      el._lazyError = false
      el.dataset.src = newSrc
      lazyLoader.observe(el)
    }
  },
  
  unmounted(el: LazyImageElement) {
    lazyLoader.unobserve(el)
  }
}

/**
 * 批量懒加载图片
 */
export function batchLazyLoad(selector: string = 'img[data-src]', options?: LazyLoadOptions) {
  const loader = new LazyLoader(options)
  const images = document.querySelectorAll(selector) as NodeListOf<LazyImageElement>
  
  images.forEach(img => {
    loader.observe(img)
  })
  
  return loader
}

/**
 * 检查图片是否在视口中
 */
export function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * 获取图片的最佳尺寸
 */
export function getOptimalImageSize(containerWidth: number, containerHeight: number, devicePixelRatio = window.devicePixelRatio || 1) {
  return {
    width: Math.ceil(containerWidth * devicePixelRatio),
    height: Math.ceil(containerHeight * devicePixelRatio)
  }
}

/**
 * 生成响应式图片URL
 */
export function generateResponsiveImageUrl(baseUrl: string, width: number, height?: number, quality = 80) {
  const url = new URL(baseUrl)
  url.searchParams.set('w', width.toString())
  if (height) {
    url.searchParams.set('h', height.toString())
  }
  url.searchParams.set('q', quality.toString())
  return url.toString()
}