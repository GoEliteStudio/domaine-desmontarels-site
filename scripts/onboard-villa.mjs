#!/usr/bin/env node
/**
 * Villa Onboarding CLI - Creates all resources for a new villa
 * 
 * Usage:
 *   npm run villa:onboard -- --slug=villa-paradise --name="Villa Paradise" --owner-email=owner@example.com
 * 
 * Options:
 *   --slug          URL-friendly identifier (required)
 *   --name          Display name (required)
 *   --owner-email   Owner's email address (required)
 *   --owner-name    Owner's name (default: derived from email)
 *   --currency      Currency code: USD, EUR, GBP (default: USD)
 *   --region        Region: europe, latam, usa, caribbean, asia, oceania (default: latam)
 *   --country       Country name (default: "TBD")
 *   --city          City name (default: "TBD")
 *   --max-guests    Maximum guests (default: 8)
 *   --langs         Languages: en,es,fr (default: en,es)
 *   --domain        Production domain (default: villa-{slug}.vercel.app)
 *   --dry-run       Preview changes without writing
 * 
 * This script:
 *   1. Creates owner document in Firestore (if new email)
 *   2. Creates listing document linked to owner
 *   3. Adds villa to i18n.ts VILLAS array
 *   4. Creates content JSON templates for each language
 *   5. Creates image folder structure
 *   6. Runs validation
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
config({ path: join(__dirname, '../.env') });

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      parsed[key] = valueParts.join('=') || true;
    }
  }
  
  return parsed;
}

function validateArgs(args) {
  const errors = [];
  
  if (!args.slug) errors.push('--slug is required');
  if (!args.name) errors.push('--name is required');
  if (!args['owner-email']) errors.push('--owner-email is required');
  
  if (args.slug && !/^[a-z0-9-]+$/.test(args.slug)) {
    errors.push('--slug must be lowercase letters, numbers, and hyphens only');
  }
  
  if (args.currency && !['USD', 'EUR', 'GBP', 'MXN', 'COP', 'AUD', 'NZD', 'JPY', 'THB'].includes(args.currency)) {
    errors.push('--currency must be a valid currency code (USD, EUR, GBP, etc.)');
  }
  
  if (args.region && !['europe', 'latam', 'usa', 'caribbean', 'asia', 'oceania'].includes(args.region)) {
    errors.push('--region must be: europe, latam, usa, caribbean, asia, oceania');
  }
  
  return errors;
}

// =============================================================================
// FIREBASE SETUP
// =============================================================================

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    console.error('❌ Missing Firebase environment variables');
    console.log('Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });

  return getFirestore(app);
}

// =============================================================================
// FIRESTORE OPERATIONS
// =============================================================================

async function createOrGetOwner(db, ownerData, dryRun) {
  const snapshot = await db.collection('owners')
    .where('email', '==', ownerData.email)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const ownerId = snapshot.docs[0].id;
    console.log(`  ✓ Owner exists: ${ownerData.email} (${ownerId})`);
    return ownerId;
  }

  if (dryRun) {
    console.log(`  [DRY RUN] Would create owner: ${ownerData.email}`);
    return 'dry-run-owner-id';
  }

  const ref = await db.collection('owners').add({
    ...ownerData,
    contractStart: Timestamp.now(),
  });
  console.log(`  ✓ Created owner: ${ownerData.email} (${ref.id})`);
  return ref.id;
}

async function createOrGetListing(db, listingData, ownerId, dryRun) {
  const snapshot = await db.collection('listings')
    .where('slug', '==', listingData.slug)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const listingId = snapshot.docs[0].id;
    const existing = snapshot.docs[0].data();
    
    // Check if ownerId needs updating
    if (existing.ownerId !== ownerId && !dryRun) {
      await db.collection('listings').doc(listingId).update({ ownerId });
      console.log(`  ✓ Updated listing ownerId: ${listingData.slug}`);
    } else {
      console.log(`  ✓ Listing exists: ${listingData.slug} (${listingId})`);
    }
    return listingId;
  }

  if (dryRun) {
    console.log(`  [DRY RUN] Would create listing: ${listingData.slug}`);
    return 'dry-run-listing-id';
  }

  const ref = await db.collection('listings').add({
    ...listingData,
    ownerId,
  });
  console.log(`  ✓ Created listing: ${listingData.slug} (${ref.id})`);
  return ref.id;
}

// =============================================================================
// I18N.TS UPDATE
// =============================================================================

function updateI18nConfig(villaConfig, dryRun) {
  const i18nPath = join(__dirname, '../src/config/i18n.ts');
  let content = readFileSync(i18nPath, 'utf-8');
  
  // Check if villa already exists
  if (content.includes(`slug: '${villaConfig.slug}'`)) {
    console.log(`  ✓ Villa already in i18n.ts: ${villaConfig.slug}`);
    return;
  }
  
  // Find the VILLAS array closing bracket and insert before it
  const villaEntry = `  {
    slug: '${villaConfig.slug}',
    langs: [${villaConfig.langs.map(l => `'${l}'`).join(', ')}],
    defaultLang: 'en',
    domain: '${villaConfig.domain}',
    altDomains: [],
    updatedAt: '${new Date().toISOString().split('T')[0]}',
    auxPages: ['contact', 'rates', 'terms', 'privacy', 'about', 'thank-you'],
    active: true,
    region: '${villaConfig.region}',
    currency: '${villaConfig.currency}',
    ownerEmail: '${villaConfig.ownerEmail}'
  },`;
  
  // Find the position to insert (before the closing ]; of VILLAS array)
  const villasMatch = content.match(/export const VILLAS: VillaConfig\[\] = \[[\s\S]*?\n\];/);
  if (!villasMatch) {
    console.error('  ❌ Could not find VILLAS array in i18n.ts');
    return;
  }
  
  const insertPos = content.lastIndexOf('\n];', content.indexOf(villasMatch[0]) + villasMatch[0].length);
  
  if (dryRun) {
    console.log(`  [DRY RUN] Would add to i18n.ts:\n${villaEntry}`);
    return;
  }
  
  const newContent = content.slice(0, insertPos) + '\n' + villaEntry + content.slice(insertPos);
  writeFileSync(i18nPath, newContent, 'utf-8');
  console.log(`  ✓ Added villa to i18n.ts: ${villaConfig.slug}`);
}

// =============================================================================
// CONTENT JSON TEMPLATES
// =============================================================================

function createContentJson(slug, name, langs, dryRun) {
  const contentDir = join(__dirname, '../src/content/villas');
  
  for (const lang of langs) {
    const filePath = join(contentDir, `${slug}.${lang}.json`);
    
    if (existsSync(filePath)) {
      console.log(`  ✓ Content exists: ${slug}.${lang}.json`);
      continue;
    }
    
    const template = {
      slug,
      name,
      tagline: lang === 'es' ? 'Tu escape de lujo' : lang === 'fr' ? 'Votre échappée de luxe' : 'Your luxury escape',
      summary: lang === 'es' 
        ? `Bienvenido a ${name}, un refugio exclusivo.`
        : lang === 'fr'
        ? `Bienvenue à ${name}, un refuge exclusif.`
        : `Welcome to ${name}, an exclusive retreat.`,
      hero: {
        title: name,
        subtitle: lang === 'es' ? 'Donde los sueños se hacen realidad' : lang === 'fr' ? 'Où les rêves deviennent réalité' : 'Where dreams come true'
      },
      images: [
        { src: `/images/villas/${slug}/hero-001.webp`, alt: `${name} exterior`, caption: 'Main view' }
      ],
      specs: {
        bedrooms: 4,
        baths: 4,
        guests: 8,
        poolSize: '10m'
      },
      amenities: ['WiFi', 'Pool', 'Air Conditioning', 'Kitchen', 'Parking'],
      seasons: [
        { id: 'low', label: lang === 'es' ? 'Temporada Baja' : lang === 'fr' ? 'Basse Saison' : 'Low Season', priceDisplay: '$500/night', price: '500', currency: 'USD' },
        { id: 'high', label: lang === 'es' ? 'Temporada Alta' : lang === 'fr' ? 'Haute Saison' : 'High Season', priceDisplay: '$800/night', price: '800', currency: 'USD' }
      ],
      content: {
        overview: lang === 'es'
          ? `${name} ofrece una experiencia única de lujo y confort.`
          : lang === 'fr'
          ? `${name} offre une expérience unique de luxe et de confort.`
          : `${name} offers a unique experience of luxury and comfort.`,
        location: lang === 'es'
          ? 'Ubicación privilegiada con fácil acceso.'
          : lang === 'fr'
          ? 'Emplacement privilégié avec accès facile.'
          : 'Prime location with easy access.',
        faq: [
          {
            category: lang === 'es' ? 'General' : lang === 'fr' ? 'Général' : 'General',
            items: [
              {
                q: lang === 'es' ? '¿Cuál es la hora de check-in?' : lang === 'fr' ? 'Quelle est l\'heure d\'arrivée?' : 'What is the check-in time?',
                a: lang === 'es' ? 'El check-in es a las 3:00 PM.' : lang === 'fr' ? 'L\'arrivée est à 15h00.' : 'Check-in is at 3:00 PM.'
              }
            ]
          }
        ]
      }
    };
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would create: ${slug}.${lang}.json`);
      continue;
    }
    
    writeFileSync(filePath, JSON.stringify(template, null, 2), 'utf-8');
    console.log(`  ✓ Created content: ${slug}.${lang}.json`);
  }
}

// =============================================================================
// IMAGE FOLDER
// =============================================================================

function createImageFolder(slug, dryRun) {
  const imgDir = join(__dirname, '../public/images/villas', slug);
  
  if (existsSync(imgDir)) {
    console.log(`  ✓ Image folder exists: /images/villas/${slug}/`);
    return;
  }
  
  if (dryRun) {
    console.log(`  [DRY RUN] Would create: /images/villas/${slug}/`);
    return;
  }
  
  mkdirSync(imgDir, { recursive: true });
  
  // Create placeholder README
  writeFileSync(
    join(imgDir, 'README.md'),
    `# ${slug} Images\n\nAdd villa images here:\n- hero-001.webp (main hero image)\n- pool-001.webp\n- bedroom-001.webp\n- etc.\n\nRecommended: 1920px wide, WebP format, < 200KB each\n`,
    'utf-8'
  );
  
  console.log(`  ✓ Created image folder: /images/villas/${slug}/`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('\n🏠 Villa Onboarding CLI\n');
  
  const args = parseArgs();
  
  // Show help
  if (args.help || Object.keys(args).length === 0) {
    console.log(`Usage:
  npm run villa:onboard -- --slug=villa-paradise --name="Villa Paradise" --owner-email=owner@example.com

Required:
  --slug          URL-friendly identifier (e.g., villa-paradise)
  --name          Display name (e.g., "Villa Paradise")
  --owner-email   Owner's email address

Optional:
  --owner-name    Owner's name (default: derived from email)
  --currency      USD, EUR, GBP, etc. (default: USD)
  --region        europe, latam, usa, caribbean, asia, oceania (default: latam)
  --country       Country name (default: "TBD")
  --city          City name (default: "TBD")
  --max-guests    Maximum guests (default: 8)
  --langs         Languages: en,es,fr (default: en,es)
  --domain        Production domain (default: villa-{slug}.vercel.app)
  --dry-run       Preview changes without writing
`);
    process.exit(0);
  }
  
  // Validate
  const errors = validateArgs(args);
  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    process.exit(1);
  }
  
  const dryRun = args['dry-run'] === true;
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Build config from args
  const slug = args.slug;
  const name = args.name;
  const ownerEmail = args['owner-email'];
  const ownerName = args['owner-name'] || ownerEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const currency = args.currency || 'USD';
  const region = args.region || 'latam';
  const country = args.country || 'TBD';
  const city = args.city || 'TBD';
  const maxGuests = parseInt(args['max-guests']) || 8;
  const langs = (args.langs || 'en,es').split(',').map(l => l.trim());
  const domain = args.domain || `villa-${slug}.vercel.app`;
  
  console.log(`Villa: ${name} (${slug})`);
  console.log(`Owner: ${ownerName} <${ownerEmail}>`);
  console.log(`Region: ${region}, Currency: ${currency}`);
  console.log(`Languages: ${langs.join(', ')}`);
  console.log('');
  
  // Step 1: Firestore
  console.log('📦 Step 1: Firestore');
  const db = initFirebase();
  
  const ownerData = {
    name: ownerName,
    email: ownerEmail,
    tier: 'asset-partner',
    stripeAccountId: '',
    currency,
    contractMonths: 12,
    commissionPercent: 10,
  };
  
  const listingData = {
    slug,
    type: 'villa',
    name,
    location: { country, region, city },
    maxGuests,
    commissionPercent: 10,
    baseCurrency: currency,
    status: 'active',
  };
  
  const ownerId = await createOrGetOwner(db, ownerData, dryRun);
  await createOrGetListing(db, listingData, ownerId, dryRun);
  
  // Step 2: i18n.ts
  console.log('\n⚙️  Step 2: i18n.ts config');
  updateI18nConfig({ slug, langs, domain, region, currency, ownerEmail }, dryRun);
  
  // Step 3: Content JSON
  console.log('\n📝 Step 3: Content JSON files');
  createContentJson(slug, name, langs, dryRun);
  
  // Step 4: Image folder
  console.log('\n🖼️  Step 4: Image folder');
  createImageFolder(slug, dryRun);
  
  // Done
  console.log('\n' + (dryRun ? '🔍 DRY RUN COMPLETE' : '✅ ONBOARDING COMPLETE'));
  
  if (!dryRun) {
    console.log(`
Next steps:
  1. Add images to: public/images/villas/${slug}/
  2. Edit content in: src/content/villas/${slug}.*.json
  3. Run validation: npm run validate
  4. Test locally: npm run dev
  5. Deploy: git push && vercel --prod
`);
  }
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
