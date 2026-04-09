import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useSession } from '../../src/hooks/useSession';
import { hapticMedium } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { tokens } from '../../src/theme/tokens';

export default function ProfileSettingsModal() {
  const router = useRouter();
  const { session } = useSession();
  const { setActiveHouseholdId } = useActiveHousehold();

  const handleLogout = async () => {
    try {
      void hapticMedium();
      await supabase.auth.signOut();
      await setActiveHouseholdId(null);
      router.replace('/(gate)');
    } catch (err) {
      Alert.alert('Error al cerrar sesión', (err as Error).message);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>LISTO</Text>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>
            Aquí pondremos más opciones de perfil y cuenta cuando las necesites.
          </Text>
        </View>

        <SectionCard title="Sesión" subtitle="Información de la cuenta actual y acciones básicas.">
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Correo</Text>
            <Text style={styles.infoValue}>{session?.user?.email ?? 'Sin correo disponible'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <Text style={styles.infoValue}>Activa</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void handleLogout()}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          >
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </Pressable>

          <SecondaryButton title="Cerrar" onPress={() => router.back()} fullWidth />
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
  heroEyebrow: {
    color: tokens.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  infoLabel: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 8,
  },
  logoutButtonPressed: {
    opacity: 0.92,
  },
  logoutButtonText: {
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '800',
  },
});