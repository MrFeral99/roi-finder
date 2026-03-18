export interface InvestmentInput {
  price: number
  estimatedMonthlyRent: number
  vacancyRate?: number      // 0–1, default 0.08
  maintenanceRate?: number  // 0–1, default 0.10
  taxRate?: number          // 0–1, default 0.21 (cedolare secca)
  annualCondoFees?: number  // €, default 0
  annualOtherCosts?: number // €, default 0
}

export interface InvestmentResult {
  roi: number
  netIncome: number
  monthlyCashflow: number
  effectiveRent: number
  totalCosts: number
}

export function calculateRealROI(input: InvestmentInput): InvestmentResult {
  const {
    price,
    estimatedMonthlyRent,
    vacancyRate = 0.08,
    maintenanceRate = 0.10,
    taxRate = 0.21,
    annualCondoFees = 0,
    annualOtherCosts = 0,
  } = input

  const annualRent = estimatedMonthlyRent * 12
  const effectiveRent = annualRent * (1 - vacancyRate)
  const maintenanceCost = effectiveRent * maintenanceRate
  const taxes = effectiveRent * taxRate
  const totalCosts = maintenanceCost + taxes + annualCondoFees + annualOtherCosts
  const netIncome = effectiveRent - totalCosts
  const roi = price > 0 ? (netIncome / price) * 100 : 0
  const monthlyCashflow = netIncome / 12

  return {
    roi: Math.round(roi * 10) / 10,
    netIncome: Math.round(netIncome),
    monthlyCashflow: Math.round(monthlyCashflow),
    effectiveRent: Math.round(effectiveRent),
    totalCosts: Math.round(totalCosts),
  }
}

/** ROI medio di mercato per una città (usando prezzo e affitto medi per m²) */
export function getCityAverageROI(
  marketPricePerSqm: number,
  rentPerSqm: number
): number {
  // i m² si cancellano → ROI indipendente dalla dimensione
  const result = calculateRealROI({
    price: marketPricePerSqm,
    estimatedMonthlyRent: rentPerSqm,
  })
  return result.roi
}
