// 处理裁剪框拖动
const handleCropAreaMouseDown = (e: MouseEvent) => {
  e.preventDefault()
  isDragging.value = true
  dragStartX.value = e.clientX - cropStartX.value
  dragStartY.value = e.clientY - cropStartY.value
}

// 处理控制点拖动
const handleControlPointMouseDown = (point: string, e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  activeControlPoint.value = point
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !isCropping.value) return

  const container = cropContainerRef.value
  const image = cropImageRef.value
  if (!container || !image) return

  const containerRect = container.getBoundingClientRect()
  const imgRect = image.getBoundingClientRect()
  const minSize = 100 // 最小裁剪尺寸

  // 计算图片相对于容器的边界
  const imgOffsetX = imgRect.left - containerRect.left
  const imgOffsetY = imgRect.top - containerRect.top
  const imgMaxX = imgOffsetX + imgRect.width
  const imgMaxY = imgOffsetY + imgRect.height

  if (activeControlPoint.value) {
    // 处理控制点拖动
    const deltaX = e.clientX - dragStartX.value
    const deltaY = e.clientY - dragStartY.value

    switch (activeControlPoint.value) {
      case 'top-left':
        const newWidthTL = cropWidth.value - deltaX
        const newHeightTL = cropHeight.value - deltaY
        if (newWidthTL >= minSize && newHeightTL >= minSize) {
          cropWidth.value = Math.min(newWidthTL, cropStartX.value + cropWidth.value - imgOffsetX)
          cropHeight.value = Math.min(newHeightTL, cropStartY.value + cropHeight.value - imgOffsetY)
          cropStartX.value = Math.max(imgOffsetX, cropStartX.value + deltaX)
          cropStartY.value = Math.max(imgOffsetY, cropStartY.value + deltaY)
        }
        break
      case 'top-right':
        const newWidthTR = cropWidth.value + deltaX
        const newHeightTR = cropHeight.value - deltaY
        if (newWidthTR >= minSize && newHeightTR >= minSize) {
          cropWidth.value = Math.min(newWidthTR, imgMaxX - cropStartX.value)
          cropHeight.value = Math.min(newHeightTR, cropStartY.value + cropHeight.value - imgOffsetY)
          cropStartY.value = Math.max(imgOffsetY, cropStartY.value + deltaY)
        }
        break
      case 'bottom-left':
        const newWidthBL = cropWidth.value - deltaX
        const newHeightBL = cropHeight.value + deltaY
        if (newWidthBL >= minSize && newHeightBL >= minSize) {
          cropWidth.value = Math.min(newWidthBL, cropStartX.value + cropWidth.value - imgOffsetX)
          cropHeight.value = Math.min(newHeightBL, imgMaxY - cropStartY.value)
          cropStartX.value = Math.max(imgOffsetX, cropStartX.value + deltaX)
        }
        break
      case 'bottom-right':
        const newWidthBR = cropWidth.value + deltaX
        const newHeightBR = cropHeight.value + deltaY
        if (newWidthBR >= minSize && newHeightBR >= minSize) {
          cropWidth.value = Math.min(newWidthBR, imgMaxX - cropStartX.value)
          cropHeight.value = Math.min(newHeightBR, imgMaxY - cropStartY.value)
        }
        break
      case 'top':
        const newHeightT = cropHeight.value - deltaY
        if (newHeightT >= minSize) {
          cropHeight.value = Math.min(newHeightT, cropStartY.value + cropHeight.value - imgOffsetY)
          cropStartY.value = Math.max(imgOffsetY, cropStartY.value + deltaY)
        }
        break
      case 'right':
        const newWidthR = cropWidth.value + deltaX
        if (newWidthR >= minSize) {
          cropWidth.value = Math.min(newWidthR, imgMaxX - cropStartX.value)
        }
        break
      case 'bottom':
        const newHeightB = cropHeight.value + deltaY
        if (newHeightB >= minSize) {
          cropHeight.value = Math.min(newHeightB, imgMaxY - cropStartY.value)
        }
        break
      case 'left':
        const newWidthL = cropWidth.value - deltaX
        if (newWidthL >= minSize) {
          cropWidth.value = Math.min(newWidthL, cropStartX.value + cropWidth.value - imgOffsetX)
          cropStartX.value = Math.max(imgOffsetX, cropStartX.value + deltaX)
        }
        break
    }

    dragStartX.value = e.clientX
    dragStartY.value = e.clientY
  } else {
    // 处理整个裁剪框拖动
    const newX = e.clientX - dragStartX.value
    const newY = e.clientY - dragStartY.value

    cropStartX.value = Math.max(imgOffsetX, Math.min(newX, imgMaxX - cropWidth.value))
    cropStartY.value = Math.max(imgOffsetY, Math.min(newY, imgMaxY - cropHeight.value))
  }
}

// 处理鼠标释放
const handleMouseUp = () => {
  isDragging.value = false
  activeControlPoint.value = ''
}