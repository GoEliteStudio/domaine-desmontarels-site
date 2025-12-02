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
    `Re: ${payload.villaName || 'Your Villa'} — ${payload.checkIn} → ${payload.checkOut}`
  )}`;

  const tag = langTag(payload.lang || 'en');
  const brandName = payload.villaName || 'VILLA INQUIRY';
  
  // Quote display
  const hasQuote = payload.quoteAmount && payload.currency;
  const quoteDisplay = hasQuote 
    ? `${getCurrencySymbol(payload.currency!)}${payload.quoteAmount!.toLocaleString()}`
    : null;
  
  // Action buttons HTML - table-based for proper alignment
  const actionButtonsHtml = payload.approveUrl && payload.declineUrl ? `
              <!-- Action Buttons Section -->
              <tr>
                <td style="padding:0 40px 32px">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;border-radius:12px">
                    <tr>
                      <td style="padding:28px 24px;text-align:center">
                        <p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Respond to this inquiry</p>
                        ${hasQuote ? `<p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:500;color:#1a1a1a;margin:0 0 24px">Proposed Total: ${quoteDisplay}</p>` : ''}
                        
                        <!-- Approve/Decline Buttons -->
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                          <tr>
                            <td style="padding-right:8px">
                              <a href="${esc(payload.approveUrl)}" style="display:inline-block;background-color:#2d7d46;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px">✓ Approve${hasQuote ? ` ${quoteDisplay}` : ''}</a>
                            </td>
                            <td style="padding-left:8px">
                              <a href="${esc(payload.declineUrl)}" style="display:inline-block;background-color:#dc3545;color:#ffffff;text-decoration:none;padding:16px 32px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px">✗ Decline</a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;margin:20px 0 0">Links expire in 72 hours</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Inquiry — ${esc(payload.fullName)}</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0!important;padding:0!important;width:100%!important;background-color:#f5f5f4}
    @media screen and (max-width:600px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-padding{padding:20px 16px!important}
      .mobile-btn{display:block!important;width:100%!important;margin-bottom:12px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4">
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f4">
    <tr>
      <td align="center" style="padding:24px 16px">
        
        <!-- Email Container - Max 560px for better readability -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" class="mobile-full" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Elegant Black Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:28px 40px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:500;letter-spacing:2px;color:#ffffff;margin:0;text-transform:uppercase">${esc(brandName.toUpperCase())}</h1>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background-color:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#ffffff;padding:6px 14px;border-radius:20px;font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:0.5px">New Inquiry ${esc(tag)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Guest Info -->
          <tr>
            <td class="mobile-padding" style="padding:32px 40px 24px">
              <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 8px">${esc(payload.fullName)}</h2>
              <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280;margin:0">${esc(payload.checkIn)} → ${esc(payload.checkOut)} • ${payload.adults} adults${payload.children > 0 ? `, ${payload.children} children` : ''}</p>
            </td>
          </tr>
          
          <!-- Details Card -->
          <tr>
            <td style="padding:0 40px 24px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;border-radius:8px">
                <tr>
                  <td style="padding:20px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e5e5">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Guest Email</span><br>
                          <a href="mailto:${esc(payload.email)}" style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;text-decoration:none">${esc(payload.email)}</a>
                        </td>
                      </tr>
                      ${hasQuote ? `
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e5e5e5">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Proposed Quote</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#2d7d46;font-weight:600">${quoteDisplay}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:8px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Notes</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a">${esc(payload.notes || '—')}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${actionButtonsHtml}
          
          <!-- Contact Buttons -->
          <tr>
            <td style="padding:0 40px 24px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding-right:6px" width="50%">
                    <a href="${mailtoGuest}" style="display:block;background-color:#0a0a0a;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:600;text-align:center;letter-spacing:0.5px">Reply to Guest</a>
                  </td>
                  <td style="padding-left:6px" width="50%">
                    <a href="${wa}" style="display:block;background-color:#25D366;color:#ffffff;text-decoration:none;padding:14px 20px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:600;text-align:center;letter-spacing:0.5px">WhatsApp</a>
                  </td>
                </tr>
              </table>
              <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#9ca3af;margin:12px 0 0;text-align:center">Tip: Reply to guest keeps your email thread organized</p>
            </td>
          </tr>
          
          <!-- Technical Details (Collapsed) -->
          <tr>
            <td style="padding:0 40px 24px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e5e5e5">
                <tr>
                  <td style="padding:16px 0 0">
                    <p style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9ca3af;margin:0"><strong>IP:</strong> ${esc(payload.ip || '—')}</p>
                    <p style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9ca3af;margin:4px 0 0;word-break:break-all"><strong>UA:</strong> ${esc(payload.userAgent || '—')}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 40px">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Elegant LoveThisPlace Logo -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right:8px;vertical-align:middle">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="heartGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style="stop-color:#d4af37"/>
                                <stop offset="50%" style="stop-color:#f4d03f"/>
                                <stop offset="100%" style="stop-color:#c9a96e"/>
                              </linearGradient>
                            </defs>
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#heartGold)"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle">
                          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;font-weight:500;color:#ffffff;letter-spacing:1px">LoveThisPlace</span>
                        </td>
                      </tr>
                    </table>
                    <p style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#6b7280;margin:12px 0 0">Internal notification • ${new Date().getFullYear()}</p>
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
