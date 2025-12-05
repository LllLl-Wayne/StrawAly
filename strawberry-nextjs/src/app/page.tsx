'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { StatsCard } from '@/components/dashboard/stats-card'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { useToast } from '@/components/ui/toast'
// 移除遮罩，数据就绪后再显示卡片
import { apiService, Statistics } from '@/lib/api'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function Dashboard() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await apiService.getStatistics()
      setStats(response.data || null)
    } catch (error) {
      console.error('加载统计数据失败:', error)
      showToast({
        title: '错误',
        description: '加载统计数据失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    try {
      const response = await apiService.getStatistics()
      setStats(response.data || null)
      showToast({
        title: '成功',
        description: '统计数据已刷新',
        type: 'success'
      })
    } catch (error) {
      console.error('刷新统计数据失败:', error)
      showToast({
        title: '错误',
        description: '刷新统计数据失败',
        type: 'error'
      })
    }
  }

  useEffect(() => {
    loadStats()
    
    // 每5分钟自动刷新一次
    const interval = setInterval(loadStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8">
      
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: loading ? 0.6 : 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="title-bar">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Image 
                src="/dashboard.svg" 
                alt="仪表板" 
                width={40} 
                height={40}
                className="w-10 h-10 dark:invert"
              />
              系统仪表板
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">草莓生长溯源系统概览</p>
          </div>
          <div />
        </div>
      </motion.div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="草莓总数"
            value={stats.total_strawberries || 0}
            icon={<ChartBarIcon className="h-6 w-6" />}
            delay={0}
          />
          <StatsCard
            title="记录总数"
            value={stats.total_records || 0}
            icon={<DocumentTextIcon className="h-6 w-6" />}
            delay={0.1}
          />
          <StatsCard
            title="今日新增"
            value={stats.today_new_strawberries || 0}
            icon={<CalendarDaysIcon className="h-6 w-6" />}
            delay={0.2}
          />
          <StatsCard
            title="本周新增"
            value={stats.week_new_strawberries || 0}
            icon={<ClockIcon className="h-6 w-6" />}
            delay={0.3}
          />
        </div>
      )}

      {/* 快速操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <QuickActions onRefresh={refreshStats} />
      </motion.div>

      {/* 系统状态 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-6 border border-white/30 dark:border-gray-600/30"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          📊 系统状态
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-100/60 dark:bg-gray-800/20 backdrop-blur-md rounded-lg border border-gray-200/30 dark:border-gray-700/30">
            <div className="flex justify-center mb-2">
              <Image 
                src="/Normal.svg" 
                alt="系统正常" 
                width={32} 
                height={32}
                className="w-8 h-8 dark:invert"
              />
            </div>
            <div className="font-semibold text-green-800 dark:text-green-300">系统正常</div>
            <div className="text-sm text-green-600 dark:text-green-400">所有服务运行正常</div>
          </div>
          <div className="text-center p-4 bg-gray-100/60 dark:bg-gray-800/20 backdrop-blur-md rounded-lg border border-gray-200/30 dark:border-gray-700/30">
            <div className="flex justify-center mb-2">
              <Image 
                src="/refresh.svg" 
                alt="自动同步" 
                width={32} 
                height={32}
                className="w-8 h-8 dark:invert"
              />
            </div>
            <div className="font-semibold text-blue-800 dark:text-blue-300">自动同步</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">数据实时更新</div>
          </div>
          <div className="text-center p-4 bg-gray-100/60 dark:bg-gray-800/20 backdrop-blur-md rounded-lg border border-gray-200/30 dark:border-gray-700/30">
            <div className="flex justify-center mb-2">
              <Image 
                src="/aislogo.svg" 
                alt="AI服务" 
                width={32} 
                height={32}
                className="w-8 h-8 dark:invert"
              />
            </div>
            <div className="font-semibold text-purple-800 dark:text-purple-300">AI服务</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">智能分析可用</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
