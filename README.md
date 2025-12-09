# Villa Engine

Multi-villa booking platform with full i18n support, Firestore backend, Stripe payments, and automated owner onboarding.

**Production URL**: https://lovethisplace-sites.vercel.app/

## Features

- **Multi-Villa Support**: 5 villas configured (Domaine des Montarels, Casa de la Muralla, Mount Zurich, Villa Kassandra, Villa Orama)
- **Rental & Sale Listings**: Support for both short-term rentals and property sale listings
- **Full i18n**: EN/ES/FR/EL/RU with localized content, emails, and UI
- **Inquiry System**: Honeypot + timing gate protection, owner notifications
- **Payment Flow**: Stripe Checkout with owner approve/decline workflow
- **Email System**: Brevo SMTP with branded HTML templates
- **SEO**: 8+ JSON-LD schemas per page (LodgingBusiness, FAQPage, OfferCatalog, etc.)
- **Accessibility**: ARIA tabs, keyboard navigation, semantic HTML

## Villas Configured

| Villa | Languages | Type | Images | Owner Email |
|-------|-----------|------|--------|-------------|
| Domaine des Montarels | EN, ES, FR | Rental | 80 | jc@elitecartagena.com |
| Casa de la Muralla | EN, ES | Rental | 27 | reservations@casadelamuralla.com |
| Mount Zurich | EN, ES | Rental | 40+ | — |
| Villa Kassandra | EN, EL, RU | **For Sale** | 60+ | jc@elitecartagena.com |
| Villa Orama | EN, EL | Rental | 40+ | — |

## Dev Commands

```powershell
npm install                    # Install dependencies
npm run dev                    # Start dev server (http://localhost:4321)
npm run build                  # Build for production
npm run preview                # Preview production build

# Villa Management
npm run villa:onboard -- --slug=villa-name --name="Villa Name" --owner-email=owner@email.com
npm run villa:seed             # Seed/refresh Firestore data
npm run validate               # Validate i18n content
```

## Environment Variables

Create `.env` file:

```env
# Brevo SMTP (required for emails)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=<brevo-user>
BREVO_SMTP_PASS=<brevo-key>

# Email Routing
FROM_EMAIL=bookings@lovethisplace.co
FROM_NAME=LoveThisPlace
GOELITE_INBOX=your@email.com
OWNER_FALLBACK_EMAIL=your@email.com

# Firebase (required for Firestore)
FIREBASE_PROJECT_ID=go-elite-studio
FIREBASE_CLIENT_EMAIL=<service-account-email>
FIREBASE_PRIVATE_KEY="<private-key>"

# Stripe (required for payments)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Security
OWNER_ACTION_SECRET=<random-string>
```

## Adding a New Villa

Use the CLI:

```powershell
npm run villa:onboard -- --slug=villa-serenity --name="Villa Serenity" --owner-email=owner@villa.com --langs=en,es --region=europe --currency=EUR
```

This will:
1. Create Firestore owner & listing documents
2. Add villa to `src/config/i18n.ts`
3. Create content JSON templates
4. Create image folder

Then:
1. Add images to `public/images/villas/{slug}/`
2. Fill in content JSON files
3. Deploy

## Sale Listings (Property For Sale)

To configure a villa as a **sale listing** instead of a rental:

1. Add `"listingType": "sale"` to the villa JSON file(s):

```json
{
  "slug": "villa-example",
  "language": "en",
  "listingType": "sale",
  "name": "Villa Example – For Sale",
  ...
}
```

2. Update content for sale context:
   - `hero.title`: Include "FOR SALE" prefix
   - `hero.ctaText`: "View Investment Details"
   - `content.practicalDetails`: Ownership type, zoning, documentation status
   - `content.hosts`: Sales contact info
   - `seasons`: Asking price instead of nightly rates

3. The UI will automatically show:
   - Sale-specific trust bar ("YOUR PURCHASE GUARANTEES")
   - Buyer-focused hosts section ("Acquisition & Due Diligence Contact")
   - Legal/viewing bullets instead of concierge bullets

**To revert to rental:** Remove `listingType` field or set to `null`.

## Key Files

- `src/config/i18n.ts` — Villa registry (languages, region, owner email)
- `src/config/uiStrings.ts` — UI translations (EN/ES/FR/EL/RU) + sale-specific strings
- `src/content/villas/*.json` — Villa content data
- `src/pages/api/inquire.ts` — Inquiry form handler
- `src/pages/api/owner-action.ts` — Approve/decline handler
- `scripts/onboard-villa.mjs` — Villa onboarding CLI

## License

Proprietary — GoEliteStudio
