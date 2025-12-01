/**
 * Stripe Webhook Handler
 * 
 * Receives webhook events from Stripe when payment is completed.
 * Updates inquiry status and creates booking record.
 * 
 * POST /api/stripe-webhook
 * 
 * Required env: STRIPE_WEBHOOK_SECRET (get from Stripe Dashboard)
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getDb } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';

export const prerender = false;

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET;
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const FROM_EMAIL = import.meta.env.FROM_EMAIL || 'bookings@goelite.studio';
const OWNER_EMAIL = import.meta.env.OWNER_EMAIL || 'reservations@domaine-desmontarels.com';

// Initialize Stripe
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
}) : null;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export const POST: APIRoute = async ({ request }) => {
  if (!stripe) {
    console.error('[webhook] Stripe not configured');
    return new Response('Stripe not configured', { status: 500 });
  }

  // Get raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[webhook] Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    if (STRIPE_WEBHOOK_SECRET) {
      // Verify webhook signature (production)
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } else {
      // Development mode - parse without verification (NOT for production!)
      console.warn('[webhook] ⚠️ STRIPE_WEBHOOK_SECRET not set - skipping signature verification');
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  console.log('[webhook] Received event:', event.type);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;
    
    case 'checkout.session.expired':
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;
    
    default:
      console.log('[webhook] Unhandled event type:', event.type);
  }

  return new Response(JSON.stringify({ received: true }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

/**
 * Handle successful payment
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const inquiryId = session.metadata?.inquiryId;
  
  if (!inquiryId) {
    console.error('[webhook] No inquiryId in session metadata');
    return;
  }

  console.log('[webhook] Processing payment for inquiry:', inquiryId);

  const db = getDb();
  const inquiryRef = db.collection('inquiries').doc(inquiryId);
  const inquirySnap = await inquiryRef.get();

  if (!inquirySnap.exists) {
    console.error('[webhook] Inquiry not found:', inquiryId);
    return;
  }

  const inquiry = inquirySnap.data()!;

  // Get listing and owner info
  let listing: any = null;
  let owner: any = null;
  
  if (inquiry.listingId) {
    const listingSnap = await db.collection('listings').doc(inquiry.listingId).get();
    if (listingSnap.exists) {
      listing = listingSnap.data();
      
      if (listing.ownerId) {
        const ownerSnap = await db.collection('owners').doc(listing.ownerId).get();
        if (ownerSnap.exists) {
          owner = ownerSnap.data();
        }
      }
    }
  }

  // Calculate commission split
  const totalAmount = inquiry.quoteAmount || (session.amount_total! / 100);
  const commissionPercent = listing?.commissionPercent || owner?.commissionPercent || 10;
  const platformFeeAmount = Math.round(totalAmount * (commissionPercent / 100) * 100) / 100;
  const ownerAmount = totalAmount - platformFeeAmount;

  // Create booking record
  const bookingData = {
    listingId: inquiry.listingId,
    ownerId: listing?.ownerId || null,
    inquiryId,
    channel: 'direct' as const,
    currency: inquiry.currency,
    totalAmount,
    platformFeePercent: commissionPercent,
    platformFeeAmount,
    ownerAmount,
    status: 'paid' as const,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const bookingRef = await db.collection('bookings').add(bookingData);
  console.log('[webhook] Booking created:', bookingRef.id);

  // Update inquiry status
  await inquiryRef.update({
    status: 'paid',
    bookingId: bookingRef.id,
    paidAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Send confirmation emails
  await sendPaymentConfirmationEmails(inquiry, listing, {
    bookingId: bookingRef.id,
    totalAmount,
    ownerAmount,
    platformFeeAmount,
    currency: inquiry.currency,
  });

  console.log('[webhook] Payment processed successfully:', {
    inquiryId,
    bookingId: bookingRef.id,
    totalAmount,
    ownerAmount,
  });
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const inquiryId = session.metadata?.inquiryId;
  
  if (!inquiryId) return;

  console.log('[webhook] Checkout expired for inquiry:', inquiryId);

  const db = getDb();
  const inquiryRef = db.collection('inquiries').doc(inquiryId);
  
  // Reset status to approved (owner can resend payment link)
  await inquiryRef.update({
    status: 'approved', // Back to approved, not awaiting_payment
    stripeSessionId: null,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Send confirmation emails to guest and owner
 */
