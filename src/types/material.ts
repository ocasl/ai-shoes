// 材质管理相关类型定义

// 材质实体类型
export interface Material {
  id: number
  name: string
  ossPath: string
  format: string
  type: number // 0-系统材质库，1-用户材质库
  userId: number
  uploadTime: string
  downloadCount: number
  createTime: string
  updateTime: string
  remark?: string
  deleted: number

  // 扩展字段
  thumbnailUrl?: string // 缩略图URL
  tags?: string[] // 标签
  category?: string // 分类
  isFavorite?: boolean // 是否收藏
}

// 材质查询参数
export interface MaterialQueryParams {
  name?: string // 材质名称（模糊查询）
  type?: number // 材质类型：0-系统材质库，1-用户材质库
  format?: string // 文件格式
  category?: string // 分类
  tags?: string[] // 标签
  current?: number // 当前页码，默认1
  size?: number // 每页大小，默认10，最大100
  sortBy?: 'uploadTime' | 'downloadCount' | 'name' // 排序字段
  sortOrder?: 'asc' | 'desc' // 排序方向
}

// 材质列表响应
export interface MaterialListResponse {
  records: Material[]
  total: number
  size: number
  current: number
  pages: number
}

// 材质上传请求
export interface MaterialUploadRequest {
  name: string
  type: number
  file: File
  category?: string
  tags?: string[]
  remark?: string
}

// 材质下载响应
export interface MaterialDownloadResponse {
  downloadUrl: string
  fileName: string
  format: string
}

// 材质筛选选项
export interface MaterialFilterOptions {
  type?: number
  format?: string
  category?: string
  tags?: string[]
  sortBy?: string
  sortOrder?: string
}

// 材质选择器属性
export interface MaterialSelectorProps {
  visible: boolean
  multiple?: boolean
  selectedMaterials?: Material[]
  filterOptions?: MaterialFilterOptions
  onSelect?: (materials: Material[]) => void
  onCancel?: () => void
}

// 材质上传组件属性
export interface MaterialUploadProps {
  visible: boolean
  defaultType?: number
  onSuccess?: (material: Material) => void
  onCancel?: () => void
}

// 材质库组件属性
export interface MaterialLibraryProps {
  mode?: 'browse' | 'select' // 浏览模式或选择模式
  multiple?: boolean // 是否支持多选
  onMaterialSelect?: (material: Material | Material[]) => void
}

// 材质库状态
export interface MaterialLibraryState {
  materials: Material[]
  loading: boolean
  currentPage: number
  pageSize: number
  total: number
  searchQuery: string
  filterOptions: MaterialFilterOptions
  selectedMaterials: Material[]
}

// 材质预览属性
export interface MaterialPreviewProps {
  material: Material
  shoeImage?: string // 鞋款图片用于预览效果
  onApply?: (material: Material) => void
  onClose?: () => void
}

// 材质操作类型
export type MaterialAction = 'view' | 'download' | 'delete' | 'edit' | 'favorite'

// 材质权限类型
export interface MaterialPermission {
  canView: boolean
  canDownload: boolean
  canDelete: boolean
  canEdit: boolean
  canUpload: boolean
}

// 错误消息映射
export const MaterialErrorMessages = {
  1030: '权限不足，无法执行此操作',
  1032: '材质不存在或已被删除',
  1033: '材质删除失败，请重试',
  'UPLOAD_SIZE_LIMIT': '文件大小不能超过10MB',
  'UPLOAD_FORMAT_ERROR': '不支持的文件格式，请上传图片文件',
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'PERMISSION_DENIED': '权限不足，无法访问此材质',
  'MATERIAL_NOT_FOUND': '材质不存在',
  'UPLOAD_FAILED': '材质上传失败'
} as const

// 材质类型枚举
export enum MaterialType {
  SYSTEM = 0, // 系统材质库
  USER = 1    // 用户材质库
}

// 材质格式枚举
export enum MaterialFormat {
  JPG = 'jpg',
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
  GIF = 'gif'
}

// 排序选项
export const MaterialSortOptions = [
  { label: '上传时间', value: 'uploadTime' },
  { label: '下载次数', value: 'downloadCount' },
  { label: '材质名称', value: 'name' }
] as const

// 材质分类选项
export const MaterialCategories = [
  { label: '皮革', value: 'leather' },
  { label: '布料', value: 'fabric' },
  { label: '橡胶', value: 'rubber' },
  { label: '金属', value: 'metal' },
  { label: '塑料', value: 'plastic' },
  { label: '其他', value: 'other' }
] as const