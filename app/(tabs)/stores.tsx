import { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { EmptyState } from '../../src/components/EmptyState';
import { SwipeTabs } from '../../src/components/SwipeTabs';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useStores } from '../../src/hooks/useStores';
import { hapticMedium, hapticTap } from '../../src/lib/haptics';
import { hasPrices } from '../../src/services/store.service';
import { getStoreVisual } from '../../src/theme/visuals';
import { tokens } from '../../src/theme/tokens';

export default function StoresScreen() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { stores, loading, error, deleteStore, refresh } = useStores(activeHouseholdId);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const sortedStores = useMemo(
    () => [...stores].sort((left, right) => left.name.localeCompare(right.name)),
    [stores]
  );
  const storeVisual = getStoreVisual();

  const handleDelete = async (id: string) => {
    try {
      const existsPrices = await hasPrices(id);
      if (existsPrices) {
        Alert.alert(
          'No se puede borrar',
          'Esta tienda tiene precios asociados. Borra los precios primero.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Ver precios',
              onPress: () => router.push({ pathname: '/modals/store-prices', params: { storeId: id } }),
            },
          ]
        );
        return;
      }

      await deleteStore(id);
      void hapticMedium();
    } catch (err) {
      Alert.alert('Error al borrar', (err as Error).message);
    }
  };

  if (!activeHouseholdId) {
    return (
      <Screen>
        <View style={styles.center}>
          <EmptyState
            title="Selecciona un hogar"
            subtitle="Necesitas un hogar activo para gestionar las tiendas."
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable includeBottomSafeArea={false}>
      <SwipeTabs style={styles.page}>
        <View style={styles.heroHeader}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>LISTO</Text>
            <Text style={styles.pageTitle}>Tiendas</Text>
            <Text style={styles.pageSubtitle}>Gestiona las tiendas donde registras tus precios.</Text>
          </View>
          {loading ? <Text style={styles.loadingText}>Actualizando tiendas…</Text> : null}
          <View style={styles.heroOrbPrimary} />
          <View style={styles.heroOrbSecondary} />
        </View>

        <View style={styles.contentStack}>
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <Text style={styles.inputCardTitle}>Tus tiendas</Text>
              <Text style={styles.inputCardSubtitle}>Edita o crea nuevas tiendas para tu hogar.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/modals/store-editor')}
              style={({ pressed }) => [styles.primaryCta, pressed && styles.primaryCtaPressed]}
            >
              <Text style={styles.primaryCtaText}>+ Añadir tienda</Text>
            </Pressable>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleGroup}>
                <View style={[styles.sectionIconWrap, { backgroundColor: storeVisual.backgroundColor }]}>
                  <Ionicons name={storeVisual.icon} size={16} color={storeVisual.color} />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Lista de tiendas</Text>
                  <Text style={styles.sectionHint}>{sortedStores.length} tiendas disponibles</Text>
                </View>
              </View>
            </View>

            {error ? (
              <View style={styles.errorCard}>
                <View style={styles.errorRail} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {sortedStores.length === 0 && !loading ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  title="No hay tiendas todavía"
                  subtitle="Crea tu primera tienda para empezar a registrar precios."
                />
              </View>
            ) : (
              <View style={styles.rowsGroup}>
                {sortedStores.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/modals/store-prices', params: { storeId: item.id } })}
                    onLongPress={() => handleDelete(item.id)}
                    style={({ pressed }) => [styles.storeRow, pressed && styles.storeRowPressed]}
                  >
                    <View style={[styles.storeBadge, { backgroundColor: storeVisual.backgroundColor }]}>
                      <Ionicons name={storeVisual.icon} size={18} color={storeVisual.color} />
                    </View>

                    <Text style={styles.storeName}>{item.name}</Text>
                    <View style={styles.chevronWrap}>
                      <Ionicons name="chevron-forward" size={16} color="#475467" />
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
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
    paddingBottom: 0,
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
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHint: {
    color: '#667085',
    fontSize: 13,
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  rowsGroup: {
    gap: 12,
  },
  emptyWrap: {
    paddingTop: 8,
  },
  storeRow: {
    minHeight: 74,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 14,
    paddingRight: 10,
  },
  storeBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBadgeText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '800',
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryCta: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: tokens.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: tokens.colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  primaryCtaPressed: {
    opacity: 0.92,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
