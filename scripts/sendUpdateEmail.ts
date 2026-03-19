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

const recipients = [
  { email: 'ryzor888@gmail.com', name: 'Pino' },
  { email: 'info@lucamurru.com', name: 'Luca' },
  { email: 'andreaolivieri87@gmail.com', name: 'Andrea' },
  { email: 'leonardo.puleggi@gmail.com', name: null },
  { email: 'alessiorizzo7@gmail.com', name: 'Ale' },
]

async function main() {
  let ok = 0
  let fail = 0

  for (const recipient of recipients) {
    const greeting = recipient.name ? `Ciao ${recipient.name}! 👋` : 'Ciao! 👋'
    try {
      await transporter.sendMail({
        from: `DealEstate <${process.env.SMTP_USER}>`,
        to: recipient.email,
        subject: 'Una domanda veloce su DealEstate 👋',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
            <p style="color:#111;line-height:1.8;font-size:15px">${greeting}</p>
            <p style="color:#111;line-height:1.8;font-size:15px">ho visto che ti sei registrato su DealEstate, grazie davvero 🙌</p>
            <p style="color:#111;line-height:1.8;font-size:15px">Posso chiederti una cosa veloce?</p>
            <p style="color:#111;line-height:1.8;font-size:15px">👉 sei riuscito a trovare immobili interessanti oppure no?</p>
            <p style="color:#111;line-height:1.8;font-size:15px">Sto cercando di capire se il prodotto è davvero utile o se devo migliorarlo.</p>
            <p style="color:#111;line-height:1.8;font-size:15px">Se vuoi, posso anche cercarti io 2–3 opportunità in base a quello che cerchi 👍</p>
            <p style="color:#111;line-height:1.8;font-size:15px">A presto<br/>Salvatore</p>
          </div>
        `,
      })
      console.log(`✓ ${recipient.email}`)
      ok++
    } catch (e) {
      console.error(`✗ ${recipient.email}:`, e)
      fail++
    }
  }

  console.log(`\nCompletato: ${ok} inviate, ${fail} fallite.`)
}

main()
