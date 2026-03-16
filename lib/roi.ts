/**
 * Calculate Return on Investment (ROI) as a percentage.
 *
 * Formula: ROI = (annual_rent / property_price) * 100
 *
 * @example
 * calculateROI(100000, 800) // → 9.6
 */
export function calculateROI(price: number, monthlyRent: number): number {
  if (price <= 0) return 0
  const annualRent = monthlyRent * 12
  return (annualRent / price) * 100
}
