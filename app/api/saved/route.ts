import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'
import type { WorkflowStatus } from '@/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const saved = await prisma.savedProperty.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const propertyIds = saved.map((s) => s.propertyId)
  const savedMap = new Map(saved.map((s) => [s.propertyId, s]))

  const properties = await prisma.property.findMany({
    where: { id: { in: propertyIds } },
  })

  const results = properties
    .map((p) => {
      const s = savedMap.get(p.id)!
      return {
        ...computeMetrics({ ...p, createdAt: p.createdAt.toISOString() }),
        savedId: s.id,
        status: s.status as WorkflowStatus,
        notes: s.notes,
        updatedAt: s.updatedAt.toISOString(),
      }
    })
    .filter((p) => p.price >= 5000 && p.sqm >= 10)

  return NextResponse.json({ data: results, savedIds: propertyIds })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { propertyId, status } = await request.json()
  if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 })

  const validStatuses = ['COLLECTION', 'ANALYSIS', 'DECISION', 'REJECTED']
  const resolvedStatus = validStatuses.includes(status) ? status : 'COLLECTION'

  await prisma.savedProperty.upsert({
    where: { userId_propertyId: { userId: session.user.id, propertyId } },
    update: {},
    create: { userId: session.user.id, propertyId, status: resolvedStatus },
  })

  return NextResponse.json({ success: true })
}
