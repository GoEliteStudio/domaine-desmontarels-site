export interface ServiceConfig {
  /** Stable identifier used for Schema.org @id suffixes */
  id: string;
  /** Human-friendly service name */
  name: string;
  /** Optional descriptive copy exposed in structured data */
  description?: string;
  /** Optional region hint for areaServed */
  areaServed?: string;
  /** Optional availability URL or schema enum */
  availability?: string;
}

export interface VillaServicesConfig {
  /** Collection of concierge services for the villa */
  services: ServiceConfig[];
  /** Catalog name surfaced in OfferCatalog */
  catalogName?: string;
  /** Preferred currency code for price specifications */
  priceCurrency?: string;
}

const DEFAULT_SERVICES: ServiceConfig[] = [
  {
    id: 'private-chef',
    name: 'Private Chef',
    description: 'In-villa dining with curated menus tailored to each stay.'
  },
  {
    id: 'airport-transfers',
    name: 'Airport Transfers',
    description: 'Private door-to-door transfers for arrivals and departures.'
  },
  {
    id: 'daily-housekeeping',
    name: 'Daily Housekeeping',
    description: 'Discreet daily tidy and mid-stay refresh service.'
  }
];

const DEFAULT_CONFIG: VillaServicesConfig = {
  services: DEFAULT_SERVICES,
  catalogName: 'Concierge & Experiences',
  priceCurrency: 'EUR'
};

const VILLA_SERVICES: Record<string, Partial<VillaServicesConfig>> = {
  'domaine-des-montarels': {
    priceCurrency: 'EUR',
    services: [
      {
        id: 'private-chef',
        name: 'Private Chef',
        description: 'Seasonal Languedoc menus prepared in the estate kitchen.'
      },
      {
        id: 'vineyard-tours',
        name: 'Private Vineyard Tours',
        description: 'Curated tastings and lunches with neighbouring wineries.'
      },
      {
        id: 'airport-transfers',
        name: 'Airport Transfers',
        description: 'Private chauffeured transfers from Béziers, Montpellier, or Toulouse.'
      }
    ]
  },
  'casa-de-la-muralla': {
    priceCurrency: 'USD',
    services: [
      {
        id: 'private-chef',
        name: 'Private Chef & Breakfast',
        description: 'Chef-prepared Caribbean menus with daily breakfast service.'
      },
      {
        id: 'boat-transfers',
        name: 'Private Boat Transfers',
        description: 'Direct Cartagena ↔ Tierrabomba transfers and sunset cruises.',
        areaServed: 'Cartagena, Colombia'
      },
      {
        id: 'island-experiences',
        name: 'Island Experiences',
        description: 'Yacht charters, Rosario Islands excursions, and curated local guides.'
      }
    ]
  }
};

export function getServicesConfig(slug: string): VillaServicesConfig {
  const overrides = VILLA_SERVICES[slug] ?? {};
  const services = overrides.services && overrides.services.length > 0 ? overrides.services : DEFAULT_CONFIG.services;
  const catalogName = overrides.catalogName ?? DEFAULT_CONFIG.catalogName;
  const priceCurrency = overrides.priceCurrency ?? DEFAULT_CONFIG.priceCurrency;

  return { services, catalogName, priceCurrency };
}
