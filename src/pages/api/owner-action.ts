/**
 * Owner Action API - Handles approve/decline via signed URLs
 * 
 * Flow:
 * 1. Owner clicks signed link in email
 * 2. We verify signature + expiration
 * 3. Update inquiry status in Firestore
 * 4. If approved: create Stripe Checkout and send payment link to guest
 * 5. If declined: send polite "not available" email to guest
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { parseAndVerifyAction, type ApproveParams, type DeclineParams } from '../../lib/signing';
import { getDb } from '../../lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { sendGuestEmail, GOELITE_INBOX } from '../../lib/emailRouting';

export const prerender = false;

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY;
const SITE_URL = import.meta.env.SITE_URL || 'https://domaine-desmontarels-site.vercel.app';

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
}) : null;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  
  // Parse and verify the signed action
  const action = parseAndVerifyAction(url);
  
  if (!action) {
    return new Response(renderErrorPage('Invalid or Expired Link', 
      'This action link is invalid or has expired. Please contact us if you need assistance.'
    ), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  const db = getDb();
  
  try {
    // Get the inquiry
    const inquiryRef = db.collection('inquiries').doc(action.inquiryId);
    const inquirySnap = await inquiryRef.get();
    
    if (!inquirySnap.exists) {
      return new Response(renderErrorPage('Inquiry Not Found',
        'This inquiry no longer exists in our system.'
      ), {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    const inquiry = inquirySnap.data()!;
    
    // Check if already processed
    if (inquiry.status !== 'pending_owner') {
      return new Response(renderInfoPage('Already Processed',
        `This inquiry has already been ${inquiry.status}. No further action needed.`
      ), {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    if (action.action === 'approve') {
      return await handleApprove(inquiryRef, inquiry, action as ApproveParams);
    } else {
      return await handleDecline(inquiryRef, inquiry, action as DeclineParams);
    }
    
  } catch (error) {
    console.error('Owner action error:', error);
    return new Response(renderErrorPage('Something Went Wrong',
      'We encountered an error processing your request. Please try again or contact support.'
    ), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
};

/**
 * Handle approval - update inquiry, create Stripe checkout, send payment link
 */
