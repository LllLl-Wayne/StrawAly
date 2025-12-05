import axios, { AxiosInstance } from 'axios'
import { getSystemConfig } from './config'

// 创建或复用单例 API 实例
let apiInstance: AxiosInstance | null = null
const createApiInstance = (): AxiosInstance => {
  if (apiInstance) return apiInstance
  const config = getSystemConfig()
  const instance = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: config.apiTimeout,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器
  const DEBUG = process.env.NEXT_PUBLIC_API_DEBUG === 'true'
  instance.interceptors.request.use(
    (config) => {
      if (DEBUG) console.log('API请求:', config.method?.toUpperCase(), config.baseURL + config.url)
      return config
    },
    (error) => {
      if (DEBUG) console.error('请求拦截器错误:', error)
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      if (DEBUG) console.log('API响应成功:', response.status, response.config.url)
      return response
    },
    (error) => {
      if (DEBUG) {
        const url = error.config?.baseURL + error.config?.url
        const code = error.response?.status
        console.error('API错误:', error.message, url, code ?? '')
      }
      return Promise.reject(error)
    }
  )

  apiInstance = instance
  return apiInstance
}

// 简易缓存与去重
const CACHE_TTL_MS = 30_000
const cache = new Map<string, { ts: number; data: any }>()
const inflight = new Map<string, Promise<any>>()

function buildKey(url: string, params?: Record<string, any>): string {
  return `${url}?${params ? JSON.stringify(params) : ''}`
}

async function getWithCache<T>(url: string, params?: Record<string, any>): Promise<T> {
  const api = createApiInstance()
  const key = buildKey(url, params)
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.ts < CACHE_TTL_MS) {
    return hit.data as T
  }
  if (inflight.has(key)) {
    return inflight.get(key) as Promise<T>
  }
  const p = (async () => {
    let lastErr: any = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await api.get(url, { params })
        cache.set(key, { ts: Date.now(), data: resp.data })
        return resp.data as T
      } catch (err) {
        lastErr = err
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempt)))
      }
    }
    throw lastErr
  })().then((data) => {
    inflight.delete(key)
    return data
  }).catch((err) => {
    inflight.delete(key)
    throw err
  })
  inflight.set(key, p)
  return p
}

const USE_MOCK = process.env.NEXT_PUBLIC_API_USE_MOCK === 'true'

function mockStrawberries(): Strawberry[] {
  const base: Omit<Strawberry, 'id'>[] = [
    { qr_code: 'SB_20251204_192815_01A789C', status: 'active', created_at: '2025-12-04 19:28:15' },
    { qr_code: 'SB_20251204_192812_D9AE83B8', status: 'active', created_at: '2025-12-04 19:28:12' },
    { qr_code: 'SB_20251204_192810_7D838FCD', status: 'active', created_at: '2025-12-04 19:28:10' },
    { qr_code: 'SB_20251204_148337_41453193', status: 'active', created_at: '2025-12-04 14:03:38' },
    { qr_code: 'SB_20251009_101344_F6C46F2B', status: 'active', created_at: '2025-10-09 10:31:44', latest_recorded_at: '2025-12-04 13:05:46' },
    { qr_code: 'SB_20251009_102109_016C91D9', status: 'active', created_at: '2025-10-09 10:21:09' },
    { qr_code: 'ST_20251009_101958_61756E5E', status: 'active', created_at: '2025-10-09 10:19:58', latest_recorded_at: '2025-12-04 12:09:25' },
    { qr_code: 'SB_20251009_100211_82EC1F50', status: 'inactive', created_at: '2025-10-09 10:02:11' },
    { qr_code: 'ST_20251009_095652_5FA03EC0', status: 'inactive', created_at: '2025-10-09 09:56:52' },
    { qr_code: 'SB_20251009_095801_2467259', status: 'inactive', created_at: '2025-10-09 09:50:01', latest_recorded_at: '2025-12-04 14:04:53' },
  ]
  return base.map((b, i) => ({ id: 20 - i, ...b }))
}

function mockStatistics(strawberries: Strawberry[]): Statistics {
  const total = strawberries.length
  const status_counts: Record<string, number> = {}
  strawberries.forEach(s => {
    const st = s.strawberry_status || s.status || 'active'
    status_counts[st] = (status_counts[st] || 0) + 1
  })
  return {
    total_strawberries: total,
    total_records: 12,
    today_new_strawberries: 1,
    week_new_strawberries: 1,
    status_counts,
    growth_stage_counts: { seedling: 2, flowering: 3, fruiting: 3, ripening: 1, mature: 1 },
    health_status_counts: { healthy: 6, warning: 3, sick: 1 },
  }
}

// API响应类型定义
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  timestamp: string
}

// 草莓数据类型
export interface Strawberry {
  id: number
  qr_code: string
  status: string
  created_at: string
  notes?: string
  strawberry_status?: string
  strawberry_created_at?: string
  latest_recorded_at?: string
}

// 观察记录数据类型
export interface ObservationRecord {
  id: number
  strawberry_id: number
  image_path: string
  ai_description?: string
  growth_stage?: string
  health_status?: string
  size_estimate?: string
  color_description?: string
  recorded_at: string
}

