# Production & Scaling Plan — Domaine des Montarels

A concise, actionable blueprint to launch this site safely and scale to many villas.

## 1) Launch checklist (prod-ready)
- Config: `astro.config.mjs` has `site: https://www.domaine-desmontarels.com`, `output: 'static'`, `build.format: 'directory'`.
- SEO assets: `robots.txt` and `sitemap.xml` present in `public/`.
- Canonical + JSON-LD: index page injects Organization, WebPage, BreadcrumbList, LodgingBusiness, ImageObject.
- Inquiry route: env‑gated Resend email; returns `{ ok: true, preview: true }` when key missing.
- Build: clean; no CSS minifier warnings.

## 2) Environment variables (Vercel or .env)
- `RESEND_API_KEY` — email provider key
- `OWNER_EMAIL` — reservations inbox (e.g., reservations@domaine-desmontarels.com)
- `FROM_EMAIL` — no-reply sender (verified domain recommended)

Optional
- `SITE_URL` — if you prefer referencing it in utilities

## 3) Vercel setup
- Import repo `GoEliteStudio/domaine-desmontarels-site`.
- Framework preset: Astro; Build: `npm run build`, Output: `dist/`.
- Environment variables: add the three above to Preview + Production.
- Domains: add `www.domaine-desmontarels.com` and apex, enable redirect to preferred.

## 4) Structured data expansion (Phase 2)
- Add JSON-LD modules for:
  - FAQPage from `villa.content.faq`
  - AggregateRating + Review from testimonials + curated Google summaries
  - Organization (already present) + Social sameAs
  - BreadcrumbList (present); add Breadcrumb for policy pages
- Validate with Rich Results Test in Preview and Production.

## 5) Performance targets
- LCP < 2.5s (mobile) — move hero to `<picture>`/`@astrojs/image`, preload largest hero image.
- Total JS < 80KB gzip; defer non-critical scripts; keep gallery modal lazy.
- Use AVIF/WebP and responsive sizes for gallery and hero.

## 6) Accessibility
- Focus trap and restore focus in gallery modal.
- Add skip link; ensure form errors are announced via aria-live.
- Contrast audit on headings and buttons.

## 7) QA sweep
- Browsers: Chrome, Safari, iOS Safari, Android Chrome.
- Lighthouse (mobile): 90+ across the board.
- Validate `robots.txt` and `sitemap.xml` from the deployed domain.

## 8) Replication guide — Villa #2 (EN first)
- Copy `src/content/villas/domaine-des-montarels.en.json` → `src/content/villas/<new-slug>.en.json`.
- Update images under `public/images/` with matching naming; set first hero candidate.
- Duplicate `src/pages/index.astro` to a new route when multi-villa pages are introduced, or evolve to content collections routing.
- Add hreflang and locale files as needed.

## 9) Roadmap (multi-villa)
- Content collections with Zod schema for villas; route `[slug]/index.astro` reading data by slug.
- Locale routing: `/en/<slug>/`, `/fr/<slug>/`, `/es/<slug>/`.
- Global config module for brand/contact/social placeholders.
- CI: `astro check`, lint, Playwright smoke, Lighthouse CI on PRs.

## 10) Runbook (ops)
- Preview failed? Check env vars and Resend status page; route returns `{ ok: true, preview: true }` without key.
- Email bounce? Verify sender domain (SPF/DKIM) for `FROM_EMAIL`.
- Media regressions? Rebuild responsive images; confirm LCP preload tag present.

---
Maintainers: GoEliteStudio.  
Repo: https://github.com/GoEliteStudio/domaine-desmontarels-site
