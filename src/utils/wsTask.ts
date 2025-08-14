import { useShoeStore } from '../store'

let ws: WebSocket | null = null
let reconnectTimer: any = null
let reconnectCount = 0
let comfyuiRetryCount = 0
const maxReconnectAttempts = 5
const maxComfyuiRetryAttempts = 3
let isQueryingResult = false // 防止重复查询结果

export function startAiTaskWs(taskId: string, taskType?: string) {
  const store = useShoeStore()

  // 先停止之前的WebSocket连接
  if (ws) {
    console.log('🛑 关闭之前的WebSocket连接')
    ws.close()
    ws = null
  }

  // 清除之前的重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  // 重置任务状态，确保使用新的任务信息
  store.resetAiTask()

  // 重置ComfyUI重试计数和查询标志
  comfyuiRetryCount = 0
  isQueryingResult = false

  // 设置新的任务信息
  store.setAiTaskInfo({ taskId, taskType })

  // 获取token用于WebSocket认证
  const token = localStorage.getItem('token')
  // 如果token已经包含Bearer前缀，去掉它；如果没有，直接使用
  const bearerToken = token && token.startsWith('Bearer ') ? token.substring(7) : token

  // 直接连接到后端服务器，URL格式完全匹配Apifox
  const isDev = import.meta.env.DEV
  const wsUrl = isDev
    ? `ws://localhost:8080/ws?taskId=${taskId}`
    : `ws://www.ai-shoes.cn/ws?taskId=${taskId}`

  console.log('🔗 尝试连接WebSocket:', wsUrl)
  console.log('🔑 Token状态:', bearerToken ? '存在' : '不存在')
  console.log('🔍 TaskId:', taskId)
  console.log('🔍 TaskType:', taskType)

  try {
    // 创建WebSocket连接，完全匹配Apifox的请求格式
    ws = new WebSocket(wsUrl)
    console.log('✅ WebSocket对象创建成功')
  } catch (error) {
    console.error('❌ WebSocket创建失败:', error)
    store.setAiTaskStatus('error')
    return
  }

  ws.onopen = () => {
    try {
      console.log('✅ WebSocket连接成功，开始监听任务状态')
      console.log('📋 任务信息:', { taskId, taskType })
      console.log('🔗 连接详情:', {
        url: ws.url.replace(/token=[^&]*/, 'token=***'),
        readyState: ws.readyState
      })

      // 重置重连计数
      reconnectCount = 0
      store.setAiTaskStatus('running')
      store.setAiTaskProgress(0)

      console.log('📤 WebSocket连接成功，等待后端推送消息...')
    } catch (error) {
      console.error('❌ WebSocket onopen 错误:', error)
    }
  }

  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data)
      console.log('📨 收到WebSocket消息:', msg)

      // 验证消息格式
      if (!msg.type) {
        console.warn('⚠️ 收到无效消息格式:', msg)
        return
      }

      // 处理连接状态消息
      if (msg.type === 'connection_status') {
        if (msg.status === 'success') {
          console.log('✅ WebSocket连接状态确认成功')
          store.setAiTaskStatus('running')
        } else {
          console.warn('⚠️ WebSocket连接状态异常:', msg.status)
        }
      }
      // 处理进度消息
      else if (msg.type === 'progress' && typeof msg.progress === 'number') {
        const progress = Math.max(0, Math.min(100, msg.progress))
        console.log(`📊 任务进度: ${progress}%`)
        store.setAiTaskProgress(progress)
        store.setAiTaskStatus('running')

        // 如果进度达到100%，预期很快会收到task_status消息
        if (progress === 100) {
          console.log('🎯 进度已达100%，等待任务完成确认...')

          // 设置超时保护，如果15秒内没收到task_status就主动查询
          setTimeout(async () => {
            if (store.aiTask.taskStatus === 'running') {
              console.log('⏰ 进度100%后15秒未收到完成状态，主动查询结果')
              await manuallyQueryTaskResult(taskId, store)
            }
          }, 15000)
        }
      }
      // 处理任务状态消息
      else if (msg.type === 'task_status') {
        console.log('📋 收到任务状态消息:', msg.status)

        if (msg.status === 'success') {
          console.log('✅ 任务执行成功，开始查询结果...')
          
          // 防止重复查询
          if (isQueryingResult) {
            console.log('⚠️ 正在查询结果中，跳过重复调用')
            return
          }
          
          isQueryingResult = true
          store.setAiTaskStatus('loading_result') // 设置为加载结果状态
          store.setAiTaskProgress(100)

          // 根据任务类型显示不同的成功消息
          const currentTaskType = store.aiTask.taskType
          console.log(`✅ ${getTaskTypeMessage(currentTaskType)}任务完成，正在加载图片...`)

          // 查询图片 - 使用正确的API路径
          const requestUrl = `/api/image/request?taskId=${taskId}`
          console.log('🔍 查询图片，请求URL:', requestUrl)
          console.log('🔍 参数详情:', {
            taskId,
            taskType
          })

          const token = localStorage.getItem('token')
          console.log('🔑 Token:', token ? '存在' : '不存在')

          // 统一处理token格式
          const bearerToken = token && token.startsWith('Bearer ') ? token : `Bearer ${token}`
          console.log('🔑 BearerToken:', bearerToken)

          fetch(requestUrl, {
            headers: {
              'Authorization': bearerToken,
            }
          })
            .then(r => {
              console.log('📡 图片查询响应状态:', r.status)
              return r.json()
            })
            .then(data => {
              console.log('📸 图片查询结果:', data)
              if (data.code === 200 && data.data) {
                // 检查返回的图片数据 - 支持多种可能的字段名
                const imageUrls = data.data.images || data.data.viewUrls || data.data.ossUrls || []
                if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                  console.log('✅ 获取到图片链接:', imageUrls)
                  store.setAiTaskStatus('success') // 设置为最终成功状态
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
                  store.setAiTaskStatus('error')
                }
              } else {
                console.error('❌ 图片查询失败，返回数据:', data)
                store.setAiTaskStatus('error')
              }
            })
            .catch(error => {
              console.error('❌ 图片查询请求失败:', error)
              store.setAiTaskStatus('error')
            })
            .finally(() => {
              // 无论成功还是失败，都重置查询标志
              isQueryingResult = false
              console.log('🔄 重置查询结果标志')
            })
        } else if (msg.status === 'error' || msg.status === 'failed') {
          console.error('❌ 任务执行失败:', msg.status)
          store.setAiTaskStatus('error')
        }
      }
      // 处理错误消息
      else if (msg.type === 'error') {
        const errorMessage = msg?.message || msg?.data?.message || '未知错误'
        console.warn('⚠️ WebSocket收到错误消息:', errorMessage)

        // 如果是ComfyUI连接错误，尝试重试WebSocket连接
        if (errorMessage.includes('连接ComfyUI失败') ||
          errorMessage.includes('illegal input') ||
          (errorMessage.includes('offset') && errorMessage.includes('char p'))) {

          comfyuiRetryCount++
          console.log(`🔄 后端ComfyUI连接错误（第${comfyuiRetryCount}次），尝试重试...`)

          if (comfyuiRetryCount <= maxComfyuiRetryAttempts) {
            // 关闭当前连接
            if (ws) {
              ws.close()
              ws = null
            }

            // 5秒后重试
            setTimeout(() => {
              console.log(`🔄 第${comfyuiRetryCount}次重试WebSocket连接...`)
              startAiTaskWs(taskId, taskType)
            }, 5000)

            return // 不设置为失败状态，继续重试
          } else {
            console.log('🔄 ComfyUI重试次数已达上限，启动备用查询机制...')

            // 启动备用查询机制
            setTimeout(async () => {
              if (store.aiTask.taskStatus === 'running') {
                console.log('⏰ 10秒后主动查询任务结果')
                await manuallyQueryTaskResult(taskId, store)
              }
            }, 10000)

            return // 不设置为失败状态，继续等待
          }
        } else {
          // 其他错误才设置为失败
          console.error('❌ 任务执行错误:', errorMessage)
          store.setAiTaskStatus('error')
        }
      }
      // 兼容旧的消息格式
      else if (msg.type === 'task_progress') {
        const progress = Math.max(0, Math.min(100, msg.progress || 0))
        console.log(`📊 任务进度 (旧格式): ${progress}%`)
        store.setAiTaskProgress(progress)
      }
      else if (msg.type === 'task_success') {
        console.log('✅ 任务完成 (旧格式)')
        store.setAiTaskStatus('success')

        // 根据任务类型显示不同的成功消息
        const currentTaskType = store.aiTask.taskType
        console.log(`✅ ${getTaskTypeMessage(currentTaskType)}任务完成`)

        // 查询任务结果 (旧格式也使用新API)
        await manuallyQueryTaskResult(taskId, store)
      }
      else if (msg.type === 'task_executing') {
        console.log('🔄 任务执行中 (旧格式)')
        store.setAiTaskStatus('running')
        store.setAiTaskProgress(0)

        // 如果收到多次task_executing但没有task_success，尝试手动查询
        setTimeout(() => {
          if (store.aiTask.taskStatus === 'running') {
            console.log('⏰ 任务执行中，尝试手动查询任务结果')
            manuallyQueryTaskResult(taskId, store)
          }
        }, 30000) // 30秒后尝试查询
      }
      else {
        console.log('ℹ️ 收到未处理的消息类型:', msg.type, msg)
      }

    } catch (error) {
      console.error('❌ WebSocket消息解析错误:', error)
      console.log('📨 原始消息数据:', event.data)
    }
  }

  ws.onclose = (event) => {
    console.log('🔌 WebSocket连接关闭:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    })

    if (store.aiTask.taskStatus !== 'success' &&
      store.aiTask.taskStatus !== 'error' &&
      reconnectCount < maxReconnectAttempts) {
      reconnectCount++
      console.log(`⏰ 第${reconnectCount}次重连，5秒后尝试...`)

      reconnectTimer = setTimeout(() => {
        console.log('🔄 开始重连WebSocket')
        startAiTaskWs(taskId, taskType)
      }, 5000)
    } else if (reconnectCount >= maxReconnectAttempts) {
      console.error('❌ 超过最大重连次数，停止重连')
      store.setAiTaskStatus('error')
    }
  }

  ws.onerror = (error) => {
    console.error('❌ WebSocket连接错误:', error)
    console.log('🔗 错误时连接状态:', ws?.readyState)

    // 不立即设置为error状态，让重连机制处理
    if (reconnectCount >= maxReconnectAttempts) {
      store.setAiTaskStatus('error')
    }
  }
}

