import type { Accent } from '@/components/theme/accent-provider'

export function buttonAccentClasses(accent: Accent): string {
  switch (accent) {
    case 'blue':
      return 'bg-blue-500 text-white hover:bg-blue-600'
    case 'green':
      return 'bg-green-500 text-white hover:bg-green-600'
    case 'purple':
      return 'bg-purple-500 text-white hover:bg-purple-600'
    case 'orange':
      return 'bg-orange-500 text-white hover:bg-orange-600'
    case 'gray':
      return 'bg-gray-800 text-white hover:bg-gray-700'
    case 'black':
      return 'bg-black text-white hover:bg-black/80'
    case 'white':
      return 'bg-white text-black hover:bg-gray-100 border'
    default:
      return 'bg-pink-500 text-white hover:bg-pink-600'
  }
}

export function cardAccentBorderClasses(accent: Accent): string {
  switch (accent) {
    case 'blue':
      return 'border-l-blue-500'
    case 'green':
      return 'border-l-green-500'
    case 'purple':
      return 'border-l-purple-500'
    case 'orange':
      return 'border-l-orange-500'
    case 'gray':
      return 'border-l-gray-500'
    case 'black':
      return 'border-l-black'
    case 'white':
      return 'border-l-white'
    default:
      return 'border-l-pink-500'
  }
}

export function iconAccentClasses(accent: Accent): string {
  switch (accent) {
    case 'blue':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
    case 'green':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
    case 'purple':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
    case 'orange':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    case 'gray':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
    case 'black':
      return 'bg-black/10 dark:bg-white/10 text-black dark:text-white'
    case 'white':
      return 'bg-white dark:bg-white/10 text-black dark:text-white'
    default:
      return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-[#EC4899]'
  }
}

export function toggleAccentClasses(accent: Accent): { track: string; ring: string } {
  switch (accent) {
    case 'blue':
      return { track: 'peer-checked:bg-blue-600', ring: 'peer-focus:ring-blue-300' }
    case 'green':
      return { track: 'peer-checked:bg-green-600', ring: 'peer-focus:ring-green-300' }
    case 'purple':
      return { track: 'peer-checked:bg-purple-600', ring: 'peer-focus:ring-purple-300' }
    case 'orange':
      return { track: 'peer-checked:bg-orange-600', ring: 'peer-focus:ring-orange-300' }
    case 'gray':
      return { track: 'peer-checked:bg-gray-600', ring: 'peer-focus:ring-gray-300' }
    case 'black':
      return { track: 'peer-checked:bg-black', ring: 'peer-focus:ring-gray-300' }
    case 'white':
      return { track: 'peer-checked:bg-white', ring: 'peer-focus:ring-gray-300' }
    default:
      return { track: 'peer-checked:bg-pink-600', ring: 'peer-focus:ring-pink-300' }
  }
}

export function getContrastText(hex: string): 'black' | 'white' {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? 'black' : 'white'
}

export function buttonCustomStyle(hex: string): React.CSSProperties {
  return { backgroundColor: hex, color: getContrastText(hex) }
}

export function cardBorderCustomStyle(hex: string): React.CSSProperties {
  return { borderLeftColor: hex }
}

export function iconCustomStyle(hex: string): React.CSSProperties {
  return {
    backgroundColor: hex + '1A',
    color: getContrastText(hex),
  }
}

export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function accentHex(accent: Accent, customHex: string): string {
  switch (accent) {
    case 'blue':
      return '#2563EB'
    case 'green':
      return '#16A34A'
    case 'purple':
      return '#7C3AED'
    case 'orange':
      return '#F59E0B'
    case 'gray':
      return '#6B7280'
    case 'black':
      return '#000000'
    case 'white':
      return '#FFFFFF'
    case 'pink':
    default:
      return accent === 'custom' ? customHex : '#EC4899'
  }
}
