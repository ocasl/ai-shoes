<template>
  <div class="register-page">
    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 标题和介绍 -->
      <div class="title-section">
        <h1 class="main-title">用AI设计，解锁无限鞋款创意</h1>
        <p class="subtitle">D-Design是一个AI鞋款设计平台，致力于为设计师及鞋企提供更强设计灵感辅助，让创意不再受限。</p>
      </div>

      <!-- 注册表单容器 -->
      <div class="register-container">
        <div class="register-card">
          <h2 class="register-title">注 册</h2>
          <el-form 
            class="register-form" 
            :model="registerForm" 
            :rules="rules"
            ref="registerFormRef"
          >
            <!-- 用户名 -->
            <el-form-item prop="username">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><User /></el-icon>
                <el-input 
                  v-model="registerForm.username" 
                  placeholder="请输入用户名"
                />
              </div>
            </el-form-item>

            <!-- 密码 -->
            <el-form-item prop="password">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Lock /></el-icon>
                <el-input 
                  v-model="registerForm.password" 
                  type="password"
                  placeholder="请输入密码"
                  show-password
                />
              </div>
            </el-form-item>

            <!-- 确认密码 -->
            <el-form-item prop="confirmPassword">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Lock /></el-icon>
                <el-input 
                  v-model="registerForm.confirmPassword" 
                  type="password"
                  placeholder="请确认密码"
                  show-password
                />
              </div>
            </el-form-item>

            <!-- 昵称 -->
            <el-form-item prop="nickname">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><UserFilled /></el-icon>
                <el-input 
                  v-model="registerForm.nickname" 
                  placeholder="请输入昵称"
                />
              </div>
            </el-form-item>

            <!-- 手机号 -->
            <el-form-item prop="phone">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Iphone /></el-icon>
                <el-input 
                  v-model="registerForm.phone" 
                  placeholder="请输入手机号"
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

            <!-- 验证码 -->
            <el-form-item prop="smsCode">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Key /></el-icon>
                <el-input 
                  v-model="registerForm.smsCode" 
                  placeholder="请输入验证码"
                />
              </div>
            </el-form-item>

            <!-- 邮箱 -->
            <el-form-item prop="email">
              <div class="input-with-icon">
                <el-icon class="custom-prefix-icon"><Message /></el-icon>
                <el-input 
                  v-model="registerForm.email" 
                  placeholder="请输入邮箱"
                />
              </div>
            </el-form-item>

            <div class="form-options">
              <div class="switch-row">
                <span class="switch-label">我已阅读并同意《用户协议》和《隐私政策》</span>
                <el-switch v-model="registerForm.agreement" class="custom-switch" />
              </div>
            </div>

            <div class="form-buttons">
              <el-button class="login-btn" @click="$router.push('/login')">返回登录</el-button>
              <el-button class="register-btn" type="primary" @click="handleRegister">注 册</el-button>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 底部旋转效果 -->
    <div class="rotating-background">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { User, Lock, UserFilled, Iphone, Key, Message } from '@element-plus/icons-vue'
import { registerUser, sendSmsCode } from '../api/user'

const router = useRouter()
const registerFormRef = ref<FormInstance>()

// 注册表单数据
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  phone: '',
  email: '',
  smsCode: '',
  sex: 1,  // 默认为男性
  agreement: false
})

// 验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: Function) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  smsCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 4, message: '验证码长度为4位', trigger: 'blur' }
  ]
}

// 获取验证码相关
const isGettingCode = ref(false)
const countdown = ref(60)
const codeButtonText = ref('获取验证码')

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
    if (!/^1[3-9]\d{9}$/.test(registerForm.phone)) {
      ElMessage.warning('请输入正确的手机号')
      return
    }

    // 使用新的GET方式发送短信验证码
    await sendSmsCode(registerForm.phone)
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error) {
    console.error('获取验证码失败：', error)
  }
}

// 注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    // 表单验证
    await registerFormRef.value.validate()
    
    if (!registerForm.agreement) {
      ElMessage.warning('请阅读并同意用户协议和隐私政策')
      return
    }

    // 调用注册接口
    const { confirmPassword, agreement, ...registerData } = registerForm
    await registerUser(registerData)
    
    ElMessage.success('注册成功')
    router.push('/login')
  } catch (error: any) {
    // if (error.message) {
    //   ElMessage.error(error.message)
    // }
    console.error('注册失败：', error)
  }
}
</script>

<style scoped>
.register-page {
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

/* 主内容区样式 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
  padding-top: 80px; /* 为顶部导航栏留出空间 */
}

.title-section {
  position: absolute;
  top: 10%;
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

/* 注册容器 */
.register-container {
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

/* 注册卡片样式 */
.register-card {
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

.register-card:hover {
  background-color: rgba(0, 0, 0, 0.25);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.register-title {
  color: #00A3FF;
  text-align: center;
  margin-bottom: 35px;
  font-size: 24px;
  font-weight: normal;
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
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  border: none;
  color: white;
  border-radius: 20px;
  height: 40px;
  padding: 0 15px;
  font-size: 14px;
}

.get-code-btn:disabled {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.5);
}

.form-options {
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

:deep(.custom-switch .el-switch__core) {
  background-color: rgba(255, 255, 255, 0.2);
  border-color: transparent;
  width: 44px !important;
  height: 22px !important;
}

:deep(.custom-switch.is-checked .el-switch__core) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  border-color: transparent;
}

:deep(.custom-switch .el-switch__core .el-switch__action) {
  background-color: white;
  height: 18px;
  width: 18px;
}

.form-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.login-btn {
  width: 48%;
  border-color: #00A3FF;
  color: #00A3FF;
  border-radius: 50px;
  height: 46px;
  font-size: 16px;
}

.register-btn {
  width: 48%;
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  border: none;
  border-radius: 50px;
  height: 46px;
  font-size: 16px;
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
  border: 1px solid rgba(0, 163, 255, 0.2);
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