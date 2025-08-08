<template>
  <div class="home-page">
    <!-- 左侧菜单 -->
    <div class="side-menu">
      <router-link to="/dashboard" class="menu-link">首页</router-link>
      <router-link to="/design" class="menu-link">设计区</router-link>
      <router-link to="/ai-tools" class="menu-link">AI小工具</router-link>
      <router-link to="/history" class="menu-link">历史记录</router-link>
    </div>

    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 标题和介绍 -->
      <div class="title-section">
        <h1 class="main-title">用AI设计，解锁无限鞋款创意</h1>
        <p class="subtitle">D-Design是一个AI鞋款设计平台，致力于为设计师及鞋企提供更强设计灵感辅助，让创意不再受限。</p>
      </div>

      <!-- 登录表单容器 -->
      <div class="login-container">
        <!-- 登录卡片 -->
        <div class="login-card">
          <h2 class="login-title">登 录</h2>
          
          <!-- 登录方式切换 -->
          <!-- <div class="login-tabs">
            <div 
              :class="['tab-item', activeTab === 'sms' ? 'active' : '']" 
              @click="activeTab = 'sms'"
            >
              手机验证码
            </div>
            <div 
              :class="['tab-item', activeTab === 'password' ? 'active' : '']" 
              @click="activeTab = 'password'"
            >
              账号密码
            </div>
          </div> -->

          <!-- 短信验证码登录 -->
          <el-form 
            v-if="activeTab === 'sms'"
            class="login-form" 
            :model="smsLoginForm" 
            ref="smsLoginFormRef" 
            :rules="smsRules"
          >
            <el-form-item prop="phone">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><EditPen /></el-icon>
                <el-input 
                  v-model="smsLoginForm.phone" 
                  placeholder="请输入手机号"
                />
              </div>
            </el-form-item>
            <el-form-item prop="code">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Lock /></el-icon>
                <el-input 
                  v-model="smsLoginForm.code" 
                  placeholder="请输入验证码"
                  class="verification-input"
                />
                <el-button 
                  class="get-code-btn" 
                  :disabled="isGettingCode"
                  @click="handleGetCode"
                >
                  {{ codeButtonText }}
                </el-button>
              </div>
            </el-form-item>
            <!-- <div class="form-options">
              <div class="switch-row">
                <span class="switch-label">记住登录状态</span>
                <el-switch v-model="smsLoginForm.remember" class="custom-switch" />
              </div>
              <div class="switch-row">
                <span class="switch-label">我已接受并同意隐私政策</span>
                <el-switch v-model="smsLoginForm.agreement" class="custom-switch" />
              </div>
            </div> -->
            <div class="form-buttons">
              <el-button class="register-btn" @click="$router.push('/register')" plain>注 册</el-button>
              <el-button class="login-btn" type="primary" @click="handleSmsLogin">登 录</el-button>
            </div>
          </el-form>

          <!-- 账号密码登录 -->
          <el-form 
            v-if="activeTab === 'password'"
            class="login-form" 
            :model="passwordLoginForm" 
            ref="passwordLoginFormRef" 
            :rules="passwordRules"
          >
            <el-form-item prop="username">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><User /></el-icon>
                <el-input 
                  v-model="passwordLoginForm.username" 
                  placeholder="请输入用户名"
                />
              </div>
            </el-form-item>
            <el-form-item prop="password">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Lock /></el-icon>
                <el-input 
                  v-model="passwordLoginForm.password" 
                  placeholder="请输入密码"
                  type="password"
                />
              </div>
            </el-form-item>
            <!-- <div class="form-options">
              <div class="switch-row">
                <span class="switch-label">记住登录状态</span>
                <el-switch v-model="passwordLoginForm.remember" class="custom-switch" />
              </div>
              <div class="switch-row">
                <span class="switch-label">我已接受并同意隐私政策</span>
                <el-switch v-model="passwordLoginForm.agreement" class="custom-switch" />
              </div>
            </div> -->
            <div class="form-buttons">
              <el-button class="register-btn" @click="$router.push('/register')" plain>注 册</el-button>
              <el-button class="login-btn" type="primary" @click="handlePasswordLogin">登 录</el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    
    <!-- 底部旋转效果 -->
    
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { EditPen, Lock, User } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { sendSmsCode, smsLogin, passwordLogin } from '../api/user'

// 路由实例
const router = useRouter()

// 防止重复提示标志
let isNavigating = false

// 自定义消息提示函数，确保不会重复显示
const showMessage = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
  // 先关闭所有消息
  ElMessage.closeAll()
  // 显示新消息
  ElMessage({
    message,
    type,
    showClose: true,
    duration: 2000
  })
}

// 登录方式选择
const activeTab = ref('sms')

// 短信登录表单数据
const smsLoginForm = reactive({
  phone: '',
  code: '',
  remember: false,
  agreement: false
})