async function handleApprove(
  inquiryRef: FirebaseFirestore.DocumentReference,
  inquiry: FirebaseFirestore.DocumentData,
  params: ApproveParams
): Promise<Response> {
  const db = getDb();
  const inquiryId = inquiryRef.id;
  
  // Update inquiry with approved status and confirmed price
  await inquiryRef.update({
    status: 'approved',
    quoteAmount: params.price,
    currency: params.currency,
    updatedAt: Timestamp.now(),
    approvedAt: Timestamp.now(),
  });

  // Get listing info for Stripe product name
  let listingName = 'Villa Booking';
  let listingSlug = 'villa';
  
  if (inquiry.listingId) {
    const listingSnap = await db.collection('listings').doc(inquiry.listingId).get();
    if (listingSnap.exists) {
      const listing = listingSnap.data()!;
      listingName = listing.name || listingName;
      listingSlug = listing.slug || listingSlug;
    }
  }

  // Calculate nights for description
  const checkIn = new Date(inquiry.checkIn);
  const checkOut = new Date(inquiry.checkOut);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const dateRange = `${inquiry.checkIn} → ${inquiry.checkOut}`;

  // Create Stripe Checkout Session
  let checkoutUrl: string | null = null;
  
  if (stripe) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: inquiry.guestEmail,
        line_items: [
          {
            price_data: {
              currency: params.currency.toLowerCase(),
              product_data: {
                name: listingName,
                description: `${nights} nights: ${dateRange}\nGuests: ${inquiry.partySize}`,
              },
              unit_amount: Math.round(params.price * 100), // Stripe uses cents
            },
            quantity: 1,
          },
        ],
        metadata: {
          inquiryId,
          listingId: inquiry.listingId,
          guestName: inquiry.guestName,
          guestEmail: inquiry.guestEmail,
          checkIn: inquiry.checkIn,
          checkOut: inquiry.checkOut,
          partySize: String(inquiry.partySize),
        },
        success_url: `${SITE_URL}/villas/${listingSlug}/en/thank-you?payment=success&ref=${inquiryId}`,
        cancel_url: `${SITE_URL}/villas/${listingSlug}/en/contact?payment=cancelled&ref=${inquiryId}`,
        expires_at: Math.floor(Date.now() / 1000) + (23 * 60 * 60), // 23 hours (Stripe max is 24h)
      });

      checkoutUrl = session.url;

      // Update inquiry with session ID
      await inquiryRef.update({
        status: 'awaiting_payment',
        stripeSessionId: session.id,
        updatedAt: Timestamp.now(),
      });

      console.log('[owner-action] Stripe session created:', { inquiryId, sessionId: session.id });
    } catch (stripeError) {
      console.error('[owner-action] Stripe checkout failed:', stripeError);
      // Continue without payment link - owner can resend later
    }
  }
  
  // Send email to guest with payment link
  try {
    await sendGuestEmail({
      listing: null, // We don't have listing object here, will use default branding
      toEmail: inquiry.guestEmail,
      replyTo: GOELITE_INBOX,
      subject: `Great News! Your Stay is Confirmed - Complete Your Booking`,
      html: renderGuestApprovalEmail(inquiry, params, checkoutUrl),
      text: renderGuestApprovalEmailText(inquiry, params, checkoutUrl),
    });
  } catch (emailError) {
    console.error('Failed to send guest approval email:', emailError);
  }
  
  const paymentNote = checkoutUrl 
    ? `<p>We've sent the guest a secure payment link. You'll receive a confirmation once payment is complete.</p>`
    : `<p class="note">⚠️ Payment link could not be created. Please contact support.</p>`;

  return new Response(renderSuccessPage('Booking Approved! ✓',
    `You've approved the booking for ${inquiry.guestName}.`,
    `
      <div class="details">
        <p><strong>Guest:</strong> ${inquiry.guestName}</p>
        <p><strong>Dates:</strong> ${inquiry.checkIn} → ${inquiry.checkOut}</p>
        <p><strong>Confirmed Total:</strong> ${getCurrencySymbol(params.currency)}${params.price.toLocaleString()}</p>
      </div>
      ${paymentNote}
    `
  ), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Handle decline - update inquiry, notify guest
 */
async function handleDecline(
  inquiryRef: FirebaseFirestore.DocumentReference,
  inquiry: FirebaseFirestore.DocumentData,
  _params: DeclineParams
): Promise<Response> {
  
  // Update inquiry status
  await inquiryRef.update({
    status: 'declined',
    updatedAt: Timestamp.now(),
    declinedAt: Timestamp.now(),
  });
  
  // Send polite decline email to guest
  try {
    await sendGuestEmail({
      listing: null, // We don't have listing object here, will use default branding
      toEmail: inquiry.guestEmail,
      replyTo: GOELITE_INBOX,
      subject: `Update on Your Inquiry`,
      html: renderGuestDeclineEmail(inquiry),
      text: renderGuestDeclineEmailText(inquiry),
    });
  } catch (emailError) {
    console.error('Failed to send guest decline email:', emailError);
  }
  
  return new Response(renderSuccessPage('Inquiry Declined',
    `You've declined the inquiry from ${inquiry.guestName}.`,
    `
      <div class="details">
        <p><strong>Guest:</strong> ${inquiry.guestName}</p>
        <p><strong>Requested Dates:</strong> ${inquiry.checkIn} → ${inquiry.checkOut}</p>
      </div>
      <p>We've sent a polite notification to the guest letting them know the dates are not available.</p>
    `
  ), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

// ============ Email Templates ============

function renderGuestApprovalEmail(inquiry: any, params: ApproveParams, paymentUrl: string | null): string {
  const symbol = getCurrencySymbol(params.currency);
  const paymentButton = paymentUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${paymentUrl}" style="display: inline-block; background: #2d7d46; color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600;">
          Complete Payment →
        </a>
        <p style="margin-top: 12px; font-size: 14px; color: #666;">Payment link expires in 72 hours</p>
      </div>
  ` : `
      <p><strong>Next Step:</strong> We'll send you a secure payment link shortly to complete your booking.</p>
  `;
  
  return `
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
    .price { font-size: 28px; color: #2d7d46; font-weight: bold; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #2d7d46; margin: 0;">✓ Your Stay is Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear ${inquiry.guestName},</p>
      <p>Great news! The owner has confirmed your requested dates and we're ready to proceed with your booking.</p>
      
      <div class="highlight">
        <p><strong>Check-in:</strong> ${inquiry.checkIn}</p>
        <p><strong>Check-out:</strong> ${inquiry.checkOut}</p>
        <p><strong>Guests:</strong> ${inquiry.partySize}</p>
        <p class="price">Total: ${symbol}${params.price.toLocaleString()}</p>
      </div>
      
      ${paymentButton}
      
      <p>If you have any questions, simply reply to this email.</p>
      
      <p>We look forward to hosting you!</p>
    </div>
    <div class="footer">
      <p>Go Elite Studio • Luxury Villa Bookings</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function renderGuestApprovalEmailText(inquiry: any, params: ApproveParams, paymentUrl: string | null): string {
  const symbol = getCurrencySymbol(params.currency);
  const paymentSection = paymentUrl 
    ? `COMPLETE YOUR BOOKING\n---------------------\nClick here to pay securely: ${paymentUrl}\n(Link expires in 72 hours)`
    : `NEXT STEP\n---------\nWe'll send you a secure payment link shortly to complete your booking.`;
  
  return `
Your Stay is Confirmed!

Dear ${inquiry.guestName},

Great news! The owner has confirmed your requested dates and we're ready to proceed with your booking.

BOOKING DETAILS
---------------
Check-in: ${inquiry.checkIn}
Check-out: ${inquiry.checkOut}
Guests: ${inquiry.partySize}
Total: ${symbol}${params.price.toLocaleString()}

${paymentSection}

If you have any questions, simply reply to this email.

We look forward to hosting you!

--
Go Elite Studio
Luxury Villa Bookings
  `.trim();
}

function renderGuestDeclineEmail(inquiry: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #a58e76; }
    .content { padding: 30px 0; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #1a1a1a; margin: 0;">Update on Your Inquiry</h1>
    </div>
    <div class="content">
      <p>Dear ${inquiry.guestName},</p>
      <p>Thank you for your interest in booking with us.</p>
      <p>Unfortunately, the property is not available for your requested dates (${inquiry.checkIn} to ${inquiry.checkOut}).</p>
      <p>We'd love to help you find alternative dates that work. If you're flexible, please reply to this email with some other options and we'll check availability.</p>
      <p>We hope to welcome you soon!</p>
    </div>
    <div class="footer">
      <p>Go Elite Studio • Luxury Villa Bookings</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function renderGuestDeclineEmailText(inquiry: any): string {
  return `
Update on Your Inquiry

Dear ${inquiry.guestName},

Thank you for your interest in booking with us.

Unfortunately, the property is not available for your requested dates (${inquiry.checkIn} to ${inquiry.checkOut}).

We'd love to help you find alternative dates that work. If you're flexible, please reply to this email with some other options and we'll check availability.

We hope to welcome you soon!

--
Go Elite Studio
Luxury Villa Bookings
  `.trim();
}

// ============ Response Page Templates ============

function renderSuccessPage(title: string, subtitle: string, details: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Go Elite Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8f6f4 0%, #ebe7e3 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 10px; }
    .subtitle { color: #666; margin-bottom: 30px; }
    .details { 
      background: #f8f6f4; 
      padding: 20px; 
      border-radius: 8px; 
      text-align: left;
      margin-bottom: 20px;
    }
    .details p { margin: 8px 0; color: #333; }
    .note { color: #a58e76; font-size: 14px; margin-top: 20px; }
    .logo { margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>${title}</h1>
    <p class="subtitle">${subtitle}</p>
    ${details}
    <p class="logo">Go Elite Studio</p>
  </div>
</body>
</html>
  `.trim();
}

function renderErrorPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Go Elite Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8f6f4 0%, #ebe7e3 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #c0392b; font-size: 24px; margin-bottom: 10px; }
    .message { color: #666; line-height: 1.6; }
    .logo { margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    <p class="logo">Go Elite Studio</p>
  </div>
</body>
</html>
  `.trim();
}

function renderInfoPage(title: string, message: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Go Elite Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8f6f4 0%, #ebe7e3 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 10px; }
    .message { color: #666; line-height: 1.6; }
    .logo { margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">ℹ️</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    <p class="logo">Go Elite Studio</p>
  </div>
</body>
</html>
  `.trim();
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF ',
  };
  return symbols[currency] || `${currency} `;
}
