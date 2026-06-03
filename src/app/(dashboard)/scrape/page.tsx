'use client'

import ScrapeForm from '@/components/ScrapeForm'
import LiveLog from '@/components/LiveLog'
import { useApp } from '@/components/layout/AppContext'

export default function ScrapePage() {
  const { running, logs, clearLogs, setTimerStart } = useApp()

  const handleStart = () => {
    clearLogs()
    setTimerStart(Date.now())
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Scrape Pesanan</h1>
        <p className="text-sm text-muted mt-0.5">Tarik data pesanan dari Shopee Seller Center</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        <ScrapeForm running={running} onStart={handleStart} />
        <LiveLog logs={logs} />
      </div>
    </div>
  )
}
