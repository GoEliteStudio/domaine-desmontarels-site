/**
 * Pricing calculation for villa inquiries
 * 
 * This module calculates a proposed quote based on listing configuration.
 * The quote is a PROPOSAL - owner always has final approval.
 */

import type { Listing } from './firestore/types';

/**
 * Pricing configuration stored per listing
 * This would be added to Firestore Listing document or a separate collection
 */
export interface ListingPricing {
  listingId: string;
  currency: string;           // "EUR", "USD", "GBP"
  
  // Nightly rates by season
  lowSeasonRate: number;      // e.g., 600
  highSeasonRate: number;     // e.g., 900
  peakSeasonRate?: number;    // e.g., 1200 (holidays, special events)
  
  // Season date ranges (MM-DD format for recurring years)
  highSeasonStart: string;    // "06-15"
  highSeasonEnd: string;      // "09-15"
  peakDates?: string[];       // ["12-20", "12-21", ..., "01-05"] Christmas/NY
  
  // Fees
  cleaningFee: number;        // One-time fee
  securityDeposit?: number;   // Refundable (not included in quote)
  
  // Constraints
  minimumNights: number;      // e.g., 3 or 7
  
  // Per-person pricing (if pricingStrategy === 'per-person')
  baseGuests?: number;        // Guests included in base rate
  extraGuestFee?: number;     // Per night per extra guest
}

export interface QuoteBreakdown {
  nights: number;
  nightlyRates: { date: string; rate: number; season: string }[];
  accommodationTotal: number;
  cleaningFee: number;
  extraGuestFee: number;
  total: number;
  currency: string;
  minimumNightsMet: boolean;
}

/**
 * Determine which season a date falls into
 */
function getSeason(
  date: Date,
  pricing: ListingPricing
): 'low' | 'high' | 'peak' {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  // Check peak dates first
  if (pricing.peakDates?.includes(mmdd)) {
    return 'peak';
  }
  
  // Check high season range
  const highStart = pricing.highSeasonStart;
  const highEnd = pricing.highSeasonEnd;
  
  if (highStart <= highEnd) {
    // Normal range (e.g., 06-15 to 09-15)
    if (mmdd >= highStart && mmdd <= highEnd) {
      return 'high';
    }
  } else {
    // Wrapping range (e.g., 11-01 to 03-31)
    if (mmdd >= highStart || mmdd <= highEnd) {
      return 'high';
    }
  }
  
  return 'low';
}

/**
 * Get nightly rate for a specific date
 */
function getRateForDate(date: Date, pricing: ListingPricing): { rate: number; season: string } {
  const season = getSeason(date, pricing);
  
  switch (season) {
    case 'peak':
      return { rate: pricing.peakSeasonRate || pricing.highSeasonRate, season: 'peak' };
    case 'high':
      return { rate: pricing.highSeasonRate, season: 'high' };
    default:
      return { rate: pricing.lowSeasonRate, season: 'low' };
  }
}

/**
 * Calculate number of nights between two dates
 */
function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate a quote for an inquiry
 * 
 * @param pricing - Listing pricing configuration
 * @param checkIn - ISO date string (YYYY-MM-DD)
 * @param checkOut - ISO date string (YYYY-MM-DD)
 * @param partySize - Number of guests
 * @returns Quote breakdown with total
 */
