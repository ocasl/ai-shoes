/**
 * 用户相关API接口
 */

import request from "../utils/request";
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserStats,
  UserSettings,
  UserSession,
} from "../types/user";

// API响应类型
interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

// 这些函数已经不需要了，因为request实例已经配置了认证头

/**
 * 用户登录
 */
export async function loginUser(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await request.post("/login", credentials);

    console.log("用户登录响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("用户登录错误:", error);
    throw error;
  }
}

/**
 * 用户注册
 */
export async function registerUser(
  userData: RegisterRequest
): Promise<ApiResponse<User>> {
  try {
    const response = await request.post("/user/register", userData);

    console.log("用户注册响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("用户注册错误:", error);
    throw error;
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUserInfo(): Promise<ApiResponse<User>> {
  try {
    const response = await request.get("/user/info");

    console.log("获取用户信息响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("获取用户信息错误:", error);
    throw error;
  }
}

/**
 * 更新用户信息
 */
export async function updateUserInfo(
  userData: UpdateUserRequest
): Promise<ApiResponse<User>> {
  try {
    const response = await request.put("/user/update", userData);

    console.log("更新用户信息响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("更新用户信息错误:", error);
    throw error;
  }
}

/**
 * 修改密码
 */
export async function changePassword(
  passwordData: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await request.put("/user/password", passwordData);

    console.log("修改密码响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("修改密码错误:", error);
    throw error;
  }
}

/**
 * 用户登出
 */
export async function logoutUser(): Promise<ApiResponse<void>> {
  try {
    const response = await request.post("/logout", {});

    console.log("用户登出响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("用户登出错误:", error);
    throw error;
  }
}

// 为了兼容现有代码，提供logout别名
export const logout = logoutUser;

/**
 * 用户升级/更新会员等级 (根据邀请码升级用户权限)
 */
export async function upgradeUser(upgradeData: {
  inviteCode: string;
}): Promise<ApiResponse<User>> {
  try {
    const response = await request.post("/user/upgrade", upgradeData);

    console.log("用户升级响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("用户升级错误:", error);
    throw error;
  }
}

/**
 * 刷新token (暂时保留，可能需要根据实际API调整)
 */
export async function refreshToken(
  refreshToken: string
): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await request.post("/refresh", {
      refreshToken,
    });

    console.log("刷新token响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("刷新token错误:", error);
    throw error;
  }
}

/**
 * 获取用户统计信息 (暂时保留，可能需要根据实际API调整)
 */
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  try {
    const response = await request.get("/user/stats");

    console.log("获取用户统计响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("获取用户统计错误:", error);
    throw error;
  }
}

/**
 * 获取用户设置 (暂时保留，可能需要根据实际API调整)
 */
export async function getUserSettings(): Promise<ApiResponse<UserSettings>> {
  try {
    const response = await request.get("/user/settings");

    console.log("获取用户设置响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("获取用户设置错误:", error);
    throw error;
  }
}

/**
 * 更新用户设置 (暂时保留，可能需要根据实际API调整)
 */
export async function updateUserSettings(
  settings: Partial<UserSettings>
): Promise<ApiResponse<UserSettings>> {
  try {
    const response = await request.put("/user/settings", settings);

    console.log("更新用户设置响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("更新用户设置错误:", error);
    throw error;
  }
}

/**
 * 获取用户会话列表 (暂时保留，可能需要根据实际API调整)
 */
export async function getUserSessions(): Promise<ApiResponse<UserSession[]>> {
  try {
    const response = await request.get("/user/sessions");

    console.log("获取用户会话响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("获取用户会话错误:", error);
    throw error;
  }
}

/**
 * 终止指定会话 (暂时保留，可能需要根据实际API调整)
 */
export async function terminateSession(
  sessionId: string
): Promise<ApiResponse<void>> {
  try {
    const response = await request.delete(`/user/sessions/${sessionId}`);

    console.log("终止会话响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("终止会话错误:", error);
    throw error;
  }
}

/**
 * 上传用户头像 (暂时保留，可能需要根据实际API调整)
 */
export async function uploadAvatar(
  file: File
): Promise<ApiResponse<{ avatarUrl: string }>> {
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const response = await request.post("/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("上传头像响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("上传头像错误:", error);
    throw error;
  }
}

/**
 * 验证用户名是否可用 (暂时保留，可能需要根据实际API调整)
 */
export async function checkUsernameAvailability(
  username: string
): Promise<ApiResponse<{ available: boolean }>> {
  try {
    const response = await request.get(
      `/check-username?username=${encodeURIComponent(username)}`
    );

    console.log("检查用户名响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("检查用户名错误:", error);
    throw error;
  }
}

/**
 * 发送密码重置邮件 (暂时保留，可能需要根据实际API调整)
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<ApiResponse<void>> {
  try {
    const response = await request.post("/forgot-password", {
      email,
    });

    console.log("发送重置邮件响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("发送重置邮件错误:", error);
    throw error;
  }
}

/**
 * 重置密码 (暂时保留，可能需要根据实际API调整)
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ApiResponse<void>> {
  try {
    const response = await request.post("/reset-password", {
      token,
      newPassword,
    });

    console.log("重置密码响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("重置密码错误:", error);
    throw error;
  }
}

/**
 * 发送短信验证码
 */
export async function sendSmsCode(phone: string): Promise<ApiResponse<void>> {
  try {
    const response = await request.get(`/sendSms?phone=${phone}`);

    console.log("发送短信验证码响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("发送短信验证码错误:", error);
    throw error;
  }
}

/**
 * 短信验证码登录
 */
export async function smsLogin(credentials: {
  phone: string;
  code: string;
}): Promise<ApiResponse<LoginResponse>> {
  try {
    const response = await request.post("/smsLogin", credentials);

    console.log("短信验证码登录响应:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("短信验证码登录错误:", error);
    throw error;
  }
}
