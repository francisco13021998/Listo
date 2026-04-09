import { Stack } from "expo-router";
import { ActiveHouseholdProvider } from "../src/state/activeHousehold.store";

export default function RootLayout() {
  return (
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
          options={{ presentation: "modal", title: "Supermercado", headerShown: false }}
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
          name="modals/store-prices"
          options={{ presentation: "modal", title: "Precios del supermercado", headerShown: false }}
        />
        <Stack.Screen
          name="modals/product-prices"
          options={{ presentation: "modal", title: "Precios del producto", headerShown: false }}
        />
        <Stack.Screen
          name="modals/profile-settings"
          options={{ presentation: "modal", title: "Ajustes", headerShown: false }}
        />
      </Stack>
    </ActiveHouseholdProvider>
  );
}
