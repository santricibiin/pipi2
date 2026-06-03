import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeSummaryFromOrders } from '@/lib/utils'

export async function GET(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const userId = auth.userId ?? 0
  const where = auth.role === 'admin' || auth.role === 'open' ? {} : { userId }

  const orders = await prisma.order.findMany({
    where,
    select: { products: true, paymentBreakdown: true, total: true },
  })

  const summary = computeSummaryFromOrders(
    orders.map((o) => ({
      products: o.products,
      paymentBreakdown: o.paymentBreakdown,
      total: o.total,
    }))
  )

  return NextResponse.json({ ok: true, summary })
}
