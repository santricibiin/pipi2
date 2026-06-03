'use client'

import { useEffect, useState } from 'react'

type FileEntry = { id: number; name: string; size: number; mtime: number; total: number }
type OrderDetail = {
  orderId: string
  total: number
  scrapedAt: string
  products: Array<{ name?: string; variation?: string; code?: string; subtotal?: string; qty?: string }>
  paymentBreakdown: Array<{ label?: string; amount?: string }> | null
}

function rp(n: number | string | undefined) {
  if (typeof n === 'string') return n
  if (!n) return 'Rp0'
  const sign = n < 0 ? '-' : ''
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID')
}

export default function ResultList({ refreshKey }: { refreshKey: number }) {
  const [files, setFiles] = useState<FileEntry[]>([])
  const [viewing, setViewing] = useState<OrderDetail | null>(null)

  const load = async () => {
    const r = await fetch('/api/results').then((x) => x.json()).catch(() => null)
    if (r?.ok) setFiles(r.files)
  }

  useEffect(() => { load() }, [refreshKey])

  const viewFile = async (id: number) => {
    const r = await fetch(`/api/result?id=${id}`).then((x) => x.json()).catch(() => null)
    if (r?.ok) setViewing(r.order)
  }

  const deleteFile = async (id: number) => {
    if (!confirm('Hapus pesanan ini?')) return
    await fetch(`/api/clear?id=${id}`, { method: 'POST' })
    load()
  }

  const clearAll = async () => {
    if (!confirm('Hapus semua hasil? Tidak bisa dibatalkan.')) return
    await fetch('/api/clear', { method: 'POST' })
    load()
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-ink">Daftar Pesanan</h2>
          <span className="text-[11px] font-medium text-muted bg-gray-100 px-2 py-0.5 rounded-full">{files.length}</span>
          <div className="ml-auto">
            <button onClick={clearAll} disabled={files.length === 0} className="text-[11px] font-semibold text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-30 disabled:cursor-not-allowed">
              Hapus Semua
            </button>
          </div>
        </div>
        <div className="card-body">
          {files.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-gray-100 grid place-items-center mx-auto mb-3">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
              </div>
              <p className="text-sm text-muted">Belum ada data pesanan</p>
              <p className="text-xs text-muted mt-1">Mulai scrape untuk mengisi riwayat</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} onClick={() => viewFile(f.id)} className="flex items-center gap-4 p-3.5 rounded-xl border border-border hover:border-orange-200 hover:bg-orange-50/30 cursor-pointer transition group">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-orange-100 grid place-items-center shrink-0 transition">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-ink truncate">{f.name.replace('.json', '')}</div>
                    <div className="text-[11px] text-muted mt-0.5">{new Date(f.mtime).toLocaleString('id-ID')}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-ink tabular-nums">{rp(f.total)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteFile(f.id) }} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-gray-50/50">
              <div className="w-9 h-9 rounded-lg bg-orange-100 grid place-items-center">
                <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-sm text-ink">Pesanan #{viewing.orderId}</div>
                <div className="text-[11px] text-muted">{new Date(viewing.scrapedAt).toLocaleString('id-ID')}</div>
              </div>
              <button onClick={() => setViewing(null)} className="ml-auto text-xs font-semibold text-muted bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition">Tutup</button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-5">
              {/* Products */}
              <div>
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Produk</h3>
                <div className="space-y-2">
                  {viewing.products?.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-white border border-border grid place-items-center shrink-0 text-xs font-bold text-orange-500">
                        {p.qty || '1'}x
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-ink leading-tight">{p.name || 'Produk'}</div>
                        {p.variation && <div className="text-[11px] text-muted mt-0.5">{p.variation}</div>}
                        {p.code && <div className="text-[10px] font-mono text-muted/70 mt-0.5">SKU: {p.code}</div>}
                      </div>
                      <div className="text-sm font-bold text-ink tabular-nums shrink-0">{p.subtotal || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Breakdown */}
              {viewing.paymentBreakdown && viewing.paymentBreakdown.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Rincian Biaya</h3>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    {viewing.paymentBreakdown.map((row, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-muted">{row.label}</span>
                        <span className="text-sm font-medium text-ink tabular-nums">{row.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200/50">
                <span className="text-sm font-semibold text-orange-800">Total Penghasilan</span>
                <span className="text-lg font-extrabold text-orange-600 tabular-nums">{rp(viewing.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
