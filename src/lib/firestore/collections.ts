// astro/src/lib/firestore/collections.ts
import { getDb } from '../firebase';
import type {
  Owner,
  Listing,
  CalendarSource,
  CalendarBlock,
  Inquiry,
  Booking,
} from './types';
import { Timestamp } from 'firebase-admin/firestore';

// Lazy getter - don't initialize at module load time (Vercel/serverless friendly)
const db = () => getDb();

// ---- Owners ----
export const ownersCol = () => db().collection('owners');

export async function createOwner(data: Omit<Owner, 'id'>): Promise<Owner> {
  const docRef = await ownersCol().add(data);
  return { id: docRef.id, ...data };
}

export async function getOwnerById(id: string): Promise<Owner | null> {
  const doc = await ownersCol().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Owner;
}

// ---- Listings ----
export const listingsCol = () => db().collection('listings');

export async function createListing(data: Omit<Listing, 'id'>): Promise<Listing> {
  const docRef = await listingsCol().add(data);
  return { id: docRef.id, ...data };
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  const snapshot = await listingsCol().where('slug', '==', slug).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Listing;
}

export async function getListingById(id: string): Promise<Listing | null> {
  const doc = await listingsCol().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Listing;
}

// ---- Calendar Sources ----
export const calendarSourcesCol = () => db().collection('calendarSources');

export async function getCalendarSourcesByListing(listingId: string): Promise<CalendarSource[]> {
  const snapshot = await calendarSourcesCol().where('listingId', '==', listingId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarSource));
}

// ---- Calendar Blocks ----
export const calendarBlocksCol = () => db().collection('calendarBlocks');

export async function getBlocksForDateRange(
  listingId: string,
  checkIn: string,
  checkOut: string
): Promise<CalendarBlock[]> {
  // Find blocks that overlap with the requested date range
  // A block overlaps if: block.startDate < checkOut AND block.endDate > checkIn
  const snapshot = await calendarBlocksCol()
    .where('listingId', '==', listingId)
    .where('startDate', '<', checkOut)
    .get();
  
  // Filter in memory for endDate > checkIn (Firestore doesn't support multiple range queries)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as CalendarBlock))
    .filter(block => block.endDate > checkIn);
}

export async function createCalendarBlock(data: Omit<CalendarBlock, 'id'>): Promise<CalendarBlock> {
  const docRef = await calendarBlocksCol().add(data);
  return { id: docRef.id, ...data };
}

// ---- Inquiries ----
export const inquiriesCol = () => db().collection('inquiries');

export async function createInquiry(
  data: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Inquiry> {
  const now = Timestamp.now();
  const full: Omit<Inquiry, 'id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await inquiriesCol().add(full);
  return { id: docRef.id, ...full };
}

export async function getInquiryById(id: string): Promise<Inquiry | null> {
  const doc = await inquiriesCol().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Inquiry;
}

export async function updateInquiryStatus(
  id: string,
  status: Inquiry['status']
): Promise<void> {
  await inquiriesCol().doc(id).update({
    status,
    updatedAt: Timestamp.now(),
  });
}

// ---- Bookings ----
export const bookingsCol = () => db().collection('bookings');

export async function createBooking(
  data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Booking> {
  const now = Timestamp.now();
  const full: Omit<Booking, 'id'> = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await bookingsCol().add(full);
  return { id: docRef.id, ...full };
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const doc = await bookingsCol().doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Booking;
}

export async function updateBookingStatus(
  id: string,
  status: Booking['status'],
  stripeData?: { stripeSessionId?: string; stripePaymentIntentId?: string }
): Promise<void> {
  await bookingsCol().doc(id).update({
    status,
    ...stripeData,
    updatedAt: Timestamp.now(),
  });
}
