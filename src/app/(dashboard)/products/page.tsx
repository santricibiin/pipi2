'use client'

import ProductTable from '@/components/ProductTable'
import { useApp } from '@/components/layout/AppContext'

export default function ProductsPage() {
  const { refreshKey } = useApp()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-ink">Produk & Modal</h1>
        <p className="text-sm text-muted mt-0.5">Kelola HPP dan hitung laba bersih</p>
      </div>
      <ProductTable refreshKey={refreshKey} />
    </div>
  )
}
