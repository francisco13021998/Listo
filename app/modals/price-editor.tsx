import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useProducts } from '../../src/hooks/useProducts';
import { usePrices } from '../../src/hooks/usePrices';
import { useStores } from '../../src/hooks/useStores';
import { getPriceEntryById, updatePriceEntry } from '../../src/services/prices.service';
import { hapticError, hapticSuccess } from '../../src/lib/haptics';
import { getFloatingMenuStyle } from '../../src/lib/floatingMenu';
import { tokens } from '../../src/theme/tokens';

type StoreOption = {
  id: string;
  name: string;
};

type ProductUnit = 'g' | 'kg' | 'ml' | 'l' | 'u';

const unitOptions: Array<{ label: string; value: ProductUnit }> = [
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
  { label: 'u', value: 'u' },
];

function parseQuantity(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(value < 10 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '');
}

function getReferenceUnit(unit: ProductUnit | '') {
  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'l') return 'l';
  if (unit === 'u') return 'u';
  return null;
}

function normalizeQuantity(quantity: number | null, unit: ProductUnit | '') {
  if (!quantity || quantity <= 0 || !unit) return null;

  if (unit === 'kg') return quantity;
  if (unit === 'g') return quantity / 1000;
  if (unit === 'l') return quantity;
  if (unit === 'ml') return quantity / 1000;
  if (unit === 'u') return quantity;
  return null;
}

export default function PriceEditorModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    productId?: string | string[];
    priceId?: string | string[];
    returnTo?: string | string[];
    selectedStoreId?: string | string[];
  }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const priceId = Array.isArray(params.priceId) ? params.priceId[0] : params.priceId;
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const selectedStoreIdFromRoute = Array.isArray(params.selectedStoreId) ? params.selectedStoreId[0] : params.selectedStoreId;
  const { activeHouseholdId } = useActiveHousehold();
  const { products } = useProducts(activeHouseholdId);
  const { stores, loading: storesLoading } = useStores(activeHouseholdId);
  const { addPrice, refresh: refreshPrices } = usePrices(activeHouseholdId);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownAnchor, setDropdownAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [priceText, setPriceText] = useState('');
  const [quantityText, setQuantityText] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<ProductUnit | ''>('');
  const [saving, setSaving] = useState(false);
  const [hasLoadedStores, setHasLoadedStores] = useState(false);
  const [loadedPriceEntry, setLoadedPriceEntry] = useState(false);
  const [priceEntryMissing, setPriceEntryMissing] = useState(false);
  const missingStateNotified = useRef(false);
  const appliedStoreSelection = useRef(false);
  const triggerRef = useRef<View>(null);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((product) => product.id === productId) ?? null;
  }, [productId, products]);

  const isEditingPrice = Boolean(priceId);

  const baseQuantity = useMemo(() => parseQuantity(quantityText), [quantityText]);
  const priceValue = useMemo(() => parseQuantity(priceText), [priceText]);
  const referenceUnit = getReferenceUnit(selectedUnit);
  const normalizedQuantity = useMemo(() => normalizeQuantity(baseQuantity, selectedUnit), [baseQuantity, selectedUnit]);
  const unitPriceLabel = useMemo(() => {
    if (!priceValue || !normalizedQuantity || !referenceUnit) return null;

    const pricePerReferenceUnit = priceValue / normalizedQuantity;
    const referenceLabel = referenceUnit === 'u' ? 'unidad' : referenceUnit;
    return `${formatDecimal(pricePerReferenceUnit).replace('.', ',')} €/${referenceLabel}`;
  }, [normalizedQuantity, priceValue, referenceUnit]);

  const createStoreRoute = useMemo(
    () => ({
      pathname: '/modals/store-editor' as const,
      params: {
        returnTo: '/modals/price-editor',
        productId: productId ?? '',
        priceId: priceId ?? '',
        finalReturnTo: returnTo ?? '',
      },
    }),
    [priceId, productId, returnTo]
  );

  const sortedStores = useMemo<StoreOption[]>(() => {
    return [...stores]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((store) => ({ id: store.id, name: store.name }));
  }, [stores]);

  const selectedStoreName = useMemo(() => {
    return sortedStores.find((store) => store.id === selectedStoreId)?.name ?? null;
  }, [selectedStoreId, sortedStores]);

  useEffect(() => {
    if (!selectedStoreIdFromRoute || appliedStoreSelection.current) {
      return;
    }

    if (storesLoading) {
      return;
    }

    const matchedStore = sortedStores.find((store) => store.id === selectedStoreIdFromRoute);
    if (!matchedStore) {
      return;
    }

    setSelectedStoreId(matchedStore.id);
    appliedStoreSelection.current = true;
  }, [selectedStoreIdFromRoute, sortedStores, storesLoading]);

  useEffect(() => {
    if (isEditingPrice) {
      return;
    }

    if (!selectedProduct) return;

    setQuantityText(selectedProduct.quantity !== null && selectedProduct.quantity !== undefined ? String(selectedProduct.quantity) : '');
    setSelectedUnit(selectedProduct.unit ?? '');
  }, [isEditingPrice, selectedProduct]);

  useEffect(() => {
    if (!isEditingPrice || !priceId || !activeHouseholdId) {
      return;
    }

    let cancelled = false;

    const loadPriceEntry = async () => {
      setLoadedPriceEntry(false);
      setPriceEntryMissing(false);
      try {
        const entry = await getPriceEntryById({ householdId: activeHouseholdId, priceEntryId: priceId });
        if (cancelled) return;

        if (!entry) {
          setPriceEntryMissing(true);
          setLoadedPriceEntry(true);
          return;
        }

        setPriceText((entry.price_cents / 100).toFixed(2).replace('.', ','));
        setQuantityText(entry.quantity !== null && entry.quantity !== undefined ? String(entry.quantity) : selectedProduct?.quantity !== null && selectedProduct?.quantity !== undefined ? String(selectedProduct.quantity) : '');
        setSelectedUnit(entry.unit ?? selectedProduct?.unit ?? '');

        if (!selectedStoreIdFromRoute) {
          setSelectedStoreId(entry.store_id);
          appliedStoreSelection.current = true;
        }
      } catch (err) {
        if (!cancelled) {
          void hapticError();
          Alert.alert('Error al cargar', (err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoadedPriceEntry(true);
        }
      }
    };

    void loadPriceEntry();

    return () => {
      cancelled = true;
    };
  }, [activeHouseholdId, isEditingPrice, priceId, selectedProduct, selectedStoreIdFromRoute]);

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownAnchor({ x, y, width, height });
      setDropdownOpen(true);
    });
  };

  const handleCreateStore = () => {
    closeDropdown();
    router.push(createStoreRoute);
  };

  const closeDropdown = () => setDropdownOpen(false);

  const dropdownHeight = Math.min(320, sortedStores.length * 44 + 84);
  const dropdownStyle = getFloatingMenuStyle(dropdownAnchor, { menuWidth: dropdownAnchor.width, menuHeight: dropdownHeight });

  const hasMissingContext = !productId || !activeHouseholdId;

  useEffect(() => {
    if (hasMissingContext && !missingStateNotified.current) {
      missingStateNotified.current = true;
      void hapticError();
    }
  }, [hasMissingContext]);

  useEffect(() => {
    if (storesLoading) {
      setHasLoadedStores(true);
    }
  }, [storesLoading]);

  const handleSave = async () => {
    if (!selectedStoreId) {
      void hapticError();
      Alert.alert('Selecciona una tienda');
      return;
    }

    const value = parseFloat(priceText.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      void hapticError();
      Alert.alert('Precio inválido');
      return;
    }

    const priceCents = Math.round(value * 100);
    const quantity = parseQuantity(quantityText);
    setSaving(true);
    try {
      if (isEditingPrice) {
        if (!priceId) {
          throw new Error('No se pudo identificar el precio a editar');
        }

        await updatePriceEntry({
          householdId: activeHouseholdId,
          priceEntryId: priceId,
          storeId: selectedStoreId,
          priceCents,
          quantity,
          unit: selectedUnit || null,
        });
      } else {
        await addPrice({
          productId: productId as string,
          storeId: selectedStoreId,
          priceCents,
          quantity,
          unit: selectedUnit || null,
        });
      }

      await refreshPrices();
      void hapticSuccess();
      if (returnTo) {
        if (returnTo === '/modals/store-prices') {
          router.navigate({
            pathname: returnTo,
            params: {
              storeId: selectedStoreId ?? selectedStoreIdFromRoute ?? '',
            },
          });
          return;
        }

        router.replace(returnTo);
        return;
      }

      router.back();
    } catch (err) {
      void hapticError();
      Alert.alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!productId || !activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title="Añadir precio" subtitle="Falta producto o hogar activo para continuar.">
          <EmptyState
            title="No se puede continuar"
            subtitle="Necesitas un producto y un hogar activo para añadir precios."
            actionLabel="Cerrar"
            onAction={() => router.back()}
          />
        </SectionCard>
      </Screen>
    );
  }

  if (isEditingPrice && !loadedPriceEntry) {
    return (
      <Screen scrollable>
        <SectionCard title="Editar precio" subtitle="Cargando precio seleccionado…">
          <EmptyState title="Preparando datos" subtitle="Un momento, estamos cargando el precio para editarlo." actionLabel="Cerrar" onAction={() => router.back()} />
        </SectionCard>
      </Screen>
    );
  }

  if (isEditingPrice && priceEntryMissing) {
    return (
      <Screen scrollable>
        <SectionCard title="Editar precio" subtitle="No se pudo localizar el precio seleccionado.">
          <EmptyState title="Precio no encontrado" subtitle="El precio pudo haberse eliminado o no existe." actionLabel="Cerrar" onAction={() => router.back()} />
        </SectionCard>
      </Screen>
    );
  }

  if (hasLoadedStores && !storesLoading && sortedStores.length === 0) {
    return (
      <Screen scrollable>
        <View style={styles.page}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>LISTO</Text>
            <Text style={styles.title}>Añadir precio</Text>
            <Text style={styles.subtitle}>
              Antes de registrar el precio, crea al menos una tienda para este hogar.
            </Text>
          </View>

          <SectionCard title="Sin tiendas" subtitle="Necesitas crear una para seguir con el precio del producto.">
            <View style={styles.emptyPanel}>
              <Text style={styles.emptyPanelTitle}>No hay tiendas creadas</Text>
              <Text style={styles.emptyPanelText}>
                Crea tu primera tienda y volverás automáticamente a este flujo para guardar el precio.
              </Text>

              <View style={styles.emptyPanelActions}>
                <PrimaryButton title="Crear tienda" onPress={() => router.push(createStoreRoute)} fullWidth />
                <SecondaryButton title="Cerrar" onPress={() => router.back()} fullWidth />
              </View>
            </View>
          </SectionCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <SectionCard
        title="Añadir precio"
        subtitle="Selecciona una tienda y registra el precio del producto."
      >
        <View style={styles.form}>
          <View style={styles.storeBlock}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.label}>Tienda</Text>
              {selectedStoreName ? <Text style={styles.selectedHint}>{selectedStoreName}</Text> : null}
            </View>

            {storesLoading ? (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>Cargando tiendas…</Text>
              </View>
            ) : (
              <View>
                <View ref={triggerRef} collapsable={false}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={openDropdown}
                    style={({ pressed }) => [styles.dropdownButton, pressed && styles.dropdownButtonPressed]}
                  >
                    <Text
                      style={[styles.dropdownButtonText, !selectedStoreName && styles.dropdownButtonPlaceholder]}
                      numberOfLines={1}
                    >
                      {selectedStoreName ?? 'Selecciona una tienda'}
                    </Text>
                    <Text style={styles.dropdownChevron}>{dropdownOpen ? '▴' : '▾'}</Text>
                  </Pressable>
                </View>

                <Modal visible={dropdownOpen} transparent animationType="none" onRequestClose={closeDropdown} statusBarTranslucent>
                  <Pressable style={styles.dropdownBackdrop} onPress={closeDropdown}>
                    <View
                      style={[
                        styles.dropdownMenu,
                        {
                            top: dropdownStyle.top,
                            left: dropdownStyle.left,
                          width: dropdownAnchor.width,
                        },
                      ]}
                    >
                      <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                        contentContainerStyle={styles.dropdownMenuContent}
                      >
                        {sortedStores.map((store) => {
                          const active = selectedStoreId === store.id;

                          return (
                            <Pressable
                              key={store.id}
                              accessibilityRole="button"
                              onPress={() => {
                                setSelectedStoreId(store.id);
                                closeDropdown();
                              }}
                              style={({ pressed }) => [
                                styles.dropdownItem,
                                active && styles.dropdownItemActive,
                                pressed && styles.dropdownItemPressed,
                              ]}
                            >
                              <View style={[styles.dropdownItemIcon, active && styles.dropdownItemIconActive]}>
                                <Text style={[styles.dropdownItemIconText, active && styles.dropdownItemIconTextActive]}>
                                  {store.name.trim().slice(0, 2).toUpperCase() || 'S'}
                                </Text>
                              </View>
                              <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]} numberOfLines={1}>
                                {store.name}
                              </Text>
                            </Pressable>
                          );
                        })}

                        <View style={styles.dropdownFooter}>
                          <Pressable
                            accessibilityRole="button"
                            onPress={handleCreateStore}
                            style={({ pressed }) => [styles.dropdownCreateButton, pressed && styles.dropdownItemPressed]}
                          >
                            <View style={styles.dropdownCreateIcon}>
                              <Text style={styles.dropdownCreateIconText}>＋</Text>
                            </View>
                            <View style={styles.dropdownCreateTextBlock}>
                              <Text style={styles.dropdownCreateTitle}>Crear tienda</Text>
                              <Text style={styles.dropdownCreateSubtitle}>Añade una nueva y vuelve a este precio.</Text>
                            </View>
                          </Pressable>
                        </View>
                      </ScrollView>
                    </View>
                  </Pressable>
                </Modal>
              </View>
            )}
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricTitle}>Datos del producto</Text>
              <Text style={styles.metricSubtitle}>Puedes ajustarlos solo para este precio.</Text>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.quantityInputWrap}>
                <Text style={styles.label}>Cantidad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 500"
                  placeholderTextColor="#98A2B3"
                  keyboardType="decimal-pad"
                  value={quantityText}
                  onChangeText={setQuantityText}
                />
              </View>

              <View style={styles.unitPickerWrap}>
                <Text style={styles.label}>Unidad</Text>
                <View style={styles.unitGrid}>
                  {unitOptions.map((option) => {
                    const active = selectedUnit === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="button"
                        onPress={() => setSelectedUnit(option.value)}
                        style={({ pressed }) => [
                          styles.unitChip,
                          active && styles.unitChipActive,
                          pressed && styles.unitChipPressed,
                        ]}
                      >
                        <Text style={[styles.unitChipText, active && styles.unitChipTextActive]}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Precio (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 1.49"
              placeholderTextColor="#98A2B3"
              keyboardType="decimal-pad"
              value={priceText}
              onChangeText={setPriceText}
            />
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Vista previa</Text>
            <Text style={styles.previewText}>
              {selectedStoreName ? `Se guardará en ${selectedStoreName}.` : 'Selecciona una tienda para continuar.'}
            </Text>
            {unitPriceLabel ? <Text style={styles.previewPriceText}>Equivale a {unitPriceLabel}</Text> : null}
            {!unitPriceLabel && (quantityText || selectedUnit) ? (
              <Text style={styles.previewPriceTextMuted}>Completa precio, cantidad y unidad para ver el cálculo por kg, litro o unidad.</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <PrimaryButton title="Guardar" onPress={handleSave} loading={saving} disabled={saving} fullWidth />
            <SecondaryButton title="Cerrar" onPress={() => router.back()} fullWidth />
          </View>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: tokens.colors.primaryDark,
    borderRadius: tokens.radius.lg,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 4,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  form: {
    gap: 14,
  },
  emptyPanel: {
    gap: 10,
    paddingTop: 4,
  },
  emptyPanelTitle: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyPanelText: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyPanelActions: {
    gap: 8,
    paddingTop: 4,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.primaryDark,
    paddingHorizontal: 16,
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: tokens.colors.surface,
    fontSize: tokens.typography.button.fontSize,
    fontWeight: tokens.typography.button.fontWeight,
  },
  storeBlock: {
    gap: 10,
  },
  metricCard: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: '#E7F6ED',
    backgroundColor: '#F8FBF8',
    padding: tokens.spacing.md,
    gap: 12,
  },
  metricHeader: {
    gap: 2,
  },
  metricTitle: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  metricSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  quantityInputWrap: {
    flex: 1,
    gap: 6,
  },
  unitPickerWrap: {
    flex: 1,
    gap: 6,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitChip: {
    minWidth: 44,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitChipPressed: {
    opacity: 0.92,
  },
  unitChipActive: {
    borderColor: tokens.colors.primaryDark,
    backgroundColor: tokens.colors.primarySoft,
  },
  unitChipText: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  unitChipTextActive: {
    color: tokens.colors.primaryDark,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.text,
    letterSpacing: 0.2,
  },
  selectedHint: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  dropdownButton: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownButtonPressed: {
    opacity: 0.92,
  },
  dropdownButtonText: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '600',
  },
  dropdownButtonPlaceholder: {
    color: '#98A2B3',
  },
  dropdownChevron: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  dropdownMenu: {
    position: 'absolute',
    maxHeight: 280,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    overflow: 'hidden',
    zIndex: 30,
    elevation: 6,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  dropdownMenuContent: {
    paddingVertical: 4,
  },
  dropdownFooter: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  dropdownItem: {
    minHeight: 52,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemPressed: {
    opacity: 0.94,
  },
  dropdownItemActive: {
    backgroundColor: tokens.colors.primarySoft,
  },
  dropdownItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconActive: {
    backgroundColor: tokens.colors.surface,
  },
  dropdownItemIconText: {
    color: tokens.colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownItemIconTextActive: {
    color: tokens.colors.primaryDark,
  },
  dropdownItemText: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownItemTextActive: {
    color: tokens.colors.primaryDark,
  },
  dropdownCreateButton: {
    minHeight: 62,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: '#F8FBF8',
    borderWidth: 1,
    borderColor: '#CFEFD9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownCreateIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCreateIconText: {
    color: tokens.colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  dropdownCreateTextBlock: {
    flex: 1,
    gap: 2,
  },
  dropdownCreateTitle: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  dropdownCreateSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  loadingCard: {
    minHeight: 64,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  storeList: {
    gap: 10,
  },
  storeChip: {
    minHeight: 60,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeChipPressed: {
    opacity: 0.92,
  },
  storeChipActive: {
    borderColor: '#CFEFD9',
    backgroundColor: tokens.colors.primarySoft,
  },
  storeChipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeChipIconActive: {
    backgroundColor: tokens.colors.surface,
  },
  storeChipIconText: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  storeChipIconTextActive: {
    color: tokens.colors.primaryDark,
  },
  storeChipText: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  storeChipTextActive: {
    color: tokens.colors.primaryDark,
  },
  fieldBlock: {
    gap: 8,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.text,
    fontSize: tokens.typography.body.fontSize,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: '#E7F6ED',
    backgroundColor: tokens.colors.primarySoft,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.md,
    gap: 4,
  },
  previewLabel: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  previewText: {
    color: tokens.colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  previewPriceText: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  previewPriceTextMuted: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    gap: 8,
  },
});
