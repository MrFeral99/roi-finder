import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed entries all have sourceUrl patterns with city codes like /to-0, /pa-0, etc.
  const result = await prisma.property.deleteMany({
    where: {
      OR: [
        { sourceUrl: { contains: '/to-0' } },
        { sourceUrl: { contains: '/pa-0' } },
        { sourceUrl: { contains: '/ba-0' } },
        { sourceUrl: { contains: '/ct-0' } },
        { sourceUrl: { contains: '/bo-0' } },
        { sourceUrl: { contains: '/na-0' } },
        { sourceUrl: { contains: '/ge-0' } },
        { sourceUrl: { contains: '/ca-0' } },
        { sourceUrl: { contains: '/fi-0' } },
        { sourceUrl: { contains: '/ide-0' } },
      ],
    },
  })

  console.log(`🗑️  Deleted ${result.count} seed properties`)

  const remaining = await prisma.property.count()
  const bySite = await prisma.property.groupBy({ by: ['sourceSite'], _count: true })
  console.log(`📊 Remaining: ${remaining} properties`)
  for (const row of bySite) console.log(`   ${row.sourceSite}: ${row._count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
