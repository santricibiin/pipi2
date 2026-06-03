import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChannel, isRunning, setRunning, broadcast, broadcastEvent } from '@/lib/sse'
import { scrapeOrdersDirect } from '@/lib/scraper/shopee-api'
import { parseAmount } from '@/lib/utils'

export async function POST(request: Request) {
  const auth = await resolveAuth(request)
  if (auth.role === 'none') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const channel = getChannel(auth.userId, auth.role)

  if (isRunning(channel)) {
    return NextResponse.json({ ok: false, error: 'sedang berjalan' }, { status: 409 })
  }

  let body: {
    type?: string
    limit?: number
    maxPages?: number
    concurrency?: number
    mode?: 'api' | 'browser'
  } = {}
  try {
    body = await request.json()
  } catch {}

  const userId = auth.userId ?? 0

  setRunning(channel, true)

  const job = await prisma.scrapeJob.create({
    data: { userId, status: 'running', config: body as object },
  })

  runScrape(body, channel, userId, job.id).catch((e) => {
    broadcast(channel, `[web] 💥 error: ${e instanceof Error ? e.message : String(e)}`)
  }).finally(() => {
    setRunning(channel, false)
  })

  return NextResponse.json({ ok: true, jobId: job.id })
}

async function runScrape(
  body: { type?: string; limit?: number; maxPages?: number; concurrency?: number; mode?: string },
  channel: string,
  userId: number,
  jobId: number
) {
  const log = (line: string) => broadcast(channel, line)

  // Get the user's latest cookie
  const cookie = await prisma.cookie.findFirst({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  })

  if (!cookie) {
    log('[web] ❌ belum ada cookies tersimpan. Upload cookies dulu.')
    await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'error', finishedAt: new Date() } })
    return
  }

  log('[web] 🍪 cookies ditemukan, memulai scrape via API...')

  try {
    const result = await scrapeOrdersDirect(cookie.content, {
      orderType: body.type || 'completed',
      limit: body.limit || 0,
      maxPages: body.maxPages || 0,
      concurrency: body.concurrency || 8,
      log,
    })

    // Save orders to database
    let saved = 0
    for (const detail of result.details) {
      const total = detail.total ? parseAmount(detail.total.amount) : 0
      await prisma.order.create({
        data: {
          userId,
          orderId: detail.orderSn || detail.pathId,
          products: detail.products as object,
          paymentBreakdown: detail.paymentBreakdown as object,
          total,
          rawJson: detail as object,
        },
      })
      saved++
    }

    log(`[web] ✅ selesai — ${saved} pesanan tersimpan ke database`)
    broadcastEvent(channel, 'done', { scraped: saved })
    await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'done', finishedAt: new Date() } })
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e)
    if (e?.authFailed) {
      log('[web] ❌ cookies kedaluwarsa / tidak valid. Export ulang cookies dari browser lalu upload lagi.')
    } else {
      log(`[web] 💥 error: ${msg}`)
    }
    await prisma.scrapeJob.update({ where: { id: jobId }, data: { status: 'error', finishedAt: new Date() } })
  }
}
