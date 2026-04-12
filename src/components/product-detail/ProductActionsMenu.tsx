import { Dimensions, Pressable, Modal, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type MenuAnchor = {
  x: number;
  y: number;
};

type ProductActionsMenuProps = {
  visible: boolean;
  anchor: MenuAnchor | null;
  productName: string;
  loading?: boolean;
  onAddPrice: () => void;
  onEditProduct: () => void;
  onDeleteProduct: () => void;
  onClose: () => void;
};

export function ProductActionsMenu({
  visible,
  anchor,
  productName,
  loading,
  onAddPrice,
  onEditProduct,
  onDeleteProduct,
  onClose,
}: ProductActionsMenuProps) {
  const menuWidth = 228;
  const screen = Dimensions.get('window');
  const left = anchor ? Math.max(12, Math.min(anchor.x - menuWidth + 28, screen.width - menuWidth - 12)) : 12;
  const top = anchor ? Math.max(12, Math.min(anchor.y + 12, screen.height - 220)) : 12;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { left, top, width: menuWidth }]} onPress={() => undefined}>
          <MenuAction icon="pricetag-outline" label="Añadir precio" onPress={onAddPrice} disabled={loading} />
          <MenuAction icon="create-outline" label="Editar producto" onPress={onEditProduct} disabled={loading} />
          <MenuAction icon="trash-outline" label="Eliminar producto" onPress={onDeleteProduct} danger disabled={loading} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuAction({
  icon,
  label,
  onPress,
  danger,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.menuItem, pressed && !disabled && styles.menuItemPressed, disabled && styles.menuItemDisabled]}
    >
      <Ionicons name={icon} size={18} color={danger ? '#B42318' : disabled ? '#98A2B3' : '#344054'} />
      <Text style={[styles.menuItemText, danger && styles.menuItemDanger, disabled && styles.menuItemTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  sheet: {
    position: 'absolute',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 6,
    gap: 0,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  menuItem: {
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  menuItemPressed: {
    backgroundColor: '#F3F6F2',
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  menuItemText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemDanger: {
    color: '#B42318',
  },
  menuItemTextDisabled: {
    color: '#98A2B3',
  },
});