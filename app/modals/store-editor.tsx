import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { AppInput } from '../../src/components/AppInput';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { useStores } from '../../src/hooks/useStores';
import { Store } from '../../src/domain/store';
import { hapticError, hapticSuccess } from '../../src/lib/haptics';
import { peekProductEditorDraft, saveProductEditorDraft } from '../../src/state/storeCreationDrafts.store';

type StoreFormState = {
  name: string;
};

const emptyForm = (): StoreFormState => ({
  name: '',
});

function toFormState(store: Store): StoreFormState {
  return {
    name: store.name,
  };
}

export default function StoreEditorModal() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const { stores, loading: storesLoading, createStore, updateStore, deleteStore } = useStores(activeHouseholdId);
  const params = useLocalSearchParams<{
    storeId?: string | string[];
    returnTo?: string | string[];
    productId?: string | string[];
    priceId?: string | string[];
    finalReturnTo?: string | string[];
    sourceShoppingItemId?: string | string[];
    sourceShoppingItemChecked?: string | string[];
    shoppingModeActive?: string | string[];
  }>();
  const storeId = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId;
  const returnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnProductId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
  const returnPriceId = Array.isArray(params.priceId) ? params.priceId[0] : params.priceId;
  const finalReturnTo = Array.isArray(params.finalReturnTo) ? params.finalReturnTo[0] : params.finalReturnTo;
  const sourceShoppingItemId = Array.isArray(params.sourceShoppingItemId) ? params.sourceShoppingItemId[0] : params.sourceShoppingItemId;
  const sourceShoppingItemChecked = Array.isArray(params.sourceShoppingItemChecked)
    ? params.sourceShoppingItemChecked[0]
    : params.sourceShoppingItemChecked;
  const shoppingModeActive = Array.isArray(params.shoppingModeActive) ? params.shoppingModeActive[0] : params.shoppingModeActive;
  const isEditing = Boolean(storeId);
  const [form, setForm] = useState<StoreFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [hasLoadedStores, setHasLoadedStores] = useState(false);

  const selectedStore = useMemo(() => {
    if (!storeId) return null;
    return stores.find((store) => store.id === storeId) ?? null;
  }, [storeId, stores]);

  useEffect(() => {
    if (!isEditing) {
      setForm(emptyForm());
      return;
    }

    if (selectedStore) {
      setForm(toFormState(selectedStore));
    }
  }, [isEditing, selectedStore]);

  useEffect(() => {
    if (storesLoading) {
      setHasLoadedStores(true);
    }
  }, [storesLoading]);

  useEffect(() => {
    if (!isEditing) return;

    if (hasLoadedStores && !storesLoading && !selectedStore) {
      router.replace('/(tabs)/stores');
    }
  }, [hasLoadedStores, isEditing, router, selectedStore, storesLoading]);

  const handleSave = async () => {
    if (!activeHouseholdId) {
      void hapticError();
      Alert.alert('Falta hogar activo', 'Selecciona un hogar para continuar.');
      return;
    }

    const name = form.name.trim();
    if (!name) {
      void hapticError();
      Alert.alert('Nombre requerido', 'Introduce un nombre.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        if (!storeId) {
          throw new Error('No se pudo identificar la tienda a editar');
        }

        await updateStore(storeId, name);
        void hapticSuccess();
        router.back();
        return;
      }

      const createdStore = await createStore(name);
      void hapticSuccess();

      if (returnTo === '/modals/product-editor') {
        const existingDraft = peekProductEditorDraft();

        if (existingDraft) {
          saveProductEditorDraft({
            ...existingDraft,
            initialPriceStoreId: createdStore.id,
            sourceShoppingItemId: existingDraft.sourceShoppingItemId ?? sourceShoppingItemId ?? null,
            sourceShoppingItemChecked: existingDraft.sourceShoppingItemChecked ?? sourceShoppingItemChecked === 'true',
            shoppingModeActive: existingDraft.shoppingModeActive ?? (shoppingModeActive === 'true'),
          });
        }

        router.back();
        return;
      }

      if (returnTo === '/modals/price-editor' && returnProductId) {
        router.replace({
          pathname: '/modals/price-editor',
          params: {
            productId: returnProductId,
            priceId: returnPriceId ?? '',
            returnTo: finalReturnTo ?? '',
            selectedStoreId: createdStore.id,
            sourceShoppingItemId: sourceShoppingItemId ?? '',
            sourceShoppingItemChecked: sourceShoppingItemChecked ?? '',
          },
        });
        return;
      }

      router.back();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al guardar', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const title = isEditing ? 'Editar tienda' : 'Crear tienda';
  const subtitle = isEditing
    ? 'Actualiza el nombre de la tienda.'
    : 'Añade una nueva tienda a tu lista.';

  if (!activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title={title} subtitle={subtitle}>
          <EmptyState
            title="Falta hogar activo"
            subtitle="Selecciona un hogar para crear o editar tiendas."
            actionLabel="Cerrar"
            onAction={() => router.back()}
          />
        </SectionCard>
      </Screen>
    );
  }

  if (isEditing && !selectedStore) {
    if (!hasLoadedStores || storesLoading) {
      return (
        <Screen scrollable>
          <SectionCard title={title} subtitle={subtitle}>
            <EmptyState
              title="Cargando tienda"
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
            title="Tienda no encontrada"
            subtitle="No se pudo cargar la tienda seleccionada."
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
        <AppInput
          label="Nombre"
          placeholder="Ej. Mercadona"
          value={form.name}
          onChangeText={(text) => setForm((current) => ({ ...current, name: text }))}
        />

        {isEditing ? (
          <View style={styles.actionsRow}>
            <View style={styles.actionItem}>
              <PrimaryButton title="Guardar" onPress={handleSave} loading={saving} disabled={saving} fullWidth />
            </View>
            <View style={styles.actionItem}>
              <SecondaryButton title="Cancelar" onPress={() => router.back()} fullWidth />
            </View>
          </View>
        ) : (
          <>
            <PrimaryButton title="Guardar" onPress={handleSave} loading={saving} disabled={saving} fullWidth />
            <SecondaryButton title="Cancelar" onPress={() => router.back()} fullWidth />
          </>
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionItem: {
    flex: 1,
  },
});