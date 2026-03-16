/**
 * runScraper.ts
 *
 * Usage:
 *   npm run scrape                        → runs all scrapers once
 *   npm run scrape -- --site subito       → only Subito.it
 *   npm run scrape -- --site idealista    → only Idealista.it
 *   npm run scrape -- --url "https://..."  → Idealista with custom URL
 *   npm run scrape -- --daemon            → run once + cron daily at 06:00
 */

import { PrismaClient } from '@prisma/client'
import cron from 'node-cron'
import { scrapeSubito } from '../scrapers/subitoScraper'
import { scrapeIdealista, IDEALISTA_DEFAULT_URL, ScrapedProperty } from '../scrapers/idealistaScraper'

const prisma = new PrismaClient()

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const daemonMode = args.includes('--daemon')
const siteArg = args[args.indexOf('--site') + 1]  // 'subito' | 'idealista'
const urlArgIdx = args.indexOf('--url')
const urlArg = urlArgIdx !== -1 ? args[urlArgIdx + 1] : undefined

// ─── main ─────────────────────────────────────────────────────────────────────

async function runScraper() {
  console.log(`\n[${new Date().toISOString()}] 🔍 Starting scraper...`)
  const listings: ScrapedProperty[] = []

  // Idealista.it
  if (!siteArg || siteArg === 'idealista') {
    try {
      const results = await scrapeIdealista(urlArg ?? IDEALISTA_DEFAULT_URL)
      listings.push(...results)
    } catch (err) {
      console.error('[idealista] Error:', (err as Error).message)
    }
  }

  // Subito.it
  if (!siteArg || siteArg === 'subito') {
    try {
      const results = await scrapeSubito()
      listings.push(...results)
    } catch (err) {
      console.error('[subito] Error:', (err as Error).message)
    }
  }

  console.log(`\n📦 Total scraped: ${listings.length} listings`)

  if (listings.length === 0) {
    console.log('⚠️  Nothing to insert.')
    return
  }

  await saveToDatabase(listings)
}

async function saveToDatabase(listings: ScrapedProperty[]) {
  let inserted = 0
  let skipped = 0

  for (const listing of listings) {
    const existing = await prisma.property.findFirst({
      where: { sourceUrl: listing.sourceUrl },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.property.create({ data: listing })
    inserted++
    console.log(`  ✓ [${listing.sourceSite}] ${listing.city} — ${listing.title}`)
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${skipped} duplicates skipped`)
}

// ─── entry point ──────────────────────────────────────────────────────────────

runScraper()
  .catch(console.error)
  .finally(async () => {
    if (!daemonMode) await prisma.$disconnect()
  })

if (daemonMode) {
  cron.schedule('0 6 * * *', () => {
    console.log('\n⏰ Daily cron triggered')
    runScraper().catch(console.error)
  })
  console.log('⏳ Daemon mode: cron scheduled daily at 06:00. Press Ctrl+C to stop.\n')
}
