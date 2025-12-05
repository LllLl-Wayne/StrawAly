'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import Dock from '@/components/layout/Dock'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import Iridescence from '@/components/background/iridescence'
import { useTheme } from '@/components/theme/theme-provider'
import { useAccent } from '@/components/theme/accent-provider'
import { accentHex } from '@/lib/themeAccent'
import { ConfigProvider } from 'antd'

interface AppLayoutProps {
  children: React.ReactNode
}

function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { accent, customColor } = useAccent()
  const accentColor = accentHex(accent, customColor)
  const { theme } = useTheme()
  
  const dockItems = [
    {      icon: (
        <Image
          src="/dashboard.svg"
          alt="仪表板"
          width={24}
          height={24}
          className="dock-primary-icon"
        />
      ),
      label: '仪表板',
      onClick: () => {
        router.push('/')
      }
    },
    {      icon: (
        <Image
          src="/file.svg"
          alt="草莓管理"
          width={24}
          height={24}
          className="dock-primary-icon"
        />
      ),
      label: '草莓管理',
      onClick: () => {
        // 修正路径为实际的草莓管理页面
        router.push('/strawberries')
      }
    },
    {      icon: (
        <Image
          src="/Scan.svg"
          alt="扫码记录"
          width={24}
          height={24}
          className="dock-primary-icon"
        />
      ),
      label: '扫码记录',
      onClick: () => {
        router.push('/scan')
      }
    },
    {      icon: (
        <Image
          src="/count.svg"
          alt="数据统计"
          width={24}
          height={24}
          className="dock-primary-icon"
        />
      ),
      label: '数据统计',
      onClick: () => {
        router.push('/statistics')
      }
    },
    {      icon: (
        <Image
          src="/setting.svg"
          alt="系统设置"
          width={24}
          height={24}
          className="dock-primary-icon"
        />
      ),
      label: '系统设置',
      onClick: () => {
        router.push('/settings')
      }
    }
  ]

  return (
    <ConfigProvider theme={{ token: { colorPrimary: accentColor, colorInfo: accentColor } }}>
    <div className="min-h-screen bg-transparent relative pb-24">
      {/* 浅色模式白色底 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -4, pointerEvents: 'none' }} className="light-pillar-base" />
      {/* Iridescence 背景动效 */}
      <Iridescence
        style={{ position: 'fixed', inset: 0, zIndex: -3, pointerEvents: 'none' }}
        color={theme === 'dark' ? [0.3, 0.41, 0.46] : [1, 1, 1]}
        speed={0.1}
        amplitude={0.1}
        mouseReact={false}
      />
      {/* 全局亚克力覆盖层，仅作用于背景 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }} className="acrylic-overlay" />
      
      {/* 顶部Logo和主题切换 */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Image 
                  src="/logo.gif" 
                  alt="草莓生长溯源系统" 
                  width={32} 
                  height={32}
                  unoptimized
                  className="w-8 h-8"
                />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  草莓生长溯源系统
                </span>
              </div>
            </div>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      {/* 主要内容 */}
      <main className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      
      {/* 底部Dock导航 */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <Dock
          items={dockItems}
          panelHeight={68}
          baseItemSize={50}
          magnification={70}
        />
      </div>
    </div>
    </ConfigProvider>
  )
}

export default AppLayout
