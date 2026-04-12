import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { EmptyState } from '../../src/components/EmptyState';
import { HouseholdAccessModal } from '../../src/components/household/HouseholdAccessModal';
import { HouseholdSelectionCard } from '../../src/components/household/HouseholdSelectionCard';
import { LeaveHouseholdDialog } from '../../src/components/household/LeaveHouseholdDialog';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useHouseholds } from '../../src/hooks/useHouseholds';
import { useSession } from '../../src/hooks/useSession';
import { hapticError, hapticMedium, hapticSuccess, hapticTap } from '../../src/lib/haptics';
import { tokens } from '../../src/theme/tokens';

type AccessMode = 'create' | 'join';

type LeaveDialogState = {
  open: boolean;
  target: { id: string; name: string } | null;
  isDeletingLastMember: boolean;
};

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
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessMode, setAccessMode] = useState<AccessMode>('create');
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [inviteRemainingSeconds, setInviteRemainingSeconds] = useState(0);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [openMenuHouseholdId, setOpenMenuHouseholdId] = useState<string | null>(null);
  const [leaveDialog, setLeaveDialog] = useState<LeaveDialogState>({
    open: false,
    target: null,
    isDeletingLastMember: false,
  });
  const [leaveConfirmValue, setLeaveConfirmValue] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const activeHousehold = useMemo(
    () => households.find((household) => household.id === activeHouseholdId) ?? null,
    [activeHouseholdId, households]
  );
  const hasHouseholds = households.length > 0;

  const goToShoppingList = () => {
    router.replace('/(tabs)/list');
  };

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
      <Screen includeBottomSafeArea={false}>
        <View style={styles.center}>
          <Text style={styles.centerText}>Cargando…</Text>
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen includeBottomSafeArea={false}>
        <View style={styles.center}>
          <Text style={styles.centerText}>Redirigiendo…</Text>
        </View>
      </Screen>
    );
  }

  const openAccessModal = (mode: AccessMode) => {
    setAccessMode(mode);
    setAccessOpen(true);
  };

  const closeAccessModal = () => {
    setAccessOpen(false);
  };

  const handleCreate = async () => {
    if (!newHouseholdName.trim()) {
      void hapticError();
      Alert.alert('Nombre requerido', 'Escribe un nombre para tu hogar.');
      return;
    }

    try {
      const id = await createHousehold(newHouseholdName.trim());
      void hapticSuccess();
      await setActiveHouseholdId(id);
      await refresh();
      setNewHouseholdName('');
      setAccessOpen(false);
      goToShoppingList();
    } catch (err) {
      void hapticError();
      Alert.alert('No se pudo crear el hogar', (err as Error).message);
    }
  };

  const handleJoinByCode = async () => {
    const trimmedCode = joinCode.trim();

    if (!trimmedCode) {
      void hapticError();
      Alert.alert('Código requerido', 'Escribe un código de invitación válido.');
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
      setAccessOpen(false);
      await refresh();
      goToShoppingList();
    } catch (err) {
      void hapticError();
      Alert.alert('No se pudo entrar al hogar', (err as Error).message);
    } finally {
      setJoiningCode(false);
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

  const handleSelectHousehold = async (householdId: string) => {
    if (householdId === activeHouseholdId) {
      goToShoppingList();
      return;
    }

    void hapticTap();
    await setActiveHouseholdId(householdId);
    goToShoppingList();
  };

  const exitHousehold = async () => {
    if (!activeHouseholdId) return;

    void hapticMedium();
    setInviteCode(null);
    setInviteExpiresAt(null);
    await setActiveHouseholdId(null);
  };

  const openLeaveFlow = async (household: { id: string; name: string }) => {
    try {
      const memberCount = await getHouseholdMemberCount(household.id);
      setOpenMenuHouseholdId(null);
      setLeaveError(null);
      setLeaveConfirmValue('');
      setLeaveDialog({
        open: true,
        target: household,
        isDeletingLastMember: memberCount <= 1,
      });
    } catch (err) {
      void hapticError();
      Alert.alert('No se pudo comprobar el hogar', (err as Error).message);
    }
  };

  const closeLeaveDialog = () => {
    setLeaveDialog({ open: false, target: null, isDeletingLastMember: false });
    setLeaveConfirmValue('');
    setLeaveError(null);
  };

  const toggleHouseholdMenu = (householdId: string) => {
    setOpenMenuHouseholdId((current) => (current === householdId ? null : householdId));
  };

  const confirmLeave = async () => {
    if (!leaveDialog.target) return;

    if (leaveDialog.isDeletingLastMember && leaveConfirmValue.trim() !== leaveDialog.target.name.trim()) {
      void hapticError();
      setLeaveError('Escribe exactamente el nombre del hogar para continuar.');
      return;
    }

    try {
      setLeaveLoading(true);
      setLeaveError(null);
      await leaveHousehold(leaveDialog.target.id);
      void hapticSuccess();
      if (activeHouseholdId === leaveDialog.target.id) {
        await setActiveHouseholdId(null);
      }
      closeLeaveDialog();
      await refresh();
    } catch (err) {
      void hapticError();
      setLeaveError((err as Error).message);
    } finally {
      setLeaveLoading(false);
    }
  };

  const noActiveHero = (
    <View style={styles.noActiveHeroHeader}>
      <View style={styles.noActiveHeroContent}>
        <View style={styles.noActiveHeroBadge}>
          <Text style={styles.noActiveHeroBadgeText}>Aún no has entrado</Text>
        </View>
        <Text style={styles.noActiveHeroTitle}>Elige tu hogar</Text>
        <Text style={styles.noActiveHeroSubtitle}>Aquí verás los hogares en los que ya estás o podrás crear uno nuevo para empezar.</Text>
      </View>
    </View>
  );

  const activeHero = (
    <View style={styles.activeHeroHeader}>
      <View style={styles.activeHeroContent}>
        <View style={styles.activeHeroBadge}>
          <Ionicons name="checkmark-circle" size={14} color={tokens.colors.primaryDark} />
          <Text style={styles.activeHeroBadgeText}>Hogar activo</Text>
        </View>
        <Text style={styles.activeHeroTitle}>Ya estás dentro de tu hogar</Text>
        <Text style={styles.activeHeroSubtitle}>Desde aquí puedes gestionar el hogar que estás usando ahora mismo, invitar a otras personas o cambiar de hogar.</Text>
      </View>
    </View>
  );

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>
        {activeHouseholdId ? activeHero : noActiveHero}

        <View style={styles.contentStack}>
          {activeHouseholdId ? (
            <>
              <View style={styles.activeSummaryCard}>
                <View style={styles.activeSummaryHeader}>
                  <View style={styles.activeSummaryBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    <Text style={styles.activeSummaryBadgeText}>Activo</Text>
                  </View>
                  <Text style={styles.activeSummaryLabel}>Hogar actual</Text>
                </View>

                <Text style={styles.activeSummaryName}>{activeHousehold ? activeHousehold.name : 'Hogar activo'}</Text>
                <Text style={styles.activeSummaryText}>Este es el hogar que estás usando ahora mismo.</Text>

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
                        <Text style={styles.inviteBlockTitle}>Código para invitar a otra persona</Text>
                        <Text style={styles.inviteBlockSubtitle}>Crea un código temporal para que alguien pueda entrar a este hogar.</Text>
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [styles.primaryAction, (pressed || inviteLoading) && styles.primaryActionPressed]}
                      onPress={handleCreateInvitation}
                      disabled={inviteLoading}
                    >
                      <Text style={styles.primaryActionText}>{inviteLoading ? 'Generando…' : 'Crear código'}</Text>
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
            </>
          ) : (
            <>
              <SectionCard title="Tus hogares" subtitle="Aquí verás los hogares en los que ya estás. Toca uno para entrar.">
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {loading && !hasLoaded ? <Text style={styles.helperText}>Cargando tus hogares…</Text> : null}

                {hasHouseholds ? (
                  <View style={styles.householdsListModern}>
                    {households.map((household) => (
                      <HouseholdSelectionCard
                        key={household.id}
                        household={household}
                        onPress={() => void handleSelectHousehold(household.id)}
                        onMenuPress={() => toggleHouseholdMenu(household.id)}
                        onAccess={() => {
                          setOpenMenuHouseholdId(null);
                          void handleSelectHousehold(household.id);
                        }}
                        onLeave={() => void openLeaveFlow(household)}
                        menuOpen={openMenuHouseholdId === household.id}
                        disabled={loading}
                      />
                    ))}
                  </View>
                ) : !loading ? (
                  <EmptyState
                    title="Todavía no tienes ningún hogar"
                    subtitle="Puedes crear uno nuevo o entrar con un código que te envíe otra persona."
                    actionLabel="Crear o unirme a un hogar"
                    onAction={() => openAccessModal('create')}
                  />
                ) : null}
              </SectionCard>

              <SectionCard title="¿Necesitas hacer algo más?" subtitle="Crear o unirte es una opción secundaria. Primero mira si tu hogar ya aparece arriba.">
                <View style={styles.secondaryBlock}>
                  <Text style={styles.secondaryBlockText}>Si no ves tu hogar en la lista, aquí puedes crear uno nuevo o entrar con un código.</Text>
                  <SecondaryButton title="Crear o unirme a un hogar" onPress={() => openAccessModal('create')} fullWidth />
                </View>
              </SectionCard>
            </>
          )}
        </View>
      </SwipeTabs>

      <HouseholdAccessModal
        visible={accessOpen}
        mode={accessMode}
        onClose={closeAccessModal}
        onChangeMode={setAccessMode}
        createName={newHouseholdName}
        onChangeCreateName={setNewHouseholdName}
        joinCode={joinCode}
        onChangeJoinCode={setJoinCode}
        onCreate={() => void handleCreate()}
        onJoin={() => void handleJoinByCode()}
        creating={loading}
        joining={joiningCode}
      />

      <LeaveHouseholdDialog
        visible={leaveDialog.open}
        householdName={leaveDialog.target?.name ?? ''}
        isDeletingLastMember={leaveDialog.isDeletingLastMember}
        confirmValue={leaveConfirmValue}
        error={leaveError}
        loading={leaveLoading}
        onChangeConfirmValue={setLeaveConfirmValue}
        onConfirm={() => void confirmLeave()}
        onClose={closeLeaveDialog}
      />
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
  noActiveHeroHeader: {
    backgroundColor: '#E3F1E6',
    borderBottomWidth: 1,
    borderBottomColor: '#CFE3D4',
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 22,
  },
  noActiveHeroContent: {
    gap: 8,
    maxWidth: 560,
  },
  noActiveHeroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#F7FBF8',
    borderWidth: 1,
    borderColor: '#CFE4D5',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noActiveHeroBadgeText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  noActiveHeroTitle: {
    color: tokens.colors.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  noActiveHeroSubtitle: {
    color: '#475467',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 560,
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
    gap: 6,
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
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.96)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    maxWidth: 520,
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
  activeHeroHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34,
  },
  activeHeroContent: {
    gap: 8,
    maxWidth: 560,
    zIndex: 2,
  },
  activeHeroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeHeroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activeHeroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  activeHeroSubtitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 560,
  },
  contentStack: {
    marginTop: -18,
    paddingHorizontal: 20,
    paddingBottom: 0,
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
  activeSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFE4D5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  activeSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeSummaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  activeSummaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  activeSummaryLabel: {
    color: '#475467',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  activeSummaryName: {
    color: '#111827',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  activeSummaryText: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  helpIntro: {
    color: '#344054',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  helperText: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  householdsListModern: {
    gap: 12,
  },
  secondaryBlock: {
    gap: 10,
  },
  secondaryBlockText: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
    fontWeight: '800',
  },
  inviteBlockSubtitle: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
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
    fontWeight: '700',
  },
  secondaryAction: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFE4D5',
    backgroundColor: '#F7FBF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryActionPressed: {
    opacity: 0.92,
  },
  secondaryActionText: {
    color: tokens.colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
});