async function sendPaymentConfirmationEmails(
  inquiry: any,
  listing: any,
  payment: {
    bookingId: string;
    totalAmount: number;
    ownerAmount: number;
    platformFeeAmount: number;
    currency: string;
  }
) {
  if (!resend) {
    console.warn('[webhook] Resend not configured - skipping confirmation emails');
    return;
  }

  const villaName = listing?.name || 'Your Villa';
  const currencySymbol = getCurrencySymbol(payment.currency);
  const dateRange = `${inquiry.checkIn} → ${inquiry.checkOut}`;

  // Email to guest
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: inquiry.guestEmail,
      subject: `Booking Confirmed! ${villaName} - ${dateRange}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #2d7d46; }
    .content { padding: 30px 0; }
    .highlight { background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2d7d46; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #2d7d46; margin: 0;">✓ Booking Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear ${inquiry.guestName},</p>
      <p>Your payment has been received and your booking is now confirmed!</p>
      
      <div class="highlight">
        <h3 style="margin-top: 0;">${villaName}</h3>
        <p><strong>Check-in:</strong> ${inquiry.checkIn}</p>
        <p><strong>Check-out:</strong> ${inquiry.checkOut}</p>
        <p><strong>Guests:</strong> ${inquiry.partySize}</p>
        <p><strong>Total Paid:</strong> ${currencySymbol}${payment.totalAmount.toLocaleString()}</p>
        <p><strong>Booking Reference:</strong> ${payment.bookingId}</p>
      </div>
      
      <p>We'll send you detailed arrival instructions closer to your check-in date.</p>
      <p>If you have any questions, simply reply to this email.</p>
      
      <p>We can't wait to welcome you!</p>
    </div>
    <div class="footer">
      <p>Go Elite Studio • Luxury Villa Bookings</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log('[webhook] Guest confirmation email sent');
  } catch (err) {
    console.error('[webhook] Failed to send guest email:', err);
  }

  // Email to owner
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: `💰 Payment Received! ${inquiry.guestName} - ${dateRange}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2d7d46; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; background: #fff; border: 1px solid #eee; border-top: none; }
    .money { background: #f0fff4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">💰 Payment Received!</h1>
    </div>
    <div class="content">
      <h2>${inquiry.guestName}</h2>
      <p><strong>Villa:</strong> ${villaName}</p>
      <p><strong>Dates:</strong> ${dateRange}</p>
      <p><strong>Guests:</strong> ${inquiry.partySize}</p>
      
      <div class="money">
        <p><strong>Total Charged:</strong> ${currencySymbol}${payment.totalAmount.toLocaleString()}</p>
        <p><strong>Platform Fee (${listing?.commissionPercent || 10}%):</strong> ${currencySymbol}${payment.platformFeeAmount.toLocaleString()}</p>
        <p style="font-size: 20px; color: #2d7d46;"><strong>Your Payout:</strong> ${currencySymbol}${payment.ownerAmount.toLocaleString()}</p>
      </div>
      
      <p><strong>Guest Email:</strong> ${inquiry.guestEmail}</p>
      <p><strong>Booking Ref:</strong> ${payment.bookingId}</p>
      
      <p style="color: #666; font-size: 14px;">Payout will be transferred to your connected Stripe account within 2-7 business days.</p>
    </div>
    <div class="footer">
      <p>Go Elite Studio • Villa Management Platform</p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    console.log('[webhook] Owner confirmation email sent');
  } catch (err) {
    console.error('[webhook] Failed to send owner email:', err);
  }
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ',
    COP: 'COP $', MXN: 'MX$', BRL: 'R$',
  };
  return symbols[currency?.toUpperCase()] || `${currency} `;
}
