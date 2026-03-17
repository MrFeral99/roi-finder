import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

const transporter = nodemailer.createTransport({
  host: 'smtp.libero.it',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

async function main() {
  const users = await prisma.waitlistUser.findMany()
  console.log(`Trovati ${users.length} utenti nella waitlist.`)

  let ok = 0
  let fail = 0

  for (const user of users) {
    try {
      await transporter.sendMail({
        from: `DealEstate <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: 'Accesso alla beta DealEstate 👇',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
            <p style="color:#111;line-height:1.8;font-size:15px">Ciao! 🙌</p>
            <p style="color:#111;line-height:1.8;font-size:15px">Grazie per esserti iscritto alla beta di DealEstate.</p>
            <p style="color:#111;line-height:1.8;font-size:15px">Puoi accedere qui:</p>
            <a href="https://roi-finder.vercel.app"
               style="display:inline-block;margin:8px 0 24px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
              DealEstate →
            </a>
            <p style="color:#111;line-height:1.8;font-size:15px">Sto aiutando personalmente i primi utenti a trovare immobili interessanti.</p>
            <p style="color:#111;line-height:1.8;font-size:15px">
              Se vuoi, posso cercarti io 2–3 opportunità in base a:<br/>
              - budget<br/>
              - città<br/>
              - obiettivo (affitto, flipping, ecc.)
            </p>
            <p style="color:#111;line-height:1.8;font-size:15px">Ti va? 🙂</p>
          </div>
        `,
      })
      console.log(`✓ ${user.email}`)
      ok++
    } catch (e) {
      console.error(`✗ ${user.email}:`, e)
      fail++
    }
  }

  console.log(`\nCompletato: ${ok} inviate, ${fail} fallite.`)
  await prisma.$disconnect()
}

main()
