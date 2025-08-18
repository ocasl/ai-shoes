/**
 * MaterialUpload 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MaterialUpload from '../MaterialUpload.vue'
import { useMaterialStore } from '../../../store/material'

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

// Mock 权限验证
vi.mock('../../../utils/auth', () => ({
  hasPermission: vi.fn().mockReturnValue(true),
  getCurrentUser: vi.fn().mockReturnValue({ id: 1, role: 'user' }),
  Permission: {
    MATERIAL_UPLOAD: 'material:upload',
    SYSTEM_MATERIAL_MANAGE: 'system_material:manage'
  },
  UserRole: {
    ADMIN: 'admin',
    USER: 'user'
  }
}))

// Mock 安全验证
vi.mock('../../../utils/security', () => ({
  validateFileType: vi.fn().mockReturnValue(true),
  validateFileSize: vi.fn().mockReturnValue(true),
  validateFileName: vi.fn().mockReturnValue(true),
  validateInput: vi.fn().mockReturnValue(true),
  validateImageFile: vi.fn().mockResolvedValue(true),
  scanFileForMalware: vi.fn().mockResolvedValue(true),
  sanitizeFileName: vi.fn().mockImplementation(name => name),
  FILE_SIZE_LIMITS: {
    material: 50 * 1024 * 1024
  },
  ValidationRules: {
    materialName: {
      pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\s\-_\.]+$/
    },
    tag: {
      pattern: /^[a-zA-Z0-9\u4e00-\u9fa5\-_]+$/
    }
  }
}))

// Mock API
vi.mock('../../../api/file', () => ({
  isUserLoggedIn: vi.fn().mockReturnValue(true)
}))

describe('MaterialUpload', () => {
  let wrapper: any
  let materialStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    materialStore = useMaterialStore()
    
    // Mock store methods
    materialStore.uploadNewMaterial = vi.fn().mockResolvedValue({
      id: 1,
      name: '测试材质',
      ossPath: '/test/material.jpg'
    })
    
    wrapper = mount(MaterialUpload, {
      props: {
        visible: true
      },
      global: {
        plugins: [createPinia()]
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
  })

  describe('组件渲染', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.upload-container').exists()).toBe(true)
    })

    it('应该显示上传区域', () => {
      expect(wrapper.find('.upload-section').exists()).toBe(true)
      expect(wrapper.find('.material-uploader').exists()).toBe(true)
    })

    it('应该显示表单区域', () => {
      expect(wrapper.find('.form-section').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ElForm' }).exists()).toBe(true)
    })

    it('应该显示对话框底部按钮', () => {
      expect(wrapper.find('.dialog-footer').exists()).toBe(true)
      expect(wrapper.find('.dialog-footer .el-button').exists()).toBe(true)
    })
  })

  describe('文件选择', () => {
    it('应该处理文件选择', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const uploadComponent = wrapper.findComponent({ name: 'ElUpload' })
      
      await uploadComponent.vm.$emit('change', { raw: file, name: 'test.jpg' })
      
      expect(wrapper.vm.selectedFile).toBe(file)
      expect(wrapper.vm.uploadForm.name).toBe('test')
    })

    it('应该验证文件类型', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      const result = wrapper.vm.beforeUpload(file)
      
      expect(result).toBe(false)
    })

    it('应该验证文件大小', async () => {
      const largeFile = new File(['x'.repeat(100 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      })
      
      // Mock 文件大小验证失败
      const { validateFileSize } = await import('../../../utils/security')
      vi.mocked(validateFileSize).mockReturnValue(false)
      
      const result = wrapper.vm.beforeUpload(largeFile)
      
      expect(result).toBe(false)
    })

    it('应该生成文件预览', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        result: 'data:image/jpeg;base64,test'
      }
      
      global.FileReader = vi.fn(() => mockFileReader) as any
      
      await wrapper.vm.handleFileChange({ raw: file, name: 'test.jpg' })
      
      // 触发 FileReader onload
      mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,test' } })
      
      expect(wrapper.vm.previewUrl).toBe('data:image/jpeg;base64,test')
    })
  })

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      const form = wrapper.findComponent({ name: 'ElForm' })
      
      // 清空必填字段
      wrapper.vm.uploadForm.name = ''
      
      try {
        await form.vm.validate()
        expect(false).toBe(true) // 不应该到达这里
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    it('应该验证材质名称格式', async () => {
      wrapper.vm.uploadForm.name = '测试@#$%材质'
      
      const { ValidationRules } = await import('../../../utils/security')
      const isValid = ValidationRules.materialName.pattern.test(wrapper.vm.uploadForm.name)
      
      expect(isValid).toBe(false)
    })

    it('应该验证标签格式', async () => {
      wrapper.vm.uploadForm.tags = ['有效标签', '无效@标签']
      
      const { ValidationRules } = await import('../../../utils/security')
      const invalidTag = wrapper.vm.uploadForm.tags.find(tag => 
        !ValidationRules.tag.pattern.test(tag)
      )
      
      expect(invalidTag).toBe('无效@标签')
    })
  })

  describe('上传功能', () => {
    beforeEach(() => {
      // 设置有效的表单数据
      wrapper.vm.uploadForm = {
        name: '测试材质',
        type: 1,
        category: '皮革',
        tags: ['测试'],
        remark: '测试备注'
      }
      wrapper.vm.selectedFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    })

    it('应该成功上传材质', async () => {
      await wrapper.vm.handleUpload()
      
      expect(materialStore.uploadNewMaterial).toHaveBeenCalledWith({
        name: '测试材质',
        type: 1,
        file: wrapper.vm.selectedFile,
        category: '皮革',
        tags: ['测试'],
        remark: '测试备注'
      })
    })

    it('应该显示上传进度', async () => {
      const uploadPromise = wrapper.vm.handleUpload()
      
      expect(wrapper.vm.uploading).toBe(true)
      expect(wrapper.find('.upload-progress').exists()).toBe(true)
      
      await uploadPromise
    })

    it('应该处理上传错误', async () => {
      const error = new Error('上传失败')
      materialStore.uploadNewMaterial.mockRejectedValue(error)
      
      await wrapper.vm.handleUpload()
      
      expect(wrapper.vm.uploading).toBe(false)
    })

    it('应该在上传成功后重置表单', async () => {
      await wrapper.vm.handleUpload()
      
      expect(wrapper.vm.uploadForm.name).toBe('')
      expect(wrapper.vm.selectedFile).toBe(null)
      expect(wrapper.vm.previewUrl).toBe('')
    })
  })

  describe('权限控制', () => {
    it('应该检查上传权限', async () => {
      const { hasPermission } = await import('../../../utils/auth')
      vi.mocked(hasPermission).mockReturnValue(false)
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const result = wrapper.vm.beforeUpload(file)
      
      expect(result).toBe(false)
    })

    it('应该根据用户角色显示系统材质选项', async () => {
      const { getCurrentUser } = await import('../../../utils/auth')
      vi.mocked(getCurrentUser).mockReturnValue({ id: 1, role: 'admin' })
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.canUploadSystemMaterial).toBe(true)
    })
  })

  describe('标签管理', () => {
    it('应该添加标签', async () => {
      wrapper.vm.newTag = '新标签'
      
      await wrapper.vm.addTag()
      
      expect(wrapper.vm.uploadForm.tags).toContain('新标签')
      expect(wrapper.vm.newTag).toBe('')
      expect(wrapper.vm.showTagInput).toBe(false)
    })

    it('应该移除标签', async () => {
      wrapper.vm.uploadForm.tags = ['标签1', '标签2']
      
      await wrapper.vm.removeTag('标签1')
      
      expect(wrapper.vm.uploadForm.tags).not.toContain('标签1')
      expect(wrapper.vm.uploadForm.tags).toContain('标签2')
    })

    it('应该添加推荐标签', async () => {
      await wrapper.vm.addRecommendedTag('推荐标签')
      
      expect(wrapper.vm.uploadForm.tags).toContain('推荐标签')
    })

    it('应该防止重复添加标签', async () => {
      wrapper.vm.uploadForm.tags = ['已存在']
      wrapper.vm.newTag = '已存在'
      
      await wrapper.vm.addTag()
      
      expect(wrapper.vm.uploadForm.tags.filter(tag => tag === '已存在')).toHaveLength(1)
    })
  })

  describe('对话框控制', () => {
    it('应该正确处理对话框关闭', async () => {
      await wrapper.vm.handleClose()
      
      expect(wrapper.emitted('update:visible')).toBeTruthy()
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('应该在上传中时确认关闭', async () => {
      wrapper.vm.uploading = true
      
      const { ElMessageBox } = await import('element-plus')
      vi.mocked(ElMessageBox.confirm).mockResolvedValue('confirm')
      
      await wrapper.vm.handleClose()
      
      expect(ElMessageBox.confirm).toHaveBeenCalled()
    })

    it('应该重置表单数据', async () => {
      wrapper.vm.uploadForm.name = '测试'
      wrapper.vm.selectedFile = new File(['test'], 'test.jpg')
      wrapper.vm.previewUrl = 'test-url'
      
      await wrapper.vm.resetForm()
      
      expect(wrapper.vm.uploadForm.name).toBe('')
      expect(wrapper.vm.selectedFile).toBe(null)
      expect(wrapper.vm.previewUrl).toBe('')
    })
  })
})