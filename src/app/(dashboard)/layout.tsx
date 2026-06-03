'use client'

import { useState, useEffect } from 'react'
import { AppProvider, useApp } from '@/components/layout/AppContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

function AuthGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/whoami')
      .then((r) => r.json())
      .then((d) => setAuthed(d.ok === true))
      .catch(() => setAuthed(false))
  }, [])

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted font-medium">Memuat...</span>
        </div>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 grid place-items-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Token Diperlukan</h2>
          <p className="text-sm text-muted mb-4">Akses halaman ini memerlukan token autentikasi.</p>
          <code className="block text-xs bg-gray-100 text-ink px-4 py-2.5 rounded-xl font-mono break-all">
            http://ip:4321/?token=TOKEN_KAMU
          </code>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function Shell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useApp()

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar />
      <div
        className={`min-h-screen transition-all duration-200 ease-out lg:pl-[230px] ${collapsed ? 'lg:!pl-[72px]' : ''}`}
      >
        <Header />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppProvider>
        <Shell>{children}</Shell>
      </AppProvider>
    </AuthGate>
  )
}
