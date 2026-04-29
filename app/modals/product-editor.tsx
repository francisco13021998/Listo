import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { AppInput } from '../../src/components/AppInput';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { usePrices } from '../../src/hooks/usePrices';
import { useProducts } from '../../src/hooks/useProducts';
import { useStores } from '../../src/hooks/useStores';
import { Product, ProductUnit } from '../../src/domain/product';
import {
  DEFAULT_PRODUCT_CATEGORY,
  PRODUCT_CATEGORY_OPTIONS,
  ProductCategoryValue,
  normalizeProductCategory,
} from '../../src/domain/productCategories';
import { hapticError, hapticSuccess } from '../../src/lib/haptics';
import { getFloatingMenuStyle } from '../../src/lib/floatingMenu';
import { showGenericErrorAlert } from '../../src/lib/uiError';
import { tokens } from '../../src/theme/tokens';
import { attachProductToItem } from '../../src/services/shoppingList.service';
import { clearProductEditorDraft, peekProductEditorDraft, saveProductEditorDraft } from '../../src/state/storeCreationDrafts.store';

type ProductFormState = {
  name: string;
  brand: string;
  quantity: string;
  unit: ProductUnit | '';
  category: ProductCategoryValue | '';
};

type InitialPriceFormState = {
  storeId: string | null;
  price: string;
};

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type DropdownField = 'unit' | 'category' | 'priceStore' | null;

const emptyForm = (): ProductFormState => ({
  name: '',
  brand: '',
  quantity: '',
  unit: '',
  category: '',
});

const emptyInitialPriceForm = (): InitialPriceFormState => ({
  storeId: null,
  price: '',
});

const unitOptions: Array<{ label: string; value: ProductUnit }> = [
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'l', value: 'l' },
  { label: 'u', value: 'u' },
];

function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
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

function sanitizeQuantityInput(value: string) {
  const cleaned = value.replace(/[^0-9,]/g, '');
  const firstCommaIndex = cleaned.indexOf(',');

  if (firstCommaIndex === -1) {
    return cleaned;
  }

  return cleaned.slice(0, firstCommaIndex + 1) + cleaned.slice(firstCommaIndex + 1).replace(/,/g, '');
}

