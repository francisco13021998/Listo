import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text, Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { HouseholdAccessModal } from '../../src/components/household/HouseholdAccessModal';
import { HouseholdSelectionCard } from '../../src/components/household/HouseholdSelectionCard';
import { LeaveHouseholdDialog } from '../../src/components/household/LeaveHouseholdDialog';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useHouseholds } from '../../src/hooks/useHouseholds';
import { useSession } from '../../src/hooks/useSession';
import { hapticError, hapticMedium, hapticSuccess, hapticTap } from '../../src/lib/haptics';
import { showGenericErrorAlert } from '../../src/lib/uiError';
import { tokens } from '../../src/theme/tokens';

type AccessMode = 'create' | 'join';

type LeaveDialogState = {
  open: boolean;
  target: { id: string; name: string } | null;
  isDeletingLastMember: boolean;
};

type HouseholdMember = {
  user_id: string;
  username: string;
  role: string;
  created_at: string;
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
    getHouseholdMembers,
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
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const isBootstrapping = sessionLoading || !isHydrated || (!hasLoaded && loading);

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
    if (!activeHouseholdId) {
      setHouseholdMembers([]);
      setMembersError(null);
      return;
    }

    let cancelled = false;

    const loadMembers = async () => {
      setMembersLoading(true);
      setMembersError(null);

      try {
        const members = await getHouseholdMembers(activeHouseholdId);
        if (!cancelled) {
          setHouseholdMembers(members);
        }
      } catch (err) {
        if (!cancelled) {
          setMembersError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [activeHouseholdId, getHouseholdMembers]);

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace('/(auth)/sign-in');
    }
  }, [router, sessionLoading, user]);

  if (isBootstrapping) {
    return (
      <Screen scrollable includeBottomSafeArea={false}>
        <SwipeTabs style={styles.page}>
          <View style={styles.heroHeader}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>LISTO</Text>
              <Text style={styles.heroTitle}>Hogar</Text>
              <Text style={styles.heroSubtitle}>Preparando tu hogar y tus miembros…</Text>
            </View>
            <View style={styles.heroOrbPrimary} />
            <View style={styles.heroOrbSecondary} />
          </View>

          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
            <Text style={styles.loadingText}>Cargando tu hogar…</Text>
          </View>
        </SwipeTabs>
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
      showGenericErrorAlert();
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
      showGenericErrorAlert();
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
      showGenericErrorAlert();
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

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>

        {/* Header compartido — verde oscuro como el resto de pantallas */}
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>{activeHouseholdId ? 'HOGAR ACTIVO' : 'LISTO'}</Text>
            <Text style={styles.pageTitle}>
              {activeHouseholdId ? (activeHousehold?.name ?? 'Mi hogar') : 'Hogar'}
            </Text>
          </View>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>

          {/* ── ESCENARIO: HOY hay hogar activo ── */}
          {activeHouseholdId ? (
            <>
              {/* Miembros */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="people-outline" size={18} color={tokens.colors.primary} />
                  <Text style={styles.cardTitle}>Miembros</Text>
                  {householdMembers.length > 0 ? (
                    <View style={styles.countPill}>
                      <Text style={styles.countPillText}>{householdMembers.length}</Text>
                    </View>
                  ) : null}
                </View>

                {membersLoading ? (
                  <ActivityIndicator size="small" color={tokens.colors.primary} style={styles.loader} />
                ) : membersError ? (
                  <Text style={styles.errorText}>{membersError}</Text>
                ) : householdMembers.length === 0 ? (
                  <Text style={styles.hintText}>No hay miembros visibles todavía.</Text>
                ) : (
                  <View style={styles.membersList}>
                    {householdMembers.map((member) => {
                      const initials = member.username.trim().slice(0, 2).toUpperCase() || 'M';
                      const isOwner = activeHousehold?.createdBy === member.user_id;
                      return (
                        <View key={member.user_id} style={styles.memberRow}>
                          <View style={styles.memberAvatar}>
                            <Text style={styles.memberAvatarText}>{initials}</Text>
                          </View>
                          <Text style={styles.memberName}>{member.username || 'Miembro'}</Text>
                          {isOwner ? (
                            <Text style={styles.ownerBadge}>Propietario</Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Invitar */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="person-add-outline" size={18} color={tokens.colors.primary} />
                  <Text style={styles.cardTitle}>Invitar a alguien</Text>
                </View>
                <Text style={styles.hintText}>Genera un código temporal para que otra persona entre a este hogar.</Text>

                <Pressable
                  accessibilityRole="button"
                  disabled={inviteLoading}
                  onPress={handleCreateInvitation}
                  style={({ pressed }) => [styles.primaryBtn, (pressed || inviteLoading) && styles.primaryBtnPressed]}
                >
                  <Text style={styles.primaryBtnText}>{inviteLoading ? 'Generando…' : 'Crear código'}</Text>
                </Pressable>

                {inviteCode ? (
                  <View style={styles.codeBox}>
                    <Text style={styles.codeLabel}>Código activo</Text>
                    <Text style={styles.codeValue}>{inviteCode}</Text>
                    <Text style={styles.codeTimer}>Caduca en {formatRemainingTime(inviteRemainingSeconds)}</Text>
                  </View>
                ) : null}
              </View>

              {/* Cambiar de hogar */}
              <Pressable
                accessibilityRole="button"
                onPress={exitHousehold}
                style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
              >
                <Ionicons name="swap-horizontal-outline" size={16} color={tokens.colors.textMuted} />
                <Text style={styles.ghostBtnText}>Cambiar de hogar</Text>
              </Pressable>
            </>

          ) : (
            /* ── ESCENARIO: SIN hogar activo ── */
            <>
              {hasHouseholds ? (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="home-outline" size={18} color={tokens.colors.primary} />
                    <Text style={styles.cardTitle}>Tus hogares</Text>
                  </View>

                  <View style={styles.householdsList}>
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

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openAccessModal('create')}
                    style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}
                  >
                    <Ionicons name="add-outline" size={16} color={tokens.colors.textMuted} />
                    <Text style={styles.ghostBtnText}>Crear o unirme a otro hogar</Text>
                  </Pressable>
                </View>
              ) : !loading ? (
                <View style={styles.card}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="home-outline" size={32} color={tokens.colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>Aún no tienes hogar</Text>
                  <Text style={styles.emptySubtitle}>Crea uno nuevo o entra con un código que te hayan compartido.</Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openAccessModal('create')}
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                  >
                    <Text style={styles.primaryBtnText}>Crear hogar</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => openAccessModal('join')}
                    style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
                  >
                    <Text style={styles.secondaryBtnText}>Unirme con código</Text>
                  </Pressable>
                </View>
              ) : null}
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
    position: 'relative',
    flexGrow: 1,
    marginHorizontal: -16,
    marginVertical: -16,
    backgroundColor: '#F3F6F2',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingState: {
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
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
    paddingBottom: 24,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  countPill: {
    backgroundColor: tokens.colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countPillText: {
    color: tokens.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  hintText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '600',
  },
  loader: {
    alignSelf: 'flex-start',
  },
  membersList: {
    gap: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF7F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  memberName: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  ownerBadge: {
    color: '#176B3A',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#EEF7F0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: tokens.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE4D5',
    backgroundColor: '#F7FBF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnPressed: {
    opacity: 0.85,
  },
  secondaryBtnText: {
    color: tokens.colors.primaryDark,
    fontSize: 15,
    fontWeight: '700',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  ghostBtnPressed: {
    opacity: 0.55,
  },
  ghostBtnText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  codeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B7E4C3',
    backgroundColor: '#F2FBF5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
    alignItems: 'center',
  },
  codeLabel: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  codeValue: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  codeTimer: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '600',
  },
  householdsList: {
    gap: 10,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#667085',
    textAlign: 'center',
    lineHeight: 20,
  },
});
