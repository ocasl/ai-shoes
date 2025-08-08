<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './components/MainLayout.vue'
import { checkTokenValidity, emitter } from './utils/request'

const route = useRoute()
const isLoggedIn = ref(false)
const mainLayoutRef = ref(null)

// 判断当前是否是认证页面（登录/注册）
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register'
})

// 检查登录状态
const checkLoginStatus = async () => {
  try {
    const token = localStorage.getItem('token')
    if (token) {
      // 验证token有效性
      isLoggedIn.value = await checkTokenValidity()
    } else {
      isLoggedIn.value = false
    }
  } catch (error) {
    console.error('检查登录状态失败:', error)
    isLoggedIn.value = false
  }
}

// 处理工具模态框事件，控制header显示/隐藏
const handleToggleHeader = (visible) => {
  if (mainLayoutRef.value) {
    mainLayoutRef.value.toggleHeader(visible)
  }
}

// 全局事件监听，用于处理工具模态框事件
emitter.on('toggle-header', handleToggleHeader)

// 监听token更新事件
emitter.on('token-updated', (data) => {
  isLoggedIn.value = data.isValid
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  emitter.off('token-updated')
  emitter.off('toggle-header')
})

// 监听路由变化
watch(() => route.path, async () => {
  await checkLoginStatus()
})

// 组件挂载时检查登录状态
onMounted(async () => {
  await checkLoginStatus()
})
</script>

<template>
  <!-- 根据登录状态和当前页面决定是否显示MainLayout -->
  <MainLayout v-if="!isAuthPage || isLoggedIn" ref="mainLayoutRef">
    <router-view @toggle-header="handleToggleHeader" />
  </MainLayout>
  <router-view v-else />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background-color: #000;
  color: #fff;
  overflow-x: hidden;
}

#app {
  width: 100vw;
  height: 100vh;
}

/* 全局金色确定按钮样式 */
:deep(.el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold !important;
  box-shadow: 0 2px 8px #c8ad7f33 !important;
  transition: background 0.2s, color 0.2s !important;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%) !important;
  color: #c8ad7f !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px #c8ad7f40 !important;
}

