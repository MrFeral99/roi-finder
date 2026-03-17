import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(null)
  }

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json(prefs)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { city, minBudget, maxBudget, strategy } = await request.json()

  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: { city: city || null, minBudget: minBudget || null, maxBudget: maxBudget || null, strategy: strategy || null },
    create: { userId: session.user.id, city: city || null, minBudget: minBudget || null, maxBudget: maxBudget || null, strategy: strategy || null },
  })

  return NextResponse.json({ success: true })
}
