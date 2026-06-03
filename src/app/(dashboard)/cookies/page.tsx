'use client'

import CookieUpload from '@/components/CookieUpload'

export default function CookiesPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Cookies Login</h1>
        <p className="text-sm text-muted mt-0.5">Upload cookies untuk autentikasi ke Shopee</p>
      </div>
      <div className="max-w-lg">
        <CookieUpload />
      </div>
    </div>
  )
}
