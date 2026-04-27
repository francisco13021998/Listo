import { StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../EmptyState';
import { SecondaryButton } from '../SecondaryButton';
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
  const summary = `${entryCount} ${entryCount === 1 ? 'precio guardado' : 'precios guardados'} · ${storeCount} ${storeCount === 1 ? 'tienda' : 'tiendas'}`;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Historial de precios</Text>
            {!loading && !error && entries.length > 0 ? <Text style={styles.summary}>{summary}</Text> : null}
          </View>

          <SecondaryButton title="Añadir precio" onPress={onAddPrice} />
        </View>
      </View>

      <View style={styles.panel}>
        {loading ? <Text style={styles.statusText}>Cargando histórico…</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error && entries.length === 0 ? (
          <View style={styles.emptyStateWrap}>
            <EmptyState
              title="Sin precios todavía"
              subtitle="Usa el menú de arriba para añadir el primer precio y empezar a construir el historial."
            />
          </View>
        ) : null}

        {!loading && !error && entries.length > 0
          ? entries.map((entry, index) => (
              <View key={entry.id} style={index < entries.length - 1 ? styles.itemBorder : undefined}>
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
            ))
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    gap: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
  },
  summary: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
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
  },
  emptyStateWrap: {
    paddingVertical: 6,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F4',
  },
});