# 材质库管理系统开发指南

## 项目概述

材质库管理系统是基于Vue 3 + TypeScript + Element Plus构建的现代化Web应用，提供完整的材质资源管理解决方案。

## 技术栈

### 前端技术
- **Vue 3** - 渐进式JavaScript框架
- **TypeScript** - 类型安全的JavaScript超集
- **Element Plus** - Vue 3 UI组件库
- **Pinia** - Vue状态管理库
- **Vue Router** - Vue官方路由管理器
- **Vite** - 现代化构建工具

### 开发工具
- **Vitest** - 单元测试框架
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Husky** - Git钩子管理

## 项目结构

```
src/
├── api/                    # API接口层
│   ├── file.ts            # 文件和材质相关API
│   ├── user.ts            # 用户相关API
│   └── ...
├── components/             # 组件库
│   ├── common/            # 通用组件
│   │   ├── VirtualScroll.vue
│   │   └── ...
│   ├── material/          # 材质相关组件
│   │   ├── MaterialLibrary.vue
│   │   ├── MaterialUpload.vue
│   │   ├── MaterialGrid.vue
│   │   ├── MaterialSearchFilter.vue
│   │   ├── MaterialSelector.vue
│   │   ├── MaterialDetail.vue
│   │   ├── TagManager.vue
│   │   ├── CategoryManager.vue
│   │   ├── FavoriteManager.vue
│   │   └── __tests__/     # 组件测试
│   └── ...
├── store/                 # 状态管理
│   ├── index.ts          # 根store
│   ├── material.ts       # 材质状态管理
│   ├── user.ts           # 用户状态管理
│   └── ...
├── types/                 # 类型定义
│   ├── material.ts       # 材质相关类型
│   ├── user.ts           # 用户相关类型
│   └── ...
├── utils/                 # 工具函数
│   ├── auth.ts           # 权限验证
│   ├── security.ts       # 安全验证
│   ├── cache.ts          # 缓存管理
│   ├── lazyLoad.ts       # 懒加载
│   ├── logger.ts         # 日志记录
│   └── __tests__/        # 工具测试
├── views/                 # 页面组件
│   ├── Design.vue        # 设计页面
│   └── ...
└── test/                  # 测试配置
    ├── setup.ts          # 测试环境设置
    └── integration/      # 集成测试
```

## 核心模块

### 1. 材质管理模块

#### MaterialLibrary.vue
主要的材质库页面组件，整合了搜索、筛选、网格展示等功能。

```vue
<template>
  <div class="material-library">
    <MaterialSearchFilter @search="handleSearch" @filter="handleFilter" />
    <MaterialGrid :materials="materials" @materialAction="handleMaterialAction" />
    <MaterialUpload v-model:visible="showUpload" @success="handleUploadSuccess" />
  </div>
</template>
```

**主要功能：**
- 材质列表展示
- 搜索和筛选
- 分页处理
- 上传管理

#### MaterialUpload.vue
材质上传组件，支持拖拽上传、表单验证、进度显示。

```vue
<template>
  <el-dialog v-model="dialogVisible" title="上传材质">
    <el-upload drag :before-upload="beforeUpload" @change="handleFileChange">
      <!-- 上传区域 -->
    </el-upload>
    <el-form :model="uploadForm" :rules="formRules">
      <!-- 表单字段 -->
    </el-form>
  </el-dialog>
</template>
```

**主要功能：**
- 文件选择和验证
- 表单数据收集
- 上传进度显示
- 错误处理

#### MaterialGrid.vue
材质网格展示组件，支持懒加载、虚拟滚动。

```vue
<template>
  <div class="materials-grid">
    <div v-for="material in materials" :key="material.id" class="material-card">
      <img v-lazy-load="material.thumbnailUrl" :alt="material.name" />
      <!-- 材质信息和操作按钮 -->
    </div>
  </div>
</template>
```

**主要功能：**
- 网格布局展示
- 懒加载图片
- 悬停操作
- 右键菜单

### 2. 状态管理

#### material.ts
材质相关的状态管理，使用Pinia实现。

```typescript
export const useMaterialStore = defineStore('material', {
  state: () => ({
    materials: [] as Material[],
    loading: false,
    error: null as string | null,
    pagination: {
      current: 1,
      size: 20,
      total: 0
    }
  }),
  
  actions: {
    async loadMaterials(params?: MaterialQueryParams) {
      this.loading = true
      try {
        const response = await getMaterialList(params)
        this.materials = response.data.records
        this.pagination = {
          current: response.data.current,
          size: response.data.size,
          total: response.data.total
        }
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
})
```

### 3. 工具函数

#### auth.ts
权限验证工具，支持角色权限、操作权限验证。

```typescript
export function hasPermission(permission: Permission): boolean {
  const user = getCurrentUser()
  if (!user) return false
  
  if (user.role === UserRole.ADMIN) return true
  
  const rolePermissions = getRolePermissions(user.role)
  return rolePermissions.includes(permission)
}
```

#### security.ts
安全验证工具，包含文件验证、XSS防护等。

```typescript
export function validateFileType(file: File, category: string): boolean {
  const allowedTypes = ALLOWED_FILE_TYPES[category]
  return allowedTypes.includes(file.type)
}

export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}
```

#### cache.ts
缓存管理工具，支持内存缓存、持久化缓存。

