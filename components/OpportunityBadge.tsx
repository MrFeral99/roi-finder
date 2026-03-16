import { HOT_DEAL_THRESHOLD, HIGH_ROI_THRESHOLD, UNDERVALUED_THRESHOLD } from '@/lib/opportunityScore'

interface Props {
  roi: number
  discount: number
  score: number
  isAuction?: boolean
  auctionDate?: string | null
}

export default function OpportunityBadge({ roi, discount, score, isAuction, auctionDate }: Props) {
  const badges: React.ReactNode[] = []

  if (isAuction) {
    badges.push(
      <span
        key="auction"
        className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700"
      >
        🏛️ Asta{auctionDate ? ` ${auctionDate}` : ''}
      </span>
    )
  }

  if (score > HOT_DEAL_THRESHOLD) {
    badges.push(
      <span
        key="hot"
        className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700"
      >
        🔥 Hot Deal
      </span>
    )
  }

  if (roi > HIGH_ROI_THRESHOLD) {
    badges.push(
      <span
        key="roi"
        className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700"
      >
        ROI {roi.toFixed(1)}%
      </span>
    )
  }

  if (discount > UNDERVALUED_THRESHOLD) {
    badges.push(
      <span
        key="undervalued"
        className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700"
      >
        Sottovalutato
      </span>
    )
  }

  if (badges.length === 0) return null

  return <div className="flex flex-wrap gap-1.5">{badges}</div>
}
