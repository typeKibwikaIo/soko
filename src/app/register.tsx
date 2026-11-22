import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthForm, authErrorMessage } from '@/components/AuthForm';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, font } from '@/lib/theme';

type RoleChoice = 'BUYER' | 'VENDOR';

const ROLE_OPTIONS: { id: RoleChoice; title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'BUYER', title: 'Buyer', body: 'Shop from local vendors', icon: 'bag-handle-outline' },
  { id: 'VENDOR', title: 'Vendor', body: 'Sell on the marketplace', icon: 'storefront-outline' },
];

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One symbol (!@#$…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function passwordScore(p: string) {
  return PASSWORD_RULES.filter((r) => r.test(p)).length;
}

const SCORE_COLOR = ['', colors.danger, '#E67E22', '#B7791F', colors.success, colors.success];
const SCORE_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'];

export default function Register() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<RoleChoice>('BUYER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const score = useMemo(() => passwordScore(password), [password]);
  const allRulesPass = score === PASSWORD_RULES.length;

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim()) return setError('Please enter your first and last name.');
    if (!allRulesPass) return setError('Please make your password stronger.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError(null);
    setLoading(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        phone: phone.trim() || undefined,
        password,
        role,
      });
      router.replace((next || '/') as Href);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Create Account" subtitle="Shop faster and track your orders">
      <View style={styles.nameRow}>
        <View style={{ flex: 1 }}>
          <Field label="First name" value={firstName} onChangeText={setFirstName} autoComplete="given-name" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Last name" value={lastName} onChangeText={setLastName} autoComplete="family-name" />
        </View>
      </View>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field
        label="Recovery phone (optional)"
        value={phone}
        onChangeText={setPhone}
        autoCapitalize="none"
        keyboardType="phone-pad"
        autoComplete="tel"
        placeholder="+243…"
      />

      <View style={{ gap: 8 }}>
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
        {password.length > 0 && (
          <View style={{ gap: 6 }}>
            <View style={styles.strengthBar}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthSeg,
                    { backgroundColor: i <= score ? SCORE_COLOR[score] : colors.border },
                  ]}
                />
              ))}
            </View>
            <Text style={[font.small, { color: SCORE_COLOR[score], fontWeight: '600' }]}>
              {SCORE_LABEL[score]}
            </Text>
            <View style={{ gap: 2 }}>
              {PASSWORD_RULES.map((r) => {
                const pass = r.test(password);
                return (
                  <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={pass ? 'checkmark-circle' : 'ellipse-outline'} size={13} color={pass ? colors.success : colors.subtle} />
                    <Text style={[font.small, { color: pass ? colors.success : colors.muted, fontSize: 12 }]}>{r.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" onSubmitEditing={submit} />

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map((opt) => {
            const active = role === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setRole(opt.id)}
                style={[styles.roleCard, active && styles.roleCardActive]}
              >
                <Ionicons name={opt.icon} size={22} color={active ? colors.primary : colors.muted} />
                <Text style={[font.small, { fontWeight: '600', color: active ? colors.primary : colors.text }]}>{opt.title}</Text>
                <Text style={[font.small, { color: colors.muted, fontSize: 11 }]}>{opt.body}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {!!error && <Text style={[font.small, { color: colors.danger }]}>{error}</Text>}
      <Button title="Create Account" onPress={submit} loading={loading} style={{ alignSelf: 'stretch', marginTop: 6 }} />
      <Text style={[font.small, { textAlign: 'center', color: colors.muted }]}>
        Already have an account?{' '}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} style={{ color: colors.primary }}>
          Log in
        </Link>
      </Text>
    </AuthForm>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', gap: 12 },
  label: { ...font.small, color: colors.text, fontWeight: '500' },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 4,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
  },
  roleCardActive: { borderColor: colors.primary, backgroundColor: colors.soft },
  strengthBar: { flexDirection: 'row', gap: 4 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
});
