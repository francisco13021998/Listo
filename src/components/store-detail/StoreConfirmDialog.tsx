import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

type StoreConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'danger';
  hideCancel?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function StoreConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmTone = 'primary',
  hideCancel,
  loading,
  onConfirm,
  onClose,
}: StoreConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.eyebrow}>{confirmTone === 'danger' ? 'CONFIRMACIÓN' : 'AVISO'}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.confirmButton,
                confirmTone === 'danger' ? styles.confirmButtonDanger : styles.confirmButtonPrimary,
                pressed && styles.confirmButtonPressed,
                loading && styles.disabledButton,
              ]}
            >
              <Text style={styles.confirmButtonText}>{loading ? 'Un momento…' : confirmLabel}</Text>
            </Pressable>

            {!hideCancel ? (
              <Pressable accessibilityRole="button" onPress={onClose} disabled={loading} style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}>
                <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
  },
  description: {
    color: '#475467',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  confirmButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  confirmButtonPrimary: {
    backgroundColor: tokens.colors.primaryDark,
  },
  confirmButtonDanger: {
    backgroundColor: '#B42318',
  },
  confirmButtonPressed: {
    opacity: 0.92,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  cancelButtonPressed: {
    backgroundColor: '#F9FAFB',
  },
  cancelButtonText: {
    color: '#344054',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
});