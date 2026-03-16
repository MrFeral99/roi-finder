/**
 * Idealista.it scraper
 *
 * Idealista renders HTML server-side — no __NEXT_DATA__, no DataDome.
 * We parse the listing <article> elements directly with regex.
 *
 * Auction detection (verified against live pages):
 *   <span class="listing-tags listing-tags-prominent">Asta 22/06/26</span>
 *   AND/OR price prefixed with "Da" (prezzo base d'asta)
 *
 * HTML structure:
 *   <article class="item ..." data-element-id="34734423">
 *     <a class="item-link" href="/immobile/34734423/"
 *        title="Casa in Via Roma, 12, Quartiere, Città">
 *     <span class="item-price h2-simulated">195.000<span class="txt-big">€</span></span>
 *     <div class="item-detail-char">
 *       <span class="item-detail">3 locali</span>
 *       <span class="item-detail">85 m2</span>
 *     </div>
 */

export interface ScrapedProperty {
  title: string
  price: number
  city: string
  address: string
  sqm: number
  sourceUrl: string
  sourceSite: string
  isAuction: boolean
  auctionDate: string | null
}

const BASE_URL = 'https://www.idealista.it'

export const IDEALISTA_DEFAULT_URL =
  'https://www.idealista.it/vendita-case/brindisi-brindisi/'

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  'sec-ch-ua': '"Chromium";v="122", "Google Chrome";v="122"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1',
}

export async function scrapeIdealista(url = IDEALISTA_DEFAULT_URL): Promise<ScrapedProperty[]> {
  console.log(`[idealista] Fetching: ${url}`)

  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) {
    throw new Error(`[idealista] HTTP ${res.status} — ${url}`)
  }

  const html = await res.text()
  return parseArticles(html, url)
}

// ─── parser ──────────────────────────────────────────────────────────────────

function parseArticles(html: string, pageUrl: string): ScrapedProperty[] {
  const citySlug = pageUrl.match(/vendita-case\/([^/]+)\//)?.[1] ?? ''
  const cityFromUrl = slugToCity(citySlug)

  const results: ScrapedProperty[] = []
  const articleRegex = /<article\b[^>]*class="item[^"]*"[^>]*>([\s\S]*?)<\/article>/g
  let match

  while ((match = articleRegex.exec(html)) !== null) {
    const block = match[1]
    if (!block.includes('item-link')) continue

    const title = extractAttr(block, 'item-link', 'title')
    const href = extractAttr(block, 'item-link', 'href')
    const details = extractAllText(block, 'item-detail')

    if (!title || !href) continue

    // ── Auction detection ────────────────────────────────────────────────────
    // Signal 1: listing-tags-prominent contains "Asta"
    const auctionTagMatch = block.match(
      /class="listing-tags[^"]*listing-tags-prominent[^"]*">([^<]*Asta[^<]*)</i
    ) ?? block.match(/class="listing-tags-prominent[^"]*">([^<]*Asta[^<]*)</i)

    // Signal 2: price prefixed with "Da" (base d'asta)
    const priceBlockMatch = block.match(/item-price[^>]*>\s*(Da\s*)?([\d\.]+)/)
    const hasDaPrefix = /item-price[^>]*>\s*Da\s/i.test(block) ||
      /price-row[^>]*>[\s\S]*?<span[^>]*>\s*Da\s/i.test(block)

    // Signal 3: description mentions "asta"
    const descMentionsAsta = /\bAsta\b/i.test(block)

    const isAuction = !!(auctionTagMatch || hasDaPrefix || descMentionsAsta)

    // Extract auction date from tag (e.g. "Asta 22/06/26")
    const auctionDate = auctionTagMatch
      ? (auctionTagMatch[1].match(/\d{2}\/\d{2}\/\d{2,4}/)?.[0] ?? null)
      : null

    // ── Price ────────────────────────────────────────────────────────────────
    const priceRaw = priceBlockMatch?.[2] ?? extractText(block, 'item-price h2-simulated')
    const price = parsePrice(priceRaw)
    const sqm = parseSqm(details)

    if (price <= 0 || sqm <= 0) continue

    const titleParts = title.split(',').map((s) => s.trim())
    const city = titleParts.length >= 2
      ? capitalizeCity(titleParts[titleParts.length - 1])
      : cityFromUrl

    const address = titleParts.slice(0, -1).join(', ')
    const sourceUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`

    results.push({
      title: title.trim(),
      price,
      city,
      address,
      sqm,
      sourceUrl,
      sourceSite: 'idealista.it',
      isAuction,
      auctionDate,
    })
  }

  const auctions = results.filter((r) => r.isAuction).length
  console.log(`[idealista] Parsed ${results.length} listings (${auctions} aste)`)
  return results
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function extractAttr(block: string, className: string, attr: string): string {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(
    `class="[^"]*${escaped}[^"]*"[^>]*${attr}="([^"]*)"` +
    `|${attr}="([^"]*)"[^>]*class="[^"]*${escaped}[^"]*"`,
    'i'
  )
  const m = regex.exec(block)
  return (m?.[1] ?? m?.[2] ?? '').trim()
}

function extractText(block: string, className: string): string {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`class="[^"]*${escaped}[^"]*"[^>]*>([\\s\\S]*?)<`, 'i')
  const m = regex.exec(block)
  if (!m) return ''
  return m[1].replace(/<[^>]+>/g, '').trim()
}

function extractAllText(block: string, className: string): string[] {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`class="${escaped}"[^>]*>([^<]*)<`, 'gi')
  const results: string[] = []
  let m
  while ((m = regex.exec(block)) !== null) results.push(m[1].trim())
  return results
}

function parsePrice(raw: string): number {
  return parseFloat(raw.replace(/\./g, '').replace(/[^\d]/g, '')) || 0
}

function parseSqm(details: string[]): number {
  for (const d of details) {
    const m = d.match(/(\d+)\s*m2?/i)
    if (m) return parseInt(m[1], 10)
  }
  return 0
}

function slugToCity(slug: string): string {
  return capitalizeCity(slug.split('-')[0] ?? slug)
}

function capitalizeCity(raw: string): string {
  return raw.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}
