/**
 * Dynamic robots.txt Generator
 * 
 * Generates robots.txt with correct sitemap URL based on current hostname.
 * Includes explicit allowances for AI crawlers (GPTBot, ClaudeBot, etc.)
 * 
 * This replaces the static public/robots.txt file.
 * 
 * @see src/config/i18n.ts for villa registry
 */

import type { APIRoute } from 'astro';

// Disable prerendering - needs to be dynamic to detect hostname
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  // Determine base URL from request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const robotsTxt = `# Villa Engine - Dynamic robots.txt
# Generated for: ${url.host}
# Note: On localhost, this will reference the local sitemap for dev testing.
# To block a problematic AI bot, change its "Allow: /" to "Disallow: /"

# =============================================================================
# DEFAULT RULES
# =============================================================================
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_astro/

# =============================================================================
# AI CRAWLER ALLOWANCES
# Explicitly allow AI crawlers for AIO (AI Overview) visibility
# All bots are blocked from /api/ and /_astro/ (no SEO value there)
# To block any bot causing issues, change "Allow: /" to "Disallow: /"
# =============================================================================

# OpenAI
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /_astro/

User-agent: ChatGPT-User
Allow: /
Disallow: /api/
Disallow: /_astro/

# Google AI
User-agent: Google-Extended
Allow: /
Disallow: /api/
Disallow: /_astro/

# Anthropic (Claude)
User-agent: ClaudeBot
Allow: /
Disallow: /api/
Disallow: /_astro/

User-agent: anthropic-ai
Allow: /
Disallow: /api/
Disallow: /_astro/

# Perplexity
User-agent: PerplexityBot
Allow: /
Disallow: /api/
Disallow: /_astro/

# Common Crawl (used by many AI systems)
User-agent: CCBot
Allow: /
Disallow: /api/
Disallow: /_astro/

# Microsoft/Bing AI
User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /_astro/

# =============================================================================
# SITEMAP
# =============================================================================
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
};
