'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { PropertyWithMetrics, FilterParams } from '@/types'
import PropertyCard from '@/components/PropertyCard'
import Filters from '@/components/Filters'
import WaitlistForm from '@/components/WaitlistForm'

const FREE_LIMIT = 5

export default function PropertiesPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'

  const [properties, setProperties] = useState<PropertyWithMetrics[]>([])
  const [filters, setFilters] = useState<FilterParams>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // Load user preferences and pre-fill filters
  useEffect(() => {
    if (status === 'loading') return
    if (!isLoggedIn) { setPrefsLoaded(true); return }

    fetch('/api/preferences')
      .then((r) => r.json())
      .then((prefs) => {
        if (prefs) {
          setFilters({
            city: prefs.city ?? undefined,
            maxPrice: prefs.maxBudget ?? undefined,
          })
        }
      })
      .finally(() => setPrefsLoaded(true))
  }, [isLoggedIn, status])

  const fetchProperties = useCallback(async (f: FilterParams) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (f.city) params.set('city', f.city)
      if (f.minROI !== undefined) params.set('minROI', String(f.minROI))
      if (f.maxPrice !== undefined) params.set('maxPrice', String(f.maxPrice))

      const res = await fetch(`/api/properties?${params.toString()}`)
      if (!res.ok) throw new Error('Errore nel caricamento')
      setProperties(await res.json())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (prefsLoaded) fetchProperties(filters)
  }, [filters, fetchProperties, prefsLoaded])

  const visible = isLoggedIn ? properties : properties.slice(0, FREE_LIMIT)
  const locked = !isLoggedIn && properties.length > FREE_LIMIT
  const hotDeals = properties.filter((p) => p.score > 10)

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunità di investimento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Aggiornato quotidianamente · Proprietà ordinate per punteggio opportunità.
        </p>
      </div>

      {/* Summary stats */}
      {!loading && properties.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Totale annunci" value={String(properties.length)} />
          <StatCard label="Hot Deals 🔥" value={String(hotDeals.length)} highlight />
          <StatCard label="Miglior ROI" value={`${Math.max(...properties.map((p) => p.roi)).toFixed(1)}%`} />
          <StatCard label="Prezzo minimo" value={`€${Math.min(...properties.map((p) => p.price)).toLocaleString('it-IT')}`} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <Filters filters={filters} onChange={setFilters} />
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Nessuna proprietà trovata con i filtri selezionati.
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <>
          {/* First 5 — fully visible */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          {/* Gate */}
          {locked && !isLoggedIn && (
            <div className="mt-6 space-y-4">
              {/* Blurred preview */}
              <div className="pointer-events-none grid select-none gap-4 opacity-40 blur-sm sm:grid-cols-2 lg:grid-cols-3">
                {properties.slice(FREE_LIMIT, FREE_LIMIT + 3).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>

              {/* Login CTA */}
              <div className="relative -mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
                <p className="text-lg font-bold text-gray-900">
                  {properties.length - FREE_LIMIT} opportunità sbloccate con il login
                </p>
                <p className="mt-1 text-sm text-gray-500">Accedi gratis con Google per vedere tutti gli annunci.</p>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/properties' })}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Login con Google — è gratis
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inline newsletter nudge — only for non-logged users */}
      {!loading && !isLoggedIn && (
        <div className="mt-12">
          <WaitlistForm variant="inline" />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight = false }: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
