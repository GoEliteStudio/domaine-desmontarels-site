import type { APIRoute } from 'astro';
import { getBlocksForDateRange, getListingBySlug } from '../../lib/firestore/collections';

/**
 * GET /api/check-availability?slug=villa-slug&checkIn=2025-01-12&checkOut=2025-01-19
 * 
 * Returns availability status for the given date range.
 * Note: This is a "soft" check - we always recommend confirming with the owner.
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const checkIn = url.searchParams.get('checkIn');
    const checkOut = url.searchParams.get('checkOut');

    // Validate required params
    if (!slug || !checkIn || !checkOut) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required parameters: slug, checkIn, checkOut' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(checkIn) || !dateRegex.test(checkOut)) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid date format. Use YYYY-MM-DD' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate checkOut > checkIn
    if (checkOut <= checkIn) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'checkOut must be after checkIn' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Look up listing
    const listing = await getListingBySlug(slug);
    if (!listing) {
      // If listing not in Firestore yet, return "unknown" availability
      // (graceful fallback during migration)
      return new Response(
        JSON.stringify({
          ok: true,
          available: 'unknown',
          message: 'Listing not found in system. Please contact us directly.',
          slug,
          checkIn,
          checkOut,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for overlapping blocks
    const blocks = await getBlocksForDateRange(listing.id, checkIn, checkOut);
    const hasConflict = blocks.length > 0;

    if (hasConflict) {
      return new Response(
        JSON.stringify({
          ok: true,
          available: false,
          message: 'These dates appear unavailable, but we can double-check with the owner.',
          slug,
          listingId: listing.id,
          checkIn,
          checkOut,
          conflictingBlocks: blocks.map(b => ({
            startDate: b.startDate,
            endDate: b.endDate,
            source: b.source,
          })),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        available: true,
        message: 'These dates appear available — we will confirm with the owner.',
        slug,
        listingId: listing.id,
        checkIn,
        checkOut,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[check-availability] Error:', err);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Internal error checking availability' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const prerender = false;
