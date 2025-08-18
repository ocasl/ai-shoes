import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Material, 
  MaterialQueryParams, 
  MaterialListResponse,
  MaterialFilterOptions 
} from '../types/material'
import { 
  getMaterialList, 
  uploadMaterial, 
  deleteMaterial, 
  downloadMaterial,
  getMaterialDetail 
} from '../api/file'

export const useMaterialStore = defineStore('material', () => {
  // 状态
  const materials = ref<Material[]>([])
  const currentMaterial = ref<Material | null>(null)
  const recentMaterials = ref<Material[]>([])
  const favoriteMaterials = ref<Material[]>([])
  const loading = ref(false)
  const uploading = ref(false)
  
  // 分页状态
  const currentPage = ref(1)
  const pageSize = ref(12)
  const total = ref(0)
  
  // 搜索和筛选状态
  const searchQuery = ref('')
  const filterOptions = ref<MaterialFilterOptions>({})
  
  // 选择状态
  const selectedMaterials = ref<Material[]>([])
  
  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
  
  const hasMore = computed(() => currentPage.value < totalPages.value)
  
  const systemMaterials = computed(() => 
    materials.value.filter(m => m.type === 0)
  )
  
  const userMaterials = computed(() => 
    materials.value.filter(m => m.type === 1)
  )
  
  // Actions
  
  /**
   * 获取材质列表
   */
  const fetchMaterials = async (params?: Partial<MaterialQueryParams>) => {
    loading.value = true
    try {
      const queryParams: MaterialQueryParams = {
        current: currentPage.value,
        size: pageSize.value,
        name: searchQuery.value || undefined,
        ...filterOptions.value,
        ...params
      }
      
      const response = await getMaterialList(queryParams)
      
      if (response.code === 200) {
        const data: MaterialListResponse = response.data
        materials.value = data.records
        total.value = data.total
        currentPage.value = data.current
        
        console.log('材质列表获取成功:', data)
      } else {
        throw new Error(response.msg || '获取材质列表失败')
      }
    } catch (error) {
      console.error('获取材质列表失败:', error)
      
      // 如果API调用失败，使用模拟数据进行测试
      console.log('使用模拟数据进行测试')
      materials.value = getMockMaterials()
      total.value = materials.value.length
    } finally {
      loading.value = false
    }
  }

  // 获取模拟材质数据
  const getMockMaterials = (): Material[] => {
    return [
      {
        id: 1,
        name: '高级皮革纹理',
        ossPath: 'https://picsum.photos/400/300?random=1',
        thumbnailUrl: 'https://picsum.photos/200/150?random=1',
        format: 'jpg',
        type: 0,
        userId: 1,
        uploadTime: '2024-01-15T10:30:00Z',
        downloadCount: 25,
        createTime: '2024-01-15T10:30:00Z',
        updateTime: '2024-01-15T10:30:00Z',
        deleted: 0,
        tags: ['皮革', '纹理', '高级'],
        category: '皮革',
        isFavorite: false
      },
      {
        id: 2,
        name: '现代布料材质',
        ossPath: 'https://picsum.photos/400/300?random=2',
        thumbnailUrl: 'https://picsum.photos/200/150?random=2',
        format: 'png',
        type: 1,
        userId: 2,
        uploadTime: '2024-01-16T14:20:00Z',
        downloadCount: 18,
        createTime: '2024-01-16T14:20:00Z',
        updateTime: '2024-01-16T14:20:00Z',
        deleted: 0,
        tags: ['布料', '现代', '纹理'],
        category: '布料',
        isFavorite: true
      },
      {
        id: 3,
        name: '金属质感材质',
        ossPath: 'https://picsum.photos/400/300?random=3',
        thumbnailUrl: 'https://picsum.photos/200/150?random=3',
        format: 'webp',
        type: 0,
        userId: 1,
        uploadTime: '2024-01-17T09:15:00Z',
        downloadCount: 12,
        createTime: '2024-01-17T09:15:00Z',
        updateTime: '2024-01-17T09:15:00Z',
        deleted: 0,
        tags: ['金属', '质感', '光泽'],
        category: '金属',
        isFavorite: false
      },
      {
        id: 4,
        name: '木纹材质',
        ossPath: 'https://picsum.photos/400/300?random=4',
        thumbnailUrl: 'https://picsum.photos/200/150?random=4',
        format: 'jpg',
        type: 1,
        userId: 3,
        uploadTime: '2024-01-18T16:45:00Z',
        downloadCount: 8,
        createTime: '2024-01-18T16:45:00Z',
        updateTime: '2024-01-18T16:45:00Z',
        deleted: 0,
        tags: ['木纹', '自然', '纹理'],
        category: '木材',
        isFavorite: false
      }
    ]
  }
  
  /**
   * 搜索材质
   */
  const searchMaterials = async (query: string) => {
    searchQuery.value = query
    currentPage.value = 1
    await fetchMaterials()
  }
  
  /**
   * 筛选材质
   */
  const filterMaterials = async (filters: MaterialFilterOptions) => {
    filterOptions.value = { ...filters }
    currentPage.value = 1
    await fetchMaterials()
  }
  
  /**
   * 清除筛选条件
   */
  const clearFilters = async () => {
    searchQuery.value = ''
    filterOptions.value = {}
    currentPage.value = 1
    await fetchMaterials()
  }
  
  /**
   * 切换页面
   */
  const changePage = async (page: number) => {
    currentPage.value = page
    await fetchMaterials()
  }
  
  /**
   * 上传材质
   */
  const uploadNewMaterial = async (materialData: {
    name: string
    type: number
    file: File
    category?: string
    tags?: string[]
    remark?: string
  }) => {
    uploading.value = true
    try {
      const response = await uploadMaterial(materialData)
      
      if (response.code === 200) {
        console.log('材质上传成功:', response.data)
        // 重新获取材质列表
        await fetchMaterials()
        return response.data
      } else {
        throw new Error(response.msg || '材质上传失败')
      }
    } catch (error) {
      console.error('材质上传失败:', error)
      throw error
    } finally {
      uploading.value = false
    }
  }
  
  /**
   * 删除材质
   */
  const removeMaterial = async (id: number) => {
    try {
      const response = await deleteMaterial(id)
      
      if (response.code === 200) {
        // 从本地列表中移除
        materials.value = materials.value.filter(m => m.id !== id)
        total.value -= 1
        
        // 从其他列表中也移除
        recentMaterials.value = recentMaterials.value.filter(m => m.id !== id)
        favoriteMaterials.value = favoriteMaterials.value.filter(m => m.id !== id)
        selectedMaterials.value = selectedMaterials.value.filter(m => m.id !== id)
        
        console.log('材质删除成功')
        return response.data
      } else {
        throw new Error(response.msg || '材质删除失败')
      }
    } catch (error) {
      console.error('材质删除失败:', error)
      throw error
    }
  }
  
  /**
   * 下载材质
   */
  const downloadMaterialFile = async (id: number) => {
    try {
      const response = await downloadMaterial(id)
      
      if (response.code === 200) {
        const downloadData = response.data
        
        // 更新下载次数
        const material = materials.value.find(m => m.id === id)
        if (material) {
          material.downloadCount += 1
        }
        
        console.log('材质下载成功:', downloadData)
        return downloadData
      } else {
        throw new Error(response.msg || '材质下载失败')
      }
    } catch (error) {
      console.error('材质下载失败:', error)
      throw error
    }
  }
  
  /**
   * 获取材质详情
   */
  const fetchMaterialDetail = async (id: number) => {
    try {
      const response = await getMaterialDetail(id)
      
      if (response.code === 200) {
        const material: Material = response.data
        currentMaterial.value = material
        addToRecent(material)
        
        console.log('材质详情获取成功:', material)
        return material
      } else {
        throw new Error(response.msg || '获取材质详情失败')
      }
    } catch (error) {
      console.error('获取材质详情失败:', error)
      throw error
    }
  }
  
  /**
   * 设置当前材质
   */
  const setCurrentMaterial = (material: Material | null) => {
    currentMaterial.value = material
    if (material) {
      addToRecent(material)
    }
  }
  
  /**
   * 添加到最近使用
   */
  const addToRecent = (material: Material) => {
    const index = recentMaterials.value.findIndex(m => m.id === material.id)
    if (index > -1) {
      recentMaterials.value.splice(index, 1)
    }
    recentMaterials.value.unshift(material)
    
    // 限制最近使用列表长度
    if (recentMaterials.value.length > 10) {
      recentMaterials.value.pop()
    }
    
    // 保存到本地存储
    localStorage.setItem('recentMaterials', JSON.stringify(recentMaterials.value))
  }
  
  /**
   * 添加到收藏
   */
  const addToFavorites = (material: Material) => {
    const index = favoriteMaterials.value.findIndex(m => m.id === material.id)
    if (index === -1) {
      favoriteMaterials.value.push({ ...material, isFavorite: true })
      
      // 更新材质列表中的收藏状态
      const listMaterial = materials.value.find(m => m.id === material.id)
      if (listMaterial) {
        listMaterial.isFavorite = true
      }
      
      // 保存到本地存储
      localStorage.setItem('favoriteMaterials', JSON.stringify(favoriteMaterials.value))
    }
  }
  
  /**
   * 从收藏中移除
   */
  const removeFromFavorites = (materialId: number) => {
    favoriteMaterials.value = favoriteMaterials.value.filter(m => m.id !== materialId)
    
    // 更新材质列表中的收藏状态
    const listMaterial = materials.value.find(m => m.id === materialId)
    if (listMaterial) {
      listMaterial.isFavorite = false
    }
    
    // 保存到本地存储
    localStorage.setItem('favoriteMaterials', JSON.stringify(favoriteMaterials.value))
  }
  
  /**
   * 切换收藏状态
   */
  const toggleFavorite = (material: Material) => {
    if (material.isFavorite) {
      removeFromFavorites(material.id)
    } else {
      addToFavorites(material)
    }
  }
  
  /**
   * 选择材质
   */
  const selectMaterial = (material: Material) => {
    const index = selectedMaterials.value.findIndex(m => m.id === material.id)
    if (index === -1) {
      selectedMaterials.value.push(material)
    }
  }
  
  /**
   * 取消选择材质
   */
  const unselectMaterial = (materialId: number) => {
    selectedMaterials.value = selectedMaterials.value.filter(m => m.id !== materialId)
  }
  
  /**
   * 清除所有选择
   */
  const clearSelection = () => {
    selectedMaterials.value = []
  }
  
  /**
   * 切换材质选择状态
   */
  const toggleMaterialSelection = (material: Material) => {
    const index = selectedMaterials.value.findIndex(m => m.id === material.id)
    if (index === -1) {
      selectMaterial(material)
    } else {
      unselectMaterial(material.id)
    }
  }
  
  /**
   * 初始化Store
   */
  const initializeStore = () => {
    // 从本地存储恢复数据
    const savedRecent = localStorage.getItem('recentMaterials')
    if (savedRecent) {
      try {
        recentMaterials.value = JSON.parse(savedRecent)
      } catch (error) {
        console.error('恢复最近使用材质失败:', error)
      }
    }
    
    const savedFavorites = localStorage.getItem('favoriteMaterials')
    if (savedFavorites) {
      try {
        favoriteMaterials.value = JSON.parse(savedFavorites)
      } catch (error) {
        console.error('恢复收藏材质失败:', error)
      }
    }
  }
  
  /**
   * 重置Store状态
   */
  const resetStore = () => {
    materials.value = []
    currentMaterial.value = null
    loading.value = false
    uploading.value = false
    currentPage.value = 1
    total.value = 0
    searchQuery.value = ''
    filterOptions.value = {}
    selectedMaterials.value = []
  }
  
  return {
    // 状态
    materials,
    currentMaterial,
    recentMaterials,
    favoriteMaterials,
    loading,
    uploading,
    currentPage,
    pageSize,
    total,
    searchQuery,
    filterOptions,
    selectedMaterials,
    
    // 计算属性
    totalPages,
    hasMore,
    systemMaterials,
    userMaterials,
    
    // Actions
    fetchMaterials,
    searchMaterials,
    filterMaterials,
    clearFilters,
    changePage,
    uploadNewMaterial,
    removeMaterial,
    downloadMaterialFile,
    fetchMaterialDetail,
    setCurrentMaterial,
    addToRecent,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    selectMaterial,
    unselectMaterial,
    clearSelection,
    toggleMaterialSelection,
    initializeStore,
    resetStore
  }
})