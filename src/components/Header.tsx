import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { isBackendConfigured } from '@/lib/backend';
import { isFirebaseConfigured } from '@/lib/firebase';
import { colors } from '@/lib/theme';
import { Button, Container, useResponsive } from './ui';

function NavLink({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable>
        <Text style={styles.navLink}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function Header() {
  const { isWide } = useResponsive();
  const insets = useSafeAreaInsets();
  const { user, isAdmin } = useAuth();
  const { count } = useCart();

  // In demo mode the banner above already pads for the notch.
  const isLive = isBackendConfigured || isFirebaseConfigured;
  return (
    <View style={[styles.bar, { paddingTop: isLive ? insets.top : 0 }]}>
      <Container style={styles.row}>
        <View style={styles.left}>
          <Link href="/" asChild>
            <Pressable>
              <Text style={styles.logo}>SOKO</Text>
            </Pressable>
          </Link>
          {isWide && (
            <View style={styles.nav}>
              <NavLink href="/shop" label="Shop" />
              <NavLink href="/shop?category=fashion" label="Fashion" />
              <NavLink href="/shop?category=electronics" label="Electronics" />
              <NavLink href="/shop?category=home" label="Home" />
              {user && <NavLink href="/orders" label="My Orders" />}
              {isAdmin && <NavLink href="/admin" label="Admin" />}
            </View>
          )}
        </View>

        <View style={styles.right}>
          {!isWide && (
            <Link href="/shop" asChild>
              <Pressable hitSlop={8}>
                <Ionicons name="search-outline" size={20} color={colors.text} />
              </Pressable>
            </Link>
          )}
          <Link href="/cart" asChild>
            <Pressable hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="bag-outline" size={20} color={colors.text} />
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </Pressable>
          </Link>
          {user ? (
            <Link href="/account" asChild>
              <Pressable hitSlop={8}>
                <Ionicons name="person-circle-outline" size={24} color={colors.text} />
              </Pressable>
            </Link>
          ) : (
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.login}>Log In</Text>
              </Pressable>
            </Link>
          )}
          <Button title="Shop Now" size="sm" href="/shop" />
        </View>
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  logo: { fontSize: 24, fontWeight: '900', letterSpacing: -1, color: colors.text },
  nav: { flexDirection: 'row', gap: 22 },
  navLink: { fontSize: 14, color: colors.text },
  right: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  login: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
