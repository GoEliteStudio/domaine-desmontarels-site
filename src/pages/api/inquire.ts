import type { APIRoute } from 'astro';
import { Resend } from 'resend';

type InquireBody = {
  fullName?: string;
  email?: string;
  checkIn?: string;
  checkOut?: string;
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
      return new Response(JSON.stringify({ ok: false, errors }), { status: 400 });
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
    const FROM_EMAIL = import.meta.env.FROM_EMAIL || process.env.FROM_EMAIL || 'no-reply@domaine-desmontarels.com';

    const subject = `New Inquiry — ${payload.fullName} (${payload.checkIn} → ${payload.checkOut})`;

    const html = `
      <h2>Domaine des Montarels — New Inquiry</h2>
      <ul>
        <li><strong>Name:</strong> ${escapeHtml(payload.fullName)}</li>
        <li><strong>Email:</strong> ${escapeHtml(payload.email)}</li>
        <li><strong>Dates:</strong> ${escapeHtml(payload.checkIn)} → ${escapeHtml(payload.checkOut)}</li>
        <li><strong>Guests:</strong> ${payload.adults} adults, ${payload.children} children</li>
      </ul>
      ${payload.notes ? `<p><strong>Notes:</strong> ${escapeHtml(payload.notes)}</p>` : ''}
      <hr />
      <small>UA: ${escapeHtml(payload.userAgent || '')} | IP: ${escapeHtml(String(payload.ip || ''))}</small>
    `;
    const text = `New Inquiry\n\nName: ${payload.fullName}\nEmail: ${payload.email}\nDates: ${payload.checkIn} → ${payload.checkOut}\nGuests: ${payload.adults} adults, ${payload.children} children\n\nNotes: ${payload.notes}`;

    if (!RESEND_API_KEY) {
      console.log('[inquire] (NOOP) Would send email:', { to: OWNER_EMAIL, from: FROM_EMAIL, subject, payload });
      return new Response(JSON.stringify({ ok: true, preview: true }), { status: 200 });
    }

    const resend = new Resend(RESEND_API_KEY);
    const sendResult = await resend.emails.send({
      from: `Domaine des Montarels <${FROM_EMAIL}>`,
      to: [OWNER_EMAIL, payload.email],
      subject,
      html,
      text,
      reply_to: payload.email
    });

    if ((sendResult as any).error) {
      console.error('[inquire] Resend error:', (sendResult as any).error);
      return new Response(JSON.stringify({ ok: false }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('[inquire] Fatal error:', err);
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
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
