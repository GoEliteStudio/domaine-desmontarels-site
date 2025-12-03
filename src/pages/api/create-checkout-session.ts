/**
 * Create Stripe Checkout Session API
 * 
 * Called after owner approves an inquiry.
 * Creates a payment session for the guest to complete their booking.
 * 
 * POST /api/create-checkout-session
 * Body: { inquiryId: string }
 * 
 * Returns: { url: string } - Stripe Checkout URL to redirect guest
 */

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { getDb } from '../../lib/firebase';
import { getCurrencySymbol } from '../../lib/pricing';

export const prerender = false;

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY;
const SITE_URL = import.meta.env.SITE_URL || 'https://lovethisplace-sites.vercel.app';

// Initialize Stripe
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
}) : null;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check Stripe is configured
    if (!stripe) {
      console.error('[checkout] Stripe not configured');
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Payment system not configured' 
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { inquiryId } = body as { inquiryId?: string };

    if (!inquiryId) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Missing inquiryId' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Load inquiry from Firestore
    const db = getDb();
    const inquiryRef = db.collection('inquiries').doc(inquiryId);
    const inquirySnap = await inquiryRef.get();

    if (!inquirySnap.exists) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Inquiry not found' 
      }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const inquiry = inquirySnap.data()!;

    // Verify inquiry is approved and has a quote
    if (inquiry.status !== 'approved') {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Inquiry not approved (status: ${inquiry.status})` 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (!inquiry.quoteAmount || inquiry.quoteAmount <= 0) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'No quote amount set for this inquiry' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Load listing for name
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

    // Calculate nights
    const checkIn = new Date(inquiry.checkIn);
    const checkOut = new Date(inquiry.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Format dates for display
    const dateRange = `${inquiry.checkIn} → ${inquiry.checkOut}`;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: inquiry.guestEmail,
      line_items: [
        {
          price_data: {
            currency: inquiry.currency.toLowerCase(),
            product_data: {
              name: listingName,
              description: `${nights} nights: ${dateRange}\nGuests: ${inquiry.partySize}`,
            },
            unit_amount: Math.round(inquiry.quoteAmount * 100), // Stripe uses cents
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
    });

    // Update inquiry status to awaiting_payment
    await inquiryRef.update({
      status: 'awaiting_payment',
      stripeSessionId: session.id,
      updatedAt: new Date(),
    });

    console.log('[checkout] Session created:', { 
      inquiryId, 
      sessionId: session.id, 
      amount: inquiry.quoteAmount,
      currency: inquiry.currency,
    });

    return new Response(JSON.stringify({ 
      ok: true, 
      url: session.url,
      sessionId: session.id,
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('[checkout] Error:', error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Failed to create checkout session' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
};
