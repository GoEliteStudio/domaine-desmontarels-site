# Villa Engine — AI Agent Instructions

## 🎯 CORE MISSION: Speculative Villa Website Factory

**Villa Engine is NOT a portfolio project. It's a revenue engine.**

This is a **speculative building system** designed to mass-produce **world-class luxury villa websites** on spec, then convert owners into paying clients.

**Quality Standard**: Every site must match or exceed the **production Astro site** at `https://lovethisplace-sites.vercel.app/` — NOT the HTML prototype. The live site represents the current quality bar.

### What Villa Engine Actually Does

1. **Identify high-value villas** with weak, outdated, or nonexistent websites (relying mostly on Airbnb/Booking/Instagram)
2. **Extract their content** (photos, descriptions, amenities, location, pricing)
3. **Generate world-class, production-ready sites WITHOUT prior approval**
4. **Deploy each site to its own live URL** (`villa-[slug].vercel.app`)
5. **Reach out to owner with finished product** — they see what they're missing
6. **Collect payment** (one-time fee £1,000-£2,500, retainer £100-£250/mo, or commission)
7. **Scale to 1+ site/day** through automation (scraping, templating, deployment)

**Key Insight**: We don't pitch ideas, we show finished assets. Owners react to what they can see and use.

**Business Model**:
1. Find villa with terrible/no website (Google, Airbnb, Instagram)
2. Build **world-class** luxury site (2-4 hours) using their photos + listing details
3. Deploy to live URL
4. Email owner: "We built you a site. Here's the link. Pay us if you want to keep it."
5. Negotiate payment

**Quality Standard**: Every site must match or exceed the **production Astro site** at:
- **Live URL**: `https://lovethisplace-sites.vercel.app/`
- **Local dev**: `npm run dev` from `astro/` directory (port 4321)
- **Repository**: `GoEliteStudio/domaine-desmontarels-site`
- **Branch**: `main`

**Current Status**: Multi-villa production system with **2 villas** and **full 3-language i18n support** implemented. CLI tooling, validation scripts, and localized auxiliary pages all complete.

**Critical**: `villa-engine-v2.html` is an **outdated prototype**. Always reference the **live Astro production site** for current standards.

---

## 📊 Current System Capabilities

### Villas Configured
```typescript
VILLA_LANGUAGES = {
  'domaine-des-montarels': ['en', 'es', 'fr'],  // 80 images, 108 FAQs
  'casa-de-la-muralla': ['en', 'es']             // 27 images
}
```

### Routing Structure (All Implemented)
```
/                                   → Redirect to /villas/{slug}/{lang}/
/villas/[slug]/                    → Redirect to /villas/{slug}/en/
/villas/[slug]/[lang]/             → Main villa page (Hero, Gallery, Tabs, etc.)
/villas/[slug]/[lang]/contact      → Localized contact form
/villas/[slug]/[lang]/thank-you    → Localized thank-you page
/villas/[slug]/[lang]/rates        → Localized rates page (seasonal pricing)
/villas/[slug]/[lang]/terms        → Localized terms page (auto-generated via template)
/villas/[slug]/[lang]/privacy      → Localized privacy policy page
/villas/[slug]/rates               → Redirect to /villas/{slug}/en/rates
/villas/[slug]/terms               → Redirect to /villas/{slug}/en/terms
/villas/[slug]/privacy             → Redirect to /villas/{slug}/en/privacy
/api/inquire                       → Serverless form handler
```

---

## 🏗️ System Architecture (Production Factory View)

### The Replication Stack
- **Template Source**: Production Astro site (`astro/src/pages/index.astro` + components)
- **Framework**: Astro 4 (`output: 'server'`, hybrid SSR + serverless)
- **Deployment**: Vercel Serverless (Node 20.x runtime)
- **Content Input**: JSON files (`src/content/villas/<slug>.<lang>.json`) + 20-40 images
- **Output**: Fully functional, SEO-optimized villa site ready for Vercel deployment
- **Production Time**: Target 2-4 hours from content collection to live site
- **Dev server**: `npm run dev` from `astro/` directory → http://localhost:4321
- **Language**: TypeScript (core + API) / vanilla JS in inline scripts (no framework bloat)
- **Email**: Brevo SMTP via nodemailer (world-class HTML templates, i18n support)
- **Database**: Firebase Admin + Firestore (inquiries, listings, owners, bookings)
- **Payments**: Stripe Checkout (23h session expiry, webhook confirmation)
- **Images**: Manual curated WebP (plan: Sharp + `@astrojs/image` for responsive sets)
- **CSS**: Component-local `<style>` + root CSS variables (isolation, no cascade conflicts)
- **State/JS**: Inline progressive enhancement (< 10KB total, zero external runtime dependencies)

### Swap-Content-Not-Code Philosophy
Every new villa is **data only** — zero code changes required:
- **Hero slideshow** (`Hero.astro`) → swap image array from JSON, 5s rotation
- **Gallery grid** (`GalleryGrid.astro`) → auto-generated from `images[]` with full-screen modal
- **Specs & amenities** → rendered from JSON data structure
- **Content tabs** (`Tabs.astro`) → ARIA-compliant, dynamically populated from `content.*`
- **Inquiry form** (`InquiryForm.astro`) → honeypot + timing gate, routes to `OWNER_EMAIL`
- **Search modal** → elegant trigger/modal for FAQs + amenities
- **SEO & JSON-LD** → 8 schemas auto-generated (Organization, LodgingBusiness, Offer, ImageObject, FAQPage, Review, WebPage, BreadcrumbList)
- **Multi-language** → same component structure, different `<lang>.json` files

**Quality Standards (Non-Negotiable)**:
- **Design**: Match **production Astro site** aesthetic (Cormorant Garamond + Inter, bronze/taupe accent, frosted header, elegant search modal)
- **Functionality**: Hero rotation (5s), gallery modal, ARIA tabs, sticky booking panel (420px), search modal, honeypot protection
- **Performance**: LCP < 2.5s mobile, Lighthouse > 90 all categories
- **SEO**: 8 JSON-LD schemas (Organization, WebSite, WebPage, BreadcrumbList, LodgingBusiness, Offer, Service, FAQPage, Review, ImageObject)
- **Accessibility**: WCAG AA compliance, skip links, focus management, semantic HTML, ARIA attributes
- **Layout**: Sticky header (80px), 100vh hero, optional sticky panel (desktop), responsive grid

**Critical**: Owner sees raw Airbnb listing → System outputs world-class site that makes their current presence look amateur

### Build System & Output
- **Framework**: Astro 4 with `output: 'server'` (hybrid mode) + `@astrojs/vercel/serverless`
- **Static pages**: All villa content pre-rendered
- **Serverless API**: Single `/api/inquire.ts` route for form submissions
- **Deployment**: Vercel with Node 20.x runtime

### Strategic Differentiation (vs Generic Templates)

**This is NOT a WordPress theme or generic template.** Every site must surpass commodity luxury villa templates on these dimensions:

| Dimension | Typical Template (WordPress/ThemeForest) | Villa Engine Standard |
|-----------|------------------------------------------|------------------------|
| **Performance** | Heavy plugin stack, multiple blocking scripts | Minimal JS (< 10KB), controlled preload, modular CSS, fast first paint |
| **Structured Data** | Generic Organization only or missing | Rich interconnected graph: Organization, WebSite, WebPage, BreadcrumbList, LodgingBusiness, Services, OfferCatalog, FAQPage, ImageObject (18 cap), Review |
| **Content Authoring** | WYSIWYG inconsistency | Strict JSON model, deterministic UI & SEO node mapping |
| **Extensibility** | Plugin dependencies & update drift | Additive component approach, clear isolation |
| **Security** | Large attack surface (plugins/forms) | Narrow serverless API, honeypot + timing gate defense |
| **Accessibility** | ARIA gaps, untested | Intentional roles (tablist/tabpanels), focus states, keyboard gallery |
| **i18n** | Ad hoc plugin with mixed coverage | File-driven locale content, strict validation |
| **Brand Aesthetic** | Generic layout patterns | Bespoke hero, trust bar, testimonials, curated gallery |
| **AI Readiness** | Limited entity footprint | Explicit cross-linked `@id`s enabling entity consistency |

**Result**: Lean, narrative-rich, future-ready platform vs generic system with upgrade churn.

**Owner Perception**: "This is better than anything I could afford" — indistinguishable from £10,000+ custom builds.

---

## 🔄 The Speculative Building Workflow (1 Site/Day)

### Phase 1: Target Identification (15 mins)
1. **Find villas with terrible/no websites**:
   - Google: "luxury villa [region]" → click results → check if site sucks or doesn't exist
   - Airbnb/Booking.com: Find high-end villas (£1,000+/night) relying only on platforms
   - Instagram: Luxury villa accounts with no website in bio
   - Criteria: Beautiful property + no decent web presence = perfect target

