import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionCard } from '../../src/components/SectionCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useSession } from '../../src/hooks/useSession';
import { useOnboardingState } from '../../src/state/onboarding.store';
import { tokens } from '../../src/theme/tokens';

const STEPS = [
  {
    icon: 'list-outline' as const,
    title: 'Decide qué quieres comprar',
    description: 'Apunta algo rápido o elige un producto que ya tengas guardado.',
  },
  {
    icon: 'people-outline' as const,
    title: 'Comparte la lista con tu hogar',
    description: 'Todas las personas del hogar ven la misma lista y pueden usarla a la vez.',
  },
  {
    icon: 'cash-outline' as const,
    title: 'Compra donde te salga mejor',
    description: 'Guarda precios y compara tiendas para gastar menos.',
  },
] as const;

const BENEFITS = [
  'La lista se comparte con todo tu hogar.',
  'Puedes añadir productos aunque no estén registrados todavía.',
  'La app te ayuda a recordar precios y comparar tiendas.',
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, loading } = useSession();
  const { hasSeenOnboarding, isHydrated, markOnboardingSeen } = useOnboardingState(session?.user?.id ?? null);

  const canRender = useMemo(() => !loading && isHydrated, [isHydrated, loading]);

  const handleContinue = async () => {
    await markOnboardingSeen();
    router.replace('/(gate)');
  };

  const handleSkip = async () => {
    await markOnboardingSeen();
    router.replace('/(gate)');
  };

  if (!canRender) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
          <Text style={styles.loadingText}>Preparando la guía inicial…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (hasSeenOnboarding) {
    return <Redirect href="/(gate)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom", "left", "right"]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundGlowLarge} />
      <View style={styles.backgroundGlowSmall} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={14} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>Guía rápida</Text>
          </View>

          <Text style={styles.title}>Bienvenido a LISTO</Text>
          <Text style={styles.subtitle}>
            Aquí decides qué quieres comprar, lo compartes con tu hogar y descubres dónde te sale más barato.
          </Text>

          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>
          <SectionCard title="Qué hace LISTO por ti" subtitle="La app está pensada para que todo sea fácil de entender desde el principio.">
            <View style={styles.benefitsList}>
              {BENEFITS.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <View style={styles.benefitDot} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="Cómo funciona" subtitle="Solo necesitas recordar estas tres ideas.">
            <View style={styles.steps}>
              {STEPS.map((step, index) => (
                <View key={step.title} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepIconWrap}>
                      <Ionicons name={step.icon} size={20} color={tokens.colors.primaryDark} />
                    </View>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard title="Empieza ahora" subtitle="En cuanto entres, podrás abrir tu hogar y comenzar tu lista.">
            <View style={styles.actions}>
              <PrimaryButton title="Entendido, empezar" onPress={handleContinue} fullWidth />
            </View>
          </SectionCard>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EAF7EE',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: tokens.spacing.xl,
    justifyContent: 'flex-start',
  },
  backgroundTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: tokens.colors.primaryDark,
  },
  backgroundGlowLarge: {
    position: 'absolute',
    top: 36,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
  },
  backgroundGlowSmall: {
    position: 'absolute',
    left: -70,
    bottom: 110,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 107, 58, 0.10)',
  },
  page: {
    gap: 14,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
  },
  heroHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 2,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: 12,
    zIndex: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 560,
    zIndex: 2,
  },
  heroOrbPrimary: {
    position: 'absolute',
    right: -30,
    top: -28,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroOrbSecondary: {
    position: 'absolute',
    right: 36,
    bottom: -28,
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  contentStack: {
    gap: 14,
  },
  benefitsList: {
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: tokens.colors.primaryDark,
    marginTop: 5,
  },
  benefitText: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  steps: {
    gap: 12,
  },
  stepCard: {
    borderRadius: 18,
    backgroundColor: '#F8FBF8',
    borderWidth: 1,
    borderColor: '#DCE6DE',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepNumber: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '800',
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