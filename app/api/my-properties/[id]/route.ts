import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.userProperty.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = await prisma.userProperty.update({
    where: { id: params.id },
    data: {
      title: body.title,
      city: body.city,
      address: body.address ?? null,
      price: body.price != null ? Number(body.price) : undefined,
      sqm: body.sqm != null ? Number(body.sqm) : undefined,
      monthlyRent: body.monthlyRent != null ? Number(body.monthlyRent) : undefined,
      status: body.status,
      purchaseDate: body.purchaseDate ?? null,
      acquisitionCosts: body.acquisitionCosts != null ? Number(body.acquisitionCosts) : null,
      notes: body.notes ?? null,
      vacancyRate: body.vacancyRate != null ? Number(body.vacancyRate) : undefined,
      maintenanceRate: body.maintenanceRate != null ? Number(body.maintenanceRate) : undefined,
      annualCondoFees: body.annualCondoFees != null ? Number(body.annualCondoFees) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.userProperty.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.userProperty.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
