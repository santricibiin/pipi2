'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from './AppContext'

const NAV = [
  { href: '/', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/scrape', label: 'Scrape', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { href: '/results', label: 'Riwayat', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/products', label: 'Produk & HPP', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
  { href: '/cookies', label: 'Cookies', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
]

const NAV_ADMIN = { href: '/tokens', label: 'Token Akses', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' }

export default function Sidebar() {
  const { isAdmin, running, collapsed, setCollapsed, sidebarOpen, setSidebarOpen } = useApp()
  const pathname = usePathname()

  const items = isAdmin ? [...NAV, NAV_ADMIN] : NAV

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-border z-50 flex flex-col transition-all duration-200 ease-out
          ${collapsed ? 'lg:w-[72px]' : 'lg:w-[230px]'}
          w-[250px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 h-14 px-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 grid place-items-center shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" />
            </svg>
          </div>
          {!collapsed && <span className="text-sm font-bold text-ink truncate">Shopee Scraper</span>}
          {/* Mobile close button */}
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition">
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group
                  ${active ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50 hover:text-ink'}`}
                title={collapsed ? item.label : undefined}
              >
                <svg className={`w-[18px] h-[18px] shrink-0 transition ${active ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer status */}
        <div className="border-t border-border px-3 py-3 shrink-0">
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${running ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'}`} />
            {!collapsed && <span className="text-[11px] font-medium text-muted">{running ? 'Scraping...' : 'Siap'}</span>}
          </div>
        </div>

        {/* Toggle collapse (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:grid absolute -right-3 top-[72px] w-6 h-6 bg-white border border-border rounded-full place-items-center shadow-sm hover:bg-gray-50 hover:shadow transition"
        >
          <svg className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>
    </>
  )
}
