import { getServicesConfig } from '../config/services';

export type GenericReview = { quote: string; attribution: string };

type BuildSchemaInput = {
  villa: any;
  slug: string;
  lang: string;
  langMeta: { locale: string };
  siteBase: string;
  canonical: string;
  pageTitle: string;
  heroImages: string[];
  genericReviews: GenericReview[];
};

const ensureTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

const toAbsolute = (base: string, path?: string | null) => {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = ensureTrailingSlash(base);
  const cleaned = path.replace(/^\//, '');
  return `${normalizedBase}${cleaned}`;
};

export function buildSchemaGraph(input: BuildSchemaInput) {
  const { villa, slug, lang, langMeta, siteBase, canonical, pageTitle, heroImages, genericReviews } = input;

  const base = ensureTrailingSlash(siteBase);
  const images: Array<{ src: string; alt?: string; caption?: string }> = Array.isArray(villa.images) ? villa.images : [];

  const servicesConfig = getServicesConfig(slug);
  const currency = servicesConfig.priceCurrency || 'EUR';

  const prioritizedSources = [
    ...heroImages,
    ...images.map((img) => img.src)
  ];

  const uniqueSrcs = Array.from(new Set(prioritizedSources.filter(Boolean)));
  const MAX_IMAGES = 18;
  const selectedSrcs = uniqueSrcs.slice(0, MAX_IMAGES);

  const imageObjects = selectedSrcs.map((src, index) => {
    const meta = images.find((img) => img.src === src) || { alt: villa.name, caption: '' };
    const absolute = toAbsolute(base, src)!;
    const obj: any = {
      '@type': 'ImageObject',
      contentUrl: absolute,
      url: absolute,
      representativeOfPage: index === 0
    };
    if (meta.alt) obj.caption = meta.alt;
    if (meta.caption) obj.description = meta.caption;
    return obj;
  });

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}#organization`,
    name: villa.name,
    url: base,
    logo: `${base}images/logo.webp`,
    brand: villa.name
  };

  const primaryImage = imageObjects[0]?.url ?? toAbsolute(base, heroImages[0]);

  const lodgingSchema = {
    '@context': 'https://schema.org',
    '@type': ['LodgingBusiness', 'LocalBusiness'],
    '@id': `${base}#lodging`,
    name: villa.name,
    description: villa.summary,
    image: primaryImage,
    priceRange: '$$$$',
    url: canonical,
    brand: { '@id': `${base}#organization` }
  };

  const amenityFeatures = Array.isArray(villa.amenities)
    ? villa.amenities.map((name: string) => ({
        '@type': 'LocationFeatureSpecification',
        name,
        value: true
      }))
    : [];

  const lodging = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${canonical}#lodging-business`,
    name: villa.name,
    description: villa.summary,
    url: canonical,
    image: imageObjects.map((item) => item.url),
    amenityFeature: amenityFeatures,
    priceRange: '$$$$',
    maximumAttendeeCapacity: villa.specs?.guests || undefined,
    offers: {
      '@type': 'Offer',
      url: canonical,
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'PriceSpecification',
        priceCurrency: currency
      }
    }
  };

  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: pageTitle,
    url: canonical,
    inLanguage: langMeta.locale,
    primaryImageOfPage: imageObjects[0] || undefined
  };

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: villa.name, item: canonical }
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}#website`,
    name: villa.name,
    url: base,
    publisher: { '@id': `${base}#organization` },
    inLanguage: langMeta.locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const faqSchema = Array.isArray(villa.content?.faq) && villa.content.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: villa.content.faq.map((entry: any) => ({
          '@type': 'Question',
          name: entry.q,
          acceptedAnswer: { '@type': 'Answer', text: entry.a }
        }))
      }
    : null;

  type ServiceNode = {
    '@context': 'https://schema.org';
    '@type': 'Service';
    '@id': string;
    name: string;
    description?: string;
    provider: { '@id': string };
    areaServed?: string;
    serviceType?: string;
  };

  const serviceNodes: ServiceNode[] = servicesConfig.services.map((svc) => {
    const node: ServiceNode = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${base}#service-${svc.id}`,
      name: svc.name,
      provider: { '@id': `${base}#lodging` }
    };

    if (svc.description) node.description = svc.description;
    if (svc.areaServed) node.areaServed = svc.areaServed;

    return node;
  });

  const offerCatalog = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    '@id': `${base}#offer-catalog`,
    name: servicesConfig.catalogName || 'Concierge & Experiences',
    url: canonical,
    itemListElement: servicesConfig.services.map((svc, index) => ({
      '@type': 'Offer',
      itemOffered: { '@id': serviceNodes[index]['@id'] },
      availability: svc.availability ?? 'https://schema.org/InStock',
      priceSpecification: { '@type': 'PriceSpecification', priceCurrency: currency },
      url: canonical
    }))
  };

  const reviewNodes = genericReviews.map((review) => ({
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewBody: review.quote,
    author: {
      '@type': 'Person',
      name: review.attribution.replace(/\s+—\s+Google Reviews$/i, '')
    },
    publisher: {
      '@type': 'Organization',
      name: 'Google Reviews'
    }
  }));

  const jsonLd = [
    org,
    websiteSchema,
    webPage,
    breadcrumbs,
    lodgingSchema,
    {
      ...lodging,
      review: reviewNodes
    },
    ...(faqSchema ? [faqSchema] : []),
    offerCatalog,
    ...serviceNodes,
    ...reviewNodes,
    ...imageObjects.map((object) => ({ '@context': 'https://schema.org', ...object }))
  ];

  return jsonLd;
}

