function esc(s = '') {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

export function ownerNoticeHtml(payload: {
  fullName: string; email: string; checkIn: string; checkOut: string;
  adults: number; children: number; notes?: string; ip?: string; userAgent?: string;
}) {
  const wa = `https://wa.me/15164936070?text=${encodeURIComponent(
    `Hi, this is ${payload.fullName} about ${payload.checkIn} → ${payload.checkOut}.`
  )}`;
  const mailtoGuest = `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent(
    `Re: Domaine des Montarels — ${payload.checkIn} → ${payload.checkOut}`
  )}`;

  return `<!doctype html><html><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Inquiry — ${esc(payload.fullName)}</title>
  <style>
    body{margin:0;background:#0f0f0f;color:#111;font-family:Inter,Segoe UI,Arial,Helvetica,sans-serif}
    .wrap{max-width:680px;margin:0 auto;background:#fff}
    .hero{background:#111;color:#fff;padding:22px 24px}
    .brand{font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:2px;font-weight:600}
    .pill{display:inline-block;margin-top:8px;padding:4px 10px;border:1px solid #444;border-radius:999px;font-size:12px;color:#ddd}
    .card{padding:24px}
    h1{font-family:"Cormorant Garamond",Georgia,serif;font-weight:500;margin:0 0 6px}
    .muted{color:#6b7280;font-size:13px}
    .list{list-style:none;margin:14px 0 0;padding:0;border:1px solid #eee;border-radius:10px;overflow:hidden}
    .list li{padding:12px 14px;border-top:1px solid #eee;font-size:15px}
    .list li:first-child{border-top:none}
    .row{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 0}
    .btn{display:inline-block;background:#a58e76;color:#fff !important;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:13px;letter-spacing:1px;text-transform:uppercase}
    .btn-secondary{background:#111}
    .footer{padding:18px 24px 30px;color:#9ca3af;font-size:12px}
    @media (max-width:480px){.card{padding:18px}}
  </style>
  </head><body>
    <div class="wrap">
      <div class="hero">
        <div class="brand">DOMAINE DES MONTARELS</div>
        <div class="pill">New inquiry</div>
      </div>
      <div class="card">
        <h1>${esc(payload.fullName)}</h1>
        <div class="muted">Dates: ${esc(payload.checkIn)} → ${esc(payload.checkOut)} • ${payload.adults} adults, ${payload.children} children</div>

        <ul class="list">
          <li><strong>Email:</strong> ${esc(payload.email)}</li>
          <li><strong>Notes:</strong> ${esc(payload.notes || '—')}</li>
          <li><strong>IP:</strong> ${esc(payload.ip || '—')}</li>
          <li><strong>UA:</strong> ${esc(payload.userAgent || '—')}</li>
        </ul>

        <div class="row">
          <a class="btn" href="${mailtoGuest}">Reply to guest</a>
          <a class="btn btn-secondary" href="${wa}">Open WhatsApp</a>
        </div>

        <p class="muted" style="margin-top:12px">Tip: use “Reply to guest” so your response thread is clean.</p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} Domaine des Montarels • Internal notification
      </div>
    </div>
  </body></html>`;
}

export function ownerNoticeText(p: {
  fullName: string; email: string; checkIn: string; checkOut: string;
  adults: number; children: number; notes?: string; ip?: string; userAgent?: string;
}) {
  return [
    `New Inquiry — ${p.fullName}`,
    `Dates: ${p.checkIn} -> ${p.checkOut}`,
    `Guests: ${p.adults} adults, ${p.children} children`,
    `Email: ${p.email}`,
    `Notes: ${p.notes || '-'}`,
    `IP: ${p.ip || '-'}`,
    `UA: ${p.userAgent || '-'}`,
  ].join('\n');
}
