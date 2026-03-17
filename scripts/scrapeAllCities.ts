/**
 * One-shot script: scrapes all 107 Italian provincial capitals from Idealista
 * + the Subito national feed, then saves to the database.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/scrapeAllCities.ts
 */

import { PrismaClient } from '@prisma/client'
import { scrapeIdealista, ScrapedProperty } from '../scrapers/idealistaScraper'
import { scrapeSubito } from '../scrapers/subitoScraper'
import { CITIES } from '../data/cities'

const prisma = new PrismaClient()
const IDEALISTA_BASE = 'https://www.idealista.it/vendita-case'

async function main() {
  console.log(`\n🗺  Scraping ${CITIES.length} cities from Idealista + Subito national feed...\n`)

  const all: ScrapedProperty[] = []

  // ── Idealista: one page per city ───────────────────────────────────────────
  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i]
    try {
      const url = `${IDEALISTA_BASE}/${city.idealistaSlug}/`
      const results = await scrapeIdealista(url)
      all.push(...results)
      console.log(`[${i + 1}/${CITIES.length}] ${city.name}: ${results.length} listings`)
    } catch (err) {
      console.error(`[${i + 1}/${CITIES.length}] ${city.name}: ERROR — ${(err as Error).message}`)
    }
  }

  // ── Subito: national feed ──────────────────────────────────────────────────
  try {
    const results = await scrapeSubito()
    all.push(...results)
    console.log(`\n[Subito] ${results.length} listings`)
  } catch (err) {
    console.error(`[Subito] ERROR — ${(err as Error).message}`)
  }

  // ── Persist with deduplication ─────────────────────────────────────────────
  console.log(`\n💾 Saving ${all.length} total listings to database...`)
  let inserted = 0
  let skipped = 0

  for (const listing of all) {
    const existing = await prisma.property.findFirst({ where: { sourceUrl: listing.sourceUrl } })
    if (existing) { skipped++; continue }
    await prisma.property.create({ data: listing })
    inserted++
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${skipped} duplicates skipped`)
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
