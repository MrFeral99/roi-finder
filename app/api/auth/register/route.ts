import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const { email, password, name } = await request.json().catch(() => ({}))

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Email non valida.' }, { status: 400 })
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'La password deve avere almeno 8 caratteri.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Email già registrata.' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await prisma.user.create({
    data: { email: email.toLowerCase(), name: name || null, password: hashed, trialEndsAt },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
