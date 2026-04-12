import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useStores } from '../../src/hooks/useStores';
import {
  deleteAllPricesForStore,
  deletePricesForStoreAndProduct,
  listPricesForStoreGroupedByProduct,
} from '../../src/services/prices.service';
import { hapticDelete, hapticError } from '../../src/lib/haptics';
import { StoreConfirmDialog } from '../../src/components/store-detail/StoreConfirmDialog';
import { StoreDetailHeader } from '../../src/components/store-detail/StoreDetailHeader';
import { StoreProductListItem } from '../../src/components/store-detail/types';
import { StoreProductsList } from '../../src/components/store-detail/StoreProductsList';

type PriceEntryItem = {
  id: string;
  price_cents: number;
  quantity: number | null;
  unit: string | null;
  purchased_at: string;
};

type ProductPriceGroup = {
  product_id: string;
  product_name: string;
  prices: Array<PriceEntryItem>;
};

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

function formatMeasure(quantity: number | null, unit: string | null) {
  if (quantity === null || quantity === undefined || !unit) return null;
  const quantityLabel = Number.isInteger(quantity) ? String(quantity) : String(quantity).replace('.', ',');
  return `${quantityLabel} ${unit}`;
}

function getReferenceUnit(unit: string | null) {
  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'l') return 'l';
  if (unit === 'u') return 'unidad';
  return null;
}

function getQuantityInReferenceUnit(quantity: number | null, unit: string | null) {
  if (quantity === null || quantity === undefined || quantity <= 0 || !unit) return null;
  if (unit === 'kg') return quantity;
  if (unit === 'g') return quantity / 1000;
  if (unit === 'l') return quantity;
  if (unit === 'ml') return quantity / 1000;
  if (unit === 'u') return quantity;
  return null;
}

function formatUnitPrice(cents: number, quantity: number | null, unit: string | null) {
  const referenceUnit = getReferenceUnit(unit);
  const normalizedQuantity = getQuantityInReferenceUnit(quantity, unit);

  if (!referenceUnit || !normalizedQuantity) return null;

  const value = (cents / normalizedQuantity / 100).toFixed(2).replace('.', ',');
  return `${value} €/${referenceUnit}`;
}

function formatDate(value: string) {
  return `Actualizado el ${new Date(value).toLocaleDateString('es-ES')}`;
}

type DialogState =
  | { type: 'store-delete-blocked' }
  | { type: 'delete-store' }
  | { type: 'delete-all-prices' }
  | { type: 'delete-product-prices'; productId: string; productName: string };

