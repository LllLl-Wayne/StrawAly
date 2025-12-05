'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { useAccent } from '@/components/theme/accent-provider'
import { cardAccentBorderClasses, iconAccentClasses, cardBorderCustomStyle, iconCustomStyle } from '@/lib/themeAccent'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  delay?: number
}

export function StatsCard({ title, value, icon, trend, delay = 0 }: StatsCardProps) {
  const { accent, customColor } = useAccent()
  const renderedIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: `${(icon as any).props?.className ?? ''} text-gray-700 dark:text-white`,
      })
    : icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={`hover:shadow-lg transition-shadow duration-200 border-l-4 ${accent === 'custom' ? '' : cardAccentBorderClasses(accent)}`} style={accent === 'custom' ? cardBorderCustomStyle(customColor) : undefined}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              {trend && (
                <div className="flex items-center mt-2">
                  <span
                    className={`text-sm font-medium ${
                      trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs 上周</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${accent === 'custom' ? '' : iconAccentClasses(accent)}`} style={accent === 'custom' ? iconCustomStyle(customColor) : undefined}>
                {renderedIcon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
