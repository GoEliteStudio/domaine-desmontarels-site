import { sendEmail } from './emailService';
import { GOELITE_INBOX } from './emailRouting';

/**
 * Villa-specific branding configuration
 * 
 * heroImage: MUST use the villa's actual first hero image from JSON
 * Use format: https://{SITE_URL}/images/villas/{slug}/{image}.webp
 */
interface VillaBranding {
  name: string;
  heroImage: string;
  contactEmail: string;
  whatsappNumber: string;
  location: string;
  accentColor: string;
}

// Base URL for images (Vercel deployment)
const SITE_URL = import.meta.env.SITE_URL || 'https://domaine-desmontarels-site.vercel.app';

const VILLA_BRANDING: Record<string, VillaBranding> = {
  'casa-de-la-muralla': {
    name: 'Casa de la Muralla',
    // First priority image from casa-de-la-muralla.en.json hero.priorityImages
    heroImage: `${SITE_URL}/images/villas/casa-de-la-muralla/muralla-008.webp`,
    contactEmail: 'reservations@casadelamuralla.com',
    whatsappNumber: '573161234567', // Colombia number format
    location: 'Tierrabomba Island, Cartagena, Colombia',
    accentColor: '#1e7b7b', // Teal for Caribbean villa
  },
  'domaine-des-montarels': {
    name: 'Domaine des Montarels',
    // First priority image from domaine-des-montarels.en.json hero.priorityImages
    heroImage: `${SITE_URL}/images/domaine-des-montarels/MONT_Pool_027.webp`,
    contactEmail: 'reservations@domaine-desmontarels.com',
    whatsappNumber: '447768987879', // UK number format
    location: 'Alignan-du-Vent, Languedoc, France',
    accentColor: '#a58e76', // Bronze for French estate
  },
};

const DEFAULT_BRANDING: VillaBranding = {
  name: 'Love This Place',
  heroImage: `${SITE_URL}/images/domaine-des-montarels/MONT_Pool_027.webp`,
  contactEmail: 'bookings@lovethisplace.co',
  whatsappNumber: '15164936070',
  location: '',
  accentColor: '#a58e76',
};