2. **Scrape content**:
   - Download 20-40 images from Airbnb/Instagram/Google Images
   - Copy listing description (bedrooms, amenities, location)
   - Find owner email (Airbnb contact, WHOIS lookup, Instagram DM for "inquiries")

### Phase 2: Build Site (2 hours)
1. **Content extraction**:
   ```powershell
   # Create villa folder
   mkdir public/images/villa-[name]
   # Download images (manual or script)
   # Extract specs from listing
   ```

2. **JSON creation**:
   ```powershell
   cp src/content/villas/domaine-des-montarels.en.json src/content/villas/villa-[name].en.json
   ```
   - Fill `slug`, `name`, `summary` from scraped listing
   - Add image paths (rename downloaded files to `VILLA_001.webp`, etc.)
   - Extract `specs` (bedrooms, baths, guests) from Airbnb
   - Copy `amenities` list from platform
   - Pricing: Use their Airbnb rates or estimate

3. **Deploy**:
   ```powershell
   npm run build
   vercel --prod  # Deploy to villa-[name].vercel.app
   ```

### Phase 3: Cold Outreach (10 mins)
**Email template** (send from professional domain):

```
Subject: I Built You a Free Website (See It Now)

Hi [Owner Name],

I came across [Villa Name] on [Airbnb/Instagram] and noticed you don't have a proper website.

So I built one for you: https://villa-[name].vercel.app

Features:
✓ Luxury design that beats Airbnb/Booking.com presentation
✓ SEO-optimized (so guests can find you on Google)
✓ Direct booking form (no platform commissions)
✓ Mobile-responsive, fast-loading

I did this on spec to show you what's possible.

If you want to keep it and use it, we can discuss:
• One-time fee: £1,500 (includes domain setup + 1 year hosting)
• Monthly: £100/month (hosting + maintenance)
• Commission: 5% per direct booking through the site

If you don't want it, no worries—but the site exists now, and you can see what you're missing.

Let me know if you'd like to discuss.

Best,
[Your Name]
Go Elite Studio
```

**No follow-ups needed** — they either want it or they don't. Move to next target.

---

## 💰 Revenue Model (Speculative Building)

### Pricing Strategy (After They See the Site)
**Initial ask**: £1,500 one-time + domain setup

**Negotiation path**:
- If they hesitate: "£100/month, cancel anytime"
- If they love it: "£2,500 + we'll add booking integration"
- If they're cheap: "5% commission on direct bookings, no upfront cost"

**Key**: The site already exists. They're not paying for future work—they're paying to **keep using** what you already built.

### Target Response Rates (Realistic)
- 10 sites built/month = 10 cold emails
- 30% open the link (3 owners)
- 15% reply (1-2 owners)
- 50% of replies convert (1 sale every 2 months initially)

**But**: As you build momentum, owners talk. Referrals kick in. By month 6, conversion doubles.

### Backup Revenue (If They Don't Buy)
- Keep site live on `villa-[name].vercel.app`
- SEO will rank it above their non-existent site
- They'll Google their own villa name → see YOUR site first
- Now they HAVE to contact you (or look incompetent to guests)

---

## 🎯 Critical Success Factors (What Makes or Breaks This)

### 1. Speed of Production
- **Current**: 2-4 hours per site (manual JSON editing)
- **Goal**: < 1 hour via automation
- **Blockers**: Image processing, content templating
- **Solution**: Build CLI tool or admin UI for rapid data entry

### 2. World-Class Visual Quality (Critical)
- **Every site must be indistinguishable from a £10,000+ custom build**
- Owner's reaction should be: "Holy shit, this is better than anything I could afford"
- **Design standards** (all required):
  - Typography: Cormorant Garamond (headings) + Inter (body)
  - Color system: Sophisticated neutrals + bronze/taupe accent (`#a58e76`)
  - Spacing: Generous whitespace, luxury breathing room
  - Hero: Full-viewport rotating slideshow with subtle overlay
  - Gallery: Masonry grid + full-screen modal with captions
  - Animations: Subtle, sophisticated (fade-ins, smooth transitions)
- **Reference site** (quality bar):
  - **Production Astro**: `https://lovethisplace-sites.vercel.app/`
  - **Local dev**: `cd astro; npm run dev` → http://localhost:4321
  - **Never ship anything that looks worse than the live production site**
  - **Note**: `villa-engine-v2.html` is an outdated HTML prototype — ignore it
- **Image quality**:
  - Minimum 1920px hero images (sharp, professionally cropped)
  - Optimize for < 200KB per image (WebP, AVIF target)
  - Pool/exterior priority for hero rotation
- **Mobile-first**: Design must look premium on iPhone first, desktop second

### Owner Email Routing & Anti-Spam Engineering

**Email Routing**:
- Each villa needs unique `OWNER_EMAIL` env var
- Inquiry form must deliver to correct owner
- `FROM_EMAIL` must be verified domain (SPF/DKIM)
- **Critical**: Test email delivery before sending demo link

**Anti-Spam & Reliability Mechanisms** (all required):

| Mechanism | Purpose | Behavior |
|-----------|---------|----------|
| **Honeypots** (3 fields: `company`, `website`, `hpt`) | Trap naive bots | If any filled → return `{ ok: true }` silently (no email sent) |
| **Timing Gate** (≥3000ms dwell) | Human interaction heuristic | Submission < 3s → silent failure (no email) |
| **Email Preview Mode** | Missing API key resilience | Logs send attempt, returns `{ ok: true, preview: true }` instead of throwing |
| **Async Client Receipt** | Non-blocking confirmation | Owner email success not impeded by client email failure |
| **Error Isolation** | Avoid spilling stack to client | Return JSON `{ ok: false, error: 'message' }` with 500 code |
| **Flexible Parsing** | Body format tolerance | Accept JSON or form-encoded (`application/x-www-form-urlencoded`) |
| **Alternate Keys** | Field name variations | Tolerate `name` vs `fullName`, `checkInDate` variants |
| **Language Detection** | Localized routing | Accept-Language header or `?lang=` param for subject tagging |
| **HTML/JSON Branching** | Client type handling | HTML Accept → 303 redirect to `/thank-you`; JSON → structured response |

**Goal**: Higher lead quality, fewer spam distractions, silent bot handling protects sender reputation.

**Implementation**: See `astro/src/pages/api/inquire.ts` for complete reference.

### 4. World-Class SEO & Structured Data
Every site must have **enterprise-level SEO** out of the box:

**JSON-LD Modules (All Required)** — Strategic Schema Graph:

**Core Entities** (stable `@id` cross-linking):
1. **Organization** (`#organization`)
   - Brand entity with logo, `sameAs` (social profiles)
   - Cross-linked as `publisher` in WebSite, `brand` in LodgingBusiness
   
2. **WebSite** (`#website`)
   - `potentialAction`: SearchAction with `query-input` spec (justified by real on-site search modal)
   - `publisher` → `@id` reference to Organization
   
3. **WebPage** (`#webpage`)
   - Page-level metadata
   - `primaryImageOfPage` → first ImageObject (hero)
   - `inLanguage` locale code
   
4. **BreadcrumbList** (`#breadcrumbs`)
   - Navigation hierarchy (Home > Villa Name)
   - Position indexing for sequential navigation
   
5. **LodgingBusiness** (combined with LocalBusiness) — **TWO nodes**:
   - **Global brand entity** (`#lodging`) — high-level with `brand` → Organization
   - **Page-specific entity** (`#lodging-business`) — detailed amenities, reviews, offers
   - Both with `geo` (GeoCoordinates), `address` (PostalAddress), `telephone`, `email`
   
6. **Services** (`#service-private-chef`, `#service-vineyard`, `#service-transfers`, `#service-housekeeping`)
   - Explicit concierge capabilities (few competitors model services)
   - Each with `provider` → `@id` reference to LodgingBusiness
   - `areaServed` for geographic scope
   
7. **OfferCatalog** (`#offer-catalog`)
   - Bundles Service nodes into bookable offers
   - `itemListElement` → Offer nodes with `itemOffered` → Service `@id`
   - `priceSpecification` with `priceCurrency` (no fake prices, "rate on request")
   
8. **FAQPage** (`#faq`) — conditional
   - Only if `villa.content.faq` exists
   - `mainEntity` → Question/Answer pairs
   
9. **Review** nodes (text-only, no fabricated ratings)
   - From `villa.content.testimonials` + Google Reviews
   - `author` → Person, `reviewBody` text, `reviewRating` (if genuine)
   - **No** synthetic `AggregateRating` unless verified
   
