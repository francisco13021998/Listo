import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

type ProductConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ProductConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  loading,
  onConfirm,
  onClose,
}: ProductConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.eyebrow}>CONFIRMACIÓN</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed, loading && styles.disabledButton]}
            >
              <Text style={styles.confirmButtonText}>{loading ? 'Eliminando…' : confirmLabel}</Text>
            </Pressable>

            <Pressable accessibilityRole="button" onPress={onClose} disabled={loading} style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}>
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </Pressable>
          </View>
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