// ============================================================================
// Auxiliary Page Schema (for contact, rates, terms, privacy, about pages)
// ============================================================================

type AuxPageType = 'contact' | 'rates' | 'terms' | 'privacy' | 'about' | 'thank-you';

type BuildAuxPageSchemaInput = {
  pageType: AuxPageType;
  pageTitle: string;
  pageDescription: string;
  canonical: string;
  siteBase: string;
  villaName: string;
  slug: string;
  lang: string;
  locale: string;
};

/**
 * Builds a minimal schema graph for auxiliary pages.
 * Includes: Organization, WebSite, WebPage, BreadcrumbList
 * Contact page additionally includes ContactPage schema type.
 */
export function buildAuxPageSchema(input: BuildAuxPageSchemaInput) {
  const {
    pageType,
    pageTitle,
    pageDescription,
    canonical,
    siteBase,
    villaName,
    slug,
    lang,
    locale
  } = input;

  const base = ensureTrailingSlash(siteBase);
  const villaPageUrl = `${base}villas/${slug}/${lang}/`;

  // Organization (reference to main brand)
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${base}#organization`,
    name: villaName,
    url: villaPageUrl,
    logo: toAbsolute(base, `/images/villas/${slug}/logo.webp`)
  };

  // WebSite (reference)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}#website`,
    url: base,
    name: villaName,
    publisher: { '@id': `${base}#organization` }
  };

  // Page type label mapping
  const pageLabels: Record<AuxPageType, Record<string, string>> = {
    contact: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
    rates: { en: 'Rates & Availability', es: 'Tarifas y Disponibilidad', fr: 'Tarifs et Disponibilité' },
    terms: { en: 'Terms & Conditions', es: 'Términos y Condiciones', fr: 'Conditions Générales' },
    privacy: { en: 'Privacy Policy', es: 'Política de Privacidad', fr: 'Politique de Confidentialité' },
    about: { en: 'About', es: 'Acerca de', fr: 'À propos' },
    'thank-you': { en: 'Thank You', es: 'Gracias', fr: 'Merci' }
  };

  const pageLabel = pageLabels[pageType]?.[lang] || pageLabels[pageType]?.en || pageType;

  // WebPage (with ContactPage for contact page)
  const webPageType = pageType === 'contact' ? ['WebPage', 'ContactPage'] : 'WebPage';
  const webPage = {
    '@context': 'https://schema.org',
    '@type': webPageType,
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: pageTitle,
    description: pageDescription,
    inLanguage: locale,
    isPartOf: { '@id': `${base}#website` },
    about: { '@id': `${base}#organization` }
  };

  // BreadcrumbList
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumbs`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: villaName,
        item: villaPageUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pageLabel
      }
    ]
  };

  return [org, websiteSchema, webPage, breadcrumbs];
}
