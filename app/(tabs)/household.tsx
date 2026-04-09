import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Alert, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useHouseholds } from '../../src/hooks/useHouseholds';
import { useSession } from '../../src/hooks/useSession';
import { hapticError, hapticMedium, hapticSuccess, hapticTap } from '../../src/lib/haptics';
import { supabase } from '../../src/lib/supabase';
import { getHouseholdVisual } from '../../src/theme/visuals';
import { tokens } from '../../src/theme/tokens';

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function HouseholdScreen() {
  const router = useRouter();
  const { activeHouseholdId, isHydrated, setActiveHouseholdId } = useActiveHousehold();
  const { user, loading: sessionLoading } = useSession();
  const {
    households,
    loading,
    error,
    hasLoaded,
    createHousehold,
    createInvitation,
    joinHouseholdByCode,
    leaveHousehold,
    getHouseholdMemberCount,
    refresh,
  } = useHouseholds();
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [inviteRemainingSeconds, setInviteRemainingSeconds] = useState(0);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [selectedHouseholdAction, setSelectedHouseholdAction] = useState<'create' | 'join'>('create');
  const [deleteForeverOpen, setDeleteForeverOpen] = useState(false);
  const [deleteForeverName, setDeleteForeverName] = useState('');
  const [deleteForeverTarget, setDeleteForeverTarget] = useState<{ id: string; name: string } | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const activeHousehold = useMemo(
    () => households.find((household) => household.id === activeHouseholdId) ?? null,
    [activeHouseholdId, households]
  );
  const householdVisual = getHouseholdVisual();

  useEffect(() => {
    if (!inviteExpiresAt) {
      setInviteRemainingSeconds(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((new Date(inviteExpiresAt).getTime() - Date.now()) / 1000));
      setInviteRemainingSeconds(remaining);

      if (remaining === 0) {
        setInviteCode(null);
        setInviteExpiresAt(null);
      }
    };

    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [inviteExpiresAt]);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/(auth)/sign-in');
    }
  }, [router, sessionLoading, user]);

  if (!isHydrated || sessionLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.centerText}>Cargando…</Text>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.centerText}>Redirigiendo…</Text>
        </View>
      </Screen>
    );
  }

  const handleCreate = async () => {
    if (!newHouseholdName.trim()) {
      void hapticError();
      Alert.alert('Nombre requerido', 'Añade un nombre para el hogar');
      return;
    }
    try {
      const id = await createHousehold(newHouseholdName.trim());
      void hapticSuccess();
      await setActiveHouseholdId(id);
      await refresh();
      setNewHouseholdName('');
    } catch (err) {
      void hapticError();
      Alert.alert('Error al crear hogar', (err as Error).message);
    }
  };

  const handleCreateInvitation = async () => {
    if (!activeHouseholdId) {
      void hapticError();
      Alert.alert('No hay hogar activo', 'Selecciona un hogar antes de crear un código de invitación.');
      return;
    }

    try {
      setInviteLoading(true);
      const invitation = await createInvitation(activeHouseholdId);
      setInviteCode(invitation.code);
      setInviteExpiresAt(invitation.expiresAt);
      void hapticSuccess();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al crear invitación', (err as Error).message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    const trimmedCode = joinCode.trim();

    if (!trimmedCode) {
      void hapticError();
      Alert.alert('Código requerido', 'Introduce un código de invitación válido.');
      return;
    }

    try {
      setJoiningCode(true);
      const householdId = await joinHouseholdByCode(trimmedCode);
      await setActiveHouseholdId(householdId);
      void hapticSuccess();
      setInviteCode(null);
      setInviteExpiresAt(null);
      setJoinCode('');
      await refresh();
    } catch (err) {
      void hapticError();
      Alert.alert('No se pudo unir al hogar', (err as Error).message);
    } finally {
      setJoiningCode(false);
    }
  };

  const exitHousehold = async () => {
    if (!activeHouseholdId) return;

    void hapticMedium();
    setInviteCode(null);
    setInviteExpiresAt(null);
    void setActiveHouseholdId(null);
  };

  const openPermanentLeaveFlow = async (household: { id: string; name: string }) => {
    try {
      const memberCount = await getHouseholdMemberCount(household.id);

      if (memberCount > 1) {
        Alert.alert(
          'Salir del hogar',
          'Salirás de este hogar y necesitarás una nueva invitación para volver a entrar.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: () => {
                void handlePermanentLeave(household);
              },
            },
          ]
        );
        return;
      }

      setLeaveError(null);
      setDeleteForeverName('');
      setDeleteForeverTarget(household);
      setDeleteForeverOpen(true);
    } catch (err) {
      void hapticError();
      Alert.alert('No se pudo comprobar el hogar', (err as Error).message);
    }
  };

  const handlePermanentLeave = async (household: { id: string; name: string }) => {
    try {
      setLeaveLoading(true);
      setLeaveError(null);
      await leaveHousehold(household.id);
      void hapticSuccess();
      if (activeHouseholdId === household.id) {
        await setActiveHouseholdId(null);
      }
      setDeleteForeverOpen(false);
      setDeleteForeverTarget(null);
      setDeleteForeverName('');
      await refresh();
    } catch (err) {
      void hapticError();
      setLeaveError((err as Error).message);
    } finally {
      setLeaveLoading(false);
    }
  };

  const confirmDeleteForever = async () => {
    if (!deleteForeverTarget) return;

    if (deleteForeverName.trim() !== deleteForeverTarget.name.trim()) {
      void hapticError();
      setLeaveError('Escribe exactamente el nombre del hogar para confirmar.');
      return;
    }

    await handlePermanentLeave(deleteForeverTarget);
  };

  const handleLogout = async () => {
    void hapticMedium();
    await supabase.auth.signOut();
    await setActiveHouseholdId(null);
    router.replace('/(gate)');
  };

  const handleSelectHousehold = async (householdId: string) => {
    if (householdId === activeHouseholdId) {
      return;
    }

    void hapticTap();
    await setActiveHouseholdId(householdId);
  };

  return (
    <Screen scrollable>
      <SwipeTabs style={styles.page}>
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>LISTO</Text>
            <Text style={styles.heroTitle}>Hogar</Text>
            <Text style={styles.heroSubtitle}>Gestiona el hogar activo y organiza tus espacios compartidos.</Text>
          </View>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>
          {activeHouseholdId ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconWrap, { backgroundColor: householdVisual.backgroundColor }]}>
                  <Ionicons name={householdVisual.icon} size={16} color={householdVisual.color} />
                </View>
                <View style={styles.sectionTitleBlock}>
                  <Text style={styles.sectionTitle}>Hogar activo</Text>
                  <Text style={styles.sectionSubtitle}>{activeHousehold ? activeHousehold.name : 'Hogar activo seleccionado.'}</Text>
                </View>
              </View>

              <View style={styles.activeActions}>
                <Pressable
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.secondaryActionPressed]}
                  onPress={exitHousehold}
                >
                  <Text style={styles.secondaryActionText}>Cambiar de hogar</Text>
                </Pressable>

                <View style={styles.inviteBlock}>
                  <View style={styles.inviteBlockHeader}>
                    <View>
                      <Text style={styles.inviteBlockTitle}>Código de invitación</Text>
                      <Text style={styles.inviteBlockSubtitle}>Crea un código temporal para que otra persona entre al hogar.</Text>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [styles.primaryAction, (pressed || inviteLoading) && styles.primaryActionPressed]}
                    onPress={handleCreateInvitation}
                    disabled={inviteLoading}
                  >
                    <Text style={styles.primaryActionText}>{inviteLoading ? 'Generando…' : 'Crear código de invitación'}</Text>
                  </Pressable>

                  {inviteCode ? (
                    <View style={styles.inviteCodeCard}>
                      <Text style={styles.inviteCodeLabel}>Código activo</Text>
                      <Text style={styles.inviteCodeValue}>{inviteCode}</Text>
                      <Text style={styles.inviteCodeHelp}>Caduca en {formatRemainingTime(inviteRemainingSeconds)}. Se desactiva automáticamente.</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {!activeHouseholdId ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderCompact}>
                <View>
                  <Text style={styles.sectionTitle}>Menú de hogares</Text>
                  <Text style={styles.sectionSubtitle}>Tienes dos opciones: crear un hogar nuevo o unirte a uno ya creado.</Text>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              {loading ? <Text style={styles.helperText}>Cargando hogares…</Text> : null}

              <View style={styles.choiceRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedHouseholdAction('create')}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    selectedHouseholdAction === 'create' && styles.choiceButtonActive,
                    pressed && styles.choiceButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      selectedHouseholdAction === 'create' && styles.choiceButtonTextActive,
                    ]}
                  >
                    Crear hogar
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedHouseholdAction('join')}
                  style={({ pressed }) => [
                    styles.choiceButton,
                    selectedHouseholdAction === 'join' && styles.choiceButtonActive,
                    pressed && styles.choiceButtonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceButtonText,
                      selectedHouseholdAction === 'join' && styles.choiceButtonTextActive,
                    ]}
                  >
                    Unirse por código
                  </Text>
                </Pressable>
              </View>

              <View style={styles.menuPanel}>
                {selectedHouseholdAction === 'create' ? (
                  <View style={styles.menuRow}>
                    <Text style={styles.menuItemTitle}>Crear hogar</Text>
                    <Text style={styles.menuItemSubtitle}>Añade un nuevo espacio compartido y selecciónalo al instante.</Text>
                    <View style={styles.inputShell}>
                      <TextInput
                        style={styles.input}
                        placeholder="Nombre del hogar"
                        placeholderTextColor="#98A2B3"
                        value={newHouseholdName}
                        onChangeText={setNewHouseholdName}
                      />
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.primaryAction, (pressed || loading) && styles.primaryActionPressed]}
                      onPress={handleCreate}
                      disabled={loading}
                    >
                      <Text style={styles.primaryActionText}>{loading ? 'Creando…' : 'Crear hogar'}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.menuRow}>
                    <Text style={styles.menuItemTitle}>Unirse por código</Text>
                    <Text style={styles.menuItemSubtitle}>Introduce un código válido para entrar en un hogar ya creado.</Text>
                    <View style={styles.inputShell}>
                      <TextInput
                        style={styles.input}
                        placeholder="Código de invitación"
                        placeholderTextColor="#98A2B3"
                        value={joinCode}
                        onChangeText={setJoinCode}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </View>
                    <Pressable
                      style={({ pressed }) => [styles.primaryAction, (pressed || joiningCode) && styles.primaryActionPressed]}
                      onPress={handleJoinByCode}
                      disabled={joiningCode}
                    >
                      <Text style={styles.primaryActionText}>{joiningCode ? 'Uniendo…' : 'Unirse al hogar'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {households.length === 0 && !loading ? <Text style={styles.helperText}>No tienes hogares aún.</Text> : null}

              <View style={styles.householdsList}>
                {households.map((household) => (
                  <View key={household.id} style={styles.householdRowShell}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void handleSelectHousehold(household.id)}
                      style={({ pressed }) => [styles.householdRow, pressed && styles.householdRowPressed]}
                    >
                      <View style={[styles.householdBadge, { backgroundColor: householdVisual.backgroundColor }]}>
                        <Ionicons name={householdVisual.icon} size={18} color={householdVisual.color} />
                      </View>

                      <View style={styles.householdTextBlock}>
                        <Text style={styles.householdName}>{household.name}</Text>
                      </View>

                      <Text style={styles.householdChevron}>›</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void openPermanentLeaveFlow(household)}
                      style={({ pressed }) => [styles.leaveForeverButton, pressed && styles.leaveForeverButtonPressed]}
                    >
                      <Ionicons name="trash-outline" size={14} color="#B42318" />
                      <Text style={styles.leaveForeverButtonText}>Salir para siempre</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </SwipeTabs>

      <Modal visible={deleteForeverOpen} transparent animationType="fade" onRequestClose={() => setDeleteForeverOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardShell}>
            <SectionCard title="Eliminar hogar para siempre" subtitle="Esto borrará el hogar y todos sus productos, supermercados y precios.">
              <Text style={styles.modalWarningText}>
                Escribe el nombre exacto de {deleteForeverTarget?.name ?? 'este hogar'} para confirmar la eliminación.
              </Text>

              <View style={styles.inputShell}>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del hogar"
                  placeholderTextColor="#98A2B3"
                  value={deleteForeverName}
                  onChangeText={setDeleteForeverName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {leaveError ? <Text style={styles.modalErrorText}>{leaveError}</Text> : null}

              <PrimaryButton title={leaveLoading ? 'Eliminando…' : 'Eliminar hogar'} onPress={() => void confirmDeleteForever()} loading={leaveLoading} disabled={leaveLoading} fullWidth />
              <SecondaryButton title="Cancelar" onPress={() => setDeleteForeverOpen(false)} fullWidth />
            </SectionCard>
          </View>
        </View>
      </Modal>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  centerText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCardShell: {
    width: '100%',
    maxWidth: 520,
  },
  modalWarningText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  modalErrorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
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
  heroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
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
    paddingBottom: 36,
    gap: 14,
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
  sectionHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  inviteBlock: {
    gap: 10,
  },
  activeActions: {
    gap: 12,
  },
  inviteBlockHeader: {
    gap: 2,
  },
  inviteBlockTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  inviteBlockSubtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  inviteCodeCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B7E4C3',
    backgroundColor: '#F2FBF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  inviteCodeLabel: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inviteCodeValue: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  inviteCodeHelp: {
    color: '#166534',
    fontSize: 12,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7E9DB',
    backgroundColor: '#F8FBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonActive: {
    borderColor: tokens.colors.primaryDark,
    backgroundColor: tokens.colors.primarySoft,
  },
  choiceButtonPressed: {
    opacity: 0.92,
  },
  choiceButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  choiceButtonTextActive: {
    color: tokens.colors.primaryDark,
  },
  menuPanel: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FAFCFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuRow: {
    gap: 10,
  },
  menuItemTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  menuItemSubtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  primaryAction: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: tokens.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  primaryActionPressed: {
    opacity: 0.92,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryActionPressed: {
    opacity: 0.9,
  },
  secondaryActionText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    minHeight: 50,
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  inputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  helperText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  householdsList: {
    gap: 10,
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  householdRowPressed: {
    opacity: 0.92,
  },
  householdRowActive: {
    borderColor: '#B7E4C3',
    backgroundColor: '#F2FBF5',
  },
  householdRowShell: {
    gap: 8,
  },
  householdBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  householdTextBlock: {
    flex: 1,
    gap: 2,
  },
  householdName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  householdChevron: {
    color: '#94A3B8',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
  leaveForeverButton: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF1F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    shadowColor: '#B42318',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  leaveForeverButtonPressed: {
    opacity: 0.92,
  },
  leaveForeverButtonText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '800',
  },
  activePill: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    backgroundColor: tokens.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