// 完整草莓信息类型
export interface StrawberryFullInfo {
  strawberry: Strawberry
  records: ObservationRecord[]
}

// 统计数据类型
export interface Statistics {
  total_strawberries: number
  total_records: number
  today_new_strawberries: number
  week_new_strawberries: number
  status_counts: Record<string, number>
  growth_stage_counts: Record<string, number>
  health_status_counts: Record<string, number>
}

// AI配置类型
export interface AIConfig {
  enabled: boolean
  provider: string
  api_key: string
  api_url?: string
  app_id?: string
  model: string
  max_tokens: number
  temperature: number
  custom_prompt: string
}

// AI状态类型
export interface AIStatus {
  enabled: boolean
  provider: string
  has_api_key: boolean
}

// API方法
export const apiService = {
  // 健康检查
  async healthCheck(): Promise<ApiResponse> {
    const api = createApiInstance()
    const response = await api.get('/health')
    return response.data
  },

  // 草莓管理
  async getStrawberries(params?: { status?: string; limit?: number }): Promise<ApiResponse<Strawberry[]>> {
    try {
      const response = await getWithCache<ApiResponse<Strawberry[]>>('/strawberries', params)
      return response
    } catch (error: any) {
      const shouldMock = USE_MOCK || (!error?.response && typeof window !== 'undefined')
      if (shouldMock) {
        const data = mockStrawberries().filter(s => (params?.status ? (s.strawberry_status || s.status) === params.status : true))
        return { success: true, message: 'mock', data, timestamp: new Date().toISOString() }
      }
      throw error
    }
  },
  
  // 删除草莓记录
  async deleteStrawberry(id: number): Promise<ApiResponse> {
    const api = createApiInstance()
    const response = await api.post(`/strawberries/${id}/delete`)
    return response.data
  },

  // 删除观察记录
  async deleteStrawberryRecord(strawberryId: number, recordId: number): Promise<ApiResponse> {
    const api = createApiInstance()
    const response = await api.post(`/strawberries/${strawberryId}/records/${recordId}/delete`)
    return response.data
  },

  async createStrawberry(data: { notes?: string; custom_prefix?: string }): Promise<ApiResponse<Strawberry>> {
    const api = createApiInstance()
    const response = await api.post('/strawberries', data)
    return response.data
  },

  async getStrawberryDetail(id: number): Promise<ApiResponse<StrawberryFullInfo>> {
    const api = createApiInstance()
    const response = await api.get(`/strawberries/${id}`)
    return response.data
  },

  async updateStrawberryStatus(id: number, status: string): Promise<ApiResponse> {
    const api = createApiInstance()
    const response = await api.post(`/strawberries/${id}/status`, { status })
    return response.data
  },

  async searchStrawberryByQR(qrCode: string): Promise<ApiResponse<StrawberryFullInfo>> {
    const api = createApiInstance()
    const response = await api.get(`/strawberries/search?qr_code=${encodeURIComponent(qrCode)}`)
    return response.data
  },

  // 观察记录
  async addObservationRecord(strawberryId: number, formData: FormData): Promise<ApiResponse<ObservationRecord>> {
    const api = createApiInstance()
    const response = await api.post(`/strawberries/${strawberryId}/records`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 统计数据
  async getStatistics(): Promise<ApiResponse<Statistics>> {
    try {
      const response = await getWithCache<ApiResponse<Statistics>>('/statistics')
      return response
    } catch (error: any) {
      const shouldMock = USE_MOCK || (!error?.response && typeof window !== 'undefined')
      if (shouldMock) {
        const strawberries = mockStrawberries()
        const stats = mockStatistics(strawberries)
        return { success: true, message: 'mock', data: stats, timestamp: new Date().toISOString() }
      }
      throw error
    }
  },

  // AI服务
  async getAIConfig(): Promise<ApiResponse<AIConfig>> {
    const api = createApiInstance()
    const response = await api.get('/ai/config')
    return response.data
  },

  async updateAIConfig(config: Partial<AIConfig>): Promise<ApiResponse> {
    const api = createApiInstance()
    const response = await api.post('/ai/config', config)
    return response.data
  },

  async testAIConnection(): Promise<ApiResponse> {
    const api = createApiInstance()
    const response = await api.post('/ai/test')
    return response.data
  },

  async getAIStatus(): Promise<ApiResponse<AIStatus>> {
    const api = createApiInstance()
    const response = await api.get('/ai/status')
    return response.data
  },

  async analyzeImageWithAI(formData: FormData): Promise<ApiResponse<{ description: string; provider: string }>> {
    const api = createApiInstance()
    const response = await api.post('/ai/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 保存扫码截图到照片目录
  async capturePhoto(formData: FormData): Promise<ApiResponse<{ filename: string; saved_path: string }>> {
    const api = createApiInstance()
    const response = await api.post('/photos/capture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // 图片服务
  getImageUrl(imagePath: string): string {
    const config = getSystemConfig()
    return `${config.apiBaseUrl}/images/${encodeURIComponent(imagePath)}`
  },
}

export { createApiInstance }
export default apiService
