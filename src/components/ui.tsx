import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, font, layout } from '@/lib/theme';

export function useResponsive() {
  const { width } = useWindowDimensions();
  return { width, isWide: width >= layout.wideBreakpoint };
}

export function Container({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  href?: Href;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, href, variant = 'primary', size = 'md', loading, disabled, style }: ButtonProps) {
  const content = (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        size === 'sm' && styles.btnSm,
        variant === 'primary' && { backgroundColor: pressed ? colors.primaryPressed : colors.primary },
        variant === 'danger' && { backgroundColor: colors.danger },
        variant === 'outline' && styles.btnOutline,
        variant === 'ghost' && styles.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? '#fff' : colors.primary} />
      ) : (
        <Text
          style={[
            styles.btnText,
            size === 'sm' && { fontSize: 13 },
            (variant === 'outline' || variant === 'ghost') && { color: colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
  return href ? <Link href={href} asChild>{content}</Link> : content;
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.subtle} style={[styles.input, !!error && { borderColor: colors.danger }]} {...props} />
      {!!error && <Text style={{ color: colors.danger, ...font.small }}>{error}</Text>}
    </View>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

/** Reference layout: big thin heading on the left, short copy + CTA on the right. */
export function SplitSection({
  title,
  body,
  cta,
  style,
}: {
  title: string;
  body: string;
  cta?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { isWide } = useResponsive();
  return (
    <Container style={[{ paddingVertical: isWide ? 72 : 48 }, style]}>
      <View style={[isWide ? styles.splitRow : { gap: 20 }]}>
        <Text style={[isWide ? font.h2 : font.h2Sm, { color: colors.text, flex: isWide ? 1 : undefined, maxWidth: 520 }]}>
          {title}
        </Text>
        <View style={{ width: isWide ? 300 : '100%', gap: 16 }}>
          <Text style={[font.small, { color: colors.muted }]}>{body}</Text>
          {cta}
        </View>
      </View>
    </Container>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 64, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function EmptyState({ title, body, cta }: { title: string; body?: string; cta?: ReactNode }) {
  return (
    <View style={{ paddingVertical: 72, alignItems: 'center', gap: 12 }}>
      <Text style={[font.h2Sm, { textAlign: 'center' }]}>{title}</Text>
      {!!body && <Text style={[font.body, { color: colors.muted, textAlign: 'center' }]}>{body}</Text>}
      {cta}
    </View>
  );
}

export function QtyButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.qtyBtn}>
      <Text style={{ fontSize: 18, color: colors.text }}>{label}</Text>
    </Pressable>
  );
}

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={[font.small, { color: bold ? colors.text : colors.muted, fontWeight: bold ? '600' : '400' }]}>{label}</Text>
      <Text style={[font.small, { fontWeight: bold ? '600' : '400' }]}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.gutter,
  },
  btn: {
    borderRadius: 999,
    paddingHorizontal: 24,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  btnSm: { height: 34, paddingHorizontal: 16 },
  btnOutline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' },
  btnGhost: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  label: { ...font.small, color: colors.text, fontWeight: '500' },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  eyebrow: { ...font.eyebrow, color: colors.text, textTransform: 'uppercase', textAlign: 'center' },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 48 },
});
