import * as Linking from 'expo-linking';
import { Stack, useRouter } from "expo-router";
import { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../src/lib/supabase';
import { ActiveHouseholdProvider } from "../src/state/activeHousehold.store";
import { OfflineBanner } from '../src/components/OfflineBanner';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthUrl = async (url: string) => {
      // Supabase email confirmation redirects to listo://verified#access_token=...&refresh_token=...&type=signup
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return;

      const fragment = url.slice(hashIndex + 1);
      const params = Object.fromEntries(new URLSearchParams(fragment));

      if (!params.access_token || !params.refresh_token) return;

      const { error } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });

      if (!error) {
        router.replace('/(auth)/verified');
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) void handleAuthUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url);
    });

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <ActiveHouseholdProvider>
        <View style={styles.container}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(gate)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />

            {/* Modals */}
            <Stack.Screen
              name="modals/household-switcher"
              options={{ presentation: "modal", title: "Cambiar hogar", headerShown: false }}
            />
            <Stack.Screen
              name="modals/product-editor"
              options={{ presentation: "modal", title: "Producto", headerShown: false }}
            />
            <Stack.Screen
              name="modals/store-editor"
              options={{ presentation: "modal", title: "Tienda", headerShown: false }}
            />
            <Stack.Screen
              name="modals/price-editor"
              options={{ presentation: "modal", title: "Precio", headerShown: false }}
            />
            <Stack.Screen
              name="modals/list-product-picker"
              options={{ presentation: "modal", title: "Añadir producto", headerShown: false }}
            />
            <Stack.Screen
              name="modals/list-item-editor"
              options={{ presentation: "modal", title: "Editar elemento", headerShown: false }}
            />
            <Stack.Screen
              name="modals/store-prices"
              options={{ presentation: "modal", title: "Detalle de la tienda", headerShown: false }}
            />
            <Stack.Screen
              name="modals/product-prices"
              options={{ presentation: "modal", title: "Detalle del producto", headerShown: false }}
            />
            <Stack.Screen
              name="modals/profile-settings"
              options={{ presentation: "modal", title: "Ajustes", headerShown: false }}
            />
          </Stack>
        </View>
      </ActiveHouseholdProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
