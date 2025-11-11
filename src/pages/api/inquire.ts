import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendClientReceipt } from '../../lib/clientReceipt';
import { ownerNoticeHtml, ownerNoticeText } from '../../lib/ownerNotice';

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
  company?: string; // honeypot
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await parseBody(request);

    // Normalize alternate keys
    if (!data.fullName && data.name) data.fullName = data.name;
    if (!data.checkIn && data.checkInDate) data.checkIn = data.checkInDate;
    if (!data.checkOut && data.checkOutDate) data.checkOut = data.checkOutDate;

    // Honeypot (bot) check — pretend success silently
    if (required(data.company)) {
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
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined
    };

    // Env
    const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY;
    const OWNER_EMAIL = import.meta.env.OWNER_EMAIL || process.env.OWNER_EMAIL || 'reservations@domaine-desmontarels.com';
  // Use verified domain sender to maximize deliverability
  const FROM_EMAIL = import.meta.env.FROM_EMAIL || process.env.FROM_EMAIL || 'contact@visaiq.co';

    const subject = `New Inquiry — ${payload.fullName} (${payload.checkIn} → ${payload.checkOut})`;

    const html = ownerNoticeHtml(payload);
    const text = ownerNoticeText(payload);

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
          data: payload as any
        });
        console.log('[inquire] Client receipt sent', { to: payload.email });
      } catch (e) {
        console.warn('[inquire] Client receipt failed:', (e as any)?.message || e);
      }
    })();

    const accept = (request.headers.get('accept') || '').toLowerCase();
    if (accept.includes('text/html')) {
      const ty = new URL('/thank-you', request.url);
      ty.searchParams.set('name', payload.fullName);
      ty.searchParams.set('d', `${payload.checkIn} → ${payload.checkOut}`);
      return Response.redirect(ty.toString(), 303);
    }

    return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
