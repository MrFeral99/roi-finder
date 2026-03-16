'use client'

import { FilterParams } from '@/types'

interface Props {
  filters: FilterParams
  onChange: (filters: FilterParams) => void
}

export default function Filters({ filters, onChange }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {/* Min ROI */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">ROI minimo (%)</label>
          <input
            type="number"
            min={0}
            max={30}
            step={0.5}
            placeholder="es. 7"
            value={filters.minROI ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                minROI: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Max price */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Prezzo max (€)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step={5000}
              placeholder="es. 150000"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  maxPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {/* Reset visible on mobile inline with price */}
            <button
              onClick={() => onChange({})}
              className="sm:hidden rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Reset — desktop only */}
        <button
          onClick={() => onChange({})}
          className="hidden sm:block rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
