import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var not set — Firebase Auth will not work');
}

let firebaseAuth: ReturnType<typeof getAuth> | undefined;

try {
  if (serviceAccountJson && getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountJson))
    });
    firebaseAuth = getAuth();
  } else if (getApps().length > 0) {
    firebaseAuth = getAuth();
  }
} catch (err: any) {
  console.error('Failed to initialize Firebase Admin:', err.message);
}

export { firebaseAuth };