10. **ImageObject** array (capped at 18, deduped)
    - `representativeOfPage: true` for hero first image
    - `contentUrl` + `url` (absolute)
    - `caption` (alt text), `description` (caption field)
    - Prioritized order: hero images → pool → aerial → remaining gallery

**Design Principles**:
- **Stable `@id`s** for cross-entity linking & future multi-page referential integrity
- **Minimal speculation**: avoid invented ratings or prices not yet validated
- **Order matters**: high-level brand first → navigational → page → lodging → details → catalog → services → images
- **Avoid duplication** that triggers Rich Results conflicts

**AI/Search Impact**: Greater entity clarity improves AI overviews (Google SGE, Bing Copilot) by exposing brand relationships, service offerings, experience catalog without scraping brittle markup.

**Meta Tags (Complete)**:
- Title: "[Villa Name] — Luxury Villa Rental in [Location]"
- Description: Compelling 155-char summary with USP
- Open Graph (og:title, og:description, og:image, og:url, og:type)
- Twitter Card (summary_large_image)
- Canonical URL
- Hreflang (if multi-language)

**Technical SEO**:
- `robots.txt` with sitemap reference
- `sitemap.xml` with lastmod timestamps
- Semantic HTML5 (header, nav, main, article, footer)
- Image alt text (descriptive, keyword-rich)
- Preload LCP hero image
- Mobile-friendly (passes Google Mobile-Friendly Test)

**Goal**: Owner Googles their villa name → YOUR site ranks #1 within 7 days (beats their Airbnb listing)

### 5. Mobile-First Performance (Non-Negotiable)
Owners demo sites on iPhone to guests — **mobile performance is the first impression**.

**Performance Budgets** (Must Pass):
- **LCP** < 2.5s on 4G mobile
- **CLS** < 0.1 (no layout shifts)
- **TBT** < 300ms (interactive quickly)
- **FCP** < 1.8s (perceived speed)
- **Lighthouse Mobile** > 90 (all categories)

**Optimization Checklist**:
- Hero images preloaded (`<link rel="preload" as="image">`)
- Images optimized (WebP/AVIF, responsive srcset)
- Fonts preconnected (Google Fonts)
- Font Awesome deferred (not render-blocking)
- CSS minified, critical CSS inlined
- JavaScript minimal (< 80KB total)
- No render-blocking resources

**Current Implementation vs Planned Enhancements**:

| Area | Current Approach | Planned Enhancement |
|------|------------------|---------------------|
| **Hero LCP** | Preload hero image; limited slides (3 curated) | Responsive `<picture>` + AVIF + width-specific sources |
| **JavaScript** | Inline modules; no frameworks (< 10KB total) | Tree-shake potential libs; web vitals instrumentation |
| **Images** | WebP originals curated; alt/caption mapping | Automated Sharp pipeline + lazy thresholds + blur placeholders |
| **CSS** | Scoped per component + root variables | Potential global stylesheet extraction + critical CSS inlining |
| **Fonts** | Cormorant Garamond + Inter (display swap via Google) | Self-host + subset (latin-ext) to reduce layout shift |
| **Search** | Client filter only | Debounced highlight + semantic tag indexing (multi-villa) |
| **Structured Data** | Hand-coded | Generator function fed by schema (prevent omissions/duplication) |

**Edge Cases Handled**:
- Empty FAQ or amenities → gracefully remove FAQPage JSON-LD & search dataset components
- Missing hero images → fallback to safe ordering (pool/aerial/MONT_001 sequence)
- Email failure path → does not block response (owner email priority; guest receipt best-effort)
- Honeypot/timing failures → silent success response (no error spam)

**Current Blocker**: Unoptimized images (need Sharp pipeline for auto-conversion and responsive sizes)

---

## 🛠️ Development Workflows

### Adding a New Villa (Current Manual Process)
1. Copy `src/content/villas/domaine-des-montarels.en.json` to `<new-slug>.en.json`
2. Add images to `public/images/<slug>/...` (hero should be 1920px+ wide)
3. Update all JSON fields (ensure first image is LCP candidate)
4. Update `OWNER_EMAIL` in Vercel env vars
5. Deploy to Vercel
6. Send live URL to owner

### Dev Commands (PowerShell)
```powershell
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:4321)
npm run build                  # Build production artifacts to dist/
npm run preview                # Preview built site locally

# Villa Management CLI
npm run villa:onboard -- --slug=villa-name --name="Villa Display Name" --owner-email=owner@email.com [--langs=en,es,fr] [--region=europe|latam|asia] [--currency=EUR|USD|GBP]
npm run villa:seed             # Seed/refresh Firestore owner & listing data
npm run validate               # Validate i18n content completeness
```

### Environment Variables (Required)
```env
# Brevo SMTP
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<brevo-user>
BREVO_SMTP_PASS=<brevo-key>

# Email Routing
FROM_EMAIL=bookings@lovethisplace.co
FROM_NAME=LoveThisPlace
GOELITE_INBOX=your-internal@email.com
OWNER_FALLBACK_EMAIL=your-internal@email.com

# Firebase
FIREBASE_PROJECT_ID=go-elite-studio
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY="<private-key>"

# Stripe
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Security
OWNER_ACTION_SECRET=<random-long-string>
```

**Without Brevo credentials**: Emails fail silently, forms still work

---

## 📊 Data Model (Content-First Architecture)

Villa data lives in **JSON files** at `src/content/villas/<slug>.<lang>.json`:

### Required Fields (Minimum Viable Villa)
```json
{
  "slug": "villa-serenity",
  "name": "Villa Serenity",
  "summary": "Secluded Mediterranean retreat with private pool and concierge",
  "hero": {
    "title": "Your Headline Here",
    "subtitle": "Supporting copy"
  },
  "images": [
    { "src": "/images/villa-serenity/001.webp", "alt": "Pool view", "caption": "Heated infinity pool" }
  ],
  "specs": {
    "bedrooms": 6,
    "baths": 7.5,
    "guests": 12,
    "poolSize": "25m"
  },
  "amenities": ["WiFi", "Pool", "Chef", "Cinema"],
  "seasons": [
    { "id": "peak", "label": "Peak Season", "priceDisplay": "$18,000/night", "price": "18000", "currency": "USD" }
  ]
}
```

### Optional Fields (Enhanced Conversion)
- `content.overview` — Long-form description
- `content.location` — Area highlights
- `content.hosts` — Owner bios (trust building)
- `content.testimonials[]` — Guest reviews
- `content.faq[]` — Common questions

**Schema**: See `PROJECT_ANALYSIS.md` section 4 for complete structure

### Internationalization Requirements

**Current State** (Updated November 2025):

| Villa | EN | ES | FR | Images |
|-------|----|----|----| -------|
| **Domaine des Montarels** | ✅ Full (108 FAQs) | ✅ Full translation | ✅ Full translation | 80 images |
| **Casa de la Muralla** | ✅ Full | ✅ Full translation | ❌ N/A | 27 images |

**Validation Tool**: `node scripts/validate-i18n.mjs`
- Scans localized JSON files ensuring required paths present
- Quantifies hero image adequacy (pool imagery presence)
- Outputs completeness percentages + improvement suggestions

**i18n Features Status**:
1. ✅ Content Collections validation via `validate-i18n.mjs`
2. ✅ Hreflang injection per page (`BaseLayout.astro` accepts `hreflangs[]` prop)
3. ⚠️ Language switcher component (planned)
4. ✅ Fallback chain: English fallback if locale missing
5. ✅ Localized email templates (`[EN]`/`[ES]`/`[FR]` subject tags)
6. ✅ Per-locale JSON-LD `inLanguage` property
7. ✅ Full UI string translations in `uiStrings.ts` (456 lines)

**Goal**: Unlock new geographic markets (Spain, France, Italy, Greece) with minimal engineering lift once content ready

---

## 🧩 Component Architecture (What You Can Reuse)

Located in `src/components/*.astro`:

| Component | Purpose | Swap-Content Strategy |
|-----------|---------|----------------------|
| `Hero.astro` | Rotating slideshow | Pass `images[]` prop, 5s auto-rotate, gradient overlay |
| `TrustBar.astro` | Reassurance badges | Static trust items (reuse across villas) |
| `GalleryGrid.astro` | Photo grid + modal | Auto-generated from `images[]`, full-screen modal |
| `Tabs.astro` | Content sections | ARIA-compliant tabs from `tabs[]` array (Overview, Amenities, Location, FAQ, etc.) |
| `FaqAccordion.astro` | Collapsible FAQ groups | Category-based accordion with show/hide toggle (NEW) |
| `FixedFactsPanel.astro` | Sticky booking panel | Renders `specs[]` + `price` + inquiry form slot, 420px width desktop |
| `InquiryForm.astro` | Lead capture | Honeypot + 3s timing gate, posts to `/api/inquire` |
| `Footer.astro` | Footer navigation | Localized links from `uiStrings.ts` |
| `CookieConsent.astro` | GDPR banner | Static (reuse) |
| `BaseLayout.astro` | Global shell | SEO meta tags, JSON-LD injection, header, footer, sticky panel logic, `navCtaHref` prop for header CTA link |

