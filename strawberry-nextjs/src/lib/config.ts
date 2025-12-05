// 配置管理
export interface SystemConfig {
  apiBaseUrl: string
  apiTimeout: number
  enableAI: boolean
}

// 默认配置
export const DEFAULT_CONFIG: SystemConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  apiTimeout: 30000,
  enableAI: true
}

// 配置存储键
const CONFIG_STORAGE_KEY = 'strawberry_system_config'

// 获取配置
export function getSystemConfig(): SystemConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG
  }
  
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      const config = JSON.parse(stored)
      return { ...DEFAULT_CONFIG, ...config }
    }
  } catch (error) {
    console.error('读取配置失败:', error)
  }
  
  return DEFAULT_CONFIG
}

// 保存配置
export function saveSystemConfig(config: Partial<SystemConfig>): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    const currentConfig = getSystemConfig()
    const newConfig = { ...currentConfig, ...config }
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig))
  } catch (error) {
    console.error('保存配置失败:', error)
  }
}

// 重置配置
export function resetSystemConfig(): void {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
  } catch (error) {
    console.error('重置配置失败:', error)
  }
}