export function calculateQuote(
  pricing: ListingPricing,
  checkIn: string,
  checkOut: string,
  partySize: number
): QuoteBreakdown {
  const nights = calculateNights(checkIn, checkOut);
  const nightlyRates: QuoteBreakdown['nightlyRates'] = [];
  
  // Calculate rate for each night
  let accommodationTotal = 0;
  const startDate = new Date(checkIn);
  
  for (let i = 0; i < nights; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const { rate, season } = getRateForDate(currentDate, pricing);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    nightlyRates.push({ date: dateStr, rate, season });
    accommodationTotal += rate;
  }
  
  // Calculate extra guest fee (if applicable)
  let extraGuestFee = 0;
  if (pricing.baseGuests && pricing.extraGuestFee && partySize > pricing.baseGuests) {
    const extraGuests = partySize - pricing.baseGuests;
    extraGuestFee = extraGuests * pricing.extraGuestFee * nights;
  }
  
  const total = accommodationTotal + pricing.cleaningFee + extraGuestFee;
  
  return {
    nights,
    nightlyRates,
    accommodationTotal,
    cleaningFee: pricing.cleaningFee,
    extraGuestFee,
    total,
    currency: pricing.currency,
    minimumNightsMet: nights >= pricing.minimumNights,
  };
}

/**
 * Format a quote for display in emails
 */
export function formatQuoteForEmail(quote: QuoteBreakdown): string {
  const currencySymbol = getCurrencySymbol(quote.currency);
  
  let breakdown = `${quote.nights} nights accommodation: ${currencySymbol}${quote.accommodationTotal.toLocaleString()}`;
  
  if (quote.cleaningFee > 0) {
    breakdown += `\nCleaning fee: ${currencySymbol}${quote.cleaningFee.toLocaleString()}`;
  }
  
  if (quote.extraGuestFee > 0) {
    breakdown += `\nExtra guest fee: ${currencySymbol}${quote.extraGuestFee.toLocaleString()}`;
  }
  
  breakdown += `\n\nTotal: ${currencySymbol}${quote.total.toLocaleString()}`;
  
  if (!quote.minimumNightsMet) {
    breakdown += `\n\n⚠️ Note: This stay is below the minimum night requirement.`;
  }
  
  return breakdown;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF ',
    COP: 'COP $',    // Colombian Peso
    MXN: 'MX$',      // Mexican Peso
    BRL: 'R$',       // Brazilian Real
    ARS: 'ARS $',    // Argentine Peso
    CAD: 'CA$',      // Canadian Dollar
    AUD: 'A$',       // Australian Dollar
    NZD: 'NZ$',      // New Zealand Dollar
    ZAR: 'R',        // South African Rand
    THB: '฿',        // Thai Baht
    IDR: 'Rp',       // Indonesian Rupiah
    MYR: 'RM',       // Malaysian Ringgit
    AED: 'AED ',     // UAE Dirham
    SAR: 'SAR ',     // Saudi Riyal
    INR: '₹',        // Indian Rupee
    JPY: '¥',        // Japanese Yen
    CNY: '¥',        // Chinese Yuan
    KRW: '₩',        // Korean Won
    SEK: 'kr',       // Swedish Krona
    NOK: 'kr',       // Norwegian Krone
    DKK: 'kr',       // Danish Krone
    PLN: 'zł',       // Polish Zloty
    CZK: 'Kč',       // Czech Koruna
    HUF: 'Ft',       // Hungarian Forint
    TRY: '₺',        // Turkish Lira
    ILS: '₪',        // Israeli Shekel
    HRK: 'kn',       // Croatian Kuna
    RON: 'lei',      // Romanian Leu
    BGN: 'лв',       // Bulgarian Lev
  };
  return symbols[currency] || `${currency} `;
}

/**
 * Default pricing for villas without specific config
 * Used as fallback - owner should always review
 */
export function getDefaultPricing(listing: Listing | null): ListingPricing {
  return {
    listingId: listing?.id || 'unknown',
    currency: listing?.baseCurrency || 'EUR',
    lowSeasonRate: 500,
    highSeasonRate: 800,
    peakSeasonRate: 1200,
    highSeasonStart: '06-01',
    highSeasonEnd: '09-30',
    peakDates: [
      '12-20', '12-21', '12-22', '12-23', '12-24', '12-25', '12-26', '12-27',
      '12-28', '12-29', '12-30', '12-31', '01-01', '01-02', '01-03', '01-04', '01-05',
    ],
    cleaningFee: 250,
    minimumNights: 3,
  };
}
