import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.libero.it',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

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

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    await transporter.sendMail({
      from: `DealEstate <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Accesso alla beta DealEstate 👇',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
          <p style="color:#111;line-height:1.8;font-size:15px">Ciao! 🙌</p>
          <p style="color:#111;line-height:1.8;font-size:15px">Grazie per esserti iscritto alla lista di attesa di DealEstate.</p>
          <p style="color:#111;line-height:1.8;font-size:15px">Ho attivato per te un accesso gratuito di 7 giorni alla beta 👇</p>
          <a href="https://roi-finder.vercel.app/register"
             style="display:inline-block;margin:8px 0 24px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            DealEstate →
          </a>
          <p style="color:#111;line-height:1.8;font-size:15px">
            Con DealEstate puoi:<br/>
            - trovare immobili sottovalutati<br/>
            - vedere ROI e rendimento stimato<br/>
            - individuare le migliori opportunità in pochi secondi
          </p>
          <p style="color:#111;line-height:1.8;font-size:15px">👉 Durante questi 7 giorni puoi usare tutto liberamente.</p>
          <p style="color:#111;line-height:1.8;font-size:15px">
            Sto seguendo personalmente i primi utenti, quindi se vuoi posso anche aiutarti a trovare 2–3 immobili interessanti in base a:<br/>
            - budget<br/>
            - città<br/>
            - tipo di investimento (affitto, flipping, ecc.)
          </p>
          <p style="color:#111;line-height:1.8;font-size:15px">Ti basta rispondere a questa mail 🙂</p>
          <p style="color:#111;line-height:1.8;font-size:15px">Ogni feedback è super prezioso in questa fase.</p>
          <p style="color:#111;line-height:1.8;font-size:15px">A presto</p>
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
