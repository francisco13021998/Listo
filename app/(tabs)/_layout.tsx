import { Stack, Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { TAB_ROUTES } from '../../src/navigation/tabRoutes';
import { tokens } from '../../src/theme/tokens';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeHouseholdId, isHydrated } = useActiveHousehold();
  const allowedWithoutHousehold = pathname === '/(tabs)/household' || pathname === '/(tabs)/settings';

  useEffect(() => {
    if (!isHydrated || activeHouseholdId || allowedWithoutHousehold) {
      return;
    }

    router.replace('/(tabs)/household');
  }, [activeHouseholdId, allowedWithoutHousehold, isHydrated, router]);

  if (!isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
        <Text style={styles.loadingText}>Cargando hogar…</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tokens.colors.primaryDark,
        tabBarInactiveTintColor: '#7C8798',
        tabBarStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarButton: (props) => {
          const isAllowedWithoutHousehold = route.name === 'household' || route.name === 'settings';
          const disabled = !activeHouseholdId && !isAllowedWithoutHousehold;

          return (
            <Pressable
              {...props}
              disabled={disabled || props.disabled}
              style={({ pressed }) => [
                props.style,
                disabled && styles.disabledTabButton,
                pressed && !disabled && styles.pressedTabButton,
              ]}
            />
          );
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconNameByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
            household: focused ? 'home' : 'home-outline',
            list: focused ? 'list' : 'list-outline',
            stores: focused ? 'storefront' : 'storefront-outline',
            products: focused ? 'basket' : 'basket-outline',
            settings: focused ? 'person-circle' : 'person-circle-outline',
          };

          const iconName = iconNameByRoute[route.name] ?? 'ellipse-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {TAB_ROUTES.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{
            title:
              route.name === 'household'
                ? 'Hogar'
                : route.name === 'list'
                  ? 'Lista'
                  : route.name === 'stores'
                    ? 'Tiendas'
                    : route.name === 'products'
                      ? 'Productos'
                      : 'Perfil',
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: tokens.colors.background,
  },
  loadingText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledTabButton: {
    opacity: 0.35,
  },
  pressedTabButton: {
    opacity: 0.72,
  },
});
