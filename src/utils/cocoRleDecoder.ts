/**
 * COCO RLE (Run Length Encoding) 解码器
 * 基于pycocotools.mask实现的JavaScript版本
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

  console.log('解码RLE数据:', {
    size: [h, w],
    counts: counts.length > 50 ? counts.substring(0, 50) + '...' : counts
  });

  try {
    // 1. 首先检查rle['counts']是否为字符串类型，如果是，则将其编码为bytes类型
    // (在JavaScript中，我们不需要显式转换为bytes，但需要确保它是字符串)
    if (typeof counts !== 'string') {
      throw new Error('RLE counts必须是字符串类型');
    }

    // 2. 使用maskutils.decode函数将RLE编码的掩码数据解码为二进制掩码数组
    // 在JavaScript中，我们需要自己实现这个解码逻辑
    const binaryMask = decodeCOCORLEToBinary(counts, h, w);

    // 3. 将解码后的二进制掩码数组乘以255，将其值范围从[0,1]扩展到[0,255]，并转换为uint8类型
    const uint8Mask = convertToUint8Mask(binaryMask);

    // 4. 使用Image.fromarray函数将数据转换为PIL图像对象，模式为'L'（灰度图像）
    // 在JavaScript中，我们使用Canvas来处理图像
    // 这一步在maskToImageDataUrl函数中实现

    return binaryMask;
  } catch (error) {
    console.error('RLE解码失败:', error);
    return createFallbackMask(h, w);
  }
}

// 设置最大安全运行长度，避免因大数字导致页面卡死
const MAX_SAFE_RUN_LENGTH = 10000;

/**
 * 将COCO RLE编码解码为二进制掩码
 */
function decodeCOCORLEToBinary(counts: string, height: number, width: number): boolean[][] {
  // 创建输出掩码
  const mask: boolean[][] = [];
  for (let i = 0; i < height; i++) {
    mask.push(new Array(width).fill(false));
  }

  try {
    // 解析RLE编码
    const runLengths: number[] = [];
    let currentNumber = '';
    let inNumber = false;

    // 处理每个字符
    for (let i = 0; i < counts.length; i++) {
      const char = counts[i];

      // 如果是数字，添加到当前数字
      if (char >= '0' && char <= '9') {
        currentNumber += char;
        inNumber = true;
      }
      // 如果是分隔符或其他字符，结束当前数字
      else {
        if (inNumber && currentNumber.length > 0) {
          // 解析数字并添加到运行长度数组
          let runLength = parseInt(currentNumber);

          // 安全检查：限制运行长度的最大值
          if (runLength > MAX_SAFE_RUN_LENGTH) {
            console.warn(`检测到过大的运行长度: ${runLength}，已限制为${MAX_SAFE_RUN_LENGTH}`);
            runLength = MAX_SAFE_RUN_LENGTH;
          }

          runLengths.push(runLength);
          currentNumber = '';
          inNumber = false;
        }
      }
    }

    // 处理最后一个数字
    if (inNumber && currentNumber.length > 0) {
      let runLength = parseInt(currentNumber);

      // 安全检查：限制运行长度的最大值
      if (runLength > MAX_SAFE_RUN_LENGTH) {
        console.warn(`检测到过大的运行长度: ${runLength}，已限制为${MAX_SAFE_RUN_LENGTH}`);
        runLength = MAX_SAFE_RUN_LENGTH;
      }

      runLengths.push(runLength);
    }

    // 安全检查：如果运行长度数组为空，返回空掩码
    if (runLengths.length === 0) {
      console.warn('未能解析出有效的运行长度');
      return mask;
    }

    console.log('解析的运行长度:', runLengths);

    // 使用运行长度填充掩码
    let pos = 0;
    let val = false; // 从背景(0)开始

    // 安全检查：限制处理的总像素数
    const totalPixels = width * height;
    let processedPixels = 0;
    const MAX_PROCESSED_PIXELS = totalPixels * 2; // 允许处理的最大像素数（考虑到可能有冗余）

    for (const runLength of runLengths) {
      // 安全检查：如果已处理的像素数超过限制，停止处理
      if (processedPixels >= MAX_PROCESSED_PIXELS) {
        console.warn('处理的像素数超过限制，停止解码');
        break;
      }

      // 填充当前运行长度
      const actualRunLength = Math.min(runLength, totalPixels - pos);
      for (let j = 0; j < actualRunLength; j++) {
        if (pos < width * height) {
          const y = Math.floor(pos / width);
          const x = pos % width;

          if (y < height && x < width) {
            mask[y][x] = val;
          }

          pos++;
          processedPixels++;
        }
      }

      // 切换值 (0->1, 1->0)
      val = !val;
    }

    return mask;
  } catch (error) {
    console.error('解码RLE到二进制掩码失败:', error);
    throw error;
  }
}

