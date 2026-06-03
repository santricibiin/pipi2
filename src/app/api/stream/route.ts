import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { createSSEStream, getChannel } from '@/lib/sse'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const channel = getChannel(auth.userId, auth.role)
  const stream = createSSEStream(channel)

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
