'use client'

import { useEffect, useState, useCallback } from 'react'

type ProductAgg = { key: string; name: string; size: string; color: string; sku: string; qty: number }

function rp(n: number) {
  const sign = n < 0 ? '-' : ''
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID')
}

const HPP_STORE = 'shopee-hpp-v1'
function loadHpp(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(HPP_STORE) || '{}') } catch { return {} }
}
function saveHpp(map: Record<string, number>) {
  try { localStorage.setItem(HPP_STORE, JSON.stringify(map)) } catch {}
}

export default function ProductTable({ refreshKey }: { refreshKey: number }) {
  const [products, setProducts] = useState<ProductAgg[]>([])
  const [netIncome, setNetIncome] = useState(0)
  const [hpp, setHpp] = useState<Record<string, number>>({})

  useEffect(() => {
    setHpp(loadHpp())
    fetch('/api/summary').then((r) => r.json()).then((d) => {
      if (d.ok) {
        setProducts(d.summary.products || [])
        setNetIncome(d.summary.netIncome || 0)
      }
    }).catch(() => {})
  }, [refreshKey])

  const totalCost = products.reduce((sum, p) => sum + (hpp[p.key] || 0) * p.qty, 0)
  const profit = netIncome - totalCost

  const updateHpp = useCallback((key: string, value: number) => {
    const next = { ...hpp }
    if (value) next[key] = value; else delete next[key]
    setHpp(next)
    saveHpp(next)
  }, [hpp])

  if (products.length === 0) return null

  return (
    <div className="card">
      <div className="card-header">
        <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-ink">Modal & Laba</h2>
      </div>
      <div className="card-body">
        {/* Profit cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 border border-border rounded-xl p-4">
            <div className="text-[11px] font-medium text-muted">Total Modal (HPP)</div>
            <div className="text-xl font-extrabold text-ink mt-1 tabular-nums">{rp(totalCost)}</div>
          </div>
          <div className={`rounded-xl p-4 ${profit >= 0 ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20' : 'bg-red-50 border border-red-200'}`}>
            <div className={`text-[11px] font-medium ${profit >= 0 ? 'text-emerald-100/80' : 'text-red-500'}`}>Laba Bersih</div>
            <div className={`text-xl font-extrabold mt-1 tabular-nums ${profit >= 0 ? 'text-white' : 'text-red-600'}`}>{rp(profit)}</div>
            <div className={`text-[10px] mt-0.5 ${profit >= 0 ? 'text-emerald-100/60' : 'text-red-400'}`}>Bersih − Modal</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide">Produk</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide">Variasi</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide w-14">Qty</th>
                <th className="text-left px-3 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide w-28">HPP/pcs</th>
                <th className="text-right px-3 py-2.5 text-[11px] font-semibold text-muted uppercase tracking-wide w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.key} className="border-b border-border last:border-0">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-ink text-[13px] leading-tight">{p.name || '-'}</div>
                    {p.sku && <div className="text-[10px] font-mono text-muted mt-0.5">{p.sku}</div>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-[12px] text-muted">{[p.color, p.size].filter(Boolean).join(', ') || '-'}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums text-ink">{p.qty}</td>
                  <td className="px-3 py-2.5">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted pointer-events-none">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        defaultValue={hpp[p.key] ? hpp[p.key].toLocaleString('id-ID') : ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0
                          e.target.value = val ? val.toLocaleString('id-ID') : ''
                          updateHpp(p.key, val)
                        }}
                        className="w-full pl-7 pr-2 py-1.5 text-[12px] tabular-nums bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold tabular-nums text-ink text-[13px]">{rp((hpp[p.key] || 0) * p.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
