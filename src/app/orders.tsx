import { Redirect, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { OrderCard } from '@/components/OrderCard';
import { Page } from '@/components/Page';
import { Button, Container, EmptyState, Loading, useResponsive } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { listMyOrders } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { colors, font } from '@/lib/theme';

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const { placed } = useLocalSearchParams<{ placed?: string }>();
  const { isWide } = useResponsive();
  const { data, loading, error } = useAsync(() => (user ? listMyOrders(user.uid) : Promise.resolve([])), [user?.uid]);

  if (authLoading) return <Page><Loading /></Page>;
  if (!user) return <Redirect href="/login?next=/orders" />;

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 56 : 32, gap: 20, maxWidth: 800 }}>
        {!!placed && (
          <View style={{ backgroundColor: '#EAF7EF', borderRadius: 12, padding: 16 }}>
            <Text style={[font.body, { color: colors.success }]}>
              Thank you! Your order was placed. We'll call you shortly to confirm delivery.
            </Text>
          </View>
        )}
        <Text style={isWide ? font.h2 : font.h2Sm}>My orders</Text>
        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState title="Couldn't load orders" body={error} />
        ) : !data?.length ? (
          <EmptyState title="No orders yet" cta={<Button title="Start Shopping" href="/shop" style={{ alignSelf: 'center' }} />} />
        ) : (
          data.map((o) => <OrderCard key={o.id} order={o} highlight={o.id === placed} />)
        )}
      </Container>
    </Page>
  );
}
