import { Property, PropertyWithMetrics } from '@/types'
import { estimateMonthlyRent } from './rentEstimator'
import { calculateROI } from './roi'
import { calculateDiscount } from './discountCalculator'
import { calculateScore } from './opportunityScore'
import { estimateAuctionFinalPrice } from './auctionEstimator'

export function computeMetrics(property: Property): PropertyWithMetrics {
  const pricePerSqm = property.price / property.sqm
  const estimatedRent = estimateMonthlyRent(property.city, property.sqm)
  const annualRent = estimatedRent * 12

  // For auctions ROI is computed on the estimated final price (what you'll actually pay)
  const auctionEstimate = property.isAuction
    ? estimateAuctionFinalPrice(property.price)
    : null

  const effectivePrice = auctionEstimate?.estimatedFinalPrice ?? property.price

  const roi = calculateROI(effectivePrice, estimatedRent)
  const discount = calculateDiscount(property.city, pricePerSqm)
  const score = calculateScore(roi, discount)

  const roiOnFinalPrice = auctionEstimate
    ? Math.round(calculateROI(auctionEstimate.estimatedFinalPrice, estimatedRent) * 10) / 10
    : null

  return {
    ...property,
    pricePerSqm: Math.round(pricePerSqm),
    estimatedRent: Math.round(estimatedRent),
    annualRent: Math.round(annualRent),
    roi: Math.round(roi * 10) / 10,
    discount: Math.round(discount * 10) / 10,
    score: Math.round(score * 10) / 10,
    estimatedFinalPrice: auctionEstimate?.estimatedFinalPrice ?? null,
    estimatedFinalPriceMin: auctionEstimate?.estimatedFinalPriceMin ?? null,
    estimatedFinalPriceMax: auctionEstimate?.estimatedFinalPriceMax ?? null,
    roiOnFinalPrice,
  }
}
