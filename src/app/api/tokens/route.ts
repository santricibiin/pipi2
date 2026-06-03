import { NextResponse } from 'next/server'
import { resolveAuth, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

export async function GET(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!isAdmin(auth)) return NextResponse.json({ ok: false, error: 'hanya admin yang boleh kelola token' }, { status: 403 })

  const users = await prisma.user.findMany({
    where: { role: 'guest' },
    orderBy: { createdAt: 'desc' },
  })

  const url = new URL(request.url)
  const base = `${url.protocol}//${url.host}`

  return NextResponse.json({
    ok: true,
    base,
    tokens: users.map((u) => ({
      token: u.token,
      label: u.label || 'Tanpa label',
      createdAt: u.createdAt.toISOString(),
      lastSeen: u.lastSeen?.toISOString() ?? null,
      link: `${base}/?token=${u.token}`,
    })),
  })
}

export async function POST(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!isAdmin(auth)) return NextResponse.json({ ok: false, error: 'hanya admin' }, { status: 403 })

  let label = ''
  try {
    const body = await request.json()
    label = body.label ?? ''
  } catch {}

  const token = randomBytes(24).toString('base64url')
  const user = await prisma.user.create({
    data: { token, label: label || 'Guest', role: 'guest' },
  })

  const url = new URL(request.url)
  const base = `${url.protocol}//${url.host}`

  return NextResponse.json({
    ok: true,
    token: {
      token: user.token,
      label: user.label,
      createdAt: user.createdAt.toISOString(),
      lastSeen: null,
      link: `${base}/?token=${user.token}`,
    },
  })
}

export async function DELETE(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!isAdmin(auth)) return NextResponse.json({ ok: false, error: 'hanya admin' }, { status: 403 })

  const url = new URL(request.url)
  const target = url.searchParams.get('target') ?? ''
  if (!target) return NextResponse.json({ ok: false, error: 'target required' }, { status: 400 })

  const deleted = await prisma.user.deleteMany({ where: { token: target, role: 'guest' } })
  return NextResponse.json({ ok: deleted.count > 0 })
}
