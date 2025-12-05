import type { APIRoute } from 'astro';
import { sendClientReceipt } from '../../lib/clientReceipt';
import { ownerNoticeHtml, ownerNoticeText } from '../../lib/ownerNotice';
import { createInquiry, getListingBySlug, getOwnerById } from '../../lib/firestore/collections';
import type { InquiryOrigin, Listing } from '../../lib/firestore/types';
import { generateApproveUrl, generateDeclineUrl } from '../../lib/signing';
import { calculateQuote, getDefaultPricing } from '../../lib/pricing';
import { sendOwnerNotification } from '../../lib/emailRouting';
import { getVillaCurrency, getVillaOwnerEmail, getVillaNightlyRate, getVillaMinimumNights } from '../../config/i18n';

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

    // Honeypot (bot) check — pretend success silently
    if (required(data.company) || required(data.website) || required(data.hpt)) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Timing gate: require ~3s between form render and submit (bots submit instantly)
    const now = Date.now();
    const started = Number((data as any).__ts || 0);
    const dwellMs = Number.isFinite(started) ? now - started : 0;
    if (!started || dwellMs < 3000) {
      // Silent success: do not send emails; return OK so bots don't probe
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Basic validation
    const errors: Record<string, string> = {};
    if (!required(data.fullName)) errors.fullName = 'Required';
    if (!isEmail(data.email)) errors.email = 'Invalid email';
    if (!required(data.checkIn)) errors.checkIn = 'Required';
    if (!required(data.checkOut)) errors.checkOut = 'Required';
    if (Object.keys(errors).length) {
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

    // Villa context + language detection (do this early so we can use lang in Firestore)
    const slug = data.slug || data.villa || 'domaine-des-montarels';
    const origin: InquiryOrigin = data.origin || 'villa_site';
    const lang = data.lang ? (data.lang as 'en' | 'fr' | 'es') : detectLang(request);

    // Look up listing ONCE (avoid duplicate Firestore reads)
    let listing: Listing | null = null;
    try {
      listing = await getListingBySlug(slug);
    } catch (e) {
      console.warn('[inquire] Listing lookup failed:', e);
    }

    // Resolve owner email: Firestore owner > Villa config fallback
    // Priority: Firestore owner document (live data) > i18n.ts config (code fallback)
    let ownerEmail: string = getVillaOwnerEmail(slug); // Fallback from i18n config
    if (listing?.ownerId) {
      try {
        const owner = await getOwnerById(listing.ownerId);
        if (owner?.email) {
          ownerEmail = owner.email;
          console.log('[inquire] Owner email from Firestore:', { slug, ownerEmail, ownerId: listing.ownerId });
        }
      } catch (e) {
        console.warn('[inquire] Firestore owner lookup failed, using i18n fallback:', e);
      }
    } else {
      console.log('[inquire] No ownerId on listing, using i18n fallback:', { slug, ownerEmail });
    }

    // Persist inquiry to Firestore
    let inquiryId: string | undefined;
    
    // Determine currency BEFORE Firestore write (reuse for both Firestore and email)
    // Currency priority: Listing baseCurrency > Villa config > EUR fallback
    const currency: string = listing?.baseCurrency || getVillaCurrency(slug);
    
    try {
      // Build inquiry data - only include defined values (Firestore rejects undefined)
      const inquiryData: Record<string, any> = {
        listingId: listing?.id || slug,
        guestName: payload.fullName,
        guestEmail: payload.email,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
        partySize: payload.adults + payload.children,
        origin,
        status: 'pending_owner',
        currency, // EUR for Europe, USD for Americas
        lang,
        ownerEmailSnapshot: ownerEmail,
      };
      // Only add optional fields if they have values
      if (payload.phone) inquiryData.guestPhone = payload.phone;
      if (payload.notes) inquiryData.message = payload.notes;
      if (payload.occasion) inquiryData.occasion = payload.occasion;
      
      const inquiry = await createInquiry(inquiryData as any);
      inquiryId = inquiry.id;
      console.log('[inquire] Firestore inquiry created:', { inquiryId, slug, lang });
    } catch (firestoreErr) {
      // Log but don't fail - email flow should still work
      console.warn('[inquire] Firestore write failed (continuing with email):', firestoreErr);
    }

    // Base URL for action links
    const SITE_URL = import.meta.env.SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'https://lovethisplace-sites.vercel.app';
    const tag = lang === 'fr' ? '[FR]' : lang === 'es' ? '[ES]' : '[EN]';
    const subject = `${tag} New Inquiry — ${payload.fullName} (${payload.checkIn} → ${payload.checkOut})`;

    // Calculate proposed quote (using listing we already fetched)
    // Note: currency was already determined above before Firestore write
    let quoteAmount: number | undefined;
    
    if (listing) {
      try {
        // Get villa-specific nightly rate (0 = rate on request, no auto-quote)
        const villaRate = getVillaNightlyRate(slug);
        const villaMinNights = getVillaMinimumNights(slug);
        if (villaRate > 0) {
          const pricing = getDefaultPricing(listing, villaRate, villaMinNights);
          const quote = calculateQuote(
            pricing,
            payload.checkIn,
            payload.checkOut,
            payload.adults + payload.children
          );
          quoteAmount = quote.total;
        }
        // If villaRate is 0, quoteAmount stays undefined (rate on request)
      } catch (pricingErr) {
        console.warn('[inquire] Quote calculation failed:', pricingErr);
      }
    }

    // Generate signed action URLs (always if we have an inquiry ID - owner can set price)
    let approveUrl: string | undefined;
    let declineUrl: string | undefined;
    
    if (inquiryId) {
      // Use quote amount if available, otherwise 0 (owner will set final price)
      approveUrl = generateApproveUrl(SITE_URL, inquiryId, quoteAmount || 0, currency);
      declineUrl = generateDeclineUrl(SITE_URL, inquiryId);
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

    // Send owner notification (to Go Elite inbox, BCC owner)
    const sendResult = await sendOwnerNotification({
      listing,
      ownerEmail,
      guestEmail: payload.email,
      subject,
      html,
      text,
    });

    if (!sendResult.ok && !sendResult.preview) {
      console.error('[inquire] Owner notification failed:', sendResult.error);
      return new Response(JSON.stringify({ ok: false, error: 'Email send failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('[inquire] Owner notification sent:', { id: sendResult.id, preview: sendResult.preview });

    // Send branded client receipt (MUST await on serverless - non-blocking IIFE gets killed)
    try {
      const receiptResult = await sendClientReceipt({
        villaSlug: slug,
        villaName: listing?.name,
        replyTo: ownerEmail,
        to: payload.email,
        data: payload as any,
        lang
      });
      console.log('[inquire] Client receipt sent:', { to: payload.email, villa: slug, id: receiptResult.id });
    } catch (e) {
      console.warn('[inquire] Client receipt failed:', (e as any)?.message || e);
      // Don't fail the request if client receipt fails - owner email is more important
    }

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

    return new Response(JSON.stringify({ ok: true, emailId: sendResult.id, inquiryId }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
