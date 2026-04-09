import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { AppInput } from '../../src/components/AppInput';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useProducts } from '../../src/hooks/useProducts';
import { useShoppingList } from '../../src/hooks/useShoppingList';

type ProductSummarySource = {
  brand: string | null;
  quantity: number | null;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'u' | null;
  category: string | null;
};

function buildProductSummary(product: ProductSummarySource) {
  const parts: string[] = [];

  if (product.brand?.trim()) parts.push(product.brand.trim());

  if (product.quantity !== null) {
    const quantityLabel = Number.isInteger(product.quantity) ? String(product.quantity) : String(product.quantity);
    parts.push(product.unit ? quantityLabel + ' ' + product.unit : quantityLabel);
  }

  if (product.category?.trim()) parts.push(product.category.trim());

  return parts.join(' · ');
}

export default function ListProductPickerModal() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { products, loading, error, refresh } = useProducts(activeHouseholdId);
  const { addProductItem } = useShoppingList(activeHouseholdId);
  const [query, setQuery] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;

    return products.filter((product) => {
      const haystack = [
        product.name,
        product.brand ?? '',
        product.category ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [products, query]);

  const handleSelectProduct = async (productId: string, name: string) => {
    setSubmittingId(productId);
    try {
      await addProductItem(productId, name);
      router.back();
    } catch (err) {
      Alert.alert('Error al añadir', (err as Error).message);
    } finally {
      setSubmittingId(null);
    }
  };

  if (!activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title="Añadir producto" subtitle="Busca un producto del catálogo para añadirlo a la lista.">
          <EmptyState
            title="Falta hogar activo"
            subtitle="Selecciona un hogar para continuar."
            actionLabel="Cerrar"
            onAction={() => router.back()}
          />
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <SectionCard title="Añadir producto" subtitle="Busca por nombre o filtra usando marca y categoría.">
          <AppInput
            label="Buscar"
            placeholder="Ej. leche, pasta, bebida"
            value={query}
            onChangeText={setQuery}
          />
          <SecondaryButton title="Cerrar" onPress={() => router.back()} fullWidth />
        </SectionCard>

        {loading ? <Text style={styles.loadingText}>Cargando productos…</Text> : null}
        {error ? (
          <SectionCard title="No se pudieron cargar los productos">
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <SecondaryButton title="Reintentar" onPress={() => void refresh()} fullWidth />
              <SecondaryButton title="Cerrar" onPress={() => router.back()} fullWidth />
            </View>
          </SectionCard>
        ) : null}

        {!loading && !error && filteredProducts.length === 0 ? (
          <EmptyState
            title={products.length === 0 ? 'No hay productos disponibles' : 'No hay resultados'}
            subtitle={products.length === 0 ? 'Crea productos primero para poder reutilizarlos aquí.' : 'Prueba con otra búsqueda.'}
            actionLabel={products.length === 0 ? 'Crear producto' : 'Limpiar búsqueda'}
            onAction={products.length === 0 ? () => router.push('/modals/product-editor') : () => setQuery('')}
            secondaryActionLabel="Cerrar"
            onSecondaryAction={() => router.back()}
          />
        ) : (
          <View style={styles.results}>
            {filteredProducts.map((product) => {
              const summary = buildProductSummary(product);
              const submitting = submittingId === product.id;

              return (
                <Pressable
                  key={product.id}
                  onPress={() => handleSelectProduct(product.id, product.name)}
                  disabled={submitting}
                  style={({ pressed }) => [styles.productRow, pressed && styles.productRowPressed, submitting && styles.productRowDisabled]}
                >
                  <View style={styles.productTextBlock}>
                    <Text style={styles.productName}>{product.name}</Text>
                    {summary ? <Text style={styles.productSummary}>{summary}</Text> : null}
                  </View>
                  <Text style={styles.productAction}>{submitting ? 'Añadiendo…' : 'Añadir'}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    lineHeight: 20,
  },
  errorActions: {
    gap: 8,
    marginTop: 12,
  },
  results: {
    gap: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  productRowPressed: {
    opacity: 0.86,
  },
  productRowDisabled: {
    opacity: 0.7,
  },
  productTextBlock: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  productSummary: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  productAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F6FED',
  },
});