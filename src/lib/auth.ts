import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { timingSafeEqual } from 'crypto'

const WEB_TOKEN = process.env.WEB_TOKEN ?? ''

export type AuthResult = {
  role: 'open' | 'admin' | 'guest' | 'none'
  token: string
  userId: number | null
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function resolveAuth(request: Request): Promise<AuthResult> {
  if (!WEB_TOKEN) return { role: 'open', token: '', userId: null }

  const url = new URL(request.url)
  const cookieStore = await cookies()
  const presented = url.searchParams.get('token') || cookieStore.get('sid')?.value || ''

  if (!presented) return { role: 'none', token: '', userId: null }

  if (presented.length === WEB_TOKEN.length && safeEqual(presented, WEB_TOKEN)) {
    const admin = await prisma.user.upsert({
      where: { token: presented },
      update: { lastSeen: new Date() },
      create: { token: presented, label: 'Admin', role: 'admin' },
    })
    return { role: 'admin', token: presented, userId: admin.id }
  }

  const user = await prisma.user.findFirst({
    where: { token: presented, role: 'guest' },
  })
  if (user) {
    prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } }).catch(() => {})
    return { role: 'guest', token: presented, userId: user.id }
  }

  return { role: 'none', token: '', userId: null }
}

export function isAdmin(auth: AuthResult): boolean {
  return auth.role === 'admin' || auth.role === 'open'
}
