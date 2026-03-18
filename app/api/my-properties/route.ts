import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const properties = await prisma.userProperty.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(properties)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    title, city, address, price, sqm, monthlyRent, status,
    purchaseDate, acquisitionCosts, notes, vacancyRate, maintenanceRate, annualCondoFees,
    rentalMode, weeklyRates,
  } = body

  if (!title || !city || !price || !sqm) {
    return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
  }

  const property = await prisma.userProperty.create({
    data: {
      userId: session.user.id,
      title,
      city,
      address: address ?? null,
      price: Number(price),
      sqm: Number(sqm),
      monthlyRent: monthlyRent != null ? Number(monthlyRent) : 0,
      status: status ?? 'valutazione',
      purchaseDate: purchaseDate ?? null,
      acquisitionCosts: acquisitionCosts != null ? Number(acquisitionCosts) : null,
      notes: notes ?? null,
      vacancyRate: vacancyRate != null ? Number(vacancyRate) : 8,
      maintenanceRate: maintenanceRate != null ? Number(maintenanceRate) : 10,
      annualCondoFees: annualCondoFees != null ? Number(annualCondoFees) : 0,
      rentalMode: rentalMode ?? 'monthly',
      weeklyRates: weeklyRates ?? null,
    },
  })

  return NextResponse.json(property, { status: 201 })
}
