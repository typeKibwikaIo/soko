import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { isBackendConfigured } from '@/lib/backend';
import { isFirebaseConfigured } from '@/lib/firebase';
import { colors } from '@/lib/theme';

const isLive = isBackendConfigured || isFirebaseConfigured;

function DemoBanner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: '#000', paddingTop: insets.top, paddingBottom: 6, paddingHorizontal: 16 }}>
      <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center', paddingTop: 6 }}>
        Demo mode — sample data stored on this device. Set EXPO_PUBLIC_API_URL in .env to connect the Soko backend.
      </Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style={isLive ? 'dark' : 'light'} />
          {!isLive && <DemoBanner />}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
