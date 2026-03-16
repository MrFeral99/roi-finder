import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'Email richiesta.' }, { status: 400 })
  }

  const email = body.email.trim().toLowerCase()
  const city = typeof body.city === 'string' ? body.city.trim() || null : null

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Inserisci un indirizzo email valido.' }, { status: 400 })
  }

  const existing = await prisma.waitlistUser.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      { message: 'Sei già nella waitlist! Ti aggiorneremo presto.' },
      { status: 200 }
    )
  }

  await prisma.waitlistUser.create({ data: { email, city } })

  return NextResponse.json(
    { message: 'Benvenuto nella waitlist! Riceverai le migliori opportunità ogni settimana.' },
    { status: 201 }
  )
}

export async function GET() {
  const count = await prisma.waitlistUser.count()
  return NextResponse.json({ count })
}
