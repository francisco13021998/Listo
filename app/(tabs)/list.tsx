import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { EmptyState } from '../../src/components/EmptyState';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { AddItemBlock } from '../../src/components/list/AddItemBlock';
import { BoughtSection } from '../../src/components/list/BoughtSection';
import { PendingSection } from '../../src/components/list/PendingSection';
import { ShoppingModeControl } from '../../src/components/list/ShoppingModeControl';
import { ShoppingListItem } from '../../src/domain/shoppingList';
import { PriceEntry, PriceInsight } from '../../src/domain/prices';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { usePrices } from '../../src/hooks/usePrices';
import { useProducts } from '../../src/hooks/useProducts';
import { useSession } from '../../src/hooks/useSession';
import { useShoppingList } from '../../src/hooks/useShoppingList';
import { useShoppingStorePreference } from '../../src/hooks/useShoppingStorePreference';
import { useStores } from '../../src/hooks/useStores';
import { hapticError, hapticMedium, hapticSuccess, hapticTap } from '../../src/lib/haptics';
import { showGenericErrorAlert } from '../../src/lib/uiError';
import { useTabBarHeight } from '../../src/state/tabBarHeight.store';
import { tokens } from '../../src/theme/tokens';

type ComparisonFamily = 'weight' | 'volume' | 'unit' | 'unknown';

type SearchSuggestion = {
  id: string;
  name: string;
  comparisonFamily: ComparisonFamily;
  latestPrice: number | null;
  latestStoreName: string | null;
  cheapestPrice: number | null;
  hasCheaperAlternative: boolean;
  rankUnitPrice: number | null;
  comparisonLabel: string | null;
  isCheapestMatch: boolean;
};

type ShoppingItemViewModel = ShoppingListItem & {
  storeSortLabel: string;
  storeSortWeight: number;
};

type PendingGroup = {
  key: string;
  label: string;
  items: ShoppingItemViewModel[];
  isUnpriced: boolean;
  sortWeight: number;
};

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

function getComparisonFamily(unit: string | null) {
  if (!unit) return 'unknown';
  if (unit === 'g' || unit === 'kg') return 'weight';
  if (unit === 'ml' || unit === 'l') return 'volume';
  if (unit === 'u') return 'unit';
  return 'unknown';
}

function getReferenceUnit(unit: string | null) {
  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'l') return 'l';
  if (unit === 'u') return 'u';
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

function getEffectiveMeasure(
  price: { quantity: number | null; unit: string | null } | null,
  fallback: { quantity: number | null; unit: string | null }
) {
  return {
    quantity: price?.quantity ?? fallback.quantity,
    unit: price?.unit ?? fallback.unit,
  };
}

function formatMeasure(quantity: number | null, unit: string | null) {
  if (quantity === null || quantity === undefined || !unit) return null;
  const quantityLabel = Number.isInteger(quantity) ? String(quantity) : String(quantity).replace('.', ',');
  return `${quantityLabel} ${unit}`;
}

function formatUnitPrice(cents: number, quantity: number | null, unit: string | null) {
  const referenceUnit = getReferenceUnit(unit);
  const normalizedQuantity = getQuantityInReferenceUnit(quantity, unit);

  if (!referenceUnit || !normalizedQuantity) return null;

  const pricePerReferenceUnit = cents / normalizedQuantity;
  return `${(pricePerReferenceUnit / 100).toFixed(2).replace('.', ',')} €/${referenceUnit}`;
}

