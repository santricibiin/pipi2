'use client'

import { useState } from 'react'

export default function CookieUpload() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setText(await file.text())
    setStatus(`File "${file.name}" dimuat — klik Upload.`)
  }

  const handleUpload = async () => {
    if (!text.trim()) { setStatus('⚠️ Tempel atau pilih file cookies dulu.'); return }
    setLoading(true)
    setStatus('Menyimpan...')
    try {
      const r = await fetch('/api/cookies', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cookies: text }),
      })
      const j = await r.json()
      setStatus(j.ok
        ? `✅ ${j.shopee} cookie Shopee tersimpan. Siap scrape!`
        : `❌ ${j.error || 'Gagal menyimpan'}`)
    } catch (err: any) {
      setStatus(`❌ ${err?.message || 'Gagal mengirim'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-ink">Cookies Login</h2>
      </div>
      <div className="card-body space-y-3">
        <p className="text-xs text-muted leading-relaxed">
          Tempel cookies dari <span className="font-medium text-ink">seller.shopee.co.id</span> (format Netscape/JSON).
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Tempel isi cookies.txt di sini..."
          className="input-field !font-mono !text-xs resize-y"
        />
        <input type="file" accept=".txt,.json" onChange={handleFile} className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-ink hover:file:bg-orange-50 file:cursor-pointer file:transition" />
        <button onClick={handleUpload} disabled={loading} className="btn-ghost">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Upload Cookies
        </button>
        {status && <p className="text-xs text-muted pt-1">{status}</p>}
      </div>
    </div>
  )
}
