import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { AppInput } from '../../src/components/AppInput';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useProducts } from '../../src/hooks/useProducts';
import { Product, ProductUnit } from '../../src/domain/product';
import { hapticError, hapticSuccess } from '../../src/lib/haptics';
import { tokens } from '../../src/theme/tokens';
import { attachProductToItem } from '../../src/services/shoppingList.service';

type ProductFormState = {
  name: string;
  brand: string;
  quantity: string;
  unit: ProductUnit | '';
  category: ProductCategory | '';
};

type SelectOption<T extends string> = {
  label: string;
  value: T;
};

type DropdownField = 'unit' | 'category' | null;

const categoryOptions = [
  { label: 'Fruta y verdura', value: 'Fruta y verdura' },
  { label: 'Carnes y charcutería', value: 'Carnes y charcutería' },
  { label: 'Pescado y marisco', value: 'Pescado y marisco' },
  { label: 'Lácteos y huevos', value: 'Lácteos y huevos' },
  { label: 'Panadería y bollería', value: 'Panadería y bollería' },
  { label: 'Despensa y conservas', value: 'Despensa y conservas' },
  { label: 'Aceites', value: 'Aceites' },
  { label: 'Salsas y condimentos', value: 'Salsas y condimentos' },
  { label: 'Pasta, arroz y legumbres', value: 'Pasta, arroz y legumbres' },
  { label: 'Aceitunas y encurtidos', value: 'Aceitunas y encurtidos' },
  { label: 'Congelados', value: 'Congelados' },
  { label: 'Bebidas', value: 'Bebidas' },
  { label: 'Café, té e infusiones', value: 'Café, té e infusiones' },
  { label: 'Snacks y dulces', value: 'Snacks y dulces' },
  { label: 'Higiene personal', value: 'Aseo personal' },
  { label: 'Limpieza del hogar', value: 'Limpieza del hogar' },
  { label: 'Bebés e infantil', value: 'Bebés e infantil' },
  { label: 'Mascotas', value: 'Mascotas' },
  { label: 'Parafarmacia y salud', value: 'Salud y farmacia' },
  { label: 'Otros', value: 'otros' },
] as const;

type ProductCategory = (typeof categoryOptions)[number]['value'];

const emptyForm = (): ProductFormState => ({
  name: '',
  brand: '',
  quantity: '',
  unit: '',
  category: '',
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

function sanitizeQuantityInput(value: string) {
  const cleaned = value.replace(/[^0-9,]/g, '');
  const firstCommaIndex = cleaned.indexOf(',');

  if (firstCommaIndex === -1) {
    return cleaned;
  }

  return cleaned.slice(0, firstCommaIndex + 1) + cleaned.slice(firstCommaIndex + 1).replace(/,/g, '');
}

function isCategoryOption(value: string): value is ProductCategory {
  return categoryOptions.some((option) => option.value === value);
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
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpenField(field);
    });
  };

  const closeMenu = () => setOpenField(null);
  const windowHeight = Dimensions.get('window').height;
  const menuTop = Math.min(anchor.y + anchor.height + 6, windowHeight - 276);

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
                top: menuTop,
                left: anchor.x,
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
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function toFormState(product: Product): ProductFormState {
  const category = product.category && isCategoryOption(product.category) ? product.category : '';

  return {
    name: product.name,
    brand: product.brand ?? '',
    quantity: product.quantity === null ? '' : String(product.quantity),
    unit: product.unit ?? '',
    category,
  };
}

export default function ProductEditorModal() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, loading: productsLoading, createProduct, updateProduct } = useProducts(activeHouseholdId);
  const params = useLocalSearchParams<{ productId?: string | string[] }>();
  const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const prefillNameParam = Array.isArray(params.name) ? params.name[0] : params.name;
  const sourceShoppingItemId = Array.isArray(params.sourceShoppingItemId)
    ? params.sourceShoppingItemId[0]
    : params.sourceShoppingItemId;
  const markAsBoughtParam = Array.isArray(params.markAsBought) ? params.markAsBought[0] : params.markAsBought;
  const shouldMarkShoppingItemAsBought = markAsBoughtParam !== 'false';
  const isEditing = Boolean(productId);
  const [form, setForm] = useState<ProductFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [hasLoadedProducts, setHasLoadedProducts] = useState(false);
  const [openField, setOpenField] = useState<DropdownField>(null);

  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return products.find((product) => product.id === productId) ?? null;
  }, [productId, products]);

  useEffect(() => {
    if (!isEditing) {
      setForm((current) => ({
        ...emptyForm(),
        name: prefillNameParam?.trim() ? prefillNameParam : current.name,
      }));
      return;
    }

    if (selectedProduct) {
      setForm(toFormState(selectedProduct));
    }
  }, [isEditing, prefillNameParam, selectedProduct]);

  useEffect(() => {
    if (productsLoading) {
      setHasLoadedProducts(true);
    }
  }, [productsLoading]);

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

    if (!form.category) {
      void hapticError();
      Alert.alert('Categoría requerida', 'Selecciona una categoría para el producto.');
      return;
    }

    setSaving(true);
    try {
      const quantity = parseQuantity(form.quantity);

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
          category: form.category,
        });
      } else {
        const createdProduct = await createProduct({
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          quantity,
          unit: form.unit,
          category: form.category,
        });

        if (sourceShoppingItemId) {
          await attachProductToItem({
            itemId: sourceShoppingItemId,
            productId: createdProduct.id,
            text: createdProduct.name,
            markAsChecked: shouldMarkShoppingItemAsBought,
          });
        }
      }

      void hapticSuccess();

      router.back();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al guardar', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const title = isEditing ? 'Editar producto' : 'Crear producto';
  const subtitle = isEditing
    ? 'Actualiza el nombre, marca, cantidad, unidad y categoría.'
    : 'Añade un nuevo producto al catálogo de tu hogar.';

  if (!activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title={title} subtitle={subtitle}>
          <EmptyState
            title="Falta hogar activo"
            subtitle="Selecciona un hogar para crear o editar productos."
            actionLabel="Cerrar"
            onAction={() => router.back()}
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
              onAction={() => router.back()}
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
            onAction={() => router.back()}
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
            label="Nombre"
            placeholder="Ej. Leche entera"
            value={form.name}
            onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
          />
          <AppInput
            label="Marca (opcional)"
            placeholder="Opcional"
            value={form.brand}
            onChangeText={(text) => setForm((current) => ({ ...current, brand: text }))}
          />
          <Text style={styles.optionalHint}>Si no quieres asignar marca, puedes dejar este campo vacío.</Text>
          <View style={styles.quantityRow}>
            <View style={styles.quantityField}>
              <AppInput
                label="Cantidad"
                placeholder="Ej. 500"
                value={form.quantity}
                onChangeText={(text) => setForm((current) => ({ ...current, quantity: sanitizeQuantityInput(text) }))}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.unitField}>
              <DropdownSelect
                label="Unidad"
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
            label="Categoría"
            placeholder="Selecciona una categoría"
            value={form.category}
            options={categoryOptions}
            isOpen={openField === 'category'}
            field="category"
            onToggle={() => setOpenField((current) => (current === 'category' ? null : 'category'))}
            onChange={(category) => {
              setForm((current) => ({ ...current, category }));
              setOpenField(null);
            }}
            setOpenField={setOpenField}
          />

          <View style={styles.actions}>
            <PrimaryButton
              title="Guardar"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              fullWidth
            />
            <SecondaryButton title="Cancelar" onPress={() => router.back()} fullWidth />
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
  optionalHint: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: -6,
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
  },
});