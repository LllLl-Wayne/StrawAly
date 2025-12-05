'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
// 移除全局/局部遮罩，改为数据就绪后再显示
import { useAccent, Accent } from '@/components/theme/accent-provider'
import { buttonAccentClasses, toggleAccentClasses } from '@/lib/themeAccent'
import { AntColorPickerLarge, AntGradientPicker } from '@/components/theme/ant-color-picker'
import { useBackground } from '@/components/background/background-provider'
import { AccentTogglePreview } from '@/components/ui/accent-toggle-preview'
import { apiService, AIConfig, AIStatus } from '@/lib/api'
import { getSystemConfig, saveSystemConfig, resetSystemConfig, SystemConfig, DEFAULT_CONFIG } from '@/lib/config'
import { 
  Cog6ToothIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ServerIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Image from 'next/image'

export default function SettingsPage() {
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const { showToast } = useToast()
  const { accent, setAccent, customColor, setCustomColor } = useAccent()
  const { css, setCss } = useBackground()

  const loadSettings = async () => {
    try {
      setLoading(true)
      
      // 尝试从后端API获取AI配置
      try {
        const configResponse = await apiService.getAIConfig()
        if (configResponse.success && configResponse.data) {
          setAiConfig(configResponse.data)
        } else {
          // 如果后端没有配置，使用默认配置
          setAiConfig({
            enabled: true,
            provider: 'dashscope',
            api_key: '',
            app_id: '',
            model: 'qwen-vl-max',
            max_tokens: 500,
            temperature: 0.7,
            custom_prompt: `请以Markdown格式详细描述这张草莓图片，请包含以下内容：
## 基本观察：
**整体状态：
**形状大小：
**表面特征：`
          })
        }
      } catch (error) {
        console.warn('无法获取AI配置，使用默认配置:', error)
        // 使用默认配置
        setAiConfig({
          enabled: true,
          provider: 'dashscope',
          api_key: '',
          app_id: '',
          model: 'qwen-vl-max',
          max_tokens: 500,
          temperature: 0.7,
          custom_prompt: `请以Markdown格式详细描述这张草莓图片，请包含以下内容：
## 基本观察：
**整体状态：
**形状大小：
**表面特征：`
        })
      }
      
      // 获取AI状态
      try {
        const statusResponse = await apiService.getAIStatus()
        setAiStatus(statusResponse.data || null)
      } catch (error) {
        console.warn('无法获取AI状态，使用默认状态:', error)
        setAiStatus({
          enabled: true,
          provider: 'dashscope',
          has_api_key: false
        })
      }
    } catch (error) {
      console.error('加载设置失败:', error)
      showToast({
        title: '错误',
        description: '加载设置失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!aiConfig) return

    try {
      setSaving(true)
      await apiService.updateAIConfig(aiConfig)
      showToast({
        title: '成功',
        description: 'AI配置已保存',
        type: 'success'
      })
      // 重新加载状态
      const statusResponse = await apiService.getAIStatus()
      setAiStatus(statusResponse.data || null)
    } catch (error) {
      console.error('保存配置失败:', error)
      showToast({
        title: '错误',
        description: '保存配置失败',
        type: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      const response = await apiService.testAIConnection()
      if (response.success) {
        showToast({
          title: '成功',
          description: 'AI连接测试成功',
          type: 'success'
        })
      } else {
        showToast({
          title: '错误',
          description: response.message || 'AI连接测试失败',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('测试连接失败:', error)
      showToast({
        title: '错误',
        description: 'AI连接测试失败',
        type: 'error'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleConfigChange = (field: keyof AIConfig, value: string | boolean | number) => {
    if (!aiConfig) {
      // 如果aiConfig为空，创建一个默认配置
      setAiConfig({
        enabled: true,
        provider: 'dashscope',
        api_key: '',
        app_id: '',
        model: 'qwen-vl-max',
        max_tokens: 500,
        temperature: 0.7,
        custom_prompt: `请以Markdown格式详细描述这张草莓图片，请包含以下内容：
## 基本观察：
**整体状态：
**形状大小：
**表面特征：`,
        [field]: value
      })
    } else {
      setAiConfig({
        ...aiConfig,
        [field]: value
      })
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

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
                src="/setting.svg" 
                alt="设置" 
                width={32} 
                height={32}
                className="w-8 h-8 dark:invert"
              />
              系统设置
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">配置系统参数和AI服务</p>
          </div>
          <div />
        </div>
      </motion.div>
      
      {/* 主题色设置（置顶） */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 6 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <Card className={`hover:shadow-lg transition-shadow duration-200 settings-card ${loading ? 'pointer-events-none opacity-0' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Image src="/style.svg" alt="样式" width={24} height={24} className="w-6 h-6" />
              外观样式设置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AntColorPickerLarge
                value={customColor}
                onChange={(hex: string) => {
                  setAccent('custom')
                  setCustomColor(hex)
                }}
              />
              <div className="ml-auto flex items-center gap-4">
                <Button className="font-semibold" onClick={() => {}}>
                  示例按钮
                </Button>
                <AccentTogglePreview />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">主强调色：用于按钮、统计卡图标块、开关的选中与聚焦环。</p>
            <p className="mt-1 text-xs warning-tip" style={{ color: '#b62022ff' }}>提示：部分主题色在深/浅色模式下可能导致组件对比度不足，影响可读性。</p>
            {/* 已移除背景圆球渐变设置 */}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI服务配置 */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: loading ? 0 : 1, y: loading ? 6 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
      >
        <Card className={`settings-card ${loading ? 'pointer-events-none opacity-0' : ''}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image 
                src="/aislogo.svg" 
                alt="AI服务" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
              AI服务配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiConfig && (
              <>
                {/* 启用AI */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">启用AI自动描述</label>
                    <p className="text-xs text-gray-500">开启后，系统将自动使用AI生成草莓观察描述</p>
                  </div>
                  <AccentTogglePreview
                    checked={aiConfig.enabled}
                    onChange={(c) => handleConfigChange('enabled', c)}
                  />
                </div>

                {/* AI提供商 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI提供商：
                  </label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) => handleConfigChange('provider', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="dashscope">通义千问 (DashScope)</option>
                  </select>
                </div>

                {/* API密钥 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API密钥：
                  </label>
                  <input
                    type="password"
                    value={aiConfig.api_key}
                    onChange={(e) => handleConfigChange('api_key', e.target.value)}
                    placeholder="请输入API密钥"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">您的API密钥将安全存储在本地</p>
                </div>

                {/* 应用ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    应用ID：
                  </label>
                  <input
                    type="text"
                    value={aiConfig.app_id || ''}
                    onChange={(e) => handleConfigChange('app_id', e.target.value)}
                    placeholder="可选，用于某些特定的应用场景"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-900"
                  />
                </div>

                {/* 模型名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    模型名称：
                  </label>
                  <input
                    type="text"
                    value={aiConfig.model}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    placeholder="qwen-vl-max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-900"
                  />
                </div>

                {/* 高级参数 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      最大输出长度：
                    </label>
                    <input
                    type="number"
                    value={aiConfig.max_tokens}
                    onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
                    min={100}
                    max={2000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-900"
                  />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      创造度 (0-2)：
                    </label>
                    <input
                    type="number"
                    value={aiConfig.temperature}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    min={0}
                    max={2}
                    step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-900"
                  />
                  </div>
                </div>

                {/* 自定义提示词 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    自定义提示词：
                  </label>
                  <textarea
                    value={aiConfig.custom_prompt}
                    onChange={(e) => handleConfigChange('custom_prompt', e.target.value)}
                    rows={6}
                    placeholder="请以Markdown格式详细描述这张草莓图片..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 dark:text-gray-900"
                  />
                </div>
              </>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={handleTestConnection}
                disabled={testing}
                variant="outline"
              >
                {testing ? (
                  <>测试连接</>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    测试连接
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={saving}
              >
                {saving ? (
                  <>保存中...</>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    保存配置
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI状态卡片 */}
      {aiStatus && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className={`border-l-4 ${aiStatus.enabled && aiStatus.has_api_key ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {aiStatus.enabled && aiStatus.has_api_key ? (
                  <CheckIcon className="h-6 w-6 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    AI服务状态: {aiStatus.enabled && aiStatus.has_api_key ? '正常' : '需要配置'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    提供商: {aiStatus.provider || '未配置'} | 
                    API密钥: {aiStatus.has_api_key ? '已配置' : '未配置'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 使用说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">配置说明</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>通义千问:</strong> 使用阿里云通义千问模型，需要DashScope API密钥</li>
                  <li>• 配置完成后请先测试连接，确保服务正常</li>
                  <li>• 自定义提示词可以优化AI分析结果的准确性</li>
                  <li>• API密钥可在阿里云DashScope控制台获取</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      
    </div>
  )
}
