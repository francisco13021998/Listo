import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppInput } from '../AppInput';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { tokens } from '../../theme/tokens';

type LeaveHouseholdDialogProps = {
  visible: boolean;
  householdName: string;
  isDeletingLastMember: boolean;
  confirmValue: string;
  error?: string | null;
  loading?: boolean;
  onChangeConfirmValue: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function LeaveHouseholdDialog({
  visible,
  householdName,
  isDeletingLastMember,
  confirmValue,
  error,
  loading,
  onChangeConfirmValue,
  onConfirm,
  onClose,
}: LeaveHouseholdDialogProps) {
  const title = isDeletingLastMember ? 'Eliminar este hogar' : '¿Dejar este hogar?';
  const subtitle = isDeletingLastMember
    ? 'Eres la única persona en este hogar. Si sigues, se eliminará por completo junto con sus productos, tiendas y precios.'
    : 'Vas a salir de este hogar. Podrás volver a entrar solo si alguien te invita otra vez.';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.eyebrow}>CONFIRMACIÓN</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {isDeletingLastMember ? (
            <>
              <Text style={styles.warningText}>Para continuar, escribe exactamente el nombre del hogar:</Text>
              <AppInput
                label="Nombre del hogar"
                placeholder={householdName}
                value={confirmValue}
                onChangeText={onChangeConfirmValue}
              />
            </>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <PrimaryButton
            title={loading ? (isDeletingLastMember ? 'Eliminando...' : 'Saliendo...') : isDeletingLastMember ? 'Eliminar hogar' : 'Dejar hogar'}
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            fullWidth
          />
          <SecondaryButton title="Cancelar" onPress={onClose} fullWidth />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  eyebrow: {
    color: '#9F1239',
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
  warningText: {
    color: '#9F1239',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});