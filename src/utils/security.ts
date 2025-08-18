/**
 * 安全验证工具函数
 */

/**
 * 允许的文件类型
 */
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  material: ['image/jpeg', 'image/png', 'image/webp', 'application/zip', 'application/x-rar-compressed']
}

/**
 * 文件大小限制 (bytes)
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  material: 50 * 1024 * 1024 // 50MB
}

/**
 * 验证文件类型
 */
export function validateFileType(file: File, category: keyof typeof ALLOWED_FILE_TYPES): boolean {
  const allowedTypes = ALLOWED_FILE_TYPES[category]
  return allowedTypes.includes(file.type)
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, category: keyof typeof FILE_SIZE_LIMITS): boolean {
  const maxSize = FILE_SIZE_LIMITS[category]
  return file.size <= maxSize
}

/**
 * 验证文件名安全性
 */
export function validateFileName(fileName: string): boolean {
  // 检查文件名长度
  if (fileName.length > 255) {
    return false
  }

  // 检查危险字符
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
  if (dangerousChars.test(fileName)) {
    return false
  }

  // 检查保留名称
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  const nameWithoutExt = fileName.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExt)) {
    return false
  }

  return true
}

/**
 * 清理文件名
 */
export function sanitizeFileName(fileName: string): string {
  // 移除危险字符
  let cleaned = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')

  // 限制长度
  if (cleaned.length > 255) {
    const ext = cleaned.split('.').pop()
    const nameWithoutExt = cleaned.substring(0, 255 - (ext ? ext.length + 1 : 0))
    cleaned = ext ? `${nameWithoutExt}.${ext}` : nameWithoutExt
  }

  return cleaned
}

/**
 * XSS防护 - 清理HTML内容
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * 验证URL安全性
 */
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    // 只允许http和https协议
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * 生成CSRF Token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 验证CSRF Token
 */
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  return token === expectedToken
}

/**
 * 检查文件内容是否为图片
 */
export function validateImageFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(true)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(false)
    }

    img.src = url
  })
}

/**
 * 检测文件是否包含恶意内容
 */
export function scanFileForMalware(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string

      // 简单的恶意内容检测
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.write/i
      ]

      const isMalicious = maliciousPatterns.some(pattern => pattern.test(content))
      resolve(!isMalicious)
    }

    reader.onerror = () => resolve(false)

    // 只读取文件的前1KB进行检测
    const blob = file.slice(0, 1024)
    reader.readAsText(blob)
  })
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse(jsonString: string): any {
  try {
    return JSON.parse(jsonString)
  } catch {
    return null
  }
}

/**
 * 输入验证规则
 */
export const ValidationRules = {
  materialName: {
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\s\-_\.]+$/
  },
  materialDescription: {
    maxLength: 500
  },
  tag: {
    minLength: 1,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\-_]+$/
  }
}

/**
 * 验证输入字符串
 */
export function validateInput(value: string, rule: keyof typeof ValidationRules): boolean {
  const validation = ValidationRules[rule]

  if (validation.minLength && value.length < validation.minLength) {
    return false
  }

  if (validation.maxLength && value.length > validation.maxLength) {
    return false
  }

  if (validation.pattern && !validation.pattern.test(value)) {
    return false
  }

  return true
}