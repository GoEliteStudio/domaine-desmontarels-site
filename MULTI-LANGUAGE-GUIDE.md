# 🌍 Multi-Language Infrastructure Guide

## Overview

Villa Engine now supports **unlimited languages per villa** with automatic routing, hreflang SEO tags, and language switcher UI.

**URL Pattern**: `/villas/{slug}/{lang}/`

**Examples**:
- English: `/villas/casa-de-la-muralla/en/`
- Spanish: `/villas/casa-de-la-muralla/es/`
- French: `/villas/domaine-des-montarels/fr/`
- Greek: `/villas/santorini-escape/el/`

---

## Supported Languages

| Code | Language | Locale | Markets |
|------|----------|--------|---------|
| `en` | English | en-US | USA, UK, Australia, global |
| `es` | Español | es-ES | Spain, Latin America |
| `fr` | Français | fr-FR | France, Belgium, Switzerland |
| `el` | Ελληνικά | el-GR | Greece, Cyprus |
| `it` | Italiano | it-IT | Italy |
| `de` | Deutsch | de-DE | Germany, Austria, Switzerland |
| `pt` | Português | pt-BR | Brazil, Portugal |

**Add more**: Edit `LANG_META` constant in `/src/pages/villas/[slug]/[lang].astro`

---

## Architecture

### 1. Content Files (JSON per language)

**File naming**: `{slug}.{lang}.json`

```
src/content/villas/
  ├── casa-de-la-muralla.en.json  ✅ English
  ├── casa-de-la-muralla.es.json  ✅ Spanish
  ├── domaine-des-montarels.en.json
  ├── domaine-des-montarels.es.json
  └── domaine-des-montarels.fr.json
```

**Structure** (same across all languages):
```json
{
  "slug": "casa-de-la-muralla",
  "name": "Casa de la Muralla",
  "summary": "Paraíso exclusivo frente al mar...",
  "hero": {
    "title": "Tu Escape Privado en una Isla del Caribe",
    "subtitle": "Villa frente al mar...",
    "ctaText": "Explora la Isla"
  },
  "content": {
    "overview": "Casa de la Muralla ofrece...",
    "location": "Ubicada en la Isla Tierrabomba...",
    "faq": [
      { "q": "¿Cómo llegamos a la isla?", "a": "Organizamos traslados..." }
    ]
  },
  "amenities": ["WiFi de Alta Velocidad", "Acceso Privado a la Playa"],
  "specs": { "bedrooms": 4, "baths": 3 }
}
```

**Critical**: All languages must have **identical field structure** (same keys, same nesting)

---

### 2. Dynamic Routing

**File**: `/src/pages/villas/[slug]/[lang].astro`

**getStaticPaths()**: Generates all villa/language combinations

```javascript
const VILLA_LANGUAGES: Record<string, string[]> = {
  'domaine-des-montarels': ['en', 'es', 'fr'],
  'casa-de-la-muralla': ['en', 'es']
};

export async function getStaticPaths() {
  const paths = [];
  for (const [slug, languages] of Object.entries(VILLA_LANGUAGES)) {
    for (const lang of languages) {
      paths.push({ params: { slug, lang } });
    }
  }
  return paths;
}
```

**Result**: Astro pre-renders all combinations at build time:
- `/villas/domaine-des-montarels/en/`
- `/villas/domaine-des-montarels/es/`
- `/villas/domaine-des-montarels/fr/`
- `/villas/casa-de-la-muralla/en/`
- `/villas/casa-de-la-muralla/es/`

---

### 3. SEO Hreflang Tags

**Auto-generated in BaseLayout**:

```html
<!-- Hreflang for language alternates -->
<link rel="alternate" hreflang="en-US" href="/villas/casa-de-la-muralla/en/" />
<link rel="alternate" hreflang="es-ES" href="/villas/casa-de-la-muralla/es/" />
<link rel="alternate" hreflang="x-default" href="/villas/casa-de-la-muralla/en/" />

<!-- Canonical (language-specific) -->
<link rel="canonical" href="/villas/casa-de-la-muralla/es/" />

<!-- Open Graph locale -->
<meta property="og:locale" content="es-ES" />
```

**Benefits**:
- Google shows correct language version to users based on location/browser
- No duplicate content penalties
- Better international SEO rankings

