import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  const count = await prisma.waitlistUser.count()
  const users = await prisma.waitlistUser.findMany({ orderBy: { createdAt: 'desc' } })
  console.log('Totale iscritti:', count)
  console.log(JSON.stringify(users, null, 2))
  await prisma.$disconnect()
}

main()
