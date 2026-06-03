'use client'

import { useState } from 'react'

export default function ScrapeForm({ running, onStart }: { running: boolean; onStart: () => void }) {
  const [type, setType] = useState('completed')
  const [mode, setMode] = useState('api')
  const [pages, setPages] = useState(0)
  const [limit, setLimit] = useState(0)
  const [concurrency, setConcurrency] = useState(8)
  const [show, setShow] = useState(false)
  const [block, setBlock] = useState(true)

  const handleStart = async () => {
    onStart()
    await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, mode, maxPages: pages, limit, concurrency, show, blockResources: block }),
    })
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H2a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V10h.09a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-ink">Pengaturan Scrape</h2>
      </div>
      <div className="card-body space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Tipe pesanan</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
            <option value="completed">Selesai (completed)</option>
            <option value="all">Semua (all)</option>
            <option value="unpaid">Belum bayar (unpaid)</option>
            <option value="toship">Perlu dikirim (toship)</option>
            <option value="shipping">Dikirim (shipping)</option>
            <option value="cancelled">Dibatalkan (cancelled)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Mode pengambilan</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="input-field">
            <option value="api">API cepat (direkomendasikan)</option>
            <option value="browser">Browser (lambat)</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Halaman</label>
            <input type="number" min="0" value={pages} onChange={(e) => setPages(+e.target.value)} placeholder="0 = semua" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Limit</label>
            <input type="number" min="0" value={limit} onChange={(e) => setLimit(+e.target.value)} placeholder="0 = semua" className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Concurrency</label>
          <input type="number" min="1" max="20" value={concurrency} onChange={(e) => setConcurrency(+e.target.value)} className="input-field" />
        </div>
        <div className="space-y-2.5 pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20" />
            <span className="text-sm text-ink">Tampilkan browser</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20" />
            <span className="text-sm text-ink">Blokir gambar (cepat)</span>
          </label>
        </div>
        <button onClick={handleStart} disabled={running} className="btn-primary mt-3">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
          {running ? 'Sedang berjalan...' : 'Mulai Scrape'}
        </button>
      </div>
    </div>
  )
}
