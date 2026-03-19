import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.savedProperty.deleteMany({
    where: { userId: session.user.id, propertyId: params.id },
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status, notes } = await request.json()
  const validStatuses = ['COLLECTION', 'ANALYSIS', 'DECISION', 'REJECTED']
  const data: Record<string, unknown> = {}

  if (status !== undefined) {
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = status
  }
  if (notes !== undefined) data.notes = notes === '' ? null : notes
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await prisma.savedProperty.updateMany({
    where: { userId: session.user.id, propertyId: params.id },
    data,
  })

  return NextResponse.json({ success: true })
}