**Key Insight**: All components accept props from villa JSON — **zero code changes** per villa. See `astro/src/pages/index.astro` for complete implementation.

### Component Deep-Dive: UX Patterns & Performance

**Patterns purposely avoid heavy state libraries**: each enhancement is a contained script guarding DOM existence (defensive instantiation) to prevent hydration mismatch or runtime errors.

| Component | Notable Features | Perf/Accessibility |
|-----------|------------------|--------------------|
| **Hero.astro** | Weighted slideshow ordering; overlay gradients (radial + linear); scroll cue | Minimal JS interval only if >1 slide; alt text for each view; text-shadow for readability |
| **TrustBar.astro** | Credibility surface with badge icons & micro-copy | Lightweight static markup; icons via FA loaded after initial paint |
| **GalleryGrid.astro** | Metadata mapping, responsive modal, keyboard & click navigation | Reduced layout thrash via width normalization; ESC/arrows support; alt + figcaption semantics |
| **Tabs.astro** | Hash-based activation, column layout for amenity list, progressive fade | ARIA roles (tablist, tabpanel), keyboard accessible buttons with `aria-selected` updates |
| **FixedFactsPanel.astro** | Spec grid, dynamic inquiry toggle, optional calendar scaffold | `position: sticky` (desktop) → linear stacking (mobile); accessible toggle with `aria-expanded` |
| **InquiryForm.astro** | Honeypots, dwell timestamp, semantic labels, client fallback to 303 | No client JS dependencies; native validation; accessible labels & placeholder interplay |
| **Footer.astro** | Secondary navigation & contact, social links | Responsive grid layout; high contrast; reduces scroll friction |
| **CookieConsent.astro** | LocalStorage + cookie fallback; Manage path placeholder | Non-blocking, accessible dialog semantics; no third-party scripts gated yet |
| **Search Modal** | `searchItems` precompute + JSON bridge + fallback seed list, keyboard shortcut (Ctrl/Cmd+K) | Detached from hero clutter; ARIA live count; minimal filtering algorithm |

**Hero Image Ordering Logic** (deterministic, removes manual curation):
1. Force first slide: Pool 27 (`MONT_Pool_027.webp`) if available
2. Second slide: Aerial 031 (`MONT_Pool_Aerial_031.webp`) if available
3. Third slide: MONT_001 (`MONT_001.webp`) if available
4. Fallbacks: other pool images → non-pool images
5. **Exclude**: Ping pong table (`MONT_024.webp`) for prestige hero sequence
6. Pool detection: `/pool/i` test on src, alt, or caption

**Search Modal** (moved to end of page for calmer layout):
- Server-side precomputed `searchItems` passed via JSON `<script type="application/json">`
- Fallback seed list in `<ul id="search-seed" hidden>` ensures resilience if JSON parse fails
- Keyboard shortcuts: `Ctrl/Cmd + K` opens modal
- Fuzzy filter: split query into terms, match all terms against `searchText` field
- Result count live region: `<span aria-live="polite">`
- Types: `faq` (question icon) vs `amenity` (star icon)

### Policy Page Template System

**Terms, Privacy, Rates pages** use a default template system for automatic villa name injection:

**Architecture** (`terms.astro` as example):
```typescript
// Default template with placeholders
const defaultTerms = {
  en: {
    title: 'Terms & Conditions',
    sections: [
      { title: 'Reservations', content: 'All bookings at {villaName} require...' },
      // ... 8 sections total
    ]
  },
  es: { /* Spanish translations */ },
  fr: { /* French translations */ }
};

// Villa-specific overrides (optional)
const villaOverrides: Record<string, VillaTerms> = {
  'casa-de-la-muralla': { /* custom terms if needed */ }
};

// Process template - replaces {villaName} and {villaEmail}
function processTerms(terms: VillaTerms, villaName: string, villaEmail: string): VillaTerms {
  // Deep clone and replace placeholders
}
```

**Benefits**:
- New villas automatically get proper terms with their name
- No manual editing required per villa
- Override system for villas needing custom legal terms
- Full i18n support (EN/ES/FR)

### Header CTA Navigation Pattern

**`BaseLayout.astro`** accepts `navCtaHref` prop to control header Inquire button behavior:

```typescript
// Props interface
interface Props {
  navCtaHref?: string;  // If provided, header CTA is <a href>, else <button data-inquire>
}

// In header:
{navCtaHref ? (
  <a href={navCtaHref} class="nav-cta">{ui.header.inquire}</a>
) : (
  <button class="nav-cta" data-inquire>{ui.header.inquire}</button>
)}
```

**Usage in page templates**:
```typescript
// All pages pass navCtaHref to link directly to contact page
<BaseLayout navCtaHref={`/villas/${slug}/${lang}/contact`} ... />
```

### Footer Link Mapping Pattern (Policy Pages)

**Problem**: Footer Explore links (`#overview`, `#amenities`, etc.) don't work on policy pages.

**Solution**: Map anchor links to include full villa page path:

```typescript
// In rates.astro, terms.astro, privacy.astro, contact.astro, thank-you.astro
const villaFooter = {
  exploreLinks: ui.footer.exploreLinks.map((link) => {
    if (link.href.startsWith('#')) {
      return { ...link, href: `${langBasePath}/${link.href}` };
    }
    return link;
  }),
  infoLinks: ui.footer.infoLinks.map((link) => {
    if (link.href.startsWith('/')) {
      return { ...link, href: `${langBasePath}${link.href}` };
    }
    return link;
  }),
  contactLinks: ui.footer.contactLinks,
};
```

**Result**: Footer links work from any page, navigating to main villa page sections.

---

## 🚀 Automation Roadmap (How to Hit 30 Sites/Month)

### Phase 1: CLI Tool (Priority 1)
```powershell
npm run villa:create -- --slug=villa-paradise --name="Villa Paradise" --owner-email=owner@example.com
```
- Auto-generates JSON template
- Creates image directory
- Updates Vercel config
- Outputs checklist for content collection

### Phase 2: Image Processing Pipeline
- Accept raw JPG/PNG uploads
- Auto-convert to WebP/AVIF
- Generate responsive sizes `[480, 768, 1024, 1440, 1920]`
- Optimize for < 200KB per image
- Auto-detect pool/hero candidates

### Phase 3: Admin UI (Webflow-style)
- Drag-drop image uploads
- WYSIWYG content editor
- Live preview
- One-click deploy to Vercel
- **Goal**: Non-technical VA can produce sites

### Phase 4: AI Content Generation
- GPT-4 writes villa descriptions from specs
- Auto-generates FAQs from amenities
- SEO meta tags from location + features
- **Input**: 5 fields → **Output**: Complete JSON

---

## 🎨 Design System (Luxury Brand Standards)

### Typography (Mandatory)
- **Headings**: Cormorant Garamond (300/400/500/600/700 weights)
  - Hero title: `clamp(2.4rem, 5.2vw, 4.4rem)`, weight 400, letter-spacing 1.5px
  - Section titles: 2.8rem desktop, 2.2rem mobile, underline accent bar (60px × 2px)
- **Body**: Inter (300/400/500/600 weights)
  - Base: 1rem, line-height 1.7, weight 300
  - Nav/labels: 0.85rem, uppercase, letter-spacing 1.5px
- **CSS Variables** (from production):
  - `--color-accent`: `#a58e76` (bronze/taupe)
  - `--color-white`: `#ffffff`
  - `--color-off-white`: `#fafafa`
  - `--color-black`: `#0a0a0a`
  - `--color-dark-gray`: `#1a1a1a`
  - `--color-gray-light`: `#f0f0f0`
  - `--color-gold`: `#c9a96e`
  - `--panel-width`: `420px`

