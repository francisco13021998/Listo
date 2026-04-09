import { useEffect, useMemo, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useStores } from '../../src/hooks/useStores';
import {
  deletePricesForStoreAndProduct,
  listPriceHistoryForProductFiltered,
} from '../../src/services/prices.service';
import { PriceEntry } from '../../src/domain/prices';

export default function ProductPricesModal() {
  const router = useRouter();
  const { productId, storeId } = useLocalSearchParams<{ productId?: string; storeId?: string }>();
  const { activeHouseholdId } = useActiveHousehold();
  const { stores } = useStores(activeHouseholdId);
  const [entries, setEntries] = useState<PriceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const storeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    stores.forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [stores]);

  const load = async () => {
    if (!productId || !activeHouseholdId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPriceHistoryForProductFiltered({
        householdId: activeHouseholdId,
        productId,
        storeId: storeId || undefined,
      });
      setEntries(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [productId, storeId, activeHouseholdId]);

  const handleDelete = async () => {
    if (!storeId || !productId || !activeHouseholdId) return;
    setDeleting(true);
    try {
      await deletePricesForStoreAndProduct({ householdId: activeHouseholdId, storeId, productId });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (!productId || !activeHouseholdId) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Precios del producto</Text>
        <Text>Falta información necesaria.</Text>
        <Button title="Cerrar" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Precios del producto</Text>
      {storeId ? <Text style={styles.subtle}>Filtrado por esta tienda</Text> : null}
      {storeId ? (
        <Button
          title="Eliminar TODOS los precios de esta tienda"
          onPress={handleDelete}
          disabled={deleting}
        />
      ) : null}
      {loading ? <Text>Cargando…</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const amount = (item.price_cents / 100).toFixed(2);
          const dateLabel = new Date(item.purchased_at).toLocaleDateString();
          const storeLabel = storeId ? '' : ` · ${storeNameById[item.store_id] ?? 'Tienda'}`;
          return (
            <View style={styles.card}>
              <Text>{`${amount} € · ${dateLabel}${storeLabel}`}</Text>
            </View>
          );
        }}
        ListEmptyComponent={!loading ? <Text>No hay precios.</Text> : null}
      />
      <Button title="Cerrar" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtle: {
    color: '#6b7280',
  },
  listContent: {
    gap: 8,
    paddingBottom: 24,
  },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  error: {
    color: 'red',
  },
});
