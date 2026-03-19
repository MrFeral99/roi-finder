'use client'
import type { SavedPropertyWithDetails, WorkflowStatus } from '@/types'
import DashboardPropertyCard from './DashboardPropertyCard'

const COLUMN_CONFIG: Record<WorkflowStatus, { label: string; dot: string }> = {
  COLLECTION: { label: 'Da valutare',       dot: 'bg-yellow-400' },
  ANALYSIS:   { label: 'In analisi',         dot: 'bg-blue-500'   },
  DECISION:   { label: "Pronti all'offerta", dot: 'bg-green-500'  },
  REJECTED:   { label: 'Scartate',           dot: 'bg-red-400'    },
}

interface Props {
  status: WorkflowStatus
  items: SavedPropertyWithDetails[]
  onStatusChange: (propertyId: string, newStatus: WorkflowStatus) => void
  onUnsave: (propertyId: string) => void
}

export default function PropertyColumn({ status, items, onStatusChange, onUnsave }: Props) {
  const { label, dot } = COLUMN_CONFIG[status]

  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold text-gray-700">{label}</h2>
        <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <DashboardPropertyCard
              key={item.id}
              property={item}
              onStatusChange={onStatusChange}
              onUnsave={onUnsave}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
          Nessuna proprietà
        </div>
      )}
    </div>
  )
}