### Visual Hierarchy (Page Structure)
1. **Sticky header** — 80px height, frosted glass (`backdrop-filter: blur(10px)`), logo + nav + CTA
2. **Hero slideshow** — 100vh, rotating images (5s), radial + linear gradient overlay
3. **Trust bar** — 4 badges (Flexible Cancellation, Secure Contract, Concierge, Transparent Pricing)
4. **Experience section** — Grid layout: content (2fr) + sticky panel (1fr, 420px)
5. **Gallery grid** — Auto-generated from all villa images, full-screen modal with captions
6. **Tabbed content** — ARIA tabs with hashchange sync (Overview, Amenities, Location, FAQ, etc.)
7. **Hosts section** — 2-column grid (1.15fr image + 1.85fr card), gradient card background
8. **Testimonials** — Grid of review cards with decorative quotes, hover lift effect
9. **Search modal** — Elegant trigger button → full-screen modal with fuzzy search
10. **Sticky booking panel** — Right sidebar (desktop), specs + price + inquiry form
11. **Footer** — Standard navigation + contact, dark background
12. **Floating WhatsApp** — Bottom-right concierge button (60px circle)

### Image Standards (Quality Control)
- **Hero**: Minimum 1920×1080px, pool/exterior/aerial priority, sharp focus
- **Gallery**: 20-40 images minimum, mix of:
  - Pool (must-have, multiple angles)
  - Exterior/architecture (3-5 images)
  - Bedrooms (all bedrooms shown)
  - Living areas (salon, dining, kitchen)
  - Views/landscape (sunset, gardens)
  - Details (amenities, luxury touches)
- **Optimization**: 
  - Current: WebP at 85% quality, < 200KB target
  - Future: AVIF + responsive srcset `[480, 768, 1024, 1440, 1920]`
- **Alt text**: Descriptive + keyword-rich (e.g., "Heated infinity pool with mountain views at Villa Serenity")

### Interaction Design
- **Transitions**: 0.3s ease for hovers, 0.6s cubic-bezier for panels
- **Hover states**: All clickable elements have clear hover feedback
- **Focus states**: Visible focus rings (accessibility)
- **Animations**: Subtle fade-ins, no jarring movements
- **Loading**: Skeleton screens or smooth transitions (no spinners)

**Reference**: `villa-engine-v2.html` for complete visual spec — **this is the quality bar for every site**

---

## 📧 Inquiry Form Flow (Lead Conversion Engine)

`/api/inquire.ts` handles all form submissions with **multi-villa awareness**.

### Form Context Tracking

**Every form submission includes villa context** via hidden fields:

```html
<!-- InquiryForm.astro (sidebar panel) -->
<input type="hidden" name="slug" value={slug} />
<input type="hidden" name="lang" value={lang} />

<!-- contact.astro (full contact page) -->
<input type="hidden" name="villa" value={slug} />
<input type="hidden" name="lang" value={lang} />
```

**The API accepts both `slug` and `villa` field names** for flexibility.

### Form Flow (End-to-End)

1. **User fills form** on `/villas/{slug}/{lang}/` or `/villas/{slug}/{lang}/contact`
2. **Form POSTs** to `/api/inquire` with hidden `slug`/`villa` + `lang` fields
3. **API validates** data + honeypot + timing gate
4. **API sends emails**:
   - Owner notification (includes guest details, dates, language tag)
   - Client receipt (branded confirmation email)
5. **API redirects** to `/villas/{slug}/{lang}/thank-you` with query params

### Anti-Bot Protection
1. **Honeypot fields**: `company`, `website`, `hpt` (bots auto-fill these)
2. **Timing gate**: Requires min 3s between form load and submit
3. **Silent success**: Bots get `{ ok: true }` but no email sent

### Validation & Routing
1. Validates `fullName`, `email`, `checkIn`, `checkOut`
2. Detects language from form `lang` field or `Accept-Language` header
3. Saves inquiry to Firestore with `status: 'pending'`
4. Sends **owner notification** via Brevo (with `[EN]`/`[ES]`/`[FR]` subject tag)
5. Sends **client receipt** (branded "Thank you, we'll be in touch")
6. Owner clicks Approve/Decline link in email → triggers `owner-action.ts`
7. Guest receives localized approval (with Stripe payment link) or decline email
8. Redirects to **localized thank-you page**: `/villas/{slug}/{lang}/thank-you`

### Environment Variables for Email

```env
# Brevo SMTP (required for email delivery)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<brevo-user>
BREVO_SMTP_PASS=<brevo-key>

# Email Routing
FROM_EMAIL=bookings@lovethisplace.co       # Verified sender (SPF/DKIM via Brevo)
FROM_NAME=LoveThisPlace                    # Brand name in "From" field
GOELITE_INBOX=your@email.com              # Your internal inbox (BCC on all emails)
OWNER_FALLBACK_EMAIL=your@email.com       # Fallback if owner not found in Firestore
```

**Email Flow Architecture**: See **Email System Architecture** section above for complete routing diagram.

---

## 🏠 Onboarding New Villas to the Email System

### Current Architecture (Single Owner)

The current setup uses **one shared `OWNER_EMAIL`** for all villas. This works when:
- You manage all villas yourself
- All inquiries go to your central booking desk
- You forward inquiries to villa owners manually

### Step-by-Step: Add a New Villa

1. **Create villa JSON** (`src/content/villas/{slug}.{lang}.json`)
2. **Add to VILLA_LANGUAGES** in `src/config/i18n.ts`:
   ```typescript
   export const VILLA_LANGUAGES: Record<string, string[]> = {
     'domaine-des-montarels': ['en', 'es', 'fr'],
     'casa-de-la-muralla': ['en', 'es'],
     'new-villa-slug': ['en', 'es'],  // Add new villa
   };
   ```
3. **Add images** to `public/images/villas/{slug}/`
4. **Build & deploy** — Forms automatically work with the new villa

### Future: Per-Villa Owner Emails

To route inquiries to different owners per villa, implement one of these patterns:

**Option A: Villa JSON Config** (Recommended)
```json
// src/content/villas/villa-example.en.json
{
  "slug": "villa-example",
  "ownerEmail": "owner@villa-example.com",
  ...
}
```
Then update `inquire.ts` to read owner email from villa config.

**Option B: Environment Variable Mapping**
```env
OWNER_EMAIL_domaine_des_montarels=reservations@domaine-desmontarels.com
OWNER_EMAIL_casa_de_la_muralla=bookings@casamuralla.com
OWNER_EMAIL_DEFAULT=contact@goelite.studio
```
Then update `inquire.ts`:
```typescript
const slug = data.slug || data.villa || 'default';
const envKey = `OWNER_EMAIL_${slug.replace(/-/g, '_')}`;
const OWNER_EMAIL = import.meta.env[envKey] || import.meta.env.OWNER_EMAIL_DEFAULT;
```

**Option C: Supabase/Database Lookup**
Store villa → owner email mapping in database for dynamic routing.

### Email Subject Format

Current format includes language tag for quick identification:
```
[EN] New Inquiry — John Smith (2025-12-01 → 2025-12-08)
[ES] New Inquiry — María García (2025-12-01 → 2025-12-08)
[FR] New Inquiry — Jean Dupont (2025-12-01 → 2025-12-08)
```

**Future enhancement**: Add villa name to subject:
```
[EN] Domaine des Montarels — John Smith (2025-12-01 → 2025-12-08)
```

### Testing Email Flow Locally

1. **Without API key**: Form returns `{ ok: true, preview: true }` — no emails sent
2. **With API key**: Set `RESEND_API_KEY` in `.env` file
3. **Test redirect**: Submit form → should redirect to `/villas/{slug}/{lang}/thank-you`

### Checklist: New Villa Email Setup

- [ ] Villa JSON created with correct `slug`
- [ ] Villa added to `VILLA_LANGUAGES` in `i18n.ts`
- [ ] Form hidden fields (`slug`/`lang`) automatically included
- [ ] Owner email configured (shared or per-villa)
- [ ] Test form submission locally
- [ ] Verify redirect to correct thank-you page
- [ ] Test email delivery in production

---

## 🔍 SEO & Structured Data (Enterprise-Level)

### JSON-LD Implementation (All Required)

**Every villa site must include these Schema.org modules**:

1. **Organization** (`#organization`)
   ```json
   {
     "@type": "Organization",
     "name": "Villa Name",
     "url": "https://villa-slug.vercel.app",
     "logo": "/images/logo.webp",
     "sameAs": ["https://instagram.com/...", "https://facebook.com/..."]
   }
   ```

2. **LodgingBusiness / TouristAccommodation**
   ```json
   {
     "@type": "LodgingBusiness",
     "name": "Villa Name",
     "description": "...",
     "address": { "@type": "PostalAddress", "addressLocality": "...", "addressRegion": "...", "addressCountry": "FR" },
     "geo": { "@type": "GeoCoordinates", "latitude": 43.xxx, "longitude": 5.xxx },
     "numberOfRooms": 6,
     "amenityFeature": [{"@type": "LocationFeatureSpecification", "name": "Pool"}],
     "starRating": { "@type": "Rating", "ratingValue": "5" }
   }
   ```

