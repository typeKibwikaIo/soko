import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/lib/theme';
import { Page } from './Page';

/** Centered card on the soft hero gradient, used by login and register. */
export function AuthForm({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <Page footer={false}>
      <LinearGradient colors={colors.heroGradient} style={styles.bg}>
        <View style={styles.card}>
          <Text style={[font.h2Sm, { textAlign: 'center' }]}>{title}</Text>
          <Text style={[font.small, { color: colors.muted, textAlign: 'center', marginBottom: 8 }]}>{subtitle}</Text>
          {children}
        </View>
      </LinearGradient>
    </Page>
  );
}

export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return e instanceof Error ? e.message : 'Something went wrong.';
  }
}

const styles = StyleSheet.create({
  bg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, minHeight: 600 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    gap: 14,
    shadowColor: '#2B2B6B',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
