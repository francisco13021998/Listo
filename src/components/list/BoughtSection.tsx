import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ShoppingListItem } from '../../domain/shoppingList';
import { tokens } from '../../theme/tokens';
import { PendingItemMenu, getItemMenuVisibility } from './PendingItemMenu';

type BoughtSectionProps = {
  items: ShoppingListItem[];
  empty: boolean;
  animationsByItemId: Record<string, { checked: Animated.Value; mount: Animated.Value }>;
  onToggle: (item: ShoppingListItem) => void;
  onEdit: (item: ShoppingListItem) => void;
  onViewProduct: (item: ShoppingListItem) => void;
  onManagePrice: (item: ShoppingListItem) => void;
  onRegisterProduct: (item: ShoppingListItem) => void;
  onDelete: (item: ShoppingListItem) => void;
  onClearAll: () => void;
};

export function BoughtSection({
  items,
  empty,
  animationsByItemId,
  onToggle,
  onEdit,
  onViewProduct,
  onManagePrice,
  onRegisterProduct,
  onDelete,
  onClearAll,
}: BoughtSectionProps) {
  const [openMenuItemId, setOpenMenuItemId] = useState<string | null>(null);
  const [openMenuAnchor, setOpenMenuAnchor] = useState<{ x: number; y: number } | null>(null);

  const closeMenu = () => {
    setOpenMenuItemId(null);
    setOpenMenuAnchor(null);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Comprados</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable accessibilityRole="button" onPress={onClearAll} style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}>
            <Ionicons name="trash-outline" size={14} color="#667085" />
            <Text style={styles.actionButtonText}>Vaciar</Text>
          </Pressable>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>
      </View>

      {empty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aún no hay comprados</Text>
        </View>
      ) : (
        <View style={styles.rows}>
          {items.map((item, index) => {
            const animation = animationsByItemId[item.id] ?? {
              checked: new Animated.Value(item.is_checked ? 1 : 0),
              mount: new Animated.Value(1),
            };
            const rowOpacity = animation.checked.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.78],
            });

            return (
              <Animated.View
                key={item.id}
                style={[
                  styles.row,
                  openMenuItemId === item.id && styles.rowMenuOpen,
                  { opacity: Animated.multiply(animation.mount, rowOpacity) },
                ]}
              >
                <Pressable accessibilityRole="button" onPress={() => onToggle(item)} style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}>
                  <View style={styles.rowCheck}>
                    <Text style={styles.rowCheckText}>✓</Text>
                  </View>
                  <Text style={styles.rowText}>{item.text}</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Opciones de ${item.text}`}
                  onPress={(event) => {
                    event.stopPropagation();
                    const anchor = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
                    setOpenMenuItemId((current) => {
                      if (current === item.id) {
                        setOpenMenuAnchor(null);
                        return null;
                      }

                      setOpenMenuAnchor(anchor);
                      return item.id;
                    });
                  }}
                  style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#475467" />
                </Pressable>

                <PendingItemMenu
                  visible={openMenuItemId === item.id}
                  anchor={openMenuAnchor}
                  onClose={closeMenu}
                  {...getItemMenuVisibility(Boolean(item.product_id))}
                  onEdit={() => onEdit(item)}
                  onViewProduct={() => onViewProduct(item)}
                  onManagePrice={() => onManagePrice(item)}
                  onRegisterProduct={() => onRegisterProduct(item)}
                  onDelete={() => onDelete(item)}
                />
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 2,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#F2F4F7',
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  actionButtonText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#EEF2F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  countText: {
    color: '#667085',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: '#F6F8F7',
    borderWidth: 1,
    borderColor: '#E3E8E5',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  rows: {
    gap: 8,
    overflow: 'visible',
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F6F8F7',
    borderWidth: 1,
    borderColor: '#E3E8E5',
    overflow: 'visible',
  },
  rowMenuOpen: {
    zIndex: 1000,
    elevation: 24,
  },
  rowPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.92,
  },
  rowCheck: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: '#E7F6ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCheckText: {
    color: '#176B3A',
    fontSize: 13,
    fontWeight: '800',
  },
  rowText: {
    flex: 1,
    color: '#98A2B3',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  menuButton: {
    position: 'relative',
    zIndex: 1001,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
    borderRadius: 12,
    backgroundColor: '#EEF7F0',
  },
  menuButtonPressed: {
    opacity: 0.9,
  },
});