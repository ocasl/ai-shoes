# 材质库管理系统 API 文档

## 概述

本文档描述了材质库管理系统的所有API接口，包括请求格式、响应格式、错误码等详细信息。

## 基础信息

- **Base URL**: `https://api.example.com`
- **API Version**: `v1`
- **Content-Type**: `application/json` (除文件上传外)
- **认证方式**: Bearer Token

## 通用响应格式

所有API接口都遵循统一的响应格式：

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 状态码，200表示成功 |
| msg | string | 响应消息 |
| data | any | 响应数据，具体结构见各接口说明 |

### 通用错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 413 | 文件过大 |
| 415 | 不支持的文件类型 |
| 500 | 服务器内部错误 |
| 1013 | 需要选择操作区域 |

## 认证接口

### 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**响应数据**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

### 用户信息

**接口地址**: `GET /api/auth/user`

**请求头**:
```
Authorization: Bearer {token}
```

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "name": "管理员",
    "role": "admin",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

## 材质管理接口

### 获取材质列表

**接口地址**: `POST /api/material/list`

**请求参数**:
```json
{
  "name": "搜索关键词",
  "type": 0,
  "format": "jpg",
  "category": "皮革",
  "tags": ["标签1", "标签2"],
  "current": 1,
  "size": 20
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 材质名称，支持模糊查询 |
| type | number | 否 | 材质类型：0-系统材质，1-用户材质 |
| format | string | 否 | 文件格式：jpg, png, webp, gif |
| category | string | 否 | 材质分类 |
| tags | string[] | 否 | 标签列表 |
| current | number | 否 | 当前页码，默认1 |
| size | number | 否 | 每页大小，默认20，最大100 |

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "name": "高级皮革纹理",
        "ossPath": "https://cdn.example.com/materials/leather_001.jpg",
        "thumbnailUrl": "https://cdn.example.com/materials/thumb/leather_001.jpg",
        "format": "jpg",
        "type": 0,
        "userId": 1,
        "userName": "admin",
        "category": "皮革",
        "tags": ["皮革", "纹理", "高级"],
        "uploadTime": "2024-01-15T10:30:00Z",
        "downloadCount": 25,
        "fileSize": 2048576,
        "dimensions": "1920x1080",
        "remark": "高质量皮革纹理材质",
        "createTime": "2024-01-15T10:30:00Z",
        "updateTime": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 100,
    "size": 20,
    "current": 1,
    "pages": 5
  }
}
```

### 获取材质详情

**接口地址**: `GET /api/material/{id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 材质ID |

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "高级皮革纹理",
    "ossPath": "https://cdn.example.com/materials/leather_001.jpg",
    "thumbnailUrl": "https://cdn.example.com/materials/thumb/leather_001.jpg",
    "format": "jpg",
    "type": 0,
    "userId": 1,
    "userName": "admin",
    "category": "皮革",
    "tags": ["皮革", "纹理", "高级"],
    "uploadTime": "2024-01-15T10:30:00Z",
    "downloadCount": 25,
    "fileSize": 2048576,
    "dimensions": "1920x1080",
    "remark": "高质量皮革纹理材质",
    "createTime": "2024-01-15T10:30:00Z",
    "updateTime": "2024-01-15T10:30:00Z"
  }
}
```

### 上传材质

**接口地址**: `POST /api/material/upload`

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**请求参数** (FormData):

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 材质名称，1-100个字符 |
| type | number | 是 | 材质类型：0-系统材质，1-用户材质 |
| file | File | 是 | 材质文件 |
| category | string | 否 | 材质分类 |
| tags | string | 否 | 标签，多个标签用逗号分隔 |
| remark | string | 否 | 备注说明，最大200字符 |

**文件要求**:
- 支持格式：JPG, PNG, WEBP, GIF, ZIP, RAR
- 文件大小：最大50MB
- 图片尺寸：建议不超过4096x4096

**响应数据**:
```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "id": 123,
    "name": "新材质",
    "ossPath": "https://cdn.example.com/materials/new_material.jpg",
    "thumbnailUrl": "https://cdn.example.com/materials/thumb/new_material.jpg"
  }
}
```

### 下载材质

**接口地址**: `POST /api/material/download/{id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 材质ID |

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "downloadUrl": "https://cdn.example.com/materials/download/leather_001.jpg?token=xxx",
    "fileName": "高级皮革纹理.jpg",
    "format": "jpg",
    "fileSize": 2048576
  }
}
```

### 删除材质

**接口地址**: `DELETE /api/material/{id}`

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 材质ID |

**权限要求**:
- 用户只能删除自己上传的材质
- 管理员可以删除所有材质

**响应数据**:
```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

### 批量删除材质

**接口地址**: `DELETE /api/material/batch`

**请求参数**:
```json
{
  "ids": [1, 2, 3, 4, 5]
}
```

**响应数据**:
```json
{
  "code": 200,
  "msg": "批量删除成功",
  "data": {
    "successCount": 4,
    "failCount": 1,
    "failedIds": [3]
  }
}
```

## 文件管理接口

### 上传图片

**接口地址**: `POST /api/oss/upload`

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**请求参数** (FormData):

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| image | File | 是 | 图片文件 |

**响应数据**:
```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "id": 456,
    "url": "https://cdn.example.com/images/uploaded_image.jpg",
    "thumbnailUrl": "https://cdn.example.com/images/thumb/uploaded_image.jpg"
  }
}
```

### 获取图片

**接口地址**: `GET /api/oss/feedback`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imageId | number | 是 | 图片ID |

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": "https://cdn.example.com/images/image_456.jpg"
}
```

### 上传蒙版

**接口地址**: `POST /api/oss/mask`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| originalId | string | 是 | 原始图片ID |
| image | File | 是 | 蒙版文件 |

