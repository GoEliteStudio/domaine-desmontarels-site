/**
 * Villa Engine - Internationalization Configuration
 * 
 * Centralized language support definitions used by:
 * - Root redirect (src/pages/index.astro)
 * - Dynamic routing (src/pages/villas/[slug]/[lang].astro)
 * - CLI scaffolding (scripts/create-villa.mjs)
 */

/**
 * Supported languages per villa
 * Add new villas here when creating them via CLI
 */
export const VILLA_LANGUAGES: Record<string, string[]> = {
  'domaine-des-montarels': ['en', 'es', 'fr'],
  'casa-de-la-muralla': ['en', 'es']
};

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
  'it': { name: 'Italiano', locale: 'it-IT', dir: 'ltr' },
  'de': { name: 'Deutsch', locale: 'de-DE', dir: 'ltr' },
  'pt': { name: 'Português', locale: 'pt-PT', dir: 'ltr' }
};

/**
 * Hostname-to-slug mapping for production deployments
 * Used by root redirector to detect which villa site is being visited
 */
export const HOSTNAME_SLUG_MAP: Record<string, string> = {
  'www.domaine-desmontarels.com': 'domaine-des-montarels',
  'domaine-desmontarels.com': 'domaine-des-montarels',
  'domaine-desmontarels-site.vercel.app': 'domaine-des-montarels',
  'villa-casa-muralla.vercel.app': 'casa-de-la-muralla',
  // Add new villa hostnames here
};

/**
 * Default villa slug (fallback if hostname not recognized)
 */
export const DEFAULT_VILLA_SLUG = 'casa-de-la-muralla';
