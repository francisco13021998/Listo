import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../EmptyState';
import { tokens } from '../../theme/tokens';
import { PriceHistoryItem } from './PriceHistoryItem';

export type PriceHistoryEntryViewModel = {
  id: string;
  storeName: string;
  priceLabel: string;
  measureLabel: string | null;
  unitPriceLabel: string | null;
  dateLabel: string;
  isCheapest: boolean;
};

type PriceHistorySectionProps = {
  entries: PriceHistoryEntryViewModel[];
  loading: boolean;
  error: string | null;
  storeCount: number;
  onOpenEntryMenu: (entryId: string, anchor: { x: number; y: number }) => void;
  onAddPrice: () => void;
};

export function PriceHistorySection({ entries, loading, error, storeCount, onOpenEntryMenu, onAddPrice }: PriceHistorySectionProps) {
  const entryCount = entries.length;

  return (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.cardIcon}>
              <Ionicons name="pricetags-outline" size={15} color={tokens.colors.primary} />
            </View>
            <View>
              <Text style={styles.cardTitle}>Precios registrados</Text>
              {!loading && !error && entryCount > 0 ? (
                <Text style={styles.cardSubtitle}>
                  {entryCount} {entryCount === 1 ? 'precio' : 'precios'} · {storeCount} {storeCount === 1 ? 'tienda' : 'tiendas'}
                </Text>
              ) : null}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onAddPrice}
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Añadir</Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        {loading ? (
          <Text style={styles.statusText}>Cargando precios…</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : entryCount === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="Sin precios todavía"
              subtitle="Pulsa «Añadir» para registrar el primer precio."
            />
          </View>
        ) : (
          <View style={styles.itemsList}>
            {entries.map((entry, index) => (
              <View key={entry.id} style={index < entries.length - 1 ? styles.itemSeparator : undefined}>
                <PriceHistoryItem
                  storeName={entry.storeName}
                  priceLabel={entry.priceLabel}
                  measureLabel={entry.measureLabel}
                  unitPriceLabel={entry.unitPriceLabel}
                  dateLabel={entry.dateLabel}
                  isCheapest={entry.isCheapest}
                  onOpenMenu={(anchor) => onOpenEntryMenu(entry.id, anchor)}
                />
              </View>
            ))}
          </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: tokens.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardSubtitle: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnPressed: {
    opacity: 0.82,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F2F4',
  },
  statusText: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: tokens.colors.textMuted,
    fontSize: 13,
  },
  errorText: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    color: '#B42318',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 8,
  },
  itemsList: {
    // no gap — dividers between items handle separation
  },
  itemSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F4',
  },
});