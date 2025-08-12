/**
 * 蒙版尺寸验证功能测试
 * 用于验证图生图功能中蒙版图片和原图尺寸匹配的功能
 */

import { MaskUploadUtils } from './maskUtils';

/**
 * 创建测试用的Canvas
 */
function createTestCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 绘制一些测试内容
    ctx.fillStyle = 'white';
    ctx.fillRect(50, 50, 100, 100);
  }
  
  return canvas;
}

/**
 * 创建测试用的图片URL
 */
function createTestImageUrl(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 绘制测试图片
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#333';
    ctx.fillRect(10, 10, width - 20, height - 20);
  }
  
  return canvas.toDataURL('image/png');
}

/**
 * 测试蒙版尺寸验证功能
 */
export async function testMaskSizeValidation() {
  console.log('🧪 开始测试蒙版尺寸验证功能...');
  
  try {
    // 测试1: 尺寸匹配的情况
    console.log('\n📋 测试1: 尺寸匹配');
    const matchingMaskCanvas = createTestCanvas(800, 600);
    const matchingImageUrl = createTestImageUrl(800, 600);
    
    const result1 = await MaskUploadUtils.validateMaskSize(matchingMaskCanvas, matchingImageUrl);
    console.log('结果:', result1);
    console.log(result1.isValid ? '✅ 通过' : '❌ 失败');
    
    // 测试2: 尺寸不匹配的情况
    console.log('\n📋 测试2: 尺寸不匹配');
    const mismatchMaskCanvas = createTestCanvas(640, 480);
    const mismatchImageUrl = createTestImageUrl(1024, 768);
    
    const result2 = await MaskUploadUtils.validateMaskSize(mismatchMaskCanvas, mismatchImageUrl);
    console.log('结果:', result2);
    console.log(result2.isValid ? '✅ 通过' : '❌ 失败（预期）');
    
    // 测试3: 自动调整尺寸
    console.log('\n📋 测试3: 自动调整尺寸');
    const originalCanvas = createTestCanvas(400, 300);
    const resizedCanvas = MaskUploadUtils.resizeMaskToMatch(originalCanvas, 800, 600);
    
    console.log(`原始尺寸: ${originalCanvas.width}x${originalCanvas.height}`);
    console.log(`调整后尺寸: ${resizedCanvas.width}x${resizedCanvas.height}`);
    console.log(resizedCanvas.width === 800 && resizedCanvas.height === 600 ? '✅ 通过' : '❌ 失败');
    
    console.log('\n🎉 蒙版尺寸验证功能测试完成！');
    
    return {
      test1: result1.isValid,
      test2: !result2.isValid, // 预期失败
      test3: resizedCanvas.width === 800 && resizedCanvas.height === 600
    };
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    return {
      test1: false,
      test2: false,
      test3: false,
      error: error.message
    };
  }
}

/**
 * 在浏览器控制台中运行测试
 * 使用方法：在浏览器控制台中输入 window.testMaskValidation()
 */
if (typeof window !== 'undefined') {
  (window as any).testMaskValidation = testMaskSizeValidation;
  console.log('💡 提示: 在浏览器控制台中输入 window.testMaskValidation() 来运行测试');
}

/**
 * 验证ComfyUI兼容性的模拟测试
 */
export function simulateComfyUICompatibility(originalSize: {width: number, height: number}, maskSize: {width: number, height: number}): boolean {
  // 模拟ComfyUI的尺寸检查逻辑
  const isCompatible = originalSize.width === maskSize.width && originalSize.height === maskSize.height;
  
  console.log('🤖 ComfyUI兼容性检查:');
  console.log(`原图尺寸: ${originalSize.width}x${originalSize.height}`);
  console.log(`蒙版尺寸: ${maskSize.width}x${maskSize.height}`);
  console.log(`兼容性: ${isCompatible ? '✅ 兼容' : '❌ 不兼容'}`);
  
  if (!isCompatible) {
    console.warn('⚠️ 警告: 尺寸不匹配可能导致ComfyUI调用失败！');
  }
  
  return isCompatible;
}

// 导出测试函数供其他模块使用
export default {
  testMaskSizeValidation,
  simulateComfyUICompatibility
};