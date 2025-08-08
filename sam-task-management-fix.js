// SAM任务管理修复方案
// 解决"请先加载图片"的400错误

class SAMTaskManager {
  constructor() {
    this.currentTaskId = null;
    this.isImageLoaded = false;
    this.imageData = null;
    this.scaleRatio = 1.0;
    this.apiBase = 'http://js1.blockelite.cn:34965/api';
    this.taskTimeout = 30000; // 30秒超时
  }

  // 检查任务状态
  async checkTaskStatus(taskId) {
    try {
      const response = await fetch(`${this.apiBase}/status?taskId=${taskId}`);
      const result = await response.json();
      
      console.log('🔍 任务状态检查:', { taskId, result });
      
      return {
        exists: result.success,
        hasImage: result.has_image || false,
        pointCount: result.point_count || 0
      };
    } catch (error) {
      console.error('❌ 任务状态检查失败:', error);
      return { exists: false, hasImage: false, pointCount: 0 };
    }
  }

  // 安全的图片加载到SAM
  async loadImageToSAM(imageUrl, forceReload = false) {
    try {
      console.log('🚀 开始加载图片到SAM:', { imageUrl, forceReload, currentTaskId: this.currentTaskId });

      // 如果已有任务且不强制重新加载，先检查任务状态
      if (this.currentTaskId && !forceReload) {
        const status = await this.checkTaskStatus(this.currentTaskId);
        if (status.exists && status.hasImage) {
          console.log('✅ 任务已存在且图片已加载，跳过重复加载');
          this.isImageLoaded = true;
          return {
            success: true,
            taskId: this.currentTaskId,
            scaleRatio: this.scaleRatio,
            fromCache: true
          };
        } else {
          console.log('⚠️ 任务状态异常，需要重新加载:', status);
          // 清理无效任务
          await this.finishCurrentTask();
        }
      }

      // 转换图片为Base64
      const base64Data = await this.imageToBase64(imageUrl);
      
      // 调整图片尺寸
      const adjustedData = await this.adjustImageForSAM(base64Data);
      this.scaleRatio = adjustedData.scaleRatio;
      this.imageData = adjustedData;

      // 上传到SAM服务
      console.log('📤 上传图片到SAM服务...');
      const response = await fetch(`${this.apiBase}/load_image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: adjustedData.base64,
          max_size: 1024,
          quality: 85
        }),
        signal: AbortSignal.timeout(this.taskTimeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        this.currentTaskId = result.taskId;
        this.isImageLoaded = true;
        
        console.log('✅ 图片成功加载到SAM:', {
          taskId: this.currentTaskId,
          imageSize: result.image_size,
          scaleRatio: this.scaleRatio
        });

        return {
          success: true,
          taskId: this.currentTaskId,
          imageSize: result.image_size,
          scaleRatio: this.scaleRatio,
          fromCache: false
        };
      } else {
        throw new Error(result.error || '图片加载失败');
      }

    } catch (error) {
      console.error('❌ 图片加载到SAM失败:', error);
      this.isImageLoaded = false;
      this.currentTaskId = null;
      throw error;
    }
  }

  // 安全的分割执行
  async performSegmentation(x, y, pointType) {
    try {
      console.log('✂️ 开始执行分割:', { x, y, pointType, taskId: this.currentTaskId });

      // 检查任务状态
      if (!this.currentTaskId) {
        throw new Error('没有活跃的任务，请先加载图片');
      }

      if (!this.isImageLoaded) {
        throw new Error('图片未加载，请先加载图片');
      }

      // 双重检查：验证任务在服务器端是否仍然有效
      const status = await this.checkTaskStatus(this.currentTaskId);
      if (!status.exists || !status.hasImage) {
        console.warn('⚠️ 服务器端任务状态异常，尝试重新加载图片');
        
        // 如果有缓存的图片数据，尝试重新加载
        if (this.imageData) {
          await this.loadImageToSAM(this.imageData.originalUrl, true);
        } else {
          throw new Error('任务已失效且无法恢复，请重新开始');
        }
      }

      // 执行分割
      const response = await fetch(`${this.apiBase}/segment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x: x,
          y: y,
          point_type: pointType,
          taskId: this.currentTaskId
        }),
        signal: AbortSignal.timeout(this.taskTimeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ 分割请求HTTP错误:', response.status, errorText);
        
        // 特殊处理"请先加载图片"错误
        if (errorText.includes('请先加载图像') || 
            errorText.includes('An image must be set') ||
            response.status === 400) {
          console.log('🔄 检测到图片未加载错误，尝试自动恢复...');
          
          // 尝试重新加载图片
          if (this.imageData && this.imageData.originalUrl) {
            await this.loadImageToSAM(this.imageData.originalUrl, true);
            
            // 重试分割
            return await this.performSegmentation(x, y, pointType);
          } else {
            throw new Error('图片已失效，请重新上传图片');
          }
        }
        
        throw new Error(`分割请求失败: HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 分割执行成功:', result);
        return {
          success: true,
          mask: result.mask,
          points: result.points
        };
      } else {
        throw new Error(result.error || '分割失败');
      }

    } catch (error) {
      console.error('❌ 分割执行失败:', error);
      throw error;
    }
  }

  // 清除点击点
  async clearPoints() {
    if (!this.currentTaskId) {
      console.log('⚠️ 没有活跃任务，跳过清除点击点');
      return { success: true };
    }

    try {
      const response = await fetch(`${this.apiBase}/clear_points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: this.currentTaskId
        })
      });

      const result = await response.json();
      console.log('🧹 清除点击点结果:', result);
      
      return result;
    } catch (error) {
      console.error('❌ 清除点击点失败:', error);
      throw error;
    }
  }

  // 结束当前任务
  async finishCurrentTask() {
    if (!this.currentTaskId) {
      console.log('⚠️ 没有活跃任务需要结束');
      return { success: true };
    }

    try {
      console.log('🏁 结束任务:', this.currentTaskId);
      
      const response = await fetch(`${this.apiBase}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: this.currentTaskId
        })
      });

      const result = await response.json();
      console.log('🏁 任务结束结果:', result);

      // 清理本地状态
      this.currentTaskId = null;
      this.isImageLoaded = false;
      this.imageData = null;
      this.scaleRatio = 1.0;

      return result;
    } catch (error) {
      console.error('❌ 结束任务失败:', error);
      // 即使结束失败，也要清理本地状态
      this.currentTaskId = null;
      this.isImageLoaded = false;
      this.imageData = null;
      this.scaleRatio = 1.0;
      throw error;
    }
  }

  // 获取当前任务信息
  getCurrentTaskInfo() {
    return {
      taskId: this.currentTaskId,
      isImageLoaded: this.isImageLoaded,
      scaleRatio: this.scaleRatio,
      hasImageData: !!this.imageData
    };
  }

  // 辅助方法：图片转Base64
  async imageToBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        resolve(base64);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }

  // 辅助方法：调整图片尺寸
  async adjustImageForSAM(base64Data) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const { width: originalWidth, height: originalHeight } = img;
        let targetWidth, targetHeight, scaleRatio;
        
        // 按照你的需求调整尺寸
        if (originalWidth < 1024 || originalHeight < 1024) {
          const minSide = Math.min(originalWidth, originalHeight);
          scaleRatio = 1024 / minSide;
          targetWidth = Math.round(originalWidth * scaleRatio);
          targetHeight = Math.round(originalHeight * scaleRatio);
        } else if (originalWidth > 1024 || originalHeight > 1024) {
          const maxSide = Math.max(originalWidth, originalHeight);
          scaleRatio = 1024 / maxSide;
          targetWidth = Math.round(originalWidth * scaleRatio);
          targetHeight = Math.round(originalHeight * scaleRatio);
        } else {
          scaleRatio = 1.0;
          targetWidth = originalWidth;
          targetHeight = originalHeight;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        
        const adjustedBase64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        
        resolve({
          base64: adjustedBase64,
          scaleRatio: scaleRatio,
          originalSize: { width: originalWidth, height: originalHeight },
          adjustedSize: { width: targetWidth, height: targetHeight }
        });
      };
      img.src = 'data:image/jpeg;base64,' + base64Data;
    });
  }
}

// 创建全局实例
const samTaskManager = new SAMTaskManager();

// 导出使用接口
export const useSAMTask = () => {
  return {
    // 加载图片到SAM
    loadImage: (imageUrl, forceReload = false) => samTaskManager.loadImageToSAM(imageUrl, forceReload),
    
    // 执行分割
    segment: (x, y, pointType) => samTaskManager.performSegmentation(x, y, pointType),
    
    // 清除点击点
    clearPoints: () => samTaskManager.clearPoints(),
    
    // 结束任务
    finishTask: () => samTaskManager.finishCurrentTask(),
    
    // 获取任务信息
    getTaskInfo: () => samTaskManager.getCurrentTaskInfo(),
    
    // 检查任务状态
    checkStatus: (taskId) => samTaskManager.checkTaskStatus(taskId)
  };
};

export default samTaskManager;