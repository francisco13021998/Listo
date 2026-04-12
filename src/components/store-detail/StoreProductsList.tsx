import { StyleSheet, Text, View } from 'react-native';
import { StoreProductRow } from './StoreProductRow';
import { StoreProductListItem } from './types';
import { tokens } from '../../theme/tokens';

type StoreProductsListProps = {
  items: StoreProductListItem[];
  loading?: boolean;
  error?: string | null;
  openMenuProductId: string | null;
  actionLoading?: boolean;
  onViewProduct: (productId: string) => void;
  onToggleMenu: (productId: string) => void;
  onEditPrice: (productId: string, priceId: string) => void;
  onDeletePrices: (productId: string, productName: string) => void;
};

export function StoreProductsList({
  items,
  loading,
  error,
  openMenuProductId,
  actionLoading,
  onViewProduct,
  onToggleMenu,
  onEditPrice,
  onDeletePrices,
}: StoreProductsListProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>Aquí ves el último precio guardado de cada producto.</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{items.length}</Text>
        </View>
      </View>

      {loading ? <Text style={styles.helperText}>Cargando productos…</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!loading && !error && items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Todavía no hay productos aquí</Text>
          <Text style={styles.emptyText}>Cuando guardes un precio en esta tienda, aparecerá en esta lista.</Text>
        </View>
      ) : null}

      {items.length > 0 ? (
        <View style={styles.listSurface}>
          {items.map((item, index) => (
            <StoreProductRow
              key={item.productId}
              item={item}
              showDivider={index > 0}
              menuOpen={openMenuProductId === item.productId}
              loading={actionLoading}
              onViewProduct={() => onViewProduct(item.productId)}
              onToggleMenu={() => onToggleMenu(item.productId)}
              onEditPrice={() => onEditPrice(item.productId, item.latestPriceId)}
              onDeletePrices={() => onDeletePrices(item.productId, item.productName)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 2,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF4ED',
  },
  countText: {
    color: '#176B3A',
    fontSize: 14,
    fontWeight: '800',
  },
  helperText: {
    color: '#667085',
    fontSize: 14,
  },
  errorText: {
    color: '#B42318',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 6,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
  },
  listSurface: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE6DE',
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
  },
});