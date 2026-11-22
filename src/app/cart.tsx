import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Page } from '@/components/Page';
import { Button, Container, EmptyState, QtyButton, Row, useResponsive } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { money } from '@/lib/format';
import { colors, font } from '@/lib/theme';

export default function Cart() {
  const { items, subtotal, setQuantity, remove } = useCart();
  const { user } = useAuth();
  const { isWide } = useResponsive();

  const checkout = () => router.push(user ? '/checkout' : '/login?next=/checkout');

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 56 : 32, gap: 24 }}>
        <Text style={isWide ? font.h2 : font.h2Sm}>Your bag</Text>
        {items.length === 0 ? (
          <EmptyState
            title="Your bag is empty"
            body="Discover something you'll love."
            cta={<Button title="Start Shopping" href="/shop" style={{ alignSelf: 'center' }} />}
          />
        ) : (
          <View style={[isWide ? { flexDirection: 'row', gap: 48, alignItems: 'flex-start' } : { gap: 32 }]}>
            <View style={{ flex: 1 }}>
              {items.map((item) => (
                <View key={item.productId} style={styles.line}>
                  <Pressable onPress={() => router.push(`/product/${item.productId}`)}>
                    <Image source={item.imageUrl} style={styles.thumb} contentFit="cover" />
                  </Pressable>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={font.body} numberOfLines={2}>{item.name}</Text>
                    <Text style={[font.small, { color: colors.muted }]}>{money(item.price)}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <QtyButton label="−" onPress={() => setQuantity(item.productId, item.quantity - 1)} />
                      <Text style={[font.body, { minWidth: 24, textAlign: 'center' }]}>{item.quantity}</Text>
                      <QtyButton label="+" onPress={() => setQuantity(item.productId, item.quantity + 1)} />
                      <Pressable onPress={() => remove(item.productId)} style={{ marginLeft: 12 }}>
                        <Text style={[font.small, { color: colors.primary }]}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Text style={font.body}>{money(item.price * item.quantity)}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.summary, isWide && { width: 340 }]}>
              <Text style={font.h3}>Order summary</Text>
              <Row label="Subtotal" value={money(subtotal)} />
              <Row label="Delivery" value={subtotal >= 50 ? 'Free (Kinshasa)' : 'Confirmed by phone'} />
              <View style={styles.divider} />
              <Row label="Total" value={money(subtotal)} bold />
              <Button title="Checkout" onPress={checkout} style={{ alignSelf: 'stretch' }} />
              <Text style={[font.small, { color: colors.muted, textAlign: 'center' }]}>
                Mobile money or cash on delivery
              </Text>
            </View>
          </View>
        )}
      </Container>
    </Page>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  thumb: { width: 88, height: 88, borderRadius: 12, backgroundColor: colors.soft },
  summary: { backgroundColor: colors.soft, borderRadius: 16, padding: 24, gap: 14 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
