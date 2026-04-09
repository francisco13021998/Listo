import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
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
import { useProducts } from '../../src/hooks/useProducts';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useShoppingList } from '../../src/hooks/useShoppingList';
import { usePrices } from '../../src/hooks/usePrices';
import { useStores } from '../../src/hooks/useStores';
import { ShoppingListItem } from '../../src/domain/shoppingList';
import { PriceEntry, PriceInsight } from '../../src/domain/prices';
import { hapticError, hapticMedium, hapticSuccess, hapticTap } from '../../src/lib/haptics';
import { getPendingVisual } from '../../src/theme/visuals';
import { tokens } from '../../src/theme/tokens';

interface ShoppingRowProps {
  item: ShoppingListItem;
  onToggle: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
  onRegisterPrice: (productId: string) => void;
  onRegisterProduct: (item: ShoppingListItem) => void;
  priceSummary?: {
    label: string;
    storeName: string;
    dateLabel: string;
    unitPriceLabel: string | null;
  } | null;
}

function AnimatedCard({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: object;
}) {
  const mountAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnimation, {
      toValue: 1,
      duration: 220,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, mountAnimation]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: mountAnimation,
          transform: [
            {
              translateY: mountAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function ScaleButton({
  children,
  onPress,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.timing(scale, {
      toValue,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      style={style}
    >
      {({ pressed }) => (
        <Animated.View style={[{ transform: [{ scale }] }, pressed && styles.scaleButtonPressed]}>{children}</Animated.View>
      )}
    </Pressable>
  );
}

function ShoppingRow({ item, onToggle, onDelete, onRegisterPrice, onRegisterProduct, priceSummary }: ShoppingRowProps) {
  const checkedAnimation = useRef(new Animated.Value(item.is_checked ? 1 : 0)).current;
  const mountAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnimation, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [mountAnimation]);

  useEffect(() => {
    Animated.spring(checkedAnimation, {
      toValue: item.is_checked ? 1 : 0,
      friction: 8,
      tension: 90,
      useNativeDriver: false,
    }).start();
  }, [checkedAnimation, item.is_checked]);

  const markerScale = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const checkOpacity = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const textOpacity = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.68],
  });

  const rowOpacity = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.78],
  });

  const markerBackgroundColor = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#E7F6ED'],
  });

  const markerBorderColor = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#BFC8D4', '#176B3A'],
  });

  const itemTextColor = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#111827', '#98A2B3'],
  });

  const rowTranslateY = mountAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.itemRow,
        {
          opacity: Animated.multiply(mountAnimation, rowOpacity),
          transform: [{ translateY: rowTranslateY }],
        },
      ]}
    >
      <Pressable
        onPress={() => onToggle(item)}
        style={({ pressed }) => [styles.itemMainAction, pressed && styles.itemPressed]}
      >
        <Animated.View
          style={[
            styles.itemMarker,
            {
              backgroundColor: markerBackgroundColor,
              borderColor: markerBorderColor,
              transform: [{ scale: markerScale }],
            },
          ]}
        >
          <Animated.Text style={[styles.itemMarkerText, { opacity: checkOpacity }]}>✓</Animated.Text>
        </Animated.View>

        <View style={styles.itemTextBlock}>
          <Animated.Text
            style={[
              styles.itemText,
              item.is_checked && styles.itemTextChecked,
              { opacity: textOpacity, color: itemTextColor },
            ]}
          >
            {item.text}
          </Animated.Text>
          {priceSummary ? (
            <View style={styles.itemPriceMetaGroup}>
              <Animated.Text style={styles.itemPriceMeta}>
                Mejor precio: {priceSummary.label} · {priceSummary.storeName} · {priceSummary.dateLabel}
              </Animated.Text>
              {priceSummary.unitPriceLabel ? (
                <Animated.Text style={styles.itemUnitPriceMeta}>Equivale a {priceSummary.unitPriceLabel}</Animated.Text>
              ) : null}
            </View>
          ) : item.product_id ? (
            <Animated.Text style={styles.itemPriceMetaMuted}>Sin precio registrado</Animated.Text>
          ) : null}
        </View>
      </Pressable>

      {item.product_id ? (
        <ScaleButton onPress={() => onRegisterPrice(item.product_id as string)} style={styles.priceAction}>
          <View style={styles.priceActionInner}>
            <Text style={styles.priceActionText}>€</Text>
          </View>
        </ScaleButton>
      ) : (
        <ScaleButton onPress={() => onRegisterProduct(item)} style={styles.productAction}>
          <View style={styles.productActionInner}>
            <Text style={styles.productActionText}>＋</Text>
          </View>
        </ScaleButton>
      )}

      <ScaleButton
        onPress={() => onDelete(item.id)}
        style={styles.deleteAction}
      >
        <View style={styles.deleteActionInner}>
          <Text style={styles.deleteActionText}>×</Text>
        </View>
      </ScaleButton>
    </Animated.View>
  );
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

