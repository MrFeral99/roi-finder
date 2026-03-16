import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') ?? undefined
  const minROI = searchParams.get('minROI') ? parseFloat(searchParams.get('minROI')!) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined

  const properties = await prisma.property.findMany({
    where: {
      ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      ...(maxPrice ? { price: { lte: maxPrice } } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  let results = properties.map((p) =>
    computeMetrics({ ...p, createdAt: p.createdAt.toISOString() })
  )

  // Exclude listings with implausible data (price < 5000€ or sqm < 10 → likely bad entries)
  results = results.filter((p) => p.price >= 5000 && p.sqm >= 10 && p.roi <= 50)

  // Apply ROI filter after computation (derived value)
  if (minROI !== undefined) {
    results = results.filter((p) => p.roi >= minROI)
  }

  // Milano listings are pinned first, then sort by opportunity score
  const PINNED_CITY = 'Milano'
  results.sort((a, b) => {
    const aPin = a.city === PINNED_CITY ? 1 : 0
    const bPin = b.city === PINNED_CITY ? 1 : 0
    if (bPin !== aPin) return bPin - aPin
    return b.score - a.score
  })

  return NextResponse.json(results)
}
