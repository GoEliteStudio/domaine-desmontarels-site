/**
 * Centralized Email Routing for Go Elite Villa Engine
 * 
 * Architecture:
 * - All inquiry emails go to GOELITE_INBOX (primary) - INTERNAL ONLY
 * - Owner is BCC'd (so they get notified but can't reply-all to guest)
 * - Guest emails show professional reply-to (bookings@lovethisplace.co)
 * - Firestore Inquiry is the source of truth, email is notification only
 * 
 * IMPORTANT: Uses Brevo/nodemailer via emailService.ts ONLY.
 * No Resend usage anywhere in this project.
 * 
 * CRITICAL: GOELITE_INBOX should NEVER be visible to guests or owners.
 * Use PUBLIC_REPLY_TO for any customer-facing reply-to headers.
 */

import { sendEmail } from './emailService';
import type { Listing } from './firestore/types';

// Environment configuration
// GOELITE_INBOX is INTERNAL ONLY - never expose to customers
const GOELITE_INBOX = process.env.GOELITE_INBOX || import.meta.env.GOELITE_INBOX || 'inquiries@goelite.studio';
const FROM_EMAIL = process.env.FROM_EMAIL || import.meta.env.FROM_EMAIL || 'bookings@lovethisplace.co';
const FROM_NAME = process.env.FROM_NAME || import.meta.env.FROM_NAME || 'LoveThisPlace';
const OWNER_FALLBACK_EMAIL = process.env.OWNER_FALLBACK_EMAIL || import.meta.env.OWNER_FALLBACK_EMAIL || GOELITE_INBOX;

// PUBLIC reply-to for guest-facing emails - this is what customers see
const PUBLIC_REPLY_TO = process.env.PUBLIC_REPLY_TO || import.meta.env.PUBLIC_REPLY_TO || 'bookings@lovethisplace.co';

export { GOELITE_INBOX, PUBLIC_REPLY_TO };

export interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  preview?: boolean;
}

/**
 * Resolve owner email from Owner document or fallback
 * 
 * @param listing - The listing (may have ownerId)
 * @param getOwnerById - Function to fetch owner by ID
 * @returns Owner email or fallback
 */
export async function resolveOwnerEmail(
  listing: Listing | null,
  getOwnerById: (id: string) => Promise<{ email: string } | null>
): Promise<string> {
  if (listing?.ownerId) {
    try {
      const owner = await getOwnerById(listing.ownerId);
      if (owner?.email) return owner.email;
    } catch (e) {
      console.warn('[emailRouting] Failed to fetch owner:', e);
    }
  }
  return OWNER_FALLBACK_EMAIL;
}

/**
 * Send owner notification email
 * 
 * Routing:
 * - TO: Go Elite central inbox (you always see all leads)
 * - BCC: Owner (they get notified but can't reply-all)
 * - REPLY-TO: Guest email (so replies go to guest)
 * 
 * @example
 * await sendOwnerNotification({
 *   listing,
 *   ownerEmail: 'owner@villa.com',
 *   guestEmail: 'guest@example.com',
 *   subject: '[EN] New Inquiry — John Smith',
 *   html: ownerNoticeHtml(...),
 *   text: ownerNoticeText(...),
 * });
 */
export async function sendOwnerNotification(opts: {
  listing: Listing | null;
  ownerEmail: string | null;
  guestEmail: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const brandName = opts.listing?.name || FROM_NAME;

  try {
    const result = await sendEmail({
      to: GOELITE_INBOX,
      bcc: opts.ownerEmail || undefined,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.guestEmail,
      fromEmail: FROM_EMAIL,
      fromName: brandName,
    });

    if (!result.ok) {
      console.error('[emailRouting] sendEmail error:', result.error);
      return { ok: false, error: result.error || 'Send failed' };
    }

    console.log('[emailRouting] Owner notification sent:', { id: result.id, to: GOELITE_INBOX, bcc: opts.ownerEmail });
    return { ok: true, id: result.id };
  } catch (e: any) {
    console.error('[emailRouting] Exception sending owner notification:', e);
    return { ok: false, error: e.message || 'Unknown error' };
  }
}

/**
 * Send guest email (approval, decline, receipt, etc.)
 * 
 * Routing:
 * - TO: Guest
 * - BCC: Go Elite inbox (so we see what went out) - INTERNAL ONLY
 * - REPLY-TO: Public booking email (NEVER internal inbox)
 * 
 * @example
 * await sendGuestEmail({
 *   listing,
 *   toEmail: 'guest@example.com',
 *   subject: 'Your booking is confirmed!',
 *   html: '...',
 *   text: '...',
 * });
 */
export async function sendGuestEmail(opts: {
  listing: Listing | null;
  toEmail: string;
  replyTo?: string;  // Optional override, defaults to PUBLIC_REPLY_TO
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  const brandName = opts.listing?.name || FROM_NAME;

  try {
    const result = await sendEmail({
      to: opts.toEmail,
      bcc: GOELITE_INBOX,  // We always see what guest received - INTERNAL
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || PUBLIC_REPLY_TO,  // NEVER show internal email to guests
      fromEmail: FROM_EMAIL,
      fromName: brandName,
    });

    if (!result.ok) {
      console.error('[emailRouting] sendEmail error:', result.error);
      return { ok: false, error: result.error || 'Send failed' };
    }

    console.log('[emailRouting] Guest email sent:', { id: result.id, to: opts.toEmail });
    return { ok: true, id: result.id };
  } catch (e: any) {
    console.error('[emailRouting] Exception sending guest email:', e);
    return { ok: false, error: e.message || 'Unknown error' };
  }
}

// Export remaining constants for use in other modules
export { FROM_EMAIL, FROM_NAME, OWNER_FALLBACK_EMAIL };
