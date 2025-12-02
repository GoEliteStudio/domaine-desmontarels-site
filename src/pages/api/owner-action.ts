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

  // Get listing info for Stripe product name and email branding
  let listingName = 'Villa Booking';
  let listingSlug = 'villa';
  let listing: any = null;
  
  if (inquiry.listingId) {
    const listingSnap = await db.collection('listings').doc(inquiry.listingId).get();
    if (listingSnap.exists) {
      listing = listingSnap.data()!;
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
  
  // Send email to guest with payment link (use villa name for branding)
  try {
    await sendGuestEmail({
      listing: listing, // Pass listing for villa-branded "From" name
      toEmail: inquiry.guestEmail,
      replyTo: GOELITE_INBOX,
      subject: `${listingName} — Your Stay is Confirmed! Complete Your Booking`,
      html: renderGuestApprovalEmail(inquiry, params, checkoutUrl, listingName),
      text: renderGuestApprovalEmailText(inquiry, params, checkoutUrl, listingName),
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
  const db = getDb();
  
  // Update inquiry status
  await inquiryRef.update({
    status: 'declined',
    updatedAt: Timestamp.now(),
    declinedAt: Timestamp.now(),
  });
  
  // Get listing info for email branding
  let listing: any = null;
  let villaName = 'LoveThisPlace';
  
  if (inquiry.listingId) {
    const listingSnap = await db.collection('listings').doc(inquiry.listingId).get();
    if (listingSnap.exists) {
      listing = listingSnap.data()!;
      villaName = listing.name || villaName;
    }
  }
  
  // Send polite decline email to guest
  try {
    await sendGuestEmail({
      listing,
      toEmail: inquiry.guestEmail,
      replyTo: GOELITE_INBOX,
      subject: `Update on Your Inquiry — ${villaName}`,
      html: renderGuestDeclineEmail(inquiry, villaName),
      text: renderGuestDeclineEmailText(inquiry, villaName),
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

function renderGuestApprovalEmail(inquiry: any, params: ApproveParams, paymentUrl: string | null, villaName: string = 'LoveThisPlace'): string {
  const symbol = getCurrencySymbol(params.currency);
  const paymentButton = paymentUrl ? `
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:28px 0">
                <tr>
                  <td align="center">
                    <a href="${paymentUrl}" style="display:inline-block;background-color:#2d7d46;color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:600;letter-spacing:0.5px">Complete Payment →</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px">
                    <span style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#9ca3af">Payment link expires in 23 hours</span>
                  </td>
                </tr>
              </table>
  ` : `
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;margin:24px 0"><strong>Next Step:</strong> We'll send you a secure payment link shortly to complete your booking.</p>
  `;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${villaName} — Your Stay is Confirmed</title>
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
        
        <!-- Email Container -->
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
              <span style="display:inline-block;background-color:#2d7d46;color:#ffffff;padding:8px 20px;border-radius:20px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase">✓ Confirmed</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding:24px 40px 32px">
              
              <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.3;text-align:center">Your Stay is Confirmed!</h2>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;text-align:center">Dear ${inquiry.guestName}, great news! The owner has confirmed your requested dates.</p>
              
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
                          <span style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;color:#2d7d46;font-weight:600">Total: ${symbol}${params.price.toLocaleString()}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              ${paymentButton}
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#9ca3af;margin:24px 0 0;text-align:center">Questions? Simply reply to this email.</p>
              
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
</html>`.trim();
}

function renderGuestApprovalEmailText(inquiry: any, params: ApproveParams, paymentUrl: string | null, villaName: string = 'LoveThisPlace'): string {
  const symbol = getCurrencySymbol(params.currency);
  const paymentSection = paymentUrl 
    ? `COMPLETE YOUR BOOKING\n---------------------\nClick here to pay securely: ${paymentUrl}\n(Link expires in 23 hours)`
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
${villaName}
  `.trim();
}

function renderGuestDeclineEmail(inquiry: any, villaName: string = 'LoveThisPlace'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${villaName} — Update on Your Inquiry</title>
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
        
        <!-- Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="mobile-full" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          
          <!-- Elegant Black Header -->
          <tr>
            <td style="background-color:#0a0a0a;padding:32px 40px;text-align:center">
              <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;font-weight:500;letter-spacing:3px;color:#ffffff;margin:0;text-transform:uppercase">${villaName}</h1>
            </td>
          </tr>
          
          <!-- Status Badge -->
          <tr>
            <td align="center" style="padding:28px 24px 0">
              <span style="display:inline-block;background-color:#a58e76;color:#ffffff;padding:8px 20px;border-radius:20px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase">Update</span>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding:24px 40px 32px">
              
              <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;font-weight:500;color:#1a1a1a;margin:0 0 12px;line-height:1.3;text-align:center">Update on Your Inquiry</h2>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 24px;text-align:center">Dear ${inquiry.guestName}, thank you for your interest in staying with us.</p>
              
              <!-- Message Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fafafa;border-radius:8px;margin-bottom:24px;border-left:4px solid #a58e76">
                <tr>
                  <td style="padding:24px">
                    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.7;margin:0 0 16px">Unfortunately, the property is not available for your requested dates:</p>
                    
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="padding:8px 0">
                          <span style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#6b7280">Requested dates</span><br>
                          <span style="font-family:Inter,Arial,sans-serif;font-size:16px;color:#1a1a1a;font-weight:500">${inquiry.checkIn} → ${inquiry.checkOut}</span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.7;margin:20px 0 0">We'd love to help you find alternative dates that work. If you're flexible, please reply to this email with some options and we'll check availability.</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0">
                <tr>
                  <td align="center">
                    <a href="mailto:bookings@lovethisplace.co?subject=Alternative Dates for ${villaName}" style="display:inline-block;background-color:#0a0a0a;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.5px">Suggest Other Dates</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#1a1a1a;margin:24px 0 0;text-align:center;line-height:1.6">We hope to welcome you soon!</p>
              
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
</html>`.trim();
}

function renderGuestDeclineEmailText(inquiry: any, villaName: string = 'LoveThisPlace'): string {
  return `
${villaName.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UPDATE ON YOUR INQUIRY

Dear ${inquiry.guestName},

Thank you for your interest in staying with us.

Unfortunately, the property is not available for your requested dates:

  ${inquiry.checkIn} → ${inquiry.checkOut}

We'd love to help you find alternative dates that work. If you're flexible, please reply to this email with some options and we'll check availability.

We hope to welcome you soon!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${villaName}
© ${new Date().getFullYear()} All rights reserved.
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
