<!-- 这是SoleFusion.vue的更新示例，展示如何使用新的WebSocket处理方式 -->

<script setup lang="ts">
// 导入新的AI任务助手
import { executeSoleFusion } from '@/utils/aiTaskHelper'
import { useShoeStore } from '@/store'

const shoeStore = useShoeStore()

// 鞋底换面处理函数 - 更新版本
const handleSoleFusion = async () => {
  try {
    // 获取图片ID（你现有的逻辑）
    const majorIdToUse = getCurrentMajorImageId() // 你的现有函数
    const minorIdToUse = getCurrentMinorImageId() // 你的现有函数
    
    console.log('拿到使用的图片ID:', {
      鞋面图ID: majorIdToUse,
      鞋面图来源: '本地编辑后ID',
      鞋底图ID: minorIdToUse,
      鞋底图来源: '编辑后ID',
      蒙版状态: 3
    })

    const requestData = {
      majorId: majorIdToUse,
      minorId: minorIdToUse,
      maskStates: 3
    }

    console.log("发送鞋底换面请求:", requestData)

    // 使用新的AI任务助手
    await executeSoleFusion(requestData, {
      // 进度回调
      onProgress: (progress) => {
        console.log(`鞋底换面进度: ${progress}%`)
        // 更新store中的进度
        shoeStore.setAiTaskProgress(progress)
        shoeStore.setAiTaskStatus('running')
      },
      
      // 完成回调
      onComplete: (images) => {
        console.log('鞋底换面完成，获得图片:', images)
        // 更新store中的结果
        shoeStore.setAiTaskImages(images)
        shoeStore.setAiTaskStatus('success')
        shoeStore.setAiTaskProgress(100)
        
        // 显示成功消息
        ElMessage.success('鞋底换面完成！')
        
        // 你可以在这里添加其他完成后的处理逻辑
        // 比如更新图片显示、保存结果等
      },
      
      // 错误回调
      onError: (error) => {
        console.error('鞋底换面失败:', error)
        // 更新store状态
        shoeStore.setAiTaskStatus('error')
        shoeStore.setAiTaskProgress(0)
        
        // 显示错误消息
        ElMessage.error(`鞋底换面失败: ${error.message}`)
      }
    })

  } catch (error) {
    console.error('鞋底换面请求失败:', error)
    ElMessage.error('请求失败，请重试')
  }
}

// 其他AI功能的处理函数示例
const handleAutoColor = async () => {
  const imageId = getCurrentImageId() // 你的现有函数
  
  await executeAutoColor({ majorId: imageId }, {
    onProgress: (progress) => {
      shoeStore.setAiTaskProgress(progress)
      shoeStore.setAiTaskStatus('running')
    },
    onComplete: (images) => {
      shoeStore.setAiTaskImages(images)
      shoeStore.setAiTaskStatus('success')
      ElMessage.success('自动配色完成！')
    },
    onError: (error) => {
      shoeStore.setAiTaskStatus('error')
      ElMessage.error(`自动配色失败: ${error.message}`)
    }
  })
}

// 你现有的辅助函数（保持不变）
const getCurrentMajorImageId = () => {
  // 你的现有逻辑
  return 850
}

const getCurrentMinorImageId = () => {
  // 你的现有逻辑  
  return 852
}

const getCurrentImageId = () => {
  // 你的现有逻辑
  return 850
}
</script>

<!-- 
使用说明：

1. 在你的 SoleFusion.vue 中，将原来的 handleSoleFusion 函数替换为上面的新版本

2. 你的进度条UI保持不变，因为它已经在监听 shoeStore.aiTaskProgress 和 shoeStore.aiTaskStatus

3. 新的处理方式的优势：
   - 自动处理WebSocket连接
   - 自动处理进度更新
   - 自动处理错误情况
   - 代码更简洁易维护

4. 你只需要：
   - 准备请求参数
   - 调用对应的execute函数
   - 在回调中处理UI更新

5. 所有的图生图API都可以用类似的方式处理：
   - executeSoleFusion (鞋底换面)
   - executeAutoColor (自动配色)
   - executeLineArt (线稿图)
   - executeWatermarkRemove (去水印)
   - executeImageRestore (图片修复)
   - executeElementRemove (元素消除)
   - executeStyleExtension (款式延伸)
   - executeStyleFusion (款式融合)
   - executeStyleFusionEnhanced (款式融合主体加强)
   - executeTextDesign (文字创款)
   - executeCutout (一键抠图)
   - executePartialModify (局部修改)
   - executeHDEnhance (高清放大)
-->