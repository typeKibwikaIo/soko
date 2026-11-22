import { Link, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { AuthForm, authErrorMessage } from '@/components/AuthForm';
import { Button, Field } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, font } from '@/lib/theme';

export default function Login() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace((next || '/') as Href);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm title="Log In" subtitle="Welcome back to Soko DRC">
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" onSubmitEditing={submit} />
      {!!error && <Text style={[font.small, { color: colors.danger }]}>{error}</Text>}
      <Button title="Log In" onPress={submit} loading={loading} style={{ alignSelf: 'stretch', marginTop: 6 }} />
      <Text style={[font.small, { textAlign: 'center', color: colors.muted }]}>
        New here?{' '}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'} style={{ color: colors.primary }}>
          Create an account
        </Link>
      </Text>
    </AuthForm>
  );
}
