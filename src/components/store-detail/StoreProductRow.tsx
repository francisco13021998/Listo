import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StoreProductMenu } from './StoreProductMenu';
import { StoreProductListItem } from './types';
import { tokens } from '../../theme/tokens';

type StoreProductRowProps = {
  item: StoreProductListItem;
  showDivider?: boolean;
  menuOpen: boolean;
  loading?: boolean;
  onViewProduct: () => void;
  onToggleMenu: () => void;
  onEditPrice: () => void;
  onDeletePrices: () => void;
};

export function StoreProductRow({
  item,
  showDivider,
  menuOpen,
  loading,
  onViewProduct,
  onToggleMenu,
  onEditPrice,
  onDeletePrices,
}: StoreProductRowProps) {
  const extraMeta = [item.measureLabel, item.unitPriceLabel].filter(Boolean).join(' · ');

  return (
    <View style={[styles.row, showDivider && styles.rowDivider, menuOpen && styles.rowMenuOpen]}>
      <View style={styles.mainAction}>
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={2}>{item.productName}</Text>
          <Text style={styles.price}>{item.priceLabel}</Text>
          {extraMeta ? <Text style={styles.meta}>{extraMeta}</Text> : null}
          <Text style={styles.updatedText}>{item.updatedAtLabel}</Text>
        </View>
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Acciones de ${item.productName}`} onPress={onToggleMenu} style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}>
        <Text style={styles.menuGlyph}>⋮</Text>
      </Pressable>

      <StoreProductMenu visible={menuOpen} loading={loading} onViewProduct={onViewProduct} onEditPrice={onEditPrice} onDeletePrices={onDeletePrices} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E8EEEA',
  },
  rowMenuOpen: {
    zIndex: 15,
    elevation: 8,
  },
  mainAction: {
    flex: 1,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  price: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
  },
  meta: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  updatedText: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F7F9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonPressed: {
    opacity: 0.92,
  },
  menuGlyph: {
    color: '#475467',
    fontSize: 18,
    lineHeight: 18,
    fontWeight: '700',
  },
});