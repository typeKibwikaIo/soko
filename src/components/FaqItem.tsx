import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font } from '@/lib/theme';

export function FaqItem({ question, answer, initiallyOpen }: { question: string; answer: string; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  return (
    <View style={styles.item}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.row}>
        <Text style={[font.body, { flex: 1, color: colors.text }]}>{question}</Text>
        <Ionicons name={open ? 'close' : 'add'} size={20} color={colors.text} />
      </Pressable>
      {open && <Text style={[font.small, styles.answer]}>{answer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 },
  answer: { color: colors.muted, paddingBottom: 18, paddingRight: 36 },
});
