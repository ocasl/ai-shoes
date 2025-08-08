<template>
  <div class="user-profile">
    <el-dialog
      v-model="dialogVisible"
      title="个人信息"
      width="520px"
      :close-on-click-modal="false"
      :show-close="true"
      :top="dialogTop"
      :z-index="2000"
      class="user-profile-dialog"
      :fullscreen="false"
      append-to-body
      destroy-on-close
    >
      <div class="dialog-content">
        <el-form :model="userForm" ref="userFormRef" label-width="80px" class="profile-form">
          <el-form-item label="用户名">
            <el-input v-model="userForm.username" disabled>
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="userForm.nickname" disabled>
              <template #prefix>
                <el-icon><UserFilled /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="userForm.sex" class="gender-group" disabled>
              <el-radio :value="1" label="男" border></el-radio>
              <el-radio :value="0" label="女" border></el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="手机号">
            <el-input v-model="userForm.phone" disabled>
              <template #prefix>
                <el-icon><Iphone /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          <!-- 密码字段在查看模式下隐藏 -->
          <!-- <el-form-item label="密码" prop="password">
            <el-input v-model="userForm.password" type="password" placeholder="不修改请留空" show-password>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item> -->
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" plain>关闭</el-button>
          <!-- <el-button type="primary" @click="handleUpdate" :loading="loading">确认</el-button> -->
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineExpose, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
// import { updateUserInfo } from '../api/user'
import { getCurrentUserInfo } from '../api/user'
import { User, UserFilled, Iphone, Lock } from '@element-plus/icons-vue'

// 对话框显示状态
const dialogVisible = ref(false)
// 对话框距离顶部的距离
const dialogTop = ref('5vh')
// 加载状态
// const loading = ref(false)

// 表单引用
const userFormRef = ref<FormInstance>()

// 用户表单数据
const userForm = reactive({
  id: 0,
  uid: '',
  username: '',
  nickname: '',
  sex: 1,
  phone: '',
  // password: ''
} as {
  id: number
  uid: string
  username: string
  nickname: string
  sex: number
  phone: string
  // password: string
  [key: string]: any
})

// 表单验证规则 - 查看模式不需要验证
/* const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 10, message: '长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  sex: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
} */

// 打开对话框并设置用户信息
const open = async (userInfo: any = null) => {
  dialogVisible.value = true
  
  try {
    // 尝试从服务器获取最新的用户信息
    const response = await getCurrentUserInfo()
    
    if (response && response.code === 0 && response.data) {
      const userData = response.data
      
      // 更新本地存储
      localStorage.setItem('userInfo', JSON.stringify(userData))
      
      // 复制用户信息到表单
      Object.keys(userForm).forEach(key => {
        if (key in userData) {
          userForm[key] = userData[key]
        }
      })
    } else {
      // 如果获取失败，使用传入的用户信息
      if (userInfo) {
        Object.keys(userForm).forEach(key => {
          if (key in userInfo) {
            userForm[key] = userInfo[key]
          }
        })
      }
    }
  } catch (error) {
    console.warn('获取最新用户信息失败，使用本地缓存:', error)
    
    // 如果获取失败，使用传入的用户信息
    if (userInfo) {
      Object.keys(userForm).forEach(key => {
        if (key in userInfo) {
          userForm[key] = userInfo[key]
        }
      })
    }
  }
  
  // 确保对话框内容正确显示
  nextTick(() => {
    const dialogElement = document.querySelector('.user-profile-dialog .el-dialog') as HTMLElement
    if (dialogElement) {
      dialogElement.style.display = 'flex'
      dialogElement.style.flexDirection = 'column'
      dialogElement.style.height = 'auto'
      dialogElement.style.maxHeight = '80vh'
    }
  })
}

// 更新用户信息 - 查看模式下注释掉
/* const handleUpdate = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    loading.value = true
    
    // 构建更新数据
    const updateData: any = {
      id: userForm.id,
      uid: userForm.uid,
      username: userForm.username,
      nickname: userForm.nickname,
      sex: userForm.sex,
      phone: userForm.phone
    }
    
    // 如果有填写密码，则添加密码字段
    if (userForm.password) {
      updateData.password = userForm.password
    }
    
    // 调用更新接口
    const res = await updateUserInfo(updateData)
    
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('个人信息更新成功')
      dialogVisible.value = false
      
      // 更新本地存储的用户信息
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      Object.assign(userInfo, updateData)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      return true
    } else {
      ElMessage.error(res.msg || '更新失败')
      return false
    }
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
    return false
  } finally {
    loading.value = false
  }
} */

// 暴露方法
defineExpose({
  open
})
</script>

<style scoped>
.user-profile {

}

:deep(.user-profile-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-dialog) {
  margin-top: 0 !important;
  margin: auto;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  height: auto !important;
  max-height: 80vh !important;
  overflow: visible;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

:deep(.el-dialog__header) {
  padding: 22px 24px;
  border-bottom: 1px solid rgba(0, 163, 255, 0.1);
  font-size: 20px;
  font-weight: 600;
  color: #00A3FF;
  text-align: center;
  position: relative;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: #00A3FF;
}

:deep(.el-dialog__headerbtn) {
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

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #00A3FF;
  font-size: 16px;
}

:deep(.el-dialog__body) {
  padding: 20px 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 320px;
  display: block !important;
  position: relative;
}

:deep(.el-dialog__footer) {
  padding: 15px 24px;
  border-top: 1px solid rgba(0, 163, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.dialog-content {
  width: 100%;
  height: 100%;
  min-height: 320px;
  padding: 5px 0;
}

.profile-form {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
  display: block;
}

:deep(.el-input__wrapper) {
  height: 40px;
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(0, 163, 255, 0.2) inset !important;
  padding: 0 15px;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(0, 163, 255, 0.4) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #00A3FF inset !important;
}

:deep(.el-input__prefix) {
  color: #00A3FF;
  margin-right: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
  font-size: 15px;
}

:deep(.el-button) {
  min-height: 40px;
  min-width: 100px;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

:deep(.el-button--primary) {
  background: linear-gradient(90deg, #00A3FF, #0AFFFF);
  border: none;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 163, 255, 0.3);
}

:deep(.el-button--default) {
  border-color: rgba(0, 163, 255, 0.3);
  color: #00A3FF;
}

:deep(.el-radio) {
  margin-right: 20px;
}

:deep(.el-radio.is-bordered) {
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  border-color: rgba(0, 163, 255, 0.2);
}

:deep(.el-radio.is-bordered.is-checked) {
  border-color: #00A3FF;
  background-color: rgba(0, 163, 255, 0.05);
}

.gender-group {
  display: flex;
  gap: 15px;
}

.dialog-footer {
  display: flex;
  gap: 15px;
}
</style> 