import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Page } from './Page';
import { Button, EmptyState, Loading } from './ui';

/** UI guard only — Firestore rules are what actually enforce admin access. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <Page><Loading /></Page>;
  if (!user) return <Redirect href="/login?next=/admin" />;
  if (!isAdmin) {
    return (
      <Page>
        <EmptyState
          title="Admins only"
          body="Your account doesn't have admin access. Set role to 'admin' on your users document in Firestore."
          cta={<Button title="Go home" href="/" style={{ alignSelf: 'center' }} />}
        />
      </Page>
    );
  }
  return <>{children}</>;
}
