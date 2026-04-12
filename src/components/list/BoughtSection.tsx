import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShoppingListItem } from '../../domain/shoppingList';

type BoughtSectionProps = {
  items: ShoppingListItem[];
  empty: boolean;
  animationsByItemId: Record<string, { checked: Animated.Value; mount: Animated.Value }>;
  onToggle: (item: ShoppingListItem) => void;
};

export function BoughtSection({ items, empty, animationsByItemId, onToggle }: BoughtSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Comprados</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      {empty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aún no hay comprados</Text>
        </View>
      ) : (
        <View style={styles.rows}>
          {items.map((item) => {
            const animation = animationsByItemId[item.id] ?? {
              checked: new Animated.Value(item.is_checked ? 1 : 0),
              mount: new Animated.Value(1),
            };
            const rowOpacity = animation.checked.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.78],
            });

            return (
              <Animated.View key={item.id} style={[styles.row, { opacity: Animated.multiply(animation.mount, rowOpacity) }]}>
                <Pressable accessibilityRole="button" onPress={() => onToggle(item)} style={({ pressed }) => [styles.rowPressable, pressed && styles.rowPressed]}>
                  <View style={styles.rowCheck}>
                    <Text style={styles.rowCheckText}>✓</Text>
                  </View>
                  <Text style={styles.rowText}>{item.text}</Text>
                </Pressable>
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
  },
  row: {
    borderRadius: 16,
    backgroundColor: '#F6F8F7',
    borderWidth: 1,
    borderColor: '#E3E8E5',
  },
  rowPressable: {
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
});