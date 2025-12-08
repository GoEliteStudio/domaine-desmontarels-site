export type SupportedLang = 'en' | 'es' | 'fr' | 'el' | 'ru';

// Fallback-safe accessor
export function getUIStrings(lang: string) {
  const safeLang: SupportedLang = (['en', 'es', 'fr', 'el', 'ru'] as const).includes(lang as SupportedLang)
    ? (lang as SupportedLang)
    : 'en';
  return UI_STRINGS[safeLang];
}

export const UI_STRINGS: Record<SupportedLang, any> = {
  en: {
    trustBar: {
      flexibleCancellationTitle: 'Flexible Cancellation',
      flexibleCancellationDetail: 'Full refund up to 60 days prior',
      secureContractTitle: 'Secure Contract',
      secureContractDetail: 'Stripe-protected agreements',
      conciergeTitle: 'Concierge',
      conciergeDetail: 'Personal assistance included',
      transparentPricingTitle: 'Transparent Pricing',
      transparentPricingDetail: 'No hidden booking fees'
    },
    specs: {
      bedrooms: 'Bedrooms',
      baths: 'Baths',
      guests: 'Guests',
      size: 'Sq. Ft.',
      locationFallback: 'Location',
      pool: 'Pool',
      poolFallback: 'Private Pool'
    },
    tabs: {
      overviewLabel: 'Overview',
      amenitiesLabel: 'Amenities',
      amenitiesHeading: 'Signature Features',
      locationLabel: 'Location',
      practicalDetailsLabel: 'Practical Details',
      practicalDetailsHeading: 'Practical Details',
      bedroomsLabel: 'Bedrooms',
      bedroomsHeading: 'Bedrooms & Baths',
      familyLabel: 'Family & Recreation',
      familyHeading: 'Family & Recreation',
      gettingHereLabel: 'Getting Here',
      gettingHereHeading: 'Travel & Access',
      faqLabel: 'FAQ',
      faqHeading: 'Frequently Asked Questions'
    },
    hosts: {
      heading: 'Meet Your Hosts',
      itinerary: 'Personal itinerary planning',
      discreet: 'Discreet, privacy‑first hosting'
    },
    testimonials: {
      heading: 'Guest Words'
    },
    header: {
      navigation: [
        { label: 'Overview', href: '#overview' },
        { label: 'Amenities', href: '#amenities' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Location', href: '#location' },
        { label: 'Hosts', href: '#hosts' },
        { label: 'Contact', href: '#contact' }
      ],
      inquireCta: 'Inquire'
    },
    fixedPanel: {
      availabilityHeading: 'Availability',
      availabilityText: 'We confirm dates by email within 24 hours. Ask about flexible check-in/out and mid-stay cleaning.',
      ctaLabel: 'Check Dates, Guests, and Inquiry'
    },
    footer: {
      brandDescription: 'Retreat to a serene and singular escape—an island hideaway where the sea and sky blend into a living postcard. Every space has been crafted for ease, comfort, and unforgettable moments. Just 15 minutes from Cartagena by private boat, Casa de la Muralla offers the privilege of true seclusion on the shores of Tierrabomba.',
      exploreHeading: 'Explore',
      exploreLinks: [
        { label: 'Overview', href: '#overview' },
        { label: 'Amenities', href: '#amenities' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Location', href: '#location' }
      ],
      infoHeading: 'Information',
      infoLinks: [
        { label: 'Rates & Seasons', href: '/rates' },
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' }
      ],
      contactHeading: 'Contact',
      contactLinks: [
        { label: '+1 555 123 4567', href: 'tel:+15551234567' },
        { label: 'info@villa.com', href: 'mailto:info@villa.com' },
        { label: 'Contact Us', href: '/contact' }
      ],
      copyrightSuffix: 'All rights reserved. | Luxury Villa Retreat'
    },
    search: {
      triggerLabel: 'Search FAQs & amenities',
      modalHeading: 'Search Details',
      placeholder: 'Type to search FAQs, amenities...',
      closeLabel: 'Close search',
      resultSingular: 'result',
      resultPlural: 'results'
    },
    hero: {
      defaultCta: 'Discover'
    },
    contact: {
      pageTitle: 'Contact Us',
      subtitle: 'Ready to experience {villaName}? Fill out the form below and our concierge team will respond within 24 hours with availability and a personalized quote.',
      formLabels: {
        fullName: 'Full Name',
        email: 'Email',
        phone: 'Phone',
        guests: 'Number of Guests',
        guestsPlaceholder: 'Select...',
        guestsOptions: ['1-2 guests', '3-4 guests', '5-6 guests', '7-8 guests', '9-12 guests', '13+ guests'],
        checkIn: 'Check-in Date',
        checkOut: 'Check-out Date',
        message: 'Message',
        messagePlaceholder: 'Tell us about your trip — special occasions, questions, or requests...',
        newsletter: 'Keep me updated on special offers and news',
        submit: 'Send Inquiry',
        required: '*'
      },
      formNote: 'By submitting this form, you agree to our {privacyLink} and {termsLink}.',
      privacyLabel: 'Privacy Policy',
      termsLabel: 'Terms & Conditions',
      sidebar: {
        heading: 'Prefer to Talk?',
        description: 'Our concierge team is available to assist you directly.',
        responseTime: 'Response within 24 hours',
        whatsappLabel: 'WhatsApp Us'
      },
      expectations: {
        heading: 'What to Expect',
        items: [
          { title: 'Quick Response', description: 'We reply within 24 hours, often sooner' },
          { title: 'Personalized Quote', description: 'Tailored pricing based on your dates and needs' },
          { title: 'Local Expertise', description: 'Insider tips and experience planning included' },
          { title: 'No Obligation', description: 'Ask questions freely — no commitment required' }
        ]
      }
    },
    thankYou: {
      pageTitle: 'Thank You',
      heading: 'Thank You!',
      subtitle: 'Your inquiry has been received. Our concierge team will review your request and respond within 24 hours.',
      nextSteps: {
        heading: 'What Happens Next?',
        steps: [
          { title: 'We\'ll review your request', description: 'Our team will check availability for your dates' },
          { title: 'Personalized quote', description: 'You\'ll receive a detailed proposal via email' },
          { title: 'Finalize your booking', description: 'We\'ll guide you through the reservation process' }
        ]
      },
      backToVilla: 'Back to {villaName}',
      viewGallery: 'View Gallery',
      contactNote: 'Questions? Contact us directly at'
    },
    rates: {
      pageTitle: 'Rates & Seasons',
      intro: '{villaName} offers different rates depending on the season. For exact pricing and availability, please contact our concierge team who will provide a personalized quote based on your travel dates.',
      seasonalPricing: 'Seasonal Pricing',
      seasonalPricingIntro: 'Our rates vary throughout the year based on demand and local events:',
      highSeason: 'High Season',
      highSeasonDates: 'December – March & July – August',
      highSeasonDesc: 'Peak travel periods with the highest demand. Book early to secure your preferred dates.',
      midSeason: 'Mid Season',
      midSeasonDates: 'April – June & September – October',
      midSeasonDesc: 'Pleasant weather with moderate rates. An excellent balance of value and experience.',
      lowSeason: 'Low Season',
      lowSeasonDates: 'November',
      lowSeasonDesc: 'Best value rates with fewer crowds. Perfect for those seeking tranquility.',
      whatsIncluded: "What's Included",
      includedItems: [
        'Full use of the villa and all amenities',
        'Daily housekeeping service',
        'Dedicated concierge support',
        'Private chef services (groceries extra)',
        'Airport transfers coordination',
        '24/7 security'
      ],
      additionalServices: 'Additional Services',
      additionalServicesIntro: 'We can arrange a variety of additional experiences and services at an extra cost:',
      additionalItems: [
        'Private yacht charters',
        'Spa treatments and wellness sessions',
        'Guided excursions and tours',
        'Special event coordination (weddings, celebrations)',
        'Extended late checkout or early check-in'
      ],
      ctaHeading: 'Get Your Personalized Quote',
      ctaText: 'Every stay is unique. Contact us with your preferred dates and group size, and we\'ll provide a detailed quote tailored to your needs.',
      ctaButton: 'Contact Us for Rates'
    },
    terms: {
      pageTitle: 'Terms & Conditions',
      jurisdictionHeading: 'Jurisdiction',
      contactHeading: 'Contact',
      contactPrefix: 'For questions or assistance:'
    },
    privacy: {
      pageTitle: 'Privacy Policy',
      intro: 'Your privacy matters to us. This policy explains what we collect and how we use it at {villaName}.',
      infoCollectHeading: 'Information We Collect',
      infoCollectItems: [
        'Inquiry form details (name, email, phone, stay preferences)',
        'Basic site analytics (anonymous usage patterns)',
        'Communication records for booking coordination'
      ],
      howWeUseHeading: 'How We Use Your Data',
      howWeUseText: 'We use inquiry data solely to respond to booking or information requests. We never sell, rent, or share personal information with third parties for marketing purposes.',
      cookiesHeading: 'Cookies',
      cookiesText: 'Essential cookies ensure site functionality. Optional analytics cookies may be introduced with explicit consent. You can manage cookie preferences in your browser settings.',
      retentionHeading: 'Data Retention',
      retentionText: 'Inquiry emails and booking records are retained for reference and accounting compliance. You may request deletion of your data at any time.',
      rightsHeading: 'Your Rights',
      rightsText: 'You have the right to access, correct, or erase your personal data. To exercise these rights, contact us at',
      contactHeading: 'Contact',
      contactText: 'Questions about our privacy practices? Email'
    }
  },
  es: {
    trustBar: {
      flexibleCancellationTitle: 'Cancelación flexible',
      flexibleCancellationDetail: 'Reembolso completo hasta 60 días antes',
      secureContractTitle: 'Contrato seguro',
      secureContractDetail: 'Acuerdos protegidos por Stripe',
      conciergeTitle: 'Conserjería',
      conciergeDetail: 'Asistencia personal incluida',
      transparentPricingTitle: 'Precios transparentes',
      transparentPricingDetail: 'Sin comisiones ocultas de reserva'
    },
    specs: {
      bedrooms: 'Dormitorios',
      baths: 'Baños',
      guests: 'Huéspedes',
      size: 'm²',
      locationFallback: 'Ubicación',
      pool: 'Piscina',
      poolFallback: 'Piscina privada'
    },
    tabs: {
      overviewLabel: 'Descripción',
      amenitiesLabel: 'Servicios',
      amenitiesHeading: 'Características destacadas',
      locationLabel: 'Ubicación',
      practicalDetailsLabel: 'Detalles prácticos',
      practicalDetailsHeading: 'Detalles prácticos',
      bedroomsLabel: 'Dormitorios',
      bedroomsHeading: 'Dormitorios y baños',
      familyLabel: 'Familia y recreación',
      familyHeading: 'Familia y recreación',
      gettingHereLabel: 'Cómo llegar',
      gettingHereHeading: 'Viaje y acceso',
      faqLabel: 'Preguntas frecuentes',
      faqHeading: 'Preguntas frecuentes'
    },
    hosts: {
      heading: 'Conozca a sus anfitriones',
      itinerary: 'Planificación personalizada del itinerario',
      discreet: 'Atención discreta y enfocada en la privacidad'
    },
    testimonials: {
      heading: 'Opiniones de huéspedes'
    },
    header: {
      navigation: [
        { label: 'Descripción', href: '#overview' },
        { label: 'Servicios', href: '#amenities' },
        { label: 'Galería', href: '#gallery' },
        { label: 'Ubicación', href: '#location' },
        { label: 'Anfitriones', href: '#hosts' },
        { label: 'Contacto', href: '#contact' }
      ],
      inquireCta: 'Consultar'
    },
    fixedPanel: {
      availabilityHeading: 'Disponibilidad',
      availabilityText: 'Confirmamos fechas en 24 horas. Pregunta por nuestras experiencias exclusivas y el concierge VIP.',
      ctaLabel: 'Comprobar disponibilidad y consulta'
    },
    footer: {
      brandDescription: 'Retírate a un refugio sereno y singular: un escondite isleño donde el mar y el cielo se funden en una postal viva. Cada espacio ha sido diseñado para el confort, la facilidad y momentos inolvidables. A solo 15 minutos de Cartagena en lancha privada, Casa de la Muralla ofrece el privilegio de la verdadera privacidad en Tierrabomba.',
      exploreHeading: 'Explorar',
      exploreLinks: [
        { label: 'Descripción', href: '#overview' },
        { label: 'Servicios', href: '#amenities' },
        { label: 'Galería', href: '#gallery' },
        { label: 'Ubicación', href: '#location' }
      ],
      infoHeading: 'Información',
      infoLinks: [
        { label: 'Tarifas y Temporadas', href: '/rates' },
        { label: 'Términos y Condiciones', href: '/terms' },
        { label: 'Política de Privacidad', href: '/privacy' }
      ],
      contactHeading: 'Contacto',
      contactLinks: [
        { label: '+1 555 123 4567', href: 'tel:+15551234567' },
        { label: 'info@villa.com', href: 'mailto:info@villa.com' },
        { label: 'Contáctenos', href: '/contact' }
      ],
      copyrightSuffix: 'Todos los derechos reservados. | Retiro de villa de lujo'
    },
    search: {
      triggerLabel: 'Buscar preguntas y servicios',
      modalHeading: 'Buscar detalles',
      placeholder: 'Escriba para buscar preguntas, servicios...',
      closeLabel: 'Cerrar búsqueda',
      resultSingular: 'resultado',
      resultPlural: 'resultados'
    },
    hero: {
      defaultCta: 'Descubrir'
    },
    contact: {
      pageTitle: 'Contáctenos',
      subtitle: '¿Listo para vivir la experiencia de {villaName}? Complete el formulario y nuestro equipo de conserjería le responderá en 24 horas con disponibilidad y un presupuesto personalizado.',
      formLabels: {
        fullName: 'Nombre completo',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        guests: 'Número de huéspedes',
        guestsPlaceholder: 'Seleccionar...',
        guestsOptions: ['1-2 huéspedes', '3-4 huéspedes', '5-6 huéspedes', '7-8 huéspedes', '9-12 huéspedes', '13+ huéspedes'],
        checkIn: 'Fecha de llegada',
        checkOut: 'Fecha de salida',
        message: 'Mensaje',
        messagePlaceholder: 'Cuéntenos sobre su viaje — ocasiones especiales, preguntas o solicitudes...',
        newsletter: 'Manténgame informado sobre ofertas especiales y novedades',
        submit: 'Enviar consulta',
        required: '*'
      },
      formNote: 'Al enviar este formulario, acepta nuestra {privacyLink} y nuestros {termsLink}.',
      privacyLabel: 'Política de Privacidad',
      termsLabel: 'Términos y Condiciones',
      sidebar: {
        heading: '¿Prefiere hablar?',
        description: 'Nuestro equipo de conserjería está disponible para asistirle directamente.',
        responseTime: 'Respuesta en 24 horas',
        whatsappLabel: 'Escríbanos por WhatsApp'
      },
      expectations: {
        heading: 'Qué esperar',
        items: [
          { title: 'Respuesta rápida', description: 'Respondemos en 24 horas, a menudo antes' },
          { title: 'Presupuesto personalizado', description: 'Precios adaptados según sus fechas y necesidades' },
          { title: 'Experiencia local', description: 'Consejos de expertos y planificación de experiencias incluidos' },
          { title: 'Sin compromiso', description: 'Haga preguntas libremente — sin obligación' }
        ]
      }
    },
    thankYou: {
      pageTitle: 'Gracias',
      heading: '¡Gracias!',
      subtitle: 'Su consulta ha sido recibida. Nuestro equipo de conserjería revisará su solicitud y le responderá en 24 horas.',
      nextSteps: {
        heading: '¿Qué sigue?',
        steps: [
          { title: 'Revisaremos su solicitud', description: 'Nuestro equipo verificará disponibilidad para sus fechas' },
          { title: 'Presupuesto personalizado', description: 'Recibirá una propuesta detallada por email' },
          { title: 'Finalizar su reserva', description: 'Le guiaremos en el proceso de reserva' }
        ]
      },
      backToVilla: 'Volver a {villaName}',
      viewGallery: 'Ver Galería',
      contactNote: '¿Preguntas? Contáctenos directamente en'
    },
    rates: {
      pageTitle: 'Tarifas y Temporadas',
      intro: '{villaName} ofrece diferentes tarifas según la temporada. Para precios exactos y disponibilidad, contacte a nuestro equipo de conserjería quienes le proporcionarán un presupuesto personalizado según sus fechas de viaje.',
      seasonalPricing: 'Precios por Temporada',
      seasonalPricingIntro: 'Nuestras tarifas varían a lo largo del año según la demanda y eventos locales:',
      highSeason: 'Temporada Alta',
      highSeasonDates: 'Diciembre – Marzo y Julio – Agosto',
      highSeasonDesc: 'Períodos de mayor demanda. Reserve con anticipación para asegurar sus fechas preferidas.',
      midSeason: 'Temporada Media',
      midSeasonDates: 'Abril – Junio y Septiembre – Octubre',
      midSeasonDesc: 'Clima agradable con tarifas moderadas. Un excelente equilibrio entre valor y experiencia.',
      lowSeason: 'Temporada Baja',
      lowSeasonDates: 'Noviembre',
      lowSeasonDesc: 'Las mejores tarifas con menos afluencia. Perfecto para quienes buscan tranquilidad.',
      whatsIncluded: 'Qué Está Incluido',
      includedItems: [
        'Uso completo de la villa y todas las comodidades',
        'Servicio de limpieza diario',
        'Soporte de conserjería dedicado',
        'Servicios de chef privado (compras adicionales)',
        'Coordinación de traslados al aeropuerto',
        'Seguridad 24/7'
      ],
      additionalServices: 'Servicios Adicionales',
      additionalServicesIntro: 'Podemos organizar una variedad de experiencias y servicios adicionales con costo extra:',
      additionalItems: [
        'Alquiler de yates privados',
        'Tratamientos de spa y bienestar',
        'Excursiones y tours guiados',
        'Coordinación de eventos especiales (bodas, celebraciones)',
        'Salida tardía o entrada anticipada extendida'
      ],
      ctaHeading: 'Obtenga Su Presupuesto Personalizado',
      ctaText: 'Cada estadía es única. Contáctenos con sus fechas preferidas y tamaño del grupo, y le proporcionaremos un presupuesto detallado adaptado a sus necesidades.',
      ctaButton: 'Contáctenos para Tarifas'
    },
    terms: {
      pageTitle: 'Términos y Condiciones',
      jurisdictionHeading: 'Jurisdicción',
      contactHeading: 'Contacto',
      contactPrefix: 'Para preguntas o asistencia:'
    },
    privacy: {
      pageTitle: 'Política de Privacidad',
      intro: 'Su privacidad es importante para nosotros. Esta política explica qué recopilamos y cómo lo usamos en {villaName}.',
      infoCollectHeading: 'Información que Recopilamos',
      infoCollectItems: [
        'Detalles del formulario de consulta (nombre, email, teléfono, preferencias de estadía)',
        'Analíticas básicas del sitio (patrones de uso anónimos)',
        'Registros de comunicación para coordinación de reservas'
      ],
      howWeUseHeading: 'Cómo Usamos Sus Datos',
      howWeUseText: 'Usamos los datos de consulta únicamente para responder a solicitudes de reserva o información. Nunca vendemos, alquilamos ni compartimos información personal con terceros para fines de marketing.',
      cookiesHeading: 'Cookies',
      cookiesText: 'Las cookies esenciales aseguran la funcionalidad del sitio. Las cookies analíticas opcionales pueden introducirse con consentimiento explícito. Puede gestionar las preferencias de cookies en la configuración de su navegador.',
      retentionHeading: 'Retención de Datos',
      retentionText: 'Los correos de consulta y registros de reserva se conservan para referencia y cumplimiento contable. Puede solicitar la eliminación de sus datos en cualquier momento.',
      rightsHeading: 'Sus Derechos',
      rightsText: 'Tiene derecho a acceder, corregir o eliminar sus datos personales. Para ejercer estos derechos, contáctenos en',
      contactHeading: 'Contacto',
      contactText: '¿Preguntas sobre nuestras prácticas de privacidad? Envíe un email a'
    }
  },
  fr: {
    trustBar: {
      flexibleCancellationTitle: 'Annulation flexible',
      flexibleCancellationDetail: 'Remboursement complet jusqu’à 60 jours avant',
      secureContractTitle: 'Contrat sécurisé',
      secureContractDetail: 'Contrats protégés par Stripe',
      conciergeTitle: 'Conciergerie',
      conciergeDetail: 'Assistance personnalisée incluse',
      transparentPricingTitle: 'Tarifs transparents',
      transparentPricingDetail: 'Aucun frais de réservation caché'
    },
    specs: {
      bedrooms: 'Chambres',
      baths: 'Salles de bain',
      guests: 'Invités',
      size: 'm²',
      locationFallback: 'Emplacement',
      pool: 'Piscine',
      poolFallback: 'Piscine privée'
    },
    tabs: {
      overviewLabel: 'Aperçu',
      amenitiesLabel: 'Équipements',
      amenitiesHeading: 'Caractéristiques principales',
      locationLabel: 'Emplacement',
      practicalDetailsLabel: 'Informations pratiques',
      practicalDetailsHeading: 'Informations pratiques',
      bedroomsLabel: 'Chambres',
      bedroomsHeading: 'Chambres et salles de bain',
      familyLabel: 'Famille et loisirs',
      familyHeading: 'Famille et loisirs',
      gettingHereLabel: 'Accès',
      gettingHereHeading: 'Transport et accès',
      faqLabel: 'FAQ',
      faqHeading: 'Questions fréquentes'
    },
    hosts: {
      heading: 'Rencontrez vos hôtes',
      itinerary: 'Planification d’itinéraire personnalisée',
      discreet: 'Accueil discret et respectueux de la vie privée'
    },
    testimonials: {
      heading: 'Avis des clients'
    },
    header: {
      navigation: [
        { label: 'Aperçu', href: '#overview' },
        { label: 'Équipements', href: '#amenities' },
        { label: 'Galerie', href: '#gallery' },
        { label: 'Emplacement', href: '#location' },
        { label: 'Hôtes', href: '#hosts' },
        { label: 'Contact', href: '#contact' }
      ],
      inquireCta: 'Demander'
    },
    fixedPanel: {
      availabilityHeading: 'Disponibilité',
      availabilityText: 'Nous confirmons les dates par email sous 24 heures. Demandez un check-in/out flexible et le ménage en milieu de séjour.',
      ctaLabel: 'Vérifier dates, invités et demande'
    },
    footer: {
      brandDescription: 'Partez pour une escapade unique et sereine : une retraite insulaire où la mer et le ciel se confondent. Chaque espace a été conçu pour le confort, la simplicité et des moments inoubliables. À seulement 15 minutes de Cartagena en bateau privé, Casa de la Muralla offre le privilège d’un isolement total sur les rivages de Tierrabomba.',
      exploreHeading: 'Explorer',
      exploreLinks: [
        { label: 'Aperçu', href: '#overview' },
        { label: 'Équipements', href: '#amenities' },
        { label: 'Galerie', href: '#gallery' },
        { label: 'Emplacement', href: '#location' }
      ],
      infoHeading: 'Informations',
      infoLinks: [
        { label: 'Tarifs et Saisons', href: '/rates' },
        { label: 'Conditions Générales', href: '/terms' },
        { label: 'Politique de Confidentialité', href: '/privacy' }
      ],
      contactHeading: 'Contact',
      contactLinks: [
        { label: '+1 555 123 4567', href: 'tel:+15551234567' },
        { label: 'info@villa.com', href: 'mailto:info@villa.com' },
        { label: 'Nous Contacter', href: '/contact' }
      ],
      copyrightSuffix: 'Tous droits réservés. | Villa de luxe'
    },
    search: {
      triggerLabel: 'Rechercher FAQs et équipements',
      modalHeading: 'Rechercher des détails',
      placeholder: 'Tapez pour rechercher FAQs, équipements...',
      closeLabel: 'Fermer la recherche',
      resultSingular: 'résultat',
      resultPlural: 'résultats'
    },
    hero: {
      defaultCta: 'Découvrir'
    },
    contact: {
      pageTitle: 'Nous Contacter',
      subtitle: 'Prêt à vivre l\'expérience {villaName} ? Remplissez le formulaire ci-dessous et notre équipe de conciergerie vous répondra sous 24 heures avec les disponibilités et un devis personnalisé.',
      formLabels: {
        fullName: 'Nom complet',
        email: 'Email',
        phone: 'Téléphone',
        guests: 'Nombre d\'invités',
        guestsPlaceholder: 'Sélectionner...',
        guestsOptions: ['1-2 invités', '3-4 invités', '5-6 invités', '7-8 invités', '9-12 invités', '13+ invités'],
        checkIn: 'Date d\'arrivée',
        checkOut: 'Date de départ',
        message: 'Message',
        messagePlaceholder: 'Parlez-nous de votre séjour — occasions spéciales, questions ou demandes...',
        newsletter: 'Tenez-moi informé des offres spéciales et actualités',
        submit: 'Envoyer la demande',
        required: '*'
      },
      formNote: 'En soumettant ce formulaire, vous acceptez notre {privacyLink} et nos {termsLink}.',
      privacyLabel: 'Politique de Confidentialité',
      termsLabel: 'Conditions Générales',
      sidebar: {
        heading: 'Préférez-vous parler ?',
        description: 'Notre équipe de conciergerie est disponible pour vous assister directement.',
        responseTime: 'Réponse sous 24 heures',
        whatsappLabel: 'Contactez-nous sur WhatsApp'
      },
      expectations: {
        heading: 'À quoi s\'attendre',
        items: [
          { title: 'Réponse rapide', description: 'Nous répondons sous 24 heures, souvent plus tôt' },
          { title: 'Devis personnalisé', description: 'Tarifs adaptés à vos dates et besoins' },
          { title: 'Expertise locale', description: 'Conseils d\'initiés et planification d\'expériences inclus' },
          { title: 'Sans engagement', description: 'Posez vos questions librement — aucune obligation' }
        ]
      }
    },
    thankYou: {
      pageTitle: 'Merci',
      heading: 'Merci !',
      subtitle: 'Votre demande a été reçue. Notre équipe de conciergerie examinera votre demande et vous répondra sous 24 heures.',
      nextSteps: {
        heading: 'Et ensuite ?',
        steps: [
          { title: 'Nous examinerons votre demande', description: 'Notre équipe vérifiera la disponibilité pour vos dates' },
          { title: 'Devis personnalisé', description: 'Vous recevrez une proposition détaillée par email' },
          { title: 'Finaliser votre réservation', description: 'Nous vous guiderons dans le processus de réservation' }
        ]
      },
      backToVilla: 'Retour à {villaName}',
      viewGallery: 'Voir la Galerie',
      contactNote: 'Des questions ? Contactez-nous directement à'
    },
    rates: {
      pageTitle: 'Tarifs et Saisons',
      intro: '{villaName} propose différents tarifs selon la saison. Pour les prix exacts et la disponibilité, contactez notre équipe de conciergerie qui vous fournira un devis personnalisé selon vos dates de voyage.',
      seasonalPricing: 'Tarification Saisonnière',
      seasonalPricingIntro: 'Nos tarifs varient tout au long de l\'année en fonction de la demande et des événements locaux :',
      highSeason: 'Haute Saison',
      highSeasonDates: 'Décembre – Mars et Juillet – Août',
      highSeasonDesc: 'Périodes de voyage les plus demandées. Réservez tôt pour garantir vos dates préférées.',
      midSeason: 'Moyenne Saison',
      midSeasonDates: 'Avril – Juin et Septembre – Octobre',
      midSeasonDesc: 'Temps agréable avec tarifs modérés. Un excellent équilibre entre valeur et expérience.',
      lowSeason: 'Basse Saison',
      lowSeasonDates: 'Novembre',
      lowSeasonDesc: 'Meilleurs tarifs avec moins d\'affluence. Parfait pour ceux qui recherchent la tranquillité.',
      whatsIncluded: 'Ce Qui Est Inclus',
      includedItems: [
        'Utilisation complète de la villa et de toutes les commodités',
        'Service de ménage quotidien',
        'Support conciergerie dédié',
        'Services de chef privé (courses en supplément)',
        'Coordination des transferts aéroport',
        'Sécurité 24h/24'
      ],
      additionalServices: 'Services Supplémentaires',
      additionalServicesIntro: 'Nous pouvons organiser diverses expériences et services supplémentaires moyennant un coût additionnel :',
      additionalItems: [
        'Location de yachts privés',
        'Soins spa et séances bien-être',
        'Excursions et visites guidées',
        'Coordination d\'événements spéciaux (mariages, célébrations)',
        'Départ tardif ou arrivée anticipée'
      ],
      ctaHeading: 'Obtenez Votre Devis Personnalisé',
      ctaText: 'Chaque séjour est unique. Contactez-nous avec vos dates préférées et la taille de votre groupe, et nous vous fournirons un devis détaillé adapté à vos besoins.',
      ctaButton: 'Nous Contacter pour les Tarifs'
    },
    terms: {
      pageTitle: 'Conditions Générales',
      jurisdictionHeading: 'Juridiction',
      contactHeading: 'Contact',
      contactPrefix: 'Pour questions ou assistance :'
    },
    privacy: {
      pageTitle: 'Politique de Confidentialité',
      intro: 'Votre vie privée nous tient à cœur. Cette politique explique ce que nous collectons et comment nous l\'utilisons chez {villaName}.',
      infoCollectHeading: 'Informations Collectées',
      infoCollectItems: [
        'Détails du formulaire de demande (nom, email, téléphone, préférences de séjour)',
        'Analyses de site basiques (modèles d\'utilisation anonymes)',
        'Historique des communications pour la coordination des réservations'
      ],
      howWeUseHeading: 'Comment Nous Utilisons Vos Données',
      howWeUseText: 'Nous utilisons les données de demande uniquement pour répondre aux demandes de réservation ou d\'information. Nous ne vendons, louons ni partageons jamais d\'informations personnelles avec des tiers à des fins marketing.',
      cookiesHeading: 'Cookies',
      cookiesText: 'Les cookies essentiels assurent le fonctionnement du site. Les cookies analytiques optionnels peuvent être introduits avec consentement explicite. Vous pouvez gérer les préférences de cookies dans les paramètres de votre navigateur.',
      retentionHeading: 'Conservation des Données',
      retentionText: 'Les emails de demande et les dossiers de réservation sont conservés pour référence et conformité comptable. Vous pouvez demander la suppression de vos données à tout moment.',
      rightsHeading: 'Vos Droits',
      rightsText: 'Vous avez le droit d\'accéder, de corriger ou d\'effacer vos données personnelles. Pour exercer ces droits, contactez-nous à',
      contactHeading: 'Contact',
      contactText: 'Des questions sur nos pratiques de confidentialité ? Envoyez un email à'
    }
  },
  el: {
    trustBar: {
      flexibleCancellationTitle: 'Ευέλικτη Ακύρωση',
      flexibleCancellationDetail: 'Πλήρης επιστροφή έως 60 ημέρες πριν',
      secureContractTitle: 'Ασφαλές Συμβόλαιο',
      secureContractDetail: 'Συμφωνίες προστατευμένες από Stripe',
      conciergeTitle: 'Θυρωρός',
      conciergeDetail: 'Προσωπική βοήθεια περιλαμβάνεται',
      transparentPricingTitle: 'Διαφανής Τιμολόγηση',
      transparentPricingDetail: 'Χωρίς κρυφές χρεώσεις κράτησης'
    },
    specs: {
      bedrooms: 'Υπνοδωμάτια',
      baths: 'Μπάνια',
      guests: 'Επισκέπτες',
      size: 'τ.μ.',
      locationFallback: 'Τοποθεσία',
      pool: 'Πισίνα',
      poolFallback: 'Ιδιωτική Πισίνα'
    },
    tabs: {
      overviewLabel: 'Επισκόπηση',
      amenitiesLabel: 'Παροχές',
      amenitiesHeading: 'Κορυφαία Χαρακτηριστικά',
      locationLabel: 'Τοποθεσία',
      practicalDetailsLabel: 'Πρακτικές Πληροφορίες',
      practicalDetailsHeading: 'Πρακτικές Πληροφορίες',
      bedroomsLabel: 'Υπνοδωμάτια',
      bedroomsHeading: 'Υπνοδωμάτια & Μπάνια',
      familyLabel: 'Οικογένεια & Αναψυχή',
      familyHeading: 'Οικογένεια & Αναψυχή',
      gettingHereLabel: 'Πώς να Φτάσετε',
      gettingHereHeading: 'Ταξίδι & Πρόσβαση',
      faqLabel: 'Συχνές Ερωτήσεις',
      faqHeading: 'Συχνές Ερωτήσεις'
    },
    hosts: {
      heading: 'Γνωρίστε τους Οικοδεσπότες σας',
      itinerary: 'Προσωπικός σχεδιασμός προγράμματος',
      discreet: 'Διακριτική φιλοξενία με έμφαση στην ιδιωτικότητα'
    },
    testimonials: {
      heading: 'Λόγια Επισκεπτών'
    },
    header: {
      navigation: [
        { label: 'Επισκόπηση', href: '#overview' },
        { label: 'Παροχές', href: '#amenities' },
        { label: 'Γκαλερί', href: '#gallery' },
        { label: 'Τοποθεσία', href: '#location' },
        { label: 'Οικοδεσπότες', href: '#hosts' },
        { label: 'Επικοινωνία', href: '#contact' }
      ],
      inquireCta: 'Ερώτηση'
    },
    fixedPanel: {
      availabilityHeading: 'Διαθεσιμότητα',
      availabilityText: 'Επιβεβαιώνουμε τις ημερομηνίες εντός 24 ωρών. Διαθέσιμοι 7 ημέρες την εβδομάδα για ερωτήσεις.',
      ctaLabel: 'Έλεγχος Ημερομηνιών & Ερώτηση'
    },
    footer: {
      brandDescription: 'Αποδράστε σε ένα γαλήνιο και μοναδικό καταφύγιο—ένα νησιωτικό κρησφύγετο όπου η θάλασσα και ο ουρανός συγχωνεύονται σε μια ζωντανή καρτ ποστάλ. Κάθε χώρος έχει δημιουργηθεί για άνεση, ευκολία και αξέχαστες στιγμές.',
      exploreHeading: 'Εξερεύνηση',
      exploreLinks: [
        { label: 'Επισκόπηση', href: '#overview' },
        { label: 'Παροχές', href: '#amenities' },
        { label: 'Γκαλερί', href: '#gallery' },
        { label: 'Τοποθεσία', href: '#location' }
      ],
      infoHeading: 'Πληροφορίες',
      infoLinks: [
        { label: 'Τιμές & Εποχές', href: '/rates' },
        { label: 'Όροι & Προϋποθέσεις', href: '/terms' },
        { label: 'Πολιτική Απορρήτου', href: '/privacy' }
      ],
      contactHeading: 'Επικοινωνία',
      contactLinks: [
        { label: '+30 6948 474 488', href: 'tel:+306948474488' },
        { label: 'info@villa.com', href: 'mailto:info@villa.com' },
        { label: 'Επικοινωνήστε μαζί μας', href: '/contact' }
      ],
      copyrightSuffix: 'Με επιφύλαξη παντός δικαιώματος. | Πολυτελής Βίλα'
    },
    search: {
      triggerLabel: 'Αναζήτηση σε FAQ & παροχές',
      modalHeading: 'Αναζήτηση Λεπτομερειών',
      placeholder: 'Πληκτρολογήστε για αναζήτηση...',
      closeLabel: 'Κλείσιμο αναζήτησης',
      resultSingular: 'αποτέλεσμα',
      resultPlural: 'αποτελέσματα'
    },
    hero: {
      defaultCta: 'Ανακαλύψτε'
    },
    contact: {
      pageTitle: 'Επικοινωνία',
      subtitle: 'Έτοιμοι να ζήσετε την εμπειρία {villaName}; Συμπληρώστε τη φόρμα παρακάτω και η ομάδα concierge μας θα απαντήσει εντός 24 ωρών με διαθεσιμότητα και προσωποποιημένη προσφορά.',
      formLabels: {
        fullName: 'Ονοματεπώνυμο',
        email: 'Email',
        phone: 'Τηλέφωνο',
        guests: 'Αριθμός Επισκεπτών',
        guestsPlaceholder: 'Επιλέξτε...',
        guestsOptions: ['1-2 επισκέπτες', '3-4 επισκέπτες', '5-6 επισκέπτες', '7-8 επισκέπτες', '9-12 επισκέπτες', '13+ επισκέπτες'],
        checkIn: 'Ημερομηνία Άφιξης',
        checkOut: 'Ημερομηνία Αναχώρησης',
        message: 'Μήνυμα',
        messagePlaceholder: 'Πείτε μας για το ταξίδι σας — ειδικές περιστάσεις, ερωτήσεις ή αιτήματα...',
        newsletter: 'Κρατήστε με ενημερωμένο για ειδικές προσφορές',
        submit: 'Αποστολή Ερώτησης',
        required: '*'
      },
      formNote: 'Υποβάλλοντας αυτή τη φόρμα, συμφωνείτε με την {privacyLink} και τους {termsLink}.',
      privacyLabel: 'Πολιτική Απορρήτου',
      termsLabel: 'Όρους & Προϋποθέσεις',
      sidebar: {
        heading: 'Προτιμάτε να Μιλήσετε;',
        description: 'Η ομάδα concierge μας είναι διαθέσιμη να σας βοηθήσει άμεσα.',
        responseTime: 'Απάντηση εντός 24 ωρών',
        whatsappLabel: 'WhatsApp'
      },
      expectations: {
        heading: 'Τι να Περιμένετε',
        items: [
          { title: 'Γρήγορη Απάντηση', description: 'Απαντάμε εντός 24 ωρών, συχνά νωρίτερα' },
          { title: 'Προσωποποιημένη Προσφορά', description: 'Τιμολόγηση προσαρμοσμένη στις ημερομηνίες και ανάγκες σας' },
          { title: 'Τοπική Εμπειρογνωμοσύνη', description: 'Συμβουλές και σχεδιασμός εμπειριών περιλαμβάνονται' },
          { title: 'Χωρίς Δέσμευση', description: 'Κάντε ερωτήσεις ελεύθερα — καμία υποχρέωση' }
        ]
      }
    },
    thankYou: {
      pageTitle: 'Ευχαριστούμε',
      heading: 'Ευχαριστούμε!',
      subtitle: 'Η ερώτησή σας παραλήφθηκε. Η ομάδα concierge μας θα εξετάσει το αίτημά σας και θα απαντήσει εντός 24 ωρών.',
      nextSteps: {
        heading: 'Τι Ακολουθεί;',
        steps: [
          { title: 'Θα εξετάσουμε το αίτημά σας', description: 'Η ομάδα μας θα ελέγξει τη διαθεσιμότητα για τις ημερομηνίες σας' },
          { title: 'Προσωποποιημένη προσφορά', description: 'Θα λάβετε αναλυτική πρόταση μέσω email' },
          { title: 'Οριστικοποίηση κράτησης', description: 'Θα σας καθοδηγήσουμε στη διαδικασία κράτησης' }
        ]
      },
      backToVilla: 'Πίσω στη {villaName}',
      viewGallery: 'Δείτε τη Γκαλερί',
      contactNote: 'Ερωτήσεις; Επικοινωνήστε απευθείας στο'
    },
    rates: {
      pageTitle: 'Τιμές & Εποχές',
      intro: 'Η {villaName} προσφέρει διαφορετικές τιμές ανάλογα με την εποχή. Για ακριβή τιμολόγηση και διαθεσιμότητα, επικοινωνήστε με την ομάδα concierge που θα σας παρέχει προσωποποιημένη προσφορά βάσει των ημερομηνιών ταξιδιού σας.',
      seasonalPricing: 'Εποχιακή Τιμολόγηση',
      seasonalPricingIntro: 'Οι τιμές μας ποικίλλουν καθ\' όλη τη διάρκεια του έτους:',
      highSeason: 'Υψηλή Σεζόν',
      highSeasonDates: 'Ιούλιος – Αύγουστος',
      highSeasonDesc: 'Περίοδοι αιχμής με τη μεγαλύτερη ζήτηση. Κλείστε νωρίς για να εξασφαλίσετε τις ημερομηνίες σας.',
      midSeason: 'Μέση Σεζόν',
      midSeasonDates: 'Ιούνιος & Σεπτέμβριος',
      midSeasonDesc: 'Ευχάριστος καιρός με μέτριες τιμές. Εξαιρετική ισορροπία αξίας και εμπειρίας.',
      lowSeason: 'Χαμηλή Σεζόν',
      lowSeasonDates: 'Απρίλιος – Μάιος & Οκτώβριος',
      lowSeasonDesc: 'Καλύτερες τιμές με λιγότερο κόσμο. Ιδανικό για όσους αναζητούν γαλήνη.',
      whatsIncluded: 'Τι Περιλαμβάνεται',
      includedItems: [
        'Πλήρης χρήση της βίλας και όλων των παροχών',
        'Καθημερινή υπηρεσία καθαριότητας',
        'Αποκλειστική υποστήριξη concierge',
        'Υπηρεσίες ιδιωτικού σεφ (τρόφιμα επιπλέον)',
        'Συντονισμός μεταφορών αεροδρομίου',
        'Ασφάλεια 24/7'
      ],
      additionalServices: 'Επιπλέον Υπηρεσίες',
      additionalServicesIntro: 'Μπορούμε να κανονίσουμε διάφορες επιπλέον εμπειρίες και υπηρεσίες με επιπλέον κόστος:',
      additionalItems: [
        'Ιδιωτικές ναυλώσεις γιοτ',
        'Θεραπείες σπα και συνεδρίες ευεξίας',
        'Ξεναγήσεις και εκδρομές',
        'Συντονισμός ειδικών εκδηλώσεων (γάμοι, εορτασμοί)',
        'Παρατεταμένο αργό check-out ή πρώιμο check-in'
      ],
      ctaHeading: 'Λάβετε την Προσωποποιημένη Προσφορά σας',
      ctaText: 'Κάθε διαμονή είναι μοναδική. Επικοινωνήστε μαζί μας με τις προτιμώμενες ημερομηνίες και το μέγεθος της ομάδας σας, και θα σας παρέχουμε αναλυτική προσφορά.',
      ctaButton: 'Επικοινωνήστε για Τιμές'
    },
    terms: {
      pageTitle: 'Όροι & Προϋποθέσεις',
      jurisdictionHeading: 'Δικαιοδοσία',
      contactHeading: 'Επικοινωνία',
      contactPrefix: 'Για ερωτήσεις ή βοήθεια:'
    },
    privacy: {
      pageTitle: 'Πολιτική Απορρήτου',
      intro: 'Η ιδιωτικότητά σας μας ενδιαφέρει. Αυτή η πολιτική εξηγεί τι συλλέγουμε και πώς το χρησιμοποιούμε στη {villaName}.',
      infoCollectHeading: 'Πληροφορίες που Συλλέγουμε',
      infoCollectItems: [
        'Στοιχεία φόρμας ερώτησης (όνομα, email, τηλέφωνο, προτιμήσεις διαμονής)',
        'Βασικά αναλυτικά στοιχεία ιστότοπου (ανώνυμα πρότυπα χρήσης)',
        'Αρχεία επικοινωνίας για συντονισμό κρατήσεων'
      ],
      howWeUseHeading: 'Πώς Χρησιμοποιούμε τα Δεδομένα σας',
      howWeUseText: 'Χρησιμοποιούμε τα δεδομένα ερωτήσεων αποκλειστικά για να απαντήσουμε σε αιτήματα κράτησης ή πληροφοριών. Δεν πουλάμε, νοικιάζουμε ή μοιραζόμαστε ποτέ προσωπικές πληροφορίες με τρίτους για σκοπούς μάρκετινγκ.',
      cookiesHeading: 'Cookies',
      cookiesText: 'Τα απαραίτητα cookies διασφαλίζουν τη λειτουργικότητα του ιστότοπου. Προαιρετικά cookies αναλυτικών στοιχείων μπορεί να εισαχθούν με ρητή συγκατάθεση. Μπορείτε να διαχειριστείτε τις προτιμήσεις cookies στις ρυθμίσεις του προγράμματος περιήγησής σας.',
      retentionHeading: 'Διατήρηση Δεδομένων',
      retentionText: 'Τα emails ερωτήσεων και τα αρχεία κρατήσεων διατηρούνται για αναφορά και λογιστική συμμόρφωση. Μπορείτε να ζητήσετε διαγραφή των δεδομένων σας ανά πάσα στιγμή.',
      rightsHeading: 'Τα Δικαιώματά σας',
      rightsText: 'Έχετε το δικαίωμα πρόσβασης, διόρθωσης ή διαγραφής των προσωπικών σας δεδομένων. Για να ασκήσετε αυτά τα δικαιώματα, επικοινωνήστε μαζί μας στο',
      contactHeading: 'Επικοινωνία',
      contactText: 'Ερωτήσεις σχετικά με τις πρακτικές απορρήτου μας; Email'
    }
  },
  ru: {
    trustBar: {
      flexibleCancellationTitle: 'Гибкая Отмена',
      flexibleCancellationDetail: 'Полный возврат за 60 дней до заезда',
      secureContractTitle: 'Безопасный Договор',
      secureContractDetail: 'Соглашения защищены Stripe',
      conciergeTitle: 'Консьерж',
      conciergeDetail: 'Персональная помощь включена',
      transparentPricingTitle: 'Прозрачные Цены',
      transparentPricingDetail: 'Без скрытых комиссий'
    },
    specs: {
      bedrooms: 'Спальни',
      baths: 'Ванные',
      guests: 'Гости',
      size: 'кв.м.',
      locationFallback: 'Расположение',
      pool: 'Бассейн',
      poolFallback: 'Частный Бассейн'
    },
    tabs: {
      overviewLabel: 'Обзор',
      amenitiesLabel: 'Удобства',
      amenitiesHeading: 'Премиальные Особенности',
      locationLabel: 'Расположение',
      practicalDetailsLabel: 'Практическая Информация',
      practicalDetailsHeading: 'Практическая Информация',
      bedroomsLabel: 'Спальни',
      bedroomsHeading: 'Спальни и Ванные',
      familyLabel: 'Семья и Отдых',
      familyHeading: 'Семья и Отдых',
      gettingHereLabel: 'Как Добраться',
      gettingHereHeading: 'Путешествие и Доступ',
      faqLabel: 'Вопросы и Ответы',
      faqHeading: 'Часто Задаваемые Вопросы'
    },
    hosts: {
      heading: 'Познакомьтесь с Хозяевами',
      itinerary: 'Персональное планирование маршрута',
      discreet: 'Деликатное гостеприимство с акцентом на приватность'
    },
    testimonials: {
      heading: 'Отзывы Гостей'
    },
    header: {
      navigation: [
        { label: 'Обзор', href: '#overview' },
        { label: 'Удобства', href: '#amenities' },
        { label: 'Галерея', href: '#gallery' },
        { label: 'Расположение', href: '#location' },
        { label: 'Хозяева', href: '#hosts' },
        { label: 'Контакты', href: '#contact' }
      ],
      inquireCta: 'Запрос'
    },
    fixedPanel: {
      availabilityHeading: 'Наличие',
      availabilityText: 'Подтверждаем даты по email в течение 24 часов. Спросите о гибком заезде/выезде и промежуточной уборке.',
      ctaLabel: 'Проверить Даты и Запрос'
    },
    footer: {
      brandDescription: 'Уединитесь в спокойном и уникальном убежище — островном укрытии, где море и небо сливаются в живую открытку. Каждое пространство создано для комфорта, удобства и незабываемых моментов.',
      exploreHeading: 'Исследовать',
      exploreLinks: [
        { label: 'Обзор', href: '#overview' },
        { label: 'Удобства', href: '#amenities' },
        { label: 'Галерея', href: '#gallery' },
        { label: 'Расположение', href: '#location' }
      ],
      infoHeading: 'Информация',
      infoLinks: [
        { label: 'Цены и Сезоны', href: '/rates' },
        { label: 'Условия', href: '/terms' },
        { label: 'Политика Конфиденциальности', href: '/privacy' }
      ],
      contactHeading: 'Контакты',
      contactLinks: [
        { label: '+30 6948 474 488', href: 'tel:+306948474488' },
        { label: 'info@villa.com', href: 'mailto:info@villa.com' },
        { label: 'Связаться с нами', href: '/contact' }
      ],
      copyrightSuffix: 'Все права защищены. | Роскошная Вилла'
    },
    search: {
      triggerLabel: 'Поиск по FAQ и удобствам',
      modalHeading: 'Поиск Деталей',
      placeholder: 'Введите для поиска...',
      closeLabel: 'Закрыть поиск',
      resultSingular: 'результат',
      resultPlural: 'результатов'
    },
    hero: {
      defaultCta: 'Открыть'
    },
    contact: {
      pageTitle: 'Контакты',
      subtitle: 'Готовы испытать {villaName}? Заполните форму ниже, и наша команда консьержей ответит в течение 24 часов с информацией о наличии и персональным предложением.',
      formLabels: {
        fullName: 'Полное Имя',
        email: 'Email',
        phone: 'Телефон',
        guests: 'Количество Гостей',
        guestsPlaceholder: 'Выберите...',
        guestsOptions: ['1-2 гостя', '3-4 гостя', '5-6 гостей', '7-8 гостей', '9-12 гостей', '13+ гостей'],
        checkIn: 'Дата Заезда',
        checkOut: 'Дата Выезда',
        message: 'Сообщение',
        messagePlaceholder: 'Расскажите о вашей поездке — особые случаи, вопросы или пожелания...',
        newsletter: 'Держите меня в курсе специальных предложений',
        submit: 'Отправить Запрос',
        required: '*'
      },
      formNote: 'Отправляя эту форму, вы соглашаетесь с нашей {privacyLink} и {termsLink}.',
      privacyLabel: 'Политикой Конфиденциальности',
      termsLabel: 'Условиями',
      sidebar: {
        heading: 'Предпочитаете Поговорить?',
        description: 'Наша команда консьержей готова помочь вам напрямую.',
        responseTime: 'Ответ в течение 24 часов',
        whatsappLabel: 'WhatsApp'
      },
      expectations: {
        heading: 'Чего Ожидать',
        items: [
          { title: 'Быстрый Ответ', description: 'Мы отвечаем в течение 24 часов, часто раньше' },
          { title: 'Персональное Предложение', description: 'Индивидуальные цены на основе ваших дат и потребностей' },
          { title: 'Местная Экспертиза', description: 'Советы инсайдеров и планирование впечатлений включены' },
          { title: 'Без Обязательств', description: 'Задавайте вопросы свободно — никаких обязательств' }
        ]
      }
    },
    thankYou: {
      pageTitle: 'Спасибо',
      heading: 'Спасибо!',
      subtitle: 'Ваш запрос получен. Наша команда консьержей рассмотрит ваш запрос и ответит в течение 24 часов.',
      nextSteps: {
        heading: 'Что Дальше?',
        steps: [
          { title: 'Мы рассмотрим ваш запрос', description: 'Наша команда проверит наличие на ваши даты' },
          { title: 'Персональное предложение', description: 'Вы получите подробное предложение по email' },
          { title: 'Оформление бронирования', description: 'Мы проведем вас через процесс бронирования' }
        ]
      },
      backToVilla: 'Назад к {villaName}',
      viewGallery: 'Смотреть Галерею',
      contactNote: 'Вопросы? Свяжитесь напрямую'
    },
    rates: {
      pageTitle: 'Цены и Сезоны',
      intro: '{villaName} предлагает разные тарифы в зависимости от сезона. Для точных цен и наличия, свяжитесь с нашей командой консьержей, которая предоставит персональное предложение на основе ваших дат.',
      seasonalPricing: 'Сезонные Цены',
      seasonalPricingIntro: 'Наши тарифы варьируются в течение года:',
      highSeason: 'Высокий Сезон',
      highSeasonDates: 'Июль – Август',
      highSeasonDesc: 'Пиковые периоды с наибольшим спросом. Бронируйте заранее.',
      midSeason: 'Средний Сезон',
      midSeasonDates: 'Июнь и Сентябрь',
      midSeasonDesc: 'Приятная погода с умеренными ценами. Отличный баланс цены и впечатлений.',
      lowSeason: 'Низкий Сезон',
      lowSeasonDates: 'Апрель – Май и Октябрь',
      lowSeasonDesc: 'Лучшие цены с меньшим количеством туристов. Идеально для ищущих спокойствия.',
      whatsIncluded: 'Что Включено',
      includedItems: [
        'Полное использование виллы и всех удобств',
        'Ежедневная уборка',
        'Поддержка консьержа',
        'Услуги частного шефа (продукты отдельно)',
        'Координация трансферов из аэропорта',
        'Охрана 24/7'
      ],
      additionalServices: 'Дополнительные Услуги',
      additionalServicesIntro: 'Мы можем организовать различные дополнительные впечатления за отдельную плату:',
      additionalItems: [
        'Частные яхт-чартеры',
        'Спа-процедуры и велнес-сессии',
        'Экскурсии с гидом',
        'Координация мероприятий (свадьбы, праздники)',
        'Поздний выезд или ранний заезд'
      ],
      ctaHeading: 'Получите Персональное Предложение',
      ctaText: 'Каждое пребывание уникально. Свяжитесь с нами с вашими датами и размером группы, и мы предоставим детальное предложение.',
      ctaButton: 'Связаться для Цен'
    },
    terms: {
      pageTitle: 'Условия',
      jurisdictionHeading: 'Юрисдикция',
      contactHeading: 'Контакты',
      contactPrefix: 'По вопросам или за помощью:'
    },
    privacy: {
      pageTitle: 'Политика Конфиденциальности',
      intro: 'Ваша конфиденциальность важна для нас. Эта политика объясняет, что мы собираем и как используем в {villaName}.',
      infoCollectHeading: 'Собираемая Информация',
      infoCollectItems: [
        'Данные формы запроса (имя, email, телефон, предпочтения проживания)',
        'Базовая аналитика сайта (анонимные паттерны использования)',
        'Записи коммуникации для координации бронирований'
      ],
      howWeUseHeading: 'Как Мы Используем Ваши Данные',
      howWeUseText: 'Мы используем данные запросов исключительно для ответа на запросы бронирования или информации. Мы никогда не продаем, не сдаем в аренду и не передаем личную информацию третьим лицам в маркетинговых целях.',
      cookiesHeading: 'Cookies',
      cookiesText: 'Необходимые cookies обеспечивают функциональность сайта. Опциональные аналитические cookies могут быть введены с явного согласия. Вы можете управлять настройками cookies в вашем браузере.',
      retentionHeading: 'Хранение Данных',
      retentionText: 'Emails запросов и записи бронирований хранятся для справки и бухгалтерской отчетности. Вы можете запросить удаление ваших данных в любое время.',
      rightsHeading: 'Ваши Права',
      rightsText: 'Вы имеете право на доступ, исправление или удаление ваших персональных данных. Для реализации этих прав свяжитесь с нами по',
      contactHeading: 'Контакты',
      contactText: 'Вопросы о нашей политике конфиденциальности? Email'
    }
  }
};