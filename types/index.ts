export interface Property {
  id: string
  title: string
  city: string
  address: string
  price: number
  sqm: number
  sourceUrl: string
  sourceSite: string
  isAuction: boolean
  auctionDate: string | null
  createdAt: string
}

export interface PropertyWithMetrics extends Property {
  pricePerSqm: number
  estimatedRent: number
  annualRent: number
  roi: number
  discount: number
  score: number
  estimatedFinalPrice: number | null
  estimatedFinalPriceMin: number | null
  estimatedFinalPriceMax: number | null
  roiOnFinalPrice: number | null
}

export interface FilterParams {
  city?: string
  minROI?: number
  maxPrice?: number
}
