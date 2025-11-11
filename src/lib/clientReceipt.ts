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
  <span class="preheader">We’ve received your inquiry. Our concierge will reply shortly with availability and next steps.</span>
  <div class="wrap">
    <div class="hero">
      <div class="brand">DOMAINE DES MONTARELS</div>
      <div style="margin-top:12px"><span class="pill">Inquiry received</span></div>
    </div>

    <div class="card">
      <h1 class="h1">Thank you — we’ve received your inquiry</h1>
      <p class="muted">Our team will confirm availability, total pricing, and next steps. If this is time-sensitive, feel free to WhatsApp us for a faster reply.</p>

      <!-- Summary -->
      <ul class="list">
        <li><strong>Name:</strong> {{fullName}}</li>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Dates:</strong> {{checkIn}} → {{checkOut}}</li>
        <li><strong>Guests:</strong> {{adults}} adults, {{children}} children</li>
        {{#notes}}<li><strong>Notes:</strong> {{notes}}</li>{{/notes}}
      </ul>

      <div style="margin:22px 0 8px">
        <a class="btn" href="https://wa.me/15164936070?text=Hi%20Montarels%20team%2C%20this%20is%20{{fullName}}%20about%20{{checkIn}}%20to%20{{checkOut}}.">WhatsApp Concierge</a>
        <span style="display:inline-block;margin-left:14px">
          or email <a href="mailto:reservations@domaine-desmontarels.com">reservations@domaine-desmontarels.com</a>
        </span>
      </div>

      <p class="muted" style="margin-top:18px">Tip: reply to this email if you need to adjust dates or guest count.</p>
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
}: {
  apiKey: string;
  from: string; // must be verified domain sender
  replyTo: string; // your real inbox to receive replies
  to: string; // client email
  data: Record<string, string | number | undefined>;
}) {
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
    .replaceAll('{{year}}', String(new Date().getFullYear()));

  const subject = `Domaine des Montarels — We received your inquiry (${data.checkIn} → ${data.checkOut})`;

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from,
    to,
    reply_to: replyTo,
    subject,
    html: template,
    text: `We’ve received your inquiry. Dates: ${data.checkIn} to ${data.checkOut}. Guests: ${data.adults} adults, ${data.children} children. Notes: ${data.notes ?? '-'}. We’ll reply shortly. WhatsApp: +1 516 493 6070`,
  });
  return result;
}
