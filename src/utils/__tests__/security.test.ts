/**
 * 安全验证工具测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateFileType,
  validateFileSize,
  validateFileName,
  sanitizeFileName,
  validateUrl,
  validateInput,
  sanitizeHtml,
  generateCSRFToken,
  validateCSRFToken,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
  ValidationRules
} from '../security'

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    })
  }
})

describe('安全验证工具', () => {
  describe('validateFileType', () => {
    it('应该验证允许的图片类型', () => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' })
      
      expect(validateFileType(jpegFile, 'image')).toBe(true)
      expect(validateFileType(pngFile, 'image')).toBe(true)
    })

    it('应该拒绝不允许的文件类型', () => {
      const txtFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const exeFile = new File(['test'], 'test.exe', { type: 'application/octet-stream' })
      
      expect(validateFileType(txtFile, 'image')).toBe(false)
      expect(validateFileType(exeFile, 'image')).toBe(false)
    })

    it('应该验证材质文件类型', () => {
      const zipFile = new File(['test'], 'test.zip', { type: 'application/zip' })
      const rarFile = new File(['test'], 'test.rar', { type: 'application/x-rar-compressed' })
      
      expect(validateFileType(zipFile, 'material')).toBe(true)
      expect(validateFileType(rarFile, 'material')).toBe(true)
    })
  })

  describe('validateFileSize', () => {
    it('应该验证文件大小限制', () => {
      const smallFile = new File(['x'.repeat(1024)], 'small.jpg', { type: 'image/jpeg' })
      const largeFile = new File(['x'.repeat(20 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      
      expect(validateFileSize(smallFile, 'image')).toBe(true)
      expect(validateFileSize(largeFile, 'image')).toBe(true)
    })

    it('应该拒绝超大文件', () => {
      const hugeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' })
      
      expect(validateFileSize(hugeFile, 'image')).toBe(false)
    })
  })

  describe('validateFileName', () => {
    it('应该验证有效的文件名', () => {
      expect(validateFileName('test.jpg')).toBe(true)
      expect(validateFileName('材质_01.png')).toBe(true)
      expect(validateFileName('material-texture.webp')).toBe(true)
    })

    it('应该拒绝包含危险字符的文件名', () => {
      expect(validateFileName('test<script>.jpg')).toBe(false)
      expect(validateFileName('test|pipe.jpg')).toBe(false)
      expect(validateFileName('test?.jpg')).toBe(false)
    })

    it('应该拒绝过长的文件名', () => {
      const longName = 'x'.repeat(300) + '.jpg'
      expect(validateFileName(longName)).toBe(false)
    })

    it('应该拒绝保留名称', () => {
      expect(validateFileName('CON.jpg')).toBe(false)
      expect(validateFileName('PRN.png')).toBe(false)
      expect(validateFileName('AUX.gif')).toBe(false)
    })
  })

  describe('sanitizeFileName', () => {
    it('应该清理危险字符', () => {
      expect(sanitizeFileName('test<script>.jpg')).toBe('test_script_.jpg')
      expect(sanitizeFileName('test|pipe.jpg')).toBe('test_pipe.jpg')
    })

    it('应该限制文件名长度', () => {
      const longName = 'x'.repeat(300) + '.jpg'
      const sanitized = sanitizeFileName(longName)
      expect(sanitized.length).toBeLessThanOrEqual(255)
      expect(sanitized.endsWith('.jpg')).toBe(true)
    })

    it('应该保留有效字符', () => {
      expect(sanitizeFileName('valid-file_name.jpg')).toBe('valid-file_name.jpg')
    })
  })

  describe('validateUrl', () => {
    it('应该验证有效的URL', () => {
      expect(validateUrl('https://example.com')).toBe(true)
      expect(validateUrl('http://localhost:3000')).toBe(true)
    })

    it('应该拒绝无效的URL', () => {
      expect(validateUrl('javascript:alert(1)')).toBe(false)
      expect(validateUrl('ftp://example.com')).toBe(false)
      expect(validateUrl('invalid-url')).toBe(false)
    })
  })

  describe('validateInput', () => {
    it('应该验证材质名称', () => {
      expect(validateInput('有效材质名称', 'materialName')).toBe(true)
      expect(validateInput('Valid Material', 'materialName')).toBe(true)
      expect(validateInput('材质_01', 'materialName')).toBe(true)
    })

    it('应该拒绝无效的材质名称', () => {
      expect(validateInput('', 'materialName')).toBe(false) // 太短
      expect(validateInput('x'.repeat(200), 'materialName')).toBe(false) // 太长
      expect(validateInput('材质@#$', 'materialName')).toBe(false) // 无效字符
    })

    it('应该验证标签', () => {
      expect(validateInput('有效标签', 'tag')).toBe(true)
      expect(validateInput('valid-tag', 'tag')).toBe(true)
    })

    it('应该拒绝无效的标签', () => {
      expect(validateInput('', 'tag')).toBe(false)
      expect(validateInput('x'.repeat(30), 'tag')).toBe(false)
      expect(validateInput('tag@#$', 'tag')).toBe(false)
    })
  })

  describe('sanitizeHtml', () => {
    it('应该清理HTML内容', () => {
      expect(sanitizeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
      expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toBe('&lt;img src="x" onerror="alert(1)"&gt;')
    })

    it('应该保留纯文本', () => {
      expect(sanitizeHtml('纯文本内容')).toBe('纯文本内容')
      expect(sanitizeHtml('Normal text')).toBe('Normal text')
    })
  })

  describe('CSRF Token', () => {
    it('应该生成CSRF token', () => {
      const token = generateCSRFToken()
      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes * 2 (hex)
    })

    it('应该验证CSRF token', () => {
      const token = 'test-token'
      expect(validateCSRFToken(token, token)).toBe(true)
      expect(validateCSRFToken(token, 'different-token')).toBe(false)
    })

    it('应该生成不同的token', () => {
      const token1 = generateCSRFToken()
      const token2 = generateCSRFToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('文件内容验证', () => {
    beforeEach(() => {
      // Mock Image constructor
      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        src: string = ''
        
        set src(value: string) {
          setTimeout(() => {
            if (value.includes('valid')) {
              this.onload?.()
            } else {
              this.onerror?.()
            }
          }, 0)
        }
      } as any

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL = {
        createObjectURL: vi.fn().mockReturnValue('blob:valid-url'),
        revokeObjectURL: vi.fn()
      } as any
    })

    it('应该验证有效的图片文件', async () => {
      const file = new File(['valid-image'], 'test.jpg', { type: 'image/jpeg' })
      
      const { validateImageFile } = await import('../security')
      const result = await validateImageFile(file)
      
      expect(result).toBe(true)
    })

    it('应该拒绝无效的图片文件', async () => {
      const file = new File(['invalid-image'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock Image to fail
      global.Image = class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        set src(value: string) {
          setTimeout(() => this.onerror?.(), 0)
        }
      } as any

      const { validateImageFile } = await import('../security')
      const result = await validateImageFile(file)
      
      expect(result).toBe(false)
    })
  })

  describe('恶意内容检测', () => {
    beforeEach(() => {
      // Mock FileReader
      global.FileReader = class {
        onload: ((event: any) => void) | null = null
        onerror: (() => void) | null = null
        result: string = ''
        
        readAsText(blob: Blob) {
          setTimeout(() => {
            // 模拟读取文件内容
            if (blob.size > 0) {
              this.result = 'file content'
              this.onload?.({ target: { result: this.result } })
            } else {
              this.onerror?.()
            }
          }, 0)
        }
      } as any
    })

    it('应该检测恶意脚本', async () => {
      const maliciousFile = new File(['<script>alert(1)</script>'], 'test.html')
      
      // Mock FileReader to return malicious content
      global.FileReader = class {
        onload: ((event: any) => void) | null = null
        onerror: (() => void) | null = null
        
        readAsText() {
          setTimeout(() => {
            this.onload?.({ target: { result: '<script>alert(1)</script>' } })
          }, 0)
        }
      } as any

      const { scanFileForMalware } = await import('../security')
      const result = await scanFileForMalware(maliciousFile)
      
      expect(result).toBe(false)
    })

    it('应该通过安全文件', async () => {
      const safeFile = new File(['safe content'], 'test.txt')
      
      const { scanFileForMalware } = await import('../security')
      const result = await scanFileForMalware(safeFile)
      
      expect(result).toBe(true)
    })
  })

  describe('JSON解析', () => {
    it('应该安全解析有效JSON', () => {
      const { safeJsonParse } = require('../security')
      
      expect(safeJsonParse('{"key": "value"}')).toEqual({ key: 'value' })
      expect(safeJsonParse('[1, 2, 3]')).toEqual([1, 2, 3])
    })

    it('应该处理无效JSON', () => {
      const { safeJsonParse } = require('../security')
      
      expect(safeJsonParse('invalid json')).toBe(null)
      expect(safeJsonParse('')).toBe(null)
      expect(safeJsonParse('{')).toBe(null)
    })
  })
})