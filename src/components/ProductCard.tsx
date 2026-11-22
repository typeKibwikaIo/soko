import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { money } from '@/lib/format';
import { colors, font, layout } from '@/lib/theme';
import type { Product } from '@/lib/types';

export function ProductCard({ product, width }: { product: Product; width: number }) {
  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={({ pressed }) => [{ width, opacity: pressed ? 0.85 : 1 }]}>
        <Image source={product.imageUrl} style={[styles.image, { height: width * 1.05 }]} contentFit="cover" transition={200} />
        <View style={{ paddingTop: 10, gap: 2 }}>
          <Text style={[font.body, { color: colors.text }]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[font.small, { color: colors.muted }]}>{money(product.price)}</Text>
          {product.stock === 0 && <Text style={[font.small, { color: colors.danger }]}>Out of stock</Text>}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', borderRadius: layout.radius, backgroundColor: colors.soft },
});