// 获取任务类型消息
function getTaskTypeMessage(taskType: string): string {
  const taskMessages: Record<string, string> = {
    'color': '配色',
    'cutout': '抠图',
    'line-art': '线稿',
    'style-fusion': '款式融合',
    'sole-fusion': '鞋底换面',
    'style-extension': '款式延伸',
    'partial-modify': '局部修改',
    'text-design': '文字创款',
    'element-remove': '元素消除',
    'hd-enhance': '高清放大',
    'image-restore': '图片恢复',
    'watermark-remove': '去水印'
  }

  return taskMessages[taskType] || ''
}

// 手动查询任务结果的函数
async function manuallyQueryTaskResult(taskId: string, store: any, retryCount = 0) {
  const maxRetries = 3

  // 防止重复查询
  if (isQueryingResult) {
    console.log('⚠️ 正在查询结果中，跳过手动查询')
    return
  }

  isQueryingResult = true
  console.log('🔍 开始手动查询任务结果')

  try {
    const requestUrl = `/api/image/request?taskId=${taskId}`
    console.log('🔍 手动查询任务结果，请求URL:', requestUrl)
    console.log('🔍 手动查询参数详情:', {
      taskId,
      retryCount
    })

    const token = localStorage.getItem('token')
    console.log('🔑 Token:', token ? '存在' : '不存在')

    // 统一处理token格式
    const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`
    console.log('🔑 BearerToken:', bearerToken)

    const response = await fetch(requestUrl, {
      headers: {
        'Authorization': bearerToken,
      }
    })

    console.log('📡 手动查询响应状态:', response.status)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📸 手动查询结果:', data)

    if (data.code === 200 && data.data) {
      // 根据新的API返回格式处理数据
      // 返回格式: {"code": 200, "msg": "操作成功", "data": {"promptId": "xxx", "ossIds": [1028], "ossUrls": ["https://..."]}}
      const ossUrls = data.data.ossUrls || []
      const ossIds = data.data.ossIds || []
      const promptId = data.data.promptId

      console.log('📋 查询结果详情:', {
        promptId: promptId,
        ossIds: ossIds,
        ossUrls: ossUrls,
        图片数量: ossUrls.length
      })

      if (ossUrls && Array.isArray(ossUrls) && ossUrls.length > 0) {
        console.log('✅ 手动查询成功，获取到图片链接:', ossUrls)
        store.setAiTaskStatus('success')
        store.setAiTaskImages(ossUrls) // 使用ossUrls作为图片链接

        // 更新全局图片ID状态
        if (ossIds && Array.isArray(ossIds) && ossIds.length > 0) {
          const newImageId = ossIds[0]
          console.log('🌐 手动查询完成，更新全局图片ID:', newImageId)
          store.setSegmentedImageId(newImageId)
          store.setAiTaskOssIds(ossIds)
          console.log('🌐 手动查询保存ossIds到store:', ossIds)
        }

        // 如果有promptId，也保存到store中
        if (promptId) {
          console.log('🌐 保存promptId到store:', promptId)
          // 这里可以根据需要保存promptId
        }

        return
      } else {
        console.log('⏳ 手动查询暂无结果，ossUrls为空或不存在')
      }
    } else {
      console.log('⏳ 手动查询暂无结果，响应码:', data.code, '消息:', data.msg)
    }

  } catch (error) {
    console.error(`❌ 手动查询失败 (第${retryCount + 1}次):`, error)

    // 如果还有重试机会，等待后重试
    if (retryCount < maxRetries) {
      console.log(`🔄 ${5}秒后进行第${retryCount + 2}次重试...`)
      // 重置标志，允许重试
      isQueryingResult = false
      setTimeout(() => {
        manuallyQueryTaskResult(taskId, store, retryCount + 1)
      }, 5000)
    } else {
      console.error('❌ 手动查询已达最大重试次数，停止重试')
      // 重置标志
      isQueryingResult = false
    }
  } finally {
    // 如果是最后一次调用（成功或最终失败），重置标志
    if (retryCount === 0) {
      isQueryingResult = false
      console.log('🔄 手动查询完成，重置查询结果标志')
    }
  }
}

export function stopAiTaskWs() {
  console.log('🛑 主动停止WebSocket连接')

  if (ws) {
    ws.close()
    ws = null
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  // 重置重连计数和查询标志
  reconnectCount = 0
  isQueryingResult = false

  console.log('✅ WebSocket连接已停止')
}

// 获取当前WebSocket连接状态
export function getWebSocketStatus(): string {
  if (!ws) return 'not_connected'

  const states = {
    0: 'connecting',
    1: 'connected',
    2: 'closing',
    3: 'closed'
  }

  return states[ws.readyState as keyof typeof states] || 'unknown'
}
