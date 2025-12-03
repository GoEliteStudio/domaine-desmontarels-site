import { sendEmail } from './emailService';
import { GOELITE_INBOX, PUBLIC_REPLY_TO } from './emailRouting';

/**
 * Villa-specific branding configuration
 */
interface VillaBranding {
  name: string;
  contactEmail: string;
  whatsappNumber: string;
  location: string;
  accentColor: string;
}

const VILLA_BRANDING: Record<string, VillaBranding> = {
  'casa-de-la-muralla': {
    name: 'Casa de la Muralla',
    contactEmail: 'reservations@casadelamuralla.com',
    whatsappNumber: '573161234567',
    location: 'Tierrabomba Island, Cartagena, Colombia',
    accentColor: '#1e7b7b',
  },
  'domaine-des-montarels': {
    name: 'Domaine des Montarels',
    contactEmail: 'jc@elitecartagena.com',
    whatsappNumber: '447768987879',
    location: 'Alignan-du-Vent, Languedoc, France',
    accentColor: '#a58e76',
  },
};

const DEFAULT_BRANDING: VillaBranding = {
  name: 'LoveThisPlace',
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
 * - Elegant black header with brand name
 * - No images (faster loading, better deliverability)
 * - Clean, minimal luxury design
 * - Mobile responsive
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
  <style>table,td{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}</style>
  <![endif]-->
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0;mso-table-rspace:0}
    body{margin:0!important;padding:0!important;width:100%!important;background-color:#f5f5f4}
    @media screen and (max-width:600px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-padding{padding:20px 16px!important}
      .mobile-center{text-align:center!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4">
  
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#f5f5f4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
    ${escapeHtml(L.preheader)} &#8199;&#65279;&#847;
  </div>
  
  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f4">
    <tr>
      <td align="center" style="padding:24px 16px">
        
        <!-- Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="mobile-full" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Elegant Black Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:32px 40px;text-align:center">
              <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:500;letter-spacing:3px;color:#ffffff;margin:0;text-transform:uppercase">${escapeHtml(villa.name)}</h1>
            </td>
          </tr>
          
          <!-- Status Pill -->
          <tr>
            <td align="center" style="padding:28px 24px 0">
              <span style="display:inline-block;background-color:${accent};color:#ffffff;padding:8px 20px;border-radius:20px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase">${escapeHtml(L.pill)}</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding:24px 40px 32px">
              
              <!-- Headline -->
              <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.3;text-align:center">${escapeHtml(L.h1)}</h2>
              
              <!-- Intro -->
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;text-align:center">${escapeHtml(L.intro)}</p>
              
              <!-- Details Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafaf9;border-radius:8px;margin-bottom:28px">
                <tr>
                  <td style="padding:24px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:10px 0;border-bottom:1px solid #e5e5e5">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.name)}</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a;font-weight:500">${escapeHtml(String(data.fullName ?? ''))}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;border-bottom:1px solid #e5e5e5">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.email)}</span><br>
                          <a href="mailto:${escapeHtml(String(data.email ?? ''))}" style="font-family:Inter,Arial,sans-serif;font-size:16px;color:${accent};text-decoration:none">${escapeHtml(String(data.email ?? ''))}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;border-bottom:1px solid #e5e5e5">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.dates)}</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a;font-weight:500">${escapeHtml(String(data.checkIn ?? ''))} → ${escapeHtml(String(data.checkOut ?? ''))}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0${data.notes ? ';border-bottom:1px solid #e5e5e5' : ''}">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.guests)}</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a">${escapeHtml(String(data.adults ?? '2'))} ${escapeHtml(L.labels.adults)}, ${escapeHtml(String(data.children ?? '0'))} ${escapeHtml(L.labels.children)}</span>
                        </td>
                      </tr>
                      ${data.notes ? `
                      <tr>
                        <td style="padding:14px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(L.labels.notes)}</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a">${escapeHtml(String(data.notes))}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Buttons -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:24px">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right:8px">
                          <a href="https://wa.me/${villa.whatsappNumber}?text=${waTextEnc}" style="display:inline-block;background-color:#25D366;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600">${escapeHtml(L.btnWhatsapp)}</a>
                        </td>
                        <td style="padding-left:8px">
                          <a href="mailto:${villa.contactEmail}" style="display:inline-block;background-color:#0a0a0a;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600">${escapeHtml(L.btnEmail)}</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Tip -->
              <p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#9ca3af;line-height:1.5;margin:0;font-style:italic;text-align:center">${escapeHtml(L.tip)}</p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 40px;text-align:center">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#ffffff;margin:0 0 4px">${escapeHtml(villa.name)}</p>
              ${villa.location ? `<p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;margin:0 0 12px">${escapeHtml(villa.location)}</p>` : ''}
              <p style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#6b7280;margin:0">© ${new Date().getFullYear()} ${escapeHtml(villa.name)}. All rights reserved.</p>
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
  const villa = getVillaBranding(villaSlug);
  
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
      preheader: "We've received your inquiry. Our concierge will reply shortly.",
      h1: "Thank you — we've received your inquiry",
      intro: "Our team will confirm availability, pricing, and next steps. For faster service, reach out via WhatsApp.",
      tip: "Reply to this email to adjust dates or guest count.",
      pill: "Inquiry received",
      btnWhatsapp: "WhatsApp Us",
      btnEmail: "Email Us",
      subject: (d, v) => `${v} — We received your inquiry (${d.checkIn} → ${d.checkOut})`,
      labels: { name: "Name", email: "Email", dates: "Dates", guests: "Guests", notes: "Notes", adults: "adults", children: "children" },
      waText: (d) => `Hi, this is ${d.fullName} regarding my inquiry for ${d.checkIn} to ${d.checkOut}.`
    },
    fr: {
      preheader: "Nous avons bien reçu votre demande. Notre conciergerie vous répondra rapidement.",
      h1: "Merci — votre demande a été reçue",
      intro: "Nous confirmons la disponibilité, le tarif et les prochaines étapes. Pour plus de rapidité, contactez-nous sur WhatsApp.",
      tip: "Répondez à cet e-mail pour ajuster vos dates.",
      pill: "Demande reçue",
      btnWhatsapp: "WhatsApp",
      btnEmail: "Nous écrire",
      subject: (d, v) => `${v} — Demande reçue (${d.checkIn} → ${d.checkOut})`,
      labels: { name: "Nom", email: "E-mail", dates: "Dates", guests: "Invités", notes: "Notes", adults: "adultes", children: "enfants" },
      waText: (d) => `Bonjour, ici ${d.fullName} à propos de ma demande du ${d.checkIn} au ${d.checkOut}.`
    },
    es: {
      preheader: "Hemos recibido tu solicitud. Nuestro concierge te responderá pronto.",
      h1: "Gracias — recibimos tu solicitud",
      intro: "Confirmaremos disponibilidad, precio y próximos pasos. Para mayor rapidez, escríbenos por WhatsApp.",
      tip: "Responde a este correo para ajustar fechas.",
      pill: "Solicitud recibida",
      btnWhatsapp: "WhatsApp",
      btnEmail: "Escríbenos",
      subject: (d, v) => `${v} — Recibimos tu solicitud (${d.checkIn} → ${d.checkOut})`,
      labels: { name: "Nombre", email: "Correo", dates: "Fechas", guests: "Huéspedes", notes: "Notas", adults: "adultos", children: "niños" },
      waText: (d) => `Hola, soy ${d.fullName} sobre mi consulta del ${d.checkIn} al ${d.checkOut}.`
    }
  };

  const L = I18N[lang as Lang] ?? I18N.en;
  const subject = L.subject(data, villa.name);
  const html = buildClientReceiptHtml(villa, data, L);

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
    replyTo: villa.contactEmail,
    fromName: villa.name,
  });

  return result;
}
