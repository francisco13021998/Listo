import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useSession } from '../../src/hooks/useSession';
import { useOnboardingState } from '../../src/state/onboarding.store';
import { tokens } from '../../src/theme/tokens';

const STEPS = [
  {
    icon: 'search-outline' as const,
    title: 'Lista rápida',
    description: 'Escribe productos al vuelo o busca en tu catálogo sin fricción.',
  },
  {
    icon: 'cash-outline' as const,
    title: 'Compra más inteligente',
    description: 'Compara precios, registra históricos y detecta dónde te sale mejor comprar.',
  },
  {
    icon: 'bookmark-outline' as const,
    title: 'Producto o texto libre',
    description: 'Añade compras sin registro previo y conviértelas en productos cuando te convenga.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useSession();
  const { hasSeenOnboarding, isHydrated, markOnboardingSeen } = useOnboardingState(session?.user?.id ?? null);

  const canRender = useMemo(() => !loading && isHydrated, [isHydrated, loading]);

  const handleContinue = async () => {
    await markOnboardingSeen();
    router.replace('/(tabs)/household');
  };

  const handleSkip = async () => {
    await markOnboardingSeen();
    router.replace('/(tabs)/household');
  };

  if (!canRender) {
    return (
      <Screen>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
          <Text style={styles.loadingText}>Preparando el primer uso…</Text>
        </View>
      </Screen>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/(tabs)/household" />;
  }

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Primer uso</Text>
          </View>
          <Text style={styles.title}>Bienvenido a LISTO</Text>
          <Text style={styles.subtitle}>
            En dos pantallas te explicamos lo importante para empezar a ahorrar tiempo desde el primer minuto.
          </Text>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <SectionCard key={step.title}>
              <View style={styles.stepHeader}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={step.icon} size={20} color={tokens.colors.primaryDark} />
                </View>
                <Text style={styles.stepNumber}>{index + 1}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </SectionCard>
          ))}
        </View>

        <SectionCard title="Empieza a usar la app" subtitle="Puedes volver a ver esta guía más tarde si la necesitas.">
          <View style={styles.actions}>
            <PrimaryButton title="Empezar" onPress={handleContinue} fullWidth />
            <SecondaryButton title="Saltar" onPress={handleSkip} fullWidth />
          </View>
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
  },
  hero: {
    gap: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tokens.colors.primarySoft,
  },
  heroBadgeText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  steps: {
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  stepDescription: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  actions: {
    gap: 8,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
