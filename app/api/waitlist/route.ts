import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: 'DealEstate <onboarding@resend.dev>',
      to: email,
      subject: 'Sei nella waitlist di DealEstate 🏠',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
          <h1 style="font-size:22px;font-weight:700;color:#111">Benvenuto in DealEstate!</h1>
          <p style="color:#555;line-height:1.6">
            Sei ufficialmente nella waitlist. Ogni settimana riceverai le migliori opportunità immobiliari
            ${city ? `a <strong>${city}</strong>` : 'in Italia'} con ROI &gt; 8% e sconto &gt; 15% sul prezzo di mercato.
          </p>
          <p style="color:#555;line-height:1.6">
            Nel frattempo puoi già esplorare alcune opportunità gratuite:
          </p>
          <a href="https://roi-finder.vercel.app/properties"
             style="display:inline-block;margin-top:8px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Vedi le prime 5 opportunità →
          </a>
          <p style="margin-top:32px;font-size:12px;color:#aaa">
            DealEstate — Analisi ROI su proprietà immobiliari italiane.
          </p>
        </div>
      `,
    }).catch(() => null) // non bloccare la risposta se la mail fallisce
  }

  return NextResponse.json(
    { message: 'Benvenuto nella waitlist! Riceverai le migliori opportunità ogni settimana.' },
    { status: 201 }
  )
}

export async function GET() {
  const count = await prisma.waitlistUser.count()
  return NextResponse.json({ count })
}
