import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useStores } from '../../src/hooks/useStores';
import {
  deleteAllPricesForStore,
  deletePricesForStoreAndProduct,
  deleteSinglePriceEntry,
  listPricesForStoreGroupedByProduct,
} from '../../src/services/prices.service';
import { tokens } from '../../src/theme/tokens';

type PriceEntryItem = {
  id: string;
  price_cents: number;
  purchased_at: string;
};

type ProductPriceGroup = {
  product_id: string;
  product_name: string;
  prices: Array<PriceEntryItem>;
};

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES');
}

export default function StorePricesModal() {
  const router = useRouter();
  const { storeId } = useLocalSearchParams<{ storeId?: string }>();
  const { activeHouseholdId } = useActiveHousehold();
  const { stores } = useStores(activeHouseholdId);
  const [groups, setGroups] = useState<Array<ProductPriceGroup>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const storeName = useMemo(() => {
    return stores.find((store) => store.id === storeId)?.name ?? 'Supermercado';
  }, [storeId, stores]);

  const load = useCallback(async () => {
    if (!storeId || !activeHouseholdId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPricesForStoreGroupedByProduct({ householdId: activeHouseholdId, storeId });
      setGroups(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [storeId, activeHouseholdId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDeleteEntry = async (id: string) => {
    setActionLoading(true);
    try {
      await deleteSinglePriceEntry(id);
      await load();
    } catch (err) {
      Alert.alert('Error al borrar precio', (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!storeId || !activeHouseholdId) return;
    Alert.alert('Eliminar precios del producto', 'Borrarás todos los precios de este producto en este supermercado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await deletePricesForStoreAndProduct({ householdId: activeHouseholdId, storeId, productId });
            await load();
          } catch (err) {
            Alert.alert('Error al borrar precios', (err as Error).message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAllStore = async () => {
    if (!storeId || !activeHouseholdId) return;
    Alert.alert('Eliminar todos los precios', 'Esta acción borrará todos los precios asociados a este supermercado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar todo',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await deleteAllPricesForStore({ householdId: activeHouseholdId, storeId });
            await load();
          } catch (err) {
            Alert.alert('Error al borrar precios', (err as Error).message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (!storeId || !activeHouseholdId) {
    return (
      <Screen scrollable>
        <View style={styles.page}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>LISTO</Text>
            <Text style={styles.title}>Eliminar precios</Text>
            <Text style={styles.subtitle}>Falta información de tienda u hogar para continuar.</Text>
          </View>

          <SectionCard title="No se puede continuar" subtitle="Necesitas un supermercado y un hogar activo.">
            <EmptyState
              title="Falta contexto"
              subtitle="Vuelve atrás y selecciona un supermercado válido dentro de un hogar activo."
              actionLabel="Cerrar"
              onAction={() => router.back()}
            />
          </SectionCard>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>LISTO</Text>
          <Text style={styles.title}>Eliminar precios</Text>
          <Text style={styles.subtitle}>
            Limpia los precios de {storeName} antes de borrar el supermercado. Puedes eliminar todo o hacerlo uno a uno.
          </Text>
        </View>

        <SectionCard title="Resumen" subtitle="Acciones rápidas sobre este supermercado.">
          <View style={styles.summaryRow}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Productos con precios</Text>
              <Text style={styles.summaryChipValue}>{groups.length}</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Estado</Text>
              <Text style={styles.summaryChipValue}>{loading ? 'Cargando' : 'Listo'}</Text>
            </View>
          </View>

          <View style={styles.bulkActions}>
            {groups.length > 0 ? (
              <>
                <PrimaryButton
                  title="Eliminar todos los precios"
                  onPress={() => void handleDeleteAllStore()}
                  disabled={actionLoading}
                  loading={actionLoading}
                  fullWidth
                />
                <SecondaryButton title="Cerrar" onPress={() => router.back()} fullWidth />
              </>
            ) : null}
          </View>
        </SectionCard>

        {loading && !hasLoaded ? (
          <SectionCard title="Cargando" subtitle="Preparando los precios asociados a este supermercado.">
            <Text style={styles.helperText}>Cargando precios…</Text>
          </SectionCard>
        ) : null}

        {error ? (
          <SectionCard title="No se pudieron cargar los precios">
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorActions}>
              <PrimaryButton title="Reintentar" onPress={() => void load()} fullWidth />
            </View>
          </SectionCard>
        ) : null}

        {!loading && !error && groups.length === 0 ? (
          <SectionCard title="Todo limpio" subtitle="No quedan precios asociados a este supermercado.">
            <EmptyState
              title="Sin precios asociados"
              subtitle="Ya puedes volver atrás."
              actionLabel="Cerrar"
              onAction={() => router.back()}
            />
          </SectionCard>
        ) : null}

        {!loading && !error && groups.length > 0 ? (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <SectionCard key={group.product_id} title={group.product_name} subtitle={`${group.prices.length} precio(s) guardado(s)`}>
                <Pressable
                  accessibilityRole="button"
                  disabled={actionLoading}
                  onPress={() => void handleDeleteProduct(group.product_id)}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.dangerButtonPressed,
                    actionLoading && styles.disabledButton,
                  ]}
                >
                  <Text style={styles.dangerButtonText}>Eliminar precios de este producto</Text>
                </Pressable>

                <View style={styles.priceRows}>
                  {group.prices.map((entry) => {
                    const amount = formatPrice(entry.price_cents);
                    const dateLabel = formatDate(entry.purchased_at);

                    return (
                      <View key={entry.id} style={styles.priceRow}>
                        <View style={styles.priceMeta}>
                          <Text style={styles.priceAmount}>{amount}</Text>
                          <Text style={styles.priceDate}>{dateLabel}</Text>
                        </View>

                        <Pressable
                          accessibilityRole="button"
                          disabled={actionLoading}
                          onPress={() => void handleDeleteEntry(entry.id)}
                          style={({ pressed }) => [
                            styles.inlineDanger,
                            pressed && styles.inlineDangerPressed,
                            actionLoading && styles.disabledButton,
                          ]}
                        >
                          <Text style={styles.inlineDangerText}>Borrar</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              </SectionCard>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 14,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  hero: {
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  eyebrow: {
    color: tokens.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subtitle: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  summaryChip: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: tokens.colors.primarySoft,
    borderWidth: 1,
    borderColor: '#D7E9DB',
    gap: 4,
  },
  summaryChipLabel: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryChipValue: {
    color: tokens.colors.primaryDark,
    fontSize: 20,
    fontWeight: '800',
  },
  bulkActions: {
    gap: 8,
  },
  helperText: {
    color: tokens.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: tokens.colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  errorActions: {
    marginTop: 4,
  },
  groupsList: {
    gap: 12,
  },
  dangerButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  dangerButtonPressed: {
    opacity: 0.92,
  },
  dangerButtonText: {
    color: '#B42318',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  priceRows: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAF8',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceMeta: {
    flex: 1,
    gap: 2,
  },
  priceAmount: {
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  priceDate: {
    color: tokens.colors.textMuted,
    fontSize: 12,
  },
  inlineDanger: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineDangerPressed: {
    opacity: 0.92,
  },
  inlineDangerText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
