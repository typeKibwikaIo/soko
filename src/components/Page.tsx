import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { colors } from '@/lib/theme';
import { Footer } from './Footer';
import { Header } from './Header';

/** Every screen: sticky header, scrolling content, footer at the bottom. */
export function Page({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexGrow: 1 }}>{children}</View>
        {footer && <Footer />}
      </ScrollView>
    </View>
  );
}
