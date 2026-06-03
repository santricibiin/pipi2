import { NextResponse } from 'next/server'
import { resolveAuth, isAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json({
    ok: true,
    role: auth.role,
    isAdmin: isAdmin(auth),
    protected: !!process.env.WEB_TOKEN,
  })
}
