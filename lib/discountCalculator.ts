import pricePerSqmByCity from '@/data/pricePerSqmByCity.json'

/**
 * Calculate the discount of a property vs the city average price per sqm.
 *
 * Formula: discount = ((market_price_sqm - property_price_sqm) / market_price_sqm) * 100
 * Positive value = below market (good deal). Negative = above market.
 *
 * @example
 * calculateDiscount('Torino', 1500) // → 25  (market 2000, listing 1500 → 25% below)
 */
export function calculateDiscount(city: string, propertyPricePerSqm: number): number {
  const marketPricePerSqm = (pricePerSqmByCity as Record<string, number>)[city] ?? 2000
  return ((marketPricePerSqm - propertyPricePerSqm) / marketPricePerSqm) * 100
}

export function getMarketPricePerSqm(city: string): number {
  return (pricePerSqmByCity as Record<string, number>)[city] ?? 2000
}
