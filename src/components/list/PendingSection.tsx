import { Animated, StyleSheet, Text, View } from 'react-native';
import { ShoppingListItem } from '../../domain/shoppingList';
import { EmptyPriceGroup } from './EmptyPriceGroup';
import { PendingItemRow } from './PendingItemRow';
import { StoreGroup } from './StoreGroup';

type PendingGroup = {
  key: string;
  label: string;
  items: ShoppingListItem[];
  isUnpriced: boolean;
};

type PendingSectionProps = {
  groups: PendingGroup[];
  totalCount: number;
  empty: boolean;
  loading?: boolean;
  menuOpenItemId: string | null;
  animationsByItemId: Record<string, { checked: Animated.Value; mount: Animated.Value }>;
  getPriceSummary: (item: ShoppingListItem) => { priceLabel: string | null; unitPriceLabel: string | null };
  onToggle: (item: ShoppingListItem) => void;
  onToggleMenu: (itemId: string) => void;
  onViewProduct: (item: ShoppingListItem) => void;
  onManagePrice: (item: ShoppingListItem) => void;
  onRegisterProduct: (item: ShoppingListItem) => void;
  onDelete: (item: ShoppingListItem) => void;
};

export function PendingSection({
  groups,
  totalCount,
  empty,
  loading,
  menuOpenItemId,
  animationsByItemId,
  getPriceSummary,
  onToggle,
  onToggleMenu,
  onViewProduct,
  onManagePrice,
  onRegisterProduct,
  onDelete,
}: PendingSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Pendientes</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{totalCount}</Text>
        </View>
      </View>

      {empty ? (
        loading ? null : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No hay pendientes</Text>
          </View>
        )
      ) : (
        <View style={styles.groups}>
          {groups.map((group) => {
            const content = group.items.map((item, index) => {
              const animations = animationsByItemId[item.id] ?? {
                checked: new Animated.Value(item.is_checked ? 1 : 0),
                mount: new Animated.Value(1),
              };
              const summary = getPriceSummary(item);

              return (
                <PendingItemRow
                  key={item.id}
                  item={item}
                  priceLabel={summary.priceLabel}
                  unitPriceLabel={summary.unitPriceLabel}
                  menuOpen={menuOpenItemId === item.id}
                  showDivider={index > 0}
                  checkedAnimation={animations.checked}
                  mountAnimation={animations.mount}
                  onToggle={() => onToggle(item)}
                  onToggleMenu={() => onToggleMenu(item.id)}
                  onViewProduct={() => onViewProduct(item)}
                  onManagePrice={() => onManagePrice(item)}
                  onRegisterProduct={() => onRegisterProduct(item)}
                  onDelete={() => onDelete(item)}
                />
              );
            });

            if (group.isUnpriced) {
              return (
                <EmptyPriceGroup key={group.key} count={group.items.length}>
                  {content}
                </EmptyPriceGroup>
              );
            }

            return (
              <StoreGroup key={group.key} title={group.label} count={group.items.length} subtle>
                {content}
              </StoreGroup>
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
    backgroundColor: '#EAF4ED',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  countText: {
    color: '#176B3A',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyState: {
    borderRadius: 16,
    backgroundColor: '#F7FBF8',
    borderWidth: 1,
    borderColor: '#DCE6DE',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  groups: {
    gap: 16,
  },
});