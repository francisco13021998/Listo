import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CatalogProductItem } from './types';
import { ProductOptionsMenu } from './ProductOptionsMenu';
import { tokens } from '../../theme/tokens';

type ProductCardProps = {
  item: CatalogProductItem;
  showDivider?: boolean;
  menuOpen: boolean;
  onPress: () => void;
  onToggleMenu: () => void;
  onViewProduct: () => void;
  onAddPrice: () => void;
  onEditProduct: () => void;
  onDeleteProduct: () => void;
};

export function ProductCard({
  item,
  menuOpen,
  onPress,
  onToggleMenu,
  onViewProduct,
  onAddPrice,
  onEditProduct,
  onDeleteProduct,
}: ProductCardProps) {
  return (
    <View style={[styles.card, menuOpen && styles.cardMenuOpen]}>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.mainAction, pressed && styles.mainActionPressed]}>
        <View style={[styles.avatar, { backgroundColor: item.visual.backgroundColor }]}>
          <Ionicons name={item.visual.icon} size={17} color={item.visual.color} />
        </View>

        <View style={styles.mainText}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            {item.categoryLabel ? (
              <View style={[styles.categoryPill, { backgroundColor: item.visual.backgroundColor }]}>
                <Text style={[styles.categoryLabel, { color: item.visual.color }]} numberOfLines={1}>
                  {item.categoryLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.latestPriceCaption}>Último precio</Text>

            <View style={styles.priceLine}>
              <Text style={[styles.latestPrice, !item.hasPrice && styles.latestPriceMuted]}>{item.latestPriceLabel}</Text>
              {item.latestMeasureLabel ? <View style={styles.measureChip}><Text style={styles.measureChipText}>{item.latestMeasureLabel}</Text></View> : null}
              {item.unitPriceLabel ? <View style={styles.unitPriceChip}><Text style={styles.unitPriceChipText}>{item.unitPriceLabel}</Text></View> : null}
            </View>
          </View>

          <Text style={styles.secondaryMeta}>{item.secondaryMetaLabel}</Text>
        </View>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel={`Opciones de ${item.name}`} onPress={onToggleMenu} style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
        <Ionicons name="ellipsis-vertical" size={16} color="#475467" />
      </Pressable>

      <ProductOptionsMenu
        visible={menuOpen}
        onViewProduct={onViewProduct}
        onAddPrice={onAddPrice}
        onEditProduct={onEditProduct}
        onDeleteProduct={onDeleteProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE6DE',
  },
  cardMenuOpen: {
    zIndex: 20,
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mainActionPressed: {
    opacity: 0.95,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  mainText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  name: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    minWidth: 0,
  },
  categoryPill: {
    maxWidth: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  priceRow: {
    gap: 5,
  },
  latestPriceCaption: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  latestPrice: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },
  latestPriceMuted: {
    color: '#475467',
  },
  measureChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#F2F4F7',
  },
  measureChipText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '600',
  },
  unitPriceChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E8F3EC',
  },
  unitPriceChipText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryMeta: {
    color: '#98A2B3',
    fontSize: 11,
    lineHeight: 16,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#F7F9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    opacity: 0.92,
  },
});