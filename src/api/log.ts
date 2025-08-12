import axios from 'axios'

// API响应类型
interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ComfyUI 日志查询参数类型
export interface ComfyuiLogQueryParams {
  orderBy?: number // 排序字段{0:根据example的字段排序，1:根据耗时排序}
  begin?: string // 开始时间
  end?: string // 结束时间
  pageNum: number // 页码
  pageSize: number // 每页记录数
  id?: string
  userId?: number
  username?: string
  nickname?: string
  role?: string
  methodName?: string
  summary?: string
  args?: string
  excuteTime?: string
  costTime?: number
  result?: string
  state?: string
  error?: string
}

// ComfyUI 日志条目类型
export interface ComfyuiLogItem {
  id: string
  userId: number
  username: string
  nickname: string
  role: string
  methodName: string
  summary: string
  args: string
  excuteTime: string
  costTime: number
  result: string
  state: string
  error: string
}

// ComfyUI 日志分页结果类型
export interface ComfyuiLogPageResult {
  total?: number;
  list?: ComfyuiLogItem[];
  pageNum?: number;
  pageSize?: number;
  pages?: number;
}

/**
 * 查询 ComfyUI 日志
 * @param params 查询参数
 * @returns Promise 返回日志分页结果
 */
export function getComfyuiLogs(params: ComfyuiLogQueryParams) {
  // 获取token
  const token = localStorage.getItem('token')
  const bearerToken = token?.startsWith('Bearer ') ? token : `Bearer ${token}`

  // 构建查询参数
  const queryParams = new URLSearchParams()

  // 添加所有非空参数
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // 特殊处理 orderBy，确保它是数值 0 或 1
      if (key === 'orderBy') {
        if (value === 0 || value === 1) {
          queryParams.append(key, value.toString())
        }
      } else {
        queryParams.append(key, value.toString())
      }
    }
  })

  // 发送请求
  return axios.get(`/api/comfyui/logs?${queryParams.toString()}`, {
    headers: {
      'Authorization': bearerToken,
      'token': bearerToken,
      'Content-Type': 'application/json'
    }
  }).then(response => response.data)
} 