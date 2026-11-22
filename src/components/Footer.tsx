import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/lib/theme';
import { Container, useResponsive } from './ui';

const COLUMNS: { title: string; links: { label: string; href: Href }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/shop' },
      { label: 'Fashion', href: '/shop?category=fashion' },
      { label: 'Electronics', href: '/shop?category=electronics' },
      { label: 'Home', href: '/shop?category=home' },
      { label: 'Beauty', href: '/shop?category=beauty' },
      { label: 'Food & Drinks', href: '/shop?category=food' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Log In', href: '/login' },
      { label: 'Create Account', href: '/register' },
      { label: 'My Orders', href: '/orders' },
      { label: 'Cart', href: '/cart' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Delivery Information', href: '/' },
      { label: 'Payment Options', href: '/' },
      { label: 'Returns', href: '/' },
      { label: 'Contact Us', href: '/' },
    ],
  },
];

export function Footer() {
  const { isWide } = useResponsive();
  return (
    <View style={styles.footer}>
      <Container>
        <Text style={styles.crumb}>Soko DRC  ›  Online Store</Text>
        <View style={styles.divider} />
        <Text style={styles.logo}>SOKO</Text>
        <Text style={[font.small, { color: colors.muted, maxWidth: 640, marginTop: 12 }]}>
          Soko DRC is an online marketplace delivering fashion, electronics, home goods and local products across
          Kinshasa, Lubumbashi, Goma and beyond. Pay with mobile money or cash on delivery.
        </Text>
        <View style={styles.social}>
          {(['logo-facebook', 'logo-instagram', 'logo-whatsapp', 'logo-tiktok', 'logo-youtube'] as const).map((n) => (
            <Ionicons key={n} name={n} size={18} color={colors.text} />
          ))}
        </View>

        <View style={[styles.columns, !isWide && { flexDirection: 'column', gap: 28 }]}>
          {COLUMNS.map((col) => (
            <View key={col.title} style={{ flex: 1, gap: 10 }}>
              <Text style={styles.colTitle}>{col.title}</Text>
              {col.links.map((l) => (
                <Link key={l.label} href={l.href} style={styles.link}>
                  {l.label}
                </Link>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.bottom}>
          <Text style={styles.link}>Terms of Use · Privacy Policy</Text>
          <Text style={styles.link}>© {new Date().getFullYear()} Soko DRC</Text>
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { backgroundColor: '#fff', paddingTop: 32, paddingBottom: 24 },
  crumb: { ...font.small, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 24 },
  logo: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  social: { flexDirection: 'row', gap: 16, marginTop: 20 },
  columns: { flexDirection: 'row', gap: 32, marginTop: 40 },
  colTitle: { ...font.small, fontWeight: '600', color: colors.text },
  link: { ...font.small, color: colors.muted },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 48,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
