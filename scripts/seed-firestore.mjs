#!/usr/bin/env node
/**
 * Seed script for Firestore - Run this once to add initial owners and listings
 * 
 * Usage: node scripts/seed-firestore.mjs
 * 
 * NOTE: This is for initial setup only. For adding new villas, use:
 *   npm run villa:onboard -- --slug=villa-name --name="Villa Name" --owner-email=owner@example.com
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
// SEED DATA - Each villa has its own owner
// ============================================================

const VILLAS_DATA = [
  {
    owner: {
      name: 'Ian & Katie',
      email: 'jc@elitecartagena.com',
      tier: 'asset-partner',
      stripeAccountId: '',
      currency: 'EUR',
      contractMonths: 12,
      commissionPercent: 10,
    },
    listing: {
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
  },
  {
    owner: {
      name: 'JC Morales',
      email: 'reservations@casadelamuralla.com',
      tier: 'asset-partner',
      stripeAccountId: '',
      currency: 'USD',
      contractMonths: 12,
      commissionPercent: 10,
    },
    listing: {
      slug: 'casa-de-la-muralla',
      type: 'villa',
      name: 'Casa de la Muralla',
      location: {
        country: 'Colombia',
        region: 'Cartagena de Indias',
        city: 'Tierrabomba',
      },
      maxGuests: 8,
      commissionPercent: 10,
      baseCurrency: 'USD',
      status: 'active',
    },
  },
  {
    owner: {
      name: 'Mount Zurich Owner',
      email: 'reservations@mountzurich.com',
      tier: 'asset-partner',
      stripeAccountId: '',
      currency: 'USD',
      contractMonths: 12,
      commissionPercent: 10,
    },
    listing: {
      slug: 'mount-zurich',
      type: 'cabin',
      name: 'Mount Zurich',
      location: {
        country: 'USA',
        region: 'Pennsylvania',
        city: 'Poconos',
      },
      maxGuests: 14,
      commissionPercent: 10,
      baseCurrency: 'USD',
      status: 'active',
    },
  },
  {
    owner: {
      name: 'Villa Kassandra Owner',
      email: 'jc@elitecartagena.com',
      tier: 'asset-partner',
      stripeAccountId: '',
      currency: 'EUR',
      contractMonths: 12,
      commissionPercent: 10,
    },
    listing: {
      slug: 'villa-kassandra',
      type: 'villa',
      name: 'Villa Kassandra',
      location: {
        country: 'Greece',
        region: 'Halkidiki',
        city: 'Kassandra',
      },
      maxGuests: 14,
      commissionPercent: 10,
      baseCurrency: 'EUR',
      status: 'active',
    },
  },
  {
    owner: {
      name: 'Villa ORAMA Owner',
      email: 'jc@elitecartagena.com',
      tier: 'asset-partner',
      stripeAccountId: '',
      currency: 'EUR',
      contractMonths: 12,
      commissionPercent: 10,
    },
    listing: {
      slug: 'villa-orama',
      type: 'villa',
      name: 'Villa ORAMA Corfu',
      location: {
        country: 'Greece',
        region: 'Corfu',
        city: 'Kremithas',
      },
      maxGuests: 8,
      commissionPercent: 10,
      baseCurrency: 'EUR',
      status: 'active',
    },
  },
];

// ============================================================
// SEED LOGIC
// ============================================================

async function seed() {
  console.log('🌱 Seeding Firestore...\n');

  try {
    for (const villa of VILLAS_DATA) {
      // Check if owner already exists by email
      const ownersSnapshot = await db.collection('owners')
        .where('email', '==', villa.owner.email)
        .limit(1)
        .get();

      let ownerId;

      if (!ownersSnapshot.empty) {
        ownerId = ownersSnapshot.docs[0].id;
        console.log(`✓ Owner exists: ${villa.owner.email} (${ownerId})`);
      } else {
        // Create owner with contractStart timestamp
        const ownerRef = await db.collection('owners').add({
          ...villa.owner,
          contractStart: Timestamp.now(),
        });
        ownerId = ownerRef.id;
        console.log(`✓ Created owner: ${villa.owner.email} (${ownerId})`);
      }

      // Check if listing already exists by slug
      const listingSnapshot = await db.collection('listings')
        .where('slug', '==', villa.listing.slug)
        .limit(1)
        .get();

      if (!listingSnapshot.empty) {
        const docId = listingSnapshot.docs[0].id;
        // Update ownerId if it changed
        const existingListing = listingSnapshot.docs[0].data();
        if (existingListing.ownerId !== ownerId) {
          await db.collection('listings').doc(docId).update({ ownerId });
          console.log(`✓ Updated listing ownerId: ${villa.listing.slug} → ${ownerId}`);
        } else {
          console.log(`✓ Listing exists: ${villa.listing.slug} (${docId})`);
        }
      } else {
        const listingRef = await db.collection('listings').add({
          ...villa.listing,
          ownerId,
        });
        console.log(`✓ Created listing: ${villa.listing.slug} (${listingRef.id})`);
      }
    }

    console.log('\n✅ Seed complete!');

  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
