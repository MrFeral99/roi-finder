import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'

const PAGE_SIZE = 24

type SortKey = 'score' | 'roi' | 'price_asc' | 'price_desc' | 'discount'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city      = searchParams.get('city') ?? undefined
  const minROI    = searchParams.get('minROI')    ? parseFloat(searchParams.get('minROI')!)    : undefined
  const maxPrice  = searchParams.get('maxPrice')  ? parseFloat(searchParams.get('maxPrice')!)  : undefined
  const sort      = (searchParams.get('sort') ?? 'score') as SortKey
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))

  const raw = await prisma.property.findMany({
    where: {
      ...(city     ? { city:  { equals: city, mode: 'insensitive' } } : {}),
      ...(maxPrice ? { price: { lte: maxPrice } }                     : {}),
    },
  })

  let results = raw
    .map((p) => computeMetrics({ ...p, createdAt: p.createdAt.toISOString() }))
    .filter((p) => p.price >= 5000 && p.sqm >= 10 && p.roi <= 50)

  if (minROI !== undefined) results = results.filter((p) => p.roi >= minROI)

  // Sort
  results.sort((a, b) => {
    switch (sort) {
      case 'roi':       return b.roi      - a.roi
      case 'price_asc': return a.price    - b.price
      case 'price_desc':return b.price    - a.price
      case 'discount':  return b.discount - a.discount
      default:          return b.score    - a.score  // 'score'
    }
  })

  const total      = results.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const data       = results.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return NextResponse.json({ data, total, page: safePage, totalPages })
}
