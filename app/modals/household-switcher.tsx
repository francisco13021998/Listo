import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useHouseholds } from '../../src/hooks/useHouseholds';
import { hapticError, hapticTap } from '../../src/lib/haptics';

export default function HouseholdSwitcherModal() {
  const router = useRouter();
  const { setActiveHouseholdId } = useActiveHousehold();
  const { households, loading, error, refresh } = useHouseholds();

  const handleSelect = async (householdId: string) => {
    try {
      await setActiveHouseholdId(householdId);
      void hapticTap();
      router.back();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al cambiar hogar', (err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Cambiar hogar</Text>
      {loading && <Text>Cargando hogares…</Text>}
      {error ? (
        <View style={styles.stateCard}>
          <EmptyState
            title="No pudimos cargar los hogares"
            subtitle={error}
            actionLabel="Reintentar"
            onAction={() => void refresh()}
            secondaryActionLabel="Cerrar"
            onSecondaryAction={() => router.back()}
          />
        </View>
      ) : null}
      {households.map((h) => (
        <View key={h.id} style={styles.card}>
          <Text style={{ fontWeight: '600' }}>{h.name}</Text>
          <PrimaryButton title="Seleccionar" onPress={() => void handleSelect(h.id)} fullWidth />
        </View>
      ))}
      {!loading && !error && households.length === 0 ? (
        <View style={styles.stateCard}>
          <EmptyState
            title="No tienes hogares aún"
            subtitle="Crea un hogar para empezar a organizar productos, tiendas y listas."
            actionLabel="Cerrar"
            onAction={() => router.back()}
          />
        </View>
      ) : null}
      <SecondaryButton title="Cerrar" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: 12,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    gap: 6,
  },
  stateCard: {
    marginTop: 4,
  },
});
