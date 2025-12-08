/**
 * Villa Engine - Internationalization & Villa Registry Configuration
 * 
 * SINGLE SOURCE OF TRUTH for:
 * - Root redirect (src/pages/index.astro)
 * - Dynamic routing (src/pages/villas/[slug]/[lang].astro)
 * - CLI scaffolding (scripts/create-villa.mjs)
 * - Dynamic sitemap.xml generation
 * - Dynamic robots.txt generation
 * - Schema.org structured data
 * 
 * When adding a new villa:
 * 1. Add entry to VILLAS array below
 * 2. Add villa JSON files to src/content/villas/
 * 3. Add images to public/images/villas/{slug}/
 * 4. Everything else (sitemap, robots, routes, schema) updates automatically
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type VillaRegion = 'europe' | 'latam' | 'usa' | 'caribbean' | 'asia' | 'oceania';
export type VillaCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'MXN' | 'COP' | 'BRL' | 'AUD' | 'NZD' | 'THB';

export interface VillaConfig {
  /** URL-friendly identifier (e.g., 'domaine-des-montarels') */
  slug: string;
  /** Supported languages for this villa */
  langs: string[];
  /** Default language for redirects */
  defaultLang: string;
  /** Primary production domain (without protocol) */
  domain: string;
  /** Alternative domains/hostnames that should resolve to this villa */
  altDomains?: string[];
  /** Last content update date (ISO format) for sitemap lastmod */
  updatedAt: string;
  /** Auxiliary pages available for this villa */
  auxPages: string[];
  /** Whether this villa is active (false = excluded from sitemap) */
  active: boolean;
  /** Geographic region (determines default currency) */
  region: VillaRegion;
  /** Currency for pricing and email quotes (EUR for Europe, USD for Americas) */
  currency: VillaCurrency;
  /** Owner email for inquiry notifications (BCC on owner emails) */
  ownerEmail: string;
}

// =============================================================================
// VILLA REGISTRY — Single Source of Truth
// =============================================================================

