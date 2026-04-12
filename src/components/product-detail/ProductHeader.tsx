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
    <View style={styles.hero}>
      <View style={styles.topRow}>
        <BackIconButton label="Volver" onPress={onBack} />
        <MenuIconButton label="Abrir acciones" onPress={onOpenActions} />
      </View>

      <View style={styles.identityRow}>
        <View style={[styles.iconWrap, { backgroundColor: categoryIconBackground }]}>
          <Ionicons name={categoryIcon} size={16} color={categoryIconColor} />
        </View>

        <Text style={styles.sectionTitle}>Detalle de producto</Text>
      </View>
      <Text style={styles.title}>{productName}</Text>
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}

      <View style={styles.pricePanel}>
        <Text style={styles.pricePanelLabel}>Precio más barato</Text>
        <Text style={styles.pricePanelValue}>{latestPriceLabel ?? 'Sin precios todavía'}</Text>
        <Text style={styles.pricePanelMeta}>{latestMetaLabel ?? 'Usa el menú de acciones para registrar el primer precio.'}</Text>
      </View>

    </View>
  );
}

function BackIconButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
      <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
    </Pressable>
  );
}

function MenuIconButton({
  label,
  onPress,
}: {
  label: string;
  onPress: (anchor: { x: number; y: number }) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(event) => onPress({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY })}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: tokens.colors.primaryDark,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  iconButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  summary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  pricePanel: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pricePanelLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
  },
  pricePanelValue: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  pricePanelMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});