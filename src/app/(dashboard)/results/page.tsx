'use client'

import ResultList from '@/components/ResultList'
import { useApp } from '@/components/layout/AppContext'

export default function ResultsPage() {
  const { refreshKey } = useApp()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Riwayat Pesanan</h1>
        <p className="text-sm text-muted mt-0.5">Semua pesanan yang sudah di-scrape</p>
      </div>
      <ResultList refreshKey={refreshKey} />
    </div>
  )
}