---

### 4. Language Switcher UI

**Fixed position** (top-right desktop, bottom-right mobile):

```
┌──────────────┐
│ English      │  ← Active (bronze background)
│ Español      │  ← Hover state
│ Français     │
└──────────────┘
```

**Behavior**:
- Switches to same villa in different language
- Active language highlighted in bronze (`var(--color-accent)`)
- Maintains scroll position
- Only shows if villa has 2+ languages

**Mobile**: Horizontal layout at bottom (above WhatsApp button)

---

## Adding a New Language to Existing Villa

### Manual Method

1. **Create JSON file**:
   ```bash
   cp src/content/villas/casa-de-la-muralla.en.json \
      src/content/villas/casa-de-la-muralla.fr.json
   ```

2. **Translate content** in `.fr.json`:
   ```json
   {
     "summary": "Paradis exclusif en bord de mer...",
     "hero": {
       "title": "Votre Escapade Privée dans les Caraïbes",
       "ctaText": "Découvrir l'Île"
     }
   }
   ```

3. **Update VILLA_LANGUAGES** in `[slug]/[lang].astro`:
   ```javascript
   const VILLA_LANGUAGES = {
     'casa-de-la-muralla': ['en', 'es', 'fr'], // ← Add 'fr'
   };
   ```

4. **Test**:
   ```bash
   npm run dev
   # Visit: http://localhost:4323/villas/casa-de-la-muralla/fr/
   ```

---

### CLI Method (Automated)

```bash
npm run villa:create
```

**Prompts**:
```
1. Villa Name: Casa de la Muralla
2. Slug: casa-de-la-muralla
3. Owner Email: owner@example.com
4. Location: Cartagena, Colombia
5. Languages (comma-separated): en,es,fr  ← Multiple languages
```

**Output**:
```
✅ JSON created: src/content/villas/casa-de-la-muralla.en.json
✅ JSON created: src/content/villas/casa-de-la-muralla.es.json
✅ JSON created: src/content/villas/casa-de-la-muralla.fr.json
✅ Added 'casa-de-la-muralla' to villas/[slug]/[lang].astro (languages: en, es, fr)
```

**Non-English files** contain `[ES: TRANSLATE]` markers for fields needing translation:
```json
{
  "summary": "[ES: TRANSLATE] Exclusive luxury retreat...",
  "hero": {
    "title": "[ES: TRANSLATE] Your Private Caribbean Island Escape"
  }
}
```

---

## Translation Workflow

### Option 1: Manual Translation
1. Hire translator on Upwork (£0.05-£0.10 per word)
2. Send them English JSON
3. Receive translated JSON
4. Copy-paste into `.es.json`, `.fr.json`, etc.

### Option 2: AI Translation (DeepL API)
```javascript
// Future enhancement
import { translateJSON } from './lib/translate';

const englishData = await import('./villas/casa.en.json');
const spanishData = await translateJSON(englishData, 'es');
fs.writeFileSync('casa.es.json', JSON.stringify(spanishData, null, 2));
```

### Option 3: Google Translate (Quick/Dirty)
1. Copy English JSON to Google Translate
2. Translate block-by-block (avoid breaking JSON structure)
3. Fix quotes and formatting
4. **Not recommended for production** (quality too low for luxury villas)

---

## SEO Strategy per Language

### English (en)
**Target**: USA, UK, Australia, global tourists
**Keywords**: "luxury villa rental", "private estate", "exclusive retreat"
**Pricing**: USD ($)

### Spanish (es)
**Target**: Spain, Mexico, Argentina, Colombia
**Keywords**: "villa de lujo", "alquiler exclusivo", "retiro privado"
**Pricing**: EUR (€) or USD ($)

### French (fr)
**Target**: France, Belgium, Switzerland
**Keywords**: "villa de luxe", "location exclusive", "domaine privé"
**Pricing**: EUR (€)

### Greek (el)
**Target**: Greece, Cyprus
**Keywords**: "πολυτελής βίλα", "ιδιωτικό καταφύγιο"
**Pricing**: EUR (€)

**JSON-LD**: Language-specific `inLanguage` property auto-set:
```json
{
  "@type": "WebSite",
  "inLanguage": "es-ES"  ← Dynamic based on URL
}
```

