import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FaqItem } from '@/components/FaqItem';
import { Page } from '@/components/Page';
import { ProductCard } from '@/components/ProductCard';
import { Button, Container, Eyebrow, SplitSection, useResponsive } from '@/components/ui';
import { listProducts } from '@/lib/api';
import { money } from '@/lib/format';
import { useAsync } from '@/lib/hooks';
import { colors, font, layout } from '@/lib/theme';

const IMG = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

const HERO_LEFT = IMG('photo-1531123897727-8f129e1688ce', 600);
const HERO_RIGHT = IMG('photo-1607083206869-4c7672e72a8a', 600);
const HERO_MAIN = IMG('photo-1589156280159-27698a70f29e', 900);

const CATEGORY_CARDS = [
  { title: 'Fashion made locally', body: 'Wax prints, tailoring and accessories from Congolese designers.', image: IMG('photo-1617627143750-d86bc21e42bb'), href: '/shop?category=fashion' },
  { title: 'Electronics that last', body: 'Phones, audio and solar power built for everyday life.', image: IMG('photo-1498049794561-7780e7231661'), href: '/shop?category=electronics' },
  { title: 'Everything for home', body: 'Handwoven décor, kitchenware and essentials.', image: IMG('photo-1556228453-efd6c1ff04f6'), href: '/shop?category=home' },
] as const;

const PILLARS = [
  { title: 'Delivered with speed', body: 'Same-day delivery in Kinshasa and 2–4 days to Lubumbashi, Goma and Kisangani.' },
  { title: 'Secure by design', body: 'Your account and orders are protected with Firebase Authentication and encrypted connections.' },
  { title: 'Reliable to the core', body: 'Real-time stock means what you see is what we have — no surprise cancellations.' },
  { title: 'Accessible to everyone', body: 'Shop on web, iPhone or Android. Pay with mobile money or cash on delivery.' },
];

const FEATURES = [
  { icon: 'phone-portrait-outline', title: 'Pay the way you already do', body: 'M-Pesa, Orange Money, Airtel Money, or cash when your order arrives.' },
  { icon: 'cube-outline', title: 'Track every order', body: 'See your order move from confirmed to shipped to delivered in your account.' },
  { icon: 'refresh-outline', title: 'Easy returns', body: 'Not right? Return it within 7 days for an exchange or refund.' },
] as const;

const STEPS = [
  { title: 'Browse the shop', body: 'Search or explore categories to find what you need.' },
  { title: 'Add to your bag', body: 'Pick quantities and review your bag at any time.' },
  { title: 'Check out in seconds', body: 'Enter your delivery address and choose how to pay.' },
  { title: 'Receive at your door', body: 'We deliver to your home or office and confirm by phone.' },
];

const FAQS = [
  { q: 'What is Soko DRC?', a: 'Soko DRC is an online store that brings quality fashion, electronics, home goods and local products to customers across the Democratic Republic of the Congo, with delivery to your door.' },
  { q: 'Which cities do you deliver to?', a: 'We deliver same-day in Kinshasa and within 2–4 days to Lubumbashi, Goma, Bukavu, Kisangani and Matadi. More cities are coming soon.' },
  { q: 'How can I pay?', a: 'Pay with M-Pesa, Orange Money, Airtel Money, or cash on delivery. Our team calls to confirm mobile money payments before dispatch.' },
  { q: 'How much does delivery cost?', a: 'Delivery is free in Kinshasa on orders over $50. Otherwise a flat delivery fee is confirmed when we call you.' },
  { q: 'Can I return a product?', a: 'Yes. Unused items can be returned within 7 days of delivery for an exchange or refund.' },
  { q: 'How do I track my order?', a: 'Sign in and open My Orders to see the live status of every order.' },
  { q: 'Do I need an account to order?', a: 'You can browse and fill your bag without an account. You sign in at checkout so we can save your order history.' },
];

