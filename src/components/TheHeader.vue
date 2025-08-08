<template>
  <header class="header">
    <div class="logo">
      <img src="/logo3.png" alt="D-Design Logo" class="logo-image" />
    </div>
    <div class="nav-right">
      <div class="nav-item">
        <el-icon><Document /></el-icon>
        <span>使用教程</span>
      </div>
      <div class="nav-item contact-hover-wrapper">
        <el-icon><Service /></el-icon>
        <span>联系我们</span>
        <div class="contact-popover">
          <img src="/src/assets/二维码.png" alt="二维码" class="contact-qrcode" />
          <div class="contact-phone">电话：15888667597 </div>
          <div class="contact-phone"> 请联系客服</div>
        </div>
      </div>
      <!-- 未登录显示登录按钮 -->
      <div class="user-avatar" v-if="!isLoggedIn" @click="$router.push('/login')">
        <el-avatar size="large" :icon="UserFilled" />
        <span>登录</span>
      </div>
      <!-- 已登录显示用户头像和下拉菜单 -->
      <el-dropdown v-else trigger="click" @command="handleCommand">
        <div class="user-avatar">
          <el-avatar size="large" :icon="UserFilled" />
          <span>{{ userInfo.nickname || userInfo.username }}</span>
          <!-- 角色标识 -->
          <div class="role-badge" :class="getRoleBadgeClass">
            {{ getRoleDisplayName }}
          </div>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">个人信息</el-dropdown-item>
            <!-- 仅对访客显示升级选项 -->
            <el-dropdown-item command="upgrade" v-if="isVisitor">升级会员</el-dropdown-item>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <!-- 用户信息对话框已移除 -->
    
    <!-- 升级会员对话框 -->
    <el-dialog
      v-model="upgradeDialogVisible"
      title="升级会员"
      width="520px"
      :close-on-click-modal="false"
      :show-close="true"
      :top="'15vh'"
      :z-index="2000"
      class="upgrade-dialog"
      :fullscreen="false"
      append-to-body
      destroy-on-close
    >
      <div class="upgrade-dialog-content">
        <div class="upgrade-icon">
          <el-icon><Star /></el-icon>
        </div>
        <h3>输入邀请码升级为会员</h3>
        <p class="upgrade-desc">成为会员后可以享受更多功能和特权</p>
        <el-form :model="upgradeForm" ref="upgradeFormRef">
          <el-form-item prop="code" :rules="[{ required: true, message: '请输入邀请码', trigger: 'blur' }]">
            <el-input
              v-model="upgradeForm.code"
              placeholder="请输入邀请码"
              clearable
              maxlength="20"
              show-word-limit
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="upgradeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpgrade" :loading="upgradeLoading">
            确认升级
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 用户信息对话框 -->
    <UserProfile ref="userProfileRef" />
  </header>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, markRaw, defineAsyncComponent, computed } from 'vue'
import { Document, Service, UserFilled, Star } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useRouter } from 'vue-router'
import { upgradeUser, logout, getCurrentUserInfo } from '../api/user'
// 使用动态导入解决模块导出问题
const UserProfile = markRaw(defineAsyncComponent(() => import('./UserProfile.vue')))

const router = useRouter()
const userProfileRef = ref()
const upgradeFormRef = ref<FormInstance>()

// 用户登录状态
const isLoggedIn = ref(false)

// 升级会员对话框
const upgradeDialogVisible = ref(false)
const upgradeLoading = ref(false)
const upgradeForm = reactive({
  code: ''
})

// 用户信息
const userInfo = reactive({
  id: 0,
  uid: '',
  username: '',
  nickname: '',
  sex: 1,
  phone: '',
  avatar: '',
  role: ''
})

// 判断是否为访客
const isVisitor = computed(() => {
  return userInfo.role === 'VISITOR' || userInfo.role === 'visitor';
});

// 获取角色显示名称
const getRoleDisplayName = computed(() => {
  const role = userInfo.role ? userInfo.role.toUpperCase() : '';
  switch (role) {
    case 'ADMIN':
      return '管理员';
    case 'MEMBER':
      return '会员';
    case 'VISITOR':
    default:
      return '访客';
  }
});

