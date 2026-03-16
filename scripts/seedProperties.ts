import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const seed = [
  // Torino
  {
    title: 'Bilocale ristrutturato, San Salvario',
    city: 'Torino',
    address: 'Via Madama Cristina 45, Torino',
    price: 85000,
    sqm: 65,
    sourceUrl: 'https://www.idealista.it/immobile/to-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Trilocale anni 70, Mirafiori Nord',
    city: 'Torino',
    address: 'Via Artom 12, Torino',
    price: 72000,
    sqm: 90,
    sourceUrl: 'https://www.idealista.it/immobile/to-002',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Appartamento luminoso, Crocetta',
    city: 'Torino',
    address: 'Via Giacosa 8, Torino',
    price: 145000,
    sqm: 80,
    sourceUrl: 'https://www.idealista.it/immobile/to-003',
    sourceSite: 'idealista.it',
  },

  // Palermo
  {
    title: 'Bilocale storico, Centro Storico',
    city: 'Palermo',
    address: 'Via Maqueda 110, Palermo',
    price: 58000,
    sqm: 70,
    sourceUrl: 'https://www.idealista.it/immobile/pa-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Appartamento vista mare, Mondello',
    city: 'Palermo',
    address: 'Via Mondello 34, Palermo',
    price: 95000,
    sqm: 85,
    sourceUrl: 'https://www.idealista.it/immobile/pa-002',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Monolocale da ristrutturare, Ballarò',
    city: 'Palermo',
    address: 'Piazza Ballarò 5, Palermo',
    price: 32000,
    sqm: 45,
    sourceUrl: 'https://www.idealista.it/immobile/pa-003',
    sourceSite: 'idealista.it',
  },

  // Bari
  {
    title: 'Appartamento in centro, Murat',
    city: 'Bari',
    address: 'Via Sparano 67, Bari',
    price: 68000,
    sqm: 75,
    sourceUrl: 'https://www.idealista.it/immobile/ba-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Trilocale con terrazzo, Poggiofranco',
    city: 'Bari',
    address: 'Via de Rossi 22, Bari',
    price: 110000,
    sqm: 95,
    sourceUrl: 'https://www.idealista.it/immobile/ba-002',
    sourceSite: 'idealista.it',
  },

  // Catania
  {
    title: 'Bilocale ristrutturato, Centro',
    city: 'Catania',
    address: 'Via Etnea 88, Catania',
    price: 48000,
    sqm: 60,
    sourceUrl: 'https://www.idealista.it/immobile/ct-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Monolocale, Picanello',
    city: 'Catania',
    address: 'Via Plebiscito 15, Catania',
    price: 35000,
    sqm: 40,
    sourceUrl: 'https://www.idealista.it/immobile/ct-002',
    sourceSite: 'idealista.it',
  },

  // Bologna
  {
    title: 'Bilocale universitario, Bolognina',
    city: 'Bologna',
    address: 'Via Ferrarese 45, Bologna',
    price: 135000,
    sqm: 55,
    sourceUrl: 'https://www.idealista.it/immobile/bo-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Trilocale con box, San Donato',
    city: 'Bologna',
    address: 'Via San Donato 112, Bologna',
    price: 168000,
    sqm: 80,
    sourceUrl: 'https://www.idealista.it/immobile/bo-002',
    sourceSite: 'idealista.it',
  },

  // Napoli
  {
    title: 'Appartamento storico, Quartieri Spagnoli',
    city: 'Napoli',
    address: 'Via Toledo 200, Napoli',
    price: 95000,
    sqm: 70,
    sourceUrl: 'https://www.idealista.it/immobile/na-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Bilocale collina, Vomero',
    city: 'Napoli',
    address: 'Via Bernini 18, Napoli',
    price: 145000,
    sqm: 65,
    sourceUrl: 'https://www.idealista.it/immobile/na-002',
    sourceSite: 'idealista.it',
  },

  // Genova
  {
    title: 'Appartamento caruggi, Centro Storico',
    city: 'Genova',
    address: 'Via del Campo 9, Genova',
    price: 62000,
    sqm: 55,
    sourceUrl: 'https://www.idealista.it/immobile/ge-001',
    sourceSite: 'idealista.it',
  },
  {
    title: 'Trilocale panoramico, Albaro',
    city: 'Genova',
    address: 'Corso Torricelli 33, Genova',
    price: 115000,
    sqm: 90,
    sourceUrl: 'https://www.idealista.it/immobile/ge-002',
    sourceSite: 'idealista.it',
  },

  // Cagliari
  {
    title: 'Bilocale vicino università, Stampace',
    city: 'Cagliari',
    address: 'Via Azuni 44, Cagliari',
    price: 72000,
    sqm: 65,
    sourceUrl: 'https://www.idealista.it/immobile/ca-001',
    sourceSite: 'idealista.it',
  },

  // Firenze
  {
    title: 'Monolocale in Oltrarno',
    city: 'Firenze',
    address: 'Via dei Serragli 22, Firenze',
    price: 165000,
    sqm: 45,
    sourceUrl: 'https://www.idealista.it/immobile/fi-001',
    sourceSite: 'idealista.it',
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.property.deleteMany()

  for (const data of seed) {
    const property = await prisma.property.create({ data })
    console.log(`  ✓ ${property.city} — ${property.title}`)
  }

  console.log(`\n✅ Seeded ${seed.length} properties`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