// 账号密码登录表单数据
const passwordLoginForm = reactive({
  username: '',
  password: '',
  remember: false,
  agreement: false
})

// 短信登录表单验证规则
const smsRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度为4位', trigger: 'blur' }
  ]
}

// 账号密码登录表单验证规则
const passwordRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, message: '密码至少4位', trigger: 'blur' }
  ]
}

const smsLoginFormRef = ref<FormInstance>()
const passwordLoginFormRef = ref<FormInstance>()

// 获取验证码相关
const isGettingCode = ref(false)
const countdown = ref(60)
const codeButtonText = ref('获取验证码')

// 倒计时函数
const startCountdown = () => {
  isGettingCode.value = true
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    codeButtonText.value = `${countdown.value}秒后重试`
    if (countdown.value <= 0) {
      clearInterval(timer)
      isGettingCode.value = false
      codeButtonText.value = '获取验证码'
    }
  }, 1000)
}

// 获取验证码
const handleGetCode = async () => {
  try {
    // 验证手机号
    if (!/^1[3-9]\d{9}$/.test(smsLoginForm.phone)) {
      showMessage('请输入正确的手机号', 'warning')
      return
    }

    // 发送验证码
    await sendSmsCode(smsLoginForm.phone)
    showMessage('验证码已发送')
    startCountdown()
  } catch (error) {
    console.error('获取验证码失败：', error)
  }
}

// 处理短信验证码登录
const handleSmsLogin = async () => {
  if (!smsLoginFormRef.value || isNavigating) return
  
  try {
    // 表单验证
    await smsLoginFormRef.value.validate()
  
    // if (!smsLoginForm.agreement) {
    //   showMessage('请同意隐私政策', 'warning')
    //   return
    // }
  
    // 调用验证码登录接口
    const response = await smsLogin({
      phone: smsLoginForm.phone,
      code: smsLoginForm.code
    })
    
    // 保存用户信息和token
    const userData = response.data?.data
    if (userData && userData.Authorization) {
      // 设置导航标志，防止重复提示
      isNavigating = true
      
      localStorage.setItem('token', userData.Authorization)
      
      // 保存用户信息，移除不需要的字段
      const { Authorization, ...userInfo } = userData
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      // 先显示消息，然后再跳转
      showMessage('登录成功')
      
      // 使用nextTick确保DOM更新后再跳转
      await nextTick()
      
      // 直接跳转到首页
      router.push('/dashboard')
    } else {
      showMessage('登录失败，请重试', 'error')
    }
  } catch (error: any) {
    if (error.message) {
      showMessage(error.message, 'error')
    }
    console.error('登录失败：', error)
  }
}

// 处理账号密码登录
const handlePasswordLogin = async () => {
  if (!passwordLoginFormRef.value || isNavigating) return
  
  try {
    // 表单验证
    await passwordLoginFormRef.value.validate()
  
    // if (!passwordLoginForm.agreement) {
    //   showMessage('请同意隐私政策', 'warning')
    //   return
    // }
  
    // 调用密码登录接口
    const response = await passwordLogin({
      username: passwordLoginForm.username,
      password: passwordLoginForm.password
    })
    
    // 保存用户信息和token
    const userData = response.data
    if (userData && userData.Authorization) {
      // 设置导航标志，防止重复提示
      isNavigating = true
      
      localStorage.setItem('token', userData.Authorization)
      
      // 保存用户信息，移除不需要的字段
      const { Authorization, ...userInfo } = userData
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      // 先显示消息，然后再跳转
      showMessage('登录成功')
  
      // 使用nextTick确保DOM更新后再跳转
      await nextTick()
      
      // 直接跳转到首页
      router.push('/dashboard')
    } else {
      showMessage('登录失败，请重试', 'error')
    }
  } catch (error: any) {
    if (error.message) {
      showMessage(error.message, 'error')
    }
    console.error('登录失败：', error)
  }
}
</script>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('../assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

/* 左侧菜单样式 */
.side-menu {
  position: fixed;
  left: 0;
  top: 40%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  z-index: 10;
  width: 100px;
  background: none;
  padding: 0;
}

.menu-link {
  color: #fff;
  font-size: 16px;
  text-decoration: none;
  margin: 30px 0;
  text-align: center;
  transition: color 0.2s;
}

.menu-link.router-link-active {
  color: #c8ad7f;
  font-weight: bold;
  text-decoration: underline;
}

.menu-link:hover {
  color: #c8ad7f;
}

/* 主内容区样式 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}

.title-section {
  position: absolute;
  top: 3%;
  left: 13%;
  max-width: 650px;
}

.main-title {
  font-size: 45px;
  font-weight: bold;
  margin-bottom: 10px;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 16px;
  opacity: 0.8;
  line-height: 1.6;
  max-width: 550px;
}

/* 登录容器 */
.login-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  pointer-events: none;
}

