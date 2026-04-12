import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoreActionsMenu } from './StoreActionsMenu';
import { tokens } from '../../theme/tokens';

type StoreDetailHeaderProps = {
  title: string;
  statusLabel: string;
  summary: string;
  menuOpen: boolean;
  loading?: boolean;
  canDeletePrices: boolean;
  onBack: () => void;
  onToggleMenu: () => void;
  onEditStore: () => void;
  onDeleteAllPrices: () => void;
  onDeleteStore: () => void;
};

export function StoreDetailHeader({
  title,
  statusLabel,
  summary,
  menuOpen,
  loading,
  canDeletePrices,
  onBack,
  onToggleMenu,
  onEditStore,
  onDeleteAllPrices,
  onDeleteStore,
}: StoreDetailHeaderProps) {
  const hasPrices = statusLabel === 'Con precios';

  return (
    <View style={[styles.card, menuOpen && styles.cardMenuOpen]}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={onBack} style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
          <Ionicons name="chevron-back" size={18} color="#344054" />
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Acciones de la tienda" onPress={onToggleMenu} style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}>
          <Ionicons name="ellipsis-vertical" size={18} color="#344054" />
        </Pressable>
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={styles.metaRow}>
        <View style={[styles.statusPill, hasPrices ? styles.statusPillSuccess : styles.statusPillMuted]}>
          <Text style={[styles.statusText, hasPrices ? styles.statusTextSuccess : styles.statusTextMuted]}>{statusLabel}</Text>
        </View>
        {summary ? <Text style={styles.summary}>{summary}</Text> : null}
      </View>

      <StoreActionsMenu
        visible={menuOpen}
        loading={loading}
        canDeletePrices={canDeletePrices}
        onEditStore={onEditStore}
        onDeleteAllPrices={onDeleteAllPrices}
        onDeleteStore={onDeleteStore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8E4',
    padding: 18,
    gap: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardMenuOpen: {
    zIndex: 20,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F9F8',
  },
  iconButtonPressed: {
    opacity: 0.92,
  },
  title: {
    color: tokens.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  metaRow: {
    gap: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillSuccess: {
    backgroundColor: '#E8F5EE',
  },
  statusPillMuted: {
    backgroundColor: '#EEF2F0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusTextSuccess: {
    color: '#146C43',
  },
  statusTextMuted: {
    color: '#5D6B63',
  },
  summary: {
    color: '#475467',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});