export default function ListScreen() {
  const router = useRouter();
  const { user } = useSession();
  const tabBarHeight = useTabBarHeight();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, loading: productsLoading, refresh: refreshProducts } = useProducts(activeHouseholdId);
  const { stores, loading: storesLoading, refresh: refreshStores } = useStores(activeHouseholdId);
  const { latestByProductId, insightsByProductId, loading: pricesLoading, refresh: refreshPrices } = usePrices(activeHouseholdId);
  const {
    items,
    loading: shoppingLoading,
    error,
    addTextItem,
    addProductItem,
    toggleItem,
    deleteItem,
    clearBoughtItems,
    refresh: refreshShopping,
  } = useShoppingList(activeHouseholdId);

  const priceLatestMap = latestByProductId as Record<string, PriceEntry>;
  const priceInsightsMap = insightsByProductId as Record<string, PriceInsight>;
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const isAnyListDataLoading = productsLoading || storesLoading || pricesLoading || shoppingLoading;
  const isBootstrapping = Boolean(activeHouseholdId) && !hasInitialLoadCompleted && isAnyListDataLoading;

  const inputRef = useRef<TextInput>(null);
  const selectingSuggestionRef = useRef(false);
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownTranslateY = useRef(new Animated.Value(8)).current;
  const rowAnimationsRef = useRef<Record<string, { checked: Animated.Value; mount: Animated.Value }>>({});

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuItemId, setOpenMenuItemId] = useState<string | null>(null);
  const [openMenuAnchor, setOpenMenuAnchor] = useState<{ x: number; y: number } | null>(null);
  const listBottomInset = Math.max(24, Math.round(tabBarHeight * 0.45));

  useEffect(() => {
    setHasInitialLoadCompleted(false);
  }, [activeHouseholdId]);

  useEffect(() => {
    if (!activeHouseholdId) {
      return;
    }

    if (!isAnyListDataLoading) {
      setHasInitialLoadCompleted(true);
    }
  }, [activeHouseholdId, isAnyListDataLoading]);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshProducts();
      void refreshPrices();
      void refreshStores();
      void refreshShopping();
    }, [refreshPrices, refreshProducts, refreshShopping, refreshStores])
  );

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((store) => {
      map[store.id] = store.name;
    });
    return map;
  }, [stores]);

  const sortedStores = useMemo(
    () => [...stores].sort((left, right) => left.name.localeCompare(right.name)),
    [stores]
  );
  const hasStores = sortedStores.length > 0;

  const { selectedStoreId: selectedShoppingStoreId, setSelectedStoreId: setSelectedShoppingStoreId, isEnabled: isShoppingModeActive, setIsEnabled: setIsShoppingModeActive } =
    useShoppingStorePreference({
    userId: user?.id ?? null,
    householdId: activeHouseholdId,
    availableStoreIds: sortedStores.map((store) => store.id),
    });

  const productInfoById = useMemo(() => {
    const map: Record<string, { quantity: number | null; unit: string | null }> = {};
    products.forEach((product) => {
      map[product.id] = { quantity: product.quantity, unit: product.unit };
    });
    return map;
  }, [products]);

  const cheapestPriceSummaryByProductId = useMemo(() => {
    const map: Record<string, { priceLabel: string | null; unitPriceLabel: string | null }> = {};

    Object.entries(priceInsightsMap).forEach(([productId, insight]) => {
      const cheapest = insight?.cheapest ?? insight?.latest ?? null;
      if (!cheapest) {
        map[productId] = { priceLabel: null, unitPriceLabel: null };
        return;
      }

      const productInfo = productInfoById[productId] ?? { quantity: null, unit: null };
      const effectiveMeasure = getEffectiveMeasure(cheapest, productInfo);

      map[productId] = {
        priceLabel: formatPrice(cheapest.price_cents),
        unitPriceLabel: formatUnitPrice(cheapest.price_cents, effectiveMeasure.quantity, effectiveMeasure.unit),
      };
    });

    return map;
  }, [priceInsightsMap, productInfoById]);

  const sortedShoppingItems = useMemo(() => {
    const getStoreMeta = (item: ShoppingListItem) => {
      if (!item.product_id) {
        return {
          storeSortLabel: 'Productos sin precio',
          storeSortWeight: 2,
        };
      }

      const insight = priceInsightsMap[item.product_id];
      const cheapest = insight?.cheapest ?? priceLatestMap[item.product_id] ?? null;
      const cheapestStoreId = cheapest?.store_id ?? null;
      const cheapestStoreName = cheapestStoreId ? storeNameById[cheapestStoreId] ?? 'Tienda' : null;

      if (!cheapestStoreName) {
        return {
          storeSortLabel: 'Productos sin precio',
          storeSortWeight: 2,
        };
      }

      return {
        storeSortLabel: cheapestStoreName,
        storeSortWeight: 0,
      };
    };

    return [...items]
      .map<ShoppingItemViewModel>((item) => ({
        ...item,
        ...getStoreMeta(item),
      }))
      .sort((left, right) => {
        if (left.is_checked !== right.is_checked) {
          return left.is_checked ? 1 : -1;
        }

        if (left.storeSortWeight !== right.storeSortWeight) {
          return left.storeSortWeight - right.storeSortWeight;
        }

        if (left.storeSortLabel !== right.storeSortLabel) {
          return left.storeSortLabel.localeCompare(right.storeSortLabel);
        }

        return left.text.localeCompare(right.text);
      });
  }, [items, priceInsightsMap, priceLatestMap, storeNameById]);

  const pendingItems = useMemo(() => sortedShoppingItems.filter((item) => !item.is_checked), [sortedShoppingItems]);
  const completedItems = useMemo(() => sortedShoppingItems.filter((item) => item.is_checked), [sortedShoppingItems]);

  const hasTextDuplicate = (value: string) => {
    return items.some((item) => !item.product_id && item.text.trim() === value.trim());
  };

  const hasProductDuplicate = (productId: string) => {
    return items.some((item) => item.product_id === productId);
  };

  const confirmDuplicateAddition = (message: string) => {
    return new Promise<boolean>((resolve) => {
      Alert.alert('Producto ya añadido', message, [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Añadir igualmente', onPress: () => resolve(true) },
      ], {
        cancelable: true,
        onDismiss: () => resolve(false),
      });
    });
  };

  const pendingGroups = useMemo<PendingGroup[]>(() => {
    const groups = new Map<string, PendingGroup>();

    pendingItems.forEach((item) => {
      const isUnpriced = item.storeSortWeight === 2;
      const key = isUnpriced ? 'unpriced' : `${item.storeSortWeight}:${item.storeSortLabel}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: isUnpriced ? 'Productos sin precio' : item.storeSortLabel,
          items: [item],
          isUnpriced,
          sortWeight: item.storeSortWeight,
        });
        return;
      }

      groups.get(key)?.items.push(item);
    });

    return [...groups.values()].sort((left, right) => {
      if (left.sortWeight !== right.sortWeight) {
        return left.sortWeight - right.sortWeight;
      }

      return left.label.localeCompare(right.label);
    });
  }, [pendingItems]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [] as SearchSuggestion[];
    }

    const matchedProducts = products
      .filter((product) => product.name.toLowerCase().includes(normalizedQuery))
      .map<SearchSuggestion>((product) => {
        const insight = priceInsightsMap[product.id];
        const latestEntry = insight?.latest ?? priceLatestMap[product.id] ?? null;
        const cheapestEntry = insight?.cheapest ?? latestEntry;
        const cheapestPrice = cheapestEntry ? cheapestEntry.price_cents : null;
        const latestMeasure = getEffectiveMeasure(latestEntry, { quantity: product.quantity, unit: product.unit });
        const cheapestMeasure = getEffectiveMeasure(cheapestEntry, { quantity: product.quantity, unit: product.unit });
        const latestReferenceQuantity = getQuantityInReferenceUnit(latestMeasure.quantity, latestMeasure.unit);
        const cheapestReferenceQuantity = getQuantityInReferenceUnit(cheapestMeasure.quantity, cheapestMeasure.unit);
        const latestUnitPrice = latestEntry && latestReferenceQuantity ? latestEntry.price_cents / latestReferenceQuantity : null;
        const cheapestUnitPrice = cheapestEntry && cheapestReferenceQuantity ? cheapestEntry.price_cents / cheapestReferenceQuantity : null;
        const comparisonFamily = getComparisonFamily(latestMeasure.unit ?? cheapestMeasure.unit ?? product.unit);
        const comparisonLabel = cheapestEntry
          ? formatUnitPrice(cheapestEntry.price_cents, cheapestMeasure.quantity, cheapestMeasure.unit)
          : null;
        const hasCheaperAlternative = Boolean(
          insight?.latest && insight?.cheapest && insight.cheapest.price_cents < insight.latest.price_cents
        );

        return {
          id: product.id,
          name: product.name,
          comparisonFamily,
          latestPrice: cheapestPrice,
          latestStoreName: cheapestEntry ? storeNameById[cheapestEntry.store_id] ?? 'Tienda' : null,
          cheapestPrice,
          hasCheaperAlternative,
          rankUnitPrice: cheapestUnitPrice ?? latestUnitPrice,
          comparisonLabel,
          isCheapestMatch: false,
        };
      });

    const familyOrder: Record<ComparisonFamily, number> = {
      weight: 0,
      volume: 1,
      unit: 2,
      unknown: 3,
    };

    const pricedSuggestions = matchedProducts
      .filter((item) => item.rankUnitPrice !== null)
      .sort((left, right) => {
        if (familyOrder[left.comparisonFamily] !== familyOrder[right.comparisonFamily]) {
          return familyOrder[left.comparisonFamily] - familyOrder[right.comparisonFamily];
        }

        return (left.rankUnitPrice ?? Number.POSITIVE_INFINITY) - (right.rankUnitPrice ?? Number.POSITIVE_INFINITY);
      });

    const unpricedSuggestions = matchedProducts
      .filter((item) => item.rankUnitPrice === null)
      .sort((left, right) => left.name.localeCompare(right.name));

    const lowestPriceByFamily: Partial<Record<ComparisonFamily, number>> = {};
    for (const item of pricedSuggestions) {
      if (item.rankUnitPrice === null) continue;
      if (lowestPriceByFamily[item.comparisonFamily] === undefined) {
        lowestPriceByFamily[item.comparisonFamily] = item.rankUnitPrice;
      }
    }

    return [...pricedSuggestions, ...unpricedSuggestions].map((item) => ({
      ...item,
      isCheapestMatch:
        item.rankUnitPrice !== null && lowestPriceByFamily[item.comparisonFamily] !== undefined
          ? item.rankUnitPrice === lowestPriceByFamily[item.comparisonFamily]
          : false,
    }));
  }, [priceInsightsMap, priceLatestMap, products, query]);

  const dropdownVisible = showDropdown && query.trim().length > 0;

  useEffect(() => {
    if (dropdownVisible) {
      setShouldRenderDropdown(true);
      Animated.parallel([
        Animated.timing(dropdownOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(dropdownTranslateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(dropdownOpacity, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(dropdownTranslateY, { toValue: 8, duration: 110, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRenderDropdown(false);
      }
    });
  }, [dropdownOpacity, dropdownTranslateY, dropdownVisible]);

  useEffect(() => {
    sortedShoppingItems.forEach((item) => {
      if (!rowAnimationsRef.current[item.id]) {
        rowAnimationsRef.current[item.id] = {
          checked: new Animated.Value(item.is_checked ? 1 : 0),
          mount: new Animated.Value(0),
        };

        Animated.timing(rowAnimationsRef.current[item.id].mount, {
          toValue: 1,
          duration: 180,
          useNativeDriver: false,
        }).start();
      }

      Animated.spring(rowAnimationsRef.current[item.id].checked, {
        toValue: item.is_checked ? 1 : 0,
        friction: 8,
        tension: 90,
        useNativeDriver: false,
      }).start();
    });
  }, [sortedShoppingItems]);

  const runListLayoutAnimation = () => {
    LayoutAnimation.configureNext({
      duration: 180,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const formatProductSummary = (product: { brand: string | null; quantity: number | null; unit: string | null }) => {
    const parts: string[] = [];
    if (product.brand?.trim()) {
      parts.push(product.brand.trim());
    }
    if (product.quantity !== null && product.quantity !== undefined) {
      parts.push(product.unit ? `${product.quantity}${product.unit}` : `${product.quantity}`);
    }
    return parts.join(' · ');
  };

  const closeSearchSurface = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setShowDropdown(false);
    setOpenMenuItemId(null);
  };

  const resetSearchAfterAction = ({ keepKeyboardOpen }: { keepKeyboardOpen: boolean }) => {
    selectingSuggestionRef.current = false;
    setQuery('');
    setShowDropdown(false);

    if (keepKeyboardOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return;
    }

    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  const handleAddText = async () => {
    if (!activeHouseholdId || isSubmitting) return;

    const value = query.trim();
    if (!value) {
      selectingSuggestionRef.current = false;
      void hapticError();
      Alert.alert('Texto requerido', 'Escribe algo para añadirlo a la lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasTextDuplicate(value)) {
        const shouldAddDuplicate = await confirmDuplicateAddition(`Ya has añadido "${value}" a la lista. ¿Quieres añadirlo igualmente?`);
        if (!shouldAddDuplicate) {
          selectingSuggestionRef.current = false;
          return;
        }
      }

      runListLayoutAnimation();
      await addTextItem(value);
      void hapticSuccess();
      resetSearchAfterAction({ keepKeyboardOpen: true });
    } catch (err) {
      selectingSuggestionRef.current = false;
      void hapticError();
      showGenericErrorAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = async (productId: string, name: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (hasProductDuplicate(productId)) {
        const shouldAddDuplicate = await confirmDuplicateAddition(`Ya has añadido "${name}" a la lista. ¿Quieres añadirlo igualmente?`);
        if (!shouldAddDuplicate) {
          selectingSuggestionRef.current = false;
          return;
        }
      }

      runListLayoutAnimation();
      await addProductItem(productId, name);
      void hapticSuccess();
      resetSearchAfterAction({ keepKeyboardOpen: false });
    } catch (err) {
      selectingSuggestionRef.current = false;
      void hapticError();
      showGenericErrorAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = (item: ShoppingListItem) => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);

    if (item.product_id) {
      router.push({ pathname: '/modals/product-editor', params: { productId: item.product_id } });
      return;
    }

    router.push({
      pathname: '/modals/list-item-editor',
      params: {
        itemId: item.id,
        currentText: item.text,
      },
    });
  };

  const handleToggle = async (item: ShoppingListItem) => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);

    try {
      runListLayoutAnimation();
      await toggleItem(item.id, !item.is_checked);
      void hapticTap();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al actualizar', (err as Error).message);
    }
  };

  const handleClearBoughtItems = () => {
    if (!activeHouseholdId || completedItems.length === 0) {
      return;
    }

    Alert.alert('Vaciar comprados', 'Se eliminarán todos los elementos de la lista de comprados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Vaciar',
        style: 'destructive',
        onPress: async () => {
          try {
            runListLayoutAnimation();
            await clearBoughtItems();
            void hapticMedium();
            await refreshShopping();
          } catch (err) {
            void hapticError();
            Alert.alert('Error al borrar', (err as Error).message);
          }
        },
      },
    ]);
  };

  const handleDelete = (item: ShoppingListItem) => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);
    Alert.alert('Eliminar de la lista', `Se quitará "${item.text}" de la lista.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            runListLayoutAnimation();
            await deleteItem(item.id);
            void hapticMedium();
          } catch (err) {
            void hapticError();
            Alert.alert('Error al borrar', (err as Error).message);
          }
        },
      },
    ]);
  };

  const handleViewProduct = (item: ShoppingListItem) => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);
    if (!item.product_id) return;
    router.push({ pathname: '/modals/product-prices', params: { productId: item.product_id } });
  };

  const handleManagePrice = (item: ShoppingListItem) => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);
    if (!item.product_id) return;
    router.push({
      pathname: '/modals/price-editor',
      params: {
        productId: item.product_id,
        sourceShoppingItemId: item.id,
        sourceShoppingItemChecked: item.is_checked ? 'true' : 'false',
        shoppingModeActive: isShoppingModeActive ? 'true' : 'false',
        returnTo: '/(tabs)/list',
        selectedStoreId: isShoppingModeActive && selectedShoppingStoreId ? selectedShoppingStoreId : '',
      },
    });
  };

  const handleRegisterProduct = (item: ShoppingListItem) => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);
    router.push({
      pathname: '/modals/product-editor',
      params: {
        name: item.text,
        sourceShoppingItemId: item.id,
        sourceShoppingItemChecked: item.is_checked ? 'true' : 'false',
        shoppingModeActive: isShoppingModeActive ? 'true' : 'false',
        selectedStoreId: isShoppingModeActive && selectedShoppingStoreId ? selectedShoppingStoreId : '',
      },
    });
  };

  const getPriceSummary = (item: ShoppingListItem) => {
    if (!item.product_id) {
      return { priceLabel: null, unitPriceLabel: null };
    }

    return cheapestPriceSummaryByProductId[item.product_id] ?? { priceLabel: null, unitPriceLabel: null };
  };

  if (!activeHouseholdId) {
    return (
      <Screen>
        <View style={styles.center}>
          <EmptyState
            title="Selecciona un hogar"
            subtitle="Necesitas un hogar activo para gestionar la lista de la compra."
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
              <Text style={styles.heroTitle}>Lista</Text>
              <Text style={styles.heroSubtitle}>Organiza la compra y avanza sin perder el ritmo.</Text>
            </View>
            <View style={styles.heroOrbPrimary} />
            <View style={styles.heroOrbSecondary} />
          </View>

          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={tokens.colors.primaryDark} />
            <Text style={styles.loadingText}>Cargando la lista…</Text>
          </View>
        </SwipeTabs>
      </Screen>
    );
  }

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <TouchableWithoutFeedback onPress={closeSearchSurface} accessible={false}>
        <SwipeTabs style={styles.page}>
          <View style={styles.heroHeader}>
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>LISTO</Text>
              <Text style={styles.heroTitle}>Lista</Text>
              <Text style={styles.heroSubtitle}>Organiza la compra y avanza sin perder el ritmo.</Text>
            </View>
            <View style={styles.heroOrbPrimary} />
            <View style={styles.heroOrbSecondary} />
          </View>

          {hasStores ? (
            <View style={styles.shoppingModeSectionWithStores}>
              <ShoppingModeControl
                stores={sortedStores}
                enabled={isShoppingModeActive}
                selectedStoreId={selectedShoppingStoreId}
                onToggleEnabled={() => setIsShoppingModeActive(!isShoppingModeActive)}
                onSelectStore={setSelectedShoppingStoreId}
              />
            </View>
          ) : (
            <View style={styles.shoppingModeSection}>{null}</View>
          )}

          <View style={[styles.contentStack, hasStores && styles.contentStackWithStores, { paddingBottom: listBottomInset }]}>
            {error ? (
              <View style={styles.errorCard}>
                <View style={styles.errorRail} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <AddItemBlock
              query={query}
              loading={shoppingLoading}
              isSubmitting={isSubmitting}
              inputRef={inputRef}
              suggestions={filteredProducts}
              dropdownVisible={shouldRenderDropdown}
              dropdownOpacity={dropdownOpacity}
              dropdownTranslateY={dropdownTranslateY}
              onChangeQuery={(value) => {
                setQuery(value);
                setShowDropdown(value.trim().length > 0);
              }}
              onSubmitText={() => void handleAddText()}
              onSelectSuggestion={(productId, name) => void handleSelectProduct(productId, name)}
              onInputFocus={() => setShowDropdown(query.trim().length > 0)}
              onInputBlur={() => {
                if (!selectingSuggestionRef.current) {
                  Keyboard.dismiss();
                }
              }}
              onSuggestionPressIn={() => {
                selectingSuggestionRef.current = true;
              }}
              formatPrice={formatPrice}
            />

            <PendingSection
              groups={pendingGroups}
              totalCount={pendingItems.length}
              empty={pendingItems.length === 0}
              loading={shoppingLoading}
              menuOpenItemId={openMenuItemId}
              menuAnchor={openMenuAnchor}
              animationsByItemId={rowAnimationsRef.current}
              getPriceSummary={getPriceSummary}
              onToggle={(item) => void handleToggle(item)}
              onToggleMenu={(itemId, anchor) => {
                setOpenMenuItemId((current) => (current === itemId ? null : itemId));
                setOpenMenuAnchor(anchor);
              }}
              onCloseMenu={() => {
                setOpenMenuItemId(null);
                setOpenMenuAnchor(null);
              }}
              onEdit={handleEditItem}
              onViewProduct={handleViewProduct}
              onManagePrice={handleManagePrice}
              onRegisterProduct={handleRegisterProduct}
              onDelete={handleDelete}
            />

            <BoughtSection
              items={completedItems}
              empty={completedItems.length === 0}
              animationsByItemId={rowAnimationsRef.current}
              onToggle={(item) => void handleToggle(item)}
              onEdit={handleEditItem}
              onViewProduct={handleViewProduct}
              onManagePrice={handleManagePrice}
              onRegisterProduct={handleRegisterProduct}
              onDelete={handleDelete}
              onClearAll={handleClearBoughtItems}
            />
          </View>
        </SwipeTabs>
      </TouchableWithoutFeedback>
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
    gap: 10,
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
    paddingBottom: 36,
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
    paddingHorizontal: 18,
    paddingBottom: 0,
    gap: 8,
  },
  shoppingModeSection: {
    position: 'relative',
    zIndex: 30,
    elevation: 8,
    paddingHorizontal: 18,
    marginTop: 2,
    marginBottom: 10,
  },
  shoppingModeSectionWithStores: {
    position: 'relative',
    zIndex: 34,
    elevation: 10,
    paddingHorizontal: 18,
    marginTop: -10,
    marginBottom: 16,
  },
  contentStackWithStores: {
    marginTop: 0,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
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
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
});