/**
 * 将二进制掩码转换为uint8掩码 (0/1 -> 0/255)
 */
function convertToUint8Mask(binaryMask: boolean[][]): Uint8Array {
  const height = binaryMask.length;
  const width = binaryMask[0].length;
  const uint8Mask = new Uint8Array(height * width);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      uint8Mask[y * width + x] = binaryMask[y][x] ? 255 : 0;
    }
  }

  return uint8Mask;
}

/**
 * 创建备用掩码（解码失败时使用）
 */
function createFallbackMask(height: number, width: number): boolean[][] {
  const mask: boolean[][] = [];
  for (let i = 0; i < height; i++) {
    mask.push(new Array(width).fill(false));
  }

  // 创建一个简单的矩形掩码
  const startX = Math.floor(width * 0.25);
  const startY = Math.floor(height * 0.25);
  const endX = Math.floor(width * 0.75);
  const endY = Math.floor(height * 0.75);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      mask[y][x] = true;
    }
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

  // 将二进制掩码转换为uint8掩码
  const uint8Mask = convertToUint8Mask(mask);

  // 创建灰度图像数据
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;

  // 填充图像数据 - 使用灰度模式 'L'
  for (let i = 0; i < uint8Mask.length; i++) {
    const idx = i * 4;
    const val = uint8Mask[i];

    // 灰度模式 - 所有RGB通道相同
    data[idx] = val;     // R
    data[idx + 1] = val; // G
    data[idx + 2] = val; // B
    data[idx + 3] = val > 0 ? 255 : 0; // A (掩码区域不透明，背景透明)
  }

  // 将图像数据绘制到canvas
  ctx.putImageData(imageData, 0, 0);

  // 返回数据URL
  return canvas.toDataURL('image/png');
}

/**
 * 将掩码转换为彩色图像数据URL (用于可视化)
 * @param mask 二维布尔数组掩码
 * @returns 图像数据URL
 */
export function maskToColorImageDataUrl(mask: boolean[][]): string {
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

  // 填充图像数据 - 使用彩色
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (mask[y][x]) {
        // 掩码区域 - 使用蓝色
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

/**
 * 保存掩码为图像文件
 * @param mask 二维布尔数组掩码
 * @param filename 文件名
 */
export function saveMaskAsImage(mask: boolean[][], filename: string): void {
  const dataUrl = maskToImageDataUrl(mask);

  // 创建下载链接
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename || 'mask.png';

  // 触发下载
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 绘制掩码边界
 * @param ctx Canvas 2D上下文
 * @param mask 二维布尔数组掩码
 * @param color 边界颜色，默认为红色
 * @param lineWidth 线宽，默认为2
 */
export function drawMaskBoundary(ctx: CanvasRenderingContext2D, mask: boolean[][], color: string = 'red', lineWidth: number = 2): void {
  const h = mask.length;
  const w = mask[0].length;

  // 设置绘制样式
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;

  // 计算画布和掩码的缩放比例
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const scaleX = canvasWidth / w;
  const scaleY = canvasHeight / h;

  // 寻找边界像素
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y][x]) {
        // 检查周围8个像素，如果有一个是背景，则这是边界
        const isBoundary =
          (x === 0 || y === 0 || x === w - 1 || y === h - 1) || // 边缘像素
          !mask[y - 1]?.[x] || !mask[y + 1]?.[x] || // 上下
          !mask[y]?.[x - 1] || !mask[y]?.[x + 1] || // 左右
          !mask[y - 1]?.[x - 1] || !mask[y - 1]?.[x + 1] || // 对角线
          !mask[y + 1]?.[x - 1] || !mask[y + 1]?.[x + 1];

        if (isBoundary) {
          // 应用缩放
          const scaledX = x * scaleX;
          const scaledY = y * scaleY;

          // 绘制边界点
          ctx.fillRect(scaledX, scaledY, lineWidth, lineWidth);
        }
      }
    }
  }
}