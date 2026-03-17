'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { PropertyWithMetrics, FilterParams } from '@/types'
import PropertyCard from '@/components/PropertyCard'
import Filters from '@/components/Filters'
import WaitlistForm from '@/components/WaitlistForm'

const FREE_LIMIT = 5

const SORT_OPTIONS = [
  { value: 'score',      label: 'Punteggio' },
  { value: 'roi',        label: 'ROI più alto' },
  { value: 'discount',   label: 'Sconto più alto' },
  { value: 'price_asc',  label: 'Prezzo crescente' },
  { value: 'price_desc', label: 'Prezzo decrescente' },
]

interface ApiResponse {
  data: PropertyWithMetrics[]
  total: number
  page: number
  totalPages: number
}

export default function PropertiesPage() {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'

  const [response, setResponse]     = useState<ApiResponse | null>(null)
  const [filters, setFilters]       = useState<FilterParams>({})
  const [sort, setSort]             = useState('score')
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  // Load user preferences and pre-fill filters
  useEffect(() => {
    if (status === 'loading') return
    if (!isLoggedIn) { setPrefsLoaded(true); return }
    fetch('/api/preferences')
      .then((r) => r.json())
      .then((prefs) => {
        if (prefs) setFilters({ city: prefs.city ?? undefined, maxPrice: prefs.maxBudget ?? undefined })
      })
      .finally(() => setPrefsLoaded(true))
  }, [isLoggedIn, status])

  const fetchProperties = useCallback(async (f: FilterParams, s: string, p: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (f.city)              params.set('city',     f.city)
      if (f.minROI !== undefined) params.set('minROI', String(f.minROI))
      if (f.maxPrice !== undefined) params.set('maxPrice', String(f.maxPrice))
      params.set('sort', s)
      params.set('page', String(p))

      const res = await fetch(`/api/properties?${params.toString()}`)
      if (!res.ok) throw new Error('Errore nel caricamento')
      setResponse(await res.json())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset page to 1 when filters or sort change
  useEffect(() => { setPage(1) }, [filters, sort])

  useEffect(() => {
    if (prefsLoaded) fetchProperties(filters, sort, page)
  }, [filters, sort, page, fetchProperties, prefsLoaded])

  const properties = response?.data ?? []
  const total      = response?.total ?? 0
  const totalPages = response?.totalPages ?? 1

  const visible  = isLoggedIn ? properties : properties.slice(0, FREE_LIMIT)
  const locked   = !isLoggedIn && total > FREE_LIMIT
  const hotDeals = properties.filter((p) => p.score > 10)

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Opportunità di investimento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Aggiornato quotidianamente · {total > 0 && `${total} annunci trovati`}
        </p>
      </div>

      {/* Stats */}
      {!loading && properties.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Totale annunci" value={String(total)} />
          <StatCard label="Hot Deals 🔥" value={String(hotDeals.length)} highlight />
          <StatCard label="Miglior ROI" value={`${Math.max(...properties.map((p) => p.roi)).toFixed(1)}%`} />
          <StatCard label="Prezzo minimo" value={`€${Math.min(...properties.map((p) => p.price)).toLocaleString('it-IT')}`} />
        </div>
      )}

      {/* Filters + Sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Filters filters={filters} onChange={(f) => { setFilters(f); setPage(1) }} />
        </div>
        <div className="sm:mt-0">
          <label className="mb-1 block text-xs font-medium text-gray-600">Ordina per</label>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
          Nessuna proprietà trovata con i filtri selezionati.
        </div>
      )}

      {!loading && !error && properties.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          {/* Gate for non-logged users */}
          {locked && (
            <div className="mt-6 space-y-4">
              <div className="pointer-events-none grid select-none gap-4 opacity-40 blur-sm sm:grid-cols-2 lg:grid-cols-3">
                {properties.slice(FREE_LIMIT, FREE_LIMIT + 3).map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <div className="relative -mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
                <p className="text-lg font-bold text-gray-900">
                  {total - FREE_LIMIT} opportunità sbloccate con il login
                </p>
                <p className="mt-1 text-sm text-gray-500">Registrati gratis per vedere tutti gli annunci.</p>
                <button
                  onClick={() => signIn(undefined, { callbackUrl: '/properties' })}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Accedi — è gratis
                </button>
              </div>
            </div>
          )}

          {/* Pagination — logged-in users only */}
          {isLoggedIn && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prec
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-gray-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        page === p
                          ? 'border-blue-600 bg-blue-600 font-semibold text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                Succ →
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !isLoggedIn && (
        <div className="mt-12">
          <WaitlistForm variant="inline" />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}
