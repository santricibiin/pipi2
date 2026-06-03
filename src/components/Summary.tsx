'use client'

import { useEffect, useState } from 'react'

type SummaryData = {
  orderCount: number
  productCount: number
  grossIncome: number
  adminFee: number
  insurance: number
  serviceFee: number
  processingFee: number
  amsCommission: number
  amsOrderCount: number
  netIncome: number
}

function rp(n: number) {
  const sign = n < 0 ? '-' : ''
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID')
}

export default function Summary({ refreshKey }: { refreshKey: number }) {
  const [s, setS] = useState<SummaryData | null>(null)

  useEffect(() => {
    fetch('/api/summary').then((r) => r.json()).then((d) => {
      if (d.ok) setS(d.summary)
    }).catch(() => {})
  }, [refreshKey])

  if (!s) return null

  const fees = [
    { label: 'Admin', value: s.adminFee },
    { label: 'Asuransi', value: s.insurance },
    { label: 'Layanan', value: s.serviceFee },
    { label: 'Proses', value: s.processingFee },
    { label: 'Komisi AMS', value: s.amsCommission, sub: s.amsOrderCount > 0 ? `${s.amsOrderCount} pesanan` : '' },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-ink">Rekap Penghasilan</h2>
        <span className="ml-auto text-[11px] font-medium text-muted bg-gray-100 px-2.5 py-1 rounded-full">
          {s.orderCount} pesanan
        </span>
      </div>
      <div className="card-body">
        {/* Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
            <div className="text-xs font-medium text-orange-100/80">Penghasilan Bersih</div>
            <div className="text-[26px] sm:text-[30px] font-extrabold text-white mt-1 tabular-nums tracking-tight leading-tight">{rp(s.netIncome)}</div>
            <div className="text-[11px] text-orange-100/60 mt-1">setelah potong biaya</div>
          </div>
          <div className="rounded-2xl p-5 bg-gray-50 border border-border">
            <div className="text-xs font-medium text-muted">Penghasilan Kotor</div>
            <div className="text-[26px] sm:text-[30px] font-extrabold text-ink mt-1 tabular-nums tracking-tight leading-tight">{rp(s.grossIncome)}</div>
            <div className="text-[11px] text-muted mt-1">{s.productCount} produk terjual</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
          {fees.map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-border">
              <div className="text-[11px] font-medium text-muted">{item.label}</div>
              <div className="text-base font-bold text-ink mt-1 tabular-nums">{rp(item.value)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
