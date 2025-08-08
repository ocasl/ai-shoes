// WebSocket连接测试工具
export function testWebSocketConnection() {
  const isDev = import.meta.env.DEV
  const testUrl = isDev 
    ? 'ws://localhost:5173/ws?clientId=test&server=test'
    : 'ws://www.ai-shoes.cn:8080/ws?clientId=test&server=test'
  
  console.log('🧪 测试WebSocket连接:', testUrl)
  console.log('🔧 当前环境:', isDev ? '开发环境' : '生产环境')
  
  const testWs = new WebSocket(testUrl)
  
  testWs.onopen = () => {
    console.log('✅ WebSocket测试连接成功')
    console.log('📊 连接状态:', testWs.readyState)
    testWs.close()
  }
  
  testWs.onclose = (event) => {
    console.log('🔌 WebSocket测试连接关闭:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    })
  }
  
  testWs.onerror = (error) => {
    console.error('❌ WebSocket测试连接失败:', error)
    console.log('🔍 连接状态:', testWs.readyState)
    console.log('🔍 可能的原因:')
    console.log('  1. 服务器未启动或无法访问')
    console.log('  2. 代理配置有问题')
    console.log('  3. 防火墙阻止连接')
    console.log('  4. 网络连接问题')
  }
  
  // 5秒后自动关闭测试连接
  setTimeout(() => {
    if (testWs.readyState === WebSocket.OPEN) {
      console.log('⏰ 5秒超时，关闭测试连接')
      testWs.close()
    } else if (testWs.readyState === WebSocket.CONNECTING) {
      console.log('⏰ 5秒超时，连接仍在尝试中')
      testWs.close()
    }
  }, 5000)
}

// 测试直连服务器的WebSocket
export function testDirectWebSocketConnection() {
  const directUrl = 'ws://www.ai-shoes.cn:8080/ws?clientId=test&server=test'
  
  console.log('🧪 测试直连WebSocket:', directUrl)
  
  const testWs = new WebSocket(directUrl)
  
  testWs.onopen = () => {
    console.log('✅ 直连WebSocket测试成功')
    testWs.close()
  }
  
  testWs.onclose = (event) => {
    console.log('🔌 直连WebSocket关闭:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    })
  }
  
  testWs.onerror = (error) => {
    console.error('❌ 直连WebSocket测试失败:', error)
  }
  
  setTimeout(() => {
    if (testWs.readyState === WebSocket.OPEN) {
      testWs.close()
    }
  }, 5000)
}

// 在浏览器控制台中可以调用这个函数进行测试
// @ts-ignore
window.testWebSocket = testWebSocketConnection
// @ts-ignore
window.testDirectWebSocket = testDirectWebSocketConnection