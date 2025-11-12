import { Resend } from 'resend';

// Minimal HTML template with server-side year and safe placeholders.
// Removed inline <script>. Do not inject raw user HTML; we escape values.
const CLIENT_TEMPLATE_HTML = `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Domaine des Montarels — Inquiry Received</title>
  <style>
    body{margin:0;background:#0f0f0f;color:#222;font-family:Inter,Segoe UI,Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}
    .wrap{max-width:640px;margin:0 auto;background:#ffffff}
    .preheader{display:none;visibility:hidden;opacity:0;height:0;overflow:hidden;mso-hide:all}
    .hero{background:#111 url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200') center/cover no-repeat;color:#fff;padding:46px 28px;text-align:center}
    .brand{font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:2px;font-weight:600;font-size:20px}
    .card{padding:28px}
    .h1{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;font-size:28px;line-height:1.15;margin:0 0 8px}
    .muted{color:#6b7280;font-size:14px}
    .btn{display:inline-block;background:#a58e76;color:#fff;text-decoration:none;padding:14px 22px;border-radius:6px;font-size:13px;letter-spacing:1.2px;text-transform:uppercase}
    .list{margin:18px 0 8px;padding:0;list-style:none}
  .list li{padding:10px 0;border-top:1px solid #eee;font-size:15px}
    .list li:first-child{border-top:none}
    .footer{padding:22px 28px 40px;color:#9ca3af;font-size:12px;line-height:1.6}
    .pill{display:inline-block;padding:6px 10px;border:1px solid #e5e7eb;border-radius:999px;font-size:12px;color:#374151}
    @media (max-width:480px){.card{padding:20px}.hero{padding:36px 20px}}
  </style>
</head>
<body>
  <span class="preheader">{{preheader}}</span>
  <div class="wrap">
    <div class="hero">
      <div class="brand">DOMAINE DES MONTARELS</div>
      <div style="margin-top:12px"><span class="pill">{{pill}}</span></div>
    </div>

    <div class="card">
      <h1 class="h1">{{h1}}</h1>
      <p class="muted">{{intro}}</p>

      <!-- Summary -->
      <ul class="list">
        <li><strong>{{label_name}}:</strong> {{fullName}}</li>
        <li><strong>{{label_email}}:</strong> {{email}}</li>
        <li><strong>{{label_dates}}:</strong> {{checkIn}} → {{checkOut}}</li>
        <li><strong>{{label_guests}}:</strong> {{adults}} {{label_adults}}, {{children}} {{label_children}}</li>
        {{#notes}}<li><strong>{{label_notes}}:</strong> {{notes}}</li>{{/notes}}
      </ul>

      <div style="margin:22px 0 8px">
  <a class="btn" href="https://wa.me/15164936070?text={{waTextEnc}}">{{btnWhatsapp}}</a>
        <span style="display:inline-block;margin-left:14px">
          {{orEmail}} <a href="mailto:reservations@domaine-desmontarels.com">reservations@domaine-desmontarels.com</a>
        </span>
      </div>

      <p class="muted" style="margin-top:18px">{{tip}}</p>
    </div>

    <div class="footer">
      Domaine des Montarels • Alignan-du-Vent, Béziers, France<br>
      Concierge: +44 7768 987 879 (UK) • +33 647 42 88 64 (FR) • reservations@domaine-desmontarels.com<br>
      © {{year}} Domaine des Montarels. All rights reserved.
    </div>
  </div>
</body>
</html>`;

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendClientReceipt({
  apiKey,
  from,
  replyTo,
  to,
  data,
  lang = 'en',
}: {
  apiKey: string;
  from: string; // must be verified domain sender
  replyTo: string; // your real inbox to receive replies
  to: string; // client email
  data: Record<string, string | number | undefined>;
  lang?: 'en' | 'fr' | 'es';
}) {
  type Lang = 'en' | 'fr' | 'es';
  const I18N: Record<Lang, {
    preheader: string; h1: string; intro: string; tip: string;
    pill: string; btnWhatsapp: string; orEmail: string; subject: (d: any)=>string;
    labels: { name: string; email: string; dates: string; guests: string; notes: string; adults: string; children: string; };
    waText: (d:any)=>string;
  }> = {
  en: {
      preheader: "We’ve received your inquiry. Our concierge will reply shortly with availability and next steps.",
      h1: "Thank you — we’ve received your inquiry",
      intro: "Our team will confirm availability, total pricing, and next steps. If this is time-sensitive, feel free to WhatsApp us for a faster reply.",
      tip: "Tip: reply to this email if you need to adjust dates or guest count.",
      pill: "Inquiry received",
      btnWhatsapp: "WhatsApp Concierge",
      orEmail: "or email",
      subject: (d)=>`Domaine des Montarels — We received your inquiry (${d.checkIn} → ${d.checkOut})`,
      labels: { name:"Name", email:"Email", dates:"Dates", guests:"Guests", notes:"Notes", adults:"adults", children:"children" },
      waText: (d)=>`Hi Montarels team, this is ${d.fullName} regarding ${d.checkIn} to ${d.checkOut}.`
    },
  fr: {
      preheader: "Nous avons bien reçu votre demande. Notre conciergerie vous répondra rapidement avec disponibilités et prochaines étapes.",
      h1: "Merci — votre demande a bien été reçue",
      intro: "Nous confirmons la disponibilité, le tarif total et les prochaines étapes. En cas d’urgence, contactez-nous sur WhatsApp pour une réponse plus rapide.",
      tip: "Astuce : répondez à cet e-mail pour ajuster vos dates ou le nombre d’invités.",
      pill: "Demande reçue",
      btnWhatsapp: "WhatsApp Conciergerie",
      orEmail: "ou écrivez à",
      subject: (d)=>`Domaine des Montarels — Demande reçue (${d.checkIn} → ${d.checkOut})`,
      labels: { name:"Nom", email:"E-mail", dates:"Dates", guests:"Invités", notes:"Notes", adults:"adultes", children:"enfants" },
      waText: (d)=>`Bonjour l’équipe Montarels, ici ${d.fullName} à propos de ${d.checkIn} à ${d.checkOut}.`
    },
  es: {
      preheader: "Hemos recibido tu solicitud. Nuestro concierge te responderá pronto con disponibilidad y próximos pasos.",
      h1: "Gracias — hemos recibido tu solicitud",
      intro: "Confirmaremos disponibilidad, precio total y próximos pasos. Si es urgente, escríbenos por WhatsApp para una respuesta más rápida.",
      tip: "Consejo: responde a este correo si necesitas ajustar fechas o número de huéspedes.",
      pill: "Solicitud recibida",
      btnWhatsapp: "WhatsApp Concierge",
      orEmail: "o escribe a",
      subject: (d)=>`Domaine des Montarels — Hemos recibido tu solicitud (${d.checkIn} → ${d.checkOut})`,
      labels: { name:"Nombre", email:"Correo", dates:"Fechas", guests:"Huéspedes", notes:"Notas", adults:"adultos", children:"niños" },
      waText: (d)=>`Hola equipo Montarels, soy ${d.fullName} sobre ${d.checkIn} a ${d.checkOut}.`
    }
  };
  const L = I18N[(lang as Lang)] ?? I18N.en;
  // Build and encode WhatsApp text safely (only our own tokens inserted)
  const waText = L.waText(data);
  const waTextEnc = encodeURIComponent(String(waText || ''));
  const template = CLIENT_TEMPLATE_HTML
    .replaceAll('{{fullName}}', escapeHtml(String(data.fullName ?? '')))
    .replaceAll('{{email}}', escapeHtml(String(data.email ?? '')))
    .replaceAll('{{checkIn}}', escapeHtml(String(data.checkIn ?? '')))
    .replaceAll('{{checkOut}}', escapeHtml(String(data.checkOut ?? '')))
    .replaceAll('{{adults}}', escapeHtml(String(data.adults ?? '')))
    .replaceAll('{{children}}', escapeHtml(String(data.children ?? '')))
    .replace('{{#notes}}', data.notes ? '' : '<!--')
    .replace('{{/notes}}', data.notes ? '' : '-->')
    .replaceAll('{{notes}}', escapeHtml(String(data.notes ?? '')))
    .replaceAll('{{year}}', String(new Date().getFullYear()))
    .replaceAll('{{preheader}}', escapeHtml(L.preheader))
    .replaceAll('{{h1}}', escapeHtml(L.h1))
    .replaceAll('{{intro}}', escapeHtml(L.intro))
    .replaceAll('{{tip}}', escapeHtml(L.tip))
    .replaceAll('{{pill}}', escapeHtml(L.pill))
    .replaceAll('{{btnWhatsapp}}', escapeHtml(L.btnWhatsapp))
    .replaceAll('{{orEmail}}', escapeHtml(L.orEmail))
    .replaceAll('{{label_name}}', escapeHtml(L.labels.name))
    .replaceAll('{{label_email}}', escapeHtml(L.labels.email))
    .replaceAll('{{label_dates}}', escapeHtml(L.labels.dates))
    .replaceAll('{{label_guests}}', escapeHtml(L.labels.guests))
    .replaceAll('{{label_notes}}', escapeHtml(L.labels.notes))
    .replaceAll('{{label_adults}}', escapeHtml(L.labels.adults))
  .replaceAll('{{label_children}}', escapeHtml(L.labels.children))
  .replaceAll('{{waTextEnc}}', waTextEnc);

  const subject = L.subject(data);

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    reply_to: replyTo,
    subject,
    html: template,
    text:
      `${L.h1}\n\n` +
      `${L.labels.dates}: ${data.checkIn} -> ${data.checkOut}\n` +
      `${L.labels.guests}: ${data.adults} ${L.labels.adults}, ${data.children} ${L.labels.children}\n` +
      `${L.labels.notes}: ${data.notes ?? '-'}`,
  });
  return result;
}
