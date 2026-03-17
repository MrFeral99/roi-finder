'use client'

import { useState } from 'react'

const PRICE_RANGES = [
  { value: '10-19', label: '€10 – €19 / mese' },
  { value: '19-29', label: '€19 – €29 / mese' },
  { value: '29+',   label: '€29+ / mese' },
]

interface Props {
  onSubmitted: () => void
}

export default function TrialFeedbackModal({ onSubmitted }: Props) {
  const [score, setScore]               = useState<number | null>(null)
  const [priceRange, setPriceRange]     = useState('')
  const [improvements, setImprovements] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!score) { setError('Seleziona un punteggio.'); return }
    if (!priceRange) { setError('Seleziona un range di prezzo.'); return }

    setSubmitting(true)
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, priceRange, improvements }),
    })

    if (res.ok) {
      onSubmitted()
    } else {
      setError('Errore nel salvataggio. Riprova.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="rounded-t-2xl bg-blue-600 px-6 py-5 text-white">
          <h2 className="text-lg font-bold">Il tuo periodo di prova è terminato 🎉</h2>
          <p className="mt-1 text-sm text-blue-100">
            Hai esplorato DealEstate per 7 giorni. Prima di continuare, aiutaci con 3 domande rapide.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Score 1-10 */}
          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              Quanto sei soddisfatto di DealEstate?{' '}
              {score && <span className="font-bold text-blue-600">{score}/10</span>}
            </label>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  className={`flex h-9 w-9 flex-1 items-center justify-center rounded-lg text-sm font-semibold transition ${
                    score === n
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>Per niente</span>
              <span>Moltissimo</span>
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Saresti disposto a pagare per DealEstate?
            </label>
            <div className="space-y-2">
              {PRICE_RANGES.map((r) => (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    priceRange === r.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="priceRange"
                    value={r.value}
                    checked={priceRange === r.value}
                    onChange={() => setPriceRange(r.value)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Cosa miglioreresti? <span className="text-gray-400">(opzionale)</span>
            </label>
            <textarea
              rows={3}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Es. vorrei filtrare per numero di locali, avere le foto degli annunci..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? 'Invio...' : 'Invia feedback e continua →'}
          </button>
        </form>
      </div>
    </div>
  )
}