// 获取角色标识的CSS类
const getRoleBadgeClass = computed(() => {
  const role = userInfo.role ? userInfo.role.toUpperCase() : '';
  switch (role) {
    case 'ADMIN':
      return 'admin-badge';
    case 'MEMBER':
      return 'member-badge';
    case 'VISITOR':
    default:
      return 'visitor-badge';
  }
});

// 检查登录状态
const checkLoginStatus = async () => {
  const token = localStorage.getItem('token')
  
  if (token) {
    try {
      // 使用新的接口获取当前用户信息
      const response = await getCurrentUserInfo()
      
      if (response && response.code === 0 && response.data) {
        isLoggedIn.value = true
        // 更新用户信息
        Object.assign(userInfo, response.data)
        // 更新本地存储
        localStorage.setItem('userInfo', JSON.stringify(response.data))
      } else {
        // 如果获取失败，尝试使用本地存储的信息
        const storedUserInfo = localStorage.getItem('userInfo')
        if (storedUserInfo) {
    isLoggedIn.value = true
    try {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      Object.assign(userInfo, parsedUserInfo)
    } catch (error) {
      console.error('解析用户信息失败', error)
            isLoggedIn.value = false
          }
        } else {
          isLoggedIn.value = false
        }
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
      // 如果接口请求失败，尝试使用本地存储的信息
      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        isLoggedIn.value = true
        try {
          const parsedUserInfo = JSON.parse(storedUserInfo)
          Object.assign(userInfo, parsedUserInfo)
        } catch (error) {
          console.error('解析用户信息失败', error)
          isLoggedIn.value = false
        }
      } else {
        isLoggedIn.value = false
      }
    }
  } else {
    isLoggedIn.value = false
  }
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      // 打开个人信息对话框
      userProfileRef.value?.open(userInfo)
      break
    case 'upgrade':
      // 打开升级会员对话框
      upgradeDialogVisible.value = true
      break
    case 'logout':
      // 调用退出登录接口
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    // 调用登出接口
    await logout()
    // 清除本地存储的用户信息
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    isLoggedIn.value = false
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使接口调用失败，也清除本地信息并退出
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    isLoggedIn.value = false
    router.push('/login')
  }
}

// API响应类型
interface ApiResponse {
  code: number;
  msg: string;
  data?: {
    role?: string;
    [key: string]: any;
  };
}

// 提交升级会员请求
const submitUpgrade = async () => {
  if (!upgradeFormRef.value) return
  
  await upgradeFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        upgradeLoading.value = true
        const id = userInfo.id.toString()
        const response = await upgradeUser(id, upgradeForm.code) as ApiResponse
        
        if (response.code === 200) {
          ElMessage.success('升级成功！')
          upgradeDialogVisible.value = false
          
          // 升级成功后获取最新的用户信息
          try {
            const userResponse = await getCurrentUserInfo() as ApiResponse
            
            if (userResponse.code === 200 && userResponse.data) {
              // 更新用户信息
              Object.assign(userInfo, userResponse.data)
              
              // 更新本地存储的用户信息
              localStorage.setItem('userInfo', JSON.stringify(userResponse.data))
              
              console.log('用户信息已更新:', userResponse.data)
            } else {
              console.warn('获取用户信息失败:', userResponse.msg)
            }
          } catch (error) {
            console.error('获取用户信息出错:', error)
          }
        } else {
          ElMessage.error(response.msg || '升级失败，请检查邀请码是否正确')
        }
      } catch (error) {
        console.error('升级会员出错:', error)
        ElMessage.error('升级失败，请稍后再试')
      } finally {
        upgradeLoading.value = false
      }
    }
  })
}

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0 15px 40px;
  z-index: 10;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  width: 100%;
  box-sizing: border-box;
  position: relative;
  margin-top: 20px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 36px;
  width: auto;
  object-fit: contain;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  padding: 0 20px;
  background-color: rgba(0, 0, 0, 0.3);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 4px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.3s;
  font-size: 14px;
}

