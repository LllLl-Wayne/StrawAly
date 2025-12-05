'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
// 移除遮罩，提交期间按钮禁用即可
import { apiService } from '@/lib/api'
import { ArrowLeftIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function CreateStrawberryPage() {
  const [notes, setNotes] = useState('')
  const [customPrefix, setCustomPrefix] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const data: { notes?: string; custom_prefix?: string } = {}
      if (notes.trim()) data.notes = notes.trim()
      if (customPrefix.trim()) data.custom_prefix = customPrefix.trim()
      
      const response = await apiService.createStrawberry(data)
      
      showToast({
        title: '成功',
        description: `草莓创建成功！ID: ${response.data.id}`,
        type: 'success'
      })
      router.push('/strawberries')
      
    } catch (error) {
      console.error('创建草莓失败:', error)
      showToast({
        title: '错误',
        description: '创建草莓失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setNotes('')
    setCustomPrefix('')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
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
                🍓 创建新草莓
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">添加新的草莓到系统中</p>
            </div>
          </div>
          <div />
        </div>
      </motion.div>

      {/* 创建表单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>草莓信息</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  备注信息
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="输入草莓的备注信息（可选）..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  可以记录草莓的种植位置、品种等信息
                </p>
              </div>

              <div>
                <label htmlFor="customPrefix" className="block text-sm font-medium text-gray-700 mb-2">
                  自定义前缀
                </label>
                <input
                  type="text"
                  id="customPrefix"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="默认为 SB"
                />
                <p className="text-xs text-gray-500 mt-1">
                  用于生成二维码的前缀，如：SB、ST等
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  重置
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  创建草莓
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* 提示信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-xl">💡</div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">创建提示</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 创建后系统会自动生成唯一的二维码</li>
                  <li>• 二维码可用于后续的扫码记录功能</li>
                  <li>• 备注信息有助于后期管理和识别</li>
                  <li>• 自定义前缀可以帮助区分不同批次或类型</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
