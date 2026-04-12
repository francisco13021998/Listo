import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useSession } from '../../src/hooks/useSession';
import { hasSupabaseConfig, missingSupabaseConfigMessage } from '../../src/lib/env';
import { useOnboardingState } from '../../src/state/onboarding.store';
import { tokens } from '../../src/theme/tokens';

export default function GateScreen() {
  const { session, loading } = useSession();
  const { activeHouseholdId, isHydrated: isHouseholdHydrated } = useActiveHousehold();
  const { hasSeenOnboarding, isHydrated: isOnboardingHydrated } = useOnboardingState(session?.user?.id ?? null);

  if (!hasSupabaseConfig) {
    return (
      <View style={styles.loadingScreen}>
        <EmptyState
          title="Falta configurar Supabase"
          subtitle={missingSupabaseConfigMessage}
          message="Configura esas variables en EAS Secrets o en el perfil de build y vuelve a generar la APK."
        />
      </View>
    );
  }

  if (loading || !isHouseholdHydrated || !isOnboardingHydrated) {
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

  if (!hasSeenOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href={activeHouseholdId ? '/(tabs)/list' : '/(tabs)/household'} />;
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
});
