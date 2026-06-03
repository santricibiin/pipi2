export function parseAmount(raw: string | undefined): number {
  if (!raw) return 0
  const negative = raw.includes('-')
  const digits = raw.replace(/[^0-9]/g, '')
  if (!digits) return 0
  const n = parseInt(digits, 10)
  return negative ? -n : n
}

export function parseVariation(raw: string | undefined): { color: string; size: string } {
  if (!raw) return { color: '', size: '' }
  let v = raw.replace(/Kode\s*Variasi\s*:.*$/i, '')
  v = v.replace(/^\s*Variasi\s*:\s*/i, '').trim()
  if (!v) return { color: '', size: '' }
  const comma = v.indexOf(',')
  if (comma === -1) return { color: v.trim(), size: '' }
  return {
    color: v.slice(0, comma).trim(),
    size: v.slice(comma + 1).trim(),
  }
}

export function formatRupiah(n: number): string {
  const sign = n < 0 ? '-' : ''
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID')
}

const PROCESSING_FEE_PER_ORDER = 1250
const AMS_LABEL = /komisi.*ams|ams.*komisi|biaya komisi ams|komisi affiliate|komisi afiliasi/i

function breakdownAbs(rows: Array<{ label?: string; amount?: string }> | undefined, label: string): number {
  if (!rows) return 0
  const row = rows.find((r) => (r.label ?? '').trim() === label)
  return row ? Math.abs(parseAmount(row.amount)) : 0
}

function breakdownMatch(rows: Array<{ label?: string; amount?: string }> | undefined, pattern: RegExp): { total: number; count: number } {
  if (!rows) return { total: 0, count: 0 }
  let total = 0
  let count = 0
  for (const r of rows) {
    if (pattern.test((r.label ?? '').trim())) {
      total += Math.abs(parseAmount(r.amount))
      count += 1
    }
  }
  return { total, count }
}

export type OrderData = {
  products?: Array<{ name?: string; variation?: string; code?: string; subtotal?: string; qty?: string }>
  paymentBreakdown?: Array<{ label?: string; amount?: string }>
  total?: { amount?: string }
}

export type Summary = {
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
  products: ProductAgg[]
}

export type ProductAgg = {
  key: string
  name: string
  size: string
  color: string
  sku: string
  qty: number
}

export function computeSummaryFromOrders(orders: Array<{ products: unknown; paymentBreakdown: unknown; total: number }>): Summary {
  const summary: Summary = {
    orderCount: 0,
    productCount: 0,
    grossIncome: 0,
    adminFee: 0,
    insurance: 0,
    serviceFee: 0,
    processingFee: 0,
    amsCommission: 0,
    amsOrderCount: 0,
    netIncome: 0,
    products: [],
  }

  const agg = new Map<string, ProductAgg>()

  for (const order of orders) {
    const data = {
      products: order.products as OrderData['products'],
      paymentBreakdown: order.paymentBreakdown as OrderData['paymentBreakdown'],
    }

    summary.orderCount += 1

    for (const p of data.products ?? []) {
      summary.productCount += 1
      summary.grossIncome += parseAmount(p.subtotal)

      const pname = (p.name ?? '').trim()
      const variation = (p.variation ?? '').trim()
      const sku = (p.code ?? '').trim()
      const key = pname + '|||' + variation + '|||' + sku
      const qty = parseInt((p.qty ?? '').replace(/[^0-9]/g, ''), 10) || 0

      const existing = agg.get(key)
      if (existing) {
        existing.qty += qty
      } else {
        const { color, size } = parseVariation(variation)
        agg.set(key, { key, name: pname, size, color, sku, qty })
      }
    }

    summary.adminFee += breakdownAbs(data.paymentBreakdown, 'Biaya Administrasi')
    summary.insurance += breakdownAbs(data.paymentBreakdown, 'Premi')
    summary.serviceFee += breakdownAbs(data.paymentBreakdown, 'Biaya Layanan')
    const ams = breakdownMatch(data.paymentBreakdown, AMS_LABEL)
    summary.amsCommission += ams.total
    if (ams.count > 0) summary.amsOrderCount += 1
    summary.netIncome += order.total
  }

  summary.processingFee = summary.orderCount * PROCESSING_FEE_PER_ORDER
  summary.products = [...agg.values()].sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name))
  return summary
}
