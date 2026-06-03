'use client'

import { useEffect, useState } from 'react'
import { useApp } from './AppContext'

export default function Header() {
  const { running, timerStart, setSidebarOpen } = useApp()
  const [elapsed, setElapsed] = useState('00:00')

  useEffect(() => {
    if (!timerStart) { setElapsed('00:00'); return }
    const iv = setInterval(() => {
      const s = Math.floor((Date.now() - timerStart) / 1000)
      const mm = Math.floor(s / 60).toString().padStart(2, '0')
      const ss = (s % 60).toString().padStart(2, '0')
      setElapsed(`${mm}:${ss}`)
    }, 250)
    return () => clearInterval(iv)
  }, [timerStart])

  return (
    <header className="sticky top-0 z-10 h-14 bg-white/80 backdrop-blur-lg border-b border-border flex items-center px-5 gap-3">
      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition">
        <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3">
        {running && (
          <div className="flex items-center gap-2 text-xs font-semibold bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full border border-orange-200 animate-in">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="hidden sm:inline">Scraping</span>
            <span className="font-bold tabular-nums">{elapsed}</span>
          </div>
        )}
      </div>
    </header>
  )
}
