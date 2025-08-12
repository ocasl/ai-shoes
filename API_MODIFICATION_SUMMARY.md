# 图生图接口修改总结

## 修改内容

### 1. 接口返回值修改
- **修改前**: 所有图生图接口返回包含 `promptId`, `clientId`, `server`, `viewUrls` 等字段的复杂对象
- **修改后**: 所有图生图接口直接返回 `taskId` 字符串

### 2. WebSocket连接参数修改
- **修改前**: `startAiTaskWs(clientId, server, promptId, taskType)`
- **修改后**: `startAiTaskWs(taskId, taskType)`

### 3. 请求等待结果修改
- **修改前**: 查询接口使用 `promptId` 和 `server` 参数：`/api/image/request?pi=${promptId}&server=${server}`
- **修改后**: 查询接口只使用 `taskId` 参数：`/api/image/request?taskId=${taskId}`

## 修改的文件

### API接口文件 (ai-shoes-main/src/api/file.ts)
- 修改了所有响应接口类型，将 `promptId`, `viewUrls` 改为 `taskId`
- 修改了所有API函数，移除了 `processResponseUrls` 处理，直接返回包含 `taskId` 的响应

### WebSocket任务处理文件 (ai-shoes-main/src/utils/wsTask.ts)
- 修改了 `startAiTaskWs` 函数签名，从 `(clientId, server, promptId, taskType)` 改为 `(taskId, taskType)`
- 修改了WebSocket连接URL，从使用 `clientId` 和 `server` 改为使用 `taskId`
- 修改了查询图片的URL，从使用 `promptId` 和 `server` 改为使用 `taskId`
- 修改了 `manuallyQueryImages` 函数，移除了 `promptId` 和 `server` 参数

### 状态管理文件 (ai-shoes-main/src/store/index.ts)
- 修改了 `AiTaskState` 接口，移除了 `promptId`, `clientId`, `server` 字段，只保留 `taskId`
- 修改了 `setAiTaskInfo` 方法，从接收多个参数改为只接收 `taskId`
- 修改了 `resetAiTask` 方法，移除了旧字段的重置

### 组件文件

#### 设计组件 (ai-shoes-main/src/components/design/)
- **StyleFusion.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **StyleExtension.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式  
- **PartialModify.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **TextDesign.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **SoleFusion.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **ImageWorkspace.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式

#### AI工具组件 (ai-shoes-main/src/components/ai-tools/)
- **WatermarkRemove.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **LineArt.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **ImageRestore.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **HDEnhance.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **ElementRemove.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式
- **AIImageSwap.vue**: 修改了WebSocket启动逻辑，使用新的 `taskId` 格式

## 接口对接变化

### 后端需要配合的修改
1. **接口返回值**: 所有图生图接口需要返回格式：
   ```json
   {
     "code": 200,
     "msg": "success", 
     "data": {
       "taskId": "task_12345"
     }
   }
   ```

2. **WebSocket连接**: WebSocket服务需要支持新的连接格式：
   ```
   ws://domain/ws?taskId=task_12345&token=xxx
   ```

3. **查询接口**: 查询结果接口需要支持新的参数格式：
   ```
   GET /api/image/request?taskId=task_12345
   ```

## 优势
1. **简化接口**: 接口返回值更简洁，只返回必要的 `taskId`
2. **统一参数**: WebSocket和查询都使用统一的 `taskId` 参数
3. **易于维护**: 减少了参数传递的复杂性，降低了出错概率
4. **更好的扩展性**: 基于 `taskId` 的设计更容易扩展和维护

## 测试建议
1. 测试所有图生图接口是否正确返回 `taskId`
2. 测试WebSocket连接是否能正确使用 `taskId` 参数
3. 测试查询接口是否能正确使用 `taskId` 获取结果
4. 测试各个组件的生成功能是否正常工作