'use client'
import { useState, useEffect, useMemo } from 'react'
import { calculateRealROI } from '@/lib/investment'
import rentByCity from '@/data/rentByCity.json'
import pricePerSqmByCity from '@/data/pricePerSqmByCity.json'

const CITIES = Object.keys(rentByCity as Record<string, number>).sort()

function roiColor(roi: number) {
  if (roi > 7) return 'text-green-600'
  if (roi >= 4) return 'text-yellow-600'
  return 'text-red-500'
}

function roiBadge(roi: number) {
  if (roi > 7) return { label: 'Good Deal', className: 'bg-green-100 text-green-700' }
  if (roi >= 5) return { label: 'Average', className: 'bg-yellow-100 text-yellow-700' }
  return { label: 'Not Worth It', className: 'bg-red-100 text-red-600' }
}

export default function CalcolatoreROIPage() {
  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [sqm, setSqm] = useState('')
  const [rent, setRent] = useState('')
  const [vacancyRate, setVacancyRate] = useState(8)
  const [maintenanceRate, setMaintenanceRate] = useState(10)
  const [annualCondoFees, setAnnualCondoFees] = useState('')
  const [rentOverridden, setRentOverridden] = useState(false)

  // Auto-fill rent when city or sqm changes (unless user has overridden)
  useEffect(() => {
    if (!rentOverridden && city && sqm) {
      const rentPerSqm = (rentByCity as Record<string, number>)[city] ?? 10
      setRent(String(Math.round(rentPerSqm * Number(sqm))))
    }
  }, [city, sqm, rentOverridden])

  // Auto-fill price when city or sqm changes (only if price is empty)
  useEffect(() => {
    if (!price && city && sqm) {
      const marketPricePerSqm = (pricePerSqmByCity as Record<string, number>)[city] ?? 2000
      setPrice(String(Math.round(marketPricePerSqm * Number(sqm))))
    }
  }, [city, sqm]) // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    const p = Number(price)
    const r = Number(rent)
    if (!p || !r || p <= 0 || r <= 0) return null
    return calculateRealROI({
      price: p,
      estimatedMonthlyRent: r,
      vacancyRate: vacancyRate / 100,
      maintenanceRate: maintenanceRate / 100,
      annualCondoFees: Number(annualCondoFees) || 0,
    })
  }, [price, rent, vacancyRate, maintenanceRate, annualCondoFees])

  const cityAvgRoi = useMemo(() => {
    if (!city) return null
    const marketPricePerSqm = (pricePerSqmByCity as Record<string, number>)[city] ?? 2000
    const rentPerSqm = (rentByCity as Record<string, number>)[city] ?? 10
    const avg = calculateRealROI({
      price: marketPricePerSqm,
      estimatedMonthlyRent: rentPerSqm,
      vacancyRate: vacancyRate / 100,
      maintenanceRate: maintenanceRate / 100,
    })
    return avg.roi
  }, [city, vacancyRate, maintenanceRate])

  const badge = result ? roiBadge(result.roi) : null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calcolatore ROI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Inserisci i dati di un immobile per calcolare il rendimento netto stimato.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* Property inputs */}
        <div className="border-b border-gray-100 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Dati immobile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">

            {/* City */}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-gray-600">Città</span>
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); setRentOverridden(false) }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
              >
                <option value="">Seleziona città…</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {/* Price */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Prezzo acquisto (€)</span>
              <input
                type="number"
                placeholder="es. 150000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              {city && sqm && (
                <p className="mt-1 text-xs text-gray-400">
                  Mercato {city}: ~€{((pricePerSqmByCity as Record<string, number>)[city] * Number(sqm) || 0).toLocaleString('it-IT')}
                </p>
              )}
            </label>

            {/* Sqm */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Superficie (m²)</span>
              <input
                type="number"
                placeholder="es. 80"
                value={sqm}
                onChange={(e) => setSqm(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </label>

            {/* Rent */}
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Affitto mensile (€)</span>
                {city && sqm && !rentOverridden && (
                  <span className="text-blue-500">auto da {city}</span>
                )}
              </span>
              <input
                type="number"
                placeholder="es. 800"
                value={rent}
                onChange={(e) => { setRent(e.target.value); setRentOverridden(true) }}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              {city && sqm && rentOverridden && (
                <button
                  onClick={() => {
                    setRentOverridden(false)
                    const rentPerSqm = (rentByCity as Record<string, number>)[city] ?? 10
                    setRent(String(Math.round(rentPerSqm * Number(sqm))))
                  }}
                  className="mt-1 text-xs text-blue-500 hover:underline"
                >
                  Ripristina stima automatica
                </button>
              )}
            </label>

            {/* Condo fees */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Spese condominiali annue (€)</span>
              <input
                type="number"
                placeholder="es. 1200 (opzionale)"
                value={annualCondoFees}
                onChange={(e) => setAnnualCondoFees(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
            </label>
          </div>
        </div>

        {/* Assumption sliders */}
        <div className="border-b border-gray-100 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Parametri
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Tasso sfitto</span>
                <span className="text-gray-900">{vacancyRate}%</span>
              </span>
              <input
                type="range" min={0} max={20} value={vacancyRate}
                onChange={(e) => setVacancyRate(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </label>
            <label className="block">
              <span className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
                <span>Costi manutenzione</span>
                <span className="text-gray-900">{maintenanceRate}%</span>
              </span>
              <input
                type="range" min={0} max={20} value={maintenanceRate}
                onChange={(e) => setMaintenanceRate(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Cedolare secca 21% già inclusa nel calcolo.
          </p>
        </div>

        {/* Results */}
        {result ? (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Risultati
              </h2>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge!.className}`}>
                {badge!.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <ResultCard
                label="ROI netto"
                value={`${result.roi.toFixed(1)}%`}
                valueClassName={roiColor(result.roi)}
                sub={
                  cityAvgRoi !== null ? (
                    <span className={result.roi > cityAvgRoi ? 'text-green-600' : 'text-red-500'}>
                      {result.roi > cityAvgRoi ? '▲' : '▼'} media {city} {cityAvgRoi.toFixed(1)}%
                    </span>
                  ) : undefined
                }
              />
              <ResultCard
                label="Cashflow mensile"
                value={`€${result.monthlyCashflow.toLocaleString('it-IT')}`}
                valueClassName={result.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-500'}
              />
              <ResultCard
                label="Reddito netto annuo"
                value={`€${result.netIncome.toLocaleString('it-IT')}`}
                valueClassName={result.netIncome >= 0 ? 'text-gray-900' : 'text-red-500'}
              />
            </div>

            {/* Breakdown */}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Dettaglio costi</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Affitto lordo annuo</span>
                  <span className="font-medium text-gray-900">€{(Number(rent) * 12).toLocaleString('it-IT')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Affitto effettivo (dopo sfitto)</span>
                  <span className="font-medium text-gray-900">€{result.effectiveRent.toLocaleString('it-IT')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Costi totali</span>
                  <span className="font-medium text-red-500">-€{result.totalCosts.toLocaleString('it-IT')}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="font-medium text-gray-700">Reddito netto</span>
                  <span className={`font-bold ${result.netIncome >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    €{result.netIncome.toLocaleString('it-IT')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-gray-400">
            Inserisci prezzo e affitto per vedere i risultati.
          </div>
        )}
      </div>
    </div>
  )
}

function ResultCard({
  label,
  value,
  valueClassName = 'text-gray-900',
  sub,
}: {
  label: string
  value: string
  valueClassName?: string
  sub?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${valueClassName}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs">{sub}</p>}
    </div>
  )
}
