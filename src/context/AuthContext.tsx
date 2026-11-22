import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createUserProfile } from '@/lib/api';
import { getAppAuth } from '@/lib/auth';
import {
  backendLogin,
  backendLogout,
  backendMe,
  backendRegister,
  isBackendConfigured,
  type BackendUser,
  type SignUpInput,
} from '@/lib/backend';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import * as mock from '@/lib/mock';
import type { UserProfile } from '@/lib/types';

export type AppUser = { uid: string; email: string | null; displayName: string | null };

type AuthState = {
  user: AppUser | null;
  profile: UserProfile | null;
  /** Backend roles: BUYER / VENDOR / ADMIN. Empty in demo/firebase mode. */
  roles: string[];
  isAdmin: boolean;
  isVendor: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function userFromBackend(u: BackendUser): AppUser {
  return { uid: u.id, email: u.email, displayName: `${u.firstName} ${u.lastName}`.trim() };
}

function profileFromBackend(u: BackendUser): UserProfile {
  return {
    uid: u.id,
    email: u.email,
    displayName: `${u.firstName} ${u.lastName}`.trim(),
    role: u.roles.includes('ADMIN') ? 'admin' : 'customer',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const applyBackendUser = (u: BackendUser | null) => {
    setUser(u ? userFromBackend(u) : null);
    setProfile(u ? profileFromBackend(u) : null);
    setRoles(u?.roles ?? []);
  };

  const setDemoUser = (p: UserProfile | null) => {
    setProfile(p);
    setRoles([]);
    setUser(p && { uid: p.uid, email: p.email, displayName: p.displayName });
  };

  // Backend mode: restore the session from stored tokens on app start.
  useEffect(() => {
    if (!isBackendConfigured) return;
    let cancelled = false;
    backendMe()
      .then((u) => {
        if (!cancelled) applyBackendUser(u);
      })
      .catch(() => applyBackendUser(null))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Firebase / demo mode session.
  useEffect(() => {
    if (isBackendConfigured) return;
    if (!isFirebaseConfigured) {
      mock.currentUser().then(setDemoUser).finally(() => setLoading(false));
      return;
    }
    return onAuthStateChanged(getAppAuth(), (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });
  }, []);

  // Live profile so a role change in the console takes effect immediately.
  useEffect(() => {
    if (isBackendConfigured || !user || !isFirebaseConfigured) return;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? ({ uid: user.uid, ...snap.data() } as UserProfile) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user]);

  const value = useMemo<AuthState>(() => ({
    user,
    profile,
    roles,
    isAdmin: roles.includes('ADMIN') || profile?.role === 'admin',
    isVendor: roles.includes('VENDOR') || roles.includes('ADMIN'),
    loading,
    async signIn(email, password) {
      if (isBackendConfigured) {
        const res = await backendLogin(email, password);
        applyBackendUser(res.user);
        return;
      }
      if (!isFirebaseConfigured) return setDemoUser(await mock.signIn(email));
      await signInWithEmailAndPassword(getAppAuth(), email.trim(), password);
    },
    async signUp(input) {
      if (isBackendConfigured) {
        const res = await backendRegister(input);
        applyBackendUser(res.user);
        return;
      }
      // Demo / Firebase fallback keeps working with the combined name.
      const name = `${input.firstName} ${input.lastName}`.trim();
      if (!isFirebaseConfigured) return setDemoUser(await mock.signIn(input.email, name));
      const cred = await createUserWithEmailAndPassword(getAppAuth(), input.email.trim(), input.password);
      await updateProfile(cred.user, { displayName: name });
      await createUserProfile(cred.user.uid, cred.user.email ?? input.email, name);
    },
    async signOut() {
      if (isBackendConfigured) {
        await backendLogout();
        applyBackendUser(null);
        return;
      }
      if (!isFirebaseConfigured) return setDemoUser(await mock.signOut().then(() => null));
      await fbSignOut(getAppAuth());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [user, profile, roles, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
