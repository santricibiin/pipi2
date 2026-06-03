import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCookiesText, filterByDomain, serializeNetscape } from '@/lib/scraper/cookie-parser'

const SHOPEE_ROOT = 'shopee.co.id'

export async function POST(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let content = ''
  const ct = request.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      const body = await request.json()
      content = typeof body.cookies === 'string' ? body.cookies : ''
    } catch {
      content = ''
    }
  } else {
    content = await request.text()
  }
  content = content.trim()

  if (!content) {
    return NextResponse.json({ ok: false, error: 'isi cookies kosong' }, { status: 400 })
  }

  const all = parseCookiesText(content)
  const shopeeCookies = filterByDomain(all, SHOPEE_ROOT)

  if (shopeeCookies.length === 0) {
    return NextResponse.json({
      ok: false,
      error: `tidak ada cookie *.${SHOPEE_ROOT} ditemukan (dari ${all.length} cookie). Pastikan export saat login di seller.shopee.co.id.`,
    }, { status: 400 })
  }

  const userId = auth.userId ?? 0
  await prisma.cookie.create({
    data: {
      userId,
      content: serializeNetscape(all),
    },
  })

  return NextResponse.json({ ok: true, shopee: shopeeCookies.length, total: all.length })
}
