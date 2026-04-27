import { Redirect, Stack, Tabs, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useSession } from '../../src/hooks/useSession';
import { TAB_ROUTES } from '../../src/navigation/tabRoutes';
import { tokens } from '../../src/theme/tokens';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabBarHeightProvider } from '../../src/state/tabBarHeight.store';

export default function TabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
  const { session, loading: isSessionLoading } = useSession();
  const { activeHouseholdId, isHydrated } = useActiveHousehold();
  const allowedWithoutHousehold = pathname === '/(tabs)/household' || pathname === '/(tabs)/settings';

  useEffect(() => {
    if (!isHydrated || !session || activeHouseholdId || allowedWithoutHousehold) {
      return;
    }

    router.replace('/(tabs)/household');
  }, [activeHouseholdId, allowedWithoutHousehold, isHydrated, router, session]);

  if (isSessionLoading || !isHydrated) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
        <Text style={styles.loadingText}>Cargando…</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <TabBarHeightProvider height={tabBarHeight}>
      <Tabs
        initialRouteName="list"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: tokens.colors.primaryDark,
          tabBarInactiveTintColor: '#7C8798',
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 2,
            paddingBottom: insets.bottom,
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            backgroundColor: '#FFFFFF',
          },
          tabBarItemStyle: {
            paddingTop: 0,
            paddingBottom: 0,
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
                {...(props as any)}
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
    </TabBarHeightProvider>
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
