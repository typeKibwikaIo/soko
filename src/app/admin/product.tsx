import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { AdminGate } from '@/components/AdminGate';
import { Page } from '@/components/Page';
import { Button, Container, Field, Loading, useResponsive } from '@/components/ui';
import { getProduct, saveProduct } from '@/lib/api';
import { colors, font } from '@/lib/theme';
import { CATEGORIES, type Category } from '@/lib/types';

export default function ProductEditor() {
  return (
    <AdminGate>
      <Editor />
    </AdminGate>
  );
}

function Editor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isWide } = useResponsive();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    category: 'fashion' as Category,
    featured: false,
  });

  useEffect(() => {
    if (!id) return;
    getProduct(id).then((p) => {
      if (p) {
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          stock: String(p.stock),
          imageUrl: p.imageUrl,
          category: p.category,
          featured: !!p.featured,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    const price = Number(form.price);
    const stock = Number.parseInt(form.stock, 10);
    if (!form.name.trim() || !form.imageUrl.trim()) return setError('Name and image URL are required.');
    if (!(price > 0)) return setError('Price must be greater than 0.');
    if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a whole number ≥ 0.');
    setError(null);
    setSaving(true);
    try {
      await saveProduct(
        {
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          stock,
          imageUrl: form.imageUrl.trim(),
          category: form.category,
          featured: form.featured,
        },
        id,
      );
      router.replace('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Page><Loading /></Page>;

  return (
    <Page>
      <Container style={{ paddingVertical: isWide ? 56 : 32, gap: 16, maxWidth: 640 }}>
        <Text style={isWide ? font.h2 : font.h2Sm}>{id ? 'Edit product' : 'Add product'}</Text>
        <Field label="Name" value={form.name} onChangeText={set('name')} />
        <Field
          label="Description"
          value={form.description}
          onChangeText={set('description')}
          multiline
          style={{ height: 100, paddingTop: 12, textAlignVertical: 'top' }}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Price (USD)" value={form.price} onChangeText={set('price')} keyboardType="decimal-pad" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Stock" value={form.stock} onChangeText={set('stock')} keyboardType="number-pad" />
          </View>
        </View>
        <Field label="Image URL" value={form.imageUrl} onChangeText={set('imageUrl')} autoCapitalize="none" placeholder="https://…" />
        {!!form.imageUrl && <Image source={form.imageUrl} style={{ width: 120, height: 120, borderRadius: 12 }} contentFit="cover" />}

        <Text style={[font.small, { fontWeight: '500' }]}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((c) => {
            const active = form.category === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => set('category')(c.id)}
                style={{
                  paddingHorizontal: 14,
                  height: 36,
                  justifyContent: 'center',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? '#EEF4FF' : '#fff',
                }}
              >
                <Text style={[font.small, { color: active ? colors.primary : colors.text }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Switch value={form.featured} onValueChange={set('featured')} trackColor={{ true: colors.primary }} />
          <Text style={font.body}>Featured on home page</Text>
        </View>

        {!!error && <Text style={[font.small, { color: colors.danger }]}>{error}</Text>}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button title="Save Product" onPress={save} loading={saving} />
          <Button title="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>
      </Container>
    </Page>
  );
}