---

## Common Pitfalls

### ❌ Missing Translation Markers
**Problem**: Forgot to translate field, shows English text on Spanish page

**Fix**: Search for `[ES: TRANSLATE]` markers before deploying

### ❌ Broken JSON Structure
**Problem**: Translator added/removed fields, breaks site

**Fix**: Use JSON validation:
```bash
node scripts/validate-i18n.mjs
```

### ❌ Forgot to Update VILLA_LANGUAGES
**Problem**: Created `.fr.json` but didn't add to routes → 404

**Fix**: Always update `VILLA_LANGUAGES` constant after adding language files

### ❌ Inconsistent Amenities Count
**Problem**: English has 20 amenities, Spanish has 15 → layout breaks

**Fix**: Keep amenity arrays identical length across languages (just translate text)

---

## Testing Checklist

Before deploying new language:

- [ ] JSON file exists: `src/content/villas/{slug}.{lang}.json`
- [ ] VILLA_LANGUAGES updated with new language code
- [ ] No `[TRANSLATE]` markers remaining
- [ ] All fields translated (not just copy-pasted English)
- [ ] Amenities count matches English version
- [ ] FAQ questions/answers translated
- [ ] CTA button text translated (`hero.ctaText`)
- [ ] Test URL loads: `/villas/{slug}/{lang}/`
- [ ] Language switcher shows all languages
- [ ] Hreflang tags present in HTML `<head>`
- [ ] Canonical points to correct language URL
- [ ] JSON-LD `inLanguage` matches locale

---

## Business Impact

### Revenue Multiplier
**Before**: 1 site = 1 market (English-only = USA/UK)  
**After**: 1 site = 3+ markets (EN + ES + FR = global reach)

**Example**: Casa de la Muralla (Colombia villa)
- **English**: American/British/Australian tourists
- **Spanish**: Colombian, Spanish, Mexican tourists
- **Result**: 2-3× more bookings from same marketing spend

### Cold Email Strategy
**Subject Line**:
- EN: "I Built You a Free Website (See It Now)"
- ES: "Te Construí un Sitio Web Gratis (Míralo Ahora)"

**Demo Link**:
- Owner speaks Spanish? Send `/villas/{slug}/es/`
- Owner speaks English? Send `/villas/{slug}/en/`

**Higher conversion**: Owner sees site in their native language → feels personal, not templated

---

## Future Enhancements

### Phase 1 (Manual)
- ✅ Multi-language routing
- ✅ Hreflang tags
- ✅ Language switcher UI
- ✅ CLI support

### Phase 2 (Automation)
- [ ] DeepL API integration for auto-translation
- [ ] JSON validation script (detect missing translations)
- [ ] Language-specific pricing (EUR vs USD)
- [ ] Locale-specific date formats

### Phase 3 (Advanced)
- [ ] Right-to-left (RTL) support for Arabic villas
- [ ] Currency switcher (tied to language)
- [ ] Localized inquiry forms (language-aware emails)
- [ ] Country-specific phone numbers in WhatsApp button

---

## File Reference

**Key Files**:
- `/src/pages/villas/[slug]/[lang].astro` — Multi-language routing
- `/src/layouts/BaseLayout.astro` — Hreflang tag injection
- `/src/content/villas/*.{lang}.json` — Translated content
- `/scripts/create-villa.mjs` — CLI with language support
- `/scripts/validate-i18n.mjs` — Translation checker (planned)

---

## Quick Reference

### Add Language to New Villa (CLI)
```bash
npm run villa:create
# Answer: en,es,fr when prompted for languages
```

### Add Language to Existing Villa (Manual)
```bash
# 1. Copy English JSON
cp src/content/villas/villa.en.json src/content/villas/villa.es.json

# 2. Translate content in .es.json

# 3. Update routes
# Edit: src/pages/villas/[slug]/[lang].astro
# Add: 'villa-name': ['en', 'es']

# 4. Test
npm run dev
# Visit: /villas/villa-name/es/
```

### Check Translation Status
```bash
# Future tool
npm run villa:check-translations
```

---

**Last updated**: November 26, 2025  
**Status**: Production-ready, tested on Casa de la Muralla (EN/ES) and Domaine des Montarels (EN/ES/FR)