export const VILLAS: VillaConfig[] = [
  {
    slug: 'domaine-des-montarels',
    langs: ['en', 'es', 'fr'],
    defaultLang: 'en',
    domain: 'www.domaine-desmontarels.com',
    altDomains: [
      'domaine-desmontarels.com'
    ],
    updatedAt: '2025-12-03',
    auxPages: ['contact', 'rates', 'terms', 'privacy', 'about', 'thank-you'],
    active: true,
    region: 'europe',
    currency: 'EUR',
    ownerEmail: 'jc@elitecartagena.com'
  },
  {
    slug: 'casa-de-la-muralla',
    langs: ['en', 'es'],
    defaultLang: 'en',
    domain: 'villa-casa-muralla.vercel.app',
    altDomains: [],
    updatedAt: '2025-12-03',
    auxPages: ['contact', 'rates', 'terms', 'privacy', 'about', 'thank-you'],
    active: true,
    region: 'latam',
    currency: 'USD',
    ownerEmail: 'reservations@casadelamuralla.com'
  },
  {
    slug: 'mount-zurich',
    langs: ['en', 'es'],
    defaultLang: 'en',
    domain: 'mount-zurich.vercel.app',
    altDomains: [],
    updatedAt: '2025-12-05',
    auxPages: ['contact', 'rates', 'terms', 'privacy', 'about', 'thank-you'],
    active: true,
    region: 'usa',
    currency: 'USD',
    ownerEmail: 'reservations@mountzurich.com'
  },
  {
    slug: 'villa-kassandra',
    langs: ['en', 'el', 'ru'],
    defaultLang: 'en',
    domain: 'villa-kassandra.vercel.app',
    altDomains: [],
    updatedAt: '2025-12-06',
    auxPages: ['contact', 'rates', 'terms', 'privacy', 'about', 'thank-you'],
    active: true,
    region: 'europe',
    currency: 'EUR',
    ownerEmail: 'jc@elitecartagena.com'
  },
  {
    slug: 'villa-orama',
    langs: ['en', 'el'],
    defaultLang: 'en',
    domain: 'villa-orama.vercel.app',
    altDomains: [],
    updatedAt: '2025-12-07',
    auxPages: ['contact', 'rates', 'terms', 'privacy', 'about', 'thank-you'],
    active: true,
    region: 'europe',
    currency: 'EUR',
    ownerEmail: 'jc@elitecartagena.com'
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get villa config by slug
 */
export function getVillaBySlug(slug: string): VillaConfig | undefined {
  return VILLAS.find(v => v.slug === slug);
}

/**
 * Get villa config by hostname (checks domain + altDomains)
 */
export function getVillaByHostname(hostname: string): VillaConfig | undefined {
  return VILLAS.find(v => 
    v.domain === hostname || 
    v.altDomains?.includes(hostname)
  );
}

/**
 * Get all active villas
 */
export function getActiveVillas(): VillaConfig[] {
  return VILLAS.filter(v => v.active);
}

/**
 * Get all villa slugs
 */
export function getAllVillaSlugs(): string[] {
  return VILLAS.map(v => v.slug);
}

/**
 * Get languages for a specific villa
 */
export function getVillaLanguages(slug: string): string[] {
  return getVillaBySlug(slug)?.langs || [DEFAULT_LANG];
}

/**
 * Get default language for a specific villa
 */
export function getVillaDefaultLang(slug: string): string {
  return getVillaBySlug(slug)?.defaultLang || DEFAULT_LANG;
}

/**
 * Get currency for a specific villa
 * Europe = EUR, Americas = USD (simplified)
 */
export function getVillaCurrency(slug: string): VillaCurrency {
  return getVillaBySlug(slug)?.currency || 'EUR';
}

/**
 * Get region for a specific villa
 */
export function getVillaRegion(slug: string): VillaRegion {
  return getVillaBySlug(slug)?.region || 'europe';
}

/**
 * Get owner email for a specific villa
 * Used as fallback when Firestore owner lookup fails
 */
export function getVillaOwnerEmail(slug: string): string {
  return getVillaBySlug(slug)?.ownerEmail || 'bookings@lovethisplace.co';
}

/**
 * Villa nightly rates - loaded from villa JSON files
 * Used for quote calculations in inquiry API
 */
const VILLA_NIGHTLY_RATES: Record<string, number> = {
  'domaine-des-montarels': 0,      // Rate on request (no auto-quote)
  'casa-de-la-muralla': 0,          // Rate on request
  'mount-zurich': 875,              // $875 USD per night
  'villa-kassandra': 0,             // Rate on request
  'villa-orama': 0,                 // Rate on request (seasonal pricing)
};

/**
 * Get nightly rate for a specific villa
 * Returns 0 if rate is "on request" (no auto-quote)
 */
export function getVillaNightlyRate(slug: string): number {
  return VILLA_NIGHTLY_RATES[slug] || 0;
}

/**
 * Villa minimum nights requirements
 */
const VILLA_MINIMUM_NIGHTS: Record<string, number> = {
  'domaine-des-montarels': 5,
  'casa-de-la-muralla': 3,
  'mount-zurich': 2,
  'villa-kassandra': 3,
  'villa-orama': 7,                 // 7-night minimum in high season
};

/**
 * Get minimum nights for a specific villa
 * Returns 2 as default if not specified
 */
export function getVillaMinimumNights(slug: string): number {
  return VILLA_MINIMUM_NIGHTS[slug] || 2;
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

/**
 * Supported languages per villa
 * @deprecated Use VILLAS array and getVillaLanguages() instead
 */
export const VILLA_LANGUAGES: Record<string, string[]> = Object.fromEntries(
  VILLAS.map(v => [v.slug, v.langs])
);

/**
 * Default language (fallback)
 */
export const DEFAULT_LANG = 'en';

/**
 * Language metadata (locales, display names, text direction)
 */
export const LANG_META: Record<string, { name: string; locale: string; dir: string }> = {
  'en': { name: 'English', locale: 'en-US', dir: 'ltr' },
  'es': { name: 'Español', locale: 'es-ES', dir: 'ltr' },
  'fr': { name: 'Français', locale: 'fr-FR', dir: 'ltr' },
  'el': { name: 'Ελληνικά', locale: 'el-GR', dir: 'ltr' },
  'ru': { name: 'Русский', locale: 'ru-RU', dir: 'ltr' },
  'it': { name: 'Italiano', locale: 'it-IT', dir: 'ltr' },
  'de': { name: 'Deutsch', locale: 'de-DE', dir: 'ltr' },
  'pt': { name: 'Português', locale: 'pt-PT', dir: 'ltr' }
};

/**
 * Hostname-to-slug mapping for production deployments
 * Used by root redirector to detect which villa site is being visited
 * @deprecated Use getVillaByHostname() instead - this is auto-generated from VILLAS
 */
export const HOSTNAME_SLUG_MAP: Record<string, string> = Object.fromEntries(
  VILLAS.flatMap(v => [
    [v.domain, v.slug],
    ...(v.altDomains?.map(alt => [alt, v.slug]) || [])
  ])
);

/**
 * Default villa slug (fallback if hostname not recognized)
 */
export const DEFAULT_VILLA_SLUG = 'domaine-des-montarels';
