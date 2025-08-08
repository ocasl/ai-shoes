/**
 * 简单的COCO RLE解码器
 * 专门用于解码COCO格式的RLE掩码
 */

/**
 * 解码COCO格式的RLE (Run Length Encoding)
 * @param rleObj COCO RLE对象，包含counts和size属性
 * @returns 解码后的二维布尔数组
 */
export function decodeRLE(rleObj: { counts: string; size: [number, number] }): boolean[][] {
  const h = rleObj.size[0];
  const w = rleObj.size[1];
  const counts = rleObj.counts;
  
  // 创建输出数组
  const mask: boolean[][] = [];
  for (let i = 0; i < h; i++) {
    mask.push(new Array(w).fill(false));
  }
  
  // 解析RLE编码
  let pos = 0;
  let x = 0;
  let y = 0;
  let val = false; // 从背景开始
  
  // 解析counts字符串
  for (let i = 0; i < counts.length; i++) {
    let count = 0;
    let char = counts[i];
    
    // 处理数字
    while (char >= '0' && char <= '9') {
      count = count * 10 + parseInt(char);
      i++;
      if (i < counts.length) {
        char = counts[i];
      } else {
        break;
      }
    }
    
    // 填充mask
    for (let j = 0; j < count; j++) {
      // 如果在有效范围内，设置像素值
      if (y < h && x < w) {
        mask[y][x] = val;
      }
      
      // 移动到下一个位置 (行优先)
      pos++;
      x = pos % w;
      y = Math.floor(pos / w);
      
      // 防止超出边界
      if (y >= h) break;
    }
    
    // 切换值 (false->true, true->false)
    val = !val;
  }
  
  return mask;
}

/**
 * 将掩码转换为图像数据URL
 * @param mask 二维布尔数组掩码
 * @returns 图像数据URL
 */
export function maskToImageDataUrl(mask: boolean[][]): string {
  const h = mask.length;
  const w = mask[0].length;
  
  // 创建canvas
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建canvas上下文');
  }
  
  // 创建图像数据
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  
  // 填充图像数据 - 使用更明显的颜色和更高的不透明度
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (mask[y][x]) {
        // 掩码区域 - 使用更鲜艳的蓝色，完全不透明
        data[idx] = 0;       // R
        data[idx + 1] = 150; // G
        data[idx + 2] = 255; // B
        data[idx + 3] = 255; // A (完全不透明)
      } else {
        // 背景区域 - 完全透明
        data[idx] = 0;      // R
        data[idx + 1] = 0;  // G
        data[idx + 2] = 0;  // B
        data[idx + 3] = 0;  // A (完全透明)
      }
    }
  }
  
  // 将图像数据绘制到canvas
  ctx.putImageData(imageData, 0, 0);
  
  // 返回数据URL
  return canvas.toDataURL('image/png');
} 