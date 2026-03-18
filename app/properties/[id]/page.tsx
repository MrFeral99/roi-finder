import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeMetrics } from '@/lib/computeMetrics'
import { getMarketPricePerSqm } from '@/lib/discountCalculator'
import { AUCTION_MARKUP_MIN, AUCTION_MARKUP_MAX } from '@/lib/auctionEstimator'
import OpportunityBadge from '@/components/OpportunityBadge'
import WaitlistForm from '@/components/WaitlistForm'
import SaveButton from '@/components/SaveButton'

interface Props {
  params: { id: string }
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
  })

  if (!property) notFound()

  const p = computeMetrics({ ...property, createdAt: property.createdAt.toISOString() })
  const marketPricePerSqm = getMarketPricePerSqm(p.city)
  const roiColor = p.roi > 8 ? 'text-green-600' : p.roi > 5 ? 'text-yellow-600' : 'text-gray-900'

  const session = await getServerSession(authOptions)
  let isSaved = false
  if (session?.user?.id) {
    const saved = await prisma.savedProperty.findUnique({
      where: { userId_propertyId: { userId: session.user.id, propertyId: params.id } },
    })
    isSaved = !!saved
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/properties"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        ← Torna alle opportunità
      </Link>

      <div className={`rounded-2xl border bg-white shadow-sm ${p.isAuction ? 'border-purple-200' : 'border-gray-200'}`}>

        {/* Header */}
        <div className="border-b border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{p.city}</p>
              <h1 className="mt-1 text-xl font-bold text-gray-900">{p.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{p.address}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="text-right">
                {p.isAuction && (
                  <p className="text-xs font-medium text-purple-600">Base d&apos;asta</p>
                )}
                <p className="text-2xl font-bold text-gray-900">
                  €{p.price.toLocaleString('it-IT')}
                </p>
                <p className="text-sm text-gray-500">{p.sqm} m²</p>
              </div>
              {session?.user?.id && (
                <SaveButton propertyId={params.id} initialSaved={isSaved} />
              )}
            </div>
          </div>
          <div className="mt-4">
            <OpportunityBadge
              roi={p.roi}
              discount={p.discount}
              score={p.score}
              isAuction={p.isAuction}
              auctionDate={p.auctionDate}
            />
          </div>
        </div>

        {/* Auction estimate block */}
        {p.isAuction && p.estimatedFinalPrice && (
          <div className="border-b border-purple-100 bg-purple-50 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-700">
              🏛️ Stima prezzo finale d&apos;asta
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-white border border-purple-100 p-3">
                <p className="text-xs text-purple-500">Ottimistica (+{Math.round((AUCTION_MARKUP_MIN - 1) * 100)}%)</p>
                <p className="mt-1 text-base font-bold text-purple-700">
                  €{p.estimatedFinalPriceMin!.toLocaleString('it-IT')}
                </p>
              </div>
              <div className="rounded-xl bg-purple-600 p-3 shadow">
                <p className="text-xs text-purple-200">Stima centrale (+20%)</p>
                <p className="mt-1 text-base font-bold text-white">
                  €{p.estimatedFinalPrice.toLocaleString('it-IT')}
                </p>
              </div>
              <div className="rounded-xl bg-white border border-purple-100 p-3">
                <p className="text-xs text-purple-500">Conservativa (+{Math.round((AUCTION_MARKUP_MAX - 1) * 100)}%)</p>
                <p className="mt-1 text-base font-bold text-purple-700">
                  €{p.estimatedFinalPriceMax!.toLocaleString('it-IT')}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-purple-500">
              Le aste immobiliari italiane si aggiudicano tipicamente al +10%–35% sul prezzo base.
              ROI calcolato sulla stima centrale.
            </p>
          </div>
        )}

        {/* Investment summary */}
        <div className="border-b border-gray-100 bg-gray-50 p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Analisi investimento
          </h2>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900">
            Rendimento stimato:{' '}
            <strong className={roiColor}>{p.roi.toFixed(1)}%</strong>
            {p.isAuction && (
              <span className="text-purple-700"> (sul prezzo finale stimato)</span>
            )}
            {' — '}
            Affitto mensile stimato:{' '}
            <strong>€{p.estimatedRent.toLocaleString('it-IT')}</strong>
            {p.discount > 0 && (
              <>
                {' — '}
                Prezzo{' '}
                <strong className="text-orange-700">{p.discount.toFixed(1)}% sotto</strong> la
                media della città.
              </>
            )}
          </div>
        </div>

        {/* Metrics table */}
        <div className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Dati dettagliati
          </h2>
          <dl className="divide-y divide-gray-100">
            <Row
              label={p.isAuction ? 'Prezzo base d\'asta' : 'Prezzo'}
              value={`€${p.price.toLocaleString('it-IT')}`}
            />
            {p.isAuction && p.estimatedFinalPrice && (
              <Row
                label="Prezzo finale stimato"
                value={`~€${p.estimatedFinalPrice.toLocaleString('it-IT')}`}
                valueClass="text-purple-700 font-semibold"
                highlight
                highlightClass="bg-purple-50"
              />
            )}
            <Row label="Superficie" value={`${p.sqm} m²`} />
            <Row label="Prezzo per m²" value={`€${p.pricePerSqm.toLocaleString('it-IT')}/m²`} />
            <Row
              label="Prezzo medio mercato (città)"
              value={`€${marketPricePerSqm.toLocaleString('it-IT')}/m²`}
            />
            <Row
              label="Affitto mensile stimato"
              value={`€${p.estimatedRent.toLocaleString('it-IT')}`}
              highlight
            />
            <Row
              label="Affitto annuale stimato"
              value={`€${p.annualRent.toLocaleString('it-IT')}`}
            />
            <Row
              label={p.isAuction ? 'ROI (su prezzo finale stimato)' : 'ROI stimato'}
              value={`${p.roi.toFixed(1)}%`}
              valueClass={roiColor}
              highlight
            />
            <Row
              label="Sconto vs mercato"
              value={
                p.discount > 0
                  ? `-${p.discount.toFixed(1)}%`
                  : `+${Math.abs(p.discount).toFixed(1)}%`
              }
              valueClass={p.discount > 0 ? 'text-orange-600 font-semibold' : 'text-red-500'}
            />
            <Row label="Punteggio opportunità" value={p.score.toFixed(1)} />
          </dl>
        </div>

        {/* CTA */}
        <div className="border-t border-gray-100 p-6">
          <a
            href={p.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Vedi annuncio originale su {p.sourceSite}
            <span aria-hidden>↗</span>
          </a>
          <p className="mt-2 text-center text-xs text-gray-400">
            Fonte: {p.sourceSite}
          </p>
        </div>
      </div>

      {/* Newsletter nudge */}
      <div className="mt-6">
        <WaitlistForm variant="inline" defaultCity={p.city} />
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  highlight = false,
  highlightClass = 'bg-green-50',
  valueClass = 'text-gray-900',
}: {
  label: string
  value: string
  highlight?: boolean
  highlightClass?: string
  valueClass?: string
}) {
  return (
    <div
      className={`flex items-center justify-between py-3 ${
        highlight ? `rounded-lg ${highlightClass} px-2` : ''
      }`}
    >
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`text-sm font-medium ${valueClass}`}>{value}</dd>
    </div>
  )
}