3. **Offer** (seasonal pricing)
   ```json
   {
     "@type": "Offer",
     "name": "Peak Season",
     "price": "18000",
     "priceCurrency": "USD",
     "validFrom": "2024-06-01",
     "validThrough": "2024-08-31"
   }
   ```

4. **ImageObject** gallery
   - Cap at 18 images for page weight
   - Prioritize pool → aerial → hero
   - Include captions in `description`

5. **FAQPage** (auto-generate from villa data)
   ```json
   {
     "@type": "FAQPage",
     "mainEntity": [
       {"@type": "Question", "name": "How many guests?", "acceptedAnswer": {"@type": "Answer", "text": "Up to 12"}}
     ]
   }
   ```

6. **Review + AggregateRating** (if testimonials available)
   ```json
   {
     "@type": "Review",
     "author": {"@type": "Person", "name": "Guest Name"},
     "reviewRating": {"@type": "Rating", "ratingValue": "5"},
     "reviewBody": "..."
   }
   ```

7. **BreadcrumbList** (navigation)
   ```json
   {
     "@type": "BreadcrumbList",
     "itemListElement": [
       {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://..."},
       {"@type": "ListItem", "position": 2, "name": "Villa Name"}
     ]
   }
   ```

8. **WebPage** (page metadata)

### Meta Tags (Complete Checklist)
- `<title>` — "[Villa Name] — Luxury Villa Rental in [Location]" (55-60 chars)
- `<meta name="description">` — USP + location + capacity (150-155 chars)
- `<link rel="canonical">` — Absolute URL
- `<meta property="og:title">` — Same as title
- `<meta property="og:description">` — Same as description
- `<meta property="og:image">` — Hero image (1200×630px minimum)
- `<meta property="og:url">` — Canonical URL
- `<meta property="og:type">` — "website"
- `<meta name="twitter:card">` — "summary_large_image"
- `<meta name="robots">` — "index, follow"

### Technical SEO Checklist
- [ ] `robots.txt` allows all crawlers
- [ ] `sitemap.xml` generated with lastmod dates
- [ ] All images have descriptive `alt` text
- [ ] Heading hierarchy (one H1, proper H2-H6 nesting)
- [ ] Internal links use descriptive anchor text
- [ ] Mobile-friendly (Google test passes)
- [ ] HTTPS enabled
- [ ] Page speed < 3s (mobile)
- [ ] No broken links (404s)
- [ ] Structured data validates (no errors in Rich Results Test)

### Validation (Before Sending to Owner)
1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Must show: LodgingBusiness, Offer, FAQPage, Review (if applicable)
   - Zero errors, zero warnings
2. **PageSpeed Insights**: https://pagespeed.web.dev/
   - Mobile score > 90 (all categories)
3. **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
   - Must pass
4. **Schema Markup Validator**: https://validator.schema.org/
   - No errors

**Goal**: Owner Googles "[Villa Name]" → YOUR site ranks #1 within 7 days (outranks Airbnb listing)

---

## ⚠️ Common Pitfalls & Gotchas

### 1. Inquiry Form Preview Mode
Without `RESEND_API_KEY`, form returns `{ ok: true, preview: true }` silently. **Always test email delivery** before sending demo link.

### 2. Hero Image Ordering
`index.astro` explicitly prioritizes Pool → Aerial → Facade. First image in JSON array becomes hero slide #1.

### 3. Honeypot Silence
Inquiry route **silently succeeds** for bots (honeypot fields or <3s dwell). Real validation errors only shown for legitimate submissions.

### 4. Static vs Dynamic Rendering
All villa pages are **static** (pre-rendered at build time). Only `/api/inquire` is serverless (marked `export const prerender = false;`).

### 5. Environment Variables per Villa
Each villa deployment needs its own `OWNER_EMAIL`. Use Vercel's per-project env vars or branch-based configs.

---

## 📈 Success Metrics (What Good Looks Like)

### Production Efficiency
- **Time per site**: < 2 hours (current), goal < 1 hour
- **Sites per month**: 10 (phase 1), 30 (phase 2)
- **Error rate**: < 5% (broken emails, missing images)

### Conversion Metrics
- **Owner response rate**: > 30% (reply to cold email)
- **Demo call rate**: > 15% (owner agrees to call)
- **Close rate**: > 50% (demo → paid customer)
- **Average deal value**: £1,000-£1,500

### Technical Performance
- **LCP**: < 2.5s mobile
- **Lighthouse score**: > 90 (all categories)
- **Email deliverability**: > 95%
- **Uptime**: > 99.9%

---

## 🗂️ Key Files & Directories

### Documentation (Read First)
- `PROJECT_ANALYSIS.md` — Technical deep-dive, component inventory
- `GLOBAL_SCALING_PLAN.md` — Strategic roadmap, multi-villa architecture
- `astro/PRODUCTION_SCALING_PLAN.md` — Launch checklist, ops runbook
- **Production site**: https://lovethisplace-sites.vercel.app/ (**actual quality standard**)
- `villa-engine-v2.html` — Outdated HTML prototype (ignore, use Astro production instead)

### Code Entry Points
- `astro/src/pages/index.astro` — Root redirect engine (detects hostname/language → redirects)
- `astro/src/pages/villas/[slug]/[lang].astro` — Main villa page (614 lines, fully dynamic)
- `astro/src/pages/villas/[slug]/[lang]/contact.astro` — Localized contact form (660 lines)
- `astro/src/pages/villas/[slug]/[lang]/thank-you.astro` — Localized thank-you page (306 lines)
- `astro/src/pages/villas/[slug]/[lang]/rates.astro` — Localized rates page
- `astro/src/pages/villas/[slug]/[lang]/terms.astro` — Localized terms page (~636 lines, template system)
- `astro/src/pages/villas/[slug]/[lang]/privacy.astro` — Localized privacy policy page
- `astro/src/pages/villas/[slug]/rates.astro` — Redirect to default lang rates
- `astro/src/pages/villas/[slug]/terms.astro` — Redirect to default lang terms
- `astro/src/pages/villas/[slug]/privacy.astro` — Redirect to default lang privacy
- `astro/src/pages/api/inquire.ts` — Serverless inquiry handler
- `astro/src/layouts/BaseLayout.astro` — Global layout shell (~650 lines, navCtaHref prop)
- `astro/astro.config.mjs` — Site URL + Vercel adapter config

### Configuration Files
- `astro/src/config/i18n.ts` — Villa languages, hostname mapping, default lang
- `astro/src/config/uiStrings.ts` — All UI translations EN/ES/FR (456 lines)
- `astro/src/config/services.ts` — Villa-specific service configs for Schema.org

### Library Helpers
- `astro/src/lib/schema.ts` — JSON-LD graph generator (235 lines)
- `astro/src/lib/search.ts` — Search dataset builder (41 lines)
- `astro/src/lib/accessibility.ts` — Focus trap utility (52 lines)
- `astro/src/lib/clientReceipt.ts` — Branded client receipt emails (185 lines)
- `astro/src/lib/ownerNotice.ts` — Owner notification emails (100 lines)

### Content & Assets
- `astro/src/content/villas/*.json` — Villa data files (EN/FR/ES)
- `astro/public/images/` — Raw images (need optimization pipeline)
- `astro/public/robots.txt`, `sitemap.xml` — SEO assets (static for now)

---

## 🛠️ Immediate Action Backlog (Priority Tasks)

### ✅ COMPLETED (Phase 1)
1. **CLI villa generator** — `npm run villa:create` ✅ DONE (237 lines)
2. **Multi-villa routing** — `[slug]/[lang].astro` ✅ DONE (614 lines)
3. **Full i18n support** — EN/ES/FR with `uiStrings.ts` ✅ DONE (456 lines)
4. **Localized contact/thank-you pages** — ✅ DONE
5. **i18n validation script** — `npm run validate` ✅ DONE
6. **Localized policy pages** — rates/terms/privacy with full i18n ✅ DONE
7. **Terms template system** — Default templates with `{villaName}` placeholder ✅ DONE
8. **Header CTA direct navigation** — `navCtaHref` prop for contact page links ✅ DONE
9. **Footer link mapping** — Explore links work from all policy pages ✅ DONE

### Remaining Phase 1 Tasks
1. **Image optimization pipeline** — Sharp integration, AVIF generation
2. **Environment config externalization** — Stop hardcoding site URLs

### Nice-to-Have (Phase 2)
1. **Admin UI** — Drag-drop villa builder
2. **JSON-LD expansion** — FAQPage, AggregateRating
3. **Gallery focus trap** — Accessibility fix
4. **404 page** — Custom error page

