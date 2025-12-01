// astro/src/lib/firebase.ts
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (dbInstance) return dbInstance;

  const projectId = import.meta.env.FIREBASE_PROJECT_ID;
  const clientEmail = import.meta.env.FIREBASE_CLIENT_EMAIL;
  let rawPrivateKey = import.meta.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    console.error('[firebase] Missing env vars:', { 
      hasProjectId: !!projectId, 
      hasClientEmail: !!clientEmail, 
      hasPrivateKey: !!rawPrivateKey 
    });
    throw new Error('Missing Firebase environment variables');
  }

  // Handle various formats of the private key:
  // 1. Escaped \n from .env file
  // 2. Real newlines from Vercel env vars
  // 3. Wrapped in quotes
  let privateKey = rawPrivateKey
    .replace(/\\n/g, '\n')  // Convert escaped \n to real newlines
    .replace(/^["']|["']$/g, '')  // Remove wrapping quotes if present
    .trim();

  // Validate key format
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('[firebase] Invalid private key format - missing BEGIN marker');
    throw new Error('Invalid Firebase private key format');
  }

  console.log('[firebase] Initializing with project:', projectId);

  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

  dbInstance = getFirestore(app);
  console.log('[firebase] Firestore initialized successfully');
  return dbInstance;
}
