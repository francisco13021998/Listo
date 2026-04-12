import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type StoreActionsMenuProps = {
  visible: boolean;
  loading?: boolean;
  canDeletePrices: boolean;
  onEditStore: () => void;
  onDeleteAllPrices: () => void;
  onDeleteStore: () => void;
};

export function StoreActionsMenu({
  visible,
  loading,
  canDeletePrices,
  onEditStore,
  onDeleteAllPrices,
  onDeleteStore,
}: StoreActionsMenuProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.menu}>
      <MenuAction icon="create-outline" label="Editar tienda" onPress={onEditStore} disabled={loading} />
      <MenuAction icon="layers-outline" label="Borrar todos los precios" onPress={onDeleteAllPrices} disabled={loading || !canDeletePrices} />
      <MenuAction icon="trash-outline" label="Eliminar tienda" onPress={onDeleteStore} danger disabled={loading} />
    </View>
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
      <Ionicons name={icon} size={16} color={danger ? '#B42318' : disabled ? '#98A2B3' : '#344054'} />
      <Text style={[styles.menuItemText, danger && styles.menuItemDanger, disabled && styles.menuItemTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    zIndex: 40,
    minWidth: 220,
    borderRadius: 18,
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