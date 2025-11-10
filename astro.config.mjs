import { defineConfig } from 'astro/config';
export default defineConfig({
  // Production origin for absolute URLs, sitemaps, and structured data
  site: 'https://www.domaine-desmontarels.com',
  // Static export suitable for Vercel/Netlify static hosting
  output: 'static',
  // Directory format for cleaner URLs (/path/)
  build: {
    format: 'directory'
  }
});
