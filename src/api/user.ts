import { post, get, put } from '../utils/request'

// 注册接口参数类型
interface RegisterParams {
  username: string
  password: string
  phone: string
  nickname: string
  email: string
  smsCode: string
  sex?: number
  avatar?: string
}

// 获取验证码参数类型
interface VerificationCodeParams {
  phone: string
}

// 验证码登录参数类型
interface SmsLoginParams {
  phone: string
  code: string
}

// 用户名密码登录参数类型
interface PasswordLoginParams {
  username: string
  password: string
}

// 用户信息类型
interface UserInfo {
  id?: number
  uid?: string
  username: string
  password?: string
  nickname: string
  sex: number
  avatar?: string
  phone?: string
  role?: string
  smsCode?: string
  [key: string]: any
}

// API响应类型
interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 注册用户
export function register(data: RegisterParams) {
  return post<ApiResponse>('/user/register', data)
}

// 获取验证码 (POST方式)
export function getVerificationCode(data: VerificationCodeParams) {
  const params = new URLSearchParams()
  params.append('phone', data.phone)
  return post<ApiResponse>('/smsRegister', params)
}

// 发送短信验证码 (GET方式)
export function sendSmsCode(phone: string) {
  return get<ApiResponse>(`/sendSms?phone=${encodeURIComponent(phone)}`)
}

// 验证码登录
export function smsLogin(data: SmsLoginParams) {
  return post<ApiResponse>('/smsLogin', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 用户名密码登录
export function passwordLogin(data: PasswordLoginParams) {
  // 创建FormData对象
  const formData = new FormData();
  formData.append('username', data.username);
  formData.append('password', data.password);
  
  return post<ApiResponse>('/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 退出登录
export function logout() {
  return post<ApiResponse>('/logout')
}

// 修改用户信息
export function updateUserInfo(data: UserInfo) {
  return put<ApiResponse>('/admin/update', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * 根据邀请码升级用户权限
 * @param id 用户ID
 * @param code 邀请码
 * @returns Promise
 */
export function upgradeUser(id: string, code: string) {
  return put(`/user/upgrade/${id}/${code}`);
}

/**
 * 检查token是否有效
 * @returns Promise
 */
export function checkToken() {
  return get('/user/check-token');
}

/**
 * 获取当前登录用户信息
 * @returns Promise 返回当前用户信息
 */
export function getCurrentUserInfo() {
  return get<ApiResponse>('/user/info');
} 