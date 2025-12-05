'use client'

import { motion } from 'framer-motion'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function Loading({ size = 'md', text }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className={`${sizeClasses[size]} border-2 border-pink-200 border-t-pink-500 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  show: boolean
  text?: string
}

export function LoadingOverlay({ show, text = '正在处理...' }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-white/90 backdrop-blur-md rounded-lg p-8 shadow-xl">
        <Loading size="lg" text={text} />
      </div>
    </motion.div>
  )
}

export function LocalLoadingOverlay({ show, text = '正在处理...' }: LoadingOverlayProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl"
    >
      <div className="bg-white/90 backdrop-blur-md rounded-lg p-6 shadow">
        <Loading size="md" text={text} />
      </div>
    </motion.div>
  )
}
