import rentByCity from '@/data/rentByCity.json'

/**
 * Estimate monthly rent based on city rent index and property size.
 *
 * Formula: estimated_rent = rent_per_sqm_city * sqm
 *
 * @example
 * estimateMonthlyRent('Torino', 80) // → 880  (11 €/sqm * 80 sqm)
 */
export function estimateMonthlyRent(city: string, sqm: number): number {
  const rentPerSqm = (rentByCity as Record<string, number>)[city] ?? 10
  return rentPerSqm * sqm
}
