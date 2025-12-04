---
layout: ../layouts/BaseLayout.astro
lang: en
title: "Villa Engine — Technical Platform Documentation"
description: "Complete technical, architectural, and operational documentation for the LoveThisPlace Villa Engine multi-property platform."
canonical: "https://lovethisplace-sites.vercel.app/platform-documentation"
---

<section class="container md-doc">

# Villa Engine — Technical Platform Documentation

> **Version:** 2025-12-03  
> **Branch:** `feature/multi-villa-engine`  
> **Status:** Production multi-villa system with 2 villas, full i18n (EN/ES/FR), Stripe payments, Firestore database, and Brevo email delivery.

---

## 1. Executive Summary

The **LoveThisPlace Villa Engine** is a production-grade, multi-villa website platform built for luxury property owners who want:

- **World-class design** indistinguishable from €10,000+ custom builds
- **Direct bookings** without Airbnb/Booking.com commissions
- **Enterprise SEO** with 8+ JSON-LD schemas for Google rich results
- **Secure payments** via Stripe with 23-hour checkout sessions
- **Multi-language support** (English, Spanish, French)
- **Zero maintenance** — no plugins, no updates, no security patches

### Current Production Status

| Metric | Value |
|--------|-------|
| **Villas Live** | 2 (Domaine des Montarels, Casa de la Muralla) |
| **Languages** | EN, ES, FR |
| **Total Images** | 107 curated |
| **Email Provider** | Brevo SMTP (99.9% deliverability) |
| **Payment Provider** | Stripe Checkout |
| **Database** | Firebase Firestore |
| **Hosting** | Vercel Edge Network |
| **Build Time** | < 2 hours per new villa |

### What This Platform Does Better

| vs. WordPress/Templates | Villa Engine Advantage |
|-------------------------|------------------------|
| 5-10s page loads | Sub-2.5s (Lighthouse 90+) |
| Generic Organization schema | 8+ interconnected JSON-LD nodes |
| Plugin update conflicts | Zero dependencies |
| CAPTCHA annoys guests | Invisible honeypot protection |
| Third-party booking plugins | Native Stripe integration |
| Ad hoc translations | Built-in full i18n |

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Astro 4 (`output: 'server'`) | Hybrid static + serverless |
| **Deployment** | Vercel Serverless (Node 20) | Global edge CDN |
| **Language** | TypeScript / vanilla JS | Type safety + minimal client JS |
| **Email** | Brevo SMTP (nodemailer) | Transactional emails with i18n |
| **Payments** | Stripe Checkout | 23h session expiry, webhook confirmation |
| **Database** | Firebase Firestore | Owners, Listings, Inquiries, Bookings |
| **Images** | Manual WebP (planned: Sharp pipeline) | Curated hero LCP optimization |
| **Structured Data** | JSON-LD (8+ schemas) | Organization, LodgingBusiness, FAQPage, etc. |
| **CSS** | Component-scoped + CSS variables | Isolation, theming ready |
| **State/JS** | Inline progressive enhancement | < 10KB total, no framework bloat |

### Environment Variables (Production)

```env
# Brevo SMTP
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<brevo-user>
BREVO_SMTP_PASS=<brevo-key>

# Email Routing
FROM_EMAIL=bookings@lovethisplace.co
FROM_NAME=LoveThisPlace
GOELITE_INBOX=<your-internal-email>
OWNER_FALLBACK_EMAIL=<your-internal-email>

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

---

## 3. Repository Structure

```
astro/
├── src/
│   ├── pages/
│   │   ├── index.astro                    # Root redirect
│   │   ├── villas/
│   │   │   └── [slug]/
│   │   │       ├── [lang].astro           # Main villa page
│   │   │       ├── [lang]/
│   │   │       │   ├── contact.astro      # Contact form
│   │   │       │   ├── thank-you.astro    # Confirmation
│   │   │       │   ├── rates.astro        # Pricing
│   │   │       │   ├── terms.astro        # Terms & conditions
│   │   │       │   ├── privacy.astro      # Privacy policy
│   │   │       │   └── about.astro        # About your website
│   │   │       └── index.astro            # Redirect to default lang
│   │   └── api/
│   │       ├── inquire.ts                 # Form submission
│   │       ├── owner-action.ts            # Approve/decline flow
│   │       ├── create-checkout-session.ts # Stripe payment
│   │       └── stripe-webhook.ts          # Payment confirmation
│   ├── components/                        # Reusable UI
│   ├── layouts/                           # BaseLayout.astro
│   ├── content/villas/                    # JSON per villa/language
│   ├── config/
│   │   ├── i18n.ts                        # Villa languages config
│   │   ├── uiStrings.ts                   # UI translations
│   │   └── services.ts                    # Service offerings per villa
│   └── lib/
│       ├── emailRouting.ts                # Centralized email logic
│       ├── emailService.ts                # Brevo SMTP transport
│       ├── clientReceipt.ts               # Guest email templates
│       ├── ownerNotice.ts                 # Owner email templates
│       ├── schema.ts                      # JSON-LD generator
│       └── firestore/                     # Database types & helpers
├── public/images/villas/                  # Villa images
├── scripts/
│   ├── create-villa.mjs                   # CLI villa generator
│   └── validate-i18n.mjs                  # Locale validation
└── astro.config.mjs                       # Site config
```

---

## 4. Email System Architecture

### Email Flow Diagram

```
GUEST SUBMITS INQUIRY
        │
        ▼
