import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { hapticMedium } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { tokens } from '../../src/theme/tokens';

function getInitials(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase() || 'L';
}

export default function ProfileSettingsModal() {
  const router = useRouter();
  const { session } = useSession();

  const email = session?.user?.email ?? 'Sin correo disponible';
  const displayName = session?.user?.user_metadata?.display_name ?? email;
  const initials = getInitials(displayName);
  const sessionStatus = session ? 'Sesión activa' : 'Sin sesión';
  const verificationStatus = session?.user?.email_confirmed_at ? 'Verificado' : 'Pendiente';

  const handleLogout = async () => {
    try {
      void hapticMedium();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/(gate)');
    } catch (err) {
      Alert.alert('Error al cerrar sesión', (err as Error).message);
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <View style={styles.headerCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a Perfil"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Ionicons name="chevron-back" size={16} color={tokens.colors.primaryDark} />
            <Text style={styles.backButtonText}>Perfil</Text>
          </Pressable>

          <View style={styles.headerContent}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="settings-outline" size={18} color="#111827" />
            </View>

            <View style={styles.headerTextBlock}>
              <Text style={styles.heroEyebrow}>CONFIGURACIÓN</Text>
              <Text style={styles.title}>Ajustes</Text>
              <Text style={styles.subtitle}>Cuenta, hogar y sesión en un solo lugar.</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentStack}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.summaryTextBlock}>
                <Text style={styles.summaryTitle}>Tu cuenta</Text>
                <Text style={styles.summaryEmail}>{email}</Text>
              </View>

              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{verificationStatus}</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cuenta</Text>
              <Text style={styles.sectionSubtitle}>Datos básicos y acceso a la información de tu perfil.</Text>
            </View>

            <SettingsRow label="Correo" value={email} icon="mail-outline" />
            <SettingsRow label="Estado" value={sessionStatus} icon="shield-checkmark-outline" />
            <SettingsRow label="Verificación" value={verificationStatus} icon="checkmark-done-outline" />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sesión y seguridad</Text>
              <Text style={styles.sectionSubtitle}>Mantén visible la acción de salida sin mezclarla con el resto.</Text>
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>Cerrar sesión</Text>
              <Text style={styles.noticeText}>Volverás a la pantalla de acceso y se cerrará tu sesión actual en LISTO.</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => void handleLogout()}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            >
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

type SettingsRowProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

function SettingsRow({ label, value, icon }: SettingsRowProps) {
  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowIcon}>
        <Ionicons name={icon} size={15} color={tokens.colors.primaryDark} />
      </View>
      <View style={styles.settingsRowTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
  headerCard: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
  },
  backButtonPressed: {
    opacity: 0.9,
  },
  backButtonText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(17,24,39,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
  },
  heroEyebrow: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  contentStack: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: tokens.colors.primaryDark,
    fontSize: 19,
    fontWeight: '800',
  },
  summaryTextBlock: {
    flex: 1,
    gap: 2,
  },
  summaryTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  summaryEmail: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: tokens.colors.primarySoft,
  },
  statusBadgeText: {
    color: tokens.colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionHeader: {
    gap: 3,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  settingsRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowTextBlock: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: '600',
  },
  infoValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  noticeBox: {
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 6,
  },
  noticeTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  noticeText: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
  },
  logoutButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonPressed: {
    opacity: 0.92,
  },
  logoutButtonText: {
    color: '#B42318',
    fontSize: 15,
    fontWeight: '800',
  },
});