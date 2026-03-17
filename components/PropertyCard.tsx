import Link from 'next/link'
import { PropertyWithMetrics } from '@/types'
import OpportunityBadge from './OpportunityBadge'

interface Props {
  property: PropertyWithMetrics
  isSaved?: boolean
  onSaveToggle?: (propertyId: string) => void
}

export default function PropertyCard({ property, isSaved, onSaveToggle }: Props) {
  const {
    id, title, city, address, price, sqm,
    estimatedRent, roi, discount, score,
    isAuction, auctionDate, estimatedFinalPrice,
  } = property

  const roiColor = roi > 8 ? 'text-green-600' : roi > 5 ? 'text-yellow-600' : 'text-gray-600'
  const discountColor = discount > 15 ? 'text-orange-600' : discount > 0 ? 'text-blue-600' : 'text-red-500'

  return (
    <Link href={`/properties/${id}`} className="block group">
      <div className={`rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        isAuction ? 'border-purple-200 hover:border-purple-300' : 'border-gray-200 hover:border-gray-300'
      }`}>
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{city}</p>
            <div className="flex shrink-0 items-start gap-2">
              {onSaveToggle && (
                <button
                  onClick={(e) => { e.preventDefault(); onSaveToggle(id) }}
                  className="text-lg leading-none transition hover:scale-110"
                  title={isSaved ? 'Rimuovi dai salvati' : 'Salva'}
                >
                  {isSaved ? '🔖' : '🏷️'}
                </button>
              )}
              <div className="text-right">
              {isAuction && (
                <p className="text-xs font-medium text-purple-600">Base d&apos;asta</p>
              )}
              <p className="text-base font-bold text-gray-900">
                €{price.toLocaleString('it-IT')}
              </p>
              <p className="text-xs text-gray-500">{sqm} m²</p>
            </div>
          </div>
          </div>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-blue-600">
            {title}
          </h3>
        </div>

        {/* Auction estimated final price */}
        {isAuction && estimatedFinalPrice && (
          <div className="mt-3 rounded-lg bg-purple-50 px-3 py-2">
            <p className="text-xs text-purple-600">
              Prezzo finale stimato:{' '}
              <span className="font-semibold">~€{estimatedFinalPrice.toLocaleString('it-IT')}</span>
            </p>
          </div>
        )}

        {/* Metrics grid */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
          <Metric label="Affitto est." value={`€${estimatedRent.toLocaleString('it-IT')}/mo`} />
          <Metric
            label={isAuction ? 'ROI (finale)' : 'ROI'}
            value={`${roi.toFixed(1)}%`}
            valueClassName={roiColor}
          />
          <Metric
            label="Sconto"
            value={discount > 0 ? `-${discount.toFixed(1)}%` : `+${Math.abs(discount).toFixed(1)}%`}
            valueClassName={discountColor}
          />
        </div>

        {/* Badges */}
        <div className="mt-3">
          <OpportunityBadge
            roi={roi}
            discount={discount}
            score={score}
            isAuction={isAuction}
            auctionDate={auctionDate}
          />
        </div>
      </div>
    </Link>
  )
}

function Metric({
  label,
  value,
  valueClassName = 'text-gray-900',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}
