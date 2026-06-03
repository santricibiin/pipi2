'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type AppState = {
  running: boolean
  setRunning: (v: boolean) => void
  logs: string[]
  addLog: (line: string) => void
  clearLogs: () => void
  refreshKey: number
  triggerRefresh: () => void
  timerStart: number | null
  setTimerStart: (v: number | null) => void
  isAdmin: boolean
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    fetch('/api/whoami').then((r) => r.json()).then((d) => {
      if (d.ok) setIsAdmin(d.isAdmin)
    }).catch(() => {})

    const es = new EventSource('/api/stream')
    es.onmessage = (e) => {
      try { setLogs((prev) => [...prev, JSON.parse(e.data)]) } catch {}
    }
    es.addEventListener('status', (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data)
        setRunning(data.running)
        if (data.running) setTimerStart(Date.now())
        else setTimerStart(null)
      } catch {}
    })
    es.addEventListener('done', () => setRefreshKey((k) => k + 1))
    return () => es.close()
  }, [])

  return (
    <AppContext.Provider value={{
      running, setRunning, logs,
      addLog: (line) => setLogs((p) => [...p, line]),
      clearLogs: () => setLogs([]),
      refreshKey, triggerRefresh: () => setRefreshKey((k) => k + 1),
      timerStart, setTimerStart, isAdmin,
      sidebarOpen, setSidebarOpen,
      collapsed, setCollapsed,
    }}>
      {children}
    </AppContext.Provider>
  )
}
