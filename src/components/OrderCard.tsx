import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { date, money } from '@/lib/format';
import { colors, font } from '@/lib/theme';
import { PAYMENT_METHODS, type Order, type OrderStatus } from '@/lib/types';

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#B26B00',
  confirmed: colors.primary,
  shipped: '#6B3CF0',
  delivered: colors.success,
  cancelled: colors.danger,
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <View style={[styles.pill, { borderColor: STATUS_COLORS[status] }]}>
      <Text style={[font.small, { color: STATUS_COLORS[status], textTransform: 'capitalize', fontSize: 12 }]}>{status}</Text>
    </View>
  );
}

export function OrderCard({ order, highlight, footer }: { order: Order; highlight?: boolean; footer?: ReactNode }) {
  return (
    <View style={[styles.card, highlight && { borderColor: colors.primary }]}>
      <View style={styles.head}>
        <View style={{ gap: 2 }}>
          <Text style={[font.small, { fontWeight: '600' }]}>Order #{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={[font.small, { color: colors.muted }]}>{date(order.createdAt)}</Text>
        </View>
        <StatusPill status={order.status} />
      </View>
      {order.items.map((i) => (
        <Text key={i.productId} style={[font.small, { color: colors.muted }]}>
          {i.quantity} × {i.name} — {money(i.price * i.quantity)}
        </Text>
      ))}
      <View style={styles.foot}>
        <Text style={[font.small, { color: colors.muted }]}>
          {PAYMENT_METHODS.find((m) => m.id === order.paymentMethod)?.label} · {order.shipping.city}
        </Text>
        <Text style={[font.body, { fontWeight: '600' }]}>{money(order.total)}</Text>
      </View>
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 20, gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
});
