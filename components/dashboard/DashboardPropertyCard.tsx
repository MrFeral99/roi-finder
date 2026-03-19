'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { SavedPropertyWithDetails, WorkflowStatus } from '@/types'
import StatusBadge from './StatusBadge'

const STATUS_OPTIONS: { value: WorkflowStatus; label: string }[] = [
  { value: 'COLLECTION', label: 'Da valutare' },
  { value: 'ANALYSIS',   label: 'In analisi' },
  { value: 'DECISION',   label: "Pronti all'offerta" },
  { value: 'REJECTED',   label: 'Scartata' },
]

interface Props {
  property: SavedPropertyWithDetails
  onStatusChange: (propertyId: string, newStatus: WorkflowStatus) => void
  onUnsave: (propertyId: string) => void
}

export default function DashboardPropertyCard({ property, onStatusChange, onUnsave }: Props) {
  const [status, setStatus] = useState<WorkflowStatus>(property.status)
  const [notes, setNotes] = useState<string>(property.notes ?? '')
  const [editingNotes, setEditingNotes] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)

  async function handleStatusChange(newStatus: WorkflowStatus) {
    setStatus(newStatus)
    onStatusChange(property.id, newStatus)
    await fetch(`/api/saved/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    await fetch(`/api/saved/${property.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSavingNotes(false)
    setEditingNotes(false)
  }

  async function handleUnsave() {
    await fetch(`/api/saved/${property.id}`, { method: 'DELETE' })
    onUnsave(property.id)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{property.city}</p>
          <Link
            href={`/properties/${property.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 leading-snug"
          >
            {property.title}
          </Link>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Price & sqm */}
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">€{property.price.toLocaleString('it-IT')}</span>
        {' · '}
        {property.sqm} m²
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3">
        <div className="text-center">
          <p className="text-xs text-gray-500">Affitto est.</p>
          <p className="text-sm font-semibold text-gray-800">€{property.estimatedRent.toLocaleString('it-IT')}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">ROI netto</p>
          <p className={`text-sm font-semibold ${property.roi >= 6 ? 'text-green-600' : property.roi >= 4 ? 'text-yellow-600' : 'text-red-500'}`}>
            {property.roi.toFixed(1)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Cashflow/m</p>
          <p className="text-sm font-semibold text-gray-800">
            €{Math.round(property.estimatedRent * 0.75).toLocaleString('it-IT')}
          </p>
        </div>
      </div>

      {/* Status changer */}
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as WorkflowStatus)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Notes */}
      {editingNotes ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Aggiungi una nota..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {savingNotes ? 'Salvo...' : 'Salva nota'}
            </button>
            <button
              onClick={() => { setNotes(property.notes ?? ''); setEditingNotes(false) }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingNotes(true)}
          className="text-left text-xs text-gray-500 hover:text-blue-600"
        >
          {notes ? `📝 ${notes}` : '+ Aggiungi nota'}
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2">
        <a
          href={property.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Vedi annuncio ↗
        </a>
        <button
          onClick={handleUnsave}
          className="text-xs text-gray-400 hover:text-red-500"
        >
          Rimuovi
        </button>
      </div>
    </div>
  )
}
