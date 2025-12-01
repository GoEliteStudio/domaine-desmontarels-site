/**
 * HMAC signing utilities for secure owner action links
 * 
 * Links include: inquiryId, action, price, currency, expires, sig
 * The signature covers all params to prevent tampering
 */

import { createHmac } from 'crypto';

const SECRET = import.meta.env.OWNER_ACTION_SECRET;

if (!SECRET) {
  console.warn('⚠️ OWNER_ACTION_SECRET not set - signed links will fail verification');
}

export interface ApproveParams {
  inquiryId: string;
  action: 'approve';
  price: number;
  currency: string;
  expires: number; // Unix timestamp
}

export interface DeclineParams {
  inquiryId: string;
  action: 'decline';
  expires: number;
}

export type ActionParams = ApproveParams | DeclineParams;

/**
 * Create the string to sign (deterministic order)
 */
function createSignaturePayload(params: ActionParams): string {
  if (params.action === 'approve') {
    return `${params.inquiryId}:${params.action}:${params.price}:${params.currency}:${params.expires}`;
  }
  return `${params.inquiryId}:${params.action}:${params.expires}`;
}

/**
 * Generate HMAC-SHA256 signature
 */
export function sign(params: ActionParams): string {
  if (!SECRET) throw new Error('OWNER_ACTION_SECRET not configured');
  
  const payload = createSignaturePayload(params);
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

/**
 * Verify signature matches params
 */
export function verify(params: ActionParams, signature: string): boolean {
  if (!SECRET) return false;
  
  const expected = sign(params);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Check if link has expired
 */
export function isExpired(expires: number): boolean {
  return Date.now() > expires;
}

/**
 * Generate a signed approval URL
 * 
 * @param baseUrl - Site base URL (e.g., https://villa-site.vercel.app)
 * @param inquiryId - Firestore inquiry document ID
 * @param price - Approved total amount
 * @param currency - Currency code (EUR, USD, etc.)
 * @param expiresInHours - Link validity (default 72 hours)
 */
export function generateApproveUrl(
  baseUrl: string,
  inquiryId: string,
  price: number,
  currency: string,
  expiresInHours: number = 72
): string {
  const expires = Date.now() + expiresInHours * 60 * 60 * 1000;
  const params: ApproveParams = {
    inquiryId,
    action: 'approve',
    price,
    currency,
    expires,
  };
  const sig = sign(params);
  
  const url = new URL('/api/owner-action', baseUrl);
  url.searchParams.set('inquiryId', inquiryId);
  url.searchParams.set('action', 'approve');
  url.searchParams.set('price', price.toString());
  url.searchParams.set('currency', currency);
  url.searchParams.set('expires', expires.toString());
  url.searchParams.set('sig', sig);
  
  return url.toString();
}

/**
 * Generate a signed decline URL
 */
export function generateDeclineUrl(
  baseUrl: string,
  inquiryId: string,
  expiresInHours: number = 72
): string {
  const expires = Date.now() + expiresInHours * 60 * 60 * 1000;
  const params: DeclineParams = {
    inquiryId,
    action: 'decline',
    expires,
  };
  const sig = sign(params);
  
  const url = new URL('/api/owner-action', baseUrl);
  url.searchParams.set('inquiryId', inquiryId);
  url.searchParams.set('action', 'decline');
  url.searchParams.set('expires', expires.toString());
  url.searchParams.set('sig', sig);
  
  return url.toString();
}

/**
 * Parse and validate URL params from a request
 * Returns null if invalid or expired
 */
export function parseAndVerifyAction(url: URL): ActionParams | null {
  const inquiryId = url.searchParams.get('inquiryId');
  const action = url.searchParams.get('action');
  const expires = parseInt(url.searchParams.get('expires') || '0', 10);
  const sig = url.searchParams.get('sig');
  
  if (!inquiryId || !action || !expires || !sig) {
    return null;
  }
  
  if (isExpired(expires)) {
    return null;
  }
  
  if (action === 'approve') {
    const price = parseFloat(url.searchParams.get('price') || '0');
    const currency = url.searchParams.get('currency');
    
    if (!price || !currency) return null;
    
    const params: ApproveParams = { inquiryId, action, price, currency, expires };
    if (!verify(params, sig)) return null;
    
    return params;
  }
  
  if (action === 'decline') {
    const params: DeclineParams = { inquiryId, action, expires };
    if (!verify(params, sig)) return null;
    
    return params;
  }
  
  return null;
}
