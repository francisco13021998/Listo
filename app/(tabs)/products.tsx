import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { EmptyState } from '../../src/components/EmptyState';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { PriceEntry } from '../../src/domain/prices';
import { Product, ProductUnit } from '../../src/domain/product';
import { CreateProductButtonBlock } from '../../src/components/products/CreateProductButtonBlock';
import { ProductCard } from '../../src/components/products/ProductCard';
import { ProductsHeader } from '../../src/components/products/ProductsHeader';
import { ProductsSearchBlock } from '../../src/components/products/ProductsSearchBlock';
import { CatalogProductItem } from '../../src/components/products/types';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { usePrices } from '../../src/hooks/usePrices';
import { useProducts } from '../../src/hooks/useProducts';
import { useStores } from '../../src/hooks/useStores';
import { getCategoryVisual } from '../../src/theme/visuals';
import { tokens } from '../../src/theme/tokens';

function getReferenceUnit(unit: ProductUnit | null) {
  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'l') return 'l';
  if (unit === 'u') return 'u';
  return null;
}

function getQuantityInReferenceUnit(quantity: number | null, unit: ProductUnit | null) {
  if (quantity === null || quantity === undefined || quantity <= 0 || !unit) return null;
  if (unit === 'kg') return quantity;
  if (unit === 'g') return quantity / 1000;
  if (unit === 'l') return quantity;
  if (unit === 'ml') return quantity / 1000;
  if (unit === 'u') return quantity;
  return null;
}

function formatUnitPrice(cents: number, quantity: number | null, unit: ProductUnit | null) {
  const referenceUnit = getReferenceUnit(unit);
  const normalizedQuantity = getQuantityInReferenceUnit(quantity, unit);

  if (!referenceUnit || !normalizedQuantity) return null;

  const pricePerReferenceUnit = cents / normalizedQuantity;
  const label = referenceUnit === 'u' ? 'unidad' : referenceUnit;
  return `${(pricePerReferenceUnit / 100).toFixed(2).replace('.', ',')} €/${label}`;
}

function formatMeasure(quantity: number | null, unit: ProductUnit | null) {
  if (quantity === null || quantity === undefined || !unit) return null;
  const quantityLabel = Number.isInteger(quantity) ? String(quantity) : String(quantity).replace('.', ',');
  return `${quantityLabel} ${unit}`;
}

function formatSecondaryMeta(latest: PriceEntry | undefined, storeName: string | undefined) {
  if (!latest) return 'Todavía no hay tienda ni fecha registradas.';
  const dateLabel = new Date(latest.purchased_at).toLocaleDateString('es-ES');
  return `${storeName ?? 'Tienda'} · ${dateLabel}`;
}

