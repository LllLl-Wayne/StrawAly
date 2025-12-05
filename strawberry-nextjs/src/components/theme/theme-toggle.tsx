'use client'

import '@ant-design/v5-patch-for-react-19'
import { useTheme } from './theme-provider'
import { Switch } from 'antd'
import { useAccent } from '@/components/theme/accent-provider'
import { accentHex, hexToRgba } from '@/lib/themeAccent'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const { accent, customColor } = useAccent()
  const accentColor = accentHex(accent, customColor)

  const changeTheme = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light')
  }

  return (
    <Switch
      checked={theme === 'dark'}
      onChange={changeTheme}
      checkedChildren="Dark"
      unCheckedChildren="Light"
      className="theme-toggle-switch"
      style={theme === 'dark' ? { backgroundColor: hexToRgba(accentColor, 0.3), borderColor: hexToRgba(accentColor, 0.3) } : undefined}
    />
  )
}
