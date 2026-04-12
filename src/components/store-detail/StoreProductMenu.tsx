import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type StoreProductMenuProps = {
  visible: boolean;
  loading?: boolean;
  onViewProduct: () => void;
  onEditPrice: () => void;
  onDeletePrices: () => void;
};

export function StoreProductMenu({ visible, loading, onViewProduct, onEditPrice, onDeletePrices }: StoreProductMenuProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.menu}>
      <MenuAction icon="cube-outline" label="Ver detalle del producto" onPress={onViewProduct} disabled={loading} />
      <MenuAction icon="pricetag-outline" label="Editar último precio" onPress={onEditPrice} disabled={loading} />
      <MenuAction icon="trash-outline" label="Borrar precios de este producto" onPress={onDeletePrices} danger disabled={loading} />
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
    top: 56,
    right: 12,
    zIndex: 30,
    minWidth: 224,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    padding: 6,
    shadowColor: '#101828',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
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