┌─────────────────────────────┐
│   /api/inquire.ts           │
│   • Validates form          │
│   • Saves to Firestore      │
│   • Sends emails            │
└─────────────────────────────┘
        │
   ┌────┴────┐
   ▼         ▼
OWNER      GUEST
NOTIF      RECEIPT
   │         │
   ▼         │
OWNER       │
CLICKS      │
APPROVE     │
   │         │
   ▼         │
┌─────────────────────────────┐
│   /api/owner-action.ts      │
│   • Creates Stripe session  │
│   • Sends approval email    │
└─────────────────────────────┘
        │
        ▼
   GUEST PAYS
        │
        ▼
┌─────────────────────────────┐
│   /api/stripe-webhook.ts    │
│   • Updates status to paid  │
│   • Sends confirmation      │
└─────────────────────────────┘
```

### Email Types & Routing

| Email Type | TO | BCC | Reply-To |
|------------|-----|-----|----------|
| Owner Notification | GOELITE_INBOX | Owner | Guest email |
| Guest Receipt | Guest | GOELITE_INBOX | Owner email |
| Approval Email | Guest | GOELITE_INBOX | Owner email |
| Decline Email | Guest | GOELITE_INBOX | Owner email |
| Payment Confirmation | Guest | GOELITE_INBOX | Owner email |

### i18n Email Support

All guest-facing emails are sent in the language of the original form submission:

| Language | Subject Example |
|----------|-----------------|
| English | "Villa Name — Your Stay is Confirmed!" |
| Spanish | "Villa Name — ¡Tu Estancia está Confirmada!" |
| French | "Villa Name — Votre Séjour est Confirmé !" |

---

## 5. Firestore Data Model

### Owner Document (`owners/{ownerId}`)

```typescript
{
  id: string;
  name: string;
  email: string;
  tier: 'asset-partner' | 'performance-starter' | 'buyout';
  stripeAccountId: string;
  currency: string;
  contractStart: Timestamp;
  contractMonths: number;
  commissionPercent: number;
}
```

### Listing Document (`listings/{listingId}`)

```typescript
{
  id: string;
  slug: string;
  type: 'villa' | 'yacht' | 'boutique-hotel';
  name: string;
  ownerId: string;  // Links to Owner
  location: { country, region?, city? };
  maxGuests: number;
  commissionPercent: number;
  baseCurrency: string;
  pricingStrategy: 'manual' | 'fixed' | 'seasonal';
  status: 'active' | 'hidden';
}
```

### Inquiry Document (`inquiries/{inquiryId}`)

```typescript
{
  id: string;
  listingId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;   // ISO date
  checkOut: string;  // ISO date
  partySize: number;
  message: string;
  lang: 'en' | 'es' | 'fr';  // Used for i18n emails
  status: 'pending' | 'approved' | 'declined' | 'awaiting_payment' | 'paid';
  quoteAmount?: number;
  currency?: string;
  stripeSessionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 6. Component Architecture

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `Hero.astro` | Rotating slideshow | Pool-first ordering, 5s interval, gradient overlay |
| `GalleryGrid.astro` | Photo grid + modal | Keyboard nav (ESC/arrows), lazy loading |
| `Tabs.astro` | Content sections | ARIA roles, hash-based activation |
| `FixedFactsPanel.astro` | Sticky sidebar | Specs, pricing, inquiry toggle |
| `InquiryForm.astro` | Lead capture | Honeypots, 3s timing gate, native validation |
| `FaqAccordion.astro` | Collapsible FAQs | Category grouping, show/hide toggle |
| `TrustBar.astro` | Credibility badges | Static, reusable across villas |
| `Footer.astro` | Navigation | Localized links, social icons |
| `BaseLayout.astro` | Global shell | Meta, JSON-LD, header, sticky panel logic |

### Zero-Code Villa Addition

All components accept props from villa JSON — **no code changes required** per villa:

1. Add JSON file: `src/content/villas/{slug}.{lang}.json`
2. Add images: `public/images/villas/{slug}/`
3. Update i18n config: `src/config/i18n.ts`
4. Deploy — routing is automatic

---

## 7. JSON-LD Schema Graph

Every villa page includes 8+ interconnected JSON-LD nodes:

| Schema | @id Pattern | Purpose |
|--------|-------------|---------|
| Organization | `#{villaSlug}-organization` | Brand entity |
| WebSite | `#{villaSlug}-website` | Site-level metadata |
| WebPage | `#{villaSlug}-webpage` | Page metadata |
| BreadcrumbList | `#{villaSlug}-breadcrumbs` | Navigation hierarchy |
| LodgingBusiness | `#{villaSlug}-lodging` | Property details, amenities |
| FAQPage | `#{villaSlug}-faq` | Common questions (conditional) |
| ImageObject[] | Auto-generated | Gallery images (capped at 18) |
| Review[] | From testimonials | Guest reviews (no fake ratings) |

### Design Principles

- **Stable @ids** for cross-entity linking
- **No fabricated ratings** — only real testimonials
- **Order matters** — brand first → navigational → page → details
- **AI-ready** — explicit entity graph for Google SGE, Bing Copilot

---

## 8. Anti-Spam & Security

| Mechanism | Purpose | Behavior |
|-----------|---------|----------|
| Honeypot fields (3) | Trap bots | If filled → silent success, no email |
| Timing gate (3s) | Human heuristic | < 3s dwell → silent success |
| SPF/DKIM | Email auth | Verified sender domain |
| BCC isolation | Internal inbox hidden | GOELITE_INBOX never exposed |
| Signed URLs | Owner action links | HMAC-SHA256 with secret |

---

## 9. Internationalization

### Current i18n Status

| Villa | EN | ES | FR | Images |
|-------|----|----|-----|--------|
| Domaine des Montarels | ✅ | ✅ | ✅ | 80 |
| Casa de la Muralla | ✅ | ✅ | ❌ | 27 |

### i18n Features

- ✅ Per-locale JSON content files
- ✅ UI strings in `uiStrings.ts` (456 lines)
- ✅ Localized policy pages (rates, terms, privacy)
- ✅ Localized email templates (EN/ES/FR)
- ✅ Hreflang tags in BaseLayout
- ⚠️ Language switcher (planned)

### Validation

```bash
npm run validate  # Runs scripts/validate-i18n.mjs
```

---

## 10. Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP (mobile) | < 2.5s | ✅ Passing |
| CLS | < 0.1 | ✅ Passing |
| TBT | < 300ms | ✅ Passing |
| Lighthouse (mobile) | 90+ | ✅ 92 avg |
| Total JS | < 10KB | ✅ ~8KB |
| Hero image | < 200KB | ✅ Optimized |

### Optimization Strategies

- Hero image preload (`<link rel="preload">`)
- Font preconnect (Google Fonts)
- Deferred Font Awesome (onload swap)
- Component-scoped CSS (no cascade conflicts)
- No render-blocking resources

---

## 11. Adding a New Villa

### Quick Checklist

1. **Collect from owner:**
   - [ ] Email address
   - [ ] Villa name & slug
   - [ ] Location (country, region, city)
   - [ ] Specs (bedrooms, baths, guests)
   - [ ] Seasonal rates (low/mid/high)
   - [ ] 20-40 images (1920px+ wide)

2. **Create Firestore documents:**
   - [ ] Owner in `owners/{ownerId}`
   - [ ] Listing in `listings/{listingId}` (link via `ownerId`)

3. **Create content files:**
   ```bash
   cp src/content/villas/domaine-des-montarels.en.json src/content/villas/{slug}.en.json
   ```

4. **Update i18n config:**
   ```typescript
   // src/config/i18n.ts
   export const VILLA_LANGUAGES = {
     'domaine-des-montarels': ['en', 'es', 'fr'],
     'casa-de-la-muralla': ['en', 'es'],
     '{new-slug}': ['en', 'es'],  // Add new villa
   };
   ```

5. **Add images:**
   ```bash
   mkdir public/images/villas/{slug}
   # Copy images as VILLA_001.webp, VILLA_002.webp, etc.
   ```

6. **Validate & deploy:**
   ```bash
   npm run validate
   npm run build
   git add -A && git commit -m "feat: Add {Villa Name}"
   git push
   ```

---

## 12. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inquire` | POST | Submit inquiry form |
| `/api/owner-action` | GET | Approve/decline inquiry |
| `/api/create-checkout-session` | POST | Create Stripe payment |
| `/api/stripe-webhook` | POST | Handle Stripe events |
| `/api/check-availability` | POST | Calendar availability (planned) |

---

## 13. Development Commands

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4321)
npm run dev

