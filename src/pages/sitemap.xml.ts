/**
 * Dynamic Sitemap Generator
 * 
 * Generates a comprehensive sitemap.xml for all villas, languages, and pages.
 * Includes inline image entries for top images per villa (Option A approach).
 * 
 * This endpoint:
 * - Reads from VILLAS registry (single source of truth)
 * - Filters villas by current hostname (production: one villa per domain)
 * - Generates URLs for main villa pages + all auxiliary pages
 * - Includes <lastmod> from villa updatedAt field
 * - Includes <image:image> entries for hero/gallery images (max 15 per villa)
 * - Uses current hostname for absolute URLs
 * 
 * Behavior:
 * - Production (e.g., www.domaine-desmontarels.com): Shows only that villa
 * - Localhost/dev: Shows all villas for testing
 */

import type { APIRoute } from 'astro';
import { getActiveVillas, getVillaByHostname, type VillaConfig } from '../config/i18n';

// Maximum images to include per villa page (balance between SEO value and file size)
const MAX_IMAGES_PER_VILLA = 15;

// Pages to exclude from sitemap (not meant to be found in search)
const EXCLUDED_AUX_PAGES = ['thank-you'];

// Page priority mapping
const PRIORITY_MAP: Record<string, string> = {
  main: '1.0',
  contact: '0.8',
  rates: '0.7',
  about: '0.6',
  terms: '0.3',
  privacy: '0.3',
  'thank-you': '0.1'
};

// Change frequency mapping
const CHANGEFREQ_MAP: Record<string, string> = {
  main: 'weekly',
  contact: 'monthly',
  rates: 'monthly',
  about: 'monthly',
  terms: 'yearly',
  privacy: 'yearly',
  'thank-you': 'yearly'
};

interface VillaImage {
  src: string;
  alt?: string;
  caption?: string;
}

/**
 * Load villa images from JSON file
 */
async function loadVillaImages(slug: string, lang: string): Promise<VillaImage[]> {
  try {
    // Try to load the language-specific JSON
    const villaModule = await import(`../content/villas/${slug}.${lang}.json`);
    const villa = villaModule.default;
    
    // Get hero priority images first, then regular gallery
    const heroImages: string[] = villa.hero?.priorityImages || [];
    const galleryImages: VillaImage[] = villa.images || [];
    
    // Combine: hero first, then gallery (deduplicated)
    const heroSet = new Set(heroImages);
    const combined: VillaImage[] = [
      ...heroImages.map(src => ({ src, alt: villa.name, caption: '' })),
      ...galleryImages.filter(img => !heroSet.has(img.src))
    ];
    
    return combined.slice(0, MAX_IMAGES_PER_VILLA);
  } catch {
    return [];
  }
}

/**
 * Generate XML for a single URL entry
 */
function generateUrlEntry(
  loc: string,
  lastmod: string,
  changefreq: string,
  priority: string,
  images: VillaImage[] = [],
  baseUrl: string
): string {
  const imageEntries = images
    .map(img => {
      const absoluteUrl = img.src.startsWith('http') ? img.src : `${baseUrl}${img.src}`;
      const caption = img.caption || img.alt || '';
      return `
      <image:image>
        <image:loc>${escapeXml(absoluteUrl)}</image:loc>${caption ? `
        <image:caption>${escapeXml(caption)}</image:caption>` : ''}
      </image:image>`;
    })
    .join('');

  return `
  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageEntries}
  </url>`;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate sitemap for a single villa
 */
async function generateVillaSitemap(
  villa: VillaConfig,
  baseUrl: string
): Promise<string> {
  const entries: string[] = [];
  
  for (const lang of villa.langs) {
    // Main villa page (highest priority, includes images)
    const mainUrl = `${baseUrl}/villas/${villa.slug}/${lang}/`;
    const images = await loadVillaImages(villa.slug, lang);
    
    entries.push(generateUrlEntry(
      mainUrl,
      villa.updatedAt,
      CHANGEFREQ_MAP.main,
      PRIORITY_MAP.main,
      images,
      baseUrl
    ));
    
    // Auxiliary pages (no images) - exclude thank-you pages
    for (const auxPage of villa.auxPages) {
      // Skip excluded pages (e.g., thank-you)
      if (EXCLUDED_AUX_PAGES.includes(auxPage)) continue;
      
      const auxUrl = `${baseUrl}/villas/${villa.slug}/${lang}/${auxPage}/`;
      entries.push(generateUrlEntry(
        auxUrl,
        villa.updatedAt,
        CHANGEFREQ_MAP[auxPage] || 'monthly',
        PRIORITY_MAP[auxPage] || '0.5',
        [], // No images for aux pages
        baseUrl
      ));
    }
  }
  
  // Add language-neutral redirects (lower priority)
  entries.push(generateUrlEntry(
    `${baseUrl}/villas/${villa.slug}/`,
    villa.updatedAt,
    'monthly',
    '0.4',
    [],
    baseUrl
  ));
  
  return entries.join('');
}

export const GET: APIRoute = async ({ request }) => {
  // Determine base URL from request
  const url = new URL(request.url);
  const hostname = url.host;
  const baseUrl = `${url.protocol}//${hostname}`;
  
  // ==========================================================================
  // HOST-BASED FILTERING
  // Production: Each domain only sees its own villa
  // Localhost/dev: Shows all villas for testing
  // ==========================================================================
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  let villas: VillaConfig[];
  if (isLocalhost) {
    // Dev mode: show all villas
    villas = getActiveVillas();
  } else {
    // Production: filter to only the villa matching this hostname
    const matchedVilla = getVillaByHostname(hostname);
    villas = matchedVilla ? [matchedVilla] : getActiveVillas();
  }
  
  // Generate entries for each villa
  const villaEntries: string[] = [];
  for (const villa of villas) {
    const entries = await generateVillaSitemap(villa, baseUrl);
    villaEntries.push(entries);
  }
  
  // Add root redirect page
  const rootEntry = generateUrlEntry(
    `${baseUrl}/`,
    new Date().toISOString().split('T')[0],
    'monthly',
    '0.5',
    [],
    baseUrl
  );
  
  // Build complete sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>${rootEntry}${villaEntries.join('')}
</urlset>`;

  return new Response(sitemap.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};
