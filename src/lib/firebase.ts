import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Values come from .env (see .env.example). EXPO_PUBLIC_ vars are inlined at build time.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** False → demo mode: the app runs on local sample data (see mock.ts). */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

// In demo mode Firebase is never called; placeholders just keep SDK initialization from throwing.
export const app = getApps().length
  ? getApp()
  : initializeApp(isFirebaseConfigured ? firebaseConfig : { apiKey: 'demo', projectId: 'demo-soko' });
export const db = getFirestore(app);
