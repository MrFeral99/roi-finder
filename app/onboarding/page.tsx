'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CITIES } from '@/data/cities'

const SORTED_CITIES = [...CITIES].sort((a, b) => a.name.localeCompare(b.name, 'it'))

const STRATEGIES = [
  { value: 'rent', label: 'Affitto — rendita passiva mensile' },
  { value: 'flip', label: 'Flipping — compro, ristruttura, rivendo' },
  { value: 'both', label: 'Entrambe — valuto caso per caso' },
]

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [city, setCity] = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [strategy, setStrategy] = useState('both')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/')
      return
    }
    if (status === 'authenticated') {
      // If user already has preferences, skip onboarding
      fetch('/api/preferences')
        .then((r) => r.json())
        .then((prefs) => {
          if (prefs?.strategy) router.replace('/properties')
        })
    }
  }, [status, router])

  if (status === 'loading' || status === 'unauthenticated') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city: city || null,
        minBudget: minBudget ? parseInt(minBudget) : null,
        maxBudget: maxBudget ? parseInt(maxBudget) : null,
        strategy,
      }),
    })
    router.push('/properties')
  }

  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Benvenuto su DealEstate</h1>
        <p className="mt-2 text-sm text-gray-500">
          Dimmi cosa cerchi e personalizziamo le opportunità per te. &lt;1 minuto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* City */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Città di interesse</label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Tutte le città</option>
            {SORTED_CITIES.map((c) => (
              <option key={c.idealistaSlug} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Budget minimo (€)</label>
            <input
              type="number"
              placeholder="es. 50000"
              min={0}
              step={5000}
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Budget massimo (€)</label>
            <input
              type="number"
              placeholder="es. 200000"
              min={0}
              step={5000}
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Strategia di investimento</label>
          <div className="space-y-2">
            {STRATEGIES.map((s) => (
              <label
                key={s.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                  strategy === s.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  value={s.value}
                  checked={strategy === s.value}
                  onChange={() => setStrategy(s.value)}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700">{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Salvataggio...' : 'Salva preferenze →'}
        </button>
      </form>
    </div>
  )
}
