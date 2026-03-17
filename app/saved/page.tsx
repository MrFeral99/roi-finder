'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PropertyWithMetrics } from '@/types'
import PropertyCard from '@/components/PropertyCard'

export default function SavedPage() {
  const { status } = useSession()
  const router = useRouter()
  const [properties, setProperties] = useState<PropertyWithMetrics[]>([])
  const [savedIds, setSavedIds]     = useState<Set<string>>(new Set())
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.replace('/login'); return }
    if (status !== 'authenticated') return

    fetch('/api/saved')
      .then((r) => r.json())
      .then(({ data, savedIds: ids }) => {
        setProperties(data ?? [])
        setSavedIds(new Set(ids ?? []))
      })
      .finally(() => setLoading(false))
  }, [status, router])

  async function handleUnsave(propertyId: string) {
    await fetch(`/api/saved/${propertyId}`, { method: 'DELETE' })
    setProperties((prev) => prev.filter((p) => p.id !== propertyId))
    setSavedIds((prev) => { const s = new Set(prev); s.delete(propertyId); return s })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunità salvate</h1>
        <p className="mt-1 text-sm text-gray-500">
          {properties.length > 0 ? `${properties.length} proprietà salvate` : 'Nessuna proprietà salvata ancora.'}
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-400">Salva le opportunità che ti interessano cliccando il 🔖 sulle card.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isSaved={savedIds.has(p.id)}
              onSaveToggle={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
