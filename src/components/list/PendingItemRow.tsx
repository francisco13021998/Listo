import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListItem } from '../../domain/shoppingList';
import { tokens } from '../../theme/tokens';
import { PendingItemMenu, getItemMenuVisibility } from './PendingItemMenu';

type PendingItemRowProps = {
  item: ShoppingListItem;
  priceLabel: string | null;
  unitPriceLabel: string | null;
  productMeta: { brandLabel: string | null; measureLabel: string | null } | null;
  menuOpen?: boolean;
  menuAnchor: { x: number; y: number } | null;
  showDivider?: boolean;
  checkedAnimation: Animated.Value;
  mountAnimation: Animated.Value;
  onToggle: () => void;
  onToggleMenu: (anchor: { x: number; y: number }) => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onViewProduct: () => void;
  onManagePrice: () => void;
  onRegisterProduct: () => void;
  onDelete: () => void;
};

export function PendingItemRow({
  item,
  priceLabel,
  unitPriceLabel,
  productMeta,
  menuOpen,
  menuAnchor,
  showDivider,
  checkedAnimation,
  mountAnimation,
  onToggle,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onViewProduct,
  onManagePrice,
  onRegisterProduct,
  onDelete,
}: PendingItemRowProps) {
  const markerScale = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const checkOpacity = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const textOpacity = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.72],
  });

  const rowOpacity = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82],
  });

  const markerBackgroundColor = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#E7F6ED'],
  });

  const markerBorderColor = checkedAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#BFC8D4', '#176B3A'],
  });

  const rowTranslateY = mountAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        showDivider && styles.cardDivider,
        menuOpen && styles.cardMenuOpen,
        {
          opacity: Animated.multiply(mountAnimation, rowOpacity),
          transform: [{ translateY: rowTranslateY }],
        },
      ]}
    >
      <Pressable accessibilityRole="button" onPress={onToggle} style={({ pressed }) => [styles.mainAction, pressed && styles.mainActionPressed]}>
        <Animated.View
          style={[
            styles.checkbox,
            {
              backgroundColor: markerBackgroundColor,
              borderColor: markerBorderColor,
              transform: [{ scale: markerScale }],
            },
          ]}
        >
          <Animated.Text style={[styles.checkboxText, { opacity: checkOpacity }]}>✓</Animated.Text>
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Animated.Text style={[styles.title, { opacity: textOpacity }]} numberOfLines={1}>
              {item.text}
            </Animated.Text>

            {productMeta?.brandLabel ? (
              <Text style={styles.brandChip} numberOfLines={1}>
                {productMeta.brandLabel}
              </Text>
            ) : null}
          </View>

          {priceLabel ? (
            <View style={styles.priceRow}>
              <View style={styles.priceMainLine}>
                <Text style={styles.priceLabel}>{priceLabel}</Text>
                {productMeta?.measureLabel ? (
                  <Text style={styles.measureLabel} numberOfLines={1}>
                    {productMeta.measureLabel}
                  </Text>
                ) : null}
              </View>

              {unitPriceLabel ? <Text style={styles.unitPricePill}>{unitPriceLabel}</Text> : null}
            </View>
          ) : (
            <Text style={styles.missingPriceLabel}>
              {item.product_id ? 'Precio no añadido' : 'Producto no registrado'}
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Opciones de ${item.text}`}
        onPress={(event) => {
          event.stopPropagation();
          onToggleMenu({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
        }}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <Ionicons name="ellipsis-vertical" size={16} color="#475467" />
      </Pressable>

      <PendingItemMenu
        visible={Boolean(menuOpen)}
        anchor={menuAnchor}
        onClose={onCloseMenu}
        {...getItemMenuVisibility(Boolean(item.product_id))}
        onEdit={onEdit}
        onViewProduct={onViewProduct}
        onManagePrice={onManagePrice}
        onRegisterProduct={onRegisterProduct}
        onDelete={onDelete}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  cardDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E8EEEA',
  },
  cardMenuOpen: {
    zIndex: 40,
    elevation: 10,
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  mainActionPressed: {
    opacity: 0.95,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxText: {
    color: tokens.colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: 5,
    paddingTop: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  title: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  brandChip: {
    maxWidth: '42%',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F2F4F7',
    color: '#475467',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  priceMainLine: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
  },
  priceLabel: {
    color: tokens.colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  measureLabel: {
    flexShrink: 1,
    color: '#667085',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
  },
  unitPricePill: {
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#EAF4ED',
    color: tokens.colors.primaryDark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  missingPriceLabel: {
    color: '#667B70',
    fontSize: 12,
    fontWeight: '700',
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
    opacity: 0.9,
  },
});