:deep(.el-button--primary:disabled) {
  background: linear-gradient(90deg, #e0cfa0 0%, #f5e6c3 100%) !important;
  opacity: 0.7 !important;
  color: #fff !important;
  transform: none !important;
  box-shadow: 0 2px 8px #c8ad7f33 !important;
}

/* 排除登录注册按钮的全局样式 */
:deep(.login-btn.el-button--primary),
:deep(.register-btn.el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: #fff !important;
  font-weight: normal !important;
  box-shadow: none !important;
}

:deep(.login-btn.el-button--primary:hover),
:deep(.register-btn.el-button--primary:hover) {
  background: linear-gradient(90deg, #0AFFFF, #00A3FF) !important;
  color: #fff !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 163, 255, 0.3) !important;
}

/* 小尺寸按钮保持蓝色主题 */
:deep(.el-button--small.el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: #fff !important;
  font-weight: normal !important;
  box-shadow: 0 2px 4px rgba(0, 163, 255, 0.3) !important;
}

:deep(.el-button--small.el-button--primary:hover) {
  background: linear-gradient(90deg, #0AFFFF, #00A3FF) !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 8px rgba(0, 163, 255, 0.4) !important;
}

/* 功能按钮保持蓝色主题 */
:deep(.search-buttons .el-button--primary),
:deep(.empty-container .el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: #fff !important;
  font-weight: normal !important;
  box-shadow: 0 2px 4px rgba(0, 163, 255, 0.3) !important;
}

:deep(.search-buttons .el-button--primary:hover),
:deep(.empty-container .el-button--primary:hover) {
  background: linear-gradient(90deg, #0AFFFF, #00A3FF) !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 8px rgba(0, 163, 255, 0.4) !important;
}

/* 对话框中的确认按钮保持蓝色主题 */
:deep(.dialog-footer .el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: #fff !important;
  font-weight: normal !important;
  box-shadow: 0 2px 4px rgba(0, 163, 255, 0.3) !important;
}

:deep(.dialog-footer .el-button--primary:hover) {
  background: linear-gradient(90deg, #0AFFFF, #00A3FF) !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 8px rgba(0, 163, 255, 0.4) !important;
}

/* 弹窗中的确定按钮使用金色主题 */
:deep(.el-dialog .dialog-footer .el-button--primary),
:deep(.el-message-box .el-message-box__btns .el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold !important;
  box-shadow: 0 2px 8px #c8ad7f33 !important;
  transition: background 0.2s, color 0.2s !important;
}

:deep(.el-dialog .dialog-footer .el-button--primary:hover),
:deep(.el-message-box .el-message-box__btns .el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%) !important;
  color: #c8ad7f !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px #c8ad7f40 !important;
}

/* 大尺寸按钮保持蓝色主题 */
:deep(.el-button--large.el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: #fff !important;
  font-weight: normal !important;
  box-shadow: 0 2px 4px rgba(0, 163, 255, 0.3) !important;
}

:deep(.el-button--large.el-button--primary:hover) {
  background: linear-gradient(90deg, #0AFFFF, #00A3FF) !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 8px rgba(0, 163, 255, 0.4) !important;
}

/* 功能操作按钮保持蓝色主题 */
:deep(.step-actions .el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF) !important;
  border: none !important;
  color: #fff !important;
  font-weight: normal !important;
  box-shadow: 0 2px 4px rgba(0, 163, 255, 0.3) !important;
}

:deep(.step-actions .el-button--primary:hover) {
  background: linear-gradient(90deg, #0AFFFF, #00A3FF) !important;
  color: #fff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 3px 8px rgba(0, 163, 255, 0.4) !important;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(0, 163, 255, 0.5);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 163, 255, 0.8);
}

/* Element Plus弹窗组件的金色按钮样式 */
:deep(.el-message-box__btns .el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold !important;
  box-shadow: 0 2px 8px #c8ad7f33 !important;
  transition: background 0.2s, color 0.2s !important;
}

:deep(.el-message-box__btns .el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%) !important;
  color: #c8ad7f !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px #c8ad7f40 !important;
}

/* 更全面的弹窗金色按钮样式覆盖 */
:deep(.el-dialog__footer .el-button--primary),
:deep(.el-message-box__btns .el-button--primary),
:deep(.el-drawer__footer .el-button--primary),
:deep(.el-popover .el-button--primary) {
  background: linear-gradient(90deg, #c8ad7f 0%, #ffe7b2 100%) !important;
  border: none !important;
  color: #fff !important;
  font-weight: bold !important;
  box-shadow: 0 2px 8px #c8ad7f33 !important;
  transition: background 0.2s, color 0.2s !important;
}

:deep(.el-dialog__footer .el-button--primary:hover),
:deep(.el-message-box__btns .el-button--primary:hover),
:deep(.el-drawer__footer .el-button--primary:hover),
:deep(.el-popover .el-button--primary:hover) {
  background: linear-gradient(90deg, #ffe7b2 0%, #c8ad7f 100%) !important;
  color: #c8ad7f !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px #c8ad7f40 !important;
}

/* 确保弹窗中的确定按钮在禁用状态下也保持金色 */
:deep(.el-dialog__footer .el-button--primary:disabled),
:deep(.el-message-box__btns .el-button--primary:disabled),
:deep(.el-drawer__footer .el-button--primary:disabled),
:deep(.el-popover .el-button--primary:disabled) {
  background: linear-gradient(90deg, #e0cfa0 0%, #f5e6c3 100%) !important;
  opacity: 0.7 !important;
  color: #fff !important;
  transform: none !important;
  box-shadow: 0 2px 8px #c8ad7f33 !important;
}
</style>
