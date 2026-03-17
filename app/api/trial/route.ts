import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ expired: false })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { feedback: true },
  })

  if (!user) return NextResponse.json({ expired: false })

  const trialEnd = user.trialEndsAt ?? new Date(user.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expired  = new Date() > trialEnd
  const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000))

  return NextResponse.json({
    expired,
    daysLeft,
    hasFeedback: !!user.feedback,
    trialEnd: trialEnd.toISOString(),
  })
}
