import { useShoeStore } from '../store'

let ws: WebSocket | null = null
let reconnectTimer: any = null

export function startAiTaskWs(clientId: string, server: string, promptId: string, taskType?: string) {
  const store = useShoeStore()

  // 先停止之前的WebSocket连接
  if (ws) {
    ws.close()
    ws = null
  }

  // 重置任务状态，确保使用新的任务信息
  store.resetAiTask()

  // 设置新的任务信息
  store.setAiTaskInfo({ promptId, clientId, server, taskType })

  // 获取token用于WebSocket认证
  const token = localStorage.getItem('token')
  // 如果token已经包含Bearer前缀，去掉它；如果没有，直接使用
  const bearerToken = token && token.startsWith('Bearer ') ? token.substring(7) : token
  
  // 在开发环境使用本地代理，生产环境直接连接
  const isDev = import.meta.env.DEV
  const wsUrl = isDev 
    ? `ws://localhost:5173/ws?clientId=${clientId}&server=${server}&token=${bearerToken || ''}`
    : `ws://www.ai-shoes.cn/ws?clientId=${clientId}&server=${server}&token=${bearerToken || ''}`
  
  console.log('🔗 尝试连接WebSocket:', wsUrl.replace(/token=[^&]*/, 'token=***'))
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    try {
      console.log('🔗 WebSocket连接成功，开始监听任务状态，任务类型:', taskType)
    } catch (error) {
      console.error('❌ WebSocket onopen 错误:', error)
    }
  }

  ws.onmessage = async (event) => {
    const msg = JSON.parse(event.data)
    console.log('📨 收到WebSocket消息:', msg)

    if (msg.type === 'task_progress') {
      store.setAiTaskProgress(msg.progress)
    } else if (msg.type === 'task_success') {
      store.setAiTaskStatus('success')

      // 根据任务类型显示不同的成功消息
      const taskType = store.aiTask.taskType
      if (taskType === 'color') {
        console.log('✅ 配色任务完成')
      } else if (taskType === 'cutout') {
        console.log('✅ 抠图任务完成')
      } else if (taskType === 'line-art') {
        console.log('✅ 线稿任务完成')
      } else if (taskType === 'style-fusion') {
        console.log('✅ 款式融合任务完成')
      } else if (taskType === 'sole-fusion') {
        console.log('✅ 鞋底换面任务完成')
      } else if (taskType === 'style-extension') {
        console.log('✅ 款式延伸任务完成')
      } else if (taskType === 'partial-modify') {
        console.log('✅ 局部修改任务完成')
      } else if (taskType === 'text-design') {
        console.log('✅ 文字创款任务完成')
      } else if (taskType === 'element-remove') {
        console.log('✅ 元素消除任务完成')
      } else if (taskType === 'hd-enhance') {
        console.log('✅ 高清放大任务完成')
      } else if (taskType === 'image-restore') {
        console.log('✅ 图片恢复任务完成')
      } else if (taskType === 'watermark-remove') {
        console.log('✅ 去水印任务完成')
      } else {
        console.log('✅ 任务完成')
      }

      // 查询图片 - 使用store中的最新promptId，而不是函数参数中的旧值
      const currentPromptId = store.aiTask.promptId
      const requestUrl = `/api/image/request?pi=${currentPromptId}&server=${server}`
      console.log('🔍 查询图片，请求URL:', requestUrl)
      console.log('🔍 参数详情:', {
        storePromptId: currentPromptId,
        functionParamPromptId: promptId,
        server,
        taskType
      })

      const token = localStorage.getItem('token')
      console.log('🔑 Token:', token ? '存在' : '不存在')

      // 统一处理token格式，和request.ts保持一致
      const bearerToken = token && token.startsWith('Bearer ') ? token : `Bearer ${token}`
      console.log('🔑 BearerToken:', bearerToken)

      fetch(requestUrl, {
        headers: {
          'Authorization': bearerToken,
          'token': bearerToken  // 同时设置token头，和request.ts保持一致
        }
      })
        .then(r => {
          console.log('📡 图片查询响应状态:', r.status)
          return r.json()
        })
        .then(data => {
          console.log('📸 图片查询结果:', data)
          if (data.code === 200 && data.data) {
            // 优先检查 ossUrls，兼容 viewUrls
            const imageUrls = data.data.ossUrls || data.data.viewUrls
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
              console.log('✅ 获取到图片链接:', imageUrls)
              store.setAiTaskImages(imageUrls)

              // 更新全局图片ID状态
              const ossIds = data.data.ossIds
              if (ossIds && Array.isArray(ossIds) && ossIds.length > 0) {
                const newImageId = ossIds[0]
                console.log('🌐 WebSocket任务完成，更新全局图片ID:', newImageId)
                store.setSegmentedImageId(newImageId)
                // 同时保存ossIds到store中，供后续操作使用
                store.setAiTaskOssIds(ossIds)
                console.log('🌐 保存ossIds到store:', ossIds)
              }
            } else {
              console.error('❌ 图片查询失败，返回数据:', data)
            }
          } else {
            console.error('❌ 图片查询失败，返回数据:', data)
          }
        })
        .catch(error => {
          console.error('❌ 图片查询请求失败:', error)
        })
    } else if (msg.type === 'task_executing') {
      store.setAiTaskStatus('running')
      store.setAiTaskProgress(0)

      // 如果收到多次task_executing但没有task_success，尝试手动查询
      setTimeout(() => {
        if (store.aiTask.taskStatus === 'running') {
          console.log('⏰ 任务执行中，尝试手动查询图片结果')
          manuallyQueryImages(promptId, server, store)
        }
      }, 300000) // 30秒后尝试查询
    }
  }

  ws.onclose = (event) => {
    console.log('🔌 WebSocket连接关闭:', event.code, event.reason)
    if (store.aiTask.taskStatus !== 'success') {
      console.log('⏰ 20秒后尝试重连WebSocket')
      reconnectTimer = setTimeout(() => {
        console.log('🔄 开始重连WebSocket')
        startAiTaskWs(clientId, server, promptId, taskType)
      }, 20000)
    }
  }

  ws.onerror = (error) => {
    console.error('❌ WebSocket连接错误:', error)
    store.setAiTaskStatus('error')
  }
}

