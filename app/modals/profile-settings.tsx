import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { hapticMedium } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { tokens } from '../../src/theme/tokens';

const APP_VERSION = '1.0.0';

export default function ProfileSettingsModal() {
  const router = useRouter();
  const { session, profileComparisonMode, updateComparisonMode } = useSession();

  const email = session?.user?.email ?? '';

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión en LISTO?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            void hapticMedium();
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace('/(gate)');
          } catch (err) {
            Alert.alert('Error al cerrar sesión', (err as Error).message);
          }
        },
      },
    ]);
  };

  const handleChangeComparisonMode = async (mode: 'unit_price' | 'total_price') => {
    if (mode === profileComparisonMode) return;
    try {
      await updateComparisonMode(mode);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el ajuste. Inténtalo de nuevo.');
    }
  };

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
          >
            <Ionicons name="chevron-back" size={16} color={tokens.colors.primaryDark} />
            <Text style={styles.backBtnText}>Perfil</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <Text style={styles.headerSubtitle}>Configuración de la aplicación</Text>
        </View>

        <SettingsSection title="Preferencias" icon="options-outline">
          <View style={styles.settingBlock}>
            <Text style={styles.settingBlockTitle}>Comparación de precios</Text>
            <Text style={styles.settingBlockSubtitle}>Cómo se determina el precio más barato entre tiendas.</Text>
            <View style={styles.radioGroup}>
              <RadioOption
                label="Por precio/unidad"
                description="Compara el precio por kg, L o unidad. Recomendado."
                selected={profileComparisonMode === 'unit_price'}
                onPress={() => handleChangeComparisonMode('unit_price')}
              />
              <View style={styles.radioDivider} />
              <RadioOption
                label="Por precio total"
                description="Compara el precio total sin normalizar por cantidad."
                selected={profileComparisonMode === 'total_price'}
                onPress={() => handleChangeComparisonMode('total_price')}
              />
            </View>
          </View>

          <View style={styles.sectionDivider} />

          <SettingsRow icon="language-outline" label="Idioma" value="Español" badge="Próximamente" />
        </SettingsSection>

        <SettingsSection title="Cuenta y seguridad" icon="shield-outline">
          <SettingsRow icon="mail-outline" label="Correo electrónico" value={email || '—'} />
        </SettingsSection>

        <SettingsSection title="Acerca de" icon="information-circle-outline">
          <SettingsRow icon="phone-portrait-outline" label="Versión de la app" value={`v${APP_VERSION}`} />
          <View style={styles.sectionDivider} />
          <SettingsRow icon="people-outline" label="Desarrollado por" value="Equipo Listo" />
        </SettingsSection>

        <Pressable accessibilityRole="button" onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}>
          <Ionicons name="log-out-outline" size={18} color="#B42318" />
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        </Pressable>

        <Text style={styles.footer}>LISTO · v{APP_VERSION}</Text>
      </View>
    </Screen>
  );
}

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={14} color={tokens.colors.primaryDark} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  badge,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  badge?: string;
  onPress?: () => void;
}) {
  const interactive = Boolean(onPress);
  return (
    <Pressable
      accessibilityRole={interactive ? 'button' : 'text'}
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, interactive && pressed && styles.settingsRowPressed]}
    >
      <View style={styles.settingsRowIcon}>
        <Ionicons name={icon} size={15} color={tokens.colors.primaryDark} />
      </View>
      <View style={styles.settingsRowTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.settingsRowRight}>
          <Text style={styles.infoValue} numberOfLines={1}>
            {value}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
          {interactive ? <Ionicons name="chevron-forward" size={14} color={tokens.colors.textMuted} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

function RadioOption({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.radioRow, pressed && styles.radioRowPressed]}>
      <View style={[styles.radioCircle, selected && styles.radioCircleSelected]}>
        {selected ? <View style={styles.radioFill} /> : null}
      </View>
      <View style={styles.radioTextBlock}>
        <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
        <Text style={styles.radioDescription}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    marginHorizontal: -16,
    marginVertical: -16,
    backgroundColor: '#F3F6F2',
    paddingBottom: 24,
  },
  header: {
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
    gap: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 10,
  },
  backBtnPressed: {
    opacity: 0.82,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sectionIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  settingBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 6,
  },
  settingBlockTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  settingBlockSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 17,
  },
  radioGroup: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  radioDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  radioRowPressed: {
    backgroundColor: '#F3F4F6',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioCircleSelected: {
    borderColor: tokens.colors.primaryDark,
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.primaryDark,
  },
  radioTextBlock: {
    flex: 1,
    gap: 2,
  },
  radioLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  radioLabelSelected: {
    color: tokens.colors.primaryDark,
    fontWeight: '800',
  },
  radioDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  settingsRowPressed: {
    backgroundColor: '#F9FAFB',
  },
  settingsRowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowTextBlock: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  infoValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgeText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 14,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnPressed: {
    opacity: 0.88,
  },
  logoutBtnText: {
    color: '#B42318',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 18,
  },
});