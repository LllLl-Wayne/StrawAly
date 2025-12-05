'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type BackgroundState = {
  css: string | null
  colors: string[]
  setCss: (css: string | null) => void
}

const BackgroundContext = createContext<BackgroundState>({ css: null, colors: [], setCss: () => {} })

function extractColors(css: string): string[] {
  const list: string[] = []
  const hex = css.match(/#([0-9a-fA-F]{3,8})/g) || []
  const rgb = css.match(/rgb[a]?\([^\)]+\)/g) || []
  const named = css.match(/\b[a-zA-Z]+\b/g) || []
  hex.forEach(c => list.push(c))
  rgb.forEach(c => list.push(c))
  named
    .filter(n => ['linear-gradient', 'radial-gradient'].indexOf(n) === -1)
    .forEach(n => list.push(n))
  return Array.from(new Set(list)).slice(0, 6)
}

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [css, setCssState] = useState<string | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const storageKey = 'strawberry-ui-bg-css'

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
    if (saved) {
      setCssState(saved)
      setColors(extractColors(saved))
    }
  }, [])

  const setCss = (value: string | null) => {
    if (typeof window !== 'undefined') {
      if (value) localStorage.setItem(storageKey, value)
      else localStorage.removeItem(storageKey)
    }
    setCssState(value)
    setColors(value ? extractColors(value) : [])
  }

  return (
    <BackgroundContext.Provider value={{ css, colors, setCss }}>
      {children}
    </BackgroundContext.Provider>
  )
}

export const useBackground = () => useContext(BackgroundContext)

