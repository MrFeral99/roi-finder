'use client'
import { useState, useMemo } from 'react'
import { calculateRealROI } from '@/lib/investment'

interface Props {
  defaultPrice: number
  defaultRent: number
  cityAvgRoi: number
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

export default function InvestmentSimulator({ defaultPrice, defaultRent, cityAvgRoi }: Props) {
  const [price, setPrice] = useState(defaultPrice)
  const [rent, setRent] = useState(defaultRent)
  const [vacancyRate, setVacancyRate] = useState(8)
  const [maintenanceRate, setMaintenanceRate] = useState(10)

  const result = useMemo(
    () =>
      calculateRealROI({
        price,
        estimatedMonthlyRent: rent,
        vacancyRate: vacancyRate / 100,
        maintenanceRate: maintenanceRate / 100,
      }),
    [price, rent, vacancyRate, maintenanceRate]
  )

  const badge = roiBadge(result.roi)
  const aboveMarket = result.roi > cityAvgRoi

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Simulatore investimento
        </h2>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Inputs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500">Prezzo offerta (€)</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500">Affitto mensile (€)</span>
          <input
            type="number"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-400 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Tasso sfitto</span>
            <span className="font-medium text-gray-700">{vacancyRate}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={20}
            value={vacancyRate}
            onChange={(e) => setVacancyRate(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Costi manutenzione</span>
            <span className="font-medium text-gray-700">{maintenanceRate}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={20}
            value={maintenanceRate}
            onChange={(e) => setMaintenanceRate(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </label>
      </div>

      {/* Results */}
      <div className="grid grid-cols-3 gap-3">
        <ResultCard
          label="ROI netto"
          value={`${result.roi.toFixed(1)}%`}
          valueClassName={roiColor(result.roi)}
          sub={
            <span className={aboveMarket ? 'text-green-600' : 'text-red-500'}>
              {aboveMarket ? '▲' : '▼'} media città {cityAvgRoi.toFixed(1)}%
            </span>
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

      {/* Breakdown note */}
      <p className="mt-4 text-xs text-gray-400">
        Cedolare secca 21% · sfitto {vacancyRate}% · manutenzione {maintenanceRate}% · affitto effettivo{' '}
        €{result.effectiveRent.toLocaleString('it-IT')}/anno
      </p>
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
