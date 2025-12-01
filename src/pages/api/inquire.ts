import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendClientReceipt } from '../../lib/clientReceipt';
import { ownerNoticeHtml, ownerNoticeText } from '../../lib/ownerNotice';
import { createInquiry, getListingBySlug } from '../../lib/firestore/collections';
import type { InquiryOrigin, Listing } from '../../lib/firestore/types';
import { generateApproveUrl, generateDeclineUrl } from '../../lib/signing';
import { calculateQuote, getDefaultPricing } from '../../lib/pricing';

type InquireBody = {
  fullName?: string;
  name?: string; // accept alternate key from external clients
  email?: string;
  checkIn?: string;
  checkOut?: string;
  checkInDate?: string; // alternate key tolerance
  checkOutDate?: string;
  adults?: string | number;
  children?: string | number;
  notes?: string;
  occasion?: string;    // special occasion (birthday, anniversary, etc.)
  phone?: string;       // guest phone number
  slug?: string;        // villa slug for redirect
  villa?: string;       // alternate key for slug (from contact form)
  lang?: string;        // language for redirect
  origin?: InquiryOrigin; // where inquiry came from (defaults to villa_site)
  company?: string;     // honeypot
  website?: string;     // extra honeypot
  hpt?: string;         // extra honeypot (generic)
  __ts?: string;        // client timestamp (ms)
};

const required = (v?: string) => typeof v === 'string' && v.trim().length > 0;
const isEmail = (v?: string) => !!v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function parseBody(request: Request): Promise<InquireBody> {
  const ct = request.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const json = (await request.json()) as any;
      return json as InquireBody;
    }
  } catch (e) {
    // fall through to form parsing
  }
  try {
    const formData = await request.formData();
    return Object.fromEntries(formData.entries()) as any as InquireBody;
  } catch {
    return {};
  }
}

