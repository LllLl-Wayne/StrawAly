'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PieChart } from '@/components/ui/pie-chart'
import { useToast } from '@/components/ui/toast'
// 取消遮罩，按数据就绪再显示卡片
import { apiService, Statistics } from '@/lib/api'
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { Button as AntButton, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useAccent } from '@/components/theme/accent-provider'
import { accentHex, hexToRgba, getContrastText } from '@/lib/themeAccent'
import Image from 'next/image'

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const { accent, customColor } = useAccent()
  const accentColor = accentHex(accent, customColor)

  const loadStatistics = async () => {
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
    loadStatistics()
  }, [])

  // 标签与颜色映射（供饼图使用）
  const statusLabels: Record<string, string> = {
    active: '活跃',
    inactive: '非活跃',
    harvested: '已收获'
  }
  const statusColors: Record<string, string> = {
    active: '#22c55e',
    inactive: '#6b7280',
    harvested: '#eab308'
  }

  const stageLabels: Record<string, string> = {
    seedling: '幼苗期',
    flowering: '开花期',
    fruiting: '结果期',
    ripening: '成熟期',
    mature: '完全成熟'
  }
  const stageColors: Record<string, string> = {
    seedling: '#3b82f6',
    flowering: '#a855f7',
    fruiting: '#f97316',
    ripening: '#ec4899',
    mature: '#ef4444'
  }

  const healthLabels: Record<string, string> = {
    healthy: '健康',
    warning: '注意',
    sick: '病态'
  }
  const healthColors: Record<string, string> = {
    healthy: '#22c55e',
    warning: '#eab308',
    sick: '#ef4444'
  }

  return (
    <div className="space-y-6">
      
      {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="title-bar">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Image 
                    src="/count.svg" 
                    alt="统计报告" 
                    width={32} 
                    height={32}
                    className="w-8 h-8 dark:invert"
                  />
                  统计报告
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">查看系统的详细统计数据和分析报告</p>
              </div>
              <Tooltip title="刷新统计">
                <AntButton
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={refreshStats}
                  className="hover:opacity-90 btn-accent"
                >
                  刷新统计
                </AntButton>
              </Tooltip>
            </div>
          </motion.div>

      {stats && (
        <>
          {/* 总体统计 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            { stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 总体统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-pink-600 mb-1">
                      {stats.total_strawberries || 0}
                    </div>
                    <div className="text-sm text-gray-600">草莓总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {stats.total_records || 0}
                    </div>
                    <div className="text-sm text-gray-600">记录总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {stats.today_new_strawberries || 0}
                    </div>
                    <div className="text-sm text-gray-600">今日新增</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {stats.week_new_strawberries || 0}
                    </div>
                    <div className="text-sm text-gray-600">本周新增</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 状态分布 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🔄 状态分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.status_counts && Object.keys(stats.status_counts).length > 0 ? (
                    <PieChart
                      data={Object.entries(stats.status_counts).map(([k, v]) => ({
                        label: (statusLabels as any)[k] || k,
                        value: v,
                        color: statusColors[k] || '#3b82f6'
                      }))}
                      size={180}
                      thickness={28}
                      legendPosition="bottom"
                      showCenter={false}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">暂无状态数据</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 生长阶段分布 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🌱 生长阶段分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.growth_stage_counts && Object.keys(stats.growth_stage_counts).length > 0 ? (
                    <PieChart
                      data={Object.entries(stats.growth_stage_counts).map(([k, v]) => ({
                        label: (stageLabels as any)[k] || k,
                        value: v,
                        color: stageColors[k] || '#3b82f6'
                      }))}
                      size={180}
                      thickness={28}
                      legendPosition="bottom"
                      showCenter={false}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">暂无生长阶段数据</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 健康状态分布 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💚 健康状态分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.health_status_counts && Object.keys(stats.health_status_counts).length > 0 ? (
                    <PieChart
                      data={Object.entries(stats.health_status_counts).map(([k, v]) => ({
                        label: (healthLabels as any)[k] || k,
                        value: v,
                        color: healthColors[k] || '#3b82f6'
                      }))}
                      size={180}
                      thickness={28}
                      legendPosition="bottom"
                      showCenter={false}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">暂无健康状态数据</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  )
}