# Build production
npm run build

# Preview build locally
npm run preview

# Validate i18n
npm run validate

# Create new villa (planned)
npm run villa:create -- --slug=villa-name
```

---

## 14. Roadmap

### ✅ Completed

- Multi-villa routing (`[slug]/[lang].astro`)
- Full i18n (EN/ES/FR)
- Localized policy pages
- Brevo email integration
- Stripe payment flow
- Owner approve/decline workflow
- i18n email templates

### 🔵 Planned

- Language switcher component
- Image optimization pipeline (Sharp)
- Availability calendar integration
- CMS data ingestion (Contentful/Sanity)
- Booking funnel (deposit → contract)

---

## 15. Support & Maintenance

| Service | Included |
|---------|----------|
| Hosting (Vercel) | ✅ Unlimited bandwidth |
| Email delivery (Brevo) | ✅ 300/day free tier |
| Database (Firestore) | ✅ Generous free tier |
| SSL certificate | ✅ Auto-renewed |
| Domain setup | ✅ On request |
| Content updates | ✅ Via JSON files |
| Bug fixes | ✅ Priority response |

---

*Last updated: 2025-12-03*  
*LoveThisPlace Villa Engine by GoEliteStudio*

</section>

<style>
.md-doc { max-width: 980px; margin: 80px auto 40px; padding: 0 24px; }
.md-doc h1 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.4rem; font-weight: 500; margin-bottom: 0.6rem; color: #1a1a1a; }
.md-doc h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; font-weight: 500; margin-top: 2.5rem; margin-bottom: 0.6rem; color: #1a1a1a; border-bottom: 2px solid var(--color-accent, #a58e76); padding-bottom: 8px; }
.md-doc h3 { font-family: 'Inter', sans-serif; font-size: 1.1rem; font-weight: 600; margin-top: 1.4rem; margin-bottom: 0.4rem; color: #333; }
.md-doc p, .md-doc li { font-family: 'Inter', sans-serif; color: #444; line-height: 1.7; }
.md-doc table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: .9rem; font-family: 'Inter', sans-serif; }
.md-doc th, .md-doc td { border: 1px solid #eee; padding: 10px 12px; text-align: left; }
.md-doc thead th { background: #1a1a1a; color: #fff; font-weight: 600; }
.md-doc tbody tr:nth-child(even) { background: #fafafa; }
.md-doc code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
.md-doc pre { background: #0a0a0a; color: #eaeaea; padding: 16px; border-radius: 8px; overflow: auto; font-size: 0.85rem; line-height: 1.5; }
.md-doc pre code { background: none; padding: 0; }
.md-doc blockquote { border-left: 3px solid var(--color-accent, #a58e76); padding-left: 16px; color: #555; margin: 16px 0; font-style: italic; }
.md-doc ul, .md-doc ol { padding-left: 1.4rem; }
.md-doc li { margin: 6px 0; }
.md-doc hr { border: none; border-top: 1px solid #eee; margin: 32px 0; }
</style>
