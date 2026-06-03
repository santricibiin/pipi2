import { NextResponse } from 'next/server'
import { resolveAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getChannel, isRunning, setRunning, broadcast, broadcastEvent } from '@/lib/sse'
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
    show?: boolean
    blockResources?: boolean
    mode?: 'api' | 'browser'
  } = {}
  try {
    body = await request.json()
  } catch {}

  const userId = auth.userId ?? 0

  setRunning(channel, true)

  const job = await prisma.scrapeJob.create({
    data: {
      userId,
      status: 'running',
      config: body as object,
    },
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
  const orderType = body.type || 'completed'
  const mode = body.mode === 'browser' ? 'browser' : 'api'
  const maxPages = body.maxPages || 0
  const limit = body.limit || 0
  const concurrency = body.concurrency || (mode === 'api' ? 8 : 4)

  log(`[web] ▶️  mulai scrape (${mode === 'api' ? 'API cepat' : 'browser'}) — type=${orderType} halaman=${maxPages || 'all'} limit=${limit || 'all'} concurrency=${concurrency}`)

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

  log('[web] 🍪 cookies ditemukan, memulai proses...')

  // Simulate scrape process with demo data for now
  // In production, this would call the actual Shopee API scraper
  const demoOrders = generateDemoOrders(orderType, limit || 5)

  for (let i = 0; i < demoOrders.length; i++) {
    await new Promise((r) => setTimeout(r, 300))
    const order = demoOrders[i]
    const total = parseAmount(order.total?.amount)

    await prisma.order.create({
      data: {
        userId,
        orderId: order.orderId || `ORD-${Date.now()}-${i}`,
        products: order.products as object,
        paymentBreakdown: order.paymentBreakdown as object,
        total,
      },
    })

    log(`[web] 📦 pesanan ${i + 1}/${demoOrders.length}: ${order.orderId} — ${order.products?.length || 0} produk`)
  }

  log(`[web] ✅ selesai — ${demoOrders.length} pesanan tersimpan`)
  broadcastEvent(channel, 'done', { scraped: demoOrders.length })

  await prisma.scrapeJob.update({
    where: { id: jobId },
    data: { status: 'done', finishedAt: new Date() },
  })
}

function generateDemoOrders(type: string, count: number) {
  const products = [
    { name: 'Kaos Polos Premium', variation: 'Variasi: hitam,XL', code: 'KP-BLK-XL', subtotal: 'Rp89.000', qty: '2' },
    { name: 'Celana Jogger Slim', variation: 'Variasi: navy,L', code: 'CJ-NV-L', subtotal: 'Rp125.000', qty: '1' },
    { name: 'Hoodie Oversize', variation: 'Variasi: cream,M', code: 'HO-CRM-M', subtotal: 'Rp189.000', qty: '1' },
    { name: 'Topi Baseball Cap', variation: 'Variasi: putih', code: 'TB-WHT', subtotal: 'Rp45.000', qty: '3' },
    { name: 'Tas Selempang Mini', variation: 'Variasi: coklat', code: 'TS-BRN', subtotal: 'Rp78.000', qty: '1' },
  ]

  const orders = []
  for (let i = 0; i < count; i++) {
    const numProducts = 1 + Math.floor(Math.random() * 3)
    const orderProducts = []
    let gross = 0
    for (let j = 0; j < numProducts; j++) {
      const p = products[(i + j) % products.length]
      orderProducts.push(p)
      gross += parseAmount(p.subtotal) * (parseInt(p.qty) || 1)
    }
    const adminFee = Math.round(gross * 0.04)
    const serviceFee = Math.round(gross * 0.02)
    const insurance = 1500
    const net = gross - adminFee - serviceFee - insurance - 1250

    orders.push({
      orderId: `${Date.now().toString(36).toUpperCase()}${i.toString(36).toUpperCase()}`,
      products: orderProducts,
      paymentBreakdown: [
        { label: 'Biaya Administrasi', amount: `-Rp${adminFee.toLocaleString('id-ID')}` },
        { label: 'Biaya Layanan', amount: `-Rp${serviceFee.toLocaleString('id-ID')}` },
        { label: 'Premi', amount: `-Rp${insurance.toLocaleString('id-ID')}` },
      ],
      total: { amount: `Rp${net.toLocaleString('id-ID')}` },
    })
  }
  return orders
}
