# SAM交互式分割API文档

## 概述

这是一个基于Flask的RESTful API服务，提供SAM（Segment Anything Model）交互式分割功能。支持正点（前景）和负点（背景）的交互式分割。


服务在 `http://js1.blockelite.cn:34965/` 启动。

## API端点

### 1. 健康检查

**GET** `/api/health`

检查服务是否正常运行。

**响应示例：**
```json
{
    "status": "healthy",
    "model_loaded": true,
    "message": "SAM交互式分割API服务正常运行"
}
```

### 2. 加载图像

**POST** `/api/load_image`

加载图像并设置SAM预测器。

**请求参数：**
```json
{
    "image": "base64编码的图片数据",
    "max_size": 1024,
    "quality": 85
}
```

**参数说明：**
- `image`: base64编码的图片数据（必需）
- `max_size`: 图片最大尺寸，超过此尺寸会被压缩（可选，默认1024）
- `quality`: JPEG压缩质量，50-100（可选，默认85）

**响应示例：**
```json
{
    "success": true,
    "message": "图像已加载并压缩，尺寸: 1024x768",
    "image_size": {
        "width": 1024,
        "height": 768
    }
}
```

### 3. 执行分割

**POST** `/api/segment`

基于点击坐标执行交互式分割。SAM会生成3个掩码选项，自动选择质量最高的掩码返回。

**请求参数：**
```json
{
    "x": 100,
    "y": 150,
    "point_type": "foreground"
}
```

**必需参数：**
- `x`: 点击的X坐标
- `y`: 点击的Y坐标
- `point_type`: 点击类型，"foreground"（前景点）或"background"（背景点）

**说明：**
- 当前版本固定返回二值图像（binary=true）
- 自动选择3个掩码中质量最高的一个

**响应示例：**
```json
{
    "success": true,
    "message": "分割完成 - 正点(红色): 2个, 负点(蓝色): 1个",
    "mask": "base64编码的纯蒙版图片",
    "points": {
        "foreground_count": 2,
        "background_count": 1,
        "total_count": 3
    }
}
```

### 4. 清除点击点

**POST** `/api/clear_points`

清除所有已添加的点击点。

**响应示例：**
```json
{
    "success": true,
    "message": "已清除所有点击点"
}
```

### 5. 获取状态

**GET** `/api/status`

获取当前服务状态，包括图像加载状态和点击点统计。

**响应示例：**
```json
{
    "success": true,
    "image_loaded": true,
    "points_count": 3,
    "foreground_count": 2,
    "background_count": 1,
    "image_size": {
        "width": 1024,
        "height": 768
    }
}
```

## 使用流程

### 1. 启动服务
```bash
python app.py
```

### 2. 加载图像
```bash
curl -X POST http://localhost:8801/api/load_image \
  -H "Content-Type: application/json" \
  -d '{
    "image": "base64编码的图片数据",
    "max_size": 1024,
    "quality": 85
  }'
```

### 3. 执行分割
```bash
curl -X POST http://localhost:8801/api/segment \
  -H "Content-Type: application/json" \
  -d '{
    "x": 100,
    "y": 150,
    "point_type": "foreground"
  }'
```

## 错误处理

所有API都会返回适当的HTTP状态码：

- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

错误响应格式：
```json
{
    "error": "错误描述信息"
}
```

## 技术特点

### 图片压缩
- 自动压缩大图片到指定尺寸
- 使用高质量LANCZOS重采样算法
- 支持JPEG质量调节

### 交互式分割
- 支持正点（前景）和负点（背景）
- 多点分割支持
- 实时可视化点击标记
- 返回纯蒙版，前端叠加显示
- 自动选择3个掩码中质量最高的一个

### 性能优化
- 模型只加载一次
- 图片压缩减少内存占用
- 支持1024px默认尺寸（平衡速度和质量）

## 注意事项

1. 首次启动时会加载SAM模型，可能需要一些时间
2. 建议使用1024px作为最大尺寸，平衡速度和质量
3. 图片压缩质量建议设置为85%，平衡文件大小和质量
4. 服务支持跨域请求，可以从前端页面调用 