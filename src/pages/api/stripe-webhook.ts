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
import { sendGuestEmail, sendOwnerNotification, PUBLIC_REPLY_TO } from '../../lib/emailRouting';

export const prerender = false;

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET;

// Initialize Stripe
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
}) : null;

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
  const villaName = listing?.name || 'Your Villa';
  const currencySymbol = getCurrencySymbol(payment.currency);
  const dateRange = `${inquiry.checkIn} → ${inquiry.checkOut}`;

  // Email to guest
  try {
    await sendGuestEmail({
      listing,
      toEmail: inquiry.guestEmail,
      replyTo: PUBLIC_REPLY_TO,  // Professional public email, not internal inbox
      subject: `Booking Confirmed! ${villaName} — ${dateRange}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${villaName} — Booking Confirmed</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0!important;padding:0!important;width:100%!important;background-color:#f5f5f4}
    @media screen and (max-width:600px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-padding{padding:20px 16px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4">
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f4">
    <tr>
      <td align="center" style="padding:24px 16px">
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="mobile-full" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Elegant Black Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:32px 40px;text-align:center">
              <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:500;letter-spacing:3px;color:#ffffff;margin:0;text-transform:uppercase">${villaName}</h1>
            </td>
          </tr>
          
          <!-- Success Badge -->
          <tr>
            <td align="center" style="padding:28px 24px 0">
              <span style="display:inline-block;background-color:#2d7d46;color:#ffffff;padding:8px 20px;border-radius:20px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase">✓ Payment Confirmed</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding:24px 40px 32px">
              
              <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.3;text-align:center">Your Booking is Confirmed!</h2>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;text-align:center">Dear ${inquiry.guestName}, your payment has been received and your stay is confirmed.</p>
              
              <!-- Booking Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0fff4;border-radius:8px;margin-bottom:24px;border-left:4px solid #2d7d46">
                <tr>
                  <td style="padding:24px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:8px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b7280">Check-in</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a;font-weight:500">${inquiry.checkIn}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b7280">Check-out</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a;font-weight:500">${inquiry.checkOut}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b7280">Guests</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a">${inquiry.partySize}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 0">
                          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2d7d46;font-weight:600">Total Paid: ${currencySymbol}${payment.totalAmount.toLocaleString()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b7280">Booking Reference: <strong style="color:#1a1a1a">${payment.bookingId}</strong></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;margin:0 0 16px;line-height:1.6;text-align:center">We'll send you detailed arrival instructions closer to your check-in date.</p>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#9ca3af;margin:16px 0 0;text-align:center">Questions? Simply reply to this email.</p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 40px;text-align:center">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#ffffff;margin:0">${villaName}</p>
              <p style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#6b7280;margin:8px 0 0">© ${new Date().getFullYear()} All rights reserved.</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`.trim(),
      text: `${villaName.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nBOOKING CONFIRMED!\n\nDear ${inquiry.guestName},\n\nYour payment has been received and your booking is now confirmed!\n\n${villaName}\nCheck-in: ${inquiry.checkIn}\nCheck-out: ${inquiry.checkOut}\nGuests: ${inquiry.partySize}\nTotal Paid: ${currencySymbol}${payment.totalAmount.toLocaleString()}\nBooking Reference: ${payment.bookingId}\n\nWe'll send you detailed arrival instructions closer to your check-in date.\n\nWe can't wait to welcome you!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${villaName}\n© ${new Date().getFullYear()} All rights reserved.`,
    });
    console.log('[webhook] Guest confirmation email sent');
  } catch (err) {
    console.error('[webhook] Failed to send guest email:', err);
  }

  // Email to owner (via Go Elite inbox with BCC to owner)
  try {
    await sendOwnerNotification({
      listing,
      ownerEmail: inquiry.ownerEmailSnapshot || null,
      guestEmail: inquiry.guestEmail,
      subject: `💰 Payment Received! ${inquiry.guestName} — ${dateRange}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${villaName} — Payment Received</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0!important;padding:0!important;width:100%!important;background-color:#f5f5f4}
    @media screen and (max-width:600px){
      .mobile-full{width:100%!important;max-width:100%!important}
      .mobile-padding{padding:20px 16px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f4">
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f5f4">
    <tr>
      <td align="center" style="padding:24px 16px">
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="mobile-full" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Elegant Black Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:32px 40px;text-align:center">
              <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:500;letter-spacing:3px;color:#ffffff;margin:0;text-transform:uppercase">${villaName}</h1>
            </td>
          </tr>
          
          <!-- Success Badge -->
          <tr>
            <td align="center" style="padding:28px 24px 0">
              <span style="display:inline-block;background-color:#2d7d46;color:#ffffff;padding:8px 20px;border-radius:20px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase">💰 Payment Received</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding:24px 40px 32px">
              
              <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:500;color:#1a1a1a;margin:0 0 20px;line-height:1.3;text-align:center">${inquiry.guestName}</h2>
              
              <!-- Booking Details -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;border-radius:8px;margin-bottom:20px">
                <tr>
                  <td style="padding:20px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:6px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Dates</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;font-weight:500">${dateRange}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Guests</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a">${inquiry.partySize}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Guest Email</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a">${inquiry.guestEmail}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Booking Reference</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;font-weight:500">${payment.bookingId}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Financial Summary -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0fff4;border-radius:8px;margin-bottom:20px;border-left:4px solid #2d7d46">
                <tr>
                  <td style="padding:20px">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:4px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Total Charged</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a">${currencySymbol}${payment.totalAmount.toLocaleString()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Platform Fee (${listing?.commissionPercent || 10}%)</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a">${currencySymbol}${payment.platformFeeAmount.toLocaleString()}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#6b7280">Your Payout</span><br>
                          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#2d7d46;font-weight:600">${currencySymbol}${payment.ownerAmount.toLocaleString()}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#9ca3af;margin:0;text-align:center;line-height:1.5">Payout will be transferred to your connected Stripe account within 2-7 business days.</p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#0a0a0a;padding:24px 40px;text-align:center">
              <p style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16px;color:#ffffff;margin:0">${villaName}</p>
              <p style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#6b7280;margin:8px 0 0">© ${new Date().getFullYear()} LoveThisPlace • Internal notification</p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`.trim(),
      text: `${villaName.toUpperCase()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n💰 PAYMENT RECEIVED!\n\n${inquiry.guestName}\nVilla: ${villaName}\nDates: ${dateRange}\nGuests: ${inquiry.partySize}\n\nTotal Charged: ${currencySymbol}${payment.totalAmount.toLocaleString()}\nPlatform Fee (${listing?.commissionPercent || 10}%): ${currencySymbol}${payment.platformFeeAmount.toLocaleString()}\nYour Payout: ${currencySymbol}${payment.ownerAmount.toLocaleString()}\n\nGuest Email: ${inquiry.guestEmail}\nBooking Ref: ${payment.bookingId}\n\nPayout will be transferred to your connected Stripe account within 2-7 business days.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${villaName}\n© ${new Date().getFullYear()} LoveThisPlace`,
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