**响应数据**:
```json
{
  "code": 200,
  "msg": "蒙版上传成功",
  "data": {
    "id": 789,
    "url": "https://cdn.example.com/masks/mask_789.png"
  }
}
```

## 分类管理接口

### 获取分类列表

**接口地址**: `GET /api/material/categories`

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "name": "材质类型",
      "parentId": null,
      "icon": "folder",
      "description": "按材质类型分类",
      "sort": 100,
      "enabled": true,
      "materialCount": 28,
      "children": [
        {
          "id": 2,
          "name": "皮革",
          "parentId": 1,
          "icon": "star",
          "description": "各种皮革材质",
          "sort": 90,
          "enabled": true,
          "materialCount": 15,
          "children": []
        }
      ]
    }
  ]
}
```

### 创建分类

**接口地址**: `POST /api/material/categories`

**请求参数**:
```json
{
  "name": "新分类",
  "parentId": 1,
  "icon": "folder",
  "description": "分类描述",
  "sort": 50,
  "enabled": true
}
```

**响应数据**:
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 10,
    "name": "新分类",
    "parentId": 1,
    "icon": "folder",
    "description": "分类描述",
    "sort": 50,
    "enabled": true,
    "materialCount": 0,
    "createTime": "2024-01-15T10:30:00Z",
    "updateTime": "2024-01-15T10:30:00Z"
  }
}
```

## 标签管理接口

### 获取标签列表

**接口地址**: `GET /api/material/tags`

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 |
| limit | number | 否 | 返回数量限制，默认50 |

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "name": "皮革",
      "color": "#8B4513",
      "description": "各种皮革材质",
      "icon": "star",
      "materialCount": 15,
      "createTime": "2024-01-15T10:30:00Z",
      "updateTime": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 创建标签

**接口地址**: `POST /api/material/tags`

**请求参数**:
```json
{
  "name": "新标签",
  "color": "#409EFF",
  "description": "标签描述",
  "icon": "star"
}
```

**响应数据**:
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 20,
    "name": "新标签",
    "color": "#409EFF",
    "description": "标签描述",
    "icon": "star",
    "materialCount": 0,
    "createTime": "2024-01-15T10:30:00Z",
    "updateTime": "2024-01-15T10:30:00Z"
  }
}
```

## 收藏夹管理接口

### 获取收藏夹列表

**接口地址**: `GET /api/material/favorites`

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "name": "我的最爱",
      "description": "收藏的精选材质",
      "isPublic": false,
      "materialCount": 5,
      "createTime": "2024-01-15T10:30:00Z",
      "updateTime": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 创建收藏夹

**接口地址**: `POST /api/material/favorites`

**请求参数**:
```json
{
  "name": "新收藏夹",
  "description": "收藏夹描述",
  "isPublic": false
}
```

### 添加材质到收藏夹

**接口地址**: `POST /api/material/favorites/{favoriteId}/materials`

**请求参数**:
```json
{
  "materialIds": [1, 2, 3]
}
```

### 从收藏夹移除材质

**接口地址**: `DELETE /api/material/favorites/{favoriteId}/materials/{materialId}`

## AI图像处理接口

### 图像融合

**接口地址**: `POST /api/image/gene/strhzxs`

**请求参数**:
```json
{
  "loreName": "模型名称",
  "majorId": 123,
  "minorId": 456,
  "majorStrength": 0.7,
  "minorStrength": 0.3,
  "structuralStrength": 0.5
}
```

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_123456789",
    "status": "processing"
  }
}
```

### 查询任务结果

**接口地址**: `GET /api/task/result/{taskId}`

**响应数据**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "task_123456789",
    "status": "completed",
    "viewUrls": [
      "https://cdn.example.com/results/result_1.jpg",
      "https://cdn.example.com/results/result_2.jpg"
    ],
    "createTime": "2024-01-15T10:30:00Z",
    "completeTime": "2024-01-15T10:32:00Z"
  }
}
```

## 错误处理

### 错误响应格式

```json
{
  "code": 400,
  "msg": "请求参数错误",
  "data": {
    "errors": [
      {
        "field": "name",
        "message": "材质名称不能为空"
      }
    ]
  }
}
```

### 常见错误场景

#### 文件上传错误

```json
{
  "code": 413,
  "msg": "文件大小超出限制",
  "data": {
    "maxSize": "50MB",
    "actualSize": "75MB"
  }
}
```

#### 权限错误

```json
{
  "code": 403,
  "msg": "权限不足",
  "data": {
    "requiredPermission": "material:delete",
    "userRole": "user"
  }
}
```

#### 资源不存在

```json
{
  "code": 404,
  "msg": "材质不存在",
  "data": {
    "materialId": 999
  }
}
```

## 接口调用示例

### JavaScript/TypeScript

```typescript
// 获取材质列表
async function getMaterialList(params: MaterialQueryParams) {
  const response = await fetch('/api/material/list', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  })
  
  const result = await response.json()
  if (result.code === 200) {
    return result.data
  } else {
    throw new Error(result.msg)
  }
}

// 上传材质
async function uploadMaterial(formData: FormData) {
  const response = await fetch('/api/material/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  
  return await response.json()
}
```

### cURL

```bash
# 获取材质列表
curl -X POST "https://api.example.com/api/material/list" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "皮革",
    "type": 0,
    "current": 1,
    "size": 20
  }'

# 上传材质
curl -X POST "https://api.example.com/api/material/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=测试材质" \
  -F "type=1" \
  -F "file=@/path/to/material.jpg"
```

## 版本更新

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持材质管理基础功能
- 实现文件上传和下载
- 添加分类和标签管理

---

*本文档最后更新时间：2024年1月15日*