'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const DynamicColorPicker: any = dynamic(async () => {
  const mod = await import('antd')
  return mod.ColorPicker as any
}, { ssr: false })

export function AntColorPickerLarge({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const handleChange = (color: any) => {
    try {
      const hex = color?.toHexString?.() || value
      onChange(hex)
    } catch {
      onChange(value)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <DynamicColorPicker defaultValue={value} size="large" showText onChange={handleChange} />
    </div>
  )
}

export function AntGradientPicker({
  defaultValue,
  onChangeCss,
}: {
  defaultValue: any
  onChangeCss: (css: string | null) => void
}) {
  const handleComplete = (color: any) => {
    try {
      const css = color?.toCssString?.()
      onChangeCss(css || null)
    } catch {
      onChangeCss(null)
    }
  }

  return (
    <DynamicColorPicker
      defaultValue={defaultValue}
      allowClear
      showText
      mode={["single", "gradient"]}
      size="large"
      onChangeComplete={handleComplete}
    />
  )
}
