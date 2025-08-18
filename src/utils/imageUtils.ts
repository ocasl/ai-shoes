/**
 * 图片处理工具函数
 */

/**
 * 处理图片URL，确保返回可访问的完整URL
 */
export function processImageUrl(url: string | undefined): string {
  if (!url) {
    return getPlaceholderImage()
  }

  // 如果已经是完整的HTTP/HTTPS URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 如果是相对路径，拼接服务器地址
  if (url.startsWith('/')) {
    // 这里应该根据实际的服务器地址进行配置
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    return `${baseUrl}${url}`
  }

  // 如果是其他格式，尝试作为相对路径处理
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  return `${baseUrl}/${url}`
}

/**
 * 获取占位图片URL
 */
export function getPlaceholderImage(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaaguaXoOWbvueJhzwvdGV4dD48L3N2Zz4='
}

/**
 * 获取错误图片URL
 */
export function getErrorImage(): string {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2NjYyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4='
}

/**
 * 预加载图片
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * 检查图片是否可访问
 */
export async function checkImageAccessibility(url: string): Promise<boolean> {
  try {
    await preloadImage(url)
    return true
  } catch {
    return false
  }
}

/**
 * 生成缩略图URL
 */
export function generateThumbnailUrl(originalUrl: string, width = 300, height = 300): string {
  const processedUrl = processImageUrl(originalUrl)

  // 如果是我们自己的服务器，可以添加缩略图参数
  if (processedUrl.includes('localhost') || processedUrl.includes('your-domain.com')) {
    const url = new URL(processedUrl)
    url.searchParams.set('w', width.toString())
    url.searchParams.set('h', height.toString())
    url.searchParams.set('fit', 'cover')
    return url.toString()
  }

  return processedUrl
}

/**
 * 创建一个图片加载的Promise，带有超时和错误处理
 */
export function loadImageWithTimeout(url: string, timeout = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const timer = setTimeout(() => {
      reject(new Error('图片加载超时'))
    }, timeout)

    img.onload = () => {
      clearTimeout(timer)
      resolve(url)
    }

    img.onerror = () => {
      clearTimeout(timer)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 将图片转换为1024x1024的base64格式（用于SAM处理）
 */
export function imageToBase64(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // 统一resize到1024x1024
      const canvas = document.createElement('canvas')
      canvas.width = 1024
      canvas.height = 1024
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'))
        return
      }

      // 将图片绘制到1024x1024的canvas上
      ctx.drawImage(img, 0, 0, 1024, 1024)
      const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1]
      resolve(base64)
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

/**
 * 将File对象转换为1024x1024的base64格式
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 统一resize到1024x1024
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 1024
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'))
          return
        }

        // 将图片绘制到1024x1024的canvas上
        ctx.drawImage(img, 0, 0, 1024, 1024)
        const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1]
        resolve(base64)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 创建1024x1024的canvas元素
 */
export function create1024Canvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  canvas.style.width = '1024px'
  canvas.style.height = '1024px'
  return canvas
}

/**
 * 将图片URL转换为1024x1024的ImageData
 */
export function imageUrlToImageData(imageUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = create1024Canvas()
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'))
        return
      }

      ctx.drawImage(img, 0, 0, 1024, 1024)
      const imageData = ctx.getImageData(0, 0, 1024, 1024)
      resolve(imageData)
    }
    img.onerror = reject
    img.src = imageUrl
  })
}

/**
 * 将base64图片转换为1024x1024的canvas
 */
export function base64ToCanvas(base64: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = create1024Canvas()
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建canvas上下文'))
        return
      }

      ctx.drawImage(img, 0, 0, 1024, 1024)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = `data:image/jpeg;base64,${base64}`
  })
}