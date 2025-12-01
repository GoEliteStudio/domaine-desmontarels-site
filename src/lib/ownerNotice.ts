function esc(s = '') {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

export function langTag(lang: 'en' | 'fr' | 'es'): string {
  return lang === 'fr' ? '[FR]' : lang === 'es' ? '[ES]' : '[EN]';
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ',
    COP: 'COP $', MXN: 'MX$', BRL: 'R$', ARS: 'ARS $',
    CAD: 'CA$', AUD: 'A$', NZD: 'NZ$', ZAR: 'R',
    THB: '฿', IDR: 'Rp', MYR: 'RM', AED: 'AED ', SAR: 'SAR ',
    INR: '₹', JPY: '¥', CNY: '¥', KRW: '₩',
    SEK: 'kr', NOK: 'kr', DKK: 'kr', PLN: 'zł',
    CZK: 'Kč', HUF: 'Ft', TRY: '₺', ILS: '₪',
  };
  return symbols[currency] || `${currency} `;
}

export interface OwnerNoticePayload {
  fullName: string;
  email: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  notes?: string;
  ip?: string;
  userAgent?: string;
  lang?: 'en' | 'fr' | 'es';
  // New fields for action buttons
  quoteAmount?: number;
  currency?: string;
  approveUrl?: string;
  declineUrl?: string;
  villaName?: string;
}

export function ownerNoticeHtml(payload: OwnerNoticePayload) {
  const wa = `https://wa.me/15164936070?text=${encodeURIComponent(
    `Hi, this is ${payload.fullName} about ${payload.checkIn} → ${payload.checkOut}.`
  )}`;
  const mailtoGuest = `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent(
    `Re: ${payload.villaName || 'Domaine des Montarels'} — ${payload.checkIn} → ${payload.checkOut}`
  )}`;

  const tag = langTag(payload.lang || 'en');
  const brandName = payload.villaName || 'DOMAINE DES MONTARELS';
  
  // Quote display
  const hasQuote = payload.quoteAmount && payload.currency;
  const quoteDisplay = hasQuote 
    ? `${getCurrencySymbol(payload.currency!)}${payload.quoteAmount!.toLocaleString()}`
    : null;
  
  // Action buttons HTML
  const actionButtonsHtml = payload.approveUrl && payload.declineUrl ? `
        <div style="margin:24px 0;padding:20px;background:#f8f6f4;border-radius:12px;text-align:center;">
          <p style="margin:0 0 8px;font-size:14px;color:#666;">Respond to this inquiry:</p>
          ${hasQuote ? `<p style="margin:0 0 16px;font-size:24px;font-weight:600;color:#1a1a1a;">Proposed Total: ${quoteDisplay}</p>` : ''}
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            <a href="${esc(payload.approveUrl)}" style="display:inline-block;background:#2d7d46;color:#fff !important;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
              ✓ Approve${hasQuote ? ` ${quoteDisplay}` : ''}
            </a>
            <a href="${esc(payload.declineUrl)}" style="display:inline-block;background:#c0392b;color:#fff !important;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.5px;">
              ✗ Decline
            </a>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:#999;">Links expire in 72 hours</p>
        </div>
  ` : '';

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
        <div class="brand">${esc(brandName.toUpperCase())}</div>
        <div class="pill">New inquiry ${esc(tag)}</div>
      </div>
      <div class="card">
        <h1>${esc(payload.fullName)}</h1>
        <div class="muted">Dates: ${esc(payload.checkIn)} → ${esc(payload.checkOut)} • ${payload.adults} adults, ${payload.children} children</div>

        <ul class="list">
          <li><strong>Email:</strong> ${esc(payload.email)}</li>
          ${hasQuote ? `<li><strong>Proposed Quote:</strong> ${quoteDisplay}</li>` : ''}
          <li><strong>Notes:</strong> ${esc(payload.notes || '—')}</li>
          <li><strong>IP:</strong> ${esc(payload.ip || '—')}</li>
          <li><strong>UA:</strong> ${esc(payload.userAgent || '—')}</li>
        </ul>

        ${actionButtonsHtml}

        <div class="row">
          <a class="btn" href="${mailtoGuest}">Reply to guest</a>
          <a class="btn btn-secondary" href="${wa}">Open WhatsApp</a>
        </div>

        <p class="muted" style="margin-top:12px">Tip: use "Reply to guest" so your response thread is clean.</p>
      </div>

      <div class="footer">
        © ${new Date().getFullYear()} ${esc(payload.villaName || 'Domaine des Montarels')} • Internal notification
      </div>
    </div>
  </body></html>`;
}

export function ownerNoticeText(p: OwnerNoticePayload) {
  const tag = langTag(p.lang || 'en');
  const hasQuote = p.quoteAmount && p.currency;
  const quoteDisplay = hasQuote 
    ? `${getCurrencySymbol(p.currency!)}${p.quoteAmount!.toLocaleString()}`
    : null;
  
  const lines = [
    `New Inquiry ${tag} — ${p.fullName}`,
    `Villa: ${p.villaName || 'Domaine des Montarels'}`,
    `Dates: ${p.checkIn} -> ${p.checkOut}`,
    `Guests: ${p.adults} adults, ${p.children} children`,
    `Email: ${p.email}`,
  ];
  
  if (hasQuote) {
    lines.push(`Proposed Quote: ${quoteDisplay}`);
  }
  
  lines.push(`Notes: ${p.notes || '-'}`);
  lines.push(`IP: ${p.ip || '-'}`);
  lines.push(`UA: ${p.userAgent || '-'}`);
  
  if (p.approveUrl && p.declineUrl) {
    lines.push('');
    lines.push('--- ACTIONS ---');
    lines.push(`APPROVE${hasQuote ? ` ${quoteDisplay}` : ''}: ${p.approveUrl}`);
    lines.push(`DECLINE: ${p.declineUrl}`);
    lines.push('(Links expire in 72 hours)');
  }
  
  return lines.join('\n');
}
