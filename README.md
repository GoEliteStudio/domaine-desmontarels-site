# Villa Engine (Astro Prototype)

World-class, multi-villa static site generator focused on luxury presentation, SEO depth, and AI-friendly structured data.

## Features (Initial Scaffold)
- Astro SSG + component architecture
- JSON villa data (`src/content/villas/*.json`)
- Accessible navigation & tabs
- Inquiry form wired to serverless endpoint (`/api/inquire`) with honeypot + rate limit
- Basic Schema.org JSON-LD (LodgingBusiness/TouristAccommodation + Offers)
- Image placeholders referencing existing WebP assets (optimize via `@astrojs/image` + Sharp)

## Roadmap
1. Multi-language routing (en/fr/es) with dynamic `[lang]/[villa]/` pages.
2. Expand structured data: FAQPage, BreadcrumbList, SpeakableSpecification.
3. Image pipeline: responsive srcset, AVIF generation, alt/caption injection from mapping file.
4. CRM/email integration (Resend API) with environment variable `RESEND_API_KEY`.
5. Sitemap/robots generation.
6. Availability integration (future external API or internal calendar).
7. Additional villa datasets.

## Dev Commands (PowerShell)
```powershell
npm install
npm run dev
npm run build
npm run preview
```

## Environment Variables
Create a `.env` file for secrets (not committed):
```
RESEND_API_KEY=your_key_here
SITE_URL=https://your-production-domain
```
Update `astro.config.mjs` site property after domain is set.

## Adding a Villa
Create `src/content/villas/<slug>.<lang>.json` with fields matching the English example. Ensure first image is LCP hero.

## License
Proprietary – internal use for Villa Engine platform.
