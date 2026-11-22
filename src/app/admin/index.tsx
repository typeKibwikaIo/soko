import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { AdminGate } from '@/components/AdminGate';
import { OrderCard } from '@/components/OrderCard';
import { Page } from '@/components/Page';
import { Button, Container, EmptyState, Loading, useResponsive } from '@/components/ui';
import { deleteProduct, listAllOrders, listProducts, seedProducts, setOrderStatus } from '@/lib/api';
import { money } from '@/lib/format';
import { useAsync } from '@/lib/hooks';
import { colors, font } from '@/lib/theme';
import { ORDER_STATUSES } from '@/lib/types';

function confirm(message: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) =>
    Alert.alert('Confirm', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

export default function Admin() {
  return (
    <AdminGate>
      <Dashboard />
    </AdminGate>
  );
}

function Dashboard() {
  const [tab, setTab] = useState<'products' | 'orders'>('products');
  const { isWide } = useResponsive();
  const products = useAsync(listProducts);
  const orders = useAsync(listAllOrders);
  const [seeding, setSeeding] = useState(false);

  const revenue = (orders.data ?? []).filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const pending = (orders.data ?? []).filter((o) => o.status === 'pending').length;

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 56 : 32, gap: 24 }}>
        <Text style={isWide ? font.h2 : font.h2Sm}>Admin dashboard</Text>

        <View style={styles.stats}>
          <Stat label="Products" value={String(products.data?.length ?? '—')} />
          <Stat label="Orders" value={String(orders.data?.length ?? '—')} />
          <Stat label="Pending" value={String(pending)} />
          <Stat label="Revenue" value={money(revenue)} />
        </View>

        <View style={styles.tabs}>
          {(['products', 'orders'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
              <Text style={[font.body, { textTransform: 'capitalize', color: tab === t ? colors.text : colors.muted }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'products' ? (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <Button title="Add Product" href="/admin/product" />
              {products.data?.length === 0 && (
                <Button
                  title="Seed Demo Products"
                  variant="outline"
                  loading={seeding}
                  onPress={async () => {
                    setSeeding(true);
                    try {
                      await seedProducts();
                      await products.reload();
                    } finally {
                      setSeeding(false);
                    }
                  }}
                />
              )}
            </View>
            {products.loading ? (
              <Loading />
            ) : products.error ? (
              <EmptyState title="Couldn't load products" body={products.error} />
            ) : (
              products.data?.map((p) => (
                <View key={p.id} style={styles.productRow}>
                  <Image source={p.imageUrl} style={styles.thumb} contentFit="cover" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={font.body} numberOfLines={1}>{p.name}</Text>
                    <Text style={[font.small, { color: colors.muted }]}>
                      {money(p.price)} · {p.stock} in stock · {p.category}{p.featured ? ' · Featured' : ''}
                    </Text>
                  </View>
                  <Button title="Edit" size="sm" variant="outline" onPress={() => router.push(`/admin/product?id=${p.id}`)} />
                  <Button
                    title="Delete"
                    size="sm"
                    variant="ghost"
                    onPress={async () => {
                      if (await confirm(`Delete "${p.name}"?`)) {
                        await deleteProduct(p.id);
                        products.reload();
                      }
                    }}
                  />
                </View>
              ))
            )}
          </View>
        ) : orders.loading ? (
          <Loading />
        ) : orders.error ? (
          <EmptyState title="Couldn't load orders" body={orders.error} />
        ) : !orders.data?.length ? (
          <EmptyState title="No orders yet" />
        ) : (
          <View style={{ gap: 16 }}>
            {orders.data.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                footer={
                  <View style={{ gap: 10, marginTop: 8 }}>
                    <Text style={[font.small, { color: colors.muted }]}>
                      {o.shipping.fullName} · {o.shipping.phone} · {o.shipping.address}, {o.shipping.city}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {ORDER_STATUSES.map((s) => (
                        <Pressable
                          key={s}
                          disabled={s === o.status}
                          onPress={async () => {
                            await setOrderStatus(o.id, s);
                            orders.reload();
                          }}
                          style={[styles.statusBtn, s === o.status && { backgroundColor: colors.text, borderColor: colors.text }]}
                        >
                          <Text style={[font.small, { fontSize: 12, textTransform: 'capitalize', color: s === o.status ? '#fff' : colors.text }]}>
                            {s}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                }
              />
            ))}
          </View>
        )}
      </Container>
    </Page>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[font.small, { color: colors.muted }]}>{label}</Text>
      <Text style={[font.h2Sm]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stat: { flexGrow: 1, minWidth: 140, backgroundColor: colors.soft, borderRadius: 16, padding: 18, gap: 4 },
  tabs: { flexDirection: 'row', gap: 24, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tab: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.soft },
  statusBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
});
