import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingListItem } from '../../domain/shoppingList';
import { tokens } from '../../theme/tokens';
import { PendingItemMenu } from './PendingItemMenu';

type PendingItemRowProps = {
  item: ShoppingListItem;
  priceLabel: string | null;
  unitPriceLabel: string | null;
  menuOpen?: boolean;
  showDivider?: boolean;
  checkedAnimation: Animated.Value;
  mountAnimation: Animated.Value;
  onToggle: () => void;
  onToggleMenu: () => void;
  onViewProduct: () => void;
  onManagePrice: () => void;
  onRegisterProduct: () => void;
  onDelete: () => void;
};

export function PendingItemRow({
  item,
  priceLabel,
  unitPriceLabel,
  menuOpen,
  showDivider,
  checkedAnimation,
  mountAnimation,
  onToggle,
  onToggleMenu,
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
          <Animated.Text style={[styles.title, { opacity: textOpacity }]} numberOfLines={2}>
            {item.text}
          </Animated.Text>

          {priceLabel ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{priceLabel}</Text>
              {unitPriceLabel ? <Text style={styles.unitPriceLabel}>{unitPriceLabel}</Text> : null}
            </View>
          ) : (
            <Text style={styles.missingPriceLabel}>Aún sin precio registrado</Text>
          )}
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Opciones de ${item.text}`}
        onPress={(event) => {
          event.stopPropagation();
          onToggleMenu();
        }}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <Ionicons name="ellipsis-vertical" size={16} color="#475467" />
      </Pressable>

      <PendingItemMenu
        visible={Boolean(menuOpen)}
        canViewProduct={Boolean(item.product_id)}
        canManagePrice={Boolean(item.product_id)}
        canRegisterProduct={!item.product_id}
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
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    gap: 12,
  },
  mainActionPressed: {
    opacity: 0.95,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxText: {
    color: tokens.colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    gap: 4,
    paddingTop: 1,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  unitPriceLabel: {
    color: tokens.colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  missingPriceLabel: {
    color: '#667B70',
    fontSize: 13,
    fontWeight: '700',
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
    opacity: 0.9,
  },
});