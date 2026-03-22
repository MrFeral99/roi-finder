'use client'
import { useState } from 'react'
import { posthog } from '@/lib/posthog'

interface Props {
  propertyId: string
  initialSaved: boolean
}

export default function SaveButton({ propertyId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (saved) {
      await fetch(`/api/saved/${propertyId}`, { method: 'DELETE' })
      setSaved(false)
      posthog.capture('property_unsaved', { property_id: propertyId })
    } else {
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      })
      setSaved(true)
      posthog.capture('property_saved', { property_id: propertyId })
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
        saved
          ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }`}
      title={saved ? 'Rimuovi dai salvati' : 'Salva opportunità'}
    >
      {saved ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2a2 2 0 0 0-2 2v18l8-4 8 4V4a2 2 0 0 0-2-2H6z" />
        </svg>
      )}
      {saved ? 'Salvata' : 'Salva'}
    </button>
  )
}
