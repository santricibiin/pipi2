import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const userId = auth.userId ?? 0
  const where = auth.role === 'admin' || auth.role === 'open' ? {} : { userId }

  const orders = await prisma.order.findMany({
    where,
    select: { id: true, orderId: true, total: true, scrapedAt: true, products: true },
    orderBy: { scrapedAt: 'desc' },
  })

  const files = orders.map((o) => ({
    id: o.id,
    name: `${o.orderId}.json`,
    size: JSON.stringify(o.products).length,
    mtime: o.scrapedAt.getTime(),
    total: o.total,
  }))

  return NextResponse.json({ ok: true, files })
}
