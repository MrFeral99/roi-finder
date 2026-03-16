import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeIdealista } from '@/scrapers/idealistaScraper'
import { ScrapedProperty } from '@/scrapers/idealistaScraper'

// Vercel Cron calls this with the Authorization header set to CRON_SECRET
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const urls = [
    'https://www.idealista.it/vendita-case/milano-milano/',
    'https://www.idealista.it/vendita-case/milano-milano/?pagina=2',
    'https://www.idealista.it/vendita-case/milano-milano/?pagina=3',
  ]

  const all: ScrapedProperty[] = []

  for (const url of urls) {
    try {
      const results = await scrapeIdealista(url)
      all.push(...results)
    } catch (err) {
      console.error(`[cron] Error scraping ${url}:`, (err as Error).message)
    }
  }

  let inserted = 0
  let skipped = 0

  for (const listing of all) {
    const existing = await prisma.property.findFirst({ where: { sourceUrl: listing.sourceUrl } })
    if (existing) { skipped++; continue }
    await prisma.property.create({ data: listing })
    inserted++
  }

  console.log(`[cron] Done: ${inserted} inserted, ${skipped} skipped`)
  return NextResponse.json({ inserted, skipped, total: all.length })
}
