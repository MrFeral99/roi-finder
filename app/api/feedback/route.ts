import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { score, priceRange, improvements } = await request.json()

  if (!score || score < 1 || score > 10) {
    return NextResponse.json({ error: 'Score non valido (1-10).' }, { status: 400 })
  }
  if (!['10-19', '19-29', '29+'].includes(priceRange)) {
    return NextResponse.json({ error: 'Range di prezzo non valido.' }, { status: 400 })
  }

  await prisma.userFeedback.upsert({
    where:  { userId: session.user.id },
    update: { score, priceRange, improvements: improvements || null },
    create: { userId: session.user.id, score, priceRange, improvements: improvements || null },
  })

  return NextResponse.json({ success: true })
}
