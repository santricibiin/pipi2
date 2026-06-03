import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChannel, isRunning } from '@/lib/sse'

export async function POST(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const channel = getChannel(auth.userId, auth.role)
  if (isRunning(channel)) {
    return NextResponse.json({ ok: false, error: 'tidak bisa hapus saat scrape berjalan' }, { status: 409 })
  }

  const url = new URL(request.url)
  const id = parseInt(url.searchParams.get('id') ?? '0')
  const userId = auth.userId ?? 0

  if (id) {
    const where = auth.role === 'admin' || auth.role === 'open' ? { id } : { id, userId }
    await prisma.order.deleteMany({ where })
    return NextResponse.json({ ok: true, removed: 1 })
  }

  const where = auth.role === 'admin' || auth.role === 'open' ? {} : { userId }
  const result = await prisma.order.deleteMany({ where })
  return NextResponse.json({ ok: true, removed: result.count })
}
