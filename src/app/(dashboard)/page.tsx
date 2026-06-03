'use client'

import Summary from '@/components/Summary'
import { useApp } from '@/components/layout/AppContext'

export default function DashboardPage() {
  const { refreshKey } = useApp()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Ringkasan penghasilan dari pesanan Shopee</p>
      </div>
      <Summary refreshKey={refreshKey} />
    </div>
  )
}
