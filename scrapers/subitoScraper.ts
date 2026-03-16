/**
 * Subito.it scraper
 *
 * Strategy: Subito.it is a Next.js app that embeds all listing data inside a
 * <script id="__NEXT_DATA__"> JSON blob — no headless browser needed.
 *
 * Path to listings:
 *   __NEXT_DATA__.props.pageProps.initialState.items.list[]
 *     → item.subject           (title)
 *     → item.features['/price'].values[0].value  (e.g. "95000 €")
 *     → item.features['/size'].values[0].value   (e.g. "75 mq")
 *     → item.features['/rooms'].values[0].value  (e.g. "3")
 *     → item.geo.town.value    (city)
 *     → item.geo.city.value    (province)
 *     → item.urls.default      (listing URL)
 */

import { ScrapedProperty } from './idealistaScraper'

const SEARCH_URL =
  'https://www.subito.it/annunci-italia/vendita/appartamenti/'

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Cache-Control': 'no-cache',
}

export async function scrapeSubito(url = SEARCH_URL): Promise<ScrapedProperty[]> {
  console.log(`[subito] Fetching: ${url}`)
  const html = await fetchHtml(url)
  const nextData: SubitoNextData | null = extractNextData(html)

  if (!nextData) {
    console.warn('[subito] __NEXT_DATA__ not found')
    return []
  }

  // Uncomment to debug the raw structure:
  // console.log(JSON.stringify(nextData?.props?.pageProps?.initialState?.items?.list?.[0], null, 2))

  const list: unknown[] =
    nextData?.props?.pageProps?.initialState?.items?.list ?? []

  const results: ScrapedProperty[] = []

  for (const entry of list) {
    const item = (entry as { item?: Record<string, unknown> })?.item
    if (!item) continue

    const title = String(item.subject ?? '').trim()
    const priceRaw = getFeatureValue(item, '/price')
    const sizeRaw = getFeatureValue(item, '/size')
    const town = getGeo(item, 'town')
    const url = String((item as { urls?: { default?: string } }).urls?.default ?? '')

    if (!title || !priceRaw || !town || !url) continue

    const price = parseNumber(priceRaw)
    const sqm = parseNumber(sizeRaw)

    if (price <= 0 || sqm <= 0) continue

    results.push({
      title,
      price,
      city: normalizeCity(town),
      address: town,
      sqm,
      sourceUrl: url,
      sourceSite: 'subito.it',
      isAuction: false,
      auctionDate: null,
    })
  }

  console.log(`[subito] Found ${results.length} valid listings`)
  return results
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`[subito] HTTP ${res.status} for ${url}`)
  return res.text()
}

interface SubitoNextData {
  props?: {
    pageProps?: {
      initialState?: {
        items?: {
          list?: unknown[]
        }
      }
    }
  }
}

function extractNextData(html: string): SubitoNextData | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as SubitoNextData
  } catch {
    return null
  }
}

function getFeatureValue(item: Record<string, unknown>, key: string): string {
  const features = item.features as Record<string, unknown> | undefined
  if (!features) return ''
  const feat = features[key] as { values?: Array<{ value?: string }> } | undefined
  return feat?.values?.[0]?.value ?? ''
}

function getGeo(item: Record<string, unknown>, field: 'town' | 'city'): string {
  const geo = item.geo as Record<string, { value?: string }> | undefined
  return geo?.[field]?.value ?? ''
}

function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, '')
  return parseFloat(cleaned) || 0
}

/** Capitalizes first letter to match our city index (e.g. "torino" → "Torino") */
function normalizeCity(raw: string): string {
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}
