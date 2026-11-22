// Web: browser persistence (IndexedDB) is the default.
import { getAuth, type Auth } from 'firebase/auth';
import { app } from './firebase';

// Created lazily so a missing .env shows the setup screen instead of crashing on import.
let instance: Auth | null = null;

export function getAppAuth(): Auth {
  return (instance ??= getAuth(app));
}
