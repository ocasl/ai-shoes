/**
 * MaterialLibrary 组件单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MaterialLibrary from '../MaterialLibrary.vue'
import { useMaterialStore } from '../../../store/material'
import type { Material } from '../../../types/material'

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

// Mock API
vi.mock('../../../api/file', () => ({
  getMaterialList: vi.fn(),
  deleteMaterial: vi.fn(),
  downloadMaterial: vi.fn()
}))

// Mock 材质数据
const mockMaterials: Material[] = [
  {
    id: 1,
    name: '测试材质1',
    ossPath: '/test/material1.jpg',
    format: 'jpg',
    type: 0,
    userId: 1,
    uploadTime: '2024-01-15T10:30:00Z',
    downloadCount: 10,
    createTime: '2024-01-15T10:30:00Z',
    updateTime: '2024-01-15T10:30:00Z',
    deleted: 0
  },
  {
    id: 2,
    name: '测试材质2',
    ossPath: '/test/material2.png',
    format: 'png',
    type: 1,
    userId: 2,
    uploadTime: '2024-01-16T14:20:00Z',
    downloadCount: 5,
    createTime: '2024-01-16T14:20:00Z',
    updateTime: '2024-01-16T14:20:00Z',
    deleted: 0
  }
]

describe('MaterialLibrary', () => {
  let wrapper: any
  let materialStore: any

  beforeEach(() => {
    setActivePinia(createPinia())
    materialStore = useMaterialStore()
    
    // Mock store methods
    materialStore.loadMaterials = vi.fn().mockResolvedValue(mockMaterials)
    materialStore.deleteMaterial = vi.fn().mockResolvedValue(true)
    materialStore.downloadMaterial = vi.fn().mockResolvedValue('download-url')
    
    wrapper = mount(MaterialLibrary, {
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
      expect(wrapper.find('.material-library').exists()).toBe(true)
    })

    it('应该显示页面标题', () => {
      expect(wrapper.find('.library-header h2').text()).toBe('材质库')
    })

    it('应该包含搜索筛选组件', () => {
      expect(wrapper.findComponent({ name: 'MaterialSearchFilter' }).exists()).toBe(true)
    })

    it('应该包含材质网格组件', () => {
      expect(wrapper.findComponent({ name: 'MaterialGrid' }).exists()).toBe(true)
    })
  })

  describe('数据加载', () => {
    it('应该在组件挂载时加载材质数据', async () => {
      await wrapper.vm.$nextTick()
      expect(materialStore.loadMaterials).toHaveBeenCalled()
    })

    it('应该正确处理加载状态', async () => {
      materialStore.loading = true
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading-state').exists()).toBe(true)
    })

    it('应该正确处理空数据状态', async () => {
      materialStore.materials = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })
  })

  describe('搜索和筛选', () => {
    it('应该响应搜索事件', async () => {
      const searchFilter = wrapper.findComponent({ name: 'MaterialSearchFilter' })
      
      await searchFilter.vm.$emit('search', { keyword: '测试' })
      
      expect(materialStore.loadMaterials).toHaveBeenCalledWith(
        expect.objectContaining({ name: '测试' })
      )
    })

    it('应该响应筛选事件', async () => {
      const searchFilter = wrapper.findComponent({ name: 'MaterialSearchFilter' })
      
      await searchFilter.vm.$emit('filter', { type: 0, format: 'jpg' })
      
      expect(materialStore.loadMaterials).toHaveBeenCalledWith(
        expect.objectContaining({ type: 0, format: 'jpg' })
      )
    })

    it('应该正确重置搜索条件', async () => {
      const searchFilter = wrapper.findComponent({ name: 'MaterialSearchFilter' })
      
      await searchFilter.vm.$emit('reset')
      
      expect(materialStore.loadMaterials).toHaveBeenCalledWith({})
    })
  })

  describe('材质操作', () => {
    it('应该处理材质点击事件', async () => {
      const materialGrid = wrapper.findComponent({ name: 'MaterialGrid' })
      
      await materialGrid.vm.$emit('materialClick', mockMaterials[0])
      
      expect(wrapper.vm.selectedMaterial).toEqual(mockMaterials[0])
    })

    it('应该处理材质下载', async () => {
      const materialGrid = wrapper.findComponent({ name: 'MaterialGrid' })
      
      await materialGrid.vm.$emit('materialAction', 'download', mockMaterials[0])
      
      expect(materialStore.downloadMaterial).toHaveBeenCalledWith(mockMaterials[0].id)
    })

    it('应该处理材质删除', async () => {
      const materialGrid = wrapper.findComponent({ name: 'MaterialGrid' })
      
      await materialGrid.vm.$emit('materialAction', 'delete', mockMaterials[0])
      
      expect(materialStore.deleteMaterial).toHaveBeenCalledWith(mockMaterials[0].id)
    })
  })

  describe('分页功能', () => {
    it('应该正确处理分页变化', async () => {
      await wrapper.vm.handlePageChange(2)
      
      expect(materialStore.loadMaterials).toHaveBeenCalledWith(
        expect.objectContaining({ current: 2 })
      )
    })

    it('应该正确处理页面大小变化', async () => {
      await wrapper.vm.handleSizeChange(20)
      
      expect(materialStore.loadMaterials).toHaveBeenCalledWith(
        expect.objectContaining({ size: 20 })
      )
    })
  })

  describe('错误处理', () => {
    it('应该处理加载错误', async () => {
      const error = new Error('加载失败')
      materialStore.loadMaterials.mockRejectedValue(error)
      
      await wrapper.vm.loadMaterials()
      
      expect(wrapper.vm.error).toBe('加载失败')
    })

    it('应该处理删除错误', async () => {
      const error = new Error('删除失败')
      materialStore.deleteMaterial.mockRejectedValue(error)
      
      await wrapper.vm.handleDelete(mockMaterials[0])
      
      // 应该显示错误消息
      expect(wrapper.vm.error).toBeTruthy()
    })
  })

  describe('权限控制', () => {
    it('应该根据用户权限显示操作按钮', async () => {
      // Mock 用户权限
      vi.mock('../../../utils/auth', () => ({
        hasPermission: vi.fn().mockReturnValue(true),
        Permission: {
          MATERIAL_DELETE: 'material:delete',
          MATERIAL_UPLOAD: 'material:upload'
        }
      }))

      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.upload-button').exists()).toBe(true)
    })

    it('应该隐藏无权限的操作按钮', async () => {
      // Mock 无权限
      vi.mock('../../../utils/auth', () => ({
        hasPermission: vi.fn().mockReturnValue(false),
        Permission: {
          MATERIAL_DELETE: 'material:delete',
          MATERIAL_UPLOAD: 'material:upload'
        }
      }))

      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.upload-button').exists()).toBe(false)
    })
  })
})