function getVillaBranding(villaSlug?: string): VillaBranding {
  if (villaSlug && VILLA_BRANDING[villaSlug]) {
    return { ...VILLA_BRANDING[villaSlug] };
  }
  return { ...DEFAULT_BRANDING };
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * World-class email HTML template
 * - Clean, minimal design with luxury feel
 * - Proper image sizing for email clients
 * - Mobile responsive
 * - Consistent with villa website branding
 */
function buildClientReceiptHtml(villa: VillaBranding, data: Record<string, any>, L: any): string {
  const waText = L.waText({ ...data, villaName: villa.name });
  const waTextEnc = encodeURIComponent(String(waText || ''));
  const accent = villa.accentColor;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(villa.name)} — ${escapeHtml(L.pill)}</title>
  <!--[if mso]>
  <style>table,td{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}img{-ms-interpolation-mode:bicubic}</style>
  <![endif]-->
  <style>
    /* Reset */
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
    body{margin:0!important;padding:0!important;width:100%!important;background-color:#f5f5f4}
    
    /* Typography */
    .brand-font{font-family:'Cormorant Garamond',Georgia,'Times New Roman',serif}
    .body-font{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
    
    /* Mobile */
    @media screen and (max-width:600px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-padding{padding:20px 16px!important}
      .mobile-center{text-align:center!important}
      .mobile-stack{display:block!important;width:100%!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4">
  
  <!-- Preheader (hidden) -->
  <div style="display:none;font-size:1px;color:#f5f5f4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
    ${escapeHtml(L.preheader)} &#8199;&#65279;&#847; &#8199;&#65279;&#847; &#8199;&#65279;&#847;
  </div>
  
  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f4">
    <tr>
      <td align="center" style="padding:24px 16px">
        
        <!-- Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="mobile-full" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Hero Image -->
          <tr>
            <td>
              <img src="${villa.heroImage}" alt="${escapeHtml(villa.name)}" width="600" style="width:100%;height:auto;display:block;max-height:280px;object-fit:cover">
            </td>
          </tr>
          
          <!-- Brand Bar -->
          <tr>
            <td align="center" style="background-color:#111111;padding:16px 24px">
              <span class="brand-font" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:500;letter-spacing:2px;color:#ffffff;text-transform:uppercase">${escapeHtml(villa.name)}</span>
            </td>
          </tr>
          
          <!-- Status Pill -->
          <tr>
            <td align="center" style="padding:28px 24px 0">
              <span style="display:inline-block;background-color:${accent};color:#ffffff;padding:8px 18px;border-radius:20px;font-family:Inter,sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase">${escapeHtml(L.pill)}</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding:24px 40px 32px">
              
              <!-- Headline -->
              <h1 class="brand-font" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.3">${escapeHtml(L.h1)}</h1>
              
              <!-- Intro -->
              <p class="body-font" style="font-family:Inter,sans-serif;font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 24px">${escapeHtml(L.intro)}</p>
              
              <!-- Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafaf9;border-radius:8px;margin-bottom:24px">
                <tr>
                  <td style="padding:20px 24px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e5e5">
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.name)}</span><br>
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:15px;color:#1a1a1a;font-weight:500">${escapeHtml(String(data.fullName ?? ''))}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5">
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.email)}</span><br>
                          <a href="mailto:${escapeHtml(String(data.email ?? ''))}" style="font-family:Inter,sans-serif;font-size:15px;color:${accent};text-decoration:none">${escapeHtml(String(data.email ?? ''))}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #e5e5e5">
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.dates)}</span><br>
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:15px;color:#1a1a1a;font-weight:500">${escapeHtml(String(data.checkIn ?? ''))} → ${escapeHtml(String(data.checkOut ?? ''))}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0${data.notes ? ';border-bottom:1px solid #e5e5e5' : ''}">
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.guests)}</span><br>
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:15px;color:#1a1a1a">${escapeHtml(String(data.adults ?? '2'))} ${escapeHtml(L.labels.adults)}, ${escapeHtml(String(data.children ?? '0'))} ${escapeHtml(L.labels.children)}</span>
                        </td>
                      </tr>
                      ${data.notes ? `
                      <tr>
                        <td style="padding:12px 0">
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.notes)}</span><br>
                          <span class="body-font" style="font-family:Inter,sans-serif;font-size:15px;color:#1a1a1a">${escapeHtml(String(data.notes))}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Buttons -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="mobile-stack" style="padding-right:8px" width="50%">
                    <a href="https://wa.me/${villa.whatsappNumber}?text=${waTextEnc}" style="display:block;background-color:#25D366;color:#ffffff;text-align:center;padding:14px 20px;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;text-decoration:none">${escapeHtml(L.btnWhatsapp)}</a>
                  </td>
                  <td class="mobile-stack" style="padding-left:8px" width="50%">
                    <a href="mailto:${villa.contactEmail}" style="display:block;background-color:${accent};color:#ffffff;text-align:center;padding:14px 20px;border-radius:8px;font-family:Inter,sans-serif;font-size:14px;font-weight:600;text-decoration:none">${escapeHtml(L.btnEmail)}</a>
                  </td>
                </tr>
              </table>
              
              <!-- Tip -->
              <p class="body-font" style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;line-height:1.5;margin:20px 0 0;font-style:italic">${escapeHtml(L.tip)}</p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#1a1a1a;padding:24px 40px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="mobile-center" style="text-align:left">
                    <p class="brand-font" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#ffffff;margin:0 0 4px">${escapeHtml(villa.name)}</p>
                    ${villa.location ? `<p class="body-font" style="font-family:Inter,sans-serif;font-size:12px;color:#9ca3af;margin:0">${escapeHtml(villa.location)}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px">
                    <p class="body-font" style="font-family:Inter,sans-serif;font-size:11px;color:#6b7280;margin:0">© ${new Date().getFullYear()} ${escapeHtml(villa.name)}. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

export async function sendClientReceipt({
  villaSlug,
  villaName,
  replyTo,
  to,
  data,
  lang = 'en',
}: {
  villaSlug?: string;
  villaName?: string;
  replyTo: string;
  to: string;
  data: Record<string, string | number | undefined>;
  lang?: 'en' | 'fr' | 'es';
}) {
  // Get villa branding (uses villaSlug to lookup correct branding)
  const villa = getVillaBranding(villaSlug);
  
  // Override name if provided from listing
  if (villaName) {
    villa.name = villaName;
  }

  type Lang = 'en' | 'fr' | 'es';
  const I18N: Record<Lang, {
    preheader: string; h1: string; intro: string; tip: string;
    pill: string; btnWhatsapp: string; btnEmail: string; subject: (d: any, v: string) => string;
    labels: { name: string; email: string; dates: string; guests: string; notes: string; adults: string; children: string; };
    waText: (d: any) => string;
  }> = {
    en: {
      preheader: "We've received your inquiry. Our concierge will reply shortly with availability and next steps.",
      h1: "Thank you — we've received your inquiry",
      intro: "Our team will confirm availability, total pricing, and next steps. If this is time-sensitive, feel free to WhatsApp us for a faster reply.",
      tip: "Tip: reply to this email if you need to adjust dates or guest count.",
      pill: "Inquiry received",
      btnWhatsapp: "WhatsApp Us",
      btnEmail: "Email Us",
      subject: (d, v) => `${v} — We received your inquiry (${d.checkIn} → ${d.checkOut})`,
      labels: { name: "Name", email: "Email", dates: "Dates", guests: "Guests", notes: "Notes", adults: "adults", children: "children" },
      waText: (d) => `Hi, this is ${d.fullName} regarding my inquiry for ${d.checkIn} to ${d.checkOut}.`
    },
    fr: {
      preheader: "Nous avons bien reçu votre demande. Notre conciergerie vous répondra rapidement.",
      h1: "Merci — votre demande a bien été reçue",
      intro: "Nous confirmons la disponibilité, le tarif total et les prochaines étapes. En cas d'urgence, contactez-nous sur WhatsApp.",
      tip: "Astuce : répondez à cet e-mail pour ajuster vos dates ou le nombre d'invités.",
      pill: "Demande reçue",
      btnWhatsapp: "WhatsApp",
      btnEmail: "Nous écrire",
      subject: (d, v) => `${v} — Demande reçue (${d.checkIn} → ${d.checkOut})`,
      labels: { name: "Nom", email: "E-mail", dates: "Dates", guests: "Invités", notes: "Notes", adults: "adultes", children: "enfants" },
      waText: (d) => `Bonjour, ici ${d.fullName} à propos de ma demande du ${d.checkIn} au ${d.checkOut}.`
    },
    es: {
      preheader: "Hemos recibido tu solicitud. Nuestro concierge te responderá pronto.",
      h1: "Gracias — hemos recibido tu solicitud",
      intro: "Confirmaremos disponibilidad, precio total y próximos pasos. Si es urgente, escríbenos por WhatsApp.",
      tip: "Consejo: responde a este correo si necesitas ajustar fechas o número de huéspedes.",
      pill: "Solicitud recibida",
      btnWhatsapp: "WhatsApp",
      btnEmail: "Escríbenos",
      subject: (d, v) => `${v} — Hemos recibido tu solicitud (${d.checkIn} → ${d.checkOut})`,
      labels: { name: "Nombre", email: "Correo", dates: "Fechas", guests: "Huéspedes", notes: "Notas", adults: "adultos", children: "niños" },
      waText: (d) => `Hola, soy ${d.fullName} sobre mi consulta del ${d.checkIn} al ${d.checkOut}.`
    }
  };

  const L = I18N[lang as Lang] ?? I18N.en;
  const subject = L.subject(data, villa.name);
  const html = buildClientReceiptHtml(villa, data, L);

  // IMPORTANT: replyTo should be the villa's contact email, NOT the owner's internal email
  // This is what the guest sees when they hit "Reply"
  const result = await sendEmail({
    to,
    bcc: GOELITE_INBOX,
    subject,
    html,
    text:
      `${L.h1}\n\n` +
      `${L.labels.name}: ${data.fullName}\n` +
      `${L.labels.email}: ${data.email}\n` +
      `${L.labels.dates}: ${data.checkIn} → ${data.checkOut}\n` +
      `${L.labels.guests}: ${data.adults ?? 2} ${L.labels.adults}, ${data.children ?? 0} ${L.labels.children}\n` +
      (data.notes ? `${L.labels.notes}: ${data.notes}\n` : '') +
      `\n${L.tip}\n\n` +
      `—\n${villa.name}${villa.location ? `\n${villa.location}` : ''}`,
    replyTo: villa.contactEmail, // Guest replies go to villa's public contact email
    fromName: villa.name,
  });

  return result;
}
