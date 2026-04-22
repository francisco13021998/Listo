import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { SectionCard } from '../../src/components/SectionCard';
import { AppInput } from '../../src/components/AppInput';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { EmptyState } from '../../src/components/EmptyState';
import { useActiveHousehold } from '../../src/hooks/useActiveHousehold';
import { hapticError, hapticSuccess } from '../../src/lib/haptics';
import { updateTextItem } from '../../src/services/shoppingList.service';

export default function ListItemEditorModal() {
  const router = useRouter();
  const { activeHouseholdId } = useActiveHousehold();
  const params = useLocalSearchParams<{ itemId?: string | string[]; currentText?: string | string[] }>();
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;
  const currentTextParam = Array.isArray(params.currentText) ? params.currentText[0] : params.currentText;
  const initialText = useMemo(() => currentTextParam?.trim() ?? '', [currentTextParam]);
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeHouseholdId) {
      void hapticError();
      Alert.alert('Falta hogar activo', 'Selecciona un hogar para continuar.');
      return;
    }

    if (!itemId) {
      void hapticError();
      Alert.alert('Elemento no encontrado', 'No se pudo identificar el elemento a editar.');
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      void hapticError();
      Alert.alert('Texto requerido', 'Escribe un texto para guardar el elemento.');
      return;
    }

    setSaving(true);
    try {
      await updateTextItem(itemId, trimmedText);
      void hapticSuccess();
      router.back();
    } catch (err) {
      void hapticError();
      Alert.alert('Error al guardar', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!activeHouseholdId) {
    return (
      <Screen scrollable>
        <SectionCard title="Editar elemento" subtitle="Modifica el texto del elemento de la lista.">
          <EmptyState
            title="Falta hogar activo"
            subtitle="Selecciona un hogar para editar elementos de la lista."
            actionLabel="Cerrar"
            onAction={() => router.back()}
          />
        </SectionCard>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <SectionCard title="Editar elemento" subtitle="Actualiza el texto del elemento de la lista.">
        <View style={styles.form}>
          <AppInput label="Texto" placeholder="Escribe el nuevo texto" value={text} onChangeText={setText} multiline />

          <View style={styles.actions}>
            <PrimaryButton title="Guardar" onPress={handleSave} loading={saving} disabled={saving} fullWidth />
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
  actions: {
    gap: 8,
  },
});