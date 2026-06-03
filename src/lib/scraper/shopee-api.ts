/**
 * Shopee Order Scraper — Direct API mode.
 * Adapted from shopee/scrape-orders-api.ts for the Next.js web app.
 * Uses saved cookies to call Shopee's internal seller APIs via fetch().
 */

const SELLER_ORIGIN = 'https://seller.shopee.co.id'
const SELLER_HOST = 'seller.shopee.co.id'

const TAB_CODES: Record<string, number> = {
  all: 0,
  unpaid: 100,
  toship: 200,
  shipping: 300,
  completed: 500,
  cancelled: 600,
}

type IndexEntry = { order_id: number; shop_id: number; region_id: string }

type PaymentLine = { label: string; amount: string }
type OrderProduct = {
  index?: string
  name: string
  variation?: string
  code?: string
  price?: string
  qty?: string
  subtotal?: string
}
type OrderDetail = {
  pathId: string
  orderSn?: string
  detailUrl: string
  status?: string
  products: OrderProduct[]
  paymentBreakdown: PaymentLine[]
  total?: PaymentLine
  scrapedAt: number
}

export type ScrapeConfig = {
  orderType?: string
  limit?: number
  maxPages?: number
  concurrency?: number
  log?: (msg: string) => void
}

export type ScrapeResult = {
  orderType: string
  details: OrderDetail[]
}

function fmtRp(micro: number): string {
  const v = Math.round(micro / 100000)
  const neg = v < 0
  const abs = Math.abs(v).toLocaleString('id-ID')
  return `${neg ? '-Rp' : 'Rp'}${abs}`
}

function fmtNum(micro: number): string {
  return Math.round(micro / 100000).toLocaleString('id-ID')
}

function buildCookieHeader(cookieText: string): { header: string; spcCds: string } {
  const lines = cookieText.split(/\r?\n/)
  const cookies: Array<{ name: string; value: string; domain: string }> = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const parts = trimmed.split('\t')
    if (parts.length >= 7) {
      const domain = parts[0]
      const d = domain.replace(/^\./, '')
      if (SELLER_HOST === d || SELLER_HOST.endsWith('.' + d)) {
        cookies.push({ name: parts[5], value: parts[6], domain })
      }
    }
  }

  const byName = new Map<string, { name: string; value: string; domain: string }>()
  for (const c of cookies) {
    const prev = byName.get(c.name)
    const dlen = c.domain.replace(/^\./, '').length
    if (!prev || dlen > prev.domain.replace(/^\./, '').length) byName.set(c.name, c)
  }

  const header = [...byName.values()].map((c) => `${c.name}=${c.value}`).join('; ')
  const spcCds = byName.get('SPC_CDS')?.value ?? ''
  return { header, spcCds }
}

type Poster = <T = any>(path: string, body: unknown) => Promise<T>

function makeFetchPoster(cookieText: string): Poster {
  const { header: cookieHeader, spcCds } = buildCookieHeader(cookieText)
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0'

  return (async <T = any>(path: string, body: unknown): Promise<T> => {
    const sep = path.includes('?') ? '&' : '?'
    const url = `${SELLER_ORIGIN}${path}${sep}SPC_CDS=${spcCds}&SPC_CDS_VER=2`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=utf-8',
        'x-api-src-list': 'pc',
        accept: 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.5',
        origin: SELLER_ORIGIN,
        referer: `${SELLER_ORIGIN}/portal/sale/order`,
        'user-agent': ua,
        cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    })
    return res.json() as Promise<T>
  }) as Poster
}

function buildPayment(incomeData: any): { breakdown: PaymentLine[]; total?: PaymentLine } {
  const lines: PaymentLine[] = []
  let total: PaymentLine | undefined
  const breakdown = incomeData?.seller_income_breakdown?.breakdown ?? []
  for (const item of breakdown) {
    const line: PaymentLine = { label: item.display_name, amount: fmtRp(item.amount) }
    lines.push(line)
    if (item.field_name === 'ESCROW_AMOUNT') total = line
    for (const sub of item.sub_breakdown ?? []) {
      lines.push({ label: sub.display_name, amount: fmtRp(sub.amount) })
    }
  }
  return { breakdown: lines, total }
}

function buildProducts(incomeData: any): OrderProduct[] {
  const items = incomeData?.order_item_list?.order_items ?? []
  return items.map((it: any, i: number): OrderProduct => {
    const variationParts: string[] = []
    if (it.model_name) variationParts.push(`Variasi: ${it.model_name}`)
    if (it.model_sku || it.product_sku) variationParts.push(`Kode Variasi: ${it.model_sku || it.product_sku}`)
    return {
      index: String(i + 1),
      name: it.product_name ?? '',
      variation: variationParts.join('') || undefined,
      code: it.model_sku || it.product_sku || undefined,
      price: fmtNum(it.price ?? 0),
      qty: String(it.amount ?? ''),
      subtotal: fmtNum(it.subtotal ?? it.price ?? 0),
    }
  })
}

