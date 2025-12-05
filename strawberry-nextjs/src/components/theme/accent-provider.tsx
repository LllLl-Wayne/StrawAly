'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { accentHex, getContrastText } from '@/lib/themeAccent'

export type Accent = 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'gray' | 'black' | 'white' | 'custom'

type AccentProviderState = {
  accent: Accent
  customColor: string
  setAccent: (accent: Accent) => void
  setCustomColor: (hex: string) => void
}

const AccentContext = createContext<AccentProviderState>({ accent: 'pink', customColor: '#1677ff', setAccent: () => {}, setCustomColor: () => {} })

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<Accent>('pink')
  const [customColor, setCustomColorState] = useState<string>('#1677ff')
  const storageKeyAccent = 'strawberry-ui-accent'
  const storageKeyColor = 'strawberry-ui-accent-color'

  useEffect(() => {
    const savedAccent = typeof window !== 'undefined' ? (localStorage.getItem(storageKeyAccent) as Accent | null) : null
    const savedColor = typeof window !== 'undefined' ? localStorage.getItem(storageKeyColor) : null
    if (savedAccent) setAccentState(savedAccent)
    if (savedColor) setCustomColorState(savedColor)
  }, [])

  const setAccent = (value: Accent) => {
    if (typeof window !== 'undefined') localStorage.setItem(storageKeyAccent, value)
    setAccentState(value)
  }

  const setCustomColor = (hex: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(storageKeyColor, hex)
    setCustomColorState(hex)
  }

  useEffect(() => {
    const hex = accentHex(accent, customColor)
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent-color', hex)
      const fg = getContrastText(hex) === 'black' ? '#111827' : '#ffffff'
      document.documentElement.style.setProperty('--accent-foreground', fg)
    }
  }, [accent, customColor])

  return (
    <AccentContext.Provider value={{ accent, customColor, setAccent, setCustomColor }}>
      {children}
    </AccentContext.Provider>
  )
}

export const useAccent = () => useContext(AccentContext)
