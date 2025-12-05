'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { useBackground } from './background-provider'

interface FluidBackgroundProps {
  className?: string
}

export default function FluidBackground({ className = '' }: FluidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { theme } = useTheme()
  const { colors: customColors } = useBackground()
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // 设置画布尺寸为窗口大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // 粒子数量
    const particleCount = 15
    
    // 粒子类
    class Particle {
      x: number
      y: number
      radius: number
      color: string
      speedX: number
      speedY: number
      
      constructor(x: number, y: number, radius: number, color: string) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.speedX = Math.random() * 2 - 1
        this.speedY = Math.random() * 2 - 1
      }
      
      draw() {
        if (!ctx) return
        
        // 添加模糊效果
        ctx.filter = 'blur(15px)'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.filter = 'none'
      }
      
      update() {
        if (this.x + this.radius > (canvas?.width ?? 0) || this.x - this.radius < 0) {
          this.speedX = -this.speedX
        }
        
        if (this.y + this.radius > (canvas?.height ?? 0) || this.y - this.radius < 0) {
          this.speedY = -this.speedY
        }
        
        this.x += this.speedX
        this.y += this.speedY
        
        this.draw()
      }
    }
    
    // 创建粒子
    let particles: Particle[] = []
    
    const createParticles = () => {
      particles = []
      
      // 根据主题设置颜色
      const isDark = theme === 'dark'
      
      const colors = customColors.length > 0
        ? customColors.map(c => {
            if (c.startsWith('#')) {
              const h = c
              const r = parseInt(h.slice(1,3),16)
              const g = parseInt(h.slice(3,5),16)
              const b = parseInt(h.slice(5,7),16)
              return `rgba(${r}, ${g}, ${b}, 0.3)`
            }
            if (c.includes('rgba')) return c
            if (c.includes('rgb')) return c.replace(/\)$/, ', 0.3)')
            return c
          })
        : isDark
          ? ['rgba(79, 70, 229, 0.3)', 'rgba(67, 56, 202, 0.3)', 'rgba(109, 40, 217, 0.3)']
          : ['rgba(59, 130, 246, 0.3)', 'rgba(99, 102, 241, 0.3)', 'rgba(139, 92, 246, 0.3)']
      
      for (let i = 0; i < particleCount; i++) {
        const radius = Math.random() * 150 + 50
        const x = Math.random() * (canvas.width - radius * 2) + radius
        const y = Math.random() * (canvas.height - radius * 2) + radius
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        particles.push(new Particle(x, y, radius, color))
      }
    }
    
    createParticles()
    
    // 当主题变化时重新创建粒子
    const observer = new MutationObserver(() => {
      createParticles()
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 绘制粒子
      particles.forEach(particle => {
        particle.update()
      })
      
      // 绘制粒子之间的连接
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 300) {
            ctx.beginPath()
            ctx.strokeStyle = theme === 'dark' 
              ? `rgba(139, 92, 246, ${0.1 * (1 - distance / 300)})` 
              : `rgba(79, 70, 229, ${0.1 * (1 - distance / 300)})`
            ctx.lineWidth = 1
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }
    
    animate()
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      observer.disconnect()
    }
  }, [theme, customColors])
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}
    />
  )
}
