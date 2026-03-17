'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CITIES } from '@/data/cities'

const STRATEGIES = [
  { value: '',         label: 'Nessuna preferenza' },
  { value: 'affitto',  label: 'Affitto' },
  { value: 'flipping', label: 'Flipping' },
  { value: 'entrambi', label: 'Entrambi' },
]

export default function AccountPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const [name, setName]           = useState('')
  const [city, setCity]           = useState('')
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [strategy, setStrategy]   = useState('')

  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (session?.user?.name) setName(session.user.name)

    fetch('/api/preferences').then((r) => r.json()).then((prefs) => {
      if (!prefs) return
      if (prefs.city)      setCity(prefs.city)
      if (prefs.minBudget) setMinBudget(String(prefs.minBudget))
      if (prefs.maxBudget) setMaxBudget(String(prefs.maxBudget))
      if (prefs.strategy)  setStrategy(prefs.strategy)
    })
  }, [status, session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const [nameRes, prefsRes] = await Promise.all([
        fetch('/api/account', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }),
        fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city:      city || null,
            minBudget: minBudget ? Number(minBudget) : null,
            maxBudget: maxBudget ? Number(maxBudget) : null,
            strategy:  strategy || null,
          }),
        }),
      ])

      if (!nameRes.ok || !prefsRes.ok) throw new Error('Errore nel salvataggio.')

      await update({ name })
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') return null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="mt-1 text-sm text-gray-500">{session?.user?.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

        {/* Nome */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Profilo</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Il tuo nome"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Preferenze */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Preferenze di ricerca</h2>
          <div className="space-y-4">

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Città preferita</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tutte le città</option>
                {[...CITIES].sort((a, b) => a.name.localeCompare(b.name)).map((c) => (
                  <option key={c.idealistaSlug} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Budget minimo (€)</label>
                <input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="Es. 50000"
                  min={0}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Budget massimo (€)</label>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="Es. 200000"
                  min={0}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Strategia di investimento</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {STRATEGIES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Modifiche salvate!</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Salvataggio...' : 'Salva modifiche'}
        </button>
      </form>
    </div>
  )
}
