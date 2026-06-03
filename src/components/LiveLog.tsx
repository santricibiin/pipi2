'use client'

import { useEffect, useRef } from 'react'

export default function LiveLog({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  const getClass = (line: string) => {
    if (/✅|done|selesai|logged in|✓/i.test(line)) return 'text-emerald-400'
    if (/⚠|WARN|warn/i.test(line)) return 'text-amber-300'
    if (/❌|💥|error|gagal|fatal/i.test(line)) return 'text-red-400'
    return 'text-gray-300'
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-ink">Live Log</h2>
      </div>
      <div className="card-body">
        <div ref={ref} className="bg-[#1a1a2e] rounded-xl p-4 h-[240px] overflow-auto font-mono text-[11px] leading-[1.7] scroll-smooth">
          {logs.length === 0 && <span className="text-gray-500">Menunggu proses scrape...</span>}
          {logs.map((line, i) => (
            <div key={i} className={getClass(line)}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
