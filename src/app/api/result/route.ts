import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const id = parseInt(url.searchParams.get('id') ?? '0')
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })

  const userId = auth.userId ?? 0
  const where = auth.role === 'admin' || auth.role === 'open' ? { id } : { id, userId }

  const order = await prisma.order.findFirst({ where })
  if (!order) return NextResponse.json({ ok: false, error: 'tidak ditemukan' }, { status: 404 })

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      orderId: order.orderId,
      products: order.products,
      paymentBreakdown: order.paymentBreakdown,
      total: order.total,
      scrapedAt: order.scrapedAt.toISOString(),
    },
  })
}