### Technical Debt
1. **Replace inline conditional CSS** in `BaseLayout.astro` (minify warnings)
2. **Hero LCP optimization** — Migrate from CSS background to `<picture>` with preload
3. **Skip link** — Add `<a href="#main-content">Skip to content</a>`

---

## 💡 Questions to Ask When Stuck

1. **Is this helping us produce sites faster?** (If no, deprioritize)
2. **Will owners care about this feature?** (Visual > technical)
3. **Can this be automated?** (Manual data entry = bottleneck)
4. **Does this work on mobile?** (Owners demo on phones)
5. **Is email delivery working?** (Test before every launch)

---

## 🔗 External Dependencies

- **Resend**: Email delivery (API key required, shared across villas)
- **Vercel**: Hosting + serverless functions (free tier = 100GB bandwidth)
- **Font Awesome 6.4**: Icons (CDN, consider self-hosting)
- **Google Fonts**: Cormorant Garamond + Inter (preload for LCP)
- **Sharp**: Image processing (to be integrated)

---

## 🎯 Vision: "Go Elite Global — Villa Engine"

**End Goal**: Productized service brand

**Tagline**: "We build the best villa websites on the internet."

**Positioning**: 
- "No design skills required — we handle everything"
- "Pay only if you love it and want to use it"
- "From raw photos to live site in 24 hours"

**Growth Path**:
1. Speculative production (10 sites/month, target villas with no/bad sites)
2. CLI automation (30 sites/month, scrape Airbnb systematically)
3. Admin UI + VA team (100+ sites/month, hire scrapers)
4. AI content generation (unlimited scale, full automation)

**Revenue at Scale**:
- 100 sites/month × £1,000 avg = £100,000/month
- 20% conversion on cold outreach = 500 emails/month
- Requires: Lead scraping, email automation, VA team

---

## 📧 Email System Architecture (Production - December 2025)

### Overview

The Villa Engine uses a **centralized email system** via **Brevo SMTP** (nodemailer). All emails flow through a single provider with intelligent routing based on recipient type.

**Key Principle**: Firestore is the source of truth. Emails are notifications only.

### Email Provider Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **SMTP Provider** | Brevo (formerly Sendinblue) | Transactional email delivery |
| **Transport** | nodemailer | Node.js SMTP client |
| **Templates** | Inline HTML (table-based) | World-class email design |
| **Database** | Firestore | Inquiry/booking state storage |

**Critical**: No Resend usage. Brevo/nodemailer is the ONLY email system.

### Email Types & Routing

| Email Type | Trigger | TO | BCC | Reply-To | Purpose |
|------------|---------|-----|-----|----------|---------|
| **Owner Notification** | New inquiry submitted | `GOELITE_INBOX` | Owner email | Guest email | Alert owner of new lead |
| **Guest Receipt** | Inquiry submitted | Guest email | `GOELITE_INBOX` | Owner email | Confirm inquiry received |
| **Approval Email** | Owner clicks "Approve" | Guest email | `GOELITE_INBOX` | Owner email | Send payment link |
| **Decline Email** | Owner clicks "Decline" | Guest email | `GOELITE_INBOX` | Owner email | Polite unavailability notice |
| **Payment Confirmation** | Stripe webhook | Guest email | `GOELITE_INBOX` | Owner email | Booking confirmed |

### Reply Flow (Critical)

| When... | Reply goes to... |
|---------|------------------|
| Owner replies to inquiry notification | → Guest directly |
| Guest replies to approval/decline email | → Owner (you're BCC'd) |
| Guest replies to payment confirmation | → Owner (you're BCC'd) |

**You (GOELITE_INBOX) are always BCC'd** — you see everything but aren't in the reply chain.

### Environment Variables

```env
# Brevo SMTP Configuration
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<your-brevo-smtp-user>
BREVO_SMTP_PASS=<your-brevo-smtp-key>

# Email Addresses
FROM_EMAIL=bookings@lovethisplace.co       # Verified sender (SPF/DKIM)
FROM_NAME=LoveThisPlace                     # Default brand name
GOELITE_INBOX=metacryptosocial@gmail.com   # Your internal inbox (NEVER shown to customers)
OWNER_FALLBACK_EMAIL=metacryptosocial@gmail.com  # Fallback if owner not found
```

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/emailService.ts` | Brevo SMTP transport configuration |
| `src/lib/emailRouting.ts` | Centralized routing logic (`sendOwnerNotification`, `sendGuestEmail`) |
| `src/lib/ownerNotice.ts` | Owner notification email template |
| `src/lib/clientReceipt.ts` | Guest receipt email template |
| `src/pages/api/inquire.ts` | Inquiry form handler |
| `src/pages/api/owner-action.ts` | Approve/decline handler with i18n emails |
| `src/pages/api/stripe-webhook.ts` | Payment confirmation emails |

### Internationalization (i18n)

Guest-facing emails respect the language from `inquiry.lang` field (stored when form submitted):

| Language | Subject Example | Badge |
|----------|-----------------|-------|
| English | "Villa Name — Your Stay is Confirmed!" | "✓ Confirmed" |
| Spanish | "Villa Name — ¡Tu Estancia está Confirmada!" | "✓ Confirmado" |
| French | "Villa Name — Votre Séjour est Confirmé !" | "✓ Confirmé" |

**Implementation**: See `EMAIL_I18N` object in `owner-action.ts` (lines 270-390).

### Email Design Standards

All emails use **table-based HTML** for maximum compatibility:

- **Header**: Elegant black (`#0a0a0a`) with villa name in Cormorant Garamond
- **Body**: Clean white with subtle shadows, 600px max-width
- **Buttons**: Rounded, high-contrast, single CTA per email
- **Footer**: Black with copyright, minimal links
- **No images**: Pure HTML/CSS for reliability (no broken image issues)

### Anti-Spam Protections

| Mechanism | Location | Behavior |
|-----------|----------|----------|
| Honeypot fields | `InquiryForm.astro` | 3 hidden fields; if filled → silent success, no email |
| Timing gate | `inquire.ts` | < 3 seconds dwell → silent success, no email |
| SPF/DKIM | Brevo domain verification | Authenticated sending |
| BCC isolation | `emailRouting.ts` | Internal inbox never exposed to customers |

---

## 🏠 Villa Owner Onboarding Guide

### What We Need From New Owners

#### Required Information

| Item | Description | Example |
|------|-------------|---------|
| **Email Address** | Primary contact for inquiries | `owner@villa-example.com` |
| **Villa Name** | Official property name | "Villa Serena" |
| **Villa Slug** | URL-friendly identifier | `villa-serena` |
| **Location** | Country, region, city | France, Provence, Gordes |
| **Specs** | Bedrooms, bathrooms, max guests | 6 BR / 7.5 BA / 12 guests |
| **Images** | 20-40 high-res photos (min 1920px wide) | Pool, exterior, all rooms |
| **Seasonal Rates** | Low/Mid/High season pricing | See pricing section below |

#### Seasonal Pricing (Critical)

**Encourage owners to match their NET Airbnb rates** (after platform fees):

| Season | Typical Dates | Strategy |
|--------|---------------|----------|
| **Low Season** | Nov-Mar (varies by region) | 20-30% below peak |
| **Mid Season** | Apr-May, Sep-Oct | 10-15% below peak |
| **High Season** | Jun-Aug, holidays | Full rate |
| **Peak/Festive** | Christmas, New Year, Easter | Premium (+20-30%) |

**Pricing conversation template**:
> "What do you charge per night on Airbnb? After their 15% fee, you net about €X. We'll list your direct rate at €X — same money to you, better value for guests, no middleman."

#### Rate Card Format

```json
"seasons": [
  { "id": "low", "label": "Low Season", "dates": "Nov 1 - Mar 31", "priceDisplay": "€1,200/night", "price": "1200", "currency": "EUR" },
  { "id": "mid", "label": "Mid Season", "dates": "Apr 1 - May 31, Sep 1 - Oct 31", "priceDisplay": "€1,800/night", "price": "1800", "currency": "EUR" },
  { "id": "high", "label": "High Season", "dates": "Jun 1 - Aug 31", "priceDisplay": "€2,500/night", "price": "2500", "currency": "EUR" }
]
```

#### Optional But Recommended

| Item | Why It Matters |
|------|----------------|
| **Custom domain** | `villaserena.com` beats `villa-serena.vercel.app` |
| **Stripe account** | For direct payments (we handle setup via Stripe Connect) |
| **Testimonials** | 3-5 guest reviews boost conversion |
| **FAQ answers** | 10-20 common questions reduce inquiry friction |
| **Social links** | Instagram, Facebook for credibility |
| **WhatsApp** | International guests prefer it |

### Onboarding Checklist

