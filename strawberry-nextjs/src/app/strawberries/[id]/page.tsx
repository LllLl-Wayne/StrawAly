'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
// 移除遮罩，加载时显示占位卡片
import { apiService, StrawberryFullInfo } from '@/lib/api'
import { formatDateTime, copyToClipboard } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Popconfirm, message } from 'antd'
import { 
  ArrowLeftIcon, 
  ClipboardDocumentIcon,
  PhotoIcon,
  CalendarDaysIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

export default function StrawberryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [strawberryInfo, setStrawberryInfo] = useState<StrawberryFullInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null)
  const [messageApi, holder] = message.useMessage()
  const { showToast } = useToast()

  // 生长阶段中英文映射
  const growthStageMap: Record<string, string> = {
    'seedling': '幼苗期',
    'flowering': '开花期',
    'fruiting': '结果期',
    'ripening': '成熟期',
    'mature': '完全成熟'
  }

  // 健康状态中英文映射
  const healthStatusMap: Record<string, string> = {
    'healthy': '健康',
    'warning': '注意',
    'sick': '病态'
  }

  const strawberryId = params.id as string

  // 处理删除记录
  const handleDeleteRecord = async (recordId: number) => {
    if (!strawberryId) return
    
    try {
      setDeletingRecordId(recordId)
      const response = await apiService.deleteStrawberryRecord(parseInt(strawberryId), recordId)
      
      if (response.success) {
        showToast({
          title: '删除成功',
          description: '观察记录已成功删除',
          type: 'success'
        })
        
        // 重新加载草莓详情，更新记录列表
        await loadStrawberryDetail()
      } else {
        showToast({
          title: '删除失败',
          description: response.message || '无法删除观察记录',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('删除记录失败:', error)
      showToast({
        title: '删除失败',
        description: '删除记录时发生错误',
        type: 'error'
      })
    } finally {
      setDeletingRecordId(null)
    }
  }

  const loadStrawberryDetail = async () => {
    try {
      setLoading(true)
      const response = await apiService.getStrawberryDetail(parseInt(strawberryId))
      setStrawberryInfo(response.data || null)
    } catch (error) {
      console.error('加载草莓详情失败:', error)
      showToast('错误', '加载草莓详情失败', 'error')
      router.push('/strawberries')
    } finally {
      setLoading(false)
    }
  }

  const confirmSetDead = async () => {
    try {
      const resp = await apiService.updateStrawberryStatus(parseInt(strawberryId), 'inactive')
      if (resp.success) {
        showToast({ title: '已更新', description: '草莓状态已设为死亡', type: 'success' })
        messageApi.success('草莓状态已设为死亡')
        await loadStrawberryDetail()
      } else {
        showToast({ title: '更新失败', description: resp.message || '无法更新草莓状态', type: 'error' })
        messageApi.error(resp.message || '无法更新草莓状态')
      }
    } catch (e) {
      console.error(e)
      showToast({ title: '更新失败', description: '请求失败，请稍后重试', type: 'error' })
      messageApi.error('请求失败，请稍后重试')
    } finally {
      // no-op
    }
  }

  const handleCopyQR = async (qrCode: string) => {
    const success = await copyToClipboard(qrCode)
    if (success) {
      showToast({
        title: '成功',
        description: '二维码已复制到剪贴板',
        type: 'success'
      })
    } else {
      showToast({
        title: '错误',
        description: '复制失败，请手动复制',
        type: 'error'
      })
    }
  }

  useEffect(() => {
    if (strawberryId) {
      loadStrawberryDetail()
    }
  }, [strawberryId])

  if (!strawberryInfo) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>草莓详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {holder}
      
      
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="title-bar">
          <div className="flex items-center gap-4">
            <Link href="/strawberries">
              <Button variant="outline" size="icon">
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🍓 草莓详情 #{strawberryInfo.strawberry.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">查看草莓的详细信息和观察记录</p>
            </div>
          </div>
          <div />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本信息 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">ID</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {strawberryInfo.strawberry.id}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">二维码</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center flex-1">
                      <code className="text-sm bg-gray-100/60 dark:bg-gray-700/60 backdrop-blur-md px-2 py-1 rounded flex-1 border border-gray-200/30 dark:border-gray-600/30">
                        {strawberryInfo.strawberry.qr_code}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyQR(strawberryInfo.strawberry.qr_code)}
                        className="ml-2"
                      >
                        <ClipboardDocumentIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">状态</label>
                  <div className="mt-1 flex items-center justify-between">
                    <StatusBadge status={strawberryInfo.strawberry.strawberry_status || strawberryInfo.strawberry.status || 'active'} />
                    {['dead','inactive'].includes((strawberryInfo.strawberry.strawberry_status || strawberryInfo.strawberry.status || '') as string) ? (
                      <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" disabled>
                        设为死亡
                      </Button>
                    ) : (
                      <Popconfirm
                        title="设为死亡"
                        description="确认将该草莓植株标记为死亡？此操作不可撤销。"
                        okText="确认"
                        cancelText="取消"
                        onConfirm={confirmSetDead}
                      >
                        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs bg-red-500 hover:bg-red-600 text-white">
                          设为死亡
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">创建时间</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formatDateTime(strawberryInfo.strawberry.strawberry_created_at || strawberryInfo.strawberry.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">最新记录时间</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDateTime(strawberryInfo.strawberry.latest_recorded_at || null)}
                  </p>
                </div>

                {strawberryInfo.strawberry.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">备注</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 bg-gray-50/60 dark:bg-gray-800/60 backdrop-blur-md p-3 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                      {strawberryInfo.strawberry.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Link href={`/scan?qr=${strawberryInfo.strawberry.qr_code}`}>
                  <Button className="w-full">
                    <PhotoIcon className="h-4 w-4 mr-2 dark:text-white" />
                    添加观察记录
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 观察记录 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📸 观察记录 ({strawberryInfo.records.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strawberryInfo.records.length === 0 ? (
                <div className="text-center py-12">
                  <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 dark:text-gray-300" />
                  <p className="text-gray-500 mb-4">暂无观察记录</p>
                  <Link href={`/scan?qr=${strawberryInfo.strawberry.qr_code}`}>
                    <Button>
                      <PhotoIcon className="h-4 w-4 mr-2 dark:text-white" />
                      添加第一条记录
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {strawberryInfo.records.map((record, index) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border border-white/20 dark:border-gray-700/20 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={apiService.getImageUrl(record.image_path)}
                            alt="观察记录"
                            className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(apiService.getImageUrl(record.image_path))}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <CalendarDaysIcon className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDateTime(record.recorded_at)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-100/30 dark:hover:bg-red-900/30 p-1 h-auto"
                              onClick={() => handleDeleteRecord(record.id)}
                              disabled={deletingRecordId === record.id}
                            >
                              {deletingRecordId === record.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          
                          {record.ai_description && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">AI分析描述</h4>
                              <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-md p-3 rounded-lg border border-blue-200/30 dark:border-blue-700/30 min-h-[100px] max-h-[400px] overflow-y-auto">
                                <MarkdownRenderer content={record.ai_description} />
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {record.growth_stage && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100/60 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 backdrop-blur-md border border-blue-200/30 dark:border-blue-700/30">
                                生长阶段: {growthStageMap[record.growth_stage] || record.growth_stage}
                              </span>
                            )}
                            {record.health_status && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-300 backdrop-blur-md border border-green-200/30 dark:border-green-700/30">
                                健康状态: {healthStatusMap[record.health_status] || record.health_status}
                              </span>
                            )}
                            {record.size_estimate && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100/60 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 backdrop-blur-md border border-yellow-200/30 dark:border-yellow-700/30">
                                大小估计: {record.size_estimate}
                              </span>
                            )}
                            {record.color_description && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100/60 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 backdrop-blur-md border border-purple-200/30 dark:border-purple-700/30">
                                颜色描述: {record.color_description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 图片预览模态框 */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="观察记录大图"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => setSelectedImage(null)}>
                关闭
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 使用 AntD Popconfirm 进行确认，已在按钮处内联实现 */}
    </div>
  )
}
