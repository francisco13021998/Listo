import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { EmptyState } from '../../src/components/EmptyState';
import { ProductActionsMenu } from '../../src/components/product-detail/ProductActionsMenu';
import { ProductConfirmDialog } from '../../src/components/product-detail/ProductConfirmDialog';
import { ProductHeader } from '../../src/components/product-detail/ProductHeader';
import { PriceEntryMenu } from '../../src/components/product-detail/PriceEntryMenu';
import { PriceHistoryEntryViewModel, PriceHistorySection } from '../../src/components/product-detail/PriceHistorySection';
import { formatHistoryDate, formatMeasure, formatPrice, formatUnitPrice } from '../../src/components/product-detail/priceFormatting';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useProducts } from '../../src/hooks/useProducts';
import { useStores } from '../../src/hooks/useStores';
import { deleteSinglePriceEntry, listPriceHistoryForProductFiltered } from '../../src/services/prices.service';
import { PriceEntry } from '../../src/domain/prices';
import { getCategoryVisual } from '../../src/theme/visuals';

type DialogState =
  | { type: 'delete-product' }
  | { type: 'delete-price'; priceEntryId: string; storeName: string };

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const { activeHouseholdId } = useActiveHousehold();
  const { products, refresh: refreshProducts, deleteProduct } = useProducts(activeHouseholdId);
  const { stores } = useStores(activeHouseholdId);
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [productMenuAnchor, setProductMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [openEntryMenuId, setOpenEntryMenuId] = useState<string | null>(null);
  const [openEntryMenuAnchor, setOpenEntryMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const [dialogState, setDialogState] = useState<DialogState | null>(null);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((product) => product.id === productId) ?? null;
  }, [productId, products]);

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((store) => {
      map[store.id] = store.name;
    });
    return map;
  }, [stores]);

  const load = useCallback(async () => {
    if (!productId || !activeHouseholdId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPriceHistoryForProductFiltered({
        householdId: activeHouseholdId,
        productId,
      });
      setEntries(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasBootstrapped(true);
    }
  }, [activeHouseholdId, productId]);

  useFocusEffect(
    useCallback(() => {
      void refreshProducts();
      void load();
    }, [load, refreshProducts])
  );

  const closeOverlays = useCallback(() => {
    setProductMenuOpen(false);
    setProductMenuAnchor(null);
    setOpenEntryMenuId(null);
    setOpenEntryMenuAnchor(null);
  }, []);

  const handleAddPrice = () => {
    if (!productId) return;
    closeOverlays();
    router.push({ pathname: '/modals/price-editor', params: { productId, returnTo: '/modals/product-prices' } });
  };

  const handleEditProduct = () => {
    if (!productId) return;
    closeOverlays();
    router.push({ pathname: '/modals/product-editor', params: { productId } });
  };

  const handleRequestDeleteProduct = () => {
    closeOverlays();
    setDialogState({ type: 'delete-product' });
  };

  const handleEditPrice = (priceEntryId: string) => {
    if (!productId) return;
    closeOverlays();
    router.push({
      pathname: '/modals/price-editor',
      params: { productId, priceId: priceEntryId, returnTo: '/modals/product-prices' },
    });
  };

  const handleRequestDeletePrice = (priceEntryId: string) => {
    const targetEntry = entries.find((entry) => entry.id === priceEntryId);
    if (!targetEntry) return;

    closeOverlays();
    setDialogState({
      type: 'delete-price',
      priceEntryId,
      storeName: storeNameById[targetEntry.store_id] ?? 'Tienda',
    });
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((left, right) => {
      if (left.price_cents !== right.price_cents) {
        return left.price_cents - right.price_cents;
      }

      return right.purchased_at.localeCompare(left.purchased_at);
    });
  }, [entries]);

  const cheapestEntry = sortedEntries[0] ?? null;
  const cheapestOverall = useMemo(() => {
    return sortedEntries.reduce<PriceEntry | null>((currentCheapest, entry) => {
      if (!currentCheapest) return entry;

      if (entry.price_cents < currentCheapest.price_cents) {
        return entry;
      }

      if (entry.price_cents === currentCheapest.price_cents && entry.purchased_at > currentCheapest.purchased_at) {
        return entry;
      }

      return currentCheapest;
    }, null);
  }, [sortedEntries]);
  const categoryVisual = getCategoryVisual(selectedProduct?.category ?? null);
  const productSummaryParts: string[] = [];
  const storeCount = useMemo(() => new Set(entries.map((entry) => entry.store_id)).size, [entries]);

  const historyEntries = useMemo<PriceHistoryEntryViewModel[]>(() => {
    return sortedEntries.map((entry) => ({
      id: entry.id,
      storeName: storeNameById[entry.store_id] ?? 'Tienda',
      priceLabel: formatPrice(entry.price_cents),
      measureLabel: formatMeasure(entry.quantity, entry.unit),
      unitPriceLabel: formatUnitPrice(entry.price_cents, entry.quantity, entry.unit),
      dateLabel: formatHistoryDate(entry.purchased_at),
      isCheapest: cheapestOverall?.id === entry.id,
    }));
  }, [cheapestOverall?.id, sortedEntries, storeNameById]);

  if (selectedProduct?.brand?.trim()) productSummaryParts.push(selectedProduct.brand.trim());
  if (selectedProduct?.quantity !== null && selectedProduct?.quantity !== undefined) {
    productSummaryParts.push(formatMeasure(selectedProduct.quantity, selectedProduct.unit) ?? '');
  }
  if (selectedProduct?.category?.trim()) productSummaryParts.push(selectedProduct.category.trim());

  const cheapestMetaParts = cheapestEntry
    ? [
        storeNameById[cheapestEntry.store_id] ?? 'Tienda',
        formatHistoryDate(cheapestEntry.purchased_at),
        formatMeasure(cheapestEntry.quantity, cheapestEntry.unit),
        formatUnitPrice(cheapestEntry.price_cents, cheapestEntry.quantity, cheapestEntry.unit),
      ].filter(Boolean)
    : [];

  const cheapestSummary = cheapestOverall
    ? `${formatPrice(cheapestOverall.price_cents)} en ${storeNameById[cheapestOverall.store_id] ?? 'Tienda'}`
    : null;

  const openEntryMenu = openEntryMenuId ? historyEntries.find((entry) => entry.id === openEntryMenuId) ?? null : null;

  const dialogConfig = useMemo(() => {
    if (!dialogState) return null;

    if (dialogState.type === 'delete-product') {
      const priceSummary =
        entries.length === 0
          ? 'Se eliminará este producto de forma permanente.'
          : `Se eliminará este producto y también ${entries.length === 1 ? 'su precio guardado' : `sus ${entries.length} precios guardados`} de forma permanente.`;

      return {
        title: 'Eliminar producto',
        description: `${priceSummary} Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar producto',
        onConfirm: async () => {
          if (!productId) return;

          setActionLoading(true);
          try {
            await deleteProduct(productId);
            router.back();
          } catch (err) {
            Alert.alert('Error al borrar', (err as Error).message);
          } finally {
            setActionLoading(false);
            setDialogState(null);
          }
        },
      };
    }

    return {
      title: 'Eliminar precio',
      description: `Se borrará el precio guardado en ${dialogState.storeName}. Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar precio',
      onConfirm: async () => {
        if (!activeHouseholdId) return;

        setActionLoading(true);
        try {
          await deleteSinglePriceEntry(dialogState.priceEntryId);
          await load();
        } catch (err) {
          Alert.alert('Error al borrar', (err as Error).message);
        } finally {
          setActionLoading(false);
          setDialogState(null);
        }
      },
    };
  }, [activeHouseholdId, deleteProduct, dialogState, entries.length, load, productId, router]);

  if (!productId || !activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title="Detalle del producto" subtitle="Falta información necesaria para abrir el detalle.">
          <EmptyState title="No se puede continuar" subtitle="Necesitas un producto y un hogar activo." actionLabel="Cerrar" onAction={() => router.back()} />
        </SectionCard>
      </Screen>
    );
  }

  if (!selectedProduct && hasBootstrapped && !loading) {
    return (
      <Screen scrollable>
        <SectionCard title="Detalle del producto" subtitle="El producto seleccionado no existe o ya fue eliminado.">
          <EmptyState title="Producto no encontrado" subtitle="No se pudo cargar la información del producto." actionLabel="Cerrar" onAction={() => router.back()} />
        </SectionCard>
      </Screen>
    );
  }

  if (!hasBootstrapped) {
    return (
      <Screen scrollable>
        <SectionCard title="Detalle del producto" subtitle="Cargando información del producto y su histórico...">
          <EmptyState title="Cargando" subtitle="Un momento, estamos preparando el detalle." actionLabel="Cerrar" onAction={() => router.back()} />
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <ProductHeader
          productName={selectedProduct?.name ?? 'Producto'}
          summary={productSummaryParts.length ? productSummaryParts.filter(Boolean).join(' · ') : null}
          latestPriceLabel={cheapestEntry ? formatPrice(cheapestEntry.price_cents) : null}
          latestMetaLabel={cheapestMetaParts.length ? cheapestMetaParts.join(' · ') : null}
          categoryIcon={categoryVisual.icon}
          categoryIconColor={categoryVisual.color}
          categoryIconBackground={categoryVisual.backgroundColor}
          onBack={() => router.back()}
          onOpenActions={(anchor) => {
            setOpenEntryMenuId(null);
            setOpenEntryMenuAnchor(null);
            setProductMenuAnchor(anchor);
            setProductMenuOpen(true);
          }}
        />

        <PriceHistorySection
          entries={historyEntries}
          loading={loading}
          error={error}
          storeCount={storeCount}
          onOpenEntryMenu={(entryId, anchor) => {
            setProductMenuOpen(false);
            setOpenEntryMenuId(entryId);
            setOpenEntryMenuAnchor(anchor);
          }}
        />
      </View>

      <ProductActionsMenu
        visible={productMenuOpen}
        anchor={productMenuAnchor}
        productName={selectedProduct?.name ?? 'Producto'}
        loading={actionLoading}
        onAddPrice={handleAddPrice}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleRequestDeleteProduct}
        onClose={() => {
          setProductMenuOpen(false);
          setProductMenuAnchor(null);
        }}
      />

      <PriceEntryMenu
        visible={Boolean(openEntryMenu)}
        anchor={openEntryMenuAnchor}
        storeName={openEntryMenu?.storeName ?? 'Tienda'}
        priceLabel={openEntryMenu?.priceLabel ?? ''}
        dateLabel={openEntryMenu?.dateLabel ?? ''}
        loading={actionLoading}
        onEditPrice={() => {
          if (!openEntryMenu) return;
          handleEditPrice(openEntryMenu.id);
        }}
        onDeletePrice={() => {
          if (!openEntryMenu) return;
          handleRequestDeletePrice(openEntryMenu.id);
        }}
        onClose={() => {
          setOpenEntryMenuId(null);
          setOpenEntryMenuAnchor(null);
        }}
      />

      <ProductConfirmDialog
        visible={Boolean(dialogConfig)}
        title={dialogConfig?.title ?? ''}
        description={dialogConfig?.description ?? ''}
        confirmLabel={dialogConfig?.confirmLabel ?? ''}
        loading={actionLoading}
        onConfirm={() => {
          if (!dialogConfig) return;
          void dialogConfig.onConfirm();
        }}
        onClose={() => {
          if (!actionLoading) {
            setDialogState(null);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 20,
  },
});