export default function Home() {
  const { isWide, width } = useResponsive();
  const { data: products } = useAsync(listProducts);
  const featured = (products ?? []).filter((p) => p.featured).slice(0, 8);
  const [search, setSearch] = useState('');

  const goSearch = () => router.push(search.trim() ? `/shop?q=${encodeURIComponent(search.trim())}` : '/shop');
  const contentWidth = Math.min(width, layout.maxWidth) - layout.gutter * 2;
  const thirdWidth = isWide ? (contentWidth - 48) / 3 : contentWidth;

  return (
    <Page>
      {/* ---------- Hero ---------- */}
      <LinearGradient colors={colors.heroGradient} style={{ paddingTop: isWide ? 72 : 48, paddingBottom: 56 }}>
        <Container style={{ alignItems: 'center', gap: 20 }}>
          <Eyebrow>Soko DRC · Online Store</Eyebrow>
          <Text style={[isWide ? font.display : font.displaySm, styles.center, { maxWidth: 760 }]}>
            From your phone to a delivery at your door
          </Text>
          <Text style={[font.body, styles.center, { color: colors.muted, maxWidth: 520 }]}>
            Shop fashion, electronics and local favourites from across the DRC. Pay with mobile money or cash on delivery.
          </Text>
          <Button title="Start Shopping" href="/shop" style={{ alignSelf: 'center' }} />
          <Text style={[font.small, { color: colors.muted }]}>Free delivery in Kinshasa on orders over $50</Text>
        </Container>

        {/* Browser-window showcase flanked by peeking images */}
        <View style={styles.heroStage}>
          {isWide && <Image source={HERO_LEFT} style={[styles.peek, { left: -40 }]} contentFit="cover" />}
          <View style={[styles.browser, { width: isWide ? 620 : contentWidth }]}>
            <View style={styles.browserBar}>
              <Text style={styles.browserLogo}>soko</Text>
              <View style={styles.browserUrl}>
                <Text style={[font.small, { color: colors.subtle, fontSize: 11 }]}>sokodrc.com/shop</Text>
              </View>
              <Ionicons name="bag-outline" size={14} color={colors.text} />
            </View>
            <View style={{ flexDirection: 'row' }}>
              <Image source={HERO_MAIN} style={{ width: '45%', height: 260 }} contentFit="cover" />
              <View style={{ flex: 1, padding: 14, gap: 10, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {(featured.length ? featured.slice(0, 2) : []).map((p) => (
                    <View key={p.id} style={{ flex: 1, gap: 4 }}>
                      <Image source={p.imageUrl} style={{ width: '100%', height: 110, borderRadius: 8 }} contentFit="cover" />
                      <Text style={{ fontSize: 10 }} numberOfLines={1}>{p.name}</Text>
                      <Text style={{ fontSize: 10, color: colors.muted }}>{money(p.price)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.collection}>
                  <Text style={{ fontSize: 16, fontWeight: '300' }}>New Collection</Text>
                  <Ionicons name="arrow-forward" size={14} />
                </View>
              </View>
            </View>
          </View>
          {isWide && <Image source={HERO_RIGHT} style={[styles.peek, { right: -40 }]} contentFit="cover" />}
        </View>
      </LinearGradient>

      {/* ---------- Search panel ---------- */}
      <SplitSection
        title="Experience the ease of shopping online"
        body="Find exactly what you need in seconds. Search thousands of products, compare prices and order with a few taps."
        cta={<Button title="Browse Products" href="/shop" />}
      />
      <Container>
        <LinearGradient colors={['#ECE9FF', '#DCE6FF', '#F2EDFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.panel}>
          <View style={styles.searchCard}>
            <Text style={[font.small, { color: colors.muted }]}>What are you looking for today?</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={goSearch}
              placeholder="e.g. headphones, wax dress, coffee"
              placeholderTextColor={colors.subtle}
              style={styles.searchCardInput}
              returnKeyType="search"
            />
            <Button title="Search" size="sm" onPress={goSearch} style={{ alignSelf: 'flex-end' }} />
          </View>
        </LinearGradient>
      </Container>

      {/* ---------- Categories ---------- */}
      <SplitSection
        title="Naturally flow between browsing and buying"
        body="Explore collections curated for life in the DRC, from Kinshasa street style to solar gear for the road."
        cta={<Button title="Explore Categories" href="/shop" />}
      />
      <Container>
        <View style={[styles.row3, !isWide && { flexDirection: 'column' }]}>
          {CATEGORY_CARDS.map((c) => (
            <View key={c.title} style={{ width: thirdWidth, gap: 10 }}>
              <Image source={c.image} style={{ width: '100%', height: isWide ? 300 : 220, borderRadius: layout.radius }} contentFit="cover" />
              <Text style={[font.body, { color: colors.text }]}>{c.title}</Text>
              <Text style={[font.small, { color: colors.muted }]}>{c.body}</Text>
              <Button title="Shop now" variant="ghost" size="sm" href={c.href} style={{ paddingHorizontal: 0 }} />
            </View>
          ))}
        </View>
      </Container>

      {/* ---------- Pillars ---------- */}
      <Container style={{ paddingVertical: isWide ? 96 : 56 }}>
        <View style={[isWide ? { flexDirection: 'row', justifyContent: 'space-between' } : { gap: 16 }]}>
          <View style={{ maxWidth: 300, gap: 8 }}>
            <Text style={[font.h3, { fontWeight: '400' }]}>Shopping built to handle anything</Text>
            <Text style={[font.small, { color: colors.muted }]}>
              Fast, secure and reliable — so you can focus on what you love.
            </Text>
          </View>
          <Button title="Create Account" href="/register" />
        </View>
        <View style={{ marginTop: 48, gap: 40 }}>
          {PILLARS.map((p) => (
            <View key={p.title} style={{ gap: 10 }}>
              <Text style={[isWide ? font.h2 : font.h2Sm]}>{p.title}</Text>
              <Text style={[font.small, { color: colors.muted, maxWidth: 420 }]}>{p.body}</Text>
            </View>
          ))}
        </View>
      </Container>

      {/* ---------- Trust strip ---------- */}
      <Container>
        <View style={styles.trust}>
          <Text style={[font.small, { color: colors.muted }]}>Trusted by 50,000+ customers</Text>
          <View style={styles.rating}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>★ 4.8</Text>
          </View>
          <Text style={[font.small, { color: colors.muted }]}>Based on 10,000+ reviews</Text>
        </View>
      </Container>

      {/* ---------- Features ---------- */}
      <SplitSection
        title="Built for your first order, and every order that follows"
        body="Everything you need to shop with confidence, wherever you are in the country."
        cta={<Button title="Start Shopping" href="/shop" />}
      />
      <Container>
        <View style={[styles.row3, !isWide && { flexDirection: 'column' }]}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ width: thirdWidth, gap: 10 }}>
              <View style={styles.featureArt}>
                <Ionicons name={f.icon} size={40} color={colors.primary} />
              </View>
              <Text style={[font.small, { color: colors.text, fontWeight: '600' }]}>{f.title}</Text>
              <Text style={[font.small, { color: colors.muted }]}>{f.body}</Text>
            </View>
          ))}
        </View>
      </Container>

      {/* ---------- Featured carousel ---------- */}
      <SplitSection
        title="Get to know our featured picks"
        body="Hand-selected bestsellers our customers love, restocked every week."
        cta={<Button title="See All" href="/shop" />}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
        {featured.map((p) => (
          <ProductCard key={p.id} product={p} width={isWide ? 240 : 180} />
        ))}
        {featured.length === 0 && (
          <Text style={[font.small, { color: colors.muted }]}>Featured products will appear here once added.</Text>
        )}
      </ScrollView>

      {/* ---------- How to ---------- */}
      <Container style={{ paddingVertical: isWide ? 96 : 56 }}>
        <View style={[isWide ? { flexDirection: 'row', gap: 64 } : { gap: 32 }]}>
          <View style={{ flex: 1, gap: 14 }}>
            <Text style={[isWide ? font.h2 : font.h2Sm]}>How to order online{'\n'}in 4 easy steps</Text>
            <Text style={[font.small, { color: colors.muted }]}>Follow these steps to get your first order delivered.</Text>
            <Button title="Start Now" href="/shop" />
            <View style={{ marginTop: 24, gap: 22 }}>
              {STEPS.map((s, i) => (
                <View key={s.title} style={{ flexDirection: 'row', gap: 16 }}>
                  <Text style={[font.small, { fontWeight: '600', width: 24 }]}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[font.small, { fontWeight: '600' }]}>{s.title}</Text>
                    <Text style={[font.small, { color: colors.muted }]}>{s.body}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <Image
            source={IMG('photo-1607082348824-0a96f2a4b9da')}
            style={{ flex: isWide ? 1 : undefined, height: isWide ? undefined : 260, minHeight: 260, borderRadius: layout.radius }}
            contentFit="cover"
          />
        </View>
      </Container>

      {/* ---------- Blue banner ---------- */}
      <Container>
        <LinearGradient colors={colors.bannerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <Text style={[isWide ? font.h2 : font.h2Sm, { color: '#fff', textAlign: 'center', maxWidth: 520 }]}>
            Turn your search into a delivery at your door
          </Text>
          <View style={styles.bannerSearch}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={goSearch}
              placeholder="Search for a product"
              placeholderTextColor={colors.subtle}
              style={{ flex: 1, fontSize: 14, color: colors.text, paddingHorizontal: 8 }}
              returnKeyType="search"
            />
            <Button title="Search" size="sm" onPress={goSearch} />
          </View>
          <Text style={[font.small, { color: 'rgba(255,255,255,0.8)', fontSize: 11 }]}>
            Free delivery in Kinshasa on orders over $50.
          </Text>
        </LinearGradient>
      </Container>

      {/* ---------- FAQ ---------- */}
      <Container style={{ paddingVertical: isWide ? 96 : 56 }}>
        <View style={[isWide ? { flexDirection: 'row', gap: 64 } : { gap: 24 }]}>
          <Text style={[isWide ? font.h2 : font.h2Sm, { width: isWide ? 320 : undefined }]}>Soko DRC{'\n'}FAQ</Text>
          <View style={{ flex: 1 }}>
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} question={f.q} answer={f.a} initiallyOpen={i === 0} />
            ))}
          </View>
        </View>
      </Container>

      {/* ---------- Closing ---------- */}
      <LinearGradient colors={colors.closingGradient} style={{ paddingVertical: isWide ? 140 : 88 }}>
        <Container style={{ alignItems: 'center', gap: 28 }}>
          <Text style={[isWide ? styles.closing : font.displaySm, styles.center]}>Locally loved,{'\n'}delivered fast.</Text>
          <Button title="Start Shopping" href="/shop" style={{ alignSelf: 'center' }} />
        </Container>
      </LinearGradient>
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center', color: colors.text },
  heroStage: { marginTop: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.gutter },
  peek: { position: 'absolute', top: 30, width: 240, height: 300, borderRadius: layout.radius },
  browser: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2B2B6B',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  browserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 34,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  browserLogo: { fontWeight: '800', fontSize: 12 },
  browserUrl: { flex: 1, height: 20, borderRadius: 10, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 10 },
  collection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF4B8',
    borderRadius: 8,
    padding: 12,
  },
  panel: { borderRadius: layout.radius, minHeight: 360, alignItems: 'center', justifyContent: 'center', padding: 24 },
  searchCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    gap: 12,
    shadowColor: '#2B2B6B',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  searchCardInput: {
    height: 70,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
  },
  row3: { flexDirection: 'row', gap: 24 },
  trust: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
    paddingVertical: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rating: { backgroundColor: '#000', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  featureArt: { height: 180, borderRadius: layout.radius, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  carousel: {
    gap: 16,
    paddingHorizontal: layout.gutter,
    paddingLeft: layout.gutter,
  },
  banner: { borderRadius: 24, paddingVertical: 72, paddingHorizontal: 20, alignItems: 'center', gap: 22 },
  bannerSearch: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 5,
    paddingLeft: 14,
  },
  closing: { fontSize: 96, lineHeight: 100, fontWeight: '300', letterSpacing: -3 },
});
