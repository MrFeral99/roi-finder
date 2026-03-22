'use client'
import { useState, useEffect, useMemo } from 'react'
import { calculateRealROI, calculateMortgage, weeklyRatesToAnnualRent, WeeklyRate } from '@/lib/investment'
import { posthog } from '@/lib/posthog'
import rentByCity from '@/data/rentByCity.json'
import pricePerSqmByCity from '@/data/pricePerSqmByCity.json'

const CITIES = Object.keys(rentByCity as Record<string, number>).sort()
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function emptyWeeklyRates(): Record<string, WeeklyRate | null> {
  const r: Record<string, WeeklyRate | null> = {}
  for (let i = 1; i <= 12; i++) r[String(i)] = null
  return r
}

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
  const [rentalMode, setRentalMode] = useState<'monthly' | 'weekly'>('monthly')
  const [city, setCity] = useState('')
  const [price, setPrice] = useState('')
  const [sqm, setSqm] = useState('')
  const [rent, setRent] = useState('')
  const [weeklyRates, setWeeklyRates] = useState<Record<string, WeeklyRate | null>>(emptyWeeklyRates)
  const [vacancyRate, setVacancyRate] = useState(8)
  const [maintenanceRate, setMaintenanceRate] = useState(10)
  const [annualCondoFees, setAnnualCondoFees] = useState('')
  const [rentOverridden, setRentOverridden] = useState(false)
  const [mortgageEnabled, setMortgageEnabled] = useState(false)
  const [mortgageAmount, setMortgageAmount] = useState('')
  const [mortgageRate, setMortgageRate] = useState('')
  const [mortgageDurationYears, setMortgageDurationYears] = useState('')

  // Auto-fill rent when city or sqm changes (only monthly mode, unless overridden)
  useEffect(() => {
    if (rentalMode !== 'monthly') return
    if (!rentOverridden && city && sqm) {
      const rentPerSqm = (rentByCity as Record<string, number>)[city] ?? 10
      setRent(String(Math.round(rentPerSqm * Number(sqm))))
    }
  }, [city, sqm, rentOverridden, rentalMode])

  // Auto-fill price when city or sqm changes (only if price is empty)
  useEffect(() => {
    if (!price && city && sqm) {
      const marketPricePerSqm = (pricePerSqmByCity as Record<string, number>)[city] ?? 2000
      setPrice(String(Math.round(marketPricePerSqm * Number(sqm))))
    }
  }, [city, sqm]) // eslint-disable-line react-hooks/exhaustive-deps

  function updateWeeklyRate(month: string, field: 'weeks' | 'rate', value: string) {
    setWeeklyRates((prev) => {
      const current = prev[month]
      if (value === '') {
        const otherField = field === 'weeks' ? 'rate' : 'weeks'
        const otherVal = current ? current[otherField] : undefined
        if (!otherVal) return { ...prev, [month]: null }
        return { ...prev, [month]: { ...(current ?? { weeks: 4, rate: 0 }), [field]: 0 } }
      }
      return {
        ...prev,
        [month]: { ...(current ?? { weeks: 4, rate: 0 }), [field]: Number(value) },
      }
    })
  }

  const annualRentWeekly = useMemo(() => weeklyRatesToAnnualRent(weeklyRates), [weeklyRates])
  const weeksRented = useMemo(
    () => Object.values(weeklyRates).reduce((sum, m) => sum + (m ? m.weeks : 0), 0),
    [weeklyRates]
  )

  const result = useMemo(() => {
    const p = Number(price)
    if (!p || p <= 0) return null

    if (rentalMode === 'weekly') {
      if (annualRentWeekly <= 0) return null
      return calculateRealROI({
        price: p,
        annualRentOverride: annualRentWeekly,
        maintenanceRate: maintenanceRate / 100,
        annualCondoFees: Number(annualCondoFees) || 0,
      })
    }

    const r = Number(rent)
    if (!r || r <= 0) return null
    return calculateRealROI({
      price: p,
      estimatedMonthlyRent: r,
      vacancyRate: vacancyRate / 100,
      maintenanceRate: maintenanceRate / 100,
      annualCondoFees: Number(annualCondoFees) || 0,
    })
  }, [price, rent, weeklyRates, annualRentWeekly, vacancyRate, maintenanceRate, annualCondoFees, rentalMode])

  useEffect(() => {
    if (!result) return
    posthog.capture('roi_calculated', {
      city: city || null,
      price: Number(price),
      roi: result.roi,
      rental_mode: rentalMode,
      mortgage_enabled: mortgageEnabled,
    })
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps

  const cityAvgRoi = useMemo(() => {
    if (!city || rentalMode === 'weekly') return null
    const marketPricePerSqm = (pricePerSqmByCity as Record<string, number>)[city] ?? 2000
    const rentPerSqm = (rentByCity as Record<string, number>)[city] ?? 10
    const avg = calculateRealROI({
      price: marketPricePerSqm,
      estimatedMonthlyRent: rentPerSqm,
      vacancyRate: vacancyRate / 100,
      maintenanceRate: maintenanceRate / 100,
    })
    return avg.roi
  }, [city, vacancyRate, maintenanceRate, rentalMode])

  const mortgage = useMemo(() => {
    if (!mortgageEnabled || !result) return null
    const principal = Number(mortgageAmount)
    const rate = Number(mortgageRate) / 100
    const years = Number(mortgageDurationYears)
    if (!principal || !rate || !years) return null
    const m = calculateMortgage(principal, rate, years)
    const downPayment = Number(price) - principal
    const annualCashflowDuringMortgage = result.netIncome - m.monthlyPayment * 12
    const cashOnCashROI = downPayment > 0
      ? (annualCashflowDuringMortgage / downPayment) * 100
      : 0
    return {
      ...m,
      downPayment,
      cashflowDuringMortgage: Math.round(result.monthlyCashflow - m.monthlyPayment),
      cashOnCashROI: Math.round(cashOnCashROI * 10) / 10,
    }
  }, [mortgageEnabled, mortgageAmount, mortgageRate, mortgageDurationYears, result, price])

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

            {/* Condo fees — always visible */}
            <label className="block sm:col-span-2">
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

        {/* Rental mode + rent inputs */}
        <div className="border-b border-gray-100 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Modalità affitto
            </h2>
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
              <button
                type="button"
                onClick={() => setRentalMode('monthly')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  rentalMode === 'monthly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Mensile
              </button>
              <button
                type="button"
                onClick={() => setRentalMode('weekly')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                  rentalMode === 'weekly'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                A settimane
              </button>
            </div>
          </div>

          {rentalMode === 'monthly' && (
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
          )}

          {rentalMode === 'weekly' && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">Inserisci tariffa e settimane per ogni mese affittato. Lascia vuoto i mesi non affittati.</p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 12 }, (_, i) => {
                  const key = String(i + 1)
                  const entry = weeklyRates[key]
                  return (
                    <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-2.5">
                      <p className="mb-2 text-xs font-semibold text-gray-700">{MONTH_NAMES[i]}</p>
                      <div className="space-y-1.5">
                        <div>
                          <label className="text-[10px] text-gray-400">€/sett.</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="—"
                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                            value={entry?.rate ?? ''}
                            onChange={(e) => updateWeeklyRate(key, 'rate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400">Settimane</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            placeholder="4"
                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                            value={entry?.weeks ?? ''}
                            onChange={(e) => updateWeeklyRate(key, 'weeks', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {annualRentWeekly > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Reddito lordo stimato: <span className="font-semibold text-gray-700">€{annualRentWeekly.toLocaleString('it-IT')}/anno</span>
                  {' · '}{weeksRented} settimane affittate
                </p>
              )}
            </div>
          )}
        </div>

        {/* Assumption sliders */}
        <div className="border-b border-gray-100 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Parametri
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {rentalMode === 'monthly' && (
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
            )}
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
            {rentalMode === 'weekly' && ' In modalità settimanale il tasso sfitto è gestito dai mesi vuoti.'}
          </p>
        </div>

        {/* Mortgage section */}
        <div className="border-b border-gray-100 p-6">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={mortgageEnabled}
              onChange={(e) => setMortgageEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            <span className="text-sm font-semibold text-gray-700">Finanzia con un mutuo</span>
          </label>

          {mortgageEnabled && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Importo mutuo (€)</span>
                <input
                  type="number"
                  placeholder="es. 120000"
                  value={mortgageAmount}
                  onChange={(e) => setMortgageAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Tasso interesse (%)</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="es. 4.5"
                  value={mortgageRate}
                  onChange={(e) => setMortgageRate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Durata (anni)</span>
                <input
                  type="number"
                  placeholder="es. 25"
                  value={mortgageDurationYears}
                  onChange={(e) => setMortgageDurationYears(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                />
              </label>
            </div>
          )}
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

            {/* Mortgage results */}
            {mortgage && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600">Con mutuo</p>
                <p className="mb-3 text-sm text-gray-600">
                  Acconto: <span className="font-semibold text-gray-900">€{mortgage.downPayment.toLocaleString('it-IT')}</span>
                  {' · '}
                  Rata mensile: <span className="font-semibold text-gray-900">€{mortgage.monthlyPayment.toLocaleString('it-IT')}</span>
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-blue-100 bg-white p-3 text-center">
                    <p className="text-xs text-gray-500">Cashflow con mutuo</p>
                    <p className={`mt-1 text-base font-bold ${mortgage.cashflowDuringMortgage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      €{mortgage.cashflowDuringMortgage.toLocaleString('it-IT')}/mese
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-white p-3 text-center">
                    <p className="text-xs text-gray-500">Cashflow post-mutuo</p>
                    <p className={`mt-1 text-base font-bold ${result.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      €{result.monthlyCashflow.toLocaleString('it-IT')}/mese
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-white p-3 text-center">
                    <p className="text-xs text-gray-500">ROI cash-on-cash</p>
                    <p className={`mt-1 text-base font-bold ${mortgage.cashOnCashROI >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {mortgage.cashOnCashROI.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Interessi totali: <span className="font-semibold text-gray-700">€{mortgage.totalInterest.toLocaleString('it-IT')}</span> su {mortgageDurationYears} anni
                </p>
                <p className="mt-1 text-xs text-gray-400">Il ROI cash-on-cash è il rendimento sul capitale proprio (acconto)</p>
              </div>
            )}

            {/* Breakdown */}
            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Dettaglio costi</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Affitto lordo annuo</span>
                  <span className="font-medium text-gray-900">
                    €{(rentalMode === 'weekly' ? annualRentWeekly : Number(rent) * 12).toLocaleString('it-IT')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    {rentalMode === 'weekly' ? 'Affitto effettivo' : 'Affitto effettivo (dopo sfitto)'}
                  </span>
                  <span className="font-medium text-gray-900">€{result.effectiveRent.toLocaleString('it-IT')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Manutenzione</span>
                  <span className="font-medium text-red-500">-€{result.maintenanceCost.toLocaleString('it-IT')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tasse (cedolare 21%)</span>
                  <span className="font-medium text-red-500">-€{result.taxes.toLocaleString('it-IT')}</span>
                </div>
                {Number(annualCondoFees) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Spese condominiali</span>
                    <span className="font-medium text-red-500">-€{Number(annualCondoFees).toLocaleString('it-IT')}</span>
                  </div>
                )}
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
            {rentalMode === 'weekly'
              ? 'Inserisci prezzo e almeno un mese con tariffa per vedere i risultati.'
              : 'Inserisci prezzo e affitto per vedere i risultati.'}
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
