export interface InvestmentInput {
  price: number
  estimatedMonthlyRent?: number
  annualRentOverride?: number   // if present, bypasses estimatedMonthlyRent * 12
  vacancyRate?: number          // 0–1, default 0.08
  maintenanceRate?: number      // 0–1, default 0.10
  taxRate?: number              // 0–1, default 0.21 (cedolare secca)
  annualCondoFees?: number      // €, default 0
  annualOtherCosts?: number     // €, default 0
}

export interface WeeklyRate { weeks: number; rate: number }

export function weeklyRatesToAnnualRent(
  rates: Record<string, WeeklyRate | null>
): number {
  return Object.values(rates).reduce(
    (sum, m) => sum + (m ? m.weeks * m.rate : 0), 0
  )
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
    estimatedMonthlyRent = 0,
    annualRentOverride,
    vacancyRate = 0.08,
    maintenanceRate = 0.10,
    taxRate = 0.21,
    annualCondoFees = 0,
    annualOtherCosts = 0,
  } = input

  const annualRent = annualRentOverride ?? estimatedMonthlyRent * 12
  const effectiveRent = annualRentOverride != null
    ? annualRentOverride
    : annualRent * (1 - vacancyRate)
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

export interface MortgageResult {
  monthlyPayment: number
  totalPaid: number
  totalInterest: number
}

export function calculateMortgage(
  principal: number,
  annualRate: number,
  years: number
): MortgageResult {
  if (annualRate === 0) {
    const monthlyPayment = principal / (years * 12)
    return { monthlyPayment, totalPaid: principal, totalInterest: 0 }
  }
  const r = annualRate / 12
  const n = years * 12
  const monthlyPayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const totalPaid = monthlyPayment * n
  return {
    monthlyPayment: Math.round(monthlyPayment),
    totalPaid: Math.round(totalPaid),
    totalInterest: Math.round(totalPaid - principal),
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
