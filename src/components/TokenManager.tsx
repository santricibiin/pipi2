'use client'

import { useEffect, useState } from 'react'

type Token = { token: string; label: string; createdAt: string; lastSeen: string | null; link: string }

export default function TokenManager() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [label, setLabel] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    const r = await fetch('/api/tokens').then((x) => x.json()).catch(() => null)
    if (r?.ok) setTokens(r.tokens)
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    const r = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label }),
    }).then((x) => x.json()).catch(() => null)
    if (r?.ok) {
      setLabel('')
      setStatus(`✅ Token "${r.token.label}" dibuat`)
      load()
    } else {
      setStatus(`❌ ${r?.error || 'gagal'}`)
    }
  }

  const revoke = async (token: string, lbl: string) => {
    if (!confirm(`Cabut token "${lbl}"?`)) return
    await fetch(`/api/tokens?target=${encodeURIComponent(token)}`, { method: 'DELETE' })
    setStatus(`🔒 Token "${lbl}" dicabut`)
    load()
  }

  const copy = (link: string, lbl: string) => {
    navigator.clipboard.writeText(link).then(
      () => setStatus(`✅ Link "${lbl}" disalin`),
      () => setStatus('Gagal menyalin')
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="w-8 h-8 rounded-lg bg-orange-50 grid place-items-center">
          <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-ink">Kelola Token Akses</h2>
      </div>
      <div className="card-body space-y-3">
        <p className="text-xs text-muted leading-relaxed">
          Buat token untuk orang lain. Masing-masing punya data terpisah.
        </p>
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Nama (mis. Budi)"
            className="input-field"
          />
          <button onClick={create} className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-bold text-sm rounded-xl whitespace-nowrap transition shadow-sm shadow-orange-500/20">
            Buat
          </button>
        </div>

        {tokens.length === 0 && (
          <p className="text-xs text-muted italic">Belum ada token.</p>
        )}

        <div className="space-y-2">
          {tokens.map((t) => (
            <div key={t.token} className="bg-gray-50 border border-border rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-sm text-ink">{t.label}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    {new Date(t.createdAt).toLocaleDateString('id-ID')} · {t.lastSeen ? `aktif ${new Date(t.lastSeen).toLocaleDateString('id-ID')}` : 'belum dipakai'}
                  </div>
                </div>
                <button onClick={() => revoke(t.token, t.label)} className="text-[11px] font-semibold text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50 transition">
                  Cabut
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <input readOnly value={t.link} className="flex-1 px-2.5 py-1.5 bg-white text-[10px] font-mono text-muted border border-border rounded-lg truncate" />
                <button onClick={() => copy(t.link, t.label)} className="text-[11px] font-semibold text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-50 transition whitespace-nowrap">
                  Salin
                </button>
              </div>
            </div>
          ))}
        </div>

        {status && <p className="text-xs text-muted">{status}</p>}
      </div>
    </div>
  )
}