```markdown
## Villa Onboarding: [Villa Name]

### Phase 1: Information Gathering
- [ ] Owner email confirmed
- [ ] Villa name and slug decided
- [ ] Location details (country, region, city, coordinates)
- [ ] Specs collected (BR/BA/guests/pool)
- [ ] Seasonal rates agreed (low/mid/high)
- [ ] Currency confirmed (EUR/USD/GBP)

### Phase 2: Content Collection
- [ ] 20-40 images received (1920px+ wide)
- [ ] Images renamed to standard format (VILLA_001.webp, etc.)
- [ ] Hero images identified (pool/exterior priority)
- [ ] Amenities list extracted
- [ ] Description/overview text
- [ ] Testimonials (if available)
- [ ] FAQ answers (if available)

### Phase 3: System Setup
- [ ] Firestore: Owner document created
- [ ] Firestore: Listing document created
- [ ] Firestore: Owner → Listing linked via `ownerId`
- [ ] JSON content files created (en, es, fr as needed)
- [ ] Images uploaded to `/public/images/villas/{slug}/`
- [ ] i18n config updated (`VILLA_LANGUAGES`)

### Phase 4: Testing
- [ ] Local dev: Villa page renders correctly
- [ ] Form submission: Inquiry reaches owner + GOELITE_INBOX
- [ ] Approve flow: Guest receives payment email
- [ ] Decline flow: Guest receives polite decline
- [ ] Stripe: Test payment completes

### Phase 5: Launch
- [ ] Deploy to Vercel
- [ ] Verify production emails working
- [ ] Send live URL to owner for approval
- [ ] Domain setup (if custom domain)
- [ ] Final owner sign-off
```

### Firestore Data Structure

#### Owner Document (`owners/{ownerId}`)

```typescript
{
  id: "owner_abc123",
  name: "Jean-Pierre Martin",
  email: "jp@villaserena.com",
  tier: "asset-partner",           // asset-partner | performance-starter | buyout
  stripeAccountId: "acct_xxx",     // Stripe Connect ID
  currency: "EUR",
  contractStart: Timestamp,
  contractMonths: 12,
  commissionPercent: 10            // Our cut on bookings
}
```

#### Listing Document (`listings/{listingId}`)

```typescript
{
  id: "listing_xyz789",
  slug: "villa-serena",
  type: "villa",
  name: "Villa Serena",
  ownerId: "owner_abc123",         // Links to Owner
  location: {
    country: "France",
    region: "Provence",
    city: "Gordes"
  },
  maxGuests: 12,
  commissionPercent: 10,
  baseCurrency: "EUR",
  pricingStrategy: "seasonal",
  status: "active"
}
```

#### Inquiry Document (`inquiries/{inquiryId}`)

```typescript
{
  id: "inq_123",
  listingId: "listing_xyz789",
  guestName: "John Smith",
  guestEmail: "john@example.com",
  checkIn: "2025-06-15",
  checkOut: "2025-06-22",
  partySize: 8,
  message: "Looking forward to our family reunion...",
  lang: "en",                      // Used for i18n emails
  status: "pending",               // pending | approved | declined | awaiting_payment | paid
  quoteAmount: 17500,
  currency: "EUR",
  stripeSessionId: "cs_xxx",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Quick Owner Onboarding Script

```powershell
# 1. Create owner in Firestore (via Firebase console or seed script)
# 2. Create listing linked to owner
# 3. Create content files
cp src/content/villas/domaine-des-montarels.en.json src/content/villas/villa-serena.en.json

# 4. Update i18n config
# Add to VILLA_LANGUAGES in src/config/i18n.ts:
# 'villa-serena': ['en', 'es']

# 5. Add images
mkdir public/images/villas/villa-serena
# Copy images...

# 6. Build and deploy
npm run build
git add -A && git commit -m "feat: Add Villa Serena"
git push origin feature/multi-villa-engine
```

---

## 📞 Ownership & Contact

**Maintainer**: GoEliteStudio  
**Business Model**: Productized villa websites (cold outreach → build → sell)  
**Target Market**: Luxury villa owners (France, Italy, Greece, Caribbean) **with shitty or nonexistent websites**
**Current Status**: Proof-of-concept (1 production site)  
**Next Milestone**: 10 sites deployed, 3 paid customers

---

## 🎯 Maintainability Index (Subjective Scoring 1-5)

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Code Clarity** | 4/5 | Explicit mapping, minimal indirection |
| **Duplication** | 3/5 | JSON-LD still manual; generator will raise to 5 |
| **Test Coverage** | 2/5 | Needs formal unit/integration tests |
| **Performance Headroom** | 4/5 | Most heavy lifts pre-planned |
| **Extensibility** | 4/5 | Content-driven, modular components |

**Strategic Improvement**: Implement schema generator + test harness to raise clarity & duplication scores.

---

## ⚠️ Risk Assessment & Mitigations

| Risk | Mitigation |
|------|------------|
| Thin localized content → inconsistent hero layout | Enforce imagery presence in validation script + placeholder fallback messaging |
| Multi-villa complexity → JSON-LD duplication | Abstract generator & global ID registry ensuring uniqueness |
| Email deliverability (unverified sender) | SPF/DKIM verification + `FROM_EMAIL` constant isolation |
| Gallery modal potential focus escape | Planned focus trap & restore logic addition |
| Performance regression with image expansion | Introduce responsive pipeline + Lighthouse CI gating |
| Plugin/template update drift | Zero plugin dependencies; all code in repo control |
| AI schema fragmentation (entity duplication) | Stable `@id` cross-linking; future multi-page registry |

---

## 📊 Observability & Future Instrumentation

**Planned**:
- Web vitals collection (LCP, CLS, FID, TBT, FCP)
- Structured server logs (JSON format)
- Error tracking (Sentry DSN gated behind consent)
- Analytics minimal script lazy-injected post-interaction

**Metrics of Interest**:
- Inquiry conversion % (form start → submission)
- Median LCP by locale
- Search modal engagement (open count, query patterns)
- Tab navigation distribution (which content gets most attention)
- Scroll depth events (hero → gallery → testimonials → inquiry)

**Goal**: Data-driven optimization of conversion and content strategy → higher booking rates, smarter marketing spend.

---

## ♿ Accessibility Status & TODOs

**Current**:
- ✅ Labeled nav with `aria-label="Primary"`
- ✅ ARIA roles for tabs (`tablist`, `tab`, `tabpanel`)
- ✅ Semantic headings (H1 → H2 → H3 hierarchy)
- ✅ Color contrast baseline acceptable
- ✅ Keyboard gallery navigation (arrows, ESC)

**TODO**:
- ⚠️ Focus trap for modals (gallery/search)
- ⚠️ Skip-to-content link (`<a href="#main-content">Skip to content</a>`)
- ⚠️ Improved form error announcements (`aria-live` region)
- ⚠️ High contrast mode toggle
- ⚠️ Localized accessibility text (screen reader announcements in ES/FR)

**Goal**: WCAG AA compliance, inclusive brand values, reduced legal/compliance risk.

---

## 🔑 Key Identifiers & Cross-Links (Appendix)

**Stable `@id` Reference** (maintain coherent knowledge graph):

| Entity | @id Pattern | Cross-Links |
|--------|-------------|-------------|
| **Organization** | `https://www.domaine-desmontarels.com/#organization` | Referenced by WebSite (`publisher`), LodgingBusiness (`brand`) |
| **WebSite** | `https://www.domaine-desmontarels.com/#website` | Links to Organization |
| **Global Lodging** | `https://www.domaine-desmontarels.com/#lodging` | Links to Organization (`brand`) |
| **Page LodgingBusiness** | `https://www.domaine-desmontarels.com/{slug}/#lodging-business` | Detailed amenities, reviews, offers |
| **WebPage** | `https://www.domaine-desmontarels.com/{slug}/#webpage` | Links to primary image |
| **BreadcrumbList** | `https://www.domaine-desmontarels.com/{slug}/#breadcrumbs` | Navigation hierarchy |
| **FAQPage** | `https://www.domaine-desmontarels.com/{slug}/#faq` | Conditional |
| **OfferCatalog** | `https://www.domaine-desmontarels.com/#offer-catalog` | Bundles Service nodes |
| **Services** | `#service-private-chef`, `#service-vineyard`, `#service-transfers`, `#service-housekeeping` | Each with `provider` → LodgingBusiness |

**Future Multi-Villa Pattern**: `https://www.domaine-desmontarels.com/#villa-{slug}-lodging`

**Goal**: Well-defined identifiers make audits, integrations, and scaling simpler — reducing friction when adding services, villas, or external distribution channels.

---

*Last updated: 2025-12-03*  
*Remember: This is a business, not a project. Speed > perfection. Ship > polish. Build first, ask permission never.*
