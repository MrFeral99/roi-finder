/**
 * exportWaitlist.ts
 *
 * Exports all waitlist subscribers to a CSV file.
 * Use this to send the weekly newsletter via Mailchimp, Brevo, etc.
 *
 * Usage:
 *   npm run export-waitlist
 *   npm run export-waitlist -- --output ./exports/waitlist.csv
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const outputIdx = args.indexOf('--output')
const outputPath =
  outputIdx !== -1
    ? args[outputIdx + 1]
    : path.join(process.cwd(), `exports/waitlist_${new Date().toISOString().slice(0, 10)}.csv`)

async function main() {
  const users = await prisma.waitlistUser.findMany({
    orderBy: { createdAt: 'desc' },
  })

  if (users.length === 0) {
    console.log('⚠️  Nessun iscritto in waitlist.')
    return
  }

  // Ensure output directory exists
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  // Build CSV
  const header = 'email,city,createdAt'
  const rows = users.map((u) => {
    const email = `"${u.email}"`
    const city = u.city ? `"${u.city}"` : ''
    const date = u.createdAt.toISOString()
    return [email, city, date].join(',')
  })

  const csv = [header, ...rows].join('\n')
  fs.writeFileSync(outputPath, csv, 'utf-8')

  console.log(`✅ Esportati ${users.length} iscritti → ${outputPath}`)

  // Print summary
  const byCityRaw = users.reduce<Record<string, number>>((acc, u) => {
    const key = u.city || '(nessuna città)'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const byCity = Object.entries(byCityRaw).sort((a, b) => b[1] - a[1]).slice(0, 10)
  console.log('\n📊 Top città:')
  for (const [city, count] of byCity) {
    console.log(`   ${city}: ${count}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
