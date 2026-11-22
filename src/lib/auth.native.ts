// iOS / Android: persist the session in AsyncStorage so users stay signed in.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import { app } from './firebase';

// Metro resolves the react-native build, which exports getReactNativePersistence,
// but TypeScript only sees the web typings — hence the cast.
const { getReactNativePersistence } = firebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

// Created lazily so a missing .env shows the setup screen instead of crashing on import.
let instance: Auth | null = null;

export function getAppAuth(): Auth {
  if (instance) return instance;
  try {
    instance = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Already initialized (fast refresh).
    instance = getAuth(app);
  }
  return instance;
}
