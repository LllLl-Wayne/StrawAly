'use client'

import React from 'react'

type PieDatum = {
  label: string
  value: number
  color: string
}

export function PieChart({
  data,
  size = 130,
  thickness = 24,
  showLegend = true,
  legendPosition = 'right',
  showCenter = true,
  padding = 8,
}: {
  data: PieDatum[]
  size?: number
  thickness?: number
  showLegend?: boolean
  legendPosition?: 'right' | 'bottom'
  showCenter?: boolean
  padding?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const pad = Math.max(4, padding) + thickness / 2
  const radius = Math.max(1, size / 2 - pad)
  const circumference = 2 * Math.PI * radius

  // 空数据
  if (!total) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-gray-500 text-sm">暂无数据</span>
      </div>
    )
  }

  let offset = 0
  const segments = data.map((d, i) => {
    const length = (d.value / total) * circumference
    const seg = (
      <circle
        key={i}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        fill="none"
        stroke={d.color}
        strokeWidth={thickness}
        strokeDasharray={`${length} ${circumference - length}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    )
    offset += length
    return seg
  })

  return (
    <div className={legendPosition === 'right' ? 'flex items-center gap-6' : 'flex flex-col items-center gap-3'}>
      <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet" className="flex-shrink-0 w-full max-w-[280px] aspect-square mx-auto p-2">
        {/* 背景圈 */}
        <circle
          r={radius}
          cx={size / 2}
          cy={size / 2}
          fill="none"
          stroke="rgba(203,213,225,0.35)"
          strokeWidth={thickness}
        />
        {segments}
        {/* 中心标签 */}
        {showCenter && (
          <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="fill-gray-700 dark:fill-gray-200" style={{ fontSize: Math.max(12, size * 0.12) }}>
            {total}
          </text>
        )}
      </svg>
      {showLegend && (
        legendPosition === 'right' ? (
          <div className="space-y-1">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                <span className="ml-auto text-gray-600 dark:text-gray-400">
                  {d.value} ({((d.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                <span className="ml-auto text-gray-600 dark:text-gray-400">
                  {d.value} ({((d.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