// 手动查询图片的函数
function manuallyQueryImages(promptId: string, server: string, store: any) {
  // 使用store中的最新promptId，而不是函数参数中的旧值
  const currentPromptId = store.aiTask.promptId
  const requestUrl = `/api/image/request?pi=${currentPromptId}&server=${server}`
  console.log('🔍 手动查询图片，请求URL:', requestUrl)
  console.log('🔍 手动查询参数详情:', {
    storePromptId: currentPromptId,
    functionParamPromptId: promptId,
    server
  })

  const token = localStorage.getItem('token')
  console.log('🔑 Token:', token ? '存在' : '不存在')

  // 统一处理token格式，和request.ts保持一致
  const bearerToken = token && token.startsWith('Bearer ') ? token : `Bearer ${token}`
  console.log('🔑 BearerToken:', bearerToken)

  fetch(requestUrl, {
    headers: {
      'Authorization': bearerToken,
      'token': bearerToken  // 同时设置token头，和request.ts保持一致
    }
  })
    .then(r => {
      console.log('📡 手动查询响应状态:', r.status)
      return r.json()
    })
    .then(data => {
      console.log('📸 手动查询结果:', data)
      if (data.code === 200 && data.data) {
        // 优先检查 ossUrls，兼容 viewUrls
        const imageUrls = data.data.ossUrls || data.data.viewUrls
        if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
          console.log('✅ 手动查询成功，获取到图片链接:', imageUrls)
          store.setAiTaskStatus('success')
          store.setAiTaskImages(imageUrls)

          // 更新全局图片ID状态
          const ossIds = data.data.ossIds
          if (ossIds && Array.isArray(ossIds) && ossIds.length > 0) {
            const newImageId = ossIds[0]
            console.log('🌐 手动查询完成，更新全局图片ID:', newImageId)
            store.setSegmentedImageId(newImageId)
            // 同时保存ossIds到store中，供后续操作使用
            store.setAiTaskOssIds(ossIds)
            console.log('🌐 手动查询保存ossIds到store:', ossIds)
          }
        } else {
          console.log('⏳ 手动查询暂无结果，可能任务还在执行中')
        }
      } else {
        console.log('⏳ 手动查询暂无结果，可能任务还在执行中')
      }
    })
    .catch(error => {
      console.error('❌ 手动查询失败:', error)
    })
}

export function stopAiTaskWs() {
  if (ws) ws.close()
  ws = null
  if (reconnectTimer) clearTimeout(reconnectTimer)
} 