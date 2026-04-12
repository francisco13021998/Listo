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
  const detailParts = [measureLabel, unitPriceLabel].filter(Boolean);

  return (
    <View style={styles.row}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{priceLabel}</Text>
          {isCheapest ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Más barato</Text>
            </View>
          ) : null}
        </View>

        {detailParts.length ? <Text style={styles.detailText}>{detailParts.join(' · ')}</Text> : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={(event) => onOpenMenu({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <Ionicons name="ellipsis-vertical" size={18} color="#475467" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  storeName: {
    flex: 1,
    color: tokens.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  dateLabel: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceLabel: {
    color: tokens.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  detailText: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E8F5EE',
  },
  badgeText: {
    color: '#146C43',
    fontSize: 11,
    fontWeight: '800',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F8',
    marginTop: 2,
  },
  menuButtonPressed: {
    backgroundColor: '#E9EEF2',
  },
});