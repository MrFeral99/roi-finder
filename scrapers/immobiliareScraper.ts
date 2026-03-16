/**
 * Immobiliare.it scraper
 *
 * Strategy: Immobiliare.it is a Next.js app. All listing data is embedded in
 * a <script id="__NEXT_DATA__"> JSON blob in the HTML response.
 * We fetch with browser-like headers to avoid the 403 block, then parse JSON.
 *
 * Typical data path:
 *   __NEXT_DATA__.props.pageProps.searchResult.results[]
 *     → seo.url                          (listing URL)
 *     → seo.title                        (title)
 *     → properties[0].price.value        (price in €)
 *     → properties[0].surface            (e.g. "75 m²")
 *     → properties[0].location.municipality  (city)
 *     → properties[0].location.street    (street address)
 *
 * To discover the actual structure for a new page, set DEBUG=true and run:
 *   tsx scripts/runScraper.ts
 */

import { ScrapedProperty } from './idealistaScraper'

export const DEFAULT_URL =
  'https://www.immobiliare.it/vendita-case/brindisi/?idMZona[]=10685&idMZona[]=10683&idMZona[]=10686&idQuartiere[]=13971'

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
}

/** Set to true to dump the raw __NEXT_DATA__ structure for inspection */
const DEBUG = process.env.SCRAPER_DEBUG === 'true'

export async function scrapeImmobiliare(url = DEFAULT_URL): Promise<ScrapedProperty[]> {
  console.log(`[immobiliare] Fetching: ${url}`)

  const html = await fetchHtml(url)
  const nextData: NextData | null = extractNextData(html)

  if (!nextData) {
    console.warn('[immobiliare] __NEXT_DATA__ not found in page — site may have changed structure')
    return []
  }

  if (DEBUG) {
    const pp = nextData?.props?.pageProps ?? {}
    console.log('[immobiliare] Raw __NEXT_DATA__ keys:', Object.keys(pp))
  }

  // Navigate to results array (handles multiple known path variants)
  const results =
    nextData?.props?.pageProps?.searchResult?.results ??
    nextData?.props?.pageProps?.results ??
    []

  if (DEBUG) {
    console.log('[immobiliare] First result sample:', JSON.stringify(results[0], null, 2))
  }

  if (results.length === 0) {
    console.warn('[immobiliare] No results found — run with SCRAPER_DEBUG=true to inspect structure')
    return []
  }

  const scraped: ScrapedProperty[] = []

  for (const raw of results) {
    const listing = raw as ImmobiliareResult
    try {
      const prop = listing.properties?.[0] ?? listing.property

      const title = listing.seo?.title ?? listing.title ?? ''
      const listingUrl = listing.seo?.url ?? listing.url ?? ''
      const city = prop?.location?.municipality ?? prop?.location?.city ?? ''
      const address =
        [prop?.location?.street, prop?.location?.streetNumber, city]
          .filter(Boolean)
          .join(' ') || city

      const price = extractPrice(prop)
      const sqm = extractSurface(prop)

      if (!title || !listingUrl || price <= 0 || sqm <= 0) continue

      scraped.push({
        title: title.trim(),
        price,
        city: city.trim(),
        address: address.trim(),
        sqm,
        sourceUrl: listingUrl,
        sourceSite: 'immobiliare.it',
      })
    } catch (err) {
      if (DEBUG) console.warn('[immobiliare] Skipped listing due to parse error:', err)
    }
  }

  console.log(`[immobiliare] Found ${scraped.length} valid listings`)
  return scraped
}

// ─── type helpers ────────────────────────────────────────────────────────────

interface ImmobiliareResult {
  seo?: { url?: string; title?: string }
  title?: string
  url?: string
  properties?: ImmobilareProp[]
  property?: ImmobilareProp
}

interface ImmobilareProp {
  price?: { value?: number; formattedValue?: string }
  surface?: string
  location?: {
    municipality?: string
    city?: string
    street?: string
    streetNumber?: string
  }
}

function extractPrice(prop?: ImmobilareProp): number {
  if (!prop) return 0
  if (typeof prop.price?.value === 'number') return prop.price.value
  if (prop.price?.formattedValue) {
    return parseFloat(prop.price.formattedValue.replace(/[^\d]/g, '')) || 0
  }
  return 0
}

function extractSurface(prop?: ImmobilareProp): number {
  if (!prop?.surface) return 0
  return parseFloat(prop.surface.replace(/[^\d.]/g, '')) || 0
}

// ─── fetch ───────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) {
    throw new Error(
      `[immobiliare] HTTP ${res.status} — site may be blocking scraping. ` +
        `Try running with a VPN or from a browser session.`
    )
  }
  return res.text()
}

interface NextData {
  props?: {
    pageProps?: {
      searchResult?: { results?: unknown[] }
      results?: unknown[]
    }
  }
}

function extractNextData(html: string): NextData | null {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return null
  try {
    return JSON.parse(match[1]) as NextData
  } catch {
    return null
  }
}
