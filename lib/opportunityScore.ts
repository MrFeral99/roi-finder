/**
 * Compute an opportunity score to rank properties.
 *
 * Formula: score = (ROI * 0.6) + (discount * 0.4)
 * Higher score = better investment opportunity.
 * Score > 10 → "Hot Deal"
 *
 * @example
 * calculateScore(9.6, 18) // → 5.76 + 7.2 = 12.96
 */
export function calculateScore(roi: number, discount: number): number {
  return roi * 0.6 + discount * 0.4
}

export const HOT_DEAL_THRESHOLD = 10
export const HIGH_ROI_THRESHOLD = 8
export const UNDERVALUED_THRESHOLD = 15
