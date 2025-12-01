// astro/src/lib/firestore/types.ts
import type { Timestamp } from 'firebase-admin/firestore';

export type OwnerTier = 'asset-partner' | 'performance-starter' | 'buyout';

export interface Owner {
  id: string; // Firestore doc id
  name: string;
  email: string;
  tier: OwnerTier;
  stripeAccountId: string;      // Stripe Connect account
  currency: string;             // e.g. "EUR", "USD"
  contractStart: Timestamp;
  contractMonths: number;       // 12, 18, etc.
  commissionPercent: number;    // 10 | 15 | 0
}

export type ListingType = 'villa' | 'yacht' | 'boutique-hotel';

export interface ListingLocation {
  country: string;
  region?: string;
  city?: string;
}

export type PricingStrategy = 'manual' | 'fixed' | 'seasonal' | 'per-person';

export interface Listing {
  id: string;        // Firestore doc id
  slug: string;      // used in URL
  type: ListingType;
  name: string;
  ownerId: string;
  location: ListingLocation;
  maxGuests: number;
  commissionPercent: number;    // usually mirrors owner.commissionPercent
  baseCurrency: string;         // "EUR", "USD", etc.
  pricingStrategy: PricingStrategy;  // how pricing is determined
  status: 'active' | 'hidden';
}

export type CalendarSourceType = 'airbnb_ical' | 'booking_ical' | 'manual_only';

export interface CalendarSource {
  id: string;        // Firestore doc id
  listingId: string;
  type: CalendarSourceType;
  url?: string;      // iCal URL if applicable
  syncStrategy: 'read_only' | 'manual_only';
  lastSyncedAt?: Timestamp;
}

export type CalendarBlockSource = 'airbnb' | 'booking' | 'manual';

export interface CalendarBlock {
  id: string;        // Firestore doc id
  listingId: string;
  startDate: string; // ISO date "2025-01-12"
  endDate: string;   // ISO date (exclusive or inclusive depending on parser)
  source: CalendarBlockSource;
}

export type InquiryStatus =
  | 'pending_owner'
  | 'approved'
  | 'declined'
  | 'expired'
  | 'awaiting_payment'
  | 'paid'
  | 'cancelled';

export type InquiryOrigin = 'villa_site' | 'whatsapp' | 'manual' | 'phone' | 'email';

export interface Inquiry {
  id: string;             // Firestore doc id
  listingId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;        // ISO date
  checkOut: string;       // ISO date
  partySize: number;
  message?: string;
  occasion?: string;      // "40th birthday", etc.
  origin: InquiryOrigin;  // where the inquiry came from
  status: InquiryStatus;
  currency: string;       // "USD", "EUR", "GBP", etc.
  quoteAmount?: number;   // owner-specified price (set during approval)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BookingStatus = 'awaiting_payment' | 'paid' | 'cancelled';

export type BookingChannel = 'direct' | 'airbnb' | 'booking' | 'vrbo';

export interface Booking {
  id: string;             // Firestore doc id
  listingId: string;
  ownerId: string;
  inquiryId: string;
  channel: BookingChannel; // where the booking originated
  currency: string;
  totalAmount: number;        // full price charged to guest
  platformFeePercent: number; // 10 or 15
  platformFeeAmount: number;  // calculated
  ownerAmount: number;        // calculated
  status: BookingStatus;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
