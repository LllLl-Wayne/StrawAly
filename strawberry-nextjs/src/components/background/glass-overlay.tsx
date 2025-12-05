'use client'

interface GlassOverlayProps {
  className?: string
}

export default function GlassOverlay({ className = '' }: GlassOverlayProps) {
  return (
    <div 
      className={`fixed top-0 left-0 w-full h-full pointer-events-none -z-10 
      bg-white/30 dark:bg-gray-900/30 backdrop-blur-[2px] ${className}`}
    />
  )
}