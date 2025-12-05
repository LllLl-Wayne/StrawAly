'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon, CameraIcon } from '@heroicons/react/24/outline'
import { ReloadOutlined } from '@ant-design/icons'
import Image from 'next/image'

interface QuickActionsProps {
  onRefresh: () => void
}

export function QuickActions({ onRefresh }: QuickActionsProps) {
  const actions = [
    {
      title: '创建新草莓',
      description: '添加新的草莓到系统中',
      icon: <Image src="/plus-1469-svgrepo-com (2).svg" alt="创建新草莓" width={24} height={24} className="w-6 h-6" />,
      href: '/strawberries/create',
      color: 'bg-green-100 text-green-800'
    },
    {
      title: '扫码记录',
      description: '扫描二维码添加观察记录',
      icon: <CameraIcon className="h-6 w-6" />,
      href: '/scan',
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-100 dark:text-blue-600'
    },
    {
      title: '刷新数据',
      description: '更新最新的统计信息',
      icon: <ReloadOutlined className="qa-reload-icon" />,
      onClick: onRefresh,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-100 dark:text-purple-600'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚀 快速操作
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {action.href ? (
                <Link href={action.href}>
                  <div className="p-4 rounded-lg border border-white/20 dark:border-gray-700/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                        {action.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div 
                  onClick={action.onClick}
                  className="p-4 rounded-lg border border-white/20 dark:border-gray-700/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-200`}>
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
