import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

type ProductHeaderProps = {
  productName: string;
  summary: string | null;
  latestPriceLabel: string | null;
  latestMetaLabel: string | null;
  categoryIcon: keyof typeof Ionicons.glyphMap;
  categoryIconColor: string;
  categoryIconBackground: string;
  onBack: () => void;
  onOpenActions: (anchor: { x: number; y: number }) => void;
};

export function ProductHeader({
  productName,
  summary,
  latestPriceLabel,
  latestMetaLabel,
  categoryIcon,
  categoryIconColor,
  categoryIconBackground,
  onBack,
  onOpenActions,
}: ProductHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Barra de navegación */}
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={onBack}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
        >
          <Ionicons name="chevron-back" size={20} color={tokens.colors.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Acciones del producto"
          onPress={(e) => onOpenActions({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={tokens.colors.text} />
        </Pressable>
      </View>

      {/* Identidad del producto */}
      <View style={styles.identity}>
        <View style={[styles.iconWrap, { backgroundColor: categoryIconBackground }]}>
          <Ionicons name={categoryIcon} size={28} color={categoryIconColor} />
        </View>
        <View style={styles.identityText}>
          <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
          {summary ? <Text style={styles.summary}>{summary}</Text> : null}
        </View>
      </View>

      {/* Tarjeta de mejor precio */}
      {latestPriceLabel ? (
        <View style={styles.priceCard}>
          <View style={styles.priceAccent} />
          <View style={styles.priceBody}>
            <Text style={styles.priceCardLabel}>Mejor precio registrado</Text>
            <Text style={styles.priceCardValue}>{latestPriceLabel}</Text>
            {latestMetaLabel ? <Text style={styles.priceCardMeta}>{latestMetaLabel}</Text> : null}
          </View>
          <Ionicons name="trending-down-outline" size={22} color={tokens.colors.primary} style={styles.trendIcon} />
        </View>
      ) : (
        <View style={styles.noPriceCard}>
          <Ionicons name="pricetag-outline" size={15} color={tokens.colors.textMuted} />
          <Text style={styles.noPriceText}>Aún sin precios · pulsa «Añadir» para el primero</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEAEA',
  },
  navBtnPressed: {
    backgroundColor: '#D5D5D5',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  identityText: {
    flex: 1,
    paddingTop: 4,
    gap: 4,
  },
  productName: {
    color: tokens.colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
  },
  summary: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  priceAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: tokens.colors.primary,
  },
  priceBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 1,
  },
  priceCardLabel: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceCardValue: {
    color: tokens.colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  priceCardMeta: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 2,
  },
  trendIcon: {
    paddingRight: 14,
  },
  noPriceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noPriceText: {
    color: tokens.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});