# Villa Engine

Multi-villa booking platform with full i18n support, Firestore backend, Stripe payments, and automated owner onboarding.

**Production URL**: https://lovethisplace-sites.vercel.app/

## Features

- **Multi-Villa Support**: 2 villas configured (Domaine des Montarels, Casa de la Muralla)
- **Full i18n**: EN/ES/FR with localized content, emails, and UI
- **Inquiry System**: Honeypot + timing gate protection, owner notifications
- **Payment Flow**: Stripe Checkout with owner approve/decline workflow
- **Email System**: Brevo SMTP with branded HTML templates
- **SEO**: 8+ JSON-LD schemas per page (LodgingBusiness, FAQPage, OfferCatalog, etc.)
- **Accessibility**: ARIA tabs, keyboard navigation, semantic HTML

## Villas Configured

| Villa | Languages | Images | Owner Email |
|-------|-----------|--------|-------------|
| Domaine des Montarels | EN, ES, FR | 80 | jc@elitecartagena.com |
| Casa de la Muralla | EN, ES | 27 | reservations@casadelamuralla.com |

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

## Key Files

- `src/config/i18n.ts` — Villa registry (languages, region, owner email)
- `src/config/uiStrings.ts` — UI translations (EN/ES/FR)
- `src/content/villas/*.json` — Villa content data
- `src/pages/api/inquire.ts` — Inquiry form handler
- `src/pages/api/owner-action.ts` — Approve/decline handler
- `scripts/onboard-villa.mjs` — Villa onboarding CLI

## License

Proprietary — GoEliteStudio