function formatLatestPriceLabel(latest: PriceEntry | undefined) {
  if (!latest) return 'Sin precio todavía';
  return (latest.price_cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function formatLatestMeasureLabel(product: Product, latest: PriceEntry | undefined) {
  const measureQuantity = latest?.quantity ?? product.quantity ?? null;
  const measureUnit = latest?.unit ?? product.unit ?? null;
  return formatMeasure(measureQuantity, measureUnit);
}

export default function ProductsScreen() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, loading, error, deleteProduct, refresh: productsRefresh } = useProducts(activeHouseholdId);
  const { stores, refresh: storesRefresh } = useStores(activeHouseholdId);
  const { latestByProductId, insightsByProductId, refresh: pricesRefresh } = usePrices(activeHouseholdId);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuProductId, setOpenMenuProductId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void productsRefresh();
      void storesRefresh();
      void pricesRefresh();
    }, [pricesRefresh, productsRefresh, storesRefresh])
  );

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((store) => {
      map[store.id] = store.name;
    });
    return map;
  }, [stores]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const source = [...products].sort((left, right) => left.name.localeCompare(right.name));

    if (!normalizedQuery) {
      return source;
    }

    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

    return source.filter((product) => {
      const normalizedName = product.name.trim().toLowerCase();
      return queryTerms.every((term) => normalizedName.includes(term));
    });
  }, [products, searchQuery]);

  const catalogItems = useMemo<CatalogProductItem[]>(() => {
    return filteredProducts.map((product) => {
      const latest = latestByProductId[product.id];
      const measureQuantity = latest?.quantity ?? product.quantity ?? null;
      const measureUnit = latest?.unit ?? product.unit ?? null;

      return {
        id: product.id,
        name: product.name,
        categoryLabel: product.category?.trim() ? product.category.trim() : null,
        latestPriceLabel: formatLatestPriceLabel(latest),
        latestMeasureLabel: formatLatestMeasureLabel(product, latest),
        unitPriceLabel: latest ? formatUnitPrice(latest.price_cents, measureQuantity, measureUnit) : null,
        secondaryMetaLabel: latest ? formatSecondaryMeta(latest, storeNameById[latest.store_id]) : 'Todavía no hay tienda ni fecha registradas.',
        visual: getCategoryVisual(product.category),
        hasPrice: Boolean(latest),
      };
    });
  }, [filteredProducts, latestByProductId, storeNameById]);

  const handleCreateProduct = () => {
    setOpenMenuProductId(null);
    router.push('/modals/product-editor');
  };

  const handleGoToHousehold = () => {
    router.push('/(tabs)/household');
  };

  const closeMenu = () => setOpenMenuProductId(null);

  const handleToggleProductMenu = (productId: string) => {
    setOpenMenuProductId((current) => (current === productId ? null : productId));
  };

  const handleDelete = async (id: string) => {
    closeMenu();
    const hasRegisteredPrices = Boolean(insightsByProductId[id]?.latest);

    const confirmDelete = () => {
      Alert.alert('Eliminar producto', 'Este borrado será permanente. No podrás recuperarlo después.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(id);
            } catch (err) {
              Alert.alert('Error al borrar', (err as Error).message);
            }
          },
        },
      ]);
    };

    if (hasRegisteredPrices) {
      Alert.alert(
        'Tiene precios registrados',
        'Este producto tiene precios registrados. Si continúas, se borrará el producto y todos sus precios de forma permanente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', style: 'destructive', onPress: confirmDelete },
        ]
      );
      return;
    }

    confirmDelete();
  };

  if (!activeHouseholdId) {
    return (
      <Screen>
        <View style={styles.center}>
          <EmptyState
            title="Selecciona un hogar"
            subtitle="Necesitas un hogar activo para gestionar los productos."
            actionLabel="Ir a hogares"
            onAction={handleGoToHousehold}
          />
        </View>
      </Screen>
    );
  }

  const hasProducts = products.length > 0;

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>
        <ProductsHeader loading={loading && hasProducts} />

        <View style={styles.contentStack}>
          {openMenuProductId ? <Pressable style={styles.menuScrim} onPress={closeMenu} /> : null}

          {hasProducts ? (
            <>
              <View style={styles.topActionsStack}>
                <ProductsSearchBlock value={searchQuery} onChangeText={setSearchQuery} onClear={() => setSearchQuery('')} />
                <CreateProductButtonBlock onPress={handleCreateProduct} />
              </View>

              <View style={styles.catalogSection}>
                <View style={styles.catalogHeader}>
                  <Text style={styles.catalogTitle}>Catálogo</Text>

                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{catalogItems.length}</Text>
                  </View>
                </View>

                {error ? (
                  <View style={styles.errorCard}>
                    <View style={styles.errorRail} />
                    <View style={styles.errorContent}>
                      <Text style={styles.errorText}>{error}</Text>
                      <Pressable accessibilityRole="button" onPress={() => void productsRefresh()} style={({ pressed }) => [styles.errorButton, pressed && styles.errorButtonPressed]}>
                        <Text style={styles.errorButtonText}>Reintentar</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {catalogItems.length > 0 ? (
                  <View style={styles.cardsList}>
                    {catalogItems.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        menuOpen={openMenuProductId === item.id}
                        onPress={() => {
                          closeMenu();
                          router.push({ pathname: '/modals/product-prices', params: { productId: item.id } });
                        }}
                        onToggleMenu={() => handleToggleProductMenu(item.id)}
                        onViewProduct={() => {
                          closeMenu();
                          router.push({ pathname: '/modals/product-prices', params: { productId: item.id } });
                        }}
                        onAddPrice={() => {
                          closeMenu();
                          router.push({ pathname: '/modals/price-editor', params: { productId: item.id, returnTo: '/(tabs)/products' } });
                        }}
                        onEditProduct={() => {
                          closeMenu();
                          router.push({ pathname: '/modals/product-editor', params: { productId: item.id } });
                        }}
                        onDeleteProduct={() => void handleDelete(item.id)}
                      />
                    ))}
                  </View>
                ) : !loading ? (
                  <View style={styles.emptyWrap}>
                    <EmptyState
                      title="No hemos encontrado productos"
                      subtitle="Prueba con otro nombre o limpia la búsqueda para ver todo el catálogo."
                    />
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View style={styles.emptyStateCard}>
              <View style={styles.topActionsStack}>
                <ProductsSearchBlock value={searchQuery} onChangeText={setSearchQuery} onClear={() => setSearchQuery('')} />
                <CreateProductButtonBlock onPress={handleCreateProduct} />
              </View>
              <EmptyState
                title="No hay productos todavía"
                subtitle="Crea tu primer producto para empezar a organizar tu catálogo."
                actionLabel="Nuevo producto"
                onAction={handleCreateProduct}
              />
            </View>
          )}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentStack: {
    position: 'relative',
    marginTop: -18,
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 14,
  },
  topActionsStack: {
    gap: 10,
  },
  menuScrim: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  catalogSection: {
    gap: 12,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 2,
  },
  catalogTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  countBadge: {
    marginLeft: 'auto',
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4ED',
  },
  countText: {
    color: tokens.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
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
  errorContent: {
    flex: 1,
    gap: 10,
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  errorButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  errorButtonPressed: {
    opacity: 0.92,
  },
  errorButtonText: {
    color: '#9A3412',
    fontSize: 13,
    fontWeight: '700',
  },
  cardsList: {
    gap: 10,
  },
  emptyWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  emptyStateCard: {
    minHeight: 320,
    gap: 14,
  },
});
