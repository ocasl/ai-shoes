# 蒙版尺寸验证使用指南

## 重要提示
**图生图功能中蒙版图片和原图必须大小相等才可以调用ComfyUI**

## 问题背景
在使用ComfyUI进行图生图处理时，如果蒙版图片和原图的尺寸不匹配，会导致以下问题：
- ComfyUI调用失败
- 图像处理结果异常
- 蒙版区域定位错误

## 解决方案
使用 `MaskUploadUtils.uploadMaskCanvasWithValidation()` 方法，它会：
1. 自动验证蒙版尺寸是否与原图匹配
2. 如果尺寸不匹配，自动调整蒙版尺寸
3. 确保上传的蒙版与原图尺寸完全一致

## 使用方法

### 1. 基本用法（推荐）
```typescript
import { MaskUploadUtils } from '../utils/maskUtils';

// 在需要上传蒙版的地方
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

### 2. 仅验证尺寸（不上传）
```typescript
// 仅验证蒙版尺寸是否匹配
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

### 3. 在Vue组件中的使用示例
```vue
<script setup lang="ts">
import { MaskUploadUtils } from '../utils/maskUtils';

const handleMaskUpload = async () => {
  try {
    // 获取用户绘制的蒙版canvas
    const maskCanvas = maskCanvasRef.value;
    
    // 使用智能上传（带验证和自动调整）
    const maskId = await MaskUploadUtils.uploadMaskCanvasWithValidation(
      maskCanvas,
      originalImageId.value,
      originalImageUrl.value
    );
    
    // 继续后续的图生图处理
    await processImageWithMask(originalImageId.value, maskId);
    
  } catch (error) {
    ElMessage.error('蒙版处理失败: ' + error.message);
  }
};
</script>
```

## 验证结果说明

`validateMaskSize()` 方法返回的结果包含：
- `isValid`: 尺寸是否匹配
- `originalSize`: 原图尺寸 `{width, height}`
- `maskSize`: 蒙版尺寸 `{width, height}`
- `needsResize`: 是否需要调整尺寸
- `errorMessage`: 错误信息（如果有）

## 最佳实践

1. **总是使用 `uploadMaskCanvasWithValidation()`**
   - 它会自动处理尺寸验证和调整
   - 确保与ComfyUI的兼容性
   - 避免因尺寸不匹配导致的调用失败

2. **提供原图URL**
   - 用于获取准确的原图尺寸
   - 确保验证的准确性
   - 支持跨域图片处理

3. **启用自动调整**
   - 默认启用 `autoResize: true`
   - 让系统自动处理尺寸不匹配问题
   - 减少用户手动操作

4. **错误处理**
   - 捕获并处理可能的验证错误
   - 向用户提供清晰的错误信息
   - 实现优雅的降级处理

5. **日志记录**
   - 工具会自动记录验证和调整过程
   - 便于调试和问题排查
   - 提供详细的操作反馈

6. **ComfyUI兼容性检查**
   - 使用 `checkComfyUICompatibility()` 进行全面检查
   - 验证尺寸、内容和格式要求
   - 确保调用成功率

7. **开发环境测试**
   - 使用 `quickTest()` 进行功能验证
   - 在开发过程中及时发现问题
   - 确保功能稳定性

## 测试验证

### 运行测试
```typescript
import { testMaskSizeValidation } from '../utils/maskSizeValidationTest';

// 运行完整测试
const testResults = await testMaskSizeValidation();
console.log('测试结果:', testResults);
```

### 浏览器控制台测试
在浏览器控制台中输入：
```javascript
window.testMaskValidation()
```

### ComfyUI兼容性检查
```typescript
import { simulateComfyUICompatibility } from '../utils/maskSizeValidationTest';

const isCompatible = simulateComfyUICompatibility(
  { width: 1024, height: 768 }, // 原图尺寸
  { width: 1024, height: 768 }  // 蒙版尺寸
);
```

## 注意事项

- 如果无法获取原图尺寸，验证会失败但不会阻止上传
- 自动调整会保持蒙版的相对位置和形状
- 调整后的蒙版质量可能会有轻微损失，但通常不影响使用
- 测试功能仅在开发环境中使用，生产环境会自动跳过