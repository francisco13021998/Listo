import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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

function formatMemberSince(dateStr: string | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session, profileUsername, loading: sessionLoading } = useSession();
  const { activeHouseholdId, isHydrated } = useActiveHousehold();

  const isBootstrapping = sessionLoading || !isHydrated;
  const email = session?.user?.email ?? 'Sin correo disponible';
  const username = profileUsername ?? 'Usuario';
  const initials = getInitials(username);
  const isVerified = Boolean(session?.user?.email_confirmed_at);
  const memberSince = formatMemberSince(session?.user?.created_at);

  if (isBootstrapping) {
    return (
      <Screen scrollable includeBottomSafeArea={false}>
        <SwipeTabs style={styles.page}>
          <View style={styles.hero}>
            <View style={styles.heroOrbPrimary} />
            <View style={styles.heroOrbSecondary} />
            <View style={styles.heroCenter}>
              <View style={styles.avatarSkeleton} />
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginTop: 16 }} />
            </View>
          </View>
          <View style={styles.content} />
        </SwipeTabs>
      </Screen>
    );
  }

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
            onPress={() => router.push('/modals/profile-settings')}
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.settingsBtnPressed]}
          >
            <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.heroCenter}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.heroName}>{username}</Text>
            <Text style={styles.heroEmail}>{email}</Text>

            <View style={styles.heroBadgesRow}>
              <View style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgePending]}>
                <Ionicons
                  name={isVerified ? 'checkmark-circle' : 'time-outline'}
                  size={11}
                  color={isVerified ? '#166534' : '#92400E'}
                />
                <Text style={[styles.badgeText, isVerified ? styles.badgeTextVerified : styles.badgeTextPending]}>
                  {isVerified ? 'Verificado' : 'Sin verificar'}
                </Text>
              </View>

              {memberSince && (
                <View style={styles.badge}>
                  <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.75)" />
                  <Text style={styles.badgeText}>Desde {memberSince}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/household')}
            style={({ pressed }) => [styles.actionCard, pressed && styles.actionCardPressed]}
          >
            <View style={styles.actionCardIcon}>
              <Ionicons name="home-outline" size={18} color={tokens.colors.primaryDark} />
            </View>
            <View style={styles.actionCardText}>
              <Text style={styles.actionCardLabel}>Mi hogar</Text>
              <Text style={styles.actionCardValue}>
                {activeHouseholdId ? 'Hogar activo — gestiona miembros y más' : 'Sin hogar activo'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
          </Pressable>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="person-circle-outline" size={16} color={tokens.colors.primaryDark} />
              <Text style={styles.infoCardTitle}>Cuenta</Text>
            </View>
            <InfoRow label="Usuario" value={username} />
            <View style={styles.divider} />
            <InfoRow label="Correo" value={email} />
            <View style={styles.divider} />
            <InfoRow
              label="Estado"
              value={isVerified ? 'Verificado' : 'Pendiente de verificación'}
              valueColor={isVerified ? '#166534' : '#92400E'}
            />
            <View style={styles.divider} />
            <InfoRow label="Sesión" value="Activa" valueColor="#166534" />
          </View>
        </View>
      </SwipeTabs>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    marginHorizontal: -16,
    marginVertical: -16,
    backgroundColor: '#F3F6F2',
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  heroOrbPrimary: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroOrbSecondary: {
    position: 'absolute',
    left: -20,
    bottom: -24,
    width: 100,
    height: 100,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  settingsBtn: {
    position: 'absolute',
    right: 18,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 3,
  },
  settingsBtnPressed: {
    opacity: 0.8,
  },
  heroCenter: {
    alignItems: 'center',
    paddingTop: 12,
    gap: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  heroName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  badgeVerified: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  badgePending: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE68A',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextVerified: {
    color: '#166534',
  },
  badgeTextPending: {
    color: '#92400E',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionCardPressed: {
    opacity: 0.88,
  },
  actionCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardText: {
    flex: 1,
    gap: 2,
  },
  actionCardLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  actionCardValue: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  infoCardTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    gap: 12,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
});