export default function StorePricesModal() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId?: string | string[] }>();
  const resolvedStoreId = Array.isArray(storeId) ? storeId[0] : storeId;
  const { activeHouseholdId } = useActiveHousehold();
  const { stores, deleteStore } = useStores(activeHouseholdId);
  const [groups, setGroups] = useState<Array<ProductPriceGroup>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [storeHasPrices, setStoreHasPrices] = useState(false);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [openProductMenuId, setOpenProductMenuId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const store = useMemo(() => {
    return stores.find((item) => item.id === resolvedStoreId) ?? null;
  }, [resolvedStoreId, stores]);
  const load = useCallback(async () => {
    if (!resolvedStoreId || !activeHouseholdId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPricesForStoreGroupedByProduct({ householdId: activeHouseholdId, storeId: resolvedStoreId });
      setGroups(
        [...data].sort((left, right) => {
          const leftCheapest = left.prices[0]?.price_cents ?? Number.POSITIVE_INFINITY;
          const rightCheapest = right.prices[0]?.price_cents ?? Number.POSITIVE_INFINITY;

          if (leftCheapest !== rightCheapest) {
            return leftCheapest - rightCheapest;
          }

          return left.product_name.localeCompare(right.product_name);
        })
      );
      setStoreHasPrices(data.length > 0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [activeHouseholdId, resolvedStoreId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const closeMenus = useCallback(() => {
    setStoreMenuOpen(false);
    setOpenProductMenuId(null);
  }, []);

  const handleEditStore = () => {
    if (!resolvedStoreId) return;
    closeMenus();
    router.push({ pathname: '/modals/store-editor', params: { storeId: resolvedStoreId } });
  };

  const handleRequestDeleteAllPrices = () => {
    if (!storeHasPrices) return;
    closeMenus();
    setDialogState({ type: 'delete-all-prices' });
  };

  const handleRequestDeleteStore = () => {
    closeMenus();
    if (storeHasPrices) {
      setDialogState({ type: 'store-delete-blocked' });
      return;
    }

    setDialogState({ type: 'delete-store' });
  };

  const handleEditPrice = (productId: string, priceEntryId: string) => {
    if (!resolvedStoreId) return;
    closeMenus();
    router.push({
      pathname: '/modals/price-editor',
      params: { productId, priceId: priceEntryId, returnTo: '/modals/store-prices', selectedStoreId: resolvedStoreId },
    });
  };

  const handleRequestDeleteProductPrices = (productId: string, productName: string) => {
    closeMenus();
    setDialogState({ type: 'delete-product-prices', productId, productName });
  };

  const handleToggleStoreMenu = () => {
    setOpenProductMenuId(null);
    setStoreMenuOpen((current) => !current);
  };

  const handleToggleProductMenu = (productId: string) => {
    setStoreMenuOpen(false);
    setOpenProductMenuId((current) => (current === productId ? null : productId));
  };

  const handleDeleteAllPrices = useCallback(async () => {
    if (!resolvedStoreId || !activeHouseholdId) return;

    setActionLoading(true);
    try {
      await deleteAllPricesForStore({ householdId: activeHouseholdId, storeId: resolvedStoreId });
      void hapticDelete();
      await load();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al borrar precios', (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }, [activeHouseholdId, load, resolvedStoreId]);

  const handleDeleteStore = useCallback(async () => {
    if (!resolvedStoreId) return;

    setActionLoading(true);
    try {
      await deleteStore(resolvedStoreId);
      void hapticDelete();
      router.back();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al borrar', (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }, [deleteStore, resolvedStoreId, router]);

  const handleDeleteProductPrices = useCallback(async (productId: string) => {
    if (!resolvedStoreId || !activeHouseholdId) return;

    setActionLoading(true);
    try {
      await deletePricesForStoreAndProduct({ householdId: activeHouseholdId, storeId: resolvedStoreId, productId });
      void hapticDelete();
      await load();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al borrar precios', (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }, [activeHouseholdId, load, resolvedStoreId]);

  const rowItems = useMemo<StoreProductListItem[]>(() => {
    return groups
      .map((group) => {
        const latest = group.prices[0];
        if (!latest) return null;

        return {
          productId: group.product_id,
          productName: group.product_name,
          latestPriceId: latest.id,
          priceLabel: formatPrice(latest.price_cents),
          measureLabel: formatMeasure(latest.quantity, latest.unit),
          unitPriceLabel: formatUnitPrice(latest.price_cents, latest.quantity, latest.unit),
          updatedAtLabel: formatDate(latest.purchased_at),
        };
      })
      .filter((item): item is StoreProductListItem => Boolean(item));
  }, [groups]);

  const headerSummary = useMemo(() => {
    if (!rowItems.length) {
      return 'Aún no hay productos con precio en esta tienda.';
    }

    return '';
  }, [rowItems.length]);

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

    if (dialogState.type === 'delete-all-prices') {
      return {
        title: 'Borrar todos los precios',
        description: 'Se eliminarán todos los precios guardados en esta tienda. La tienda seguirá existiendo.',
        confirmLabel: 'Borrar precios',
        confirmTone: 'danger' as const,
      };
    }

    return {
      title: `Borrar precios de ${dialogState.productName}`,
      description: 'Se borrarán todos los precios de este producto dentro de esta tienda. Esta acción no se puede deshacer.',
      confirmLabel: 'Borrar precios',
      confirmTone: 'danger' as const,
    };
  }, [dialogState]);

  const handleConfirmDialog = async () => {
    if (!dialogState) return;

    if (dialogState.type === 'store-delete-blocked') {
      setDialogState(null);
      return;
    }

    const currentDialog = dialogState;
    setDialogState(null);

    if (currentDialog.type === 'delete-store') {
      await handleDeleteStore();
      return;
    }

    if (currentDialog.type === 'delete-all-prices') {
      await handleDeleteAllPrices();
      return;
    }

    await handleDeleteProductPrices(currentDialog.productId);
  };

  if (!resolvedStoreId || !activeHouseholdId) {
    return (
      <Screen scrollable>
        <View style={styles.page}>
          <StoreDetailHeader
            title="Detalle de la tienda"
            statusLabel="Sin precios"
            summary="Falta una tienda válida o un hogar activo para abrir esta pantalla."
            menuOpen={false}
            canDeletePrices={false}
            onBack={() => router.back()}
            onToggleMenu={() => undefined}
            onEditStore={() => undefined}
            onDeleteAllPrices={() => undefined}
            onDeleteStore={() => undefined}
          />

          <View style={styles.infoCard}>
            <View style={styles.infoRail} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>No se puede abrir esta pantalla</Text>
              <Text style={styles.infoDescription}>Selecciona una tienda válida dentro de un hogar activo y vuelve a intentarlo.</Text>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  if (hasLoaded && !loading && !store) {
    return (
      <Screen scrollable>
        <View style={styles.page}>
          <StoreDetailHeader
            title="Detalle de la tienda"
            statusLabel="Sin precios"
            summary="La tienda que intentas abrir ya no está disponible."
            menuOpen={false}
            canDeletePrices={false}
            onBack={() => router.back()}
            onToggleMenu={() => undefined}
            onEditStore={() => undefined}
            onDeleteAllPrices={() => undefined}
            onDeleteStore={() => undefined}
          />

          <View style={styles.infoCard}>
            <View style={styles.infoRail} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoTitle}>Tienda no disponible</Text>
              <Text style={styles.infoDescription}>Puede que se haya eliminado o que ya no pertenezca a este hogar.</Text>
            </View>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.page}>
        {storeMenuOpen || openProductMenuId ? <Pressable style={styles.menuScrim} onPress={closeMenus} /> : null}

        <StoreDetailHeader
          title={store?.name ?? 'Tienda'}
          statusLabel={storeHasPrices ? 'Con precios' : 'Sin precios'}
          summary={headerSummary}
          menuOpen={storeMenuOpen}
          loading={actionLoading}
          canDeletePrices={storeHasPrices}
          onBack={() => router.back()}
          onToggleMenu={handleToggleStoreMenu}
          onEditStore={handleEditStore}
          onDeleteAllPrices={handleRequestDeleteAllPrices}
          onDeleteStore={handleRequestDeleteStore}
        />

        <StoreProductsList
          items={rowItems}
          loading={loading}
          error={error}
          openMenuProductId={openProductMenuId}
          actionLoading={actionLoading}
          onViewProduct={(productId) => {
            closeMenus();
            router.push({ pathname: '/modals/product-prices', params: { productId } });
          }}
          onToggleMenu={handleToggleProductMenu}
          onEditPrice={handleEditPrice}
          onDeletePrices={handleRequestDeleteProductPrices}
        />
      </View>

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
    gap: 16,
  },
  menuScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoRail: {
    width: 4,
    borderRadius: 999,
    backgroundColor: '#DCEFE2',
  },
  infoTextBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  infoTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  infoDescription: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
});
