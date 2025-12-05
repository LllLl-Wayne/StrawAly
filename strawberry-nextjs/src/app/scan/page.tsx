'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
// 移除遮罩，加载时直接显示内容或禁用控件
import { apiService, StrawberryFullInfo } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { 
  CameraIcon, 
  StopIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import Image from 'next/image'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { useAccent } from '@/components/theme/accent-provider'
import { accentHex, hexToRgba } from '@/lib/themeAccent'
import { Select } from 'antd'

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [isDetectionPaused, setIsDetectionPaused] = useState(false)
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('environment')
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [qrResult, setQrResult] = useState('')
  const [strawberryInfo, setStrawberryInfo] = useState<StrawberryFullInfo | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiDescription, setAiDescription] = useState('')
  const [manualNotes, setManualNotes] = useState('')
  const [growthStage, setGrowthStage] = useState('')
  const [healthStatus, setHealthStatus] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const lastScannedRef = useRef<{ code: string; timestamp: number } | null>(null)
  const { showToast } = useToast()
  const { accent, customColor } = useAccent()
  const accentColor = accentHex(accent, customColor)
  const [inputFocused, setInputFocused] = useState(false)

  // 等待视频准备就绪（有尺寸和帧数据）
  const waitForVideoReady = (video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve) => {
      if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
        resolve()
        return
      }
      const onLoaded = () => {
        video.removeEventListener('loadeddata', onLoaded)
        resolve()
      }
      video.addEventListener('loadeddata', onLoaded)
      // 兜底：若事件未触发，短暂等待后继续
      setTimeout(() => {
        video.removeEventListener('loadeddata', onLoaded)
        resolve()
      }, 500)
    })
  }

  // 从视频流截图为文件，并返回可用于上传/选择的 File
  const captureCurrentFrameToFile = async (qrCode?: string): Promise<File | null> => {
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return null

      // 确保视频就绪，避免 videoWidth/Height 为 0 导致截图失败
      await waitForVideoReady(video)

      const width = video.videoWidth || 1280
      const height = video.videoHeight || 720
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(video, 0, 0, width, height)

      // 可靠的 Blob 获取：优先 toBlob，失败则走 dataURL 回退
      let blob: Blob | null = await new Promise((resolve) => {
        try {
          if ((canvas as any).toBlob) {
            (canvas as HTMLCanvasElement).toBlob((b) => resolve(b), 'image/jpeg', 0.92)
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
      if (!blob) {
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/jpeg', 0.92)
        blob = await (await fetch(dataUrl)).blob()
      }

      const ts = new Date()
      const timestamp = `${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,'0')}${String(ts.getDate()).padStart(2,'0')}_${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}${String(ts.getSeconds()).padStart(2,'0')}`
      const name = qrCode ? `capture_${qrCode}_${timestamp}.jpg` : `capture_${timestamp}.jpg`
      const file = new File([blob], name, { type: 'image/jpeg' })
      return file
    } catch (e) {
      console.error('截图失败:', e)
      return null
    }
  }

  // 上传截图到后端照片目录
  const uploadCapturedPhoto = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      const resp = await apiService.capturePhoto(formData)
      if (resp.success) {
        showToast({ title: '已保存', description: '截图已保存到照片目录', type: 'success' })
      } else {
        showToast({ title: '保存失败', description: resp.message || '无法保存截图', type: 'error' })
      }
    } catch (err) {
      console.error('上传截图失败:', err)
      showToast({ title: '错误', description: '上传截图失败', type: 'error' })
    }
  }

  const enumerateVideoDevices = async () => {
    try {
      // 为了获取设备 label（如“OBS Virtual Camera”），需先请求权限
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      tempStream.getTracks().forEach(t => t.stop())
    } catch {
      // 权限可能未授予，继续列举设备但可能没有 label
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videos = devices.filter(d => d.kind === 'videoinput')
      setVideoDevices(videos)
      // 如果之前有选择的设备且仍存在，则保持；否则默认第一个
      const savedId = typeof window !== 'undefined' ? localStorage.getItem('preferredCameraId') : null
      const existsSaved = savedId && videos.some(v => v.deviceId === savedId)
      if (existsSaved) {
        setSelectedDeviceId(savedId as string)
      } else if (videos.length > 0) {
        setSelectedDeviceId(videos[0].deviceId)
      } else {
        setSelectedDeviceId(null)
      }
    } catch (error) {
      console.error('列举摄像头失败:', error)
    }
  }

  const startCamera = async (preferredId?: string) => {
    try {
      const useId = preferredId ?? selectedDeviceId ?? null
      const constraints: MediaStreamConstraints = {
        video: useId
          ? { deviceId: { exact: useId } }
          : { facingMode: currentCamera }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // 确保视频播放（避免后续处于暂停状态）
        try { await videoRef.current.play() } catch {}
        setIsScanning(true)
        setIsDetectionPaused(false)
        
        // 初始化二维码扫描器
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserMultiFormatReader()
        }
        
        // 开始扫描二维码（绑定当前选定设备）
        startQRScanning(useId)
        // 刷新设备列表以确保 label（包含 OBS Virtual Camera）可见
        enumerateVideoDevices()
      }
    } catch (error) {
      console.error('启动摄像头失败:', error)
      showToast({
        title: '错误',
        description: '无法启动摄像头，请检查权限设置',
        type: 'error'
      })
    }
  }

  const switchCamera = async () => {
    if (isScanning) {
      stopCamera()
    }
    // 优先基于设备列表循环切换
    let nextId: string | null = null
    let newCameraMode: 'user' | 'environment' | null = null
    if (videoDevices.length > 0) {
      const currentIndex = selectedDeviceId
        ? Math.max(0, videoDevices.findIndex(d => d.deviceId === selectedDeviceId))
        : 0
      const nextIndex = (currentIndex + 1) % videoDevices.length
      nextId = videoDevices[nextIndex]?.deviceId || null
      setSelectedDeviceId(nextId)
      if (nextId) localStorage.setItem('preferredCameraId', nextId)
    } else {
      // 回退到前后摄像头切换
      newCameraMode = currentCamera === 'environment' ? 'user' : 'environment'
      setCurrentCamera(newCameraMode)
    }
    
    try {
      const constraints: MediaStreamConstraints = {
        video: nextId
          ? { deviceId: { exact: nextId } }
          : { facingMode: (newCameraMode ?? currentCamera) }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // 切换后确保视频继续播放
        try { await videoRef.current.play() } catch {}
        setIsScanning(true)
        setIsDetectionPaused(false)
        
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserMultiFormatReader()
        }
        // 开始扫描二维码（绑定下一设备）
        startQRScanning(nextId)
      }
    } catch (error) {
      console.error('切换摄像头失败:', error)
      showToast({
        title: '错误',
        description: '切换摄像头失败',
        type: 'error'
      })
    }
  }

  const startQRScanning = (deviceId?: string | null) => {
    if (codeReaderRef.current && videoRef.current) {
      setIsDetectionPaused(false)
      // 恢复视频画面（如果之前因识别而暂停）
      try { videoRef.current.play() } catch {}
      const targetId = deviceId ?? undefined
      codeReaderRef.current.decodeFromVideoDevice(targetId, videoRef.current, (result, error) => {
        if (result) {
          const qrCode = result.getText()
          const currentTime = Date.now()
          
          // 检查冷却机制：如果是同一个二维码且在3秒内，则忽略
          if (lastScannedRef.current && 
              lastScannedRef.current.code === qrCode && 
              currentTime - lastScannedRef.current.timestamp < 3000) {
            return // 忽略重复扫描
          }
          
          // 更新最后扫描记录
          lastScannedRef.current = {
            code: qrCode,
            timestamp: currentTime
          }
          
          console.log('扫描到二维码:', qrCode)
          setQrResult(qrCode)
          showToast({
            title: '成功',
            description: `扫描到二维码: ${qrCode}`,
            type: 'success'
          })

          // 先保存图片，再仅暂停识别（不暂停画面）
          captureCurrentFrameToFile(qrCode).then(async (file) => {
            if (file) {
              setSelectedFile(file)
              // 清空AI分析结果，避免旧结果干扰
              setAiDescription('')
              // 异步保存到后端照片目录
              await uploadCapturedPhoto(file)
            }
            // 暂停识别，等待用户点击“继续扫描”；视频继续播放
            if (codeReaderRef.current) {
              try { codeReaderRef.current.reset() } catch {}
            }
            setIsDetectionPaused(true)
          })
          
          // 自动搜索草莓信息
          searchStrawberry(qrCode)
        }
        if (error && !(error instanceof NotFoundException)) {
          console.error('二维码扫描错误:', error)
        }
      })
    }
  }

  const stopCamera = () => {
    // 停止二维码扫描
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    
    // 清理冷却机制状态
    lastScannedRef.current = null
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setIsDetectionPaused(true)
  }

  const searchStrawberry = async (qrCode: string) => {
    try {
      setLoading(true)
      const response = await apiService.searchStrawberryByQR(qrCode)
      setStrawberryInfo(response.data || null)
      showToast({
        title: '成功',
        description: '找到草莓信息',
        type: 'success'
      })
    } catch (error) {
      console.error('搜索草莓失败:', error)
      showToast({
        title: '错误',
        description: '未找到对应的草莓信息',
        type: 'error'
      })
      setStrawberryInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const handleManualInput = (e: React.FormEvent) => {
    e.preventDefault()
    if (qrResult.trim()) {
      searchStrawberry(qrResult.trim())
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setAiDescription('') // 清空之前的分析结果
    }
  }

  const analyzeImageWithAI = async () => {
    if (!selectedFile) {
      showToast({
        title: '错误',
        description: '请先选择图片',
        type: 'error'
      })
      return
    }

    try {
      setAiAnalyzing(true)
      const formData = new FormData()
      formData.append('image', selectedFile)
      
      const response = await apiService.analyzeImageWithAI(formData)
      if (response.success && response.data) {
        // 将AI返回的结果转换为文本格式
        const description = response.data.description || '未能获取分析结果'
        setAiDescription(description)
        showToast({
          title: '成功',
          description: 'AI分析完成',
          type: 'success'
        })
      }
    } catch (error) {
      console.error('AI分析失败:', error)
      showToast({
        title: '错误',
        description: 'AI分析失败',
        type: 'error'
      })
    } finally {
      setAiAnalyzing(false)
    }
  }

  const handleAddRecord = async () => {
    if (!strawberryInfo || !selectedFile) {
      showToast({
        title: '错误',
        description: '请选择图片文件',
        type: 'error'
      })
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('image', selectedFile)
      if (manualNotes) formData.append('notes', manualNotes)
      if (growthStage) formData.append('growth_stage', growthStage)
      if (healthStatus) formData.append('health_status', healthStatus)
      
      const response = await apiService.addObservationRecord(strawberryInfo.strawberry.id, formData)
      showToast({
        title: '成功',
        description: '观察记录添加成功',
        type: 'success'
      })
      
      // 重新获取草莓信息以更新记录列表
      searchStrawberry(strawberryInfo.strawberry.qr_code)
      
      // 清空表单
      setSelectedFile(null)
      setAiDescription('')
      setManualNotes('')
      setGrowthStage('')
      setHealthStatus('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('添加记录失败:', error)
      showToast({
        title: '错误',
        description: '添加观察记录失败',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // 初始化设备列表与设备变更监听
    enumerateVideoDevices()
    const handleDeviceChange = () => enumerateVideoDevices()
    navigator.mediaDevices.addEventListener?.('devicechange', handleDeviceChange)
    return () => {
      stopCamera()
      // 清理二维码扫描器
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
        codeReaderRef.current = null
      }
      navigator.mediaDevices.removeEventListener?.('devicechange', handleDeviceChange)
    }
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Image 
                src="/camera.svg" 
                alt="扫描记录" 
                width={32} 
                height={32}
                className="w-8 h-8 dark:invert"
              />
              扫描记录
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">扫描二维码并添加观察记录</p>
          </div>
          <div />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧：扫码区域 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="xl:col-span-1"
        >
          <Card className="scan-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CameraIcon className="h-5 w-5" />
                摄像头扫描
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 摄像头预览 */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
                <canvas ref={canvasRef} className="hidden" />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 border-2 border-white rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <div className="w-16 h-16 border border-white rounded"></div>
                      </div>
                      <p className="text-sm">扫描二维码获取信息</p>
                    </div>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-48 h-48">
                      {/* 加粗加长的扫描框 */}
                      <div className="absolute top-0 left-0 w-16 h-16 border-l-8 border-t-8 border-red-500"></div>
                      <div className="absolute bottom-0 right-0 w-16 h-16 border-r-8 border-b-8 border-red-500"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* 设备选择 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <label className="text-sm text-gray-700 dark:text-gray-300">选择摄像头</label>
                <select
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm dark:text-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  value={selectedDeviceId || ''}
                  onChange={(e) => {
                    const id = e.target.value || null
                    setSelectedDeviceId(id)
                    if (id) localStorage.setItem('preferredCameraId', id)
                    // 正在扫描时，立即应用选择，避免状态更新导致的约束使用旧设备
                    if (isScanning) {
                      stopCamera()
                      if (id) {
                        startCamera(id)
                      } else {
                        startCamera()
                      }
                    }
                  }}
                >
                  {videoDevices.length === 0 && (
                    <option value="">未检测到摄像头</option>
                  )}
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || '未命名设备'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 摄像头控制 */}
              <div className="grid grid-cols-2 gap-2">
                {!isScanning ? (
                  <Button onClick={() => startCamera()} size="sm" className="text-xs">
                    <CameraIcon className="h-4 w-4 mr-1" />
                    启动
                  </Button>
                ) : (
                  <Button onClick={stopCamera} variant="destructive" size="sm" className="text-xs">
                    <StopIcon className="h-4 w-4 mr-1" />
                    关闭
                  </Button>
                )}
              <Button onClick={switchCamera} variant="outline" size="sm" className="text-xs">
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                切换
              </Button>
              <Button onClick={enumerateVideoDevices} variant="outline" size="sm" className="text-xs">
                刷新设备
              </Button>
              <Button 
                onClick={() => startQRScanning(selectedDeviceId)} 
                variant="outline" 
                size="sm" 
                className="text-xs"
                disabled={!isScanning || !isDetectionPaused}
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                继续扫描
              </Button>
            </div>
            </CardContent>
          </Card>


        </motion.div>

        {/* 右侧：手动输入和搜索结果 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-1 space-y-4"
        >
          {/* 手动输入 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5" />
                手动输入
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualInput} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrResult}
                    onChange={(e) => setQrResult(e.target.value)}
                    placeholder="输入二维码编号"
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none text-sm dark:text-gray-200 dark:bg-gray-800"
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    style={{
                      borderColor: accentColor,
                      boxShadow: inputFocused ? `0 0 0 2px ${hexToRgba(accentColor, 0.6)}` : undefined,
                      transition: 'box-shadow 150ms ease, border-color 150ms ease'
                    }}
                  />
                  <Button type="submit" size="sm" className="px-4">
                    <MagnifyingGlassIcon className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 搜索结果 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MagnifyingGlassIcon className="h-5 w-5" />
                搜索结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              {strawberryInfo ? (
                <div className="space-y-3">
                  <div className="bg-gray-50/60 dark:bg-gray-800/60 backdrop-blur-md p-3 rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">草莓编号</span>
                      <span className="text-sm">{strawberryInfo.strawberry.id}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm font-medium">二维码</span>
                      <code className="text-xs bg-white/60 dark:bg-gray-700/60 backdrop-blur-md px-2 py-1 rounded border border-gray-200/30 dark:border-gray-600/30">
                        {strawberryInfo.strawberry.qr_code}
                      </code>
                    </div>
                    {strawberryInfo.records.length > 0 && (
                      <>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm font-medium">最近录入</span>
                          <span className="text-xs text-gray-600">
                            {formatDateTime(strawberryInfo.records[0].recorded_at)}
                          </span>
                        </div>
                        {strawberryInfo.records[0].growth_stage && (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm font-medium">生长阶段</span>
                            <span className="text-xs bg-blue-100/60 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 backdrop-blur-md px-2 py-1 rounded border border-blue-200/30 dark:border-blue-700/30">
                              {strawberryInfo.records[0].growth_stage}
                            </span>
                          </div>
                        )}
                        {strawberryInfo.records[0].health_status && (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm font-medium">健康状况</span>
                            <span className="text-xs bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-300 backdrop-blur-md px-2 py-1 rounded border border-green-200/30 dark:border-green-700/30">
                              {strawberryInfo.records[0].health_status}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">暂无搜索结果</p>
                </div>
              )}
            </CardContent>
          </Card>


        </motion.div>

      </div>

      {/* 添加观察记录 - 全宽度 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardDocumentListIcon className="h-5 w-5" />
                添加观察记录
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 图片选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择图片
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {selectedFile ? (
                    <div>
                      {/* 预览已自动选择的截图 */}
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="已选择图片预览"
                        className="w-40 h-40 object-cover rounded-lg mx-auto mb-2 border"
                      />
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                      >
                        重新选择
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">点击选择图片</p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()} 
                        variant="outline" 
                        size="sm"
                      >
                        选择文件
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* AI分析按钮 */}
              <div>
                <Button
                  onClick={analyzeImageWithAI}
                  disabled={!selectedFile || aiAnalyzing}
                  className="w-full mb-3"
                  variant="outline"
                >
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  {aiAnalyzing ? '分析中...' : '分析草莓状态'}
                </Button>
              </div>

              {/* AI分析结果 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4" />
                  AI分析结果
                </label>
                {aiDescription ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 min-h-[100px] max-h-[400px] overflow-y-auto">
                    <MarkdownRenderer content={aiDescription} />
                  </div>
                ) : (
                  <textarea
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="点击分析按钮后，AI分析结果将显示在这里..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                    readOnly={aiAnalyzing}
                  />
                )}
              </div>

              {/* 手动备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手动备注
                </label>
                <textarea
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="添加手动观察备注..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>

              {/* 生长阶段和健康状况 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生长阶段
                  </label>
                  <Select
                    value={growthStage}
                    onChange={(v) => setGrowthStage(v)}
                    style={{ width: '100%' }}
                    placeholder="请选择"
                    options={[
                      { value: '', label: '请选择' },
                      { value: 'seedling', label: '幼苗期' },
                      { value: 'flowering', label: '开花期' },
                      { value: 'fruiting', label: '结果期' },
                      { value: 'ripening', label: '成熟中' },
                      { value: 'mature', label: '成熟期' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    健康状况
                  </label>
                  <Select
                    value={healthStatus}
                    onChange={(v) => setHealthStatus(v)}
                    style={{ width: '100%' }}
                    placeholder="请选择"
                    options={[
                      { value: '', label: '请选择' },
                      { value: 'healthy', label: '健康' },
                      { value: 'warning', label: '警告' },
                      { value: 'sick', label: '异常' },
                    ]}
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAddRecord}
                  disabled={!selectedFile || !strawberryInfo || loading}
                  className="flex-1 bg-pink-500 hover:bg-pink-600"
                >
                  保存观察记录
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedFile(null)
                    setAiDescription('')
                    setManualNotes('')
                    setGrowthStage('')
                    setHealthStatus('')
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="px-4"
                >
                  清空
                </Button>
              </div>

              {/* 隐藏的文件输入 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        </motion.div>

      {/* 最近记录 */}
      {strawberryInfo && strawberryInfo.records.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                观察记录历史
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strawberryInfo.records.slice(0, 4).map((record, index) => (
                  <div key={record.id} className="flex items-start gap-4 p-4 bg-gray-50/60 dark:bg-gray-800/60 backdrop-blur-md rounded-lg border border-gray-200/30 dark:border-gray-700/30">
                    <div className="flex-shrink-0">
                      <img
                        src={apiService.getImageUrl(record.image_path)}
                        alt="观察记录"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          记录 #{strawberryInfo.records.length - index}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(record.recorded_at)}
                        </div>
                      </div>
                      {record.ai_description && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {record.ai_description}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {record.growth_stage && (
                          <span className="text-xs bg-blue-100/60 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 backdrop-blur-md px-2 py-1 rounded border border-blue-200/30 dark:border-blue-700/30">
                            {record.growth_stage}
                          </span>
                        )}
                        {record.health_status && (
                          <span className="text-xs bg-green-100/60 dark:bg-green-900/40 text-green-800 dark:text-green-300 backdrop-blur-md px-2 py-1 rounded border border-green-200/30 dark:border-green-700/30">
                            {record.health_status}
                          </span>
                        )}
                        {record.size_estimate && (
                          <span className="text-xs bg-purple-100/60 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 backdrop-blur-md px-2 py-1 rounded border border-purple-200/30 dark:border-purple-700/30">
                            {record.size_estimate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
