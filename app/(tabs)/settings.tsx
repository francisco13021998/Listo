import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useSession } from '../../src/hooks/useSession';
import { tokens } from '../../src/theme/tokens';

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase() || 'L';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { activeHouseholdId } = useActiveHousehold();

  const email = session?.user?.email ?? 'Sin correo disponible';

  const initials = useMemo(() => getInitials(session?.user?.user_metadata?.display_name ?? email), [email, session?.user?.user_metadata?.display_name]);

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>
        <View style={styles.heroHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push('/modals/profile-settings')}
            style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsButtonPressed]}
          >
            <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>LISTO</Text>
            <Text style={styles.title}>Perfil</Text>
            <Text style={styles.heroSubtitle}>Gestiona tu cuenta y tu sesión.</Text>
          </View>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={styles.profileTextBlock}>
              <Text style={styles.profileName}>Tu cuenta</Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="person-outline" size={16} color={tokens.colors.primaryDark} />
              </View>
              <View style={styles.sectionTitleBlock}>
                <Text style={styles.sectionTitle}>Sesión</Text>
                <Text style={styles.sectionSubtitle}>Correo y estado de tu acceso actual.</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Estado</Text>
              <Text style={styles.metaValue}>Sesión activa</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Hogar</Text>
              <Text style={styles.metaValue}>{activeHouseholdId ? 'Con hogar activo' : 'Sin hogar seleccionado'}</Text>
            </View>
          </View>
        </View>
      </SwipeTabs>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    marginHorizontal: -16,
    marginVertical: -16,
    backgroundColor: '#F3F6F2',
  },
  heroHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 42,
  },
  heroContent: {
    gap: 4,
    maxWidth: 560,
    zIndex: 2,
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 18,
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    zIndex: 3,
  },
  settingsButtonPressed: {
    opacity: 0.88,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
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
    marginTop: -18,
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 14,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: tokens.colors.primaryDark,
    fontSize: 20,
    fontWeight: '800',
  },
  profileTextBlock: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleBlock: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  metaLabel: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: tokens.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    marginTop: 2,
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
