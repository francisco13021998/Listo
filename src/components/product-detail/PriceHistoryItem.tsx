import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type PriceHistoryItemProps = {
  storeName: string;
  priceLabel: string;
  measureLabel: string | null;
  unitPriceLabel: string | null;
  dateLabel: string;
  isCheapest: boolean;
  onOpenMenu: (anchor: { x: number; y: number }) => void;
};

export function PriceHistoryItem({
  storeName,
  priceLabel,
  measureLabel,
  unitPriceLabel,
  dateLabel,
  isCheapest,
  onOpenMenu,
}: PriceHistoryItemProps) {
  return (
    <View style={styles.row}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.storeRow}>
            <View style={styles.storeDot} />
            <Text style={styles.storeName} numberOfLines={1}>{storeName}</Text>
          </View>
          {isCheapest ? (
            <View style={styles.cheapestBadge}>
              <Ionicons name="trending-down" size={11} color="#146C43" />
              <Text style={styles.cheapestText}>Más barato</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          {measureLabel ? <Text style={styles.measureLabel}>{measureLabel}</Text> : null}
        </View>

        <View style={styles.metaRow}>
          {unitPriceLabel ? <Text style={styles.metaText}>{unitPriceLabel}</Text> : null}
          <Text style={styles.metaText}>{dateLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={(e) => onOpenMenu({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
        style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
      >
        <Ionicons name="ellipsis-vertical" size={16} color={tokens.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  storeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.primary,
    flexShrink: 0,
  },
  storeName: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cheapestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E8F5EE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cheapestText: {
    color: '#146C43',
    fontSize: 11,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  measureLabel: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaText: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F8',
    flexShrink: 0,
  },
  menuBtnPressed: {
    backgroundColor: '#E5E9EF',
  },
});