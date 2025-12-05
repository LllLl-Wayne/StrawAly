'use client'

import React, { useState } from 'react'
import { useAccent } from '@/components/theme/accent-provider'
import { accentHex, hexToRgba } from '@/lib/themeAccent'

export function AccentTogglePreview({
  checked: controlledChecked,
  onChange,
}: {
  checked?: boolean
  onChange?: (checked: boolean) => void
}) {
  const { accent, customColor } = useAccent()
  const [internalChecked, setInternalChecked] = useState<boolean>(controlledChecked ?? false)
  const [focused, setFocused] = useState<boolean>(false)

  const checked = controlledChecked ?? internalChecked
  const currentHex = accentHex(accent, customColor)
  const ringColor = hexToRgba(currentHex, 0.35)

  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => {
          setInternalChecked(e.target.checked)
          onChange?.(e.target.checked)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <div
        className="w-11 h-6 rounded-full relative"
        style={{
          backgroundColor: checked ? currentHex : '#E5E7EB',
          boxShadow: focused ? `0 0 0 4px ${ringColor}` : undefined,
          transition: 'background-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        <span
          className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-all"
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </div>
    </label>
  )
}

