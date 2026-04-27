import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';
import { FloatingMenuAnchor, getFloatingMenuStyle } from '../../lib/floatingMenu';

type PendingItemMenuProps = {
  visible: boolean;
  anchor: FloatingMenuAnchor | null;
  onClose: () => void;
  canEdit: boolean;
  canViewProduct: boolean;
  canManagePrice: boolean;
  canRegisterProduct: boolean;
  onEdit: () => void;
  onViewProduct: () => void;
  onManagePrice: () => void;
  onRegisterProduct: () => void;
  onDelete: () => void;
};

type ActionItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function isActionItem(value: ActionItem | null): value is ActionItem {
  return value !== null;
}

export function PendingItemMenu({
  visible,
  anchor,
  onClose,
  canEdit,
  canViewProduct,
  canManagePrice,
  canRegisterProduct,
  onEdit,
  onViewProduct,
  onManagePrice,
  onRegisterProduct,
  onDelete,
}: PendingItemMenuProps) {
  if (!visible) {
    return null;
  }

  const menuWidth = 220;
  const unorderedActions: Array<ActionItem | null> = canRegisterProduct
    ? [
        canRegisterProduct ? { icon: 'add-circle-outline' as const, label: 'Añadir producto', onPress: onRegisterProduct } : null,
        canEdit ? { icon: 'pencil-outline' as const, label: 'Editar elemento', onPress: onEdit } : null,
        canViewProduct ? { icon: 'cube-outline' as const, label: 'Ver producto', onPress: onViewProduct } : null,
        canManagePrice ? { icon: 'pricetag-outline' as const, label: 'Añadir precio', onPress: onManagePrice } : null,
        { icon: 'trash-outline' as const, label: 'Eliminar de la lista', onPress: onDelete, danger: true },
      ]
    : [
        canEdit ? { icon: 'pencil-outline' as const, label: 'Editar elemento', onPress: onEdit } : null,
        canViewProduct ? { icon: 'cube-outline' as const, label: 'Ver producto', onPress: onViewProduct } : null,
        canManagePrice ? { icon: 'pricetag-outline' as const, label: 'Añadir precio', onPress: onManagePrice } : null,
        canRegisterProduct ? { icon: 'add-circle-outline' as const, label: 'Añadir producto', onPress: onRegisterProduct } : null,
        { icon: 'trash-outline' as const, label: 'Eliminar de la lista', onPress: onDelete, danger: true },
      ];

  const orderedActions: ActionItem[] = unorderedActions.filter(isActionItem);

  const menuHeight = orderedActions.length * 44 + 12;
  const menuStyle = getFloatingMenuStyle(anchor, { menuWidth, menuHeight });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.menu, { width: menuWidth, left: menuStyle.left, top: menuStyle.top }]} onPress={() => undefined}>
          {orderedActions.map((action) => (
            <MenuAction
              key={action.label}
              icon={action.icon}
              label={action.label}
              onPress={action.onPress}
              danger={action.danger}
            />
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function getItemMenuVisibility(itemHasProduct: boolean) {
  return {
    canEdit: !itemHasProduct,
    canViewProduct: itemHasProduct,
    canManagePrice: itemHasProduct,
    canRegisterProduct: !itemHasProduct,
  };
}

function MenuAction({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}>
      <Ionicons name={icon} size={16} color={danger ? '#B42318' : '#344054'} />
      <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
  menu: {
    minWidth: 198,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    padding: 6,
    shadowColor: '#101828',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 30,
  },
  menuItem: {
    minHeight: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  menuItemPressed: {
    backgroundColor: '#F3F6F2',
  },
  menuItemText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemDanger: {
    color: '#B42318',
  },
});