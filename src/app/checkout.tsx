import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '@/components/Page';
import { Button, Container, Field, Loading, Row, useResponsive } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { placeOrder } from '@/lib/api';
import { money } from '@/lib/format';
import { colors, font } from '@/lib/theme';
import { PAYMENT_METHODS, type PaymentMethod, type ShippingInfo } from '@/lib/types';

const CITIES = ['Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu', 'Kisangani', 'Matadi'];

export default function Checkout() {
  const { user, profile, loading: authLoading } = useAuth();
  const { items, subtotal, clear } = useCart();
  const { isWide } = useResponsive();
  const [shipping, setShipping] = useState<ShippingInfo>({
    fullName: profile?.displayName ?? user?.displayName ?? '',
    phone: '',
    city: 'Kinshasa',
    address: '',
  });
  const [payment, setPayment] = useState<PaymentMethod>('cash');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return <Page><Loading /></Page>;
  if (!user) return <Redirect href="/login?next=/checkout" />;
  if (items.length === 0) return <Redirect href="/cart" />;

  const set = (k: keyof ShippingInfo) => (v: string) => setShipping((s) => ({ ...s, [k]: v }));

  const submit = async () => {
    if (!shipping.fullName.trim() || !shipping.phone.trim() || !shipping.address.trim()) {
      setError('Please fill in your name, phone number and address.');
      return;
    }
    if (!/^\+?[0-9 ]{9,15}$/.test(shipping.phone.trim())) {
      setError('Please enter a valid phone number, e.g. +243 81 234 5678.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const orderId = await placeOrder(user.uid, items, shipping, payment);
      clear();
      router.replace(`/orders?placed=${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place your order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 56 : 32 }}>
        <Text style={[isWide ? font.h2 : font.h2Sm, { marginBottom: 24 }]}>Checkout</Text>
        <View style={[isWide ? { flexDirection: 'row', gap: 48, alignItems: 'flex-start' } : { gap: 32 }]}>
          <View style={{ flex: 1, gap: 16 }}>
            <Text style={font.h3}>Delivery details</Text>
            <Field label="Full name" value={shipping.fullName} onChangeText={set('fullName')} autoComplete="name" />
            <Field
              label="Phone number"
              value={shipping.phone}
              onChangeText={set('phone')}
              placeholder="+243 81 234 5678"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <View style={{ gap: 6 }}>
              <Text style={[font.small, { fontWeight: '500' }]}>City</Text>
              <View style={styles.options}>
                {CITIES.map((c) => (
                  <Option key={c} label={c} active={shipping.city === c} onPress={() => set('city')(c)} />
                ))}
              </View>
            </View>
            <Field
              label="Address"
              value={shipping.address}
              onChangeText={set('address')}
              placeholder="Avenue, number, commune, landmark"
              multiline
              style={[styles.multiline]}
            />

            <Text style={[font.h3, { marginTop: 16 }]}>Payment</Text>
            <View style={styles.options}>
              {PAYMENT_METHODS.map((m) => (
                <Option key={m.id} label={m.label} active={payment === m.id} onPress={() => setPayment(m.id)} />
              ))}
            </View>
            {payment !== 'cash' && (
              <Text style={[font.small, { color: colors.muted }]}>
                We'll call you on the number above with payment instructions before dispatching your order.
              </Text>
            )}
          </View>

          <View style={[styles.summary, isWide && { width: 360 }]}>
            <Text style={font.h3}>Your order</Text>
            {items.map((i) => (
              <Row key={i.productId} label={`${i.quantity} × ${i.name}`} value={money(i.price * i.quantity)} />
            ))}
            <View style={styles.divider} />
            <Row label="Total" value={money(subtotal)} bold />
            {!!error && <Text style={[font.small, { color: colors.danger }]}>{error}</Text>}
            <Button title="Place Order" onPress={submit} loading={submitting} style={{ alignSelf: 'stretch' }} />
          </View>
        </View>
      </Container>
    </Page>
  );
}

function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active && styles.optionActive]}>
      <Text style={[font.small, { color: active ? colors.primary : colors.text, fontWeight: active ? '600' : '400' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { paddingHorizontal: 16, height: 40, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  optionActive: { borderColor: colors.primary, backgroundColor: '#EEF4FF' },
  multiline: { height: 90, paddingTop: 12, textAlignVertical: 'top' },
  summary: { backgroundColor: colors.soft, borderRadius: 16, padding: 24, gap: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