type ComparisonFamily = 'weight' | 'volume' | 'unit' | 'unknown';

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

function formatUnitPrice(cents: number, quantity: number | null, unit: string | null) {
  const referenceUnit = getReferenceUnit(unit);
  const normalizedQuantity = getQuantityInReferenceUnit(quantity, unit);

  if (!referenceUnit || !normalizedQuantity) return null;

  const pricePerReferenceUnit = cents / normalizedQuantity;
  const unitLabel = referenceUnit === 'u' ? 'u' : referenceUnit;
  return `${(pricePerReferenceUnit / 100).toFixed(2).replace('.', ',')} €/${unitLabel}`;
}

function getComparisonFamilyLabel(family: ComparisonFamily) {
  if (family === 'weight') return 'por kg';
  if (family === 'volume') return 'por l';
  if (family === 'unit') return 'por unidad';
  return '';
}

type SearchSuggestion = {
  id: string;
  name: string;
  brand: string | null;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  comparisonFamily: ComparisonFamily;
  latestPrice: number | null;
  latestStoreName: string | null;
  cheapestPrice: number | null;
  cheapestStoreName: string | null;
  hasCheaperAlternative: boolean;
  rankUnitPrice: number | null;
  comparisonLabel: string | null;
  isCheapestMatch: boolean;
};

type ShoppingItemViewModel = ShoppingListItem & {
  cheapestStoreName: string | null;
  cheapestStoreId: string | null;
  cheapestPrice: number | null;
  storeSortLabel: string;
  storeSortWeight: number;
};