function detectLang(req: Request): 'en' | 'fr' | 'es' {
  try {
    const url = new URL(req.url);
    const param = (url.searchParams.get('lang') || '').toLowerCase();
    if (param === 'fr' || param === 'es' || param === 'en') return param as any;
  } catch {}
  const raw = (req.headers.get('accept-language') || '').toLowerCase();
  if (raw.startsWith('fr') || raw.includes(' fr-')) return 'fr';
  if (raw.startsWith('es') || raw.includes(' es-')) return 'es';
  return 'en';
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await parseBody(request);

    // Normalize alternate keys
    if (!data.fullName && data.name) data.fullName = data.name;
    if (!data.checkIn && data.checkInDate) data.checkIn = data.checkInDate;
    if (!data.checkOut && data.checkOutDate) data.checkOut = data.checkOutDate;

    // DEBUG: Log received form data
    console.log('=== FORM DATA RECEIVED ===');
    console.log('fullName:', data.fullName);
    console.log('email:', data.email);
    console.log('checkIn:', data.checkIn);
    console.log('checkOut:', data.checkOut);
    console.log('__ts:', (data as any).__ts);
    console.log('slug:', data.slug, 'villa:', data.villa);
    console.log('Content-Type:', request.headers.get('content-type'));
    console.log('Raw data keys:', Object.keys(data));
    console.log('=========================');

    // Honeypot (bot) check — pretend success silently
    if (required(data.company) || required(data.website) || required(data.hpt)) {
      console.log('Honeypot triggered - silent success');
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Timing gate: require ~3s between form render and submit (bots submit instantly)
    const now = Date.now();
    const started = Number((data as any).__ts || 0);
    const dwellMs = Number.isFinite(started) ? now - started : 0;
    console.log('Timing check - dwellMs:', dwellMs, 'started:', started, 'now:', now);
    if (!started || dwellMs < 3000) {
      // Silent success: do not send emails; return OK so bots don't probe
      console.log('Timing gate blocked - dwellMs:', dwellMs);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Basic validation
    const errors: Record<string, string> = {};
    if (!required(data.fullName)) errors.fullName = 'Required';
    if (!isEmail(data.email)) errors.email = 'Invalid email';
    if (!required(data.checkIn)) errors.checkIn = 'Required';
    if (!required(data.checkOut)) errors.checkOut = 'Required';
    if (Object.keys(errors).length) {
      // For HTML form submissions, redirect back with error
      const accept = (request.headers.get('accept') || '').toLowerCase();
      if (accept.includes('text/html')) {
        const formLang = data.lang || 'en';
        const formSlug = data.slug || data.villa || 'domaine-des-montarels';
        const errorUrl = new URL(`/villas/${formSlug}/${formLang}/`, request.url);
        errorUrl.searchParams.set('error', 'validation');
        return Response.redirect(errorUrl.toString(), 303);
      }
      return new Response(JSON.stringify({ ok: false, errors }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Normalized payload
    const payload = {
      fullName: String(data.fullName!).trim(),
      email: String(data.email!).trim(),
      checkIn: String(data.checkIn),
      checkOut: String(data.checkOut),
      adults: Number(data.adults ?? '2') || 2,
      children: Number(data.children ?? '0') || 0,
      notes: (data.notes ?? '').toString().slice(0, 2000),
      occasion: (data.occasion ?? '').toString().slice(0, 500),
      phone: (data.phone ?? '').toString().slice(0, 50),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined
    };

    // Villa context
    const slug = data.slug || data.villa || 'domaine-des-montarels';
    const origin: InquiryOrigin = data.origin || 'villa_site';

    // Try to persist inquiry to Firestore (non-blocking for email flow)
    let inquiryId: string | undefined;
    let listingId: string | undefined;
    
    console.log('[inquire] Starting Firestore operations for slug:', slug);
    
    try {
      // Look up listing by slug
      const listing = await getListingBySlug(slug);
      listingId = listing?.id;
      console.log('[inquire] Listing lookup result:', { slug, found: !!listing, listingId });
      
      // Create inquiry in Firestore
      // Note: Firestore doesn't accept undefined values, so we use conditional spreading
      const inquiryData: Parameters<typeof createInquiry>[0] = {
        listingId: listingId || slug,
        guestName: payload.fullName,
        guestEmail: payload.email,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        partySize: payload.adults + payload.children,
        origin,
        status: 'pending_owner',
        currency: listing?.baseCurrency || 'EUR',
      };
      
      // Only add optional fields if they have values
      if (payload.phone) inquiryData.guestPhone = payload.phone;
      if (payload.notes) inquiryData.message = payload.notes;
      if (payload.occasion) inquiryData.occasion = payload.occasion;
      
      const inquiry = await createInquiry(inquiryData);
      inquiryId = inquiry.id;
      console.log('[inquire] Firestore inquiry created:', { inquiryId, listingId, slug });
    } catch (firestoreErr: any) {
      // Log the actual error message so we can debug
      const errMsg = firestoreErr?.message || String(firestoreErr);
      console.error('[inquire] Firestore FAILED:', errMsg);
      console.error('[inquire] Full error:', JSON.stringify(firestoreErr, Object.getOwnPropertyNames(firestoreErr)));
    }

    // Env
    const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const OWNER_EMAIL = import.meta.env.OWNER_EMAIL || process.env.OWNER_EMAIL || 'reservations@domaine-desmontarels.com';
    // Use verified domain sender to maximize deliverability
    const FROM_EMAIL = import.meta.env.FROM_EMAIL || process.env.FROM_EMAIL || 'contact@visaiq.co';
    // Base URL for action links
    const SITE_URL = import.meta.env.SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'https://domaine-desmontarels-site.vercel.app';

    const lang = detectLang(request);
    const tag = lang === 'fr' ? '[FR]' : lang === 'es' ? '[ES]' : '[EN]';
    const subject = `${tag} New Inquiry — ${payload.fullName} (${payload.checkIn} → ${payload.checkOut})`;

    // Calculate proposed quote (owner will confirm/adjust)
    let quoteAmount: number | undefined;
    let currency: string = 'EUR';
    let listing: Listing | null = null;
    
    try {
      listing = await getListingBySlug(slug);
      console.log('[inquire] Listing lookup:', { slug, found: !!listing, listingId: listing?.id });
      
      if (listing) {
        currency = listing.baseCurrency;
        const pricing = getDefaultPricing(listing);
        const quote = calculateQuote(
          pricing,
          payload.checkIn,
          payload.checkOut,
          payload.adults + payload.children
        );
        quoteAmount = quote.total;
        console.log('[inquire] Quote calculated:', { quoteAmount, currency, nights: quote.nights });
      } else {
        // Fallback: use default pricing if listing not found
        // This ensures owner emails always have action buttons
        console.warn('[inquire] Listing not found, using fallback pricing for slug:', slug);
        const fallbackPricing = getDefaultPricing(null);
        const quote = calculateQuote(
          fallbackPricing,
          payload.checkIn,
          payload.checkOut,
          payload.adults + payload.children
        );
        quoteAmount = quote.total;
        console.log('[inquire] Fallback quote:', { quoteAmount, currency });
      }
    } catch (pricingErr) {
      console.warn('[inquire] Quote calculation failed:', pricingErr);
      // Last resort: provide a placeholder quote so buttons still appear
      // Owner will adjust the actual price
      quoteAmount = 0;
    }

    // Generate signed action URLs (if we have an inquiry ID)
    let approveUrl: string | undefined;
    let declineUrl: string | undefined;
    
    if (inquiryId) {
      // Always generate URLs if we have an inquiry ID
      // quoteAmount can be 0 (owner will set final price)
      approveUrl = generateApproveUrl(SITE_URL, inquiryId, quoteAmount || 0, currency);
      declineUrl = generateDeclineUrl(SITE_URL, inquiryId);
      console.log('[inquire] Action URLs generated:', { approveUrl: !!approveUrl, declineUrl: !!declineUrl, SITE_URL });
    } else {
      console.warn('[inquire] No inquiry ID - action URLs not generated');
    }

    const html = ownerNoticeHtml({
      ...payload,
      lang,
      quoteAmount,
      currency,
      approveUrl,
      declineUrl,
      villaName: listing?.name,
    });
    const text = ownerNoticeText({
      ...payload,
      lang,
      quoteAmount,
      currency,
      approveUrl,
      declineUrl,
      villaName: listing?.name,
    });

    if (!RESEND_API_KEY) {
      console.log('[inquire] (NOOP) Would send email:', { to: OWNER_EMAIL, from: FROM_EMAIL, subject, payload });
      return new Response(JSON.stringify({ ok: true, preview: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const resend = new Resend(RESEND_API_KEY);
    // Internal notification (owner only)
    const sendResult = await resend.emails.send({
      from: `Domaine des Montarels <${FROM_EMAIL}>`,
      to: OWNER_EMAIL,
      subject,
      html,
      text,
      reply_to: payload.email
    });

    if ((sendResult as any).error) {
      console.error('[inquire] Resend error:', (sendResult as any).error);
      return new Response(JSON.stringify({ ok: false, error: 'Email send failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const id = (sendResult as any)?.data?.id || (sendResult as any)?.id || undefined;
    console.log('[inquire] Owner email sent', { id, to: OWNER_EMAIL });

    // Send branded client receipt (non-blocking)
    (async () => {
      try {
        await sendClientReceipt({
          apiKey: RESEND_API_KEY!,
          from: 'Domaine des Montarels <contact@visaiq.co>', // verified sender domain
          replyTo: OWNER_EMAIL,
          to: payload.email,
          data: payload as any,
          lang
        });
        console.log('[inquire] Client receipt sent', { to: payload.email });
      } catch (e) {
        console.warn('[inquire] Client receipt failed:', (e as any)?.message || e);
      }
    })();

    const accept = (request.headers.get('accept') || '').toLowerCase();
    if (accept.includes('text/html')) {
      // Use villa slug and lang from form for proper localized redirect
      const formLang = data.lang || lang;
      const ty = new URL(`/villas/${slug}/${formLang}/thank-you`, request.url);
      ty.searchParams.set('name', payload.fullName);
      ty.searchParams.set('d', `${payload.checkIn} → ${payload.checkOut}`);
      if (inquiryId) ty.searchParams.set('ref', inquiryId);
      return Response.redirect(ty.toString(), 303);
    }

    return new Response(JSON.stringify({ ok: true, id, inquiryId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('[inquire] Fatal error:', err);
    return new Response(JSON.stringify({ ok: false, error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}

export const prerender = false; // keep server route
