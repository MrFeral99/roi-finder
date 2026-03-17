import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeIdealista, ScrapedProperty } from '@/scrapers/idealistaScraper'
import { scrapeSubito } from '@/scrapers/subitoScraper'
import { getTodaysBatch } from '@/data/cities'

export const maxDuration = 60

const IDEALISTA_BASE = 'https://www.idealista.it/vendita-case'
const SUBITO_URL = 'https://www.subito.it/annunci-italia/vendita/appartamenti/'

// Vercel Cron calls this with the Authorization header set to CRON_SECRET
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const todaysBatch = getTodaysBatch()
  console.log(`[cron] Scraping batch: ${todaysBatch.map((c) => c.name).join(', ')}`)

  const all: ScrapedProperty[] = []

  // ── Idealista: one page per city, sequential ────────────────────────────────
  for (const city of todaysBatch) {
    try {
      const url = `${IDEALISTA_BASE}/${city.idealistaSlug}/`
      const results = await scrapeIdealista(url)
      all.push(...results)
    } catch (err) {
      console.error(`[cron] Idealista error for ${city.name}:`, (err as Error).message)
    }
  }

  // ── Subito: national feed ───────────────────────────────────────────────────
  try {
    const results = await scrapeSubito(SUBITO_URL)
    all.push(...results)
  } catch (err) {
    console.error('[cron] Subito error:', (err as Error).message)
  }

  // ── Persist with deduplication ─────────────────────────────────────────────
  let inserted = 0
  let skipped = 0

  for (const listing of all) {
    const existing = await prisma.property.findFirst({ where: { sourceUrl: listing.sourceUrl } })
    if (existing) { skipped++; continue }
    await prisma.property.create({ data: listing })
    inserted++
  }

  console.log(`[cron] Done: ${inserted} inserted, ${skipped} skipped out of ${all.length} total`)
  return NextResponse.json({ inserted, skipped, total: all.length, cities: todaysBatch.map((c) => c.name) })
}