export default function ListScreen() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, refresh: productsRefresh } = useProducts(activeHouseholdId);
  const { stores, refresh: storesRefresh } = useStores(activeHouseholdId);
  const { latestByProductId, insightsByProductId, refresh: pricesRefresh } = usePrices(activeHouseholdId);
  const priceLatestMap = latestByProductId as Record<string, PriceEntry>;
  const priceInsightsMap = insightsByProductId as Record<string, PriceInsight>;
  const {
    items,
    loading,
    error: shoppingError,
    addTextItem,
    addProductItem,
    toggleItem,
    deleteItem,
    refresh: shoppingRefresh,
  } = useShoppingList(activeHouseholdId);
  const inputRef = useRef<TextInput>(null);
  const selectingSuggestionRef = useRef(false);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [shouldRenderDropdown, setShouldRenderDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void productsRefresh();
      void pricesRefresh();
      void storesRefresh();
      void shoppingRefresh();
    }, [pricesRefresh, productsRefresh, shoppingRefresh, storesRefresh])
  );

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((store) => {
      map[store.id] = store.name;
    });
    return map;
  }, [stores]);

  const productInfoById = useMemo(() => {
    const map: Record<string, { quantity: number | null; unit: string | null }> = {};

    products.forEach((product) => {
      map[product.id] = {
        quantity: product.quantity,
        unit: product.unit,
      };
    });

    return map;
  }, [products]);

  const cheapestPriceSummaryByProductId = useMemo(() => {
    const map: Record<string, { label: string; storeName: string; dateLabel: string; unitPriceLabel: string | null }> = {};

    Object.entries(priceInsightsMap).forEach(([productId, insight]) => {
      const cheapest = insight?.cheapest ?? insight?.latest ?? null;
      if (!cheapest) return;
      const productInfo = productInfoById[productId] ?? null;

      map[productId] = {
        label: formatPrice(cheapest.price_cents),
        storeName: storeNameById[cheapest.store_id] ?? 'Tienda',
        dateLabel: new Date(cheapest.purchased_at).toLocaleDateString('es-ES'),
        unitPriceLabel: productInfo ? formatUnitPrice(cheapest.price_cents, productInfo.quantity, productInfo.unit) : null,
      };
    });

    return map;
  }, [priceInsightsMap, productInfoById, storeNameById]);

  const sortedShoppingItems = useMemo(() => {
    const getStoreMeta = (item: ShoppingListItem) => {
      if (!item.product_id) {
        return {
          cheapestStoreName: null,
          cheapestStoreId: null,
          cheapestPrice: null,
          storeSortLabel: 'Sin precio',
          storeSortWeight: 2,
        };
      }

      const insight = priceInsightsMap[item.product_id];
      const cheapest = insight?.cheapest ?? priceLatestMap[item.product_id] ?? null;
      const cheapestStoreId = cheapest?.store_id ?? null;
      const cheapestStoreName = cheapestStoreId ? storeNameById[cheapestStoreId] ?? 'Tienda' : null;

      if (!cheapestStoreId || !cheapestStoreName) {
        return {
          cheapestStoreName: null,
          cheapestStoreId: null,
          cheapestPrice: cheapest?.price_cents ?? null,
          storeSortLabel: 'Sin precio',
          storeSortWeight: 2,
        };
      }

      return {
        cheapestStoreName,
        cheapestStoreId,
        cheapestPrice: cheapest?.price_cents ?? null,
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

        const leftPrice = left.cheapestPrice ?? Number.POSITIVE_INFINITY;
        const rightPrice = right.cheapestPrice ?? Number.POSITIVE_INFINITY;

        if (leftPrice !== rightPrice) {
          return leftPrice - rightPrice;
        }

        return left.text.localeCompare(right.text);
      });
  }, [items, priceInsightsMap, priceLatestMap, storeNameById]);

  const pendingItems = useMemo(() => sortedShoppingItems.filter((item) => !item.is_checked), [sortedShoppingItems]);
  const completedItems = useMemo(() => sortedShoppingItems.filter((item) => item.is_checked), [sortedShoppingItems]);
  const pendingVisual = getPendingVisual(pendingItems.length > 0);

  const pendingGroups = useMemo(() => {
    const grouped = new Map<
      string,
      {
        label: string;
        items: ShoppingItemViewModel[];
        sortWeight: number;
      }
    >();

    pendingItems.forEach((item) => {
      const key = `${item.storeSortWeight}:${item.storeSortLabel}`;
      const current = grouped.get(key);

      if (!current) {
        grouped.set(key, {
          label: item.storeSortLabel,
          items: [item],
          sortWeight: item.storeSortWeight,
        });
        return;
      }

      current.items.push(item);
    });

    return [...grouped.values()].sort((left, right) => {
      if (left.sortWeight !== right.sortWeight) {
        return left.sortWeight - right.sortWeight;
      }

      return left.label.localeCompare(right.label);
    });
  }, [pendingItems]);

  const handleRegisterPrice = (productId: string) => {
    router.push({ pathname: '/modals/price-editor', params: { productId, returnTo: '/(tabs)/list' } });
  };

  const handleRegisterProduct = (item: ShoppingListItem) => {
    router.push({
      pathname: '/modals/product-editor',
      params: {
        name: item.text,
        sourceShoppingItemId: item.id,
        markAsBought: 'false',
      },
    });
  };

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
        const latestPrice = latestEntry ? latestEntry.price_cents : null;
        const cheapestPrice = cheapestEntry ? cheapestEntry.price_cents : null;
        const latestReferenceQuantity = getQuantityInReferenceUnit(product.quantity, product.unit);
        const latestUnitPrice = latestEntry && latestReferenceQuantity ? latestEntry.price_cents / latestReferenceQuantity : null;
        const cheapestUnitPrice = cheapestEntry && latestReferenceQuantity ? cheapestEntry.price_cents / latestReferenceQuantity : null;
        const comparisonFamily = getComparisonFamily(product.unit);
        const comparisonLabel = latestEntry ? formatUnitPrice(latestEntry.price_cents, product.quantity, product.unit) : cheapestEntry ? formatUnitPrice(cheapestEntry.price_cents, product.quantity, product.unit) : null;
        const hasCheaperAlternative = Boolean(
          insight?.latest && insight?.cheapest && insight.cheapest.price_cents < insight.latest.price_cents
        );

        return {
          id: product.id,
          name: product.name,
          brand: product.brand,
          quantity: product.quantity,
          unit: product.unit,
          category: product.category,
          comparisonFamily,
          latestPrice,
          latestStoreName: latestEntry ? storeNameById[latestEntry.store_id] ?? 'Tienda' : null,
          cheapestPrice,
          cheapestStoreName: cheapestEntry ? storeNameById[cheapestEntry.store_id] ?? 'Tienda' : null,
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

        const leftPrice = left.rankUnitPrice ?? Number.POSITIVE_INFINITY;
        const rightPrice = right.rankUnitPrice ?? Number.POSITIVE_INFINITY;

        if (leftPrice !== rightPrice) {
          return leftPrice - rightPrice;
        }

        return left.name.localeCompare(right.name);
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
  }, [priceInsightsMap, priceLatestMap, products, query, storeNameById]);

  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownTranslateY = useRef(new Animated.Value(8)).current;
  const dropdownVisible = showDropdown && query.trim().length > 0;

  useEffect(() => {
    if (dropdownVisible) {
      setShouldRenderDropdown(true);
      Animated.parallel([
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(dropdownTranslateY, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(dropdownOpacity, {
        toValue: 0,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownTranslateY, {
        toValue: 8,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setShouldRenderDropdown(false);
      }
    });
  }, [dropdownOpacity, dropdownTranslateY, dropdownVisible]);

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
      const quantityPart = product.unit ? `${product.quantity}${product.unit}` : `${product.quantity}`;
      parts.push(quantityPart);
    }

    return parts.join(' · ');
  };

  const dropdownTitle = query.trim();

  const closeSearchSurface = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setShowDropdown(false);
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
      Alert.alert('Texto requerido', 'Introduce un ítem');
      return;
    }

    setIsSubmitting(true);
    try {
      runListLayoutAnimation();
      await addTextItem(value);
      void hapticSuccess();
      resetSearchAfterAction({ keepKeyboardOpen: true });
    } catch (err) {
      selectingSuggestionRef.current = false;
      void hapticError();
      Alert.alert('Error al añadir', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectProduct = async (productId: string, name: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      runListLayoutAnimation();
      await addProductItem(productId, name);
      void hapticSuccess();
      resetSearchAfterAction({ keepKeyboardOpen: false });
    } catch (err) {
      selectingSuggestionRef.current = false;
      void hapticError();
      Alert.alert('Error al añadir', (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setShowDropdown(value.trim().length > 0);
  };

  const handleToggle = async (item: ShoppingListItem) => {
    if (!item.is_checked && !item.product_id) {
      Alert.alert('Este producto no está registrado', '¿Quieres registrarlo?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar producto',
          onPress: () => {
            router.push({
              pathname: '/modals/product-editor',
              params: {
                name: item.text,
                sourceShoppingItemId: item.id,
              },
            });
          },
        },
        {
          text: 'Marcar como comprado',
          style: 'default',
          onPress: async () => {
            try {
              runListLayoutAnimation();
              await toggleItem(item.id, true);
              void hapticTap();
            } catch (err) {
              void hapticError();
              Alert.alert('Error al actualizar', (err as Error).message);
            }
          },
        },
      ]);
      return;
    }

    try {
      runListLayoutAnimation();
      await toggleItem(item.id, !item.is_checked);
      void hapticTap();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al actualizar', (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      runListLayoutAnimation();
      await deleteItem(id);
      void hapticMedium();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al borrar', (err as Error).message);
    }
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

  return (
    <Screen scrollable>
      <TouchableWithoutFeedback onPress={closeSearchSurface} accessible={false}>
        <SwipeTabs style={styles.page}>
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>LISTO</Text>
            <Text style={styles.heroTitle}>Lista</Text>
            <Text style={styles.heroSubtitle}>
              Añade rápido y consulta lo pendiente de un vistazo.
            </Text>
            {loading ? <Text style={styles.heroMeta}>Actualizando lista…</Text> : null}
          </View>
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>
          {shoppingError ? (
            <AnimatedCard delay={0}>
              <View style={styles.errorCard}>
                <View style={styles.errorRail} />
                <Text style={styles.errorText}>{shoppingError}</Text>
              </View>
            </AnimatedCard>
          ) : null}

          <AnimatedCard delay={50}>
            <View style={styles.inputCard}>
              <View style={styles.inputCardHeader}>
                <Text style={styles.inputCardTitle}>Añadir a la lista</Text>
                <Text style={styles.inputCardSubtitle}>Busca o escribe algo nuevo.</Text>
              </View>

              <View style={styles.quickInputShell}>
                <TextInput
                  ref={inputRef}
                  placeholder="Escribe o busca un producto..."
                  placeholderTextColor="#98A2B3"
                  value={query}
                  onChangeText={handleQueryChange}
                  style={styles.quickInput}
                  returnKeyType="done"
                  onSubmitEditing={handleAddText}
                  onFocus={() => setShowDropdown(query.trim().length > 0)}
                  onBlur={() => {
                    if (!selectingSuggestionRef.current) {
                      Keyboard.dismiss();
                    }
                  }}
                  blurOnSubmit={false}
                />

                <ScaleButton
                  onPress={handleAddText}
                  disabled={loading || isSubmitting}
                  style={styles.quickAddButtonPressable}
                >
                  <Animated.View style={[styles.quickAddButton, (loading || isSubmitting) && styles.quickAddButtonDisabled]}>
                    <Text style={styles.quickAddButtonText}>+</Text>
                  </Animated.View>
                </ScaleButton>
              </View>

              {shouldRenderDropdown ? (
                <Animated.View
                  style={[
                    styles.dropdown,
                    {
                      opacity: dropdownOpacity,
                      transform: [{ translateY: dropdownTranslateY }],
                    },
                  ]}
                >
                  <View style={styles.dropdownHeader}>
                    <Text style={styles.dropdownHeaderTitle}>Sugerencias</Text>
                    <Text style={styles.dropdownHeaderMeta}>{filteredProducts.length} productos</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPressIn={() => {
                      selectingSuggestionRef.current = true;
                    }}
                    onPress={handleAddText}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.dropdownItem, styles.dropdownPrimaryItem, pressed && styles.dropdownItemPressed]}
                  >
                    <Text style={styles.dropdownPrimaryLabel}>➕ Añadir &quot;{dropdownTitle}&quot;</Text>
                    <Text style={styles.dropdownSecondaryLabel}>Nuevo elemento libre</Text>
                  </Pressable>

                  {filteredProducts.map((product) => (
                    <Pressable
                      key={product.id}
                      accessibilityRole="button"
                      onPressIn={() => {
                        selectingSuggestionRef.current = true;
                      }}
                      onPress={() => handleSelectProduct(product.id, product.name)}
                      disabled={isSubmitting}
                      style={({ pressed }) => [styles.dropdownItem, pressed && styles.dropdownItemPressed]}
                    >
                      <View style={styles.dropdownItemTitleRow}>
                        <Text style={styles.dropdownItemLabel}>{product.name}</Text>
                        {product.isCheapestMatch && product.rankUnitPrice !== null ? (
                          <View style={styles.cheapestBadge}>
                            <Text style={styles.cheapestBadgeText}>Precio más barato {getComparisonFamilyLabel(product.comparisonFamily)}</Text>
                          </View>
                        ) : null}
                      </View>
                      {formatProductSummary(product) ? (
                        <Text style={styles.dropdownItemMeta}>{formatProductSummary(product)}</Text>
                      ) : null}

                      {product.comparisonLabel ? (
                        <Text style={styles.dropdownItemComparisonMeta}>{product.comparisonLabel}</Text>
                      ) : null}

                      {product.latestPrice !== null ? (
                        <Text style={styles.dropdownItemPriceMeta}>
                          Último precio: {formatPrice(product.latestPrice)}
                          {product.latestStoreName ? ` en ${product.latestStoreName}` : ''}
                          {product.hasCheaperAlternative && product.cheapestPrice !== null
                            ? ` · Más barato: ${formatPrice(product.cheapestPrice)}`
                            : ''}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </Animated.View>
              ) : null}
            </View>
          </AnimatedCard>

          <AnimatedCard delay={100}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleGroup}>
                  <View style={[styles.sectionIconWrap, { backgroundColor: pendingVisual.backgroundColor }]}>
                    <Text style={[styles.sectionIconGlyph, { color: pendingVisual.color }]}>
                      {pendingItems.length > 0 ? '🛒' : '✓'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Pendientes</Text>
                    <Text style={styles.sectionHint}>Lo que queda por comprar</Text>
                  </View>
                </View>
                <View style={styles.sectionCountBadge}>
                  <Text style={styles.sectionCountText}>{pendingItems.length}</Text>
                </View>
              </View>

              {pendingItems.length === 0 ? (
                loading ? null : (
                  <View style={styles.inlineEmptyState}>
                    <Text style={styles.inlineEmptyTitle}>No hay ítems pendientes</Text>
                    <Text style={styles.inlineEmptySubtitle}>Añade algo para empezar.</Text>
                  </View>
                )
              ) : (
                <View style={styles.rowsGroup}>
                  {pendingGroups.map((group) => (
                    <View key={group.label} style={styles.storeGroup}>
                      <View style={styles.storeGroupHeader}>
                        <View style={styles.storeGroupBadge}>
                          <Text style={styles.storeGroupBadgeText}>🏪</Text>
                        </View>

                        <View style={styles.storeGroupMeta}>
                          <Text style={styles.storeGroupEyebrow}>Comprar en</Text>
                          <Text style={styles.storeGroupTitle} numberOfLines={1}>
                            {group.label}
                          </Text>
                          <Text style={styles.storeGroupSubtitle}>
                            {group.items.length} {group.items.length === 1 ? 'producto' : 'productos'} pendientes
                          </Text>
                        </View>

                        <Text style={styles.storeGroupCount}>{group.items.length}</Text>
                      </View>

                      <View style={styles.rowsGroup}>
                        {group.items.map((item) => (
                          <ShoppingRow
                            key={item.id}
                            item={item}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onRegisterPrice={handleRegisterPrice}
                            onRegisterProduct={handleRegisterProduct}
                            priceSummary={item.product_id ? cheapestPriceSummaryByProductId[item.product_id] ?? null : null}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </AnimatedCard>

          <AnimatedCard delay={140}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleGroup}>
                  <View style={[styles.sectionIconWrap, styles.sectionIconWrapMuted]}>
                    <Text style={styles.sectionIconGlyph}>✓</Text>
                  </View>
                  <View>
                    <Text style={styles.sectionTitle}>Comprados</Text>
                    <Text style={styles.sectionHint}>Elementos ya completados</Text>
                  </View>
                </View>
                <View style={[styles.sectionCountBadge, styles.sectionCountBadgeMuted]}>
                  <Text style={[styles.sectionCountText, styles.sectionCountTextMuted]}>{completedItems.length}</Text>
                </View>
              </View>

              {completedItems.length === 0 ? (
                <View style={styles.inlineEmptyState}>
                  <Text style={styles.inlineEmptyTitle}>Todavía no hay ítems comprados</Text>
                  <Text style={styles.inlineEmptySubtitle}>Aparecerán aquí cuando los marques.</Text>
                </View>
              ) : (
                <View style={styles.rowsGroup}>
                  {completedItems.map((item) => (
                    <ShoppingRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onRegisterPrice={handleRegisterPrice}
                      onRegisterProduct={handleRegisterProduct}
                      priceSummary={item.product_id ? cheapestPriceSummaryByProductId[item.product_id] ?? null : null}
                    />
                  ))}
                </View>
              )}
            </View>
          </AnimatedCard>
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
  heroMeta: {
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
    marginTop: -12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 14,
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
  quickInputShell: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FCFDFC',
    paddingLeft: 16,
    paddingRight: 8,
  },
  quickInput: {
    flex: 1,
    minHeight: 58,
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  quickAddButtonPressable: {
    borderRadius: 999,
  },
  quickAddButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primaryDark,
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.10,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  quickAddButtonDisabled: {
    opacity: 0.55,
  },
  quickAddButtonText: {
    fontSize: 17,
    lineHeight: 17,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: -1,
  },
  dropdown: {
    marginTop: 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7EBF0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    paddingVertical: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  dropdownHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#667085',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dropdownHeaderMeta: {
    fontSize: 12,
    color: '#98A2B3',
    fontWeight: '600',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 2,
    marginHorizontal: 6,
    borderRadius: 14,
  },
  dropdownPrimaryItem: {
    backgroundColor: '#F1FBF4',
    marginBottom: 8,
  },
  dropdownItemPressed: {
    backgroundColor: '#EEF2F7',
  },
  dropdownPrimaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: tokens.colors.primaryDark,
  },
  dropdownSecondaryLabel: {
    fontSize: 13,
    color: '#98A2B3',
  },
  dropdownItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  dropdownItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownItemMeta: {
    fontSize: 13,
    color: '#667085',
  },
  dropdownItemPriceMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: tokens.colors.primaryDark,
    fontWeight: '600',
  },
  dropdownItemComparisonMeta: {
    fontSize: 12,
    lineHeight: 17,
    color: '#067647',
    fontWeight: '700',
  },
  cheapestBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: tokens.colors.primarySoft,
  },
  cheapestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.primaryDark,
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
  sectionIconWrapMuted: {
    backgroundColor: '#EEF2F6',
  },
  sectionIconGlyph: {
    color: tokens.colors.primaryDark,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: -1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  sectionHint: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  sectionCountBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sectionCountBadgeMuted: {
    backgroundColor: '#F2F4F7',
  },
  sectionCountText: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCountTextMuted: {
    color: '#667085',
  },
  rowsGroup: {
    gap: 0,
  },
  storeGroup: {
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FBFCFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#101828',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  storeGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeGroupBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primarySoft,
  },
  storeGroupBadgeText: {
    fontSize: 18,
    lineHeight: 18,
  },
  storeGroupMeta: {
    flex: 1,
    gap: 1,
  },
  storeGroupEyebrow: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  storeGroupTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  storeGroupSubtitle: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 16,
  },
  storeGroupCount: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
    color: '#475467',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  inlineEmptyState: {
    paddingVertical: 4,
    gap: 2,
  },
  inlineEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#344054',
  },
  inlineEmptySubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#98A2B3',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    minHeight: 66,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  itemMainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  itemPressed: {
    opacity: 0.92,
  },
  itemMarker: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#BFC8D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMarkerText: {
    fontSize: 13,
    color: tokens.colors.primaryDark,
    fontWeight: '700',
  },
  itemTextBlock: {
    gap: 2,
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemTextChecked: {
    color: '#98A2B3',
    textDecorationLine: 'line-through',
  },
  itemPriceMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: tokens.colors.primaryDark,
    fontWeight: '700',
  },
  itemPriceMetaGroup: {
    gap: 2,
  },
  itemUnitPriceMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: '#067647',
    fontWeight: '700',
  },
  itemPriceMetaMuted: {
    fontSize: 12,
    lineHeight: 16,
    color: '#98A2B3',
    fontWeight: '600',
  },
  priceAction: {
    width: 28,
    height: 28,
    borderRadius: 999,
    marginLeft: 2,
  },
  productAction: {
    width: 28,
    height: 28,
    borderRadius: 999,
    marginLeft: 2,
  },
  priceActionInner: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#CFEFD9',
  },
  productActionInner: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#CFEFD9',
  },
  priceActionText: {
    color: tokens.colors.primaryDark,
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '800',
  },
  productActionText: {
    color: tokens.colors.primaryDark,
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '800',
  },
  deleteAction: {
    width: 28,
    height: 28,
    borderRadius: 999,
    marginLeft: 2,
  },
  deleteActionInner: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleButtonPressed: {
    opacity: 0.92,
  },
  deleteActionText: {
    color: '#98A2B3',
    fontSize: 17,
    lineHeight: 17,
    fontWeight: '400',
  },
});
