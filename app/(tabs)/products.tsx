import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { EmptyState } from '../../src/components/EmptyState';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { PriceEntry } from '../../src/domain/prices';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useProducts } from '../../src/hooks/useProducts';
import { useStores } from '../../src/hooks/useStores';
import { usePrices } from '../../src/hooks/usePrices';
import { getCategoryVisual } from '../../src/theme/visuals';
import { tokens } from '../../src/theme/tokens';

type ProductUnit = 'g' | 'kg' | 'ml' | 'l' | 'u';

function buildProductSummary(product: {
  brand: string | null;
  quantity: number | null;
  unit: ProductUnit | null;
  category: string | null;
}) {
  const parts: string[] = [];

  if (product.brand?.trim()) parts.push(product.brand.trim());

  if (product.quantity !== null) {
    const quantityLabel = Number.isInteger(product.quantity)
      ? String(product.quantity)
      : String(product.quantity);
    parts.push(product.unit ? quantityLabel + ' ' + product.unit : quantityLabel);
  }

  if (product.category?.trim()) parts.push(product.category.trim());

  return parts.join(' · ');
}

export default function ProductsScreen() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, loading, error, deleteProduct, refresh: productsRefresh } = useProducts(activeHouseholdId);
  const { stores, refresh: storesRefresh } = useStores(activeHouseholdId);
  const { latestByProductId, refresh: pricesRefresh } = usePrices(activeHouseholdId);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      void productsRefresh();
      void storesRefresh();
      void pricesRefresh();
    }, [productsRefresh, storesRefresh, pricesRefresh])
  );

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((s) => {
      map[s.id] = s.name;
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

  const renderLatestPrice = (productId: string) => {
    const latest = (latestByProductId as Record<string, PriceEntry>)[productId];
    if (!latest) return 'Sin precios aún';
    const amount = (latest.price_cents / 100).toFixed(2);
    const storeName = storeNameById[latest.store_id] ?? 'Tienda';
    const dateLabel = new Date(latest.purchased_at).toLocaleDateString();
    return 'Último precio: ' + amount + ' € en ' + storeName + ' · ' + dateLabel;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
    } catch (err) {
      Alert.alert('Error al borrar', (err as Error).message);
    }
  };

  const handleCreateProduct = () => {
    router.push('/modals/product-editor');
  };

  const handleGoToHousehold = () => {
    router.push('/(tabs)/household');
  };

  const hasProducts = products.length > 0;

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

  const header = (
    <View>
      <View style={styles.heroHeader}>
        <View style={styles.pageHeader}>
          <Text style={styles.heroEyebrow}>LISTO</Text>
          <Text style={styles.pageTitle}>Productos</Text>
          <Text style={styles.pageSubtitle}>
            Crea, organiza y consulta tus productos
          </Text>
          {loading && hasProducts ? <Text style={styles.loadingText}>Actualizando productos…</Text> : null}
        </View>

        <View style={styles.heroOrbPrimary} />
        <View style={styles.heroOrbSecondary} />
      </View>

      {hasProducts ? (
        <View style={styles.contentStack}>
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <View>
                <Text style={styles.inputCardTitle}>Catálogo</Text>
                <Text style={styles.inputCardSubtitle}>Busca, crea y gestiona tus productos.</Text>
              </View>
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <Text style={styles.searchIcon}>⌕</Text>
                <TextInput
                  placeholder="Buscar producto..."
                  placeholderTextColor="#98A2B3"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={handleCreateProduct}
                style={({ pressed }) => [styles.filterPill, pressed && styles.filterPillPressed]}
              >
                <Text style={styles.filterIcon}>＋</Text>
                <Text style={styles.filterLabel}>Nuevo</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.counterRow}>
              <View style={styles.totalBlock}>
                <Text style={styles.totalIcon}>≡</Text>
                <Text style={styles.totalText}>{filteredProducts.length} productos en total</Text>
              </View>
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <View style={styles.errorRail} />
                <View style={styles.errorContent}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void productsRefresh()}
                    style={({ pressed }) => [styles.errorButton, pressed && styles.errorButtonPressed]}
                  >
                    <Text style={styles.errorButtonText}>Reintentar</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen scrollable>
      <SwipeTabs style={styles.page}>
        {header}

        <View style={styles.contentStack}>
          {hasProducts ? (
            <View style={styles.sectionCard}>
              {filteredProducts.map((item, index) => {
                const summary = buildProductSummary(item);
                const latestPrice = renderLatestPrice(item.id);
                const categoryVisual = getCategoryVisual(item.category);

                return (
                  <View key={item.id}>
                    <Pressable
                      style={({ pressed }) => [styles.productRow, pressed && styles.productRowPressed]}
                      onPress={() => router.push({ pathname: '/modals/product-editor', params: { productId: item.id } })}
                    >
                      <View style={styles.productRowMain}>
                        <View style={[styles.productAvatar, { backgroundColor: categoryVisual.backgroundColor }]}>
                          <Ionicons name={categoryVisual.icon} size={18} color={categoryVisual.color} />
                        </View>

                        <View style={styles.productMainText}>
                          <Text style={styles.productName}>{item.name}</Text>
                          {summary ? <Text style={styles.productSummary}>{summary}</Text> : null}
                          <Text style={styles.latestPrice}>{latestPrice}</Text>
                        </View>

                        <View style={styles.productAside}>
                          {item.category?.trim() ? (
                            <View style={[styles.categoryChip, { backgroundColor: categoryVisual.backgroundColor }]}>
                              <Text style={[styles.categoryChipText, { color: categoryVisual.color }]} numberOfLines={1}>
                                {item.category.trim()}
                              </Text>
                            </View>
                          ) : null}

                          <Text style={styles.chevron}>›</Text>
                        </View>
                      </View>

                      <View style={styles.rowActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() =>
                            router.push({
                              pathname: '/modals/price-editor',
                              params: { productId: item.id, returnTo: '/(tabs)/products' },
                            })
                          }
                          style={({ pressed }) => [styles.inlineAction, styles.inlineActionPrimary, pressed && styles.inlineActionPressed]}
                        >
                          <Text style={styles.inlineActionPrimaryText}>Añadir precio</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => router.push({ pathname: '/modals/product-editor', params: { productId: item.id } })}
                          style={({ pressed }) => [styles.inlineAction, pressed && styles.inlineActionPressed]}
                        >
                          <Text style={styles.inlineActionText}>Editar</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleDelete(item.id)}
                          style={({ pressed }) => [styles.inlineAction, styles.inlineActionDanger, pressed && styles.inlineActionPressed]}
                        >
                          <Text style={styles.inlineActionDangerText}>Borrar</Text>
                        </Pressable>
                      </View>
                    </Pressable>

                    {index < filteredProducts.length - 1 ? <View style={styles.itemDivider} /> : null}
                  </View>
                );
              })}

              {!loading && filteredProducts.length === 0 ? (
                <View style={styles.emptyStateShell}>
                  <View style={styles.emptyWrap}>
                    <EmptyState
                      title="No hay productos todavía"
                      subtitle="Crea un producto para empezar a usar tu catálogo."
                      actionLabel="Crear producto"
                      onAction={handleCreateProduct}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <EmptyState
                title="No hay productos todavía"
                subtitle="Crea tu primer producto para empezar a organizar tu catálogo."
                actionLabel="Crear producto"
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
  heroHeader: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 42,
  },
  pageHeader: {
    gap: 4,
    zIndex: 2,
    maxWidth: 560,
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
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
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
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchField: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIcon: {
    color: '#667085',
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    minHeight: 50,
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterPill: {
    minWidth: 86,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFDFC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterPillPressed: {
    opacity: 0.9,
  },
  filterIcon: {
    color: tokens.colors.primaryDark,
    fontSize: 14,
  },
  filterLabel: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 8,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    overflow: 'hidden',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
  },
  totalBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  totalIcon: {
    color: tokens.colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  totalText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 8,
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
  emptyWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateShell: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyStateCard: {
    minHeight: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  emptyCreateButton: {
    minWidth: 180,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primaryDark,
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  emptyCreateButtonPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  emptyCreateButtonText: {
    color: tokens.colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  productRow: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  productRowPressed: {
    backgroundColor: '#F8FAFC',
  },
  productRowMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  productAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  productMainText: {
    flex: 1,
    gap: 3,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  productSummary: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  productAside: {
    alignItems: 'flex-end',
    gap: 10,
    marginLeft: 8,
    maxWidth: 110,
  },
  categoryChip: {
    maxWidth: 110,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 24,
    marginTop: -2,
  },
  latestPrice: {
    fontSize: 13,
    lineHeight: 18,
    color: '#374151',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginLeft: 54,
    flexWrap: 'wrap',
  },
  inlineAction: {
    height: 34,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineActionPressed: {
    opacity: 0.88,
  },
  inlineActionPrimary: {
    backgroundColor: tokens.colors.primarySoft,
    borderColor: '#CFEFD9',
  },
  inlineActionText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  inlineActionPrimaryText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  inlineActionDanger: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  inlineActionDangerText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '700',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: 70,
    marginRight: 16,
  },
});
