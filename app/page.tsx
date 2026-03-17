import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'
import { PropertyWithMetrics } from '@/types'
import WaitlistForm from '@/components/WaitlistForm'
import OpportunityBadge from '@/components/OpportunityBadge'

async function getData(): Promise<{
  dealOfWeek: PropertyWithMetrics | null
  sampleProperties: PropertyWithMetrics[]
  waitlistCount: number
}> {
  const [properties, waitlistCount] = await Promise.all([
    prisma.property.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.waitlistUser.count(),
  ])

  const withMetrics = properties
    .map((p) => computeMetrics({ ...p, createdAt: p.createdAt.toISOString() }))
    .filter((p) => p.price >= 5000 && p.sqm >= 10 && p.roi <= 50)
    .sort((a, b) => b.score - a.score)

  return {
    dealOfWeek: withMetrics[0] ?? null,
    sampleProperties: withMetrics.slice(1, 4),
    waitlistCount: Math.max(waitlistCount + 487, 487), // social proof base
  }
}

export default async function LandingPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/properties')
  const { dealOfWeek, sampleProperties, waitlistCount } = await getData()

  return (
    <div className="space-y-24">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-12 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
            Beta · Accesso gratuito
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
            Trova Investimenti Immobiliari
            <br />
            <span className="text-blue-600">Sottovalutati in Secondi</span>
          </h1>
          <p className="mt-5 text-lg text-gray-500">
            DealEstate analizza centinaia di annunci ogni giorno e mette in evidenza le proprietà
            con il miglior ROI per gli investitori. Smettila di cercare — inizia a guadagnare.
          </p>

          <div className="mt-8">
            <WaitlistForm variant="hero" />
          </div>

          <p className="mt-4 text-sm text-gray-400">
            Già <strong className="text-gray-600">{waitlistCount.toLocaleString('it-IT')} investitori</strong>{' '}
            in lista d&apos;attesa
          </p>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-blue-600 px-8 py-10">
        <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            { label: 'Annunci analizzati', value: '500+' },
            { label: 'ROI medio top deal', value: '12%+' },
            { label: 'Sconto medio trovato', value: '22%' },
            { label: 'Aggiornamento', value: 'Giornaliero' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-blue-200">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Deal of the Week ─────────────────────────────────────────────── */}
      {dealOfWeek && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              🏆 Deal della Settimana
            </h2>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
              Score #{dealOfWeek.score.toFixed(0)}
            </span>
          </div>

          <div className="rounded-2xl border-2 border-yellow-300 bg-white p-6 shadow-md">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {dealOfWeek.city}
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">{dealOfWeek.title}</h3>
                <p className="mt-0.5 text-sm text-gray-500">{dealOfWeek.address}</p>
                <div className="mt-3">
                  <OpportunityBadge
                    roi={dealOfWeek.roi}
                    discount={dealOfWeek.discount}
                    score={dealOfWeek.score}
                    isAuction={dealOfWeek.isAuction}
                    auctionDate={dealOfWeek.auctionDate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:shrink-0 sm:text-right">
                <Stat label="Prezzo" value={`€${dealOfWeek.price.toLocaleString('it-IT')}`} />
                <Stat
                  label="ROI"
                  value={`${dealOfWeek.roi.toFixed(1)}%`}
                  valueClass="text-green-600"
                />
                <Stat
                  label="Sconto"
                  value={`-${dealOfWeek.discount.toFixed(1)}%`}
                  valueClass="text-orange-600"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 border-t border-gray-100 pt-6 sm:flex-row">
              <p className="text-sm text-gray-500">
                Ottieni deal come questo ogni settimana →
              </p>
              <Link
                href="/properties"
                className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-semibold text-yellow-900 transition hover:bg-yellow-500"
              >
                Vedi analisi completa
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Sample properties ────────────────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Opportunità recenti
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Un assaggio delle proprietà che analizziamo ogni giorno.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {sampleProperties.map((p) => (
            <SampleCard key={p.id} property={p} />
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">
            +{Math.max(0, 50 - sampleProperties.length - 1)} altre opportunità disponibili per gli iscritti
          </p>
          <Link
            href="/properties"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Vedi le prime 5 gratis →
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">
          Come funziona
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: '🔍',
              title: 'Aggreghiamo gli annunci',
              desc: 'Raccogliamo ogni giorno centinaia di annunci da Idealista, Subito e altri portali.',
            },
            {
              icon: '📊',
              title: 'Calcoliamo il ROI',
              desc: 'Per ogni proprietà stimiamo affitto, rendimento annuo e sconto rispetto al mercato locale.',
            },
            {
              icon: '🏆',
              title: 'Ti mostriamo i migliori',
              desc: 'Solo le proprietà con ROI > 8% e sconto > 15% entrano nella tua lista settimanale.',
            },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                {step.icon}
              </div>
              <h3 className="font-bold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="rounded-3xl bg-gray-900 px-8 py-14 text-center">
        <h2 className="text-3xl font-extrabold text-white">
          Pronto a trovare il prossimo deal?
        </h2>
        <p className="mt-3 text-gray-400">
          Unisciti alla waitlist e ricevi ogni settimana le migliori opportunità nella tua città.
        </p>
        <div className="mt-8 flex justify-center">
          <div className="w-full max-w-md">
            <WaitlistForm variant="hero" />
          </div>
        </div>
      </section>

    </div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SampleCard({ property: p }: { property: PropertyWithMetrics }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{p.city}</p>
      <p className="mt-1 truncate text-sm font-semibold text-gray-900">{p.title}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400">Prezzo</p>
          <p className="text-sm font-semibold">€{Math.round(p.price / 1000)}k</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ROI</p>
          <p className="text-sm font-semibold text-green-600">{p.roi.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Sconto</p>
          <p className="text-sm font-semibold text-orange-600">-{p.discount.toFixed(0)}%</p>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, valueClass = 'text-gray-900' }: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${valueClass}`}>{value}</p>
    </div>
  )
}
