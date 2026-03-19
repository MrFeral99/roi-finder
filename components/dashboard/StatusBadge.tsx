'use client'
import type { WorkflowStatus } from '@/types'

const CONFIG: Record<WorkflowStatus, { label: string; cls: string }> = {
  COLLECTION: { label: 'Da valutare',       cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  ANALYSIS:   { label: 'In analisi',         cls: 'bg-blue-100   text-blue-700   border-blue-200'   },
  DECISION:   { label: "Pronti all'offerta", cls: 'bg-green-100  text-green-700  border-green-200'  },
  REJECTED:   { label: 'Scartata',           cls: 'bg-red-100    text-red-600    border-red-200'    },
}

export default function StatusBadge({ status }: { status: WorkflowStatus }) {
  const { label, cls } = CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
