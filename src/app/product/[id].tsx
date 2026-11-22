import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Page } from '@/components/Page';
import { Button, Container, EmptyState, Loading, QtyButton, useResponsive } from '@/components/ui';
import { useCart } from '@/context/CartContext';
import { getProduct } from '@/lib/api';
import { money } from '@/lib/format';
import { useAsync } from '@/lib/hooks';
import { colors, font, layout } from '@/lib/theme';
import { CATEGORIES } from '@/lib/types';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, loading } = useAsync(() => getProduct(id), [id]);
  const { isWide } = useResponsive();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (loading) return <Page><Loading /></Page>;
  if (!product) {
    return (
      <Page>
        <EmptyState title="Product not found" cta={<Button title="Back to shop" href="/shop" style={{ alignSelf: 'center' }} />} />
      </Page>
    );
  }

  const soldOut = product.stock === 0;

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 64 : 24 }}>
        <View style={[isWide ? { flexDirection: 'row', gap: 64 } : { gap: 24 }]}>
          <Image
            source={product.imageUrl}
            style={{ flex: isWide ? 1 : undefined, aspectRatio: 1, borderRadius: layout.radius, backgroundColor: colors.soft }}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 16, paddingTop: isWide ? 24 : 0 }}>
            <Text style={[font.small, { color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 }]}>
              {CATEGORIES.find((c) => c.id === product.category)?.label}
            </Text>
            <Text style={isWide ? font.h2 : font.h2Sm}>{product.name}</Text>
            <Text style={[font.h3, { fontWeight: '400' }]}>{money(product.price)}</Text>
            <Text style={[font.body, { color: colors.muted }]}>{product.description}</Text>
            <Text style={[font.small, { color: soldOut ? colors.danger : colors.success }]}>
              {soldOut ? 'Out of stock' : `${product.stock} in stock`}
            </Text>

            {!soldOut && (
              <View style={styles.qtyRow}>
                <QtyButton label="−" onPress={() => setQty((q) => Math.max(1, q - 1))} />
                <Text style={[font.body, { minWidth: 32, textAlign: 'center' }]}>{qty}</Text>
                <QtyButton label="+" onPress={() => setQty((q) => Math.min(product.stock, q + 1))} />
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <Button
                title={added ? 'Added to bag ✓' : 'Add to Bag'}
                disabled={soldOut}
                onPress={() => {
                  add(product, qty);
                  setAdded(true);
                }}
              />
              {added && <Button title="View Bag" variant="outline" onPress={() => router.push('/cart')} />}
            </View>
          </View>
        </View>
      </Container>
    </Page>
  );
}

const styles = StyleSheet.create({
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
