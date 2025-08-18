/**
 * 操作日志工具
 */

import { getCurrentUser } from './auth'

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

export enum LogAction {
  MATERIAL_UPLOAD = 'material_upload',
  MATERIAL_DELETE = 'material_delete',
  MATERIAL_DOWNLOAD = 'material_download',
  MATERIAL_VIEW = 'material_view',
  MATERIAL_EDIT = 'material_edit',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PERMISSION_DENIED = 'permission_denied',
  SECURITY_VIOLATION = 'security_violation'
}

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  action: LogAction
  userId?: string
  userName?: string
  details: Record<string, any>
  userAgent?: string
  ip?: string
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  /**
   * 记录日志
   */
  log(level: LogLevel, action: LogAction, details: Record<string, any> = {}) {
    const user = getCurrentUser()
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      action,
      userId: user?.id,
      userName: user?.name,
      details,
      userAgent: navigator.userAgent,
      ip: this.getClientIP()
    }

    this.logs.unshift(entry)
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 发送到服务器（如果需要）
    this.sendToServer(entry)
    
    // 控制台输出
    this.consoleLog(entry)
  }

  /**
   * 记录信息日志
   */
  info(action: LogAction, details: Record<string, any> = {}) {
    this.log(LogLevel.INFO, action, details)
  }

  /**
   * 记录警告日志
   */
  warn(action: LogAction, details: Record<string, any> = {}) {
    this.log(LogLevel.WARN, action, details)
  }

  /**
   * 记录错误日志
   */
  error(action: LogAction, details: Record<string, any> = {}) {
    this.log(LogLevel.ERROR, action, details)
  }

  /**
   * 记录调试日志
   */
  debug(action: LogAction, details: Record<string, any> = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log(LogLevel.DEBUG, action, details)
    }
  }

  /**
   * 获取日志列表
   */
  getLogs(filter?: {
    level?: LogLevel
    action?: LogAction
    userId?: string
    startTime?: Date
    endTime?: Date
  }): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level)
      }
      if (filter.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filter.action)
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId)
      }
      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!)
      }
      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!)
      }
    }

    return filteredLogs
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * 导出日志
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV()
    }
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取客户端IP（模拟）
   */
  private getClientIP(): string {
    // 在实际应用中，这应该从服务器获取
    return 'unknown'
  }

  /**
   * 发送日志到服务器
   */
  private async sendToServer(entry: LogEntry) {
    try {
      // 只发送重要的日志到服务器
      if (entry.level === LogLevel.ERROR || entry.action === LogAction.SECURITY_VIOLATION) {
        // 这里应该调用实际的API
        console.log('Sending log to server:', entry)
      }
    } catch (error) {
      console.error('Failed to send log to server:', error)
    }
  }

  /**
   * 控制台输出
   */
  private consoleLog(entry: LogEntry) {
    const message = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()} - ${entry.action}`
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.details)
        break
      case LogLevel.WARN:
        console.warn(message, entry.details)
        break
      case LogLevel.DEBUG:
        console.debug(message, entry.details)
        break
      default:
        console.log(message, entry.details)
    }
  }

  /**
   * 导出为CSV格式
   */
  private exportToCSV(): string {
    const headers = ['ID', 'Timestamp', 'Level', 'Action', 'User ID', 'User Name', 'Details']
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.level,
      log.action,
      log.userId || '',
      log.userName || '',
      JSON.stringify(log.details)
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// 创建全局日志实例
export const logger = new Logger()

// 便捷的日志记录函数
export function logMaterialUpload(materialId: string, fileName: string) {
  logger.info(LogAction.MATERIAL_UPLOAD, { materialId, fileName })
}

export function logMaterialDelete(materialId: string, fileName: string) {
  logger.warn(LogAction.MATERIAL_DELETE, { materialId, fileName })
}

export function logMaterialDownload(materialId: string, fileName: string) {
  logger.info(LogAction.MATERIAL_DOWNLOAD, { materialId, fileName })
}

export function logPermissionDenied(action: string, resource: string) {
  logger.warn(LogAction.PERMISSION_DENIED, { action, resource })
}

export function logSecurityViolation(violation: string, details: Record<string, any>) {
  logger.error(LogAction.SECURITY_VIOLATION, { violation, ...details })
}