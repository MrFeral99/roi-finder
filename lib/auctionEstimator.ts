/**
 * Auction price estimator for Italian real estate auctions.
 *
 * In Italian judicial/voluntary auctions the final hammer price is typically
 * 10–30% above the base price ("prezzo base d'asta").
 * We use 20% as the central estimate, giving a ±10% range.
 *
 * References: Tribunale statistics, AsteSudest, AGL Aste Immobiliari.
 */

export const AUCTION_MARKUP_MIN = 1.05   // optimistic: +5%
export const AUCTION_MARKUP_MID = 1.20   // central estimate: +20%
export const AUCTION_MARKUP_MAX = 1.35   // conservative: +35%

export interface AuctionEstimate {
  estimatedFinalPrice: number
  estimatedFinalPriceMin: number
  estimatedFinalPriceMax: number
}

export function estimateAuctionFinalPrice(basePrice: number): AuctionEstimate {
  return {
    estimatedFinalPrice: Math.round(basePrice * AUCTION_MARKUP_MID),
    estimatedFinalPriceMin: Math.round(basePrice * AUCTION_MARKUP_MIN),
    estimatedFinalPriceMax: Math.round(basePrice * AUCTION_MARKUP_MAX),
  }
}
