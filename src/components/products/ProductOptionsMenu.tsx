import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ProductOptionsMenuProps = {
  visible: boolean;
  onViewProduct: () => void;
  onAddPrice: () => void;
  onEditProduct: () => void;
  onDeleteProduct: () => void;
};

export function ProductOptionsMenu({ visible, onViewProduct, onAddPrice, onEditProduct, onDeleteProduct }: ProductOptionsMenuProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.menu}>
      <MenuAction icon="cube-outline" label="Ver producto" onPress={onViewProduct} />
      <MenuAction icon="pricetag-outline" label="Añadir precio" onPress={onAddPrice} />
      <MenuAction icon="create-outline" label="Editar producto" onPress={onEditProduct} />
      <MenuAction icon="trash-outline" label="Borrar producto" onPress={onDeleteProduct} danger />
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
    top: 46,
    right: 12,
    zIndex: 30,
    minWidth: 196,
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
  menuItemText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemDanger: {
    color: '#B42318',
  },
});