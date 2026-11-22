import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Page } from '@/components/Page';
import { ProductCard } from '@/components/ProductCard';
import { Container, EmptyState, Loading, useResponsive } from '@/components/ui';
import { listProducts } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { colors, font, layout } from '@/lib/theme';
import { CATEGORIES, type Category } from '@/lib/types';

export default function Shop() {
  const params = useLocalSearchParams<{ q?: string; category?: Category }>();
  const [q, setQ] = useState(params.q ?? '');
  const category = params.category;
  const { width, isWide } = useResponsive();
  const { data, loading, error } = useAsync(listProducts);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter(
      (p) =>
        (!category || p.category === category) &&
        (!term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)),
    );
  }, [data, q, category]);

  const cols = width >= 1100 ? 4 : width >= 700 ? 3 : 2;
  const gap = 20;
  const contentWidth = Math.min(width, layout.maxWidth) - layout.gutter * 2;
  const cardWidth = (contentWidth - gap * (cols - 1)) / cols;

  const setCategory = (c?: Category) => router.setParams({ category: c ?? '' });

  return (
    <Page>
      <Container style={{ paddingTop: isWide ? 56 : 32, gap: 24 }}>
        <Text style={isWide ? font.h2 : font.h2Sm}>
          {category ? CATEGORIES.find((c) => c.id === category)?.label : 'Shop all products'}
        </Text>

        <View style={styles.search}>
          <Ionicons name="search-outline" size={18} color={colors.subtle} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search products"
            placeholderTextColor={colors.subtle}
            style={{ flex: 1, fontSize: 15, color: colors.text }}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="All" active={!category} onPress={() => setCategory()} />
          {CATEGORIES.map((c) => (
            <Chip key={c.id} label={c.label} active={category === c.id} onPress={() => setCategory(c.id)} />
          ))}
        </ScrollView>

        {loading ? (
          <Loading />
        ) : error ? (
          <EmptyState title="Couldn't load products" body={error} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No products found" body="Try a different search or category." />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, paddingBottom: 64 }}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} width={cardWidth} />
            ))}
          </View>
        )}
      </Container>
    </Page>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[font.small, { color: active ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    maxWidth: 560,
  },
  chip: { paddingHorizontal: 16, height: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
});
