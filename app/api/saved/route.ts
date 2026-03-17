import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const saved = await prisma.savedProperty.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const propertyIds = saved.map((s) => s.propertyId)

  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
  })

  const results = properties
    .map((p) => computeMetrics({ ...p, createdAt: p.createdAt.toISOString() }))
    .filter((p) => p.price >= 5000 && p.sqm >= 10)

  return NextResponse.json({ data: results, savedIds: propertyIds })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId } = await request.json()
  if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 })

  await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: session.user.id, propertyId } },
    update: {},
    create: { userId: session.user.id, propertyId },
  })

  return NextResponse.json({ success: true })
}
