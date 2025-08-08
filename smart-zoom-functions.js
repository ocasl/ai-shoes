// 智能缩放功能的实现

// 计算智能缩放比例
const calculateSmartZoom = (naturalWidth, naturalHeight, targetSize = 900) => {
  console.log('计算智能缩放:', { naturalWidth, naturalHeight, targetSize });
  
  // 如果图片已经足够大，不需要放大
  if (naturalWidth >= targetSize && naturalHeight >= targetSize) {
    return 1.0;
  }
  
  // 计算需要放大的比例，以较小的边为准
  const scaleX = targetSize / naturalWidth;
  const scaleY = targetSize / naturalHeight;
  
  // 选择较小的缩放比例，确保图片不会超出目标尺寸
  const scale = Math.min(scaleX, scaleY);
  
  // 限制最大放大倍数为3倍
  return Math.min(scale, 3.0);
};

// 缩放函数
const zoomIn = () => {
  if (currentZoom.value < maxZoom) {
    currentZoom.value = Math.min(currentZoom.value + zoomStep, maxZoom);
    applyZoom();
  }
};

const zoomOut = () => {
  if (currentZoom.value > minZoom) {
    currentZoom.value = Math.max(currentZoom.value - zoomStep, minZoom);
    applyZoom();
  }
};

const resetZoom = () => {
  const img = imageRef.value;
  if (!img) return;
  
  // 重置为智能缩放比例
  currentZoom.value = calculateSmartZoom(img.naturalWidth, img.naturalHeight);
  applyZoom();
};

// 应用缩放
const applyZoom = () => {
  const img = imageRef.value;
  if (!img) return;
  
  console.log('应用缩放:', currentZoom.value);
  
  // 更新图片的transform样式
  img.style.transform = `scale(${currentZoom.value})`;
  img.style.transformOrigin = 'center center';
  
  // 重新调整Canvas位置和尺寸
  setTimeout(() => {
    adjustCanvas();
    
    // 如果有高亮的蒙版，重新绘制
    if (highlightedMasks.value.length > 0) {
      redrawMasksWithHighlight();
    }
  }, 100);
};

// 在图片加载时设置初始缩放
const setInitialZoom = () => {
  const img = imageRef.value;
  if (!img) return;
  
  // 计算智能缩放比例
  const smartZoom = calculateSmartZoom(img.naturalWidth, img.naturalHeight);
  currentZoom.value = smartZoom;
  
  console.log('设置初始缩放:', {
    naturalSize: `${img.naturalWidth}x${img.naturalHeight}`,
    smartZoom: smartZoom,
    finalZoom: currentZoom.value
  });
  
  // 应用缩放
  applyZoom();
};

export {
  calculateSmartZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  applyZoom,
  setInitialZoom
};