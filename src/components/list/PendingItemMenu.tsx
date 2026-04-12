import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type PendingItemMenuProps = {
  visible: boolean;
  canViewProduct: boolean;
  canManagePrice: boolean;
  canRegisterProduct: boolean;
  onViewProduct: () => void;
  onManagePrice: () => void;
  onRegisterProduct: () => void;
  onDelete: () => void;
};

export function PendingItemMenu({
  visible,
  canViewProduct,
  canManagePrice,
  canRegisterProduct,
  onViewProduct,
  onManagePrice,
  onRegisterProduct,
  onDelete,
}: PendingItemMenuProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.menu}>
      {canViewProduct ? (
        <MenuAction icon="cube-outline" label="Ver producto" onPress={onViewProduct} />
      ) : null}

      {canManagePrice ? (
        <MenuAction icon="pricetag-outline" label="Añadir o editar precio" onPress={onManagePrice} />
      ) : null}

      {canRegisterProduct ? (
        <MenuAction icon="add-circle-outline" label="Registrar como producto" onPress={onRegisterProduct} />
      ) : null}

      <MenuAction icon="trash-outline" label="Eliminar de la lista" onPress={onDelete} danger />
    </View>
  );
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
  menu: {
    position: 'absolute',
    top: 48,
    right: 8,
    zIndex: 60,
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
    elevation: 12,
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