/* 登录卡片样式 */
.login-card {
  background-color: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  width: 420px;
  pointer-events: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.login-card:hover {
  background-color: rgba(0, 0, 0, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.login-title {
  color: #c8ad7f;
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: normal;
}

/* 登录方式切换 */
.login-tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 25px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.tab-item.active {
  color: #c8ad7f;
}

.tab-item.active:after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #c8ad7f, #b89a6a);
  border-radius: 2px;
}

.tab-item:hover {
  color: rgba(255, 255, 255, 0.8);
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.custom-prefix-icon {
  position: absolute;
  left: 15px;
  z-index: 2;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.5);
}

.verification-input {
  flex: 1;
}

.get-code-btn {
  margin-left: 10px;
  white-space: nowrap;
  background: linear-gradient(90deg, #c8ad7f, #b89a6a);
  border: none;
  color: white;
  border-radius: 20px;
  height: 40px;
  padding: 0 15px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.get-code-btn:hover {
  background: linear-gradient(90deg, #b89a6a, #a88a5a);
  box-shadow: 0 2px 8px rgba(200, 173, 127, 0.3);
  transform: translateY(-1px);
}

.get-code-btn:disabled {
  background: #f5f5f5;
  color: #c0c4cc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.form-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 25px 0;
}

.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

/* 自定义Element Plus组件样式 */
:deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.15);
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding-left: 40px;
  border-radius: 50px;
  height: 46px;
  backdrop-filter: blur(2px);
}

:deep(.el-input__inner) {
  color: white;
  height: 46px;
  font-size: 15px;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5);
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

/* 金色开关样式 */
:deep(.custom-switch .el-switch__core) {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: transparent;
  width: 44px !important;
  height: 22px !important;
}

:deep(.custom-switch.is-checked .el-switch__core) {
  background: linear-gradient(90deg, #c8ad7f, #b89a6a);
  border-color: transparent;
}

:deep(.custom-switch .el-switch__core .el-switch__action) {
  background-color: white;
  height: 18px;
  width: 18px;
}

:deep(.el-avatar--large) {
  --el-avatar-size: 40px;
}

.form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

/* 金色按钮样式 */
.register-btn {
  width: 48%;
  border-color: #c8ad7f;
  color: #c8ad7f;
  border-radius: 50px;
  height: 46px;
  font-size: 16px;
  background: transparent;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background: #c8ad7f;
  color: #fff;
  border-color: #c8ad7f;
  box-shadow: 0 4px 12px rgba(200, 173, 127, 0.3);
  transform: translateY(-1px);
}

.login-btn {
  width: 48%;
  background: linear-gradient(90deg, #c8ad7f, #b89a6a);
  border: none;
  border-radius: 50px;
  height: 46px;
  font-size: 16px;
  color: #fff;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: linear-gradient(90deg, #b89a6a, #a88a5a);
  box-shadow: 0 4px 12px rgba(200, 173, 127, 0.4);
  transform: translateY(-1px);
}

/* 获取验证码按钮金色样式 */
.get-code-btn {
  margin-left: 10px;
  white-space: nowrap;
  background: linear-gradient(90deg, #c8ad7f, #b89a6a);
  border: none;
  color: white;
  border-radius: 20px;
  height: 40px;
  padding: 0 15px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.get-code-btn:hover {
  background: linear-gradient(90deg, #b89a6a, #a88a5a);
  box-shadow: 0 2px 8px rgba(200, 173, 127, 0.3);
  transform: translateY(-1px);
}

.get-code-btn:disabled {
  background: #f5f5f5;
  color: #c0c4cc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 登录标题改为金色 */
.login-title {
  color: #c8ad7f;
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: normal;
}

/* 标签页激活状态改为金色 */
.tab-item.active {
  color: #c8ad7f;
}

.tab-item.active:after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #c8ad7f, #b89a6a);
  border-radius: 2px;
}

/* 输入框聚焦时边框改为金色 */
:deep(.el-input__wrapper.is-focus) {
  border-color: #c8ad7f;
  box-shadow: 0 0 0 1px rgba(200, 173, 127, 0.2) !important;
}

/* 表单验证错误时的样式 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px rgba(245, 108, 108, 0.2) !important;
}

/* 按钮禁用状态 */
:deep(.el-button:disabled) {
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #c0c4cc;
  cursor: not-allowed;
}

:deep(.el-button:disabled:hover) {
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #c0c4cc;
  transform: none;
  box-shadow: none;
}

/* 底部旋转效果 */
.rotating-background {
  position: absolute;
  bottom: -300px;
  left: 0;
  right: 0;
  height: 800px;
  z-index: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(200, 173, 127, 0.2);
}

.circle-1 {
  width: 1200px;
  height: 1200px;
  animation: rotate 60s linear infinite;
}

.circle-2 {
  width: 900px;
  height: 900px;
  animation: rotate 45s linear reverse infinite;
}

.circle-3 {
  width: 600px;
  height: 600px;
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 