```typescript
export class CacheManager<T> {
  private cache = new Map<string, CacheItem<T>>()
  
  set(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.options.defaultTTL)
    this.cache.set(key, { data, timestamp: Date.now(), expiry, key })
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expiry) {
      this.delete(key)
      return null
    }
    return item.data
  }
}
```

## API接口设计

### 材质管理接口

```typescript
// 获取材质列表
GET /api/material/list
POST /api/material/list
{
  "name": "搜索关键词",
  "type": 0,  // 0-系统材质，1-用户材质
  "format": "jpg",
  "current": 1,
  "size": 20
}

// 上传材质
POST /api/material/upload
FormData {
  name: "材质名称",
  type: 1,
  file: File,
  category: "分类",
  tags: ["标签1", "标签2"],
  remark: "备注"
}

// 获取材质详情
GET /api/material/{id}

// 下载材质
POST /api/material/download/{id}

// 删除材质
DELETE /api/material/{id}
```

### 响应格式

```typescript
interface ApiResponse<T = any> {
  code: number      // 状态码：200成功，其他失败
  msg: string       // 响应消息
  data: T          // 响应数据
}

interface MaterialListResponse {
  records: Material[]
  total: number
  size: number
  current: number
  pages: number
}
```

## 组件开发规范

### 1. 组件命名
- 使用PascalCase命名
- 组件文件名与组件名保持一致
- 组件名应该具有描述性

### 2. Props定义
```typescript
interface Props {
  materials: Material[]
  loading?: boolean
  mode?: 'browse' | 'select'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  mode: 'browse'
})
```

### 3. 事件定义
```typescript
const emit = defineEmits<{
  materialClick: [material: Material]
  materialSelect: [material: Material]
  materialAction: [action: string, material: Material]
}>()
```

### 4. 组合式API使用
```typescript
import { ref, computed, onMounted } from 'vue'
import { useMaterialStore } from '@/store/material'

const materialStore = useMaterialStore()
const loading = ref(false)
const materials = computed(() => materialStore.materials)

onMounted(() => {
  loadMaterials()
})
```

## 测试指南

### 单元测试
使用Vitest进行单元测试，测试文件放在`__tests__`目录下。

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MaterialUpload from '../MaterialUpload.vue'

describe('MaterialUpload', () => {
  it('应该正确渲染组件', () => {
    const wrapper = mount(MaterialUpload, {
      props: { visible: true }
    })
    expect(wrapper.exists()).toBe(true)
  })
})
```

### 集成测试
测试组件间的交互和完整的业务流程。

```typescript
describe('材质管理工作流', () => {
  it('应该完成从上传到展示的完整流程', async () => {
    // 测试上传 -> 列表更新 -> 搜索筛选
  })
})
```

### 测试覆盖率
目标覆盖率：
- 语句覆盖率：≥80%
- 分支覆盖率：≥80%
- 函数覆盖率：≥80%
- 行覆盖率：≥80%

## 性能优化

### 1. 懒加载
使用自定义的懒加载指令优化图片加载：

```typescript
import { vLazyLoad } from '@/utils/lazyLoad'

// 在模板中使用
<img v-lazy-load="imageUrl" alt="材质图片" />
```

### 2. 虚拟滚动
对于大量数据使用虚拟滚动组件：

```vue
<VirtualScroll
  :items="materials"
  :item-height="280"
  :container-height="600"
>
  <template #default="{ item }">
    <MaterialCard :material="item" />
  </template>
</VirtualScroll>
```

### 3. 缓存策略
- API响应缓存：5分钟
- 图片缓存：30分钟
- 材质列表缓存：10分钟

### 4. 代码分割
使用动态导入实现路由级别的代码分割：

```typescript
const MaterialLibrary = () => import('@/components/material/MaterialLibrary.vue')
```

## 安全考虑

### 1. 文件上传安全
- 文件类型验证
- 文件大小限制
- 文件名安全检查
- 恶意内容扫描

### 2. XSS防护
- 输入内容转义
- HTML内容清理
- CSP策略配置

### 3. 权限控制
- 基于角色的权限验证
- API接口权限检查
- 前端路由守卫

## 部署配置

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
```

### 测试运行
```bash
npm run test
npm run test:coverage
```

### 代码检查
```bash
npm run lint
npm run lint:fix
```

## 扩展开发

### 添加新的材质类型
1. 更新`ALLOWED_FILE_TYPES`配置
2. 修改文件验证逻辑
3. 更新UI显示逻辑

### 添加新的权限
1. 在`Permission`枚举中添加新权限
2. 更新角色权限映射
3. 在相关组件中添加权限检查

### 添加新的缓存策略
1. 创建新的缓存实例
2. 配置TTL和存储方式
3. 在相关API中集成缓存

## 常见问题

### Q: 如何调试组件？
A: 使用Vue DevTools浏览器扩展，可以查看组件状态、props、events等。

### Q: 如何处理API错误？
A: 统一在store的action中处理错误，设置error状态，在组件中显示错误信息。

### Q: 如何优化大列表性能？
A: 使用虚拟滚动、懒加载、分页等技术，避免一次性渲染大量DOM元素。

### Q: 如何添加新的测试？
A: 在对应的`__tests__`目录下创建测试文件，使用Vitest和Vue Test Utils编写测试。

---

*本文档最后更新时间：2024年1月15日*