/**
 * Scrape orders directly from Shopee's API using saved cookies.
 * No browser needed — fast path (~2-10 seconds for typical stores).
 */
export async function scrapeOrdersDirect(cookieText: string, config: ScrapeConfig = {}): Promise<ScrapeResult> {
  const log = config.log ?? console.log
  const orderType = config.orderType ?? 'completed'
  const limit = config.limit ?? 0
  const maxPages = config.maxPages ?? 0
  const concurrency = Math.max(1, config.concurrency ?? 8)
  const orderListTab = TAB_CODES[orderType] ?? TAB_CODES.completed

  const post = makeFetchPoster(cookieText)

  // 1. Fetch order index (paginated)
  log(`[api] fetching order index (tab=${orderListTab}${maxPages > 0 ? `, max ${maxPages} halaman` : ''}${limit > 0 ? `, max ${limit} pesanan` : ''})...`)

  const index: IndexEntry[] = []
  const pageSize = 40
  for (let pageNo = 1; ; pageNo++) {
    const resp = await post('/api/v3/order/search_order_list_index', {
      order_list_tab: orderListTab,
      entity_type: 1,
      pagination: { from_page_number: 1, page_number: pageNo, page_size: pageSize },
      filter: { fulfillment_type: 0, is_drop_off: 0, fulfillment_source: 0, action_filter: 0 },
    })

    if (resp?.code !== 0) {
      if (pageNo === 1) {
        const err = new Error(`auth failed (code=${resp?.code} ${resp?.message ?? ''}) — session expired`) as Error & { authFailed?: boolean }
        err.authFailed = true
        throw err
      }
      log(`[api] ⚠️  halaman ${pageNo} error code=${resp?.code} — berhenti`)
      break
    }

    const batch: IndexEntry[] = resp?.data?.index_list ?? []
    index.push(...batch)
    if (batch.length < pageSize) break
    if (maxPages > 0 && pageNo >= maxPages) break
    if (limit > 0 && index.length >= limit) break
  }

  const ids = limit > 0 ? index.slice(0, limit) : index
  log(`[api] ditemukan ${index.length} pesanan${limit > 0 && ids.length < index.length ? ` (dibatasi ${ids.length})` : ''}`)

  if (ids.length === 0) {
    log(`[api] tidak ada pesanan ditemukan untuk tipe "${orderType}"`)
    return { orderType, details: [] }
  }

  // 2. Fetch order summaries (batched)
  const summaryMap = new Map<number, any>()
  const cardBatch = 5
  for (let i = 0; i < ids.length; i += cardBatch) {
    const slice = ids.slice(i, i + cardBatch)
    const resp = await post('/api/v3/order/get_order_list_card_list', {
      order_list_tab: orderListTab,
      need_count_down_desc: true,
      order_param_list: slice.map((e) => ({
        order_id: e.order_id,
        shop_id: e.shop_id,
        region_id: e.region_id,
      })),
    })
    for (const card of resp?.data?.card_list ?? []) {
      const oc = card.order_card
      const oid = oc?.order_ext_info?.order_id
      if (oid != null) summaryMap.set(oid, oc)
    }
  }
  log(`[api] fetched ${summaryMap.size} order summaries`)

  // 3. Fetch per-order income details (parallel pool)
  const details: OrderDetail[] = []
  let nextIndex = 0
  let done = 0
  const workers = Math.min(concurrency, ids.length || 1)
  log(`[api] mengambil ${ids.length} detail pesanan (${workers} parallel)...`)

  const runWorker = async (): Promise<void> => {
    while (true) {
      const i = nextIndex++
      if (i >= ids.length) break
      const e = ids[i]
      const oc = summaryMap.get(e.order_id)
      try {
        const income = await post('/api/v4/accounting/pc/seller_income/income_detail/get_order_income_components', {
          order_id: e.order_id,
          components: [2, 3, 4],
        })
        const incomeData = income?.data ?? {}
        const { breakdown, total } = buildPayment(incomeData)

        const detail: OrderDetail = {
          pathId: String(e.order_id),
          orderSn: oc?.card_header?.order_sn ?? incomeData?.order_info?.order_sn,
          detailUrl: `${SELLER_ORIGIN}/portal/sale/order/${e.order_id}`,
          status: oc?.status_info?.status,
          products: buildProducts(incomeData),
          paymentBreakdown: breakdown,
          total,
          scrapedAt: Date.now(),
        }
        details.push(detail)
        done++
        log(`[api] (${done}/${ids.length}) ✓ ${detail.orderSn ?? detail.pathId}`)
      } catch (err) {
        log(`[api] ⚠️  gagal order ${e.order_id}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
  }

  await Promise.all(Array.from({ length: workers }, () => runWorker()))
  log(`[api] ✅ selesai — ${details.length}/${ids.length} pesanan berhasil diambil`)
  return { orderType, details }
}
