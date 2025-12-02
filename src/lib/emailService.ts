// src/lib/emailService.ts
import nodemailer from 'nodemailer';

const SMTP_HOST =
  process.env.BREVO_SMTP_HOST || import.meta.env.BREVO_SMTP_HOST;
const SMTP_PORT =
  Number(process.env.BREVO_SMTP_PORT || import.meta.env.BREVO_SMTP_PORT || 587);
const SMTP_USER =
  process.env.BREVO_SMTP_USER || import.meta.env.BREVO_SMTP_USER;
const SMTP_PASS =
  process.env.BREVO_SMTP_PASS || import.meta.env.BREVO_SMTP_PASS;
const DEFAULT_FROM_EMAIL =
  process.env.FROM_EMAIL || import.meta.env.FROM_EMAIL || 'bookings@lovethisplace.co';
const DEFAULT_FROM_NAME =
  process.env.FROM_NAME || import.meta.env.FROM_NAME || 'Love This Place';

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    '[emailService] Missing SMTP env vars. Emails will fail until these are set.'
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // Brevo uses STARTTLS on 587
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;

  // Branding / identity
  fromEmail?: string;
  fromName?: string;

  // Routing
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

export async function sendEmail(opts: SendEmailOptions) {
  const fromEmail = opts.fromEmail || DEFAULT_FROM_EMAIL;
  const fromName = opts.fromName || DEFAULT_FROM_NAME;

  const mailFrom = `${fromName} <${fromEmail}>`;

  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to: opts.to,
      cc: opts.cc,
      bcc: opts.bcc,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || fromEmail,
    });

    console.log('[emailService] Email sent', {
      messageId: info.messageId,
      to: opts.to,
      subject: opts.subject,
    });

    return { ok: true, id: info.messageId };
  } catch (err: any) {
    console.error('[emailService] Failed to send email', err);
    return { ok: false, error: err?.message || 'Unknown error' };
  }
}
