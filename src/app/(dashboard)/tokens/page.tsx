'use client'

import TokenManager from '@/components/TokenManager'

export default function TokensPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Kelola Token Akses</h1>
        <p className="text-sm text-muted mt-0.5">Buat dan kelola token untuk pengguna lain</p>
      </div>
      <div className="max-w-lg">
        <TokenManager />
      </div>
    </div>
  )
}