.nav-item:hover {
  opacity: 1;
}

.nav-item .el-icon {
  font-size: 24px;
}

.user-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  position: relative;
}

.user-avatar .el-avatar {
  --el-avatar-size: 38px !important;
  font-size: 20px;
}

/* 角色标识样式 */
.role-badge {
  position: absolute;
  top: -10px;
  right: -25px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.admin-badge {
  background: linear-gradient(45deg, #FF4500, #FF8C00);
  border: 1px solid #FF6347;
}

.member-badge {
  background: linear-gradient(45deg, #00A3FF, #0AFFFF);
  border: 1px solid #00A3FF;
}

.visitor-badge {
  background: linear-gradient(45deg, #808080, #A9A9A9);
  border: 1px solid #696969;
}

/* 升级会员对话框样式 */
:deep(.upgrade-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.upgrade-dialog .el-dialog) {
  margin-top: 0 !important;
  margin: auto;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  height: auto !important;
  max-height: 80vh !important;
  overflow: visible;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

:deep(.upgrade-dialog .el-dialog__header) {
  padding: 22px 24px;
  border-bottom: 1px solid rgba(0, 163, 255, 0.1);
  font-size: 20px;
  font-weight: 600;
  color: #00A3FF;
  text-align: center;
  position: relative;
}

:deep(.upgrade-dialog .el-dialog__title) {
  font-weight: 600;
  color: #00A3FF;
}

:deep(.upgrade-dialog .el-dialog__headerbtn) {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 30px;
  height: 30px;
  background: rgba(0, 163, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.upgrade-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: #00A3FF;
  font-size: 16px;
}

:deep(.upgrade-dialog .el-dialog__body) {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 250px;
  display: block !important;
  position: relative;
}

:deep(.upgrade-dialog .el-dialog__footer) {
  padding: 15px 24px;
  border-top: 1px solid rgba(0, 163, 255, 0.1);
  display: flex;
  justify-content: center;
}

.upgrade-dialog-content {
  width: 100%;
  height: 100%;
  min-height: 250px;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upgrade-icon {
  font-size: 60px;
  color: #f8c541;
  margin-bottom: 20px;
  animation: glow 2s infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #f8c541, 0 0 20px #f8c541;
  }
  to {
    text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #f8c541, 0 0 40px #f8c541;
  }
}

.upgrade-dialog-content h3 {
  font-size: 24px;
  margin: 0 0 15px 0;
  color: #333;
  font-weight: 600;
}

.upgrade-desc {
  color: #606266;
  margin-bottom: 25px;
  font-size: 16px;
  text-align: center;
}

.upgrade-dialog-content .el-form {
  width: 100%;
  margin-top: 10px;
}

:deep(.upgrade-dialog-content .el-input__wrapper) {
  height: 45px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(0, 163, 255, 0.2) inset !important;
  padding: 0 15px;
  transition: all 0.3s;
}

:deep(.upgrade-dialog-content .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(0, 163, 255, 0.4) inset !important;
}

:deep(.upgrade-dialog-content .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #00A3FF inset !important;
}

:deep(.upgrade-dialog-content .el-form-item) {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
}

:deep(.dialog-footer .el-button) {
  min-height: 40px;
  min-width: 100px;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

:deep(.dialog-footer .el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  border: none;
}

:deep(.dialog-footer .el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 163, 255, 0.3);
}

:deep(.dialog-footer .el-button--default) {
  border-color: rgba(0, 163, 255, 0.3);
  color: #00A3FF;
}

.contact-hover-wrapper {
  position: relative;
}
.contact-popover {
  display: none;
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border-radius: 10px;
  padding: 16px 20px 10px 20px;
  z-index: 999;
  min-width: 180px;
  text-align: center;
  animation: fadeIn 0.2s;
}
.contact-hover-wrapper:hover .contact-popover {
  display: block;
}
.contact-qrcode {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 8px;
}
.contact-phone {
  font-size: 15px;
  color: #333;
  margin-top: 2px;
  letter-spacing: 1px;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style> 