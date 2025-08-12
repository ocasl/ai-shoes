# 蒙版尺寸验证功能实现总结

## 问题背景
在AI鞋款设计系统中，图生图功能需要调用ComfyUI进行图像处理。**蒙版图片和原图必须大小相等才可以调用ComfyUI**，否则会导致：
- ComfyUI调用失败
- 图像处理结果异常
- 蒙版区域定位错误

## 解决方案

### 1. 核心工具类：MaskUploadUtils

位置：`src/utils/maskUtils.ts`

#### 新增功能：
- **尺寸验证**：`validateMaskSize()` - 验证蒙版与原图尺寸是否匹配
- **智能调整**：`resizeMaskToMatch()` - 自动调整蒙版尺寸以匹配原图
- **智能上传**：`uploadMaskCanvasWithValidation()` - 带验证的蒙版上传

#### 关键特性：
```typescript
// 自动验证和调整蒙版尺寸
const maskId = await MaskUploadUtils.uploadMaskCanvasWithValidation(
  maskCanvas,           // 用户绘制的蒙版canvas
  originalImageId,      // 原图ID
  originalImageUrl,     // 原图URL（用于获取尺寸）
  true                  // 自动调整尺寸
);
```

### 2. 验证结果接口

```typescript
interface MaskSizeValidationResult {
  isValid: boolean;                           // 尺寸是否匹配
  originalSize: { width: number; height: number }; // 原图尺寸
  maskSize: { width: number; height: number };     // 蒙版尺寸
  needsResize: boolean;                       // 是否需要调整尺寸
  errorMessage?: string;                      // 错误信息
}
```

### 3. 集成到ImageWorkspace组件

位置：`src/components/design/ImageWorkspace.vue`

#### 更新内容：
- 在`confirmMask()`方法中集成了新的验证工具
- 自动验证蒙版尺寸并在需要时调整
- 提供详细的日志记录和错误处理

#### 关键改进：
```typescript
// 使用增强版蒙版上传工具，确保尺寸匹配
const maskId = await MaskUploadUtils.uploadMaskCanvasWithValidation(
  aiMaskCanvas,
  maskImageId,
  currentImageUrl,
  true // 自动调整尺寸
);
```

## 使用方法

### 基本用法（推荐）
```typescript
import { MaskUploadUtils } from '../utils/maskUtils';

try {
  const maskId = await MaskUploadUtils.uploadMaskCanvasWithValidation(
    maskCanvas,           // 用户绘制的蒙版canvas
    originalImageId,      // 原图ID
    originalImageUrl,     // 原图URL（用于获取尺寸）
    true                  // 自动调整尺寸（默认true）
  );
  
  console.log('蒙版上传成功，ID:', maskId);
} catch (error) {
  console.error('蒙版上传失败:', error.message);
}
```

### 仅验证尺寸
```typescript
const validation = await MaskUploadUtils.validateMaskSize(maskCanvas, originalImageUrl);

if (!validation.isValid) {
  console.log('尺寸不匹配:', validation.errorMessage);
  
  if (validation.needsResize) {
    // 手动调整尺寸
    const resizedCanvas = MaskUploadUtils.resizeMaskToMatch(
      maskCanvas,
      validation.originalSize.width,
      validation.originalSize.height
    );
  }
}
```

## 验证流程

1. **获取原图尺寸**：通过原图URL加载图片并获取自然尺寸
2. **比较尺寸**：对比蒙版canvas尺寸与原图尺寸
3. **自动调整**：如果尺寸不匹配且启用自动调整，创建新的匹配尺寸的canvas
4. **上传蒙版**：使用调整后的canvas上传蒙版
5. **反馈结果**：返回上传后的图片ID和相关信息

## 日志记录

系统会自动记录验证过程：
```
🔍 蒙版尺寸验证: {
  原图尺寸: { width: 1024, height: 768 },
  蒙版尺寸: { width: 800, height: 600 },
  尺寸匹配: false,
  需要调整: true
}

⚠️ 蒙版尺寸不匹配，正在自动调整...
🔧 蒙版尺寸调整: 800x600 → 1024x768
✅ 蒙版尺寸已自动调整为与原图一致
```

## 错误处理

- **无法获取原图尺寸**：记录警告但不阻止上传
- **尺寸不匹配且禁用自动调整**：抛出错误并提示用户
- **Canvas操作失败**：提供详细错误信息
- **网络上传失败**：回退到本地处理

## 兼容性

- **向后兼容**：保留原有的`uploadMaskCanvas()`方法
- **渐进增强**：新功能不影响现有代码
- **可选验证**：可以选择是否启用自动调整

## 示例代码

完整的使用示例请参考：`src/examples/MaskSizeValidationExample.vue`

## 最佳实践

1. **总是使用验证版本**：优先使用`uploadMaskCanvasWithValidation()`
2. **提供原图URL**：确保验证的准确性
3. **启用自动调整**：让系统自动处理尺寸不匹配问题
4. **处理错误**：捕获并适当处理可能的验证错误
5. **查看日志**：利用详细的日志信息进行调试

## 技术细节

- **尺寸获取**：使用Image对象的naturalWidth/naturalHeight
- **Canvas调整**：使用drawImage进行智能缩放
- **跨域处理**：设置crossOrigin='anonymous'
- **内存管理**：及时清理临时创建的canvas对象

## 测试验证

系统已在以下场景下测试：
- ✅ 尺寸完全匹配的蒙版
- ✅ 需要放大的蒙版
- ✅ 需要缩小的蒙版
- ✅ 跨域图片处理
- ✅ 网络错误处理
- ✅ Canvas操作异常处理

通过这个实现，确保了**图生图功能中蒙版图片和原图大小相等**，满足了ComfyUI的调用要求。