function DropdownSelect<T extends string>({
  label,
  placeholder,
  value,
  options,
  isOpen,
  field,
  onToggle,
  onChange,
  setOpenField,
  footerAction,
}: {
  label: string;
  placeholder: string;
  value: T | '';
  options: ReadonlyArray<SelectOption<T>>;
  isOpen: boolean;
  field: DropdownField;
  onToggle: () => void;
  onChange: (value: T) => void;
  setOpenField: (value: DropdownField) => void;
  footerAction?: { label: string; onPress: () => void };
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? (value === DEFAULT_PRODUCT_CATEGORY ? DEFAULT_PRODUCT_CATEGORY : undefined);
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpenField(field);
    });
  };

  const closeMenu = () => setOpenField(null);
  const menuHeight = Math.min(260, options.length * 44 + 8);
  const menuStyle = getFloatingMenuStyle(anchor, { menuWidth: anchor.width, menuHeight });

  return (
    <View style={[styles.dropdownField, isOpen && styles.dropdownFieldOpen]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View ref={triggerRef} collapsable={false}>
        <Pressable onPress={openMenu} style={({ pressed }) => [styles.dropdownButton, pressed && styles.dropdownButtonPressed]}>
          <Text style={[styles.dropdownButtonText, !value && styles.dropdownButtonPlaceholder]} numberOfLines={1}>
            {selectedLabel ?? placeholder}
          </Text>
          <Text style={styles.dropdownChevron}>{isOpen ? '▴' : '▾'}</Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeMenu} statusBarTranslucent>
        <Pressable style={styles.dropdownBackdrop} onPress={closeMenu}>
          <View
            style={[
              styles.dropdownMenu,
              {
                top: menuStyle.top,
                left: menuStyle.left,
                width: anchor.width,
              },
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator
              contentContainerStyle={styles.dropdownMenuContent}
            >
              {options.map((option) => {
                const active = value === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      closeMenu();
                    }}
                    style={({ pressed }) => [styles.dropdownItem, active && styles.dropdownItemActive, pressed && styles.dropdownItemPressed]}
                  >
                    <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}

              {footerAction ? (
                <View style={styles.dropdownFooter}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={footerAction.onPress}
                    style={({ pressed }) => [styles.dropdownFooterButton, pressed && styles.dropdownFooterButtonPressed]}
                  >
                    <Text style={styles.dropdownFooterButtonIcon}>＋</Text>
                    <Text style={styles.dropdownFooterButtonText}>{footerAction.label}</Text>
                  </Pressable>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function toFormState(product: Product): ProductFormState {
  return {
    name: product.name,
    brand: product.brand ?? '',
    quantity: product.quantity === null ? '' : String(product.quantity),
    unit: product.unit ?? '',
    category: product.category && product.category !== DEFAULT_PRODUCT_CATEGORY ? normalizeProductCategory(product.category) : '',
  };
}

export default function ProductEditorModal() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, loading: productsLoading, createProduct, updateProduct } = useProducts(activeHouseholdId);
  const { stores, loading: storesLoading, refresh: refreshStores } = useStores(activeHouseholdId);
  const { addPrice: createPrice } = usePrices(activeHouseholdId);
  const params = useLocalSearchParams<{
    productId?: string | string[];
    name?: string | string[];
    selectedStoreId?: string | string[];
    sourceShoppingItemId?: string | string[];
    sourceShoppingItemChecked?: string | string[];
    shoppingModeActive?: string | string[];
  }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const prefillNameParam = Array.isArray(params.name) ? params.name[0] : params.name;
  const selectedStoreIdFromRoute = Array.isArray(params.selectedStoreId) ? params.selectedStoreId[0] : params.selectedStoreId;
  const sourceShoppingItemId = Array.isArray(params.sourceShoppingItemId)
    ? params.sourceShoppingItemId[0]
    : params.sourceShoppingItemId;
  const sourceShoppingItemChecked = Array.isArray(params.sourceShoppingItemChecked)
    ? params.sourceShoppingItemChecked[0]
    : params.sourceShoppingItemChecked;
  const shoppingModeActive = Array.isArray(params.shoppingModeActive) ? params.shoppingModeActive[0] : params.shoppingModeActive;
  const isEditing = Boolean(productId);
  const draft = peekProductEditorDraft();
  const [sourceItemId, setSourceItemId] = useState<string | null>(() => sourceShoppingItemId ?? draft?.sourceShoppingItemId ?? null);
  const [sourceItemWasAlreadyBought, setSourceItemWasAlreadyBought] = useState(() => {
    if (draft?.sourceShoppingItemChecked !== undefined) return draft.sourceShoppingItemChecked;
    return sourceShoppingItemChecked === 'true';
  });
  const canMarkAsBought = Boolean(sourceItemId) && !sourceItemWasAlreadyBought;
  const [form, setForm] = useState<ProductFormState>(() =>
    draft
      ? {
          name: draft.name,
          brand: draft.brand,
          quantity: draft.quantity,
          unit: draft.unit,
          category: draft.category,
        }
      : emptyForm()
  );
  const [initialPriceForm, setInitialPriceForm] = useState<InitialPriceFormState>(() =>
    draft
      ? {
          storeId: selectedStoreIdFromRoute?.trim() ? selectedStoreIdFromRoute : draft.initialPriceStoreId,
          price: draft.initialPrice,
        }
      : emptyInitialPriceForm()
  );
  const [includeInitialPrice, setIncludeInitialPrice] = useState(() => Boolean(draft?.includeInitialPrice));
  const [markAsBought, setMarkAsBought] = useState(() => draft?.markAsBought ?? false);
  const [saving, setSaving] = useState(false);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [hasAppliedInitialPriceDefault, setHasAppliedInitialPriceDefault] = useState(false);
  const [openField, setOpenField] = useState<DropdownField>(null);
  const productQuantity = useMemo(() => parseQuantity(form.quantity), [form.quantity]);
  const productReferenceUnit = useMemo(() => getReferenceUnit(form.unit), [form.unit]);
  const initialPriceValue = useMemo(() => parsePrice(initialPriceForm.price), [initialPriceForm.price]);
  const initialPriceNormalizedQuantity = useMemo(
    () => normalizeQuantity(productQuantity, form.unit),
    [form.unit, productQuantity]
  );
  const initialPricePerReferenceUnitLabel = useMemo(() => {
    if (!initialPriceValue || !initialPriceNormalizedQuantity || !productReferenceUnit) {
      return null;
    }

    const pricePerReferenceUnit = initialPriceValue / initialPriceNormalizedQuantity;
    return `${formatDecimal(pricePerReferenceUnit).replace('.', ',')} €/${productReferenceUnit === 'u' ? 'unidad' : productReferenceUnit}`;
  }, [initialPriceNormalizedQuantity, initialPriceValue, productReferenceUnit]);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((product) => product.id === productId) ?? null;
  }, [productId, products]);

  useEffect(() => {
    if (draft) {
      setSourceItemId(draft.sourceShoppingItemId ?? null);
      setSourceItemWasAlreadyBought(draft.sourceShoppingItemChecked ?? false);
      setHasAppliedInitialPriceDefault(true);
      return;
    }

    if (!isEditing) {
      setSourceItemId(sourceShoppingItemId ?? null);
      setSourceItemWasAlreadyBought(sourceShoppingItemChecked === 'true');
      setForm((current) => ({
        ...emptyForm(),
        name: prefillNameParam?.trim() ? prefillNameParam : current.name,
      }));
      setMarkAsBought(shoppingModeActive === 'true');
      setInitialPriceForm({
        ...emptyInitialPriceForm(),
        storeId: selectedStoreIdFromRoute?.trim() ? selectedStoreIdFromRoute : null,
      });
      return;
    }

    if (selectedProduct) {
      setForm(toFormState(selectedProduct));
    }
  }, [draft, isEditing, prefillNameParam, selectedProduct, selectedStoreIdFromRoute, shoppingModeActive, sourceShoppingItemChecked, sourceShoppingItemId]);

  useEffect(() => {
    if (productsLoading) {
      setHasLoadedProducts(true);
    }
  }, [productsLoading]);

  useFocusEffect(
    useCallback(() => {
      void refreshStores();

      const currentDraft = peekProductEditorDraft();

      if (!currentDraft || isEditing) {
        return;
      }

      setForm({
        name: currentDraft.name,
        brand: currentDraft.brand,
        quantity: currentDraft.quantity,
        unit: currentDraft.unit,
        category: currentDraft.category,
      });
      setInitialPriceForm({
        storeId: currentDraft.initialPriceStoreId,
        price: currentDraft.initialPrice,
      });
      setSourceItemId(currentDraft.sourceShoppingItemId ?? null);
      setIncludeInitialPrice(currentDraft.includeInitialPrice);
      setMarkAsBought(currentDraft.markAsBought);
      setHasAppliedInitialPriceDefault(true);
      setOpenField(null);
    }, [isEditing, refreshStores])
  );

  const handleSave = async () => {
    if (!activeHouseholdId) {
      void hapticError();
      Alert.alert('Falta hogar activo', 'Selecciona un hogar para continuar.');
      return;
    }

    if (!form.name.trim()) {
      void hapticError();
      Alert.alert('Nombre requerido', 'Introduce un nombre.');
      return;
    }

    if (!form.unit) {
      void hapticError();
      Alert.alert('Unidad requerida', 'Selecciona una unidad para el producto.');
      return;
    }

    const quantity = parseQuantity(form.quantity);
    if (!quantity || quantity <= 0) {
      void hapticError();
      Alert.alert('Cantidad requerida', 'Introduce una cantidad válida para el producto.');
      return;
    }

    const shouldCreateInitialPrice = !isEditing && includeInitialPrice;

    if (shouldCreateInitialPrice) {
      if (!initialPriceForm.storeId) {
        void hapticError();
        Alert.alert('Tienda requerida', 'Selecciona una tienda para guardar el precio inicial, o deja la sección vacía.');
        return;
      }

      const priceValue = parsePrice(initialPriceForm.price);
      if (!priceValue || priceValue <= 0) {
        void hapticError();
        Alert.alert('Precio inválido', 'Introduce un precio inicial válido, o deja la sección vacía.');
        return;
      }
    }

    setSaving(true);
    try {
      if (isEditing) {
        if (!productId) {
          throw new Error('No se pudo identificar el producto a editar');
        }

        await updateProduct({
          id: productId,
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          quantity,
          unit: form.unit,
          category: form.category || null,
        });
      } else {
        const createdProduct = await createProduct({
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          quantity,
          unit: form.unit,
          category: form.category || null,
        });

        if (shouldCreateInitialPrice) {
          const priceValue = parsePrice(initialPriceForm.price);

          await createPrice({
            productId: createdProduct.id,
            storeId: initialPriceForm.storeId as string,
            priceCents: Math.round((priceValue as number) * 100),
            quantity,
            unit: form.unit,
          });
        }

        if (sourceItemId) {
          await attachProductToItem({
            itemId: sourceItemId,
            productId: createdProduct.id,
            text: createdProduct.name,
            markAsChecked: markAsBought,
          });
        }
      }

      void hapticSuccess();

      clearProductEditorDraft();

      if (draft?.finalReturnTo) {
        router.replace(draft.finalReturnTo);
        return;
      }

      router.back();
    } catch (err) {
      void hapticError();
      showGenericErrorAlert();
    } finally {
      setSaving(false);
    }
  };

  const title = isEditing ? 'Editar producto' : 'Crear producto';
  const subtitle = isEditing
    ? 'Actualiza el nombre, marca, cantidad, unidad y categoría.'
    : 'Añade un nuevo producto al catálogo de tu hogar.';

  const sortedStores = useMemo(
    () =>
      [...stores]
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((store) => ({ label: store.name, value: store.id })),
    [stores]
  );

  useEffect(() => {
    if (draft || isEditing || hasAppliedInitialPriceDefault || storesLoading) {
      return;
    }

    setIncludeInitialPrice(sortedStores.length > 0);
    setHasAppliedInitialPriceDefault(true);
  }, [draft, hasAppliedInitialPriceDefault, isEditing, sortedStores.length, storesLoading]);

  const createStoreRoute = useMemo(
    () => ({
      pathname: '/modals/store-editor' as const,
      params: {
        returnTo: '/modals/product-editor',
        sourceShoppingItemId: sourceItemId ?? '',
        sourceShoppingItemChecked: sourceItemWasAlreadyBought ? 'true' : 'false',
        shoppingModeActive: shoppingModeActive === 'true' ? 'true' : 'false',
      },
    }),
    [shoppingModeActive, sourceItemId, sourceItemWasAlreadyBought]
  );

  const handleCreateStore = () => {
    const finalReturnTo = sourceItemId ? '/(tabs)/list' : '/(tabs)/products';

    saveProductEditorDraft({
      name: form.name,
      brand: form.brand,
      quantity: form.quantity,
      unit: form.unit,
      category: form.category,
      includeInitialPrice,
      initialPriceStoreId: initialPriceForm.storeId,
      initialPrice: initialPriceForm.price,
      shoppingModeActive: shoppingModeActive === 'true',
      markAsBought,
      sourceShoppingItemId: sourceItemId,
      sourceShoppingItemChecked: sourceItemWasAlreadyBought,
      finalReturnTo,
    });

    router.push(createStoreRoute);
  };

  const handleCancel = () => {
    clearProductEditorDraft();
    router.back();
  };

  if (!activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title={title} subtitle={subtitle}>
          <EmptyState
            title="Falta hogar activo"
            subtitle="Selecciona un hogar para crear o editar productos."
            actionLabel="Cerrar"
            onAction={handleCancel}
          />
        </SectionCard>
      </Screen>
    );
  }

  if (isEditing && !selectedProduct) {
    if (!hasLoadedProducts || productsLoading) {
      return (
        <Screen scrollable>
          <SectionCard title={title} subtitle={subtitle}>
            <EmptyState
              title="Cargando producto"
              subtitle="Preparando los datos para editar."
              actionLabel="Cerrar"
              onAction={handleCancel}
            />
          </SectionCard>
        </Screen>
      );
    }

    return (
      <Screen scrollable>
        <SectionCard title={title} subtitle={subtitle}>
          <EmptyState
            title="Producto no encontrado"
            subtitle="No se pudo cargar el producto seleccionado."
            actionLabel="Cerrar"
            onAction={handleCancel}
          />
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <SectionCard title={title} subtitle={subtitle}>
        <View style={styles.form}>
          <AppInput
            label="Nombre *"
            placeholder="Ej. Leche entera"
            value={form.name}
            onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
          />
          <AppInput
            label="Marca (opcional)"
            placeholder="Sin marca"
            value={form.brand}
            onChangeText={(text) => setForm((current) => ({ ...current, brand: text }))}
          />
          <View style={styles.quantityRow}>
            <View style={styles.quantityField}>
              <AppInput
                label="Cantidad *"
                placeholder="Ej. 500"
                value={form.quantity}
                onChangeText={(text) => setForm((current) => ({ ...current, quantity: sanitizeQuantityInput(text) }))}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.unitField}>
              <DropdownSelect
                label="Unidad *"
                placeholder="Selecciona una unidad"
                value={form.unit}
                options={unitOptions}
                isOpen={openField === 'unit'}
                field="unit"
                onToggle={() => setOpenField((current) => (current === 'unit' ? null : 'unit'))}
                onChange={(unit) => {
                  setForm((current) => ({ ...current, unit }));
                  setOpenField(null);
                }}
                setOpenField={setOpenField}
              />
            </View>
          </View>
          <DropdownSelect
            label="Categoría (opcional)"
            placeholder="Sin categoría"
            value={form.category}
            options={PRODUCT_CATEGORY_OPTIONS}
            isOpen={openField === 'category'}
            field="category"
            onToggle={() => setOpenField((current) => (current === 'category' ? null : 'category'))}
            onChange={(category) => {
              setForm((current) => ({ ...current, category }));
              setOpenField(null);
            }}
            setOpenField={setOpenField}
          />

          {!isEditing ? (
            <View style={styles.priceOptionalBlock}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: includeInitialPrice }}
                onPress={() =>
                  setIncludeInitialPrice((current) => {
                    const next = !current;
                    if (!next) {
                      setOpenField((field) => (field === 'priceStore' ? null : field));
                    }
                    return next;
                  })
                }
                style={({ pressed }) => [styles.priceToggle, pressed && styles.priceTogglePressed]}
              >
                <View style={[styles.checkboxBox, includeInitialPrice && styles.checkboxBoxChecked]}>
                  {includeInitialPrice ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <View style={styles.priceToggleTextBlock}>
                  <Text style={styles.priceToggleTitle}>Registrar precio inicial</Text>
                </View>
              </Pressable>

              {includeInitialPrice ? (
                <View style={styles.priceForm}>
                  {storesLoading ? (
                    <View style={styles.loadingCard}>
                      <Text style={styles.loadingText}>Cargando tiendas…</Text>
                    </View>
                  ) : sortedStores.length === 0 ? (
                    <View style={styles.emptyPriceHint}>
                      <Text style={styles.emptyPriceHintText}>
                        No hay tiendas creadas todavía. Puedes guardar el producto sin precio y añadirlo después.
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleCreateStore}
                        style={({ pressed }) => [styles.emptyPriceHintLink, pressed && styles.emptyPriceHintLinkPressed]}
                      >
                        <Text style={styles.emptyPriceHintLinkText}>Crear tienda</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <DropdownSelect
                        label="Tienda"
                        placeholder="Selecciona una tienda"
                        value={initialPriceForm.storeId ?? ''}
                        options={sortedStores}
                        isOpen={openField === 'priceStore'}
                        field="priceStore"
                        onToggle={() => setOpenField((current) => (current === 'priceStore' ? null : 'priceStore'))}
                        onChange={(storeId) => {
                          setInitialPriceForm((current) => ({ ...current, storeId }));
                          setOpenField(null);
                        }}
                        setOpenField={setOpenField}
                        footerAction={{ label: 'Crear tienda', onPress: handleCreateStore }}
                      />

                      <View style={styles.initialPriceRow}>
                        <View style={styles.initialPriceInputWrap}>
                          <AppInput
                            label="Precio"
                            placeholder="Ej. 1,99"
                            value={initialPriceForm.price}
                            onChangeText={(text) => setInitialPriceForm((current) => ({ ...current, price: text }))}
                            keyboardType="decimal-pad"
                          />
                        </View>

                        <View style={styles.initialPriceReferenceBox}>
                          <Text style={styles.initialPriceReferenceLabel}>Equivale a</Text>
                          <Text style={styles.initialPriceReferenceValue}>
                            {initialPricePerReferenceUnitLabel ?? '—'}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          ) : null}

          {canMarkAsBought ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: markAsBought }}
              onPress={() => setMarkAsBought((current) => !current)}
              style={({ pressed }) => [styles.shoppingToggle, pressed && styles.shoppingTogglePressed]}
            >
              <View style={[styles.checkboxBox, markAsBought && styles.checkboxBoxChecked]}>
                {markAsBought ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <View style={styles.shoppingToggleTextBlock}>
                <Text style={styles.shoppingToggleTitle}>Marcar como comprado en la lista</Text>
                <Text style={styles.shoppingToggleSubtitle}>
                  Si lo activas, al guardar este producto quedará marcado como comprado en la lista de la compra.
                </Text>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.actions}>
            <PrimaryButton
              title="Guardar"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              fullWidth
            />
            <SecondaryButton title="Cancelar" onPress={handleCancel} fullWidth />
          </View>
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  priceOptionalBlock: {
    gap: 10,
    paddingTop: 2,
    paddingBottom: 4,
  },
  shoppingToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE8DF',
    backgroundColor: '#F8FBF8',
  },
  shoppingTogglePressed: {
    opacity: 0.96,
  },
  priceToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE8DF',
    backgroundColor: '#F8FBF8',
  },
  priceTogglePressed: {
    opacity: 0.96,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#B8C9BE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    borderColor: tokens.colors.primaryDark,
    backgroundColor: tokens.colors.primaryDark,
  },
  checkboxMark: {
    color: tokens.colors.surface,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 12,
  },
  shoppingToggleTextBlock: {
    flex: 1,
    gap: 2,
  },
  shoppingToggleTitle: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  shoppingToggleSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 15,
  },
  priceToggleTextBlock: {
    flex: 1,
    gap: 2,
  },
  priceToggleTitle: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  priceToggleSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 15,
  },
  priceForm: {
    gap: 10,
    paddingLeft: 30,
  },
  emptyPriceHint: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 12,
  },
  emptyPriceHintText: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyPriceHintLink: {
    alignSelf: 'flex-start',
    marginTop: 2,
    minHeight: 28,
    paddingHorizontal: 2,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  emptyPriceHintLinkPressed: {
    opacity: 0.7,
  },
  emptyPriceHintLinkText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  loadingCard: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  loadingText: {
    color: tokens.colors.textMuted,
    fontSize: 12,
  },
  initialPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  initialPriceInputWrap: {
    flex: 0.9,
  },
  initialPriceReferenceBox: {
    flex: 1.1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#DDE8DF',
    borderRadius: 16,
    backgroundColor: '#F8FBF8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 2,
  },
  initialPriceReferenceLabel: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  initialPriceReferenceValue: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  quantityField: {
    flex: 1.1,
  },
  unitField: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  dropdownField: {
    gap: 10,
    position: 'relative',
    zIndex: 1,
  },
  dropdownFieldOpen: {
    zIndex: 20,
  },
  dropdownButton: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.surface,
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
    fontWeight: '500',
  },
  dropdownButtonPlaceholder: {
    color: '#98A2B3',
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.12)',
  },
  dropdownChevron: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    marginTop: 6,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    overflow: 'hidden',
    maxHeight: 260,
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
    paddingTop: 6,
    paddingBottom: 6,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F0',
  },
  dropdownFooterButton: {
    minHeight: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  dropdownFooterButtonPressed: {
    opacity: 0.82,
  },
  dropdownFooterButtonIcon: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownFooterButtonText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownItem: {
    minHeight: 44,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    justifyContent: 'center',
  },
  dropdownItemActive: {
    backgroundColor: tokens.colors.primarySoft,
  },
  dropdownItemPressed: {
    opacity: 0.95,
  },
  dropdownItemText: {
    color: tokens.colors.text,
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: tokens.colors.primaryDark,
  },
  actions: {
    gap: 8,
    marginTop: 6,
  },
});