import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { EmptyState } from '../../src/components/EmptyState';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { CreateActionButtonBlock } from '../../src/components/CreateActionButtonBlock';
import { StoreActionsMenu } from '../../src/components/store-detail/StoreActionsMenu';
import { StoreConfirmDialog } from '../../src/components/store-detail/StoreConfirmDialog';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useStores } from '../../src/hooks/useStores';
import { hapticDelete, hapticMedium } from '../../src/lib/haptics';
import { deleteAllPricesForStore } from '../../src/services/prices.service';
import { hasPrices } from '../../src/services/store.service';
import { getStoreVisual } from '../../src/theme/visuals';
import { tokens } from '../../src/theme/tokens';

type DialogState =
  | { type: 'store-delete-blocked' }
  | { type: 'delete-store'; storeId: string }
  | { type: 'delete-all-prices'; storeId: string };

export default function StoresScreen() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { stores, loading, error, deleteStore, refresh } = useStores(activeHouseholdId);
  const [openMenuStoreId, setOpenMenuStoreId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [storeHasPricesById, setStoreHasPricesById] = useState<Record<string, boolean>>({});
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const isBootstrapping = Boolean(activeHouseholdId) && !hasInitialLoadCompleted && loading;

  useEffect(() => {
    setHasInitialLoadCompleted(false);
  }, [activeHouseholdId]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    if (!loading) {
      setHasInitialLoadCompleted(true);
    }
  }, [activeHouseholdId, loading]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const sortedStores = useMemo(
    () => [...stores].sort((left, right) => left.name.localeCompare(right.name)),
    [stores]
  );
  const storeVisual = getStoreVisual();
  const hasStores = sortedStores.length > 0;

  const closeMenu = useCallback(() => {
    setOpenMenuStoreId(null);
  }, []);

  const ensureStoreHasPrices = useCallback(async (storeId: string) => {
    const cached = storeHasPricesById[storeId];
    if (cached !== undefined) {
      return cached;
    }

    const existsPrices = await hasPrices(storeId);
    setStoreHasPricesById((current) => ({ ...current, [storeId]: existsPrices }));
    return existsPrices;
  }, [storeHasPricesById]);

  const handleDelete = async (id: string) => {
    try {
      const existsPrices = await ensureStoreHasPrices(id);
      if (existsPrices) {
        Alert.alert(
          'No se puede borrar',
          'Esta tienda tiene precios asociados. Borra los precios primero.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ver precios',
              onPress: () => router.push({ pathname: '/modals/store-prices', params: { storeId: id } }),
            },
          ]
        );
        return;
      }

      await deleteStore(id);
      setStoreHasPricesById((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      void hapticMedium();
    } catch (err) {
      Alert.alert('Error al borrar', (err as Error).message);
    }
  };

  const handleEditStore = useCallback((storeId: string) => {
    closeMenu();
    router.push({ pathname: '/modals/store-editor', params: { storeId } });
  }, [closeMenu, router]);

  const handleRequestDeleteAllPrices = useCallback(async (storeId: string) => {
    const existsPrices = await ensureStoreHasPrices(storeId);
    closeMenu();
    if (!existsPrices) {
      return;
    }

    setDialogState({ type: 'delete-all-prices', storeId });
  }, [closeMenu, ensureStoreHasPrices]);

  const handleRequestDeleteStore = useCallback(async (storeId: string) => {
    const existsPrices = await ensureStoreHasPrices(storeId);
    closeMenu();

    if (existsPrices) {
      setDialogState({ type: 'store-delete-blocked' });
      return;
    }

    setDialogState({ type: 'delete-store', storeId });
  }, [closeMenu, ensureStoreHasPrices]);

  const handleToggleMenu = useCallback(async (storeId: string) => {
    setOpenMenuStoreId((current) => (current === storeId ? null : storeId));
    if (openMenuStoreId !== storeId) {
      try {
        await ensureStoreHasPrices(storeId);
      } catch {
        // Keep the menu usable even if the price check fails.
      }
    }
  }, [ensureStoreHasPrices, openMenuStoreId]);

  const handleDeleteAllPrices = useCallback(async (storeId: string) => {
    if (!activeHouseholdId) return;

    setActionLoading(true);
    try {
      await deleteAllPricesForStore({ householdId: activeHouseholdId, storeId });
      setStoreHasPricesById((current) => ({ ...current, [storeId]: false }));
      void hapticDelete();
    } catch (err) {
      Alert.alert('Error al borrar precios', (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }, [activeHouseholdId]);

  const dialogConfig = useMemo(() => {
    if (!dialogState) return null;

    if (dialogState.type === 'store-delete-blocked') {
      return {
        title: 'Primero borra los precios',
        description: 'Esta tienda todavía tiene precios guardados. Si quieres eliminarla, antes debes borrar todos sus precios.',
        confirmLabel: 'Entendido',
        confirmTone: 'primary' as const,
        hideCancel: true,
      };
    }

    if (dialogState.type === 'delete-store') {
      return {
        title: 'Eliminar tienda',
        description: 'Vas a eliminar esta tienda. Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar tienda',
        confirmTone: 'danger' as const,
      };
    }

    return {
      title: 'Borrar todos los precios',
      description: 'Se eliminarán todos los precios guardados en esta tienda. La tienda seguirá existiendo.',
      confirmLabel: 'Borrar precios',
      confirmTone: 'danger' as const,
    };
  }, [dialogState]);

  const handleConfirmDialog = useCallback(async () => {
    if (!dialogState) return;

    if (dialogState.type === 'store-delete-blocked') {
      setDialogState(null);
      return;
    }

    const currentDialog = dialogState;
    setDialogState(null);

    if (currentDialog.type === 'delete-store') {
      await handleDelete(currentDialog.storeId);
      return;
    }

    await handleDeleteAllPrices(currentDialog.storeId);
  }, [dialogState, handleDelete, handleDeleteAllPrices]);

  if (!activeHouseholdId) {
    return (
      <Screen>
        <View style={styles.center}>
          <EmptyState
            title="Selecciona un hogar"
            subtitle="Necesitas un hogar activo para gestionar las tiendas."
          />
        </View>
      </Screen>
    );
  }

  if (isBootstrapping) {
    return (
      <Screen scrollable includeBottomSafeArea={false}>
        <SwipeTabs style={styles.page}>
          <View style={styles.heroHeader}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>LISTO</Text>
              <Text style={styles.pageTitle}>Tiendas</Text>
              <Text style={styles.pageSubtitle}>Gestiona las tiendas donde registras tus precios.</Text>
            </View>
            <View style={styles.heroOrbPrimary} />
            <View style={styles.heroOrbSecondary} />
          </View>

          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
            <Text style={styles.loadingText}>Cargando tiendas...</Text>
          </View>
        </SwipeTabs>
      </Screen>
    );
  }

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>LISTO</Text>
            <Text style={styles.pageTitle}>Tiendas</Text>
            <Text style={styles.pageSubtitle}>Gestiona las tiendas donde registras tus precios.</Text>
          </View>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>
          {hasStores ? (
            <>
              <View style={styles.inputCard}>
                <View style={styles.inputCardHeader}>
                  <Text style={styles.inputCardTitle}>Tus tiendas</Text>
                  <Text style={styles.inputCardSubtitle}>Edita o crea nuevas tiendas para tu hogar.</Text>
                </View>
                <CreateActionButtonBlock
                  title="Nueva tienda"
                  subtitle="Añádela a tu hogar."
                  icon="add"
                  iconBackgroundColor="#EEF2FF"
                  iconColor="#4F46E5"
                  onPress={() => router.push('/modals/store-editor')}
                />
              </View>

              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleGroup}>
                    <View style={[styles.sectionIconWrap, { backgroundColor: storeVisual.backgroundColor }]}>
                      <Ionicons name={storeVisual.icon} size={16} color={storeVisual.color} />
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>Lista de tiendas</Text>
                      <Text style={styles.sectionHint}>{sortedStores.length} tiendas disponibles</Text>
                    </View>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorCard}>
                    <View style={styles.errorRail} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.rowsGroup}>
                  {sortedStores.map((item) => (
                    <View key={item.id} style={[styles.storeRow, openMenuStoreId === item.id && styles.storeRowMenuOpen]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          closeMenu();
                          router.push({ pathname: '/modals/store-prices', params: { storeId: item.id } });
                        }}
                        style={({ pressed }) => [styles.storeRowMainAction, pressed && styles.storeRowPressed]}
                      >
                        <View style={[styles.storeBadge, { backgroundColor: storeVisual.backgroundColor }]}>
                          <Ionicons name={storeVisual.icon} size={18} color={storeVisual.color} />
                        </View>

                        <Text style={styles.storeName}>{item.name}</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Opciones de ${item.name}`}
                        onPress={() => void handleToggleMenu(item.id)}
                        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
                      >
                        <Ionicons name="ellipsis-vertical" size={16} color="#475467" />
                      </Pressable>

                      <StoreActionsMenu
                        visible={openMenuStoreId === item.id}
                        loading={actionLoading}
                        canDeletePrices={storeHasPricesById[item.id] ?? false}
                        onEditStore={() => handleEditStore(item.id)}
                        onDeleteAllPrices={() => void handleRequestDeleteAllPrices(item.id)}
                        onDeleteStore={() => void handleRequestDeleteStore(item.id)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </>
            ) : (
              <View style={styles.emptyStateCard}>
                <View style={styles.storeEmptyCard}>
                  <View style={styles.storeEmptyBadge}>
                    <Ionicons name="storefront-outline" size={28} color={tokens.colors.primaryDark} />
                  </View>

                  <View style={styles.storeEmptyTextBlock}>
                    <Text style={styles.storeEmptyTitle}>No hay tiendas todavía</Text>
                    <Text style={styles.storeEmptySubtitle}>
                      Añade los supermercados o comercios donde compras para empezar a registrar precios por tienda.
                    </Text>
                  </View>

                  <View style={styles.storeEmptyFlow}>
                    <View style={styles.storeEmptyStep}>
                      <Text style={styles.storeEmptyStepValue}>1</Text>
                      <Text style={styles.storeEmptyStepLabel}>Crear</Text>
                    </View>
                    <View style={styles.storeEmptyStep}>
                      <Text style={styles.storeEmptyStepValue}>2</Text>
                      <Text style={styles.storeEmptyStepLabel}>Registrar</Text>
                    </View>
                    <View style={styles.storeEmptyStep}>
                      <Text style={styles.storeEmptyStepValue}>3</Text>
                      <Text style={styles.storeEmptyStepLabel}>Comparar</Text>
                    </View>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/modals/store-editor')}
                    style={({ pressed }) => [styles.storeEmptyAction, pressed && styles.storeEmptyActionPressed]}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.storeEmptyActionText}>Nueva tienda</Text>
                  </Pressable>
                </View>
              </View>
            )}
        </View>
      </SwipeTabs>

      {dialogConfig ? (
        <StoreConfirmDialog
          visible={Boolean(dialogConfig)}
          title={dialogConfig.title}
          description={dialogConfig.description}
          confirmLabel={dialogConfig.confirmLabel}
          confirmTone={dialogConfig.confirmTone}
          hideCancel={dialogConfig.hideCancel}
          loading={actionLoading}
          onConfirm={() => void handleConfirmDialog()}
          onClose={() => setDialogState(null)}
        />
      ) : null}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: -8,
    backgroundColor: tokens.colors.background,
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
  pageSubtitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  loadingText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
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
    flex: 1,
    marginTop: -18,
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 14,
  },
  inputCard: {
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
    zIndex: 10,
  },
  inputCardHeader: {
    gap: 2,
  },
  inputCardTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  inputCardSubtitle: {
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
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHint: {
    color: '#667085',
    fontSize: 13,
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  errorRail: {
    width: 3,
    borderRadius: 999,
    backgroundColor: '#DC2626',
    alignSelf: 'stretch',
  },
  rowsGroup: {
    gap: 12,
  },
  storeRow: {
    position: 'relative',
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 14,
    paddingRight: 10,
  },
  storeRowMenuOpen: {
    zIndex: 20,
    elevation: 8,
  },
  storeRowMainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storeRowPressed: {
    opacity: 0.95,
  },
  storeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBadgeText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '800',
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F7F9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    opacity: 0.92,
  },
  emptyStateCard: {
    flex: 1,
    minHeight: 320,
    justifyContent: 'center',
    gap: 14,
  },
  storeEmptyCard: {
    flex: 1,
    borderRadius: 28,
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  storeEmptyBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primarySoft,
  },
  storeEmptyTextBlock: {
    alignItems: 'center',
    gap: 8,
  },
  storeEmptyTitle: {
    color: tokens.colors.primaryDark,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  storeEmptySubtitle: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 300,
  },
  storeEmptyFlow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  storeEmptyStep: {
    flex: 1,
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  storeEmptyStepValue: {
    color: tokens.colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  storeEmptyStepLabel: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  storeEmptyAction: {
    minHeight: 48,
    borderRadius: 999,
    paddingHorizontal: 18,
    backgroundColor: tokens.colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  storeEmptyActionPressed: {
    opacity: 0.93,
  },
  storeEmptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
