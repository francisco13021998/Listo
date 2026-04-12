import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppInput } from '../AppInput';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { tokens } from '../../theme/tokens';

type HouseholdAccessMode = 'create' | 'join';

type HouseholdAccessModalProps = {
  visible: boolean;
  mode: HouseholdAccessMode;
  onClose: () => void;
  onChangeMode: (mode: HouseholdAccessMode) => void;
  createName: string;
  onChangeCreateName: (value: string) => void;
  joinCode: string;
  onChangeJoinCode: (value: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  creating?: boolean;
  joining?: boolean;
};

export function HouseholdAccessModal({
  visible,
  mode,
  onClose,
  onChangeMode,
  createName,
  onChangeCreateName,
  joinCode,
  onChangeJoinCode,
  onCreate,
  onJoin,
  creating,
  joining,
}: HouseholdAccessModalProps) {
  const isCreate = mode === 'create';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.eyebrow}>LISTO</Text>
          <Text style={styles.title}>Tu hogar</Text>
          <Text style={styles.subtitle}>Crea uno nuevo o entra con el código que te compartieron.</Text>

          <View style={styles.switchRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChangeMode('create')}
              style={({ pressed }) => [styles.switchButton, isCreate && styles.switchButtonActive, pressed && styles.switchButtonPressed]}
            >
              <Text style={[styles.switchButtonText, isCreate && styles.switchButtonTextActive]}>Crear hogar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChangeMode('join')}
              style={({ pressed }) => [styles.switchButton, !isCreate && styles.switchButtonActive, pressed && styles.switchButtonPressed]}
            >
              <Text style={[styles.switchButtonText, !isCreate && styles.switchButtonTextActive]}>Entrar con código</Text>
            </Pressable>
          </View>

          {isCreate ? (
            <View style={styles.formBlock}>
              <Text style={styles.formTitle}>Crear hogar</Text>
              <Text style={styles.formHelp}>Ponle un nombre corto y claro.</Text>
              <AppInput
                label="Nombre del hogar"
                placeholder="Ej. Casa Paco"
                value={createName}
                onChangeText={onChangeCreateName}
              />
              <PrimaryButton title={creating ? 'Creando...' : 'Crear hogar'} onPress={onCreate} loading={creating} disabled={creating} fullWidth />
            </View>
          ) : (
            <View style={styles.formBlock}>
              <Text style={styles.formTitle}>Entrar con código</Text>
              <Text style={styles.formHelp}>Escribe el código que te enviaron.</Text>
              <AppInput
                label="Código de invitación"
                placeholder="Ej. AB12CD"
                value={joinCode}
                onChangeText={onChangeJoinCode}
              />
              <PrimaryButton title={joining ? 'Entrando...' : 'Entrar'} onPress={onJoin} loading={joining} disabled={joining} fullWidth />
            </View>
          )}

          <SecondaryButton title="Cerrar" onPress={onClose} fullWidth />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  eyebrow: {
    color: tokens.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475467',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  switchButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F6F8F7',
    borderWidth: 1,
    borderColor: '#DCE6DE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  switchButtonActive: {
    backgroundColor: '#E7F6ED',
    borderColor: tokens.colors.primaryDark,
  },
  switchButtonPressed: {
    opacity: 0.92,
  },
  switchButtonText: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  switchButtonTextActive: {
    color: tokens.colors.primaryDark,
  },
  formBlock: {
    gap: 10,
    backgroundColor: '#FAFCFA',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  formTitle: {
    color: tokens.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  formHelp: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});