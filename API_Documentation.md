# SAM分割API快速参考

## 服务信息
*: ✅ 支持

## 核心API

### 1. 加载图像
```bash
POST /api/load_image
```
```json
{
  "image": "base64图像数据",
  "max_size": 1024
}
```

### 2. 执行分割
```bash
POST /api/segment
```
```json
{
  "x": 100,
  "y": 200,
  "taskId": "task1",
  "point_type": "foreground"
}
```

### 3. 清除点击点
```bash
POST /api/clear_points
```
```json
{
  "taskId": "task1"
}
```

### 4. 获取状态
```bash
GET /api/status?taskId=task1
```

### 5. 健康检查
```bash
GET /api/health
```

## 响应格式

### 加载图像响应
```json
{
  "success": true,
  "taskId": "uuid-generated-id",
  "message": "图像已加载，尺寸: 800x600",
  "image_size": {
    "width": 800,
    "height": 600
  }
}
```

结束任务
POST /api/finish
传入值：
json
{
  "taskId": "1e6ec435-2f1e-4256-9584-4d0f71016524"
}

返回值：
{
  "cache_cleared": true,
  "gpu_memory_cleared": true,
  "message": "已结束taskId 1e6ec435-2f1e-4256-9584-4d0f71016524 的任务",
  "success": true,
  "system_memory_cleared": true,
  "task_cache_cleared": true,
  "task_id": "1e6ec435-2f1e-4256-9584-4d0f71016524"
}

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 分割响应
```json
{
  "success": true,
  "message": "分割完成",
  "mask": "base64掩码数据",
  "points": {
    "foreground_count": 2,
    "background_count": 1,
    "total_count": 3
  }
}
```

## 多客户端使用

### 使用流程
1. **加载图像** - 后端自动生成任务ID
```javascript
// 1. 加载图像，后端返回taskId
const response = await fetch('/api/load_image', {
  method: 'POST',
  body: JSON.stringify({
    image: "base64数据",
    max_size: 1024
  })
});
const { taskId } = await response.json();

// 2. 使用返回的taskId进行后续操作
await fetch('/api/segment', {
  method: 'POST',
  body: JSON.stringify({
    x: 100,
    y: 200,
    taskId: taskId,
    point_type: "foreground"
  })
});
```

### 任务隔离
- 每个图像加载会话都有唯一的UUID标识
- 不同任务的操作完全隔离
- 任务ID由后端自动生成，确保唯一性

## 错误处理

| 状态码 | 说明 |
|--------|------|
| 400 | 参数错误 |
| 500 | 服务器错误 |

## 注意事项

1. **taskId**: 每个任务使用唯一ID
2. **图像格式**: Base64编码
3. **坐标系统**: 像素坐标，左上角(0,0)
4. **数据隔离**: 不同任务数据完全独立 