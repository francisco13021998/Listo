import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../src/hooks/useSession';
import { useOnboardingState } from '../../src/state/onboarding.store';
import { tokens } from '../../src/theme/tokens';

export default function GateScreen() {
  const { session, loading } = useSession();
  const { hasSeenOnboarding, isHydrated } = useOnboardingState(session?.user?.id ?? null);

  if (loading || !isHydrated) {
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

  return <Redirect href="/(tabs)/household" />;
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
