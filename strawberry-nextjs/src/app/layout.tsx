import type { Metadata } from 'next'

// import { Inter } from 'next/font/google'
import '@ant-design/v5-patch-for-react-19'
import './globals.css'
import 'antd/dist/reset.css'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { AccentProvider } from '@/components/theme/accent-provider'
import { BackgroundProvider } from '@/components/background/background-provider'
import { ToastProvider } from '@/components/ui/toast'
import AppLayout from './app-layout'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '草莓生长溯源管理系统',
  description: '基于Next.js的现代化草莓生长溯源管理系统',
  icons: {
    icon: '/logo.gif',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="system">
          <AccentProvider>
            <BackgroundProvider>
              <ToastProvider>
                <AppLayout>
                  {children}
                </AppLayout>
              </ToastProvider>
            </BackgroundProvider>
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
