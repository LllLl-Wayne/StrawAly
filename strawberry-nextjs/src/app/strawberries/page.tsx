'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAccent } from '@/components/theme/accent-provider'
import { accentHex, hexToRgba, getContrastText } from '@/lib/themeAccent'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { useToast } from '@/components/ui/toast'
// 取消遮罩，数据就绪后再显示列表
import { apiService, Strawberry } from '@/lib/api'
import { formatDateTime, copyToClipboard } from '@/lib/utils'
import { 
  PlusIcon, 
  EyeIcon, 
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { ReloadOutlined } from '@ant-design/icons'
import Image from 'next/image'
import { Select, Pagination } from 'antd'

export default function StrawberriesPage() {
  const [strawberries, setStrawberries] = useState<Strawberry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [limitFilter, setLimitFilter] = useState('')
  const [qrCodeSearch, setQrCodeSearch] = useState('')
  const [qrCodeError, setQrCodeError] = useState('')
  const { showToast } = useToast()
  const { accent, customColor } = useAccent()
  const accentColor = accentHex(accent, customColor)
  const contrast = getContrastText(accentColor)
  const [inputFocused, setInputFocused] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState<number | null>(null)

  const loadStrawberries = async () => {
    try {
      setLoading(true)
      
      // 使用常规筛选
      const params: { status?: string } = {}
      if (statusFilter) params.status = statusFilter
      
      const response = await apiService.getStrawberries(params)
      setStrawberries(response?.data || [])
      setTotalCount((response?.data || []).length)
    } catch (error) {
      console.error('加载草莓列表失败:', error)
      showToast({
        title: '错误',
        description: '加载草莓列表失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 获取统计以确定总数（用于分页显示总页数）
    const loadStatsTotal = async () => {
      try {
        const statsResp = await apiService.getStatistics()
        const stats = statsResp.data
        if (stats) {
          if (!statusFilter) {
            setTotalCount(stats.total_strawberries || null)
          } else {
            const m: Record<string, number> = stats.status_counts || {}
            setTotalCount(m[statusFilter] ?? null)
          }
        }
      } catch (e) {
        // 忽略统计错误，使用列表长度作为总数
      }
    }
    loadStatsTotal()
  }, [statusFilter])

  const searchByQrCode = async () => {
    if (!qrCodeSearch.trim()) {
      setQrCodeError('请输入二维码编号')
      return
    }

    // 验证二维码格式 (例如: SB_20250926_083018_446CC028) 或 SB_20250923_103819_44558444
    const qrCodePattern = /^SB_\d{8}_\d{6}_[0-9A-F]{8}$/
    if (!qrCodePattern.test(qrCodeSearch.trim())) {
      setQrCodeError('二维码格式不正确，应为：SB_YYYYMMDD_HHMMSS_XXXXXXXX')
      return
    }

    setQrCodeError('')
    try {
      setLoading(true)
      const response = await apiService.searchStrawberryByQR(qrCodeSearch.trim())
      setStrawberries([response?.data?.strawberry].filter(Boolean))
      showToast({
        title: '成功',
        description: '找到匹配的草莓记录',
        type: 'success'
      })
    } catch (error) {
      console.error('搜索草莓失败:', error)
      // 区分处理404未找到的情况和其他错误
      const isNotFound = error.response?.status === 404
      showToast({
        title: isNotFound ? '提示' : '错误',
        description: isNotFound ? '未找到匹配的草莓记录' : '搜索过程中发生错误',
        type: isNotFound ? 'info' : 'error'
      })
      setStrawberries([])
    } finally {
      setLoading(false)
    }
  }

  const handleQrCodeChange = (value: string) => {
    // 只允许输入符合格式的字符
    const upperValue = value.toUpperCase()
    setQrCodeSearch(upperValue)
    
    // 实时验证二维码格式
    const qrCodePattern = /^SB_\d{8}_\d{6}_[0-9A-F]{8}$/
    if (upperValue && !qrCodePattern.test(upperValue)) {
      setQrCodeError('二维码格式不正确，应为：SB_YYYYMMDD_HHMMSS_XXXXXXXX')
    } else {
      setQrCodeError('')
    }
  }

  const clearQrCodeSearch = () => {
    setQrCodeSearch('')
    setQrCodeError('')
    loadStrawberries()
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

  const handleDeleteStrawberry = async (id: number) => {
    if (confirm(`确定要删除ID为${id}的草莓记录吗？此操作不可恢复。`)) {
      try {
        setLoading(true)
        await apiService.deleteStrawberry(id)
        showToast({
          title: '成功',
          description: '草莓记录已删除',
          type: 'success'
        })
        // 重新加载列表
        loadStrawberries()
      } catch (error) {
        console.error('删除草莓记录失败:', error)
        showToast({
          title: '错误',
          description: '删除草莓记录失败',
          type: 'error'
        })
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadStrawberries()
    setCurrentPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, limitFilter])

  const total = totalCount ?? strawberries.length
  const pageSize = limitFilter ? parseInt(limitFilter) : total
  const paginated = limitFilter
    ? strawberries.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize)
    : strawberries

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
                src="/log.svg" 
                alt="草莓管理" 
                width={32} 
                height={32}
                className="w-8 h-8 dark:invert"
              />
              草莓管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">管理和查看所有草莓记录</p>
          </div>
        <div className="flex gap-2">
          <Link href="/strawberries/create">
            <Button className="flex items-center gap-2 btn-accent">
              <PlusIcon className="h-4 w-4" />
              创建新草莓
            </Button>
          </Link>
          <Button onClick={loadStrawberries} className="btn-accent">
            <ReloadOutlined />
            刷新列表
          </Button>
        </div>
        </div>
      </motion.div>

      {/* 过滤器 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  状态过滤：
                </label>
                <Select
                  value={statusFilter}
                  onChange={(v) => setStatusFilter(v)}
                  style={{ width: 140 }}
                  disabled={!!qrCodeSearch}
                  options={[
                    { value: '', label: '全部状态' },
                    { value: 'active', label: '活跃' },
                    { value: 'inactive', label: '非活跃' },
                    { value: 'harvested', label: '已收获' },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  显示数量：
                </label>
                <Select
                  value={limitFilter}
                  onChange={(v) => setLimitFilter(v)}
                  style={{ width: 120 }}
                  disabled={!!qrCodeSearch}
                  options={[
                    { value: '', label: '全部' },
                    { value: '10', label: '10条' },
                    { value: '20', label: '20条' },
                    { value: '50', label: '50条' },
                    { value: '100', label: '100条' },
                  ]}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                二维码搜索：
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={qrCodeSearch}
                  onChange={(e) => handleQrCodeChange(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm focus:outline-none w-80 font-mono bg-transparent relative z-10"
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  style={{
                    borderColor: accentColor,
                    boxShadow: inputFocused ? `0 0 0 2px ${hexToRgba(accentColor, 0.6)}` : undefined,
                    transition: 'box-shadow 150ms ease, border-color 150ms ease'
                  }}
                  maxLength={27}
                />
                <div className="absolute inset-0 px-3 py-2 text-sm pointer-events-none font-mono flex">
                  <span className="text-transparent">
                    {qrCodeSearch}
                  </span>
                  <span className="text-[#707784] dark:text-[#707784]">
                    {"SB_YYYYMMDD_HHMMSS_XXXXXXXX".substring(qrCodeSearch.length)}
                  </span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={searchByQrCode}
                disabled={!qrCodeSearch.trim() || qrCodeError}
                className="px-3 py-2"
              >
                搜索
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearQrCodeSearch}
                disabled={!qrCodeSearch.trim()}
                className="px-2 py-1 text-xs"
              >
                清除
              </Button>
            </div>
          </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 草莓列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>草莓列表 ({strawberries.length} 条记录)</CardTitle>
          </CardHeader>
          <CardContent>
          {strawberries.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无草莓记录</p>
              <Link href="/strawberries/create">
                <Button className="mt-4">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  创建第一个草莓
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">二维码</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">状态</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">创建时间</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">最新记录</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((strawberry, index) => (
                    <motion.tr
                      key={strawberry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-gray-100/50 dark:border-gray-700/50 hover:bg-gray-50/60 dark:hover:bg-gray-800/60 hover:backdrop-blur-md"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                        {strawberry.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <code className="text-xs bg-gray-100/60 dark:bg-gray-700/60 backdrop-blur-md px-2 py-1 rounded border border-gray-200/30 dark:border-gray-600/30">
                            {strawberry.qr_code}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyQR(strawberry.qr_code)}
                            className="ml-2"
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={strawberry.strawberry_status || strawberry.status || 'active'} />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-center">
                        {formatDateTime(strawberry.strawberry_created_at || strawberry.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-center">
                        {formatDateTime(strawberry.latest_recorded_at || null)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Link href={`/strawberries/${strawberry.id}`}>
                            <Button size="sm" variant="outline">
                              <EyeIcon className="h-3 w-3 mr-1" />
                              查看
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteStrawberry(strawberry.id)}
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {limitFilter && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    simple
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={(p) => setCurrentPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
