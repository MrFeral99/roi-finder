'use client'
import { useState, useEffect, useMemo } from 'react'
import { calculateRealROI, calculateMortgage, weeklyRatesToAnnualRent, WeeklyRate } from '@/lib/investment'
import rentByCity from '@/data/rentByCity.json'
import pricePerSqmByCity from '@/data/pricePerSqmByCity.json'

const CITIES = Object.keys(rentByCity as Record<string, number>).sort()

const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function emptyWeeklyRates(): Record<string, WeeklyRate | null> {
  const r: Record<string, WeeklyRate | null> = {}
  for (let i = 1; i <= 12; i++) r[String(i)] = null
  return r
}

interface UserProperty {
  id: string
  title: string
  city: string
  address?: string | null
  price: number
  sqm: number
  monthlyRent: number
  status: string
  purchaseDate?: string | null
  acquisitionCosts?: number | null
  notes?: string | null
  vacancyRate: number
  maintenanceRate: number
  annualCondoFees: number
  rentalMode: string
  weeklyRates?: Record<string, WeeklyRate | null> | null
  mortgageAmount?: number | null
  mortgageRate?: number | null
  mortgageDurationYears?: number | null
  createdAt: string
}

const EMPTY_FORM = {
  title: '',
  city: '',
  address: '',
  price: '',
  sqm: '',
  monthlyRent: '',
  status: 'valutazione',
  purchaseDate: '',
  acquisitionCosts: '',
  notes: '',
  vacancyRate: 8,
  maintenanceRate: 10,
  annualCondoFees: '',
  rentalMode: 'monthly' as 'monthly' | 'weekly',
  weeklyRates: emptyWeeklyRates(),
  mortgageEnabled: false,
  mortgageAmount: '',
  mortgageRate: '',
  mortgageDurationYears: '',
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

function statusConfig(status: string) {
  if (status === 'acquistato') return { label: 'ACQUISTATO', dot: '🟢', bg: 'bg-green-50', border: 'border-green-200' }
  if (status === 'scartato') return { label: 'SCARTATO', dot: '⚫', bg: 'bg-gray-50', border: 'border-gray-200' }
  return { label: 'IN VALUTAZIONE', dot: '🔵', bg: 'bg-blue-50', border: 'border-blue-200' }
}

function calcROI(p: UserProperty) {
  if (p.rentalMode === 'weekly' && p.weeklyRates) {
    const annualRent = weeklyRatesToAnnualRent(p.weeklyRates)
    return calculateRealROI({
      price: p.price,
      annualRentOverride: annualRent,
      maintenanceRate: p.maintenanceRate / 100,
      annualCondoFees: p.annualCondoFees,
    })
  }
  return calculateRealROI({
    price: p.price,
    estimatedMonthlyRent: p.monthlyRent,
    vacancyRate: p.vacancyRate / 100,
    maintenanceRate: p.maintenanceRate / 100,
    annualCondoFees: p.annualCondoFees,
  })
}

function totalWeeksRented(rates: Record<string, WeeklyRate | null>): number {
  return Object.values(rates).reduce((sum, m) => sum + (m ? m.weeks : 0), 0)
}

export default function MieProprietaPage() {
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [rentOverridden, setRentOverridden] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/my-properties')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setProperties(data) })
      .finally(() => setLoading(false))
  }, [])

  // Auto-fill rent (only in monthly mode)
  useEffect(() => {
    if (form.rentalMode !== 'monthly') return
    if (!rentOverridden && form.city && form.sqm) {
      const rentPerSqm = (rentByCity as Record<string, number>)[form.city] ?? 10
      setForm((f) => ({ ...f, monthlyRent: String(Math.round(rentPerSqm * Number(f.sqm))) }))
    }
  }, [form.city, form.sqm, rentOverridden, form.rentalMode])

  // Auto-fill price (only if empty)
  useEffect(() => {
    if (!form.price && form.city && form.sqm) {
      const marketPricePerSqm = (pricePerSqmByCity as Record<string, number>)[form.city] ?? 2000
      setForm((f) => ({ ...f, price: String(Math.round(marketPricePerSqm * Number(f.sqm))) }))
    }
  }, [form.city, form.sqm]) // eslint-disable-line react-hooks/exhaustive-deps

  const previewROI = useMemo(() => {
    const p = Number(form.price)
    if (!p || p <= 0) return null

    if (form.rentalMode === 'weekly') {
      const annualRent = weeklyRatesToAnnualRent(form.weeklyRates)
      if (annualRent <= 0) return null
      return calculateRealROI({
        price: p,
        annualRentOverride: annualRent,
        maintenanceRate: form.maintenanceRate / 100,
        annualCondoFees: Number(form.annualCondoFees) || 0,
      })
    }

    const r = Number(form.monthlyRent)
    if (!r || r <= 0) return null
    return calculateRealROI({
      price: p,
      estimatedMonthlyRent: r,
      vacancyRate: form.vacancyRate / 100,
      maintenanceRate: form.maintenanceRate / 100,
      annualCondoFees: Number(form.annualCondoFees) || 0,
    })
  }, [form.price, form.monthlyRent, form.vacancyRate, form.maintenanceRate, form.annualCondoFees, form.rentalMode, form.weeklyRates])

  // Portfolio summary — only "acquistato" properties
  const summary = useMemo(() => {
    const purchased = properties.filter((p) => p.status === 'acquistato')
    const totalInvested = purchased.reduce((acc, p) => acc + p.price + (p.acquisitionCosts ?? 0), 0)
    const totalCashflow = properties.reduce((acc, p) => acc + calcROI(p).monthlyCashflow, 0)
    const weightedROI =
      purchased.length > 0
        ? purchased.reduce((acc, p) => acc + calcROI(p).roi * p.price, 0) /
          purchased.reduce((acc, p) => acc + p.price, 0)
        : 0
    return { totalInvested, totalCashflow, weightedROI: Math.round(weightedROI * 10) / 10, count: purchased.length }
  }, [properties])

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, weeklyRates: emptyWeeklyRates() })
    setRentOverridden(false)
    setShowForm(true)
  }

  function openEdit(p: UserProperty) {
    setEditingId(p.id)
    setForm({
      title: p.title,
      city: p.city,
      address: p.address ?? '',
      price: String(p.price),
      sqm: String(p.sqm),
      monthlyRent: String(p.monthlyRent),
      status: p.status,
      purchaseDate: p.purchaseDate ?? '',
      acquisitionCosts: p.acquisitionCosts != null ? String(p.acquisitionCosts) : '',
      notes: p.notes ?? '',
      vacancyRate: p.vacancyRate,
      maintenanceRate: p.maintenanceRate,
      annualCondoFees: p.annualCondoFees ? String(p.annualCondoFees) : '',
      rentalMode: (p.rentalMode as 'monthly' | 'weekly') ?? 'monthly',
      weeklyRates: p.weeklyRates ?? emptyWeeklyRates(),
      mortgageEnabled: p.mortgageAmount != null,
      mortgageAmount: p.mortgageAmount != null ? String(p.mortgageAmount) : '',
      mortgageRate: p.mortgageRate != null ? String(p.mortgageRate) : '',
      mortgageDurationYears: p.mortgageDurationYears != null ? String(p.mortgageDurationYears) : '',
    })
    setRentOverridden(true)
    setShowForm(true)
  }

  function updateWeeklyRate(month: string, field: 'weeks' | 'rate', value: string) {
    setForm((f) => {
      const current = f.weeklyRates[month]
      if (value === '') {
        // If both would be empty, set null
        const otherField = field === 'weeks' ? 'rate' : 'weeks'
        const otherVal = current ? current[otherField] : undefined
        if (!otherVal) {
          return { ...f, weeklyRates: { ...f.weeklyRates, [month]: null } }
        }
        return {
          ...f,
          weeklyRates: {
            ...f.weeklyRates,
            [month]: { ...(current ?? { weeks: 4, rate: 0 }), [field]: 0 },
          },
        }
      }
      return {
        ...f,
        weeklyRates: {
          ...f.weeklyRates,
          [month]: { ...(current ?? { weeks: 4, rate: 0 }), [field]: Number(value) },
        },
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      title: form.title,
      city: form.city,
      address: form.address || null,
      price: Number(form.price),
      sqm: Number(form.sqm),
      monthlyRent: form.rentalMode === 'monthly' ? Number(form.monthlyRent) : 0,
      status: form.status,
      purchaseDate: form.purchaseDate || null,
      acquisitionCosts: form.acquisitionCosts ? Number(form.acquisitionCosts) : null,
      notes: form.notes || null,
      vacancyRate: form.vacancyRate,
      maintenanceRate: form.maintenanceRate,
      annualCondoFees: Number(form.annualCondoFees) || 0,
      rentalMode: form.rentalMode,
      weeklyRates: form.rentalMode === 'weekly' ? form.weeklyRates : null,
      mortgageAmount: form.mortgageAmount ? Number(form.mortgageAmount) : null,
      mortgageRate: form.mortgageRate ? Number(form.mortgageRate) : null,
      mortgageDurationYears: form.mortgageDurationYears ? Number(form.mortgageDurationYears) : null,
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/my-properties/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const updated = await res.json()
        setProperties((prev) => prev.map((p) => (p.id === editingId ? updated : p)))
      } else {
        const res = await fetch('/api/my-properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const created = await res.json()
        setProperties((prev) => [created, ...prev])
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa proprietà?')) return
    setDeletingId(id)
    await fetch(`/api/my-properties/${id}`, { method: 'DELETE' })
    setProperties((prev) => prev.filter((p) => p.id !== id))
    setDeletingId(null)
  }

  const groups = [
    { key: 'acquistato', props: properties.filter((p) => p.status === 'acquistato') },
    { key: 'valutazione', props: properties.filter((p) => p.status === 'valutazione') },
    { key: 'scartato', props: properties.filter((p) => p.status === 'scartato') },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Le mie proprietà</h1>
          <p className="mt-1 text-sm text-gray-500">Traccia il tuo portafoglio immobiliare</p>
        </div>
        <button
          onClick={openAdd}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Aggiungi
        </button>
      </div>

      {/* Portfolio Summary */}
      {properties.length > 0 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Totale investito</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              €{summary.totalInvested.toLocaleString('it-IT')}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{summary.count} immobil{summary.count === 1 ? 'e' : 'i'} acquistat{summary.count === 1 ? 'o' : 'i'}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Cashflow mensile</p>
            <p className={`mt-1 text-2xl font-bold ${summary.totalCashflow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              €{summary.totalCashflow.toLocaleString('it-IT')}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">tutte le proprietà</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">ROI medio ponderato</p>
            <p className={`mt-1 text-2xl font-bold ${roiColor(summary.weightedROI)}`}>
              {summary.weightedROI}%
            </p>
            <p className="mt-0.5 text-xs text-gray-400">solo acquistati</p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId ? 'Modifica proprietà' : 'Aggiungi proprietà'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Titolo *</label>
                <input
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Es. Bilocale Milano Isola"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Città *</label>
                <select
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  value={form.city}
                  onChange={(e) => { setForm((f) => ({ ...f, city: e.target.value })); setRentOverridden(false) }}
                >
                  <option value="">Seleziona città</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Indirizzo</label>
                <input
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Via Roma 1"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">m² *</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="70"
                  value={form.sqm}
                  onChange={(e) => setForm((f) => ({ ...f, sqm: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Prezzo acquisto (€) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="150000"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Stato</label>
                <select
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="valutazione">🔵 In valutazione</option>
                  <option value="acquistato">🟢 Acquistato</option>
                  <option value="scartato">⚫ Scartato</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Data acquisto</label>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  value={form.purchaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Spese acquisto (€)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="5000"
                  value={form.acquisitionCosts}
                  onChange={(e) => setForm((f) => ({ ...f, acquisitionCosts: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Spese condominiali annue (€)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="1200"
                  value={form.annualCondoFees}
                  onChange={(e) => setForm((f) => ({ ...f, annualCondoFees: e.target.value }))}
                />
              </div>
            </div>

            {/* Mortgage section */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.mortgageEnabled}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    mortgageEnabled: e.target.checked,
                    ...(e.target.checked ? {} : { mortgageAmount: '', mortgageRate: '', mortgageDurationYears: '' }),
                  }))}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-sm font-semibold text-gray-700">Finanzia con un mutuo</span>
              </label>
              {form.mortgageEnabled && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Importo mutuo (€)</label>
                    <input
                      type="number"
                      placeholder="es. 120000"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                      value={form.mortgageAmount}
                      onChange={(e) => setForm((f) => ({ ...f, mortgageAmount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Tasso (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="es. 4.5"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                      value={form.mortgageRate}
                      onChange={(e) => setForm((f) => ({ ...f, mortgageRate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Durata (anni)</label>
                    <input
                      type="number"
                      placeholder="es. 25"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                      value={form.mortgageDurationYears}
                      onChange={(e) => setForm((f) => ({ ...f, mortgageDurationYears: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rental mode toggle */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-600">Modalità affitto</label>
              <div className="inline-flex rounded-xl border border-gray-300 bg-white p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rentalMode: 'monthly' }))}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    form.rentalMode === 'monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Mensile
                </button>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rentalMode: 'weekly' }))}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                    form.rentalMode === 'weekly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  A settimane
                </button>
              </div>
            </div>

            {/* Monthly-specific fields */}
            {form.rentalMode === 'monthly' && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Affitto mensile (€) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                      placeholder="800"
                      value={form.monthlyRent}
                      onChange={(e) => { setForm((f) => ({ ...f, monthlyRent: e.target.value })); setRentOverridden(true) }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex justify-between text-xs font-medium text-gray-600">
                      <span>Vacancy rate</span>
                      <span className="font-semibold text-gray-900">{form.vacancyRate}%</span>
                    </label>
                    <input
                      type="range" min="0" max="30" step="1"
                      className="w-full accent-blue-600"
                      value={form.vacancyRate}
                      onChange={(e) => setForm((f) => ({ ...f, vacancyRate: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex justify-between text-xs font-medium text-gray-600">
                      <span>Manutenzione</span>
                      <span className="font-semibold text-gray-900">{form.maintenanceRate}%</span>
                    </label>
                    <input
                      type="range" min="0" max="30" step="1"
                      className="w-full accent-blue-600"
                      value={form.maintenanceRate}
                      onChange={(e) => setForm((f) => ({ ...f, maintenanceRate: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Weekly-specific fields */}
            {form.rentalMode === 'weekly' && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-600">Tariffe settimanali per mese</label>
                  <span className="text-xs text-gray-400">Lascia vuoto se il mese non è affittato</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 12 }, (_, i) => {
                    const key = String(i + 1)
                    const entry = form.weeklyRates[key]
                    return (
                      <div key={key} className="rounded-xl border border-gray-200 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold text-gray-700">{MONTH_NAMES[i]}</p>
                        <div className="space-y-1.5">
                          <div>
                            <label className="text-[10px] text-gray-400">€/settimana</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="—"
                              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
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
                              className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
                              value={entry?.weeks ?? ''}
                              onChange={(e) => updateWeeklyRate(key, 'weeks', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2">
                  <label className="mb-1 flex justify-between text-xs font-medium text-gray-600">
                    <span>Manutenzione</span>
                    <span className="font-semibold text-gray-900">{form.maintenanceRate}%</span>
                  </label>
                  <input
                    type="range" min="0" max="30" step="1"
                    className="w-full accent-blue-600"
                    value={form.maintenanceRate}
                    onChange={(e) => setForm((f) => ({ ...f, maintenanceRate: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Note</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="Note personali..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {/* ROI Preview */}
            {previewROI && (
              <div className="rounded-xl border border-blue-200 bg-white p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Anteprima ROI</p>
                {form.rentalMode === 'weekly' && (
                  <p className="mb-2 text-xs text-gray-500">
                    Reddito lordo annuo: <span className="font-semibold text-gray-700">€{weeklyRatesToAnnualRent(form.weeklyRates).toLocaleString('it-IT')}</span>
                    {' · '}{totalWeeksRented(form.weeklyRates)} settimane affittate
                  </p>
                )}
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-gray-500">ROI netto</p>
                    <p className={`text-lg font-bold ${roiColor(previewROI.roi)}`}>{previewROI.roi}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cashflow mensile</p>
                    <p className={`text-lg font-bold ${previewROI.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      €{previewROI.monthlyCashflow.toLocaleString('it-IT')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reddito netto annuo</p>
                    <p className="text-lg font-bold text-gray-900">€{previewROI.netIncome.toLocaleString('it-IT')}</p>
                  </div>
                  <div className="flex items-end">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${roiBadge(previewROI.roi).className}`}>
                      {roiBadge(previewROI.roi).label}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Salvataggio...' : editingId ? 'Salva modifiche' : 'Aggiungi'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {!loading && properties.length === 0 && !showForm && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-4xl">🏘️</p>
          <p className="mt-3 text-lg font-semibold text-gray-700">Nessuna proprietà ancora</p>
          <p className="mt-1 text-sm text-gray-400">Aggiungi immobili per tracciare il tuo portafoglio</p>
          <button
            onClick={openAdd}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Aggiungi la prima proprietà
          </button>
        </div>
      )}

      {/* Groups */}
      {groups.map(({ key, props }) => {
        if (props.length === 0) return null
        const cfg = statusConfig(key)
        return (
          <div key={key} className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
              <span>{cfg.dot}</span> {cfg.label}
            </h2>
            <div className="space-y-3">
              {props.map((p) => {
                const roi = calcROI(p)
                const badge = roiBadge(roi.roi)
                const isWeekly = p.rentalMode === 'weekly' && p.weeklyRates
                const weeksRented = isWeekly ? totalWeeksRented(p.weeklyRates!) : null
                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-5`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{p.title}</h3>
                        <p className="text-sm text-gray-500">{p.city}{p.address ? ` · ${p.address}` : ''}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {p.sqm} m² · €{p.price.toLocaleString('it-IT')} ·{' '}
                          {isWeekly
                            ? <span>{weeksRented} settimane/anno · tariffe settimanali</span>
                            : <span>{p.monthlyRent.toLocaleString('it-IT')} €/mese</span>
                          }
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <p className={`text-xl font-bold ${roiColor(roi.roi)}`}>{roi.roi}%</p>
                          <p className="text-xs text-gray-400">ROI netto</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${roi.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            €{roi.monthlyCashflow.toLocaleString('it-IT')}
                          </p>
                          <p className="text-xs text-gray-400">cashflow/mese</p>
                        </div>
                        <span className={`mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    {p.mortgageAmount && p.mortgageRate && p.mortgageDurationYears && (() => {
                      const m = calculateMortgage(p.mortgageAmount, p.mortgageRate / 100, p.mortgageDurationYears)
                      const cashflowWithMortgage = roi.monthlyCashflow - m.monthlyPayment
                      return (
                        <p className="mt-1.5 text-xs text-blue-600">
                          Rata: <span className="font-semibold">€{m.monthlyPayment.toLocaleString('it-IT')}/mese</span>
                          {' · '}
                          Cashflow con mutuo: <span className={`font-semibold ${cashflowWithMortgage >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            €{cashflowWithMortgage.toLocaleString('it-IT')}/mese
                          </span>
                          {' · '}
                          Durata: {p.mortgageDurationYears} anni
                        </p>
                      )
                    })()}
                    {p.notes && (
                      <p className="mt-2 text-xs text-gray-500 italic">{p.notes}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        Modifica
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === p.id ? '...' : 'Elimina'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
