import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
  })

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const result = computeMetrics({
    ...property,
    createdAt: property.createdAt.toISOString(),
  })

  return NextResponse.json(result)
}
