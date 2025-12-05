import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const raw = dateStr.trim()

  // 处理 MySQL 风格 "YYYY-MM-DD HH:mm:ss[.ffffff]"，按本地时间解析
  const mysqlMatch = raw.match(/^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-9]{2}:[0-9]{2}:[0-9]{2})(\.[0-9]+)?$/)
  if (mysqlMatch) {
    const normalized = `${mysqlMatch[1]}T${mysqlMatch[2]}${mysqlMatch[3] ?? ''}`
    const d = new Date(normalized)
    return isNaN(d.getTime()) ? raw : d.toLocaleString('zh-CN', { hour12: false })
  }

  // 处理纯数字时间戳（秒或毫秒）
  if (/^\d+$/.test(raw)) {
    const ms = raw.length === 10 ? parseInt(raw, 10) * 1000 : parseInt(raw, 10)
    const d = new Date(ms)
    return isNaN(d.getTime()) ? raw : d.toLocaleString('zh-CN', { hour12: false })
  }

  // 其他情况：ISO字符串或包含时区的字符串（Z/+08:00等），直接交给 Date 处理
  const normalized = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(raw) ? raw.replace(' ', 'T') : raw
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? raw : d.toLocaleString('zh-CN', { hour12: false })
}

/**
 * 格式化状态显示
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'active': '活跃',
    'inactive': '非活跃',
    'harvested': '已收获',
    'dead': '非活跃',
    'healthy': '健康',
    'warning': '注意',
    'sick': '病态',
    'seedling': '幼苗期',
    'flowering': '开花期',
    'fruiting': '结果期',
    'ripening': '成熟期',
    'mature': '完全成熟'
  }
  return statusMap[status] || status
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

/**
 * 调整颜色亮度
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  // 移除#号
  hex = hex.replace('#', '')
  
  // 转换为RGB
  const num = parseInt(hex, 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = (num >> 8 & 0x00FF) + amt
  const B = (num & 0x0000FF) + amt
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
}
