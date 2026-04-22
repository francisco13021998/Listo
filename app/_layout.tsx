import { Stack } from "expo-router";
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActiveHouseholdProvider } from "../src/state/activeHousehold.store";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <ActiveHouseholdProvider>
        <Stack>
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
      </ActiveHouseholdProvider>
    </SafeAreaProvider>
  );
}
