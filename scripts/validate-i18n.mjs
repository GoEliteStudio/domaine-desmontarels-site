// Simple i18n validation script comparing locale JSON files to English baseline.
// Run: node scripts/validate-i18n.mjs
import fs from 'node:fs';
import path from 'node:path';

const baseDir = path.resolve('src/content/villas');
const locales = [
  { code: 'en', file: 'domaine-des-montarels.en.json' },
  { code: 'es', file: 'domaine-des-montarels.es.json' },
  { code: 'fr', file: 'domaine-des-montarels.fr.json' }
];

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { return null; }
}

function get(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => acc && acc[key], obj);
}

// Required fields actually consumed by current page logic
const requiredPaths = [
  'slug',
  'name',
  'summary',
  'hero.title',
  'headlines.overview',
  'headlines.location',
  'content.overview',
  'content.location',
  'amenities',
  'specs.bedrooms',
  'specs.baths',
  'specs.guests',
  'specs.poolSize',
  'seasons.0.priceDisplay'
];

const baseline = readJson(path.join(baseDir, locales[0].file));
if (!baseline) {
  console.error('Baseline English file missing or unreadable.');
  process.exit(1);
}

function analyzeLocale(locale, data) {
  const missing = [];
  for (const rp of requiredPaths) {
    const val = get(data, rp.replace('0', '0')); // trivial; keep index route
    if (val === undefined || val === null || (Array.isArray(val) && !val.length)) missing.push(rp);
  }
  // Image heuristics
  const images = Array.isArray(data.images) ? data.images : [];
  const poolHeroNeeded = [/MONT_Pool_027/iu, /MONT_Pool_Aerial_031/iu];
  const poolCoverage = poolHeroNeeded.map(rx => images.some(i => rx.test(i.src || '')));
  return {
    locale: locale.code,
    file: locale.file,
    completeness: ((requiredPaths.length - missing.length) / requiredPaths.length * 100).toFixed(1) + '%',
    missing,
    imagesTotal: images.length,
    hasPoolKeyImages: poolCoverage.every(Boolean),
    poolKeyImagesPresent: poolCoverage
  };
}

const results = locales.map(l => analyzeLocale(l, readJson(path.join(baseDir, l.file)) || {}));

console.log('\nI18N VALIDATION REPORT');
console.log('=======================' );
for (const r of results) {
  console.log(`\nLocale: ${r.locale}`);
  console.log(`File:   ${r.file}`);
  console.log(`Completeness: ${r.completeness}`);
  console.log(`Missing required paths (${r.missing.length}): ${r.missing.join(', ') || 'None'}`);
  console.log(`Images: ${r.imagesTotal}; Pool hero images present: ${r.hasPoolKeyImages}`);
  if (!r.hasPoolKeyImages) {
    console.log('  -> Missing one or more pool hero images (needed for curated hero ordering).');
  }
  if (r.locale !== 'en') {
    const thin = r.missing.filter(m => m.startsWith('content.')).length > 0;
    if (thin) console.log('  Suggestion: Provide full narrative content (story, practicalDetails, rooms, faq, seoLong) for richer localized SEO.');
  }
}

// Aggregate suggestion
const thinLocales = results.filter(r => r.locale !== 'en' && r.missing.length);
if (thinLocales.length) {
  console.log('\nSUMMARY: Some locales are missing required keys used by the current page. Pages for these languages would fall back or break if implemented now.');
}
console.log('\nDone.');
