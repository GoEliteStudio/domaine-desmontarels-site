#!/usr/bin/env node
/**
 * Seed script for Firestore - Run this once to add initial owner and listings
 * 
 * Usage: node scripts/seed-firestore.mjs
 * 
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from astro folder (one level up from astro/scripts/)
config({ path: join(__dirname, '../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawPrivateKey) {
  console.error('❌ Missing Firebase environment variables');
  console.log('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
  process.exit(1);
}

// Convert escaped \n to real newlines
const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

// Initialize Firebase Admin
const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });

const db = getFirestore(app);

// ============================================================
// SEED DATA - Customize this for your villas
// ============================================================

const OWNER_DATA = {
  name: 'Ian & Katie',
  email: 'reservations@domaine-desmontarels.com',
  tier: 'asset-partner',
  stripeAccountId: '', // Will be set after Stripe Connect onboarding
  currency: 'EUR',
  contractStart: Timestamp.now(),
  contractMonths: 12,
  commissionPercent: 10,
};

const LISTINGS_DATA = [
  {
    slug: 'domaine-des-montarels',
    type: 'villa',
    name: 'Domaine des Montarels',
    location: {
      country: 'France',
      region: 'Occitanie',
      city: 'Alignan-du-Vent',
    },
    maxGuests: 12,
    commissionPercent: 10,
    baseCurrency: 'EUR',
    status: 'active',
  },
  {
    slug: 'casa-de-la-muralla',
    type: 'villa',
    name: 'Casa de la Muralla',
    location: {
      country: 'Spain',
      region: 'Andalusia',
      city: 'TBD',
    },
    maxGuests: 8,
    commissionPercent: 10,
    baseCurrency: 'EUR',
    status: 'active',
  },
];

// ============================================================
// SEED LOGIC
// ============================================================

async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  try {
    // Check if owner already exists
    const ownersSnapshot = await db.collection('owners')
      .where('email', '==', OWNER_DATA.email)
      .limit(1)
      .get();

    let ownerId;

    if (!ownersSnapshot.empty) {
      ownerId = ownersSnapshot.docs[0].id;
      console.log(`✓ Owner already exists: ${ownerId}`);
    } else {
      // Create owner
      const ownerRef = await db.collection('owners').add(OWNER_DATA);
      ownerId = ownerRef.id;
      console.log(`✓ Created owner: ${ownerId}`);
    }

    // Create/update listings
    for (const listing of LISTINGS_DATA) {
      const existingSnapshot = await db.collection('listings')
        .where('slug', '==', listing.slug)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        const docId = existingSnapshot.docs[0].id;
        console.log(`✓ Listing already exists: ${listing.slug} (${docId})`);
      } else {
        const listingRef = await db.collection('listings').add({
          ...listing,
          ownerId,
        });
        console.log(`✓ Created listing: ${listing.slug} (${listingRef.id})`);
      }
    }

    console.log('\n✅ Seed complete!');
    console.log('\nNext steps:');
    console.log('1. Go to Firebase Console → Firestore to view your data');
    console.log('2. Set up Stripe Connect for the owner');
    console.log('3. Add iCal URLs